/**
 * What the success page polls while the webhook lands.
 *
 * Two answers. Once the webhook has written the order, the rows. Before that,
 * **Stripe's own word**: if the session is paid, the page can say so at once,
 * from the cart the session carries, with `pending: true` and no order number
 * yet. Waiting on the webhook alone left a customer who had paid staring at
 * "Confirming your payment…" for as long as the webhook was late — forever,
 * while production had no webhook at all.
 *
 * It still deliberately **creates nothing**. A customer who closes the tab after
 * paying is a non-event — the webhook has already done the work, or will on
 * Stripe's retry. Creating the order here too would mean two writers racing
 * for the same rows.
 *
 * Returns only what the page prints, never the whole row: a session id is
 * guessable enough that this must not become a way to read the order book.
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { json } from '../lib/shared.mjs';

/**
 * The session, with the charge, or null. Allowed to fail: a confirmation page
 * with no card line is fine, one that will not load because Stripe was slow
 * is not.
 */
async function stripeSession(s) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    return await stripe.checkout.sessions.retrieve(s, { expand: ['payment_intent.latest_charge'] });
  } catch {
    return null;
  }
}

/** "Visa •••• 4242", for the ticket. */
function paidWith(session) {
  const d = session?.payment_intent?.latest_charge?.payment_method_details;
  if (d?.card) return { brand: d.card.brand, last4: d.card.last4, wallet: d.card.wallet?.type ?? null };
  return d?.type ? { brand: d.type, last4: null, wallet: null } : null;
}

const firstName = (full) => String(full ?? '').trim().split(/\s+/)[0] || null;

/**
 * What a paid session says, before the webhook has turned it into rows. Read
 * from the same metadata the webhook reads — `p` is what was charged per cake,
 * `c − d` its price after the coupon — so the two answers cannot disagree.
 */
function fromSession(session) {
  const m = session.metadata ?? {};
  const lines = [];
  for (let i = 0; i < Number(m.lines ?? 0); i++) {
    try { lines.push(JSON.parse(m[`l${i}`])); } catch { /* a line we cannot read is left off */ }
  }
  return {
    paid: true,
    pending: true,
    order_nos: [],
    due_at: m.due_at,
    store: m.store,
    name: firstName(m.name || session.custom_fields?.find((f) => f.key === 'name')?.text?.value),
    cakes: lines.map((l) => ({ size: l.s, flavour: l.f, wording: l.w || null })),
    total: lines.reduce((a, l) => a + l.c - l.d, 0) / 100,
    deposit: lines.reduce((a, l) => a + (l.p ?? l.c - l.d), 0) / 100,
    card: paidWith(session),
  };
}

export default async (req) => {
  const s = new URL(req.url).searchParams.get('s') ?? '';
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(s)) return json(400, { error: 'bad session' });

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await db.from('orders')
    .select('order_no,due_at,store,price,discount,deposit,customer_name,size,flavour,wording')
    .eq('stripe_session_id', s)
    .order('cart_line');

  if (error) return json(500, { error: 'lookup failed' });
  if (!data?.length) {
    const session = await stripeSession(s);
    return json(200, session?.payment_status === 'paid' ? fromSession(session) : { paid: false });
  }

  // Cents, summed as integers: adding dollar floats is how $24.99 + $24.99
  // prints as $49.980000000000004 on a confirmation page.
  const cents = (v) => Math.round(Number(v ?? 0) * 100);
  return json(200, {
    paid: true,
    order_nos: data.map((r) => r.order_no),
    due_at: data[0].due_at,
    store: data[0].store,
    // First name only. The session id is long and random, but this page is
    // one forwarded link away from a stranger, so it says no more than the
    // counter would.
    name: firstName(data[0].customer_name),
    cakes: data.map((r) => ({ size: r.size, flavour: r.flavour, wording: r.wording || null })),
    total: data.reduce((a, r) => a + cents(r.price) - cents(r.discount), 0) / 100,
    deposit: data.reduce((a, r) => a + cents(r.deposit), 0) / 100,
    card: paidWith(await stripeSession(s)),
  });
};
