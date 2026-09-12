// Supabase access for the ops app. Every query lives here so index.html stays
// markup and rendering.
//
// The key below is the *publishable* key and is meant to be public. What
// actually guards the data is row-level security in Postgres — never assume
// hiding something in the UI is enough, because anyone holding this key can
// call the REST API directly.
//
// RLS is the ONLY guard. This comment used to say "plus signups being
// disabled"; that was checked on 2026-09-12 and was false — the signup
// endpoint accepts new accounts, and this key sits in a public GitHub repo.
// So `authenticated` does not mean `staff`. Any policy written `to
// authenticated` without a `my_role() is not null` test is open to anyone with
// an email address. Two were, and were fixed that day
// (ops/supabase/2026-09-12-restrict-writes-to-staff.sql). Check any new one
// the same way, and test it as a second user rather than as yourself.

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
  { name: 'Janvi',          email: 'janvi@ops.numnumsbakery.com.au' },
  { name: 'Jashan',         email: 'jashan@ops.numnumsbakery.com.au' },
  { name: 'Kirandeep Kaur', email: 'kirandeep@ops.numnumsbakery.com.au' },
  { name: 'Parita',         email: 'parita@ops.numnumsbakery.com.au' },
];

// Only the address differs between the shops. Both trade as the one company,
// so the legal identity on a tax invoice belongs to the BUSINESS below, not to
// the store — an earlier version put a second entity on Harris Park, guessed
// from a name match on the ABN register, and it was wrong. Never infer these.
export const STORES = [
  { code: 'harris-park', label: 'Harris Park', short: 'HP',
    address: 'Shop 1, 96–98 Wigram Street, Harris Park NSW 2150' },
  { code: 'riverstone',  label: 'Riverstone',  short: 'RV',
    address: 'Shop 8, Riverstone Shopping Centre, Riverstone NSW 2765' },
];

/**
 * The seller, as it must appear on a tax invoice.
 *
 * `entity` and `abn` are the two fields a customer's accountant will check, and
 * a wrong ABN makes the document useless for their GST claim. They are the same
 * for both shops. Confirm against the register before changing either:
 *   https://abr.business.gov.au/ABN/View?abn=39634402412
 *
 * `gstRegistered: false` would drop the heading to "Invoice" and remove every
 * GST line — the document must not claim to be a tax invoice if it is not one.
 */
export const BUSINESS = {
  name: "Num Num's Bakery",
  tagline: '100% eggless cakes & Indian sweets',
  entity: 'GNT Ventures Pty Ltd',
  abn: '39 634 402 412',
  gstRegistered: true,                     // registered for GST since 26 Jan 2020
  phone: '+61 425 697 725',
  email: 'info.numnumsbakery@gmail.com',
  site: 'numnumsbakery.com.au',
};

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

/**
 * Is this failure a lapsed sign-in rather than a dead connection?
 *
 * They look identical to a caller — both are just a rejected promise — but they
 * need opposite advice. "The shop internet may be down" sends staff to reboot a
 * router that is working fine, and the Try-again button reruns the same dead
 * token forever. PostgREST answers 401 with PGRST301 for an expired JWT;
 * gotrue's own refresh failure comes back 400 with a message instead.
 */
export const isAuthError = (err) => {
  const status = Number(err?.status ?? err?.originalError?.status ?? 0);
  const code = String(err?.code || '');
  const msg = String(err?.message || '');
  return status === 401 || status === 403
    || code === 'PGRST301' || code === 'PGRST302'
    || /jwt|refresh[_ ]token|invalid token|not authenticated|session (from session id )?not found/i.test(msg);
};

/**
 * Force a token refresh. A laptop that slept through the expiry wakes with a
 * stale access token and no scheduled refresh left to run; one of these puts it
 * right without making anyone type a password.
 */
export async function refreshSession() {
  try {
    const { data, error } = await sb.auth.refreshSession();
    return Boolean(data?.session) && !error;
  } catch { return false; }
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

/**
 * Bumped by every write in this file.
 *
 * Anything caching a read can watch this and know its copy is stale without
 * having to guess a TTL short enough to catch its own edits. It lives here,
 * not in the views, because every writer already routes through this module —
 * a cache that has to be invalidated by each caller gets missed by the next one.
 */
export const writeStamp = { v: 0 };
const wrote = () => { writeStamp.v += 1; };

/**
 * PostgREST stops at 1000 rows and says so in Content-Range, but a client that
 * ignores the header just gets a short array and no error. That is how a list
 * quietly starts losing rows: nothing throws, the page renders, and the orders
 * past the thousandth are simply not there.
 *
 * Every unbounded read in this file goes through here, so if one ever reaches
 * the ceiling it is loud instead of silent.
 */
export const PAGE_CAP = 1000;

/**
 * Read every row, a page at a time.
 *
 * For results that must be complete — the bookkeeper's export, the figures on
 * the analytics pages. `build` has to return a fresh query each call, because a
 * PostgREST builder cannot be reused once awaited.
 */
async function pageAll(build, what, ceiling = 20000) {
  const out = [];
  for (let from = 0; from < ceiling; from += PAGE_CAP) {
    const { data, error } = await build().range(from, from + PAGE_CAP - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < PAGE_CAP) return out;
  }
  console.warn(`${what}: stopped at ${ceiling} rows`);
  return out;
}

function capped(rows, what) {
  if (rows.length >= PAGE_CAP) {
    console.warn(`${what}: hit the ${PAGE_CAP}-row limit — this result is incomplete. Narrow the query.`);
  }
  return rows;
}

// ── Orders ──────────────────────────────────────────────────────────────────

/**
 * Costs live in a separate admin-only table, so this returns [] rather than
 * failing for staff and the baker — `cost` simply stays null for them.
 */
async function attachCosts(orders) {
  if (!orders.length) return orders;

  // Every id goes in the query string, so a thousand of them is a ~37KB URL —
  // long enough that the request fails and every cost comes back missing,
  // which reads on the page as "no costs recorded" rather than as an error.
  const ids = orders.map((o) => o.id);
  const rows = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await sb.from('order_costs')
      .select('order_id,cost').in('order_id', ids.slice(i, i + 200));
    if (error) throw error;
    rows.push(...(data || []));
  }

  const byId = new Map(rows.map((c) => [c.order_id, c.cost]));
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
export async function listOrders({ store, since, until, withCosts = false, includeOpen = false, complete = false } = {}) {
  const build = () => {
    let q = sb.from('orders').select('*').order('due_at', { ascending: true });
    if (store) q = q.eq('store', store);
    if (since) {
      const clauses = [`due_at.gte.${since}`, `created_at.gte.${since}`];
      if (includeOpen) clauses.push('status.in.(placed,baked,arrived)');
      q = q.or(clauses.join(','));
    }
    if (until) q = q.lte('due_at', until);
    return q;
  };

  let data;
  if (complete) {
    data = await pageAll(build, 'listOrders');
  } else {
    const res = await build();
    if (res.error) throw res.error;
    data = capped(res.data, 'listOrders');
  }
  return withCosts ? attachCosts(data) : data;
}

/** Orders picked up between two instants — the date-range lookup, done server
 *  side so it reaches the whole book rather than whatever happens to be loaded. */
export async function ordersDueBetween({ store, fromISO, toISO, withCosts = false }) {
  let q = sb.from('orders').select('*')
    .gte('due_at', fromISO).lte('due_at', toISO)
    .order('due_at', { ascending: true });
  if (store) q = q.eq('store', store);
  const { data, error } = await q;
  if (error) throw error;
  capped(data, 'ordersDueBetween');
  return withCosts ? attachCosts(data) : data;
}

/**
 * Search the whole order book, not just the rows on screen.
 *
 * Matches the same fields as searchOrders() in stats.mjs — customer, docket
 * number, flavour, size, wording, and a normalised phone — so moving the work
 * to the server does not change what counts as a hit.
 */
export async function searchOrdersRemote({ term, store, withCosts = false, limit = 200 }) {
  const raw = String(term ?? '').trim();
  if (raw.length < 2) return [];
  // , ( ) * % are PostgREST filter syntax and would corrupt the or() list.
  const clean = raw.replace(/[,()*%\\]/g, ' ').trim();
  const digits = raw.replace(/\D/g, '');

  const clauses = ['customer_name', 'order_no', 'flavour', 'size', 'wording']
    .map((col) => `${col}.ilike.%${clean}%`);
  if (digits.length >= 4) {
    clauses.push(`phone_key.like.%${digits.length >= 9 ? digits.slice(-9) : digits}%`);
  }

  let q = sb.from('orders').select('*').or(clauses.join(','))
    .order('due_at', { ascending: false }).limit(limit);
  if (store) q = q.eq('store', store);
  const { data, error } = await q;
  if (error) throw error;
  return withCosts ? attachCosts(data) : (data || []);
}

/** Everything the baker still has to make. Walk-ins never appear: they are
 *  created already picked up, so they are excluded by the status filter. */
/**
 * The baking queue: everything still to make, plus anything baked in the last
 * day so a mistap can be taken back.
 *
 * Without the second half, marking a cake baked was a one-way door — the cake
 * left the queue on the tap, and the baker has no order log to go and find it
 * in. A day is long enough to cover a night shift and short enough that the
 * list is still the work rather than a history.
 */
export async function listToBake() {
  const since = new Date(Date.now() - 86400000).toISOString();
  const { data, error } = await sb.from('orders').select('*')
    .or(`status.eq.placed,and(status.eq.baked,baked_at.gte.${since})`)
    .order('due_at', { ascending: true });
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

/**
 * Customers whose name matches, most frequent first, for the name typeahead.
 *
 * Reads the `customers` view, which is security_invoker — so a staff member
 * only ever sees people who ordered at their own store.
 */
export async function searchCustomers(term, limit = 6) {
  // PostgREST treats , ( ) * % as filter syntax, so a name typed with any of
  // them would corrupt the query rather than just failing to match.
  const q = String(term ?? '').trim().replace(/[,()*%\\]/g, ' ').trim();
  if (q.length < 2) return [];
  const { data, error } = await sb.from('customers')
    .select('name,phone,order_count,spend,discount_given,last_order')
    .ilike('name', `%${q}%`)
    .order('order_count', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}

/** One customer's history, by phone. Used to show "3rd order" on a docket. */
export async function getCustomer(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length < 6) return null;
  const { data } = await sb.from('customers')
    .select('name,phone,order_count,spend,discount_given,first_order')
    .eq('phone_key', digits.slice(-9))
    .limit(1);
  return data?.[0] ?? null;
}

export async function createOrder(fields) {
  const { data, error } = await sb.from('orders').insert(fields).select().single();
  if (error) throw error;
  wrote();
  return data;
}

export async function updateOrder(id, fields) {
  const { data, error } = await sb.from('orders').update(fields).eq('id', id).select().single();
  if (error) throw error;
  wrote();
  return data;
}

export const setStatus = (id, status) => updateOrder(id, { status });

export async function setCost(orderId, cost) {
  const { error } = await sb.from('order_costs')
    .upsert({ order_id: orderId, cost: cost === '' || cost == null ? null : Number(cost) });
  if (error) throw error;
  wrote();
}

/**
 * Everything that has ever happened to one order — who changed a price, when a
 * cake was cancelled, what a name was before it was corrected. Written by a
 * trigger, not by this app, so it cannot be forgotten at a call site. Admin
 * only, by RLS.
 */
export async function orderEvents(orderId) {
  const { data, error } = await sb.from('order_events')
    .select('at,actor,kind,detail')
    .eq('order_id', orderId)
    .order('at', { ascending: true });
  if (error) throw error;
  return data || [];
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
 *  policy checks the order, so the row has to be there first.
 *
 *  A customer often sends several reference pictures, so this takes a list.
 *  `photo_paths` holds all of them and `photo_path` stays the cover: every
 *  thumbnail, the print board and the retention rule read that one column, and
 *  none of them need to know there are others behind it. The first file keeps
 *  the old `<id>.jpg` key so photos taken before this change still resolve. */
export async function uploadPhotos(order, files, { append = false } = {}) {
  const list = [...files].filter(Boolean);
  if (!list.length) return [];

  const kept = append ? orderPhotos(order) : [];
  const paths = [];
  for (const [n, file] of list.entries()) {
    const i = kept.length + n;
    const blob = await downscale(file);
    const path = `${order.store}/${order.id}${i ? `-${i + 1}` : ''}.jpg`;
    const { error } = await sb.storage.from('cake-photos')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    paths.push(path);
  }

  const all = kept.concat(paths);
  await updateOrder(order.id, { photo_path: all[0], photo_paths: all });
  return all;
}

/**
 * A design photo, ready to embed in an invoice.
 *
 * Re-encoded rather than embedded as stored, for two reasons. The stored file
 * is up to 1400px and a few hundred KB, and three of those make an invoice
 * nobody wants to receive; and going through an RGB canvas guarantees a
 * three-channel JPEG, which is what lets the PDF declare /DeviceRGB — a
 * greyscale original embedded raw would come out inverted or worse.
 *
 * Returns null rather than throwing on anything: a photo that has been purged,
 * or shop wifi dropping mid-download, must not cost the customer their invoice.
 */
export function photoForPdf(path, maxEdge = 720, quality = 0.72) {
  // Raced, because every step below can hang rather than fail: a signed URL
  // fetched over a connection that is dropping, and Safari's canvas, which
  // under memory pressure never calls the toBlob callback at all. A photo that
  // has not arrived in ten seconds must not cost the customer their invoice —
  // an invoice that never downloads is a worse bug than one without pictures.
  return Promise.race([
    shrinkForPdf(path, maxEdge, quality),
    new Promise((ok) => { setTimeout(() => ok(null), 10000); }),
  ]);
}

async function shrinkForPdf(path, maxEdge, quality) {
  try {
    const url = await photoUrl(path);
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;

    const bitmap = await createImageBitmap(await res.blob());
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    // Flattened onto white: a transparent PNG would otherwise embed as black.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', quality));
    if (!blob) return null;
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
  } catch { return null; }
}

/** Every design photo on an order, oldest schema included. */
export const orderPhotos = (o) =>
  (o?.photo_paths?.length ? o.photo_paths : [o?.photo_path]).filter(Boolean);

const signedCache = new Map();
const SIGNED_FOR = 3600;
// Re-sign a little before the URL actually dies, so a long-open list does not
// start showing broken thumbnails.
const holdFor = 3000 * 1000;

const cachedUrl = (path) => {
  const hit = signedCache.get(path);
  return hit && hit.expires > Date.now() ? hit.url : null;
};

/**
 * Sign a whole list of photos in one request.
 *
 * A thumbnail per docket meant a round trip per docket: eighteen cakes on the
 * board cost eighteen calls before a single picture appeared, which on shop
 * wifi is the whole reason the list looks empty for a moment. Storage will
 * sign them all at once.
 */
export async function photoUrls(paths) {
  const want = [...new Set(paths.filter(Boolean))];
  const out = new Map();
  const missing = [];

  for (const path of want) {
    const url = cachedUrl(path);
    if (url) out.set(path, url); else missing.push(path);
  }
  if (!missing.length) return out;

  const { data, error } = await sb.storage.from('cake-photos').createSignedUrls(missing, SIGNED_FOR);
  if (error) return out;

  for (const row of data || []) {
    // Storage answers per path: one missing file does not fail the batch.
    if (row.error || !row.signedUrl) continue;
    const path = row.path ?? missing[data.indexOf(row)];
    signedCache.set(path, { url: row.signedUrl, expires: Date.now() + holdFor });
    out.set(path, row.signedUrl);
  }
  return out;
}

export async function photoUrl(path) {
  if (!path) return null;
  const hit = cachedUrl(path);
  if (hit) return hit;

  const { data, error } = await sb.storage.from('cake-photos').createSignedUrl(path, SIGNED_FOR);
  if (error) return null;
  signedCache.set(path, { url: data.signedUrl, expires: Date.now() + holdFor });
  return data.signedUrl;
}

/**
 * The invoice, as a URL the device will actually download.
 *
 * A browser will not save a file the page built for itself on iOS: the click on
 * a blob is a silent no-op in Safari and Chrome both, which is a button that
 * does nothing. An https URL answering with `Content-Disposition: attachment`
 * downloads on every device there is, so the PDF is uploaded and the signed URL
 * does the saving. One object per order, overwritten, so re-issuing an invoice
 * does not litter the bucket.
 *
 * The bucket is private and admin-only — the file has the customer's name and
 * phone on it — and the link it hands back dies in ten minutes.
 */
export async function invoiceUrl(order, blob, filename) {
  const path = `${order.store}/${order.order_no}.pdf`;
  const up = await sb.storage.from('invoices')
    .upload(path, blob, { contentType: 'application/pdf', upsert: true });
  if (up.error) throw up.error;

  const { data, error } = await sb.storage.from('invoices')
    .createSignedUrl(path, 600, { download: filename });
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Takes a design photo off an order — the file first, then the row.
 *
 * That order matters: the purge job finds files through the row, so a row that
 * has already forgotten a photo leaves it in storage forever. Done this way
 * round, a failure half way leaves a listed photo that no longer loads, which
 * is visible and can simply be removed again.
 */
export async function removePhoto(order, path) {
  const left = orderPhotos(order).filter((p) => p !== path);
  const { error } = await sb.storage.from('cake-photos').remove([path]);
  if (error) throw error;
  return updateOrder(order.id, { photo_path: left[0] || null, photo_paths: left });
}

/**
 * Deletes an order outright. Admin only — `orders_admin_delete` in Postgres is
 * what actually enforces that, not the button.
 *
 * For an order that should never have existed: a double entry, a test, a
 * customer who changed their mind before anything was made. Cancelling those
 * instead leaves them in the cancellation rate, which is a number the shop
 * reads as "customers backing out" and acts on.
 *
 * The photos go first, for the same reason as `removePhoto`: storage is only
 * reachable *through* the row, so deleting the row first strands every file.
 * The costs, print jobs and the order's whole event trail cascade away with it;
 * a `before delete` trigger keeps the row itself in `deleted_orders`.
 */
export async function deleteOrder(order) {
  const paths = orderPhotos(order);
  if (paths.length) await sb.storage.from('cake-photos').remove(paths);

  const { error } = await sb.from('orders').delete().eq('id', order.id);
  if (error) throw error;
  wrote();
}

/**
 * The orders that were deleted outright, newest first — who, when, and what was
 * on them. Admin only, by RLS.
 *
 * Nothing else in the app reads this table: it is deliberately not part of any
 * figure. It exists so "where did HP-1727 go" has an answer.
 */
export async function deletedOrders(limit = 40) {
  const { data, error } = await sb.from('deleted_orders')
    .select('id, order_no, store, deleted_at, deleted_by, row')
    .order('deleted_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ── Print jobs ──────────────────────────────────────────────────────────────
// A cake that also needs 3D toppers or photo prints. The job hangs off the
// order instead of repeating its details, so nobody re-types a design brief
// into a second place and nobody has to relay it over WhatsApp.

export const PRINT_KIND_LABEL = { '3d': '3D prints', photo: 'Photo prints' };

/** Every print job with its order embedded. The table stays small — a handful
 *  a week — so one fetch beats a per-order lookup on every card. */
export async function listPrintJobs() {
  const data = await pageAll(() => sb.from('print_jobs')
    .select('*, order:orders(*)')
    .order('created_at', { ascending: false }), 'listPrintJobs');
  return data.filter((j) => j.order);
}

/**
 * Just enough to badge an order card. The board's own fetch embeds the whole
 * order behind every job; for a flag that reads "3D to print" that is the
 * entire orders table pulled twice on every trip to the log.
 */
export async function listPrintFlags() {
  return pageAll(() => sb.from('print_jobs').select('order_id,kind,status'), 'listPrintFlags');
}

/** Orders still in play, for the "which cake is this for" picker. */
export async function listOpenOrders() {
  const { data, error } = await sb.from('orders').select('*')
    .in('status', ['placed', 'baked', 'arrived'])
    .order('due_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createPrintJob(fields) {
  const { data, error } = await sb.from('print_jobs').insert(fields).select().single();
  if (error) throw error;
  wrote();
  return data;
}

export async function updatePrintJob(id, fields) {
  const { data, error } = await sb.from('print_jobs').update(fields).eq('id', id).select().single();
  if (error) throw error;
  wrote();
  return data;
}

export const setPrintStatus = (id, status) => updatePrintJob(id, { status });

export async function deletePrintJob(id) {
  const { error } = await sb.from('print_jobs').delete().eq('id', id);
  if (error) throw error;
  wrote();
}

// ── Customer directory ──────────────────────────────────────────────────────
// Reads the `customers` view, which is security_invoker: a staff member only
// ever sees people who ordered at their own store, without that rule being
// restated here.

const SORTS = {
  orders: { col: 'order_count', asc: false },
  spend:  { col: 'spend',       asc: false },
  recent: { col: 'last_order',  asc: false },
  name:   { col: 'name',        asc: true  },
};

/** One page of the directory. `term` matches a name, or a phone if it is digits. */
export async function listCustomers({ term = '', sort = 'recent', limit = 60 } = {}) {
  const s = SORTS[sort] || SORTS.recent;
  let q = sb.from('customers')
    .select('phone_key,name,phone,order_count,spend,discount_given,first_order,last_order')
    .order(s.col, { ascending: s.asc })
    .limit(limit);

  const raw = String(term ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 3 && digits.length >= raw.replace(/[\s+()-]/g, '').length) {
    // Typed as a number. Stored keys are the last 9 digits, so a longer query
    // (+61…) has to be cut down to match at all.
    q = q.like('phone_key', `%${digits.length >= 9 ? digits.slice(-9) : digits}%`);
  } else if (raw.length >= 2) {
    // PostgREST reads , ( ) * % as filter syntax.
    q = q.ilike('name', `%${raw.replace(/[,()*%\\]/g, ' ').trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

/** Everything one customer has ordered, newest first. */
export async function ordersForCustomer(phoneKey) {
  const { data, error } = await sb.from('orders').select('*')
    .eq('phone_key', phoneKey)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Sign-in trail. Admin only — the policy returns [] for everyone else. */
export async function authTrail(limit = 200) {
  const { data } = await sb.from('auth_events')
    .select('event,at,user_id').order('at', { ascending: false }).limit(limit);
  return data || [];
}

/** Every order in a window, for the bookkeeper export. */
export async function ordersBetween(fromISO, toISO) {
  // Paged, not capped: a financial year runs well past a thousand cakes, and a
  // bookkeeper cannot see that a third of the rows never arrived.
  const rows = await pageAll(() => sb.from('orders').select('*')
    .gte('created_at', fromISO).lte('created_at', toISO)
    .order('created_at', { ascending: true }), 'ordersBetween');
  if (!rows.length) return rows;
  return attachCosts(rows);
}

/** Every customer on record, for the leaderboards. The view aggregates over all
 *  orders, not the analytics window, which is the whole point for "gone quiet". */
export async function allCustomers(max = 4000) {
  // Asking for 2000 from a server that returns 1000 is how the leaderboard
  // would have started missing customers without anyone noticing. Page instead.
  const out = [];
  for (let from = 0; from < max; from += PAGE_CAP) {
    const { data, error } = await sb.from('customers')
      .select('phone_key,name,phone,order_count,spend,discount_given,first_order,last_order')
      .order('spend', { ascending: false })
      .range(from, from + PAGE_CAP - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < PAGE_CAP) break;
  }
  return out;
}

/**
 * Every order still holding a photo.
 *
 * Its own query rather than a slice of the analytics fetch: that window is 63
 * days, and a photo the purge failed to delete six months ago is exactly the
 * one that would not appear in it. In a healthy shop this returns a handful.
 */
export async function ordersWithPhotos() {
  const { data, error } = await sb.from('orders')
    .select('id,order_no,customer_name,created_at,due_at,status,photo_path,photo_paths')
    .not('photo_path', 'is', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return capped(data || [], 'ordersWithPhotos');
}
