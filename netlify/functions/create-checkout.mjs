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
import { BadRequest, json, priceCart, splitDiscount, MAX_LINES, dueDayKey } from './_shared.mjs';

const SITE = 'https://numnumsbakery.com.au';

/**
 * Look a coupon up as the shop, not as the customer.
 *
 * Bound to the email it was issued to and checked again in the webhook. A code
 * that is unknown, redeemed, expired, or belongs to somebody else quotes no
 * discount — it does not fail the checkout, because a customer who mistypes a
 * code should still be able to buy a cake.
 */
async function discountFor(db, code, email) {
  if (!code || !email) return { cents: 0, code: null };
  const { data } = await db.from('coupons').select('code,email,percent,expires_at,redeemed_at')
    .eq('code', String(code).trim().toUpperCase()).maybeSingle();
  if (!data) return { cents: 0, code: null };
  if (data.redeemed_at) return { cents: 0, code: null };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { cents: 0, code: null };
  if (data.email.toLowerCase() !== String(email).toLowerCase()) return { cents: 0, code: null };
  return { percent: data.percent, code: data.code };
}

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
    const phone = String(body?.phone ?? '').replace(/[\s()-]/g, '').slice(0, 20);

    const cart = priceCart(body?.cart);

    if (await capReached(db, cart.dueAt, cart.store)) {
      throw new BadRequest('We are fully booked for that day. Please pick another date.');
    }

    const coupon = await discountFor(db, body?.coupon, email);
    const discountTotal = coupon.percent
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
      coupon: coupon.code ?? '',
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
      success_url: `${SITE}/shop/order?s={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/shop/cart`,
    });

    return json(200, { url: session.url });
  } catch (e) {
    if (e instanceof BadRequest) return json(400, { error: e.message });
    console.error('create-checkout failed', e);
    return json(500, { error: 'Could not start checkout. Please try again.' });
  }
};

export const config = { path: '/api/create-checkout' };
export { MAX_LINES };
