/**
 * Turns a cart into a Stripe Checkout session.
 *
 * It creates **no order row**. There is no payment state in `order_status` and
 * adding one is a ~15-call-site diff plus the `customers` view, so the pending
 * cart lives in the Stripe session's metadata instead. An abandoned checkout
 * therefore leaves nothing behind to clean up, and no unpaid cake can ever
 * appear in the baker's queue.
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { BadRequest, couponFor, json, priceCart, requireEnv, splitDiscount, dueDayKey } from '../lib/shared.mjs';

const SITE = 'https://numnumsbakery.com.au';

/** The kill switch for the morning somebody buys twenty Saturday cakes. */
async function capReached(db, dueAt, store) {
  const cap = Number(process.env.MAX_WEB_ORDERS_PER_DAY ?? '');
  if (!Number.isFinite(cap) || cap <= 0) return false;
  const day = dueDayKey(dueAt);
  const { count } = await db.from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('store', store)
    .not('stripe_session_id', 'is', null)
    .gte('due_at', `${day}T00:00:00+10:00`)
    .lte('due_at', `${day}T23:59:59+10:00`);
  return (count ?? 0) >= cap;
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  // Checked here too, not just in the webhook. Taking a payment this function
  // knows the webhook cannot turn into an order is the worst of both: the
  // customer is charged and nothing is baked. Better to refuse the checkout.
  try {
    requireEnv(['STRIPE_SECRET_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
                'ONLINE_ORDERS_USER_ID']);
  } catch (e) {
    console.error('create-checkout is misconfigured:', e.message);
    return json(500, { error: 'Online ordering is briefly unavailable. Please call us on 0425 697 725.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Malformed request.' }); }

  try {
    const email = String(body?.email ?? '').trim().toLowerCase();
    if (!email.includes('@')) throw new BadRequest('We need an email to send your receipt to.');
    const name = String(body?.name ?? '').trim().slice(0, 80);
    if (!name) throw new BadRequest('We need a name for the order.');
    // Required, not optional. The shop texts when a cake is ready, and a web
    // order with no number is one nobody can chase. Validated here because the
    // browser proves nothing — MOBILE_RE in the UI is a courtesy.
    const phone = String(body?.phone ?? '').replace(/[\s()-]/g, '').slice(0, 20);
    if (!/^(?:\+?61|0)4\d{8}$/.test(phone)) {
      throw new BadRequest('We need an Australian mobile so we can text you when it is ready.');
    }

    const cart = priceCart(body?.cart);

    if (await capReached(db, cart.dueAt, cart.store)) {
      throw new BadRequest('We are fully booked for that day. Please pick another date.');
    }

    // The problem is deliberately dropped: a mistyped code quotes no discount
    // and still sells the cake. The checkout box already told them why.
    const { coupon } = await couponFor(db, body?.coupon, email);
    const discountTotal = coupon?.percent
      ? Math.round((cart.subtotalCents * coupon.percent) / 100)
      : 0;
    const shares = splitDiscount(cart.lines.map((l) => l.cents), discountTotal);

    // One Stripe line item per cake, already net of its share of the coupon, so
    // the amount Stripe charges and the sum of the rows we later insert are the
    // same number by construction rather than by a second calculation.
    const line_items = cart.lines.map((l, i) => ({
      quantity: 1,
      price_data: {
        currency: 'aud',
        unit_amount: l.cents - shares[i],
        product_data: {
          name: `${l.size} ${l.flavour} cake`,
          description: l.wording ? `Writing: ${l.wording}` : undefined,
        },
      },
    }));

    // Metadata caps at 50 keys and 500 chars per value, hence MAX_LINES.
    const metadata = {
      store: cart.store,
      due_at: cart.dueAt,
      name,
      phone,
      coupon: coupon?.code ?? '',
      lines: String(cart.lines.length),
    };
    cart.lines.forEach((l, i) => {
      metadata[`l${i}`] = JSON.stringify({ s: l.size, f: l.flavour, w: l.wording, c: l.cents, d: shares[i] })
        .slice(0, 500);
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],   // Apple/Google Pay ride on this
      customer_email: email,
      line_items,
      metadata,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${SITE}/shop/thank-you?s={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/shop/cart`,
    });

    return json(200, { url: session.url });
  } catch (e) {
    if (e instanceof BadRequest) return json(400, { error: e.message });
    console.error('create-checkout failed', e);
    return json(500, { error: 'Could not start checkout. Please try again.' });
  }
};

// The route lives in netlify.toml, which this repo treats as the single source
// of truth for redirects — not in a `config.path` here as well.
