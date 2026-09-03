// Supabase access for the ops app. Every query lives here so index.html stays
// markup and rendering.
//
// The key below is the *publishable* key and is meant to be public. What
// actually guards the data is row-level security in Postgres plus signups
// being disabled — never assume hiding something in the UI is enough, because
// anyone holding this key can call the REST API directly.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.114.0/+esm';

const SUPABASE_URL = 'https://stnmoxsojqbbtgjwkzrc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5h1APV-FTtXzvF1kDL2uVg_BvE6FB9Y';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// The login dropdown needs names before anyone is authenticated, so it cannot
// come from `profiles` (which is behind RLS). Addresses are not secrets.
export const PEOPLE = [
  { name: 'Vaidik',         email: 'vaidik@ops.numnumsbakery.com.au' },
  { name: 'Tarun',          email: 'tarun@ops.numnumsbakery.com.au' },
  { name: 'Saahil',         email: 'saahil@ops.numnumsbakery.com.au' },
  { name: 'Janvi Job',      email: 'janvi@ops.numnumsbakery.com.au' },
  { name: 'Jashan Job',     email: 'jashan@ops.numnumsbakery.com.au' },
  { name: 'Kirandeep Kaur', email: 'kirandeep@ops.numnumsbakery.com.au' },
  { name: 'Parita Job',     email: 'parita@ops.numnumsbakery.com.au' },
];

export const STORES = [
  { code: 'harris-park', label: 'Harris Park', short: 'HP' },
  { code: 'riverstone',  label: 'Riverstone',  short: 'RV' },
];

export const storeLabel = (code) => STORES.find((s) => s.code === code)?.label ?? code;

export const STATUS_LABEL = {
  placed:    'Order placed',
  baked:     'Baked',
  arrived:   'At store',
  picked_up: 'Picked up',
  cancelled: 'Cancelled',
};

// ── Auth ────────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // Best-effort: a failed audit write must not lock anyone out mid-shift.
  await sb.from('auth_events').insert({ user_id: data.user.id, event: 'login' })
    .then(({ error: e }) => e && console.warn('login not recorded:', e.message));
  return data;
}

export async function signOut() {
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    await sb.from('auth_events').insert({ user_id: user.id, event: 'logout' })
      .then(({ error: e }) => e && console.warn('logout not recorded:', e.message));
  }
  await sb.auth.signOut();
}

export async function currentProfile() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data, error } = await sb.from('profiles')
    .select('id,name,role,stores').eq('id', session.user.id).single();
  if (error) throw error;
  return data;
}

export async function listProfiles() {
  const { data } = await sb.from('profiles').select('id,name,role,stores');
  return data || [];
}

// ── Orders ──────────────────────────────────────────────────────────────────

/**
 * Costs live in a separate admin-only table, so this returns [] rather than
 * failing for staff and the baker — `cost` simply stays null for them.
 */
async function attachCosts(orders) {
  if (!orders.length) return orders;
  const { data } = await sb.from('order_costs')
    .select('order_id,cost').in('order_id', orders.map((o) => o.id));
  const byId = new Map((data || []).map((c) => [c.order_id, c.cost]));
  for (const o of orders) {
    o.cost = byId.has(o.id) ? Number(byId.get(o.id)) : null;
  }
  return orders;
}

/**
 * `since` deliberately matches on EITHER date, and optionally keeps every
 * still-open order regardless of age.
 *
 * Filtering the window on `due_at` alone dropped two kinds of row that matter:
 * an order sold inside the window but due beyond it, and — worse — a cake that
 * has been owed money on since long before the window, which is exactly what
 * "still to collect" exists to surface. Neither was visible anywhere.
 */
export async function listOrders({ store, since, until, withCosts = false, includeOpen = false } = {}) {
  let q = sb.from('orders').select('*').order('due_at', { ascending: true });
  if (store) q = q.eq('store', store);
  if (since) {
    const clauses = [`due_at.gte.${since}`, `created_at.gte.${since}`];
    if (includeOpen) clauses.push('status.in.(placed,baked,arrived)');
    q = q.or(clauses.join(','));
  }
  if (until) q = q.lte('due_at', until);
  const { data, error } = await q;
  if (error) throw error;
  return withCosts ? attachCosts(data) : data;
}

/** Everything the baker still has to make. Walk-ins never appear: they are
 *  created already picked up, so they are excluded by the status filter. */
export async function listToBake() {
  const { data, error } = await sb.from('orders').select('*')
    .eq('status', 'placed').order('due_at', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Most recent order for a phone number, so a returning customer's details fill
 * themselves in. Matches on the generated phone_key, which ignores formatting.
 */
export async function findCustomerByPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length < 6) return null;
  const { data } = await sb.from('orders')
    .select('customer_name,customer_phone,created_at')
    .eq('phone_key', digits.slice(-9))
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function createOrder(fields) {
  const { data, error } = await sb.from('orders').insert(fields).select().single();
  if (error) throw error;
  return data;
}

export async function updateOrder(id, fields) {
  const { data, error } = await sb.from('orders').update(fields).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export const setStatus = (id, status) => updateOrder(id, { status });

export async function setCost(orderId, cost) {
  const { error } = await sb.from('order_costs')
    .upsert({ order_id: orderId, cost: cost === '' || cost == null ? null : Number(cost) });
  if (error) throw error;
}

export async function recentAuthEvents(limit = 30) {
  const { data } = await sb.from('auth_events')
    .select('event,at,user_id').order('at', { ascending: false }).limit(limit);
  return data || [];
}

// ── Photos ──────────────────────────────────────────────────────────────────

/**
 * Phone cameras produce 3–5MB files. Left alone they would fill the free 1GB
 * after roughly 250 cakes; downscaled they last for thousands, and the baker
 * only ever needs to see the design.
 */
export async function downscale(file, maxEdge = 1400, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('could not encode image'))),
      'image/jpeg',
      quality,
    );
  });
}

/** Uploads after the order row exists, keyed by its id — the storage read
 *  policy checks the order, so the row has to be there first. */
export async function uploadPhoto(order, file) {
  const blob = await downscale(file);
  const path = `${order.store}/${order.id}.jpg`;

  const { error } = await sb.storage.from('cake-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;

  await updateOrder(order.id, { photo_path: path });
  return path;
}

const signedCache = new Map();

export async function photoUrl(path) {
  if (!path) return null;
  const hit = signedCache.get(path);
  if (hit && hit.expires > Date.now()) return hit.url;

  const { data, error } = await sb.storage.from('cake-photos').createSignedUrl(path, 3600);
  if (error) return null;
  signedCache.set(path, { url: data.signedUrl, expires: Date.now() + 3000 * 1000 });
  return data.signedUrl;
}
