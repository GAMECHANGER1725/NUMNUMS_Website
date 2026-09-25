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
import { flavourSlug } from '../../ops/catalog.mjs';
import { BadRequest, couponFor, json, priceCart, requireEnv, splitCents, depositCents, DEPOSIT_RATE, dueDayKey } from '../lib/shared.mjs';

const SITE = 'https://numnumsbakery.com.au';

/**
 * Stripe's page in our colours. Per-session branding needs API version
 * 2025-09-30.clover or later, so only this one call opts into it — the SDK's
 * pinned version stays for everything else. Font is not settable per session;
 * it lives in the Stripe Dashboard (Settings → Branding).
 */
const BRANDED = { apiVersion: '2025-09-30.clover' };
const branding = {
  // Icon + name, never `logo`: a logo replaces the name, and our square logo
  // renders as a 28px speck with nothing beside it saying whose page it is.
  display_name: "Num Num's Bakery",
  // A 256px cut of Logo_TParent.png: the original is 1.6MB, on a payment page.
  icon: { type: 'url', url: `${SITE}/brand_assets/checkout-icon.png` },
  background_color: '#FFF8F2', // Vanilla Cream
  button_color: '#C85478',     // Rose Petal
  border_style: 'pill',        // the site's buttons are pills
};

const STORE_NAME = { 'harris-park': 'Harris Park', riverstone: 'Riverstone' };

/** "Saturday 27 September, 12:00 pm" in Sydney, whatever zone the function runs in. */
const whenText = (iso) => new Date(iso).toLocaleString('en-AU', {
  timeZone: 'Australia/Sydney', weekday: 'long', day: 'numeric', month: 'long',
  hour: 'numeric', minute: '2-digit',
});

/** Cents to "$24.99", for the wording on Stripe's own page. */
const aud = (c) => `$${(c / 100).toFixed(2)}`;

/**
 * Which rails the hosted checkout offers.
 *
 * `card` always, because it is what Apple Pay, Google Pay and Link ride on —
 * those three are toggles in the Stripe dashboard at the same 1.7% + 30c, not
 * separate integrations and not a subscription.
 *
 * PayTo is added only when `STRIPE_ENABLE_PAYTO` is set, because naming a
 * payment method the account has not been approved for makes Stripe reject
 * the whole session — which would take the checkout down rather than quietly
 * hiding one button. PayPal is deliberately absent: Stripe does not offer it
 * to Australian merchants at all (EU, UK, CH, NO, LI only), so it is its own
 * integration, not a line in this array.
 */
const payMethods = () => {
  const m = ['card'];
  if (String(process.env.STRIPE_ENABLE_PAYTO ?? '').trim()) m.push('payto');
  return m;
};

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
    // Name, email and mobile are collected on Stripe's own page, not ours.
    // An email arrives here only when it is already known — a signed-in
    // customer, or a guest who typed it to apply a coupon — and it then LOCKS
    // Stripe's email field, because a coupon is bound to one address and a
    // customer who changed it on Stripe's page would carry the discount off.
    const email = String(body?.email ?? '').trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(email)) {
      throw new BadRequest('That email address does not look right.');
    }

    const cart = priceCart(body?.cart);

    if (await capReached(db, cart.dueAt, cart.store)) {
      throw new BadRequest('We are fully booked for that day. Please pick another date.');
    }

    // The problem is deliberately dropped: a mistyped code quotes no discount
    // and still sells the cake. The cart's coupon box already told them why.
    // No email means no coupon — couponFor refuses without one. The mobile is
    // not known yet, so the one-per-person rule matches on email alone here.
    // ponytail: phone half of personStatus skipped pre-payment; re-check it in
    // the webhook if people start reusing codes across emails.
    const { coupon } = await couponFor(db, body?.coupon, email);
    const discountTotal = coupon?.percent
      ? Math.round((cart.subtotalCents * coupon.percent) / 100)
      : 0;
    const shares = splitCents(cart.lines.map((l) => l.cents), discountTotal);

    // What each cake actually costs, after its share of the coupon.
    const netPerLine = cart.lines.map((l, i) => l.cents - shares[i]);
    const netTotal = netPerLine.reduce((a, b) => a + b, 0);

    // Half today, half at the counter. The deposit is worked on the CART total
    // and then split back over the lines, never halved line by line: halving
    // each of three odd-cent lines loses cents, and the sum has to equal the
    // charge exactly or the books never reconcile again.
    const depositTotal = depositCents(netTotal);
    const deposits = splitCents(netPerLine, depositTotal);

    // One Stripe line item per cake, showing the deposit as the amount and the
    // full price in the description — a customer looking at Stripe's page must
    // be able to see what the cake costs and what they are paying now, or the
    // balance at pickup arrives as a surprise.
    const collect = `Collect from ${STORE_NAME[cart.store] ?? cart.store}, ${whenText(cart.dueAt)}`;
    const line_items = cart.lines.map((l, i) => ({
      quantity: 1,
      price_data: {
        currency: 'aud',
        unit_amount: deposits[i],
        product_data: {
          name: `${l.size} ${l.flavour} cake — 50% deposit`,
          // Collection first: a phone shows two lines of this before "more".
          description: [
            collect,
            l.wording ? `Writing: “${l.wording}”` : null,
            `Full price ${aud(netPerLine[i])}, balance ${aud(netPerLine[i] - deposits[i])} on collection`,
            '100% eggless',
          ].filter(Boolean).join(' · '),
          // The same product shot the shop shows, so the customer sees the
          // cake they chose, not a grey box, on the page they pay on.
          images: [`${SITE}/shop/cakes/${flavourSlug(l.flavour)}.webp`],
        },
      },
    }));

    // Metadata caps at 50 keys and 500 chars per value, hence MAX_LINES.
    const metadata = {
      store: cart.store,
      due_at: cart.dueAt,
      coupon: coupon?.code ?? '',
      lines: String(cart.lines.length),
    };
    cart.lines.forEach((l, i) => {
      // `p` is what was actually charged for this cake today. The webhook must
      // never recompute it: a rounding rule that changes between deploy and
      // payment would write a deposit that disagrees with the card, and the
      // difference would surface months later as an unexplained balance.
      metadata[`l${i}`] = JSON.stringify({
        s: l.size, f: l.flavour, w: l.wording, c: l.cents, d: shares[i], p: deposits[i],
      }).slice(0, 500);
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      branding_settings: branding,
      // Cards carry Apple Pay, Google Pay and Link at the same rate and need no
      // extra integration. PayTo is a separate rail (1% capped at $3.50, so it
      // pays for itself on a tiered cake) and must be activated on the Stripe
      // account first — Stripe rejects the session if it is not, which is why
      // it is opt-in through an env var rather than simply listed here.
      payment_method_types: payMethods(),
      customer_email: email || undefined,
      // Required on Stripe's page: it is how the shop says a cake is ready.
      phone_number_collection: { enabled: true },
      // The name the kitchen writes on the docket, which is not always the
      // cardholder's — a cake is often paid for by someone else.
      custom_fields: [{
        key: 'name',
        label: { type: 'custom', custom: 'Name for the order' },
        type: 'text',
        text: { maximum_length: 80 },
      }],
      line_items,
      metadata,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${SITE}/shop/thank-you?s={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/shop/cart`,
      // The one place the customer is told, on Stripe's own page, that this is
      // not the whole price. Required by the deposit terms, not decoration.
      payment_intent_data: {
        description: `50% deposit — balance ${aud(netTotal - depositTotal)} payable on collection`,
      },
      custom_text: {
        submit: {
          message: `This is a ${Math.round(DEPOSIT_RATE * 100)}% deposit. The remaining ${aud(netTotal - depositTotal)} is payable when you collect your cake. Cancel more than 24 hours before collection and the deposit is refunded in full.`,
        },
        after_submit: {
          message: `${collect}. We'll text you the moment it's ready.`,
        },
      },
    }, BRANDED);

    return json(200, { url: session.url });
  } catch (e) {
    if (e instanceof BadRequest) return json(400, { error: e.message });
    console.error('create-checkout failed', e);
    return json(500, { error: 'Could not start checkout. Please try again.' });
  }
};

// The route lives in netlify.toml, which this repo treats as the single source
// of truth for redirects — not in a `config.path` here as well.
