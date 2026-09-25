/**
 * What the success page polls while the webhook lands.
 *
 * It deliberately **creates nothing**. A customer who closes the tab after
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
 * "Visa •••• 4242", for the ticket. Asked of Stripe only once the order exists,
 * never on the polls before it, and allowed to fail: a confirmation page with
 * no card line is fine, one that will not load because Stripe was slow is not.
 */
async function paidWith(s) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(s, { expand: ['payment_intent.latest_charge'] });
    const d = session.payment_intent?.latest_charge?.payment_method_details;
    if (d?.card) return { brand: d.card.brand, last4: d.card.last4, wallet: d.card.wallet?.type ?? null };
    return d?.type ? { brand: d.type, last4: null, wallet: null } : null;
  } catch {
    return null;
  }
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
  if (!data?.length) return json(200, { paid: false });

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
    name: String(data[0].customer_name ?? '').trim().split(/\s+/)[0] || null,
    cakes: data.map((r) => ({ size: r.size, flavour: r.flavour, wording: r.wording || null })),
    total: data.reduce((a, r) => a + cents(r.price) - cents(r.discount), 0) / 100,
    deposit: data.reduce((a, r) => a + cents(r.deposit), 0) / 100,
    card: await paidWith(s),
  });
};
