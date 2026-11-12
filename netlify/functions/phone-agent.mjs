/**
 * The phone assistant's three webhook tools (phone-agent/prompt.md), one v2
 * function: POST /.netlify/functions/phone-agent?tool=order_status|log_request|log_call
 *
 * Called by ElevenLabs, never by a browser, so it carries no CORS and no route
 * in netlify.toml (called at its function path, like receipt and calendar).
 * Every request must carry the shared secret (SECRET_HEADER); without
 * PHONE_AGENT_SECRET set, everything is refused.
 *
 * Notes land in `phone_notes` (admin-read only, RLS verified 2026-11-07) and
 * anything a person must act on is also emailed to the shop inbox and pushed to
 * admins' phones: Gmail is read every 2-3 days, so the push is what gets seen.
 *
 * Caller id and conversation id are filled by ElevenLabs from system
 * variables, not by the model, so the rate limit keys on a number the caller
 * cannot talk their way around.
 */
import { createClient } from '@supabase/supabase-js';
import { json } from '../lib/shared.mjs';
import { siteFor } from '../lib/email-shell.mjs';
import { notifyStaff } from '../lib/push.mjs';
import {
  authorised, clean, orderNo, phoneKey, localPhone, firstName, storeCode, spokenWhen,
  pickupProblem, noteEmail, noteMessage, STORE_LABEL,
  MAX_MISSES_PER_CALLER, MAX_LOOKUPS_PER_HOUR,
} from '../lib/phone.mjs';

const INBOX = 'info.numnumsbakery@gmail.com';
const HOUR = 3_600_000;

/** One answer for every miss: a wrong name, a wrong number and a rate-limited caller must be indistinguishable. */
const NOT_FOUND = { found: false, say: "I can't find that one. Offer a callback from the team." };

async function orderStatus(db, b) {
  const name = firstName(b.first_name);
  const no = orderNo(b.order_number);
  const key = no ? null : phoneKey(b.phone);
  if (!name || (!no && !key)) {
    return { found: false, say: 'Ask for the first name on the order and either the order number or the phone number used.' };
  }
  const caller = clean(b.caller_id, 40) || clean(b.conversation_id, 80) || 'unknown';

  const since = new Date(Date.now() - HOUR).toISOString();
  const count = (q) => q.then(({ count: c, error }) => { if (error) throw error; return c ?? 0; });
  const [misses, total] = await Promise.all([
    count(db.from('phone_lookups').select('id', { count: 'exact', head: true }).eq('caller', caller).eq('ok', false).gte('at', since)),
    count(db.from('phone_lookups').select('id', { count: 'exact', head: true }).gte('at', since)),
  ]);
  if (misses >= MAX_MISSES_PER_CALLER || total >= MAX_LOOKUPS_PER_HOUR) return NOT_FOUND;

  let q = db.from('orders').select('status, store, due_at, customer_name').order('due_at').limit(10);
  q = no ? q.eq('order_no', no) : q.eq('phone_key', key).gte('due_at', new Date(Date.now() - 48 * HOUR).toISOString());
  const { data, error } = await q;
  if (error) throw error;

  const mine = (data ?? []).filter((r) => firstName(r.customer_name) === name).slice(0, 3);
  const { error: logErr } = await db.from('phone_lookups').insert({ caller, ok: mine.length > 0 });
  if (logErr) throw logErr; // an unlogged lookup is an unlimited one
  if (!mine.length) return NOT_FOUND;

  // Status, shop, date and time. Nothing else, ever: no price, no payment,
  // no surname, no contact details.
  return {
    found: true,
    orders: mine.map((r) => ({ status: r.status, shop: STORE_LABEL[r.store], ...spokenWhen(r.due_at) })),
  };
}

/** Write the note, then tell a person. Notifying never fails the call: the row is the record. */
async function save(db, note, req) {
  const { data, error } = await db.from('phone_notes').insert(note).select('created_at').single();
  if (error) throw error;
  return { ...note, created_at: data.created_at, site: siteFor(req) };
}

async function notify(db, note) {
  const key = process.env.RESEND_API_KEY;
  const mail = key
    ? (async () => {
      const { subject, html, text } = noteEmail(note, note.site);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: "Num Num's phone assistant <orders@numnumsbakery.com.au>", to: [INBOX], subject, html, text }),
      });
      if (!res.ok) console.error('phone note email refused', res.status, await res.text());
    })().catch((e) => console.error('phone note email failed', e))
    : Promise.resolve(console.error('RESEND_API_KEY is not set: phone note not emailed'));
  const push = notifyStaff(db, note.store, noteMessage(note), { roles: ['admin'] })
    .catch((e) => console.error('phone note push failed', e));
  await Promise.all([mail, push]);
}

const base = (b) => ({
  conversation_id: clean(b.conversation_id, 80) || null,
  caller_id: clean(b.caller_id, 20) || null,
  caller_name: clean(b.first_name ?? b.caller_name, 60) || null,
  caller_phone: localPhone(b.mobile ?? b.phone) || localPhone(b.caller_id) || null,
  store: storeCode(b.shop),
  priority: b.priority === 'urgent' || b.urgency === 'urgent' ? 'urgent' : 'normal',
});

async function logRequest(db, b, req) {
  const note = { ...base(b), kind: b.type };
  if (b.type === 'custom_cake') {
    const problem = pickupProblem(note.store, b.pickup_date, b.pickup_time);
    if (problem) return { ok: false, logged: false, problem };
    note.details = {
      pickup_date: b.pickup_date,
      pickup_date_spoken: spokenWhen(`${b.pickup_date}T02:00:00Z`).pickup_date,
      pickup_time: clean(b.pickup_time, 5),
      occasion: clean(b.occasion, 120),
      size_or_servings: clean(b.size_or_servings, 80),
      flavour: clean(b.flavour, 80),
      wording: clean(b.wording, 120),
      design: clean(b.design, 600),
      allergies: clean(b.allergies, 300),
      has_photos: typeof b.has_photos === 'boolean' ? b.has_photos : null,
      // The prompt says `whatsapp=true`; the column says what it means.
      on_whatsapp: typeof (b.whatsapp ?? b.on_whatsapp) === 'boolean' ? (b.whatsapp ?? b.on_whatsapp) : null,
    };
    const d = note.details;
    note.summary = clean(`Custom cake: ${[d.occasion, d.size_or_servings, d.flavour].filter(Boolean).join(', ') || 'see details'}.`, 300);
  } else if (b.type === 'change') {
    note.order_no = orderNo(b.order_number);
    note.details = { what_to_change: clean(b.what_to_change, 600), is_cancellation: b.is_cancellation === true };
    note.summary = clean(`${note.details.is_cancellation ? 'Cancellation' : 'Change'} for ${note.order_no || 'an order'}: ${note.details.what_to_change}`, 300);
    // The prompt's 24-hour rule, checked against the real pickup time rather
    // than trusted to the model: a change inside a day is a cake already in
    // the kitchen's hands.
    if (note.details.is_cancellation) note.priority = 'urgent';
    if (note.order_no && note.priority !== 'urgent') {
      const { data } = await db.from('orders').select('due_at').eq('order_no', note.order_no).maybeSingle();
      if (data && new Date(data.due_at) - Date.now() < 24 * HOUR) note.priority = 'urgent';
    }
  } else {
    return { ok: false, logged: false, problem: 'type must be change or custom_cake' };
  }
  const saved = await save(db, note, req);
  await notify(db, saved);
  return { ok: true, logged: true, priority: note.priority };
}

async function logCall(db, b, req) {
  const outcome = ['resolved', 'callback_needed', 'transferred'].includes(b.outcome) ? b.outcome : 'callback_needed';
  const note = {
    ...base(b),
    kind: 'call',
    outcome,
    summary: clean(b.summary, 500) || null,
    details: { call_type: clean(b.call_type, 40) },
  };
  // A call that already produced a change or a brief has told staff once; the
  // closing note is still kept, but does not buzz the phone a second time.
  let told = false;
  if (note.conversation_id) {
    const { count } = await db.from('phone_notes').select('id', { count: 'exact', head: true })
      .eq('conversation_id', note.conversation_id).in('kind', ['change', 'custom_cake']);
    told = (count ?? 0) > 0;
  }
  const saved = await save(db, note, req);
  if (outcome !== 'resolved' && !told) await notify(db, saved);
  return { ok: true, logged: true };
}

const TOOLS = { order_status: orderStatus, log_request: logRequest, log_call: logCall };

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });
  if (!authorised(req)) return json(401, { error: 'unauthorised' });
  const tool = TOOLS[new URL(req.url).searchParams.get('tool')];
  if (!tool) return json(404, { error: 'unknown tool' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Malformed request.' }); }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  try {
    return json(200, await tool(db, body ?? {}, req));
  } catch (e) {
    console.error('phone-agent failed', e);
    // Read by the model, so it says what to do next rather than what broke.
    return json(500, { ok: false, say: "The system didn't respond. Tell the caller you couldn't check just now and the team will call them back, then log the call as callback_needed." });
  }
};
