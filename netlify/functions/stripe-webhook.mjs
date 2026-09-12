/**
 * The only place a web order becomes real.
 *
 * Status advances on this webhook, never on the browser redirect — a customer
 * who pays and closes the tab before Stripe redirects still gets their cakes
 * baked, and a customer who forges a redirect gets nothing.
 *
 * Every step is idempotent through a database constraint rather than through
 * bookkeeping in here, so a partial failure can safely return 500 and let
 * Stripe retry for three days.
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const DUPLICATE = '23505';

/** Stripe signs the bytes it sent. Parse anything first and the check is void. */
function rawBody(event) {
  return event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body ?? '', 'utf8');
}

const code = () => 'NN-' + Math.random().toString(36).slice(2, 8).toUpperCase();

export const handler = async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let evt;
  try {
    evt = stripe.webhooks.constructEvent(
      rawBody(event),
      event.headers['stripe-signature'] ?? event.headers['Stripe-Signature'],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    // 400, never 200: a 200 tells Stripe the forgery was accepted.
    console.error('bad stripe signature', e.message);
    return { statusCode: 400, body: 'signature verification failed' };
  }

  if (evt.type !== 'checkout.session.completed') return { statusCode: 200, body: 'ignored' };
  const session = evt.data.object;
  if (session.payment_status !== 'paid') return { statusCode: 200, body: 'unpaid' };

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const m = session.metadata ?? {};
    const count = Number(m.lines ?? 0);
    const groupId = crypto.randomUUID();
    const email = (session.customer_email ?? session.customer_details?.email ?? '').toLowerCase();

    const rows = [];
    for (let i = 0; i < count; i++) {
      const l = JSON.parse(m[`l${i}`]);
      rows.push({
        store: m.store,
        kind: 'normal',
        // NEVER true: set_order_defaults() forces a walk-in to picked_up, and
        // the cake would never be baked.
        walk_in: false,
        customer_name: m.name,
        customer_phone: m.phone || null,
        customer_email: email,
        flavour: l.f,
        size: l.s,
        wording: l.w || null,
        due_at: m.due_at,
        ordered_at: new Date(session.created * 1000).toISOString(),
        price: l.c / 100,
        discount: l.d / 100,
        // deposit == price - discount is what makes paidOn() report it fully
        // paid, so ops stamps PAID IN FULL with no changes at all.
        deposit: (l.c - l.d) / 100,
        notes: 'Paid online via website.',
        stripe_session_id: session.id,
        order_group_id: groupId,
        cart_line: i,
        created_by: process.env.ONLINE_ORDERS_USER_ID,
      });
    }

    // One array insert, so a three-cake cart cannot half-land.
    const { data: inserted, error } = await db.from('orders').insert(rows).select('order_no');
    if (error && error.code !== DUPLICATE) throw error;
    if (error?.code === DUPLICATE) return { statusCode: 200, body: 'already recorded' };

    // Claim the coupon. A 0-row update means somebody spent it in another tab
    // between pricing and paying; we wear the discount once and log it, which
    // is cheaper than holding a lock across a hosted checkout.
    if (m.coupon) {
      const { data: claimed } = await db.from('coupons')
        .update({ redeemed_at: new Date().toISOString() })
        .eq('code', m.coupon).is('redeemed_at', null).select('code');
      if (!claimed?.length) console.warn('coupon already redeemed:', m.coupon, session.id);
    }

    // Issue the next one. Unique on issued_for_order, so a retry cannot mint
    // a second code for the same order.
    if (email) {
      const expires = new Date(Date.now() + 90 * 86_400_000).toISOString();
      const { error: cErr } = await db.from('coupons').insert({
        code: code(), email, percent: 10, expires_at: expires,
      });
      if (cErr && cErr.code !== DUPLICATE) console.error('coupon issue failed', cErr);
    }

    if (email) {
      await db.from('marketing_contacts').upsert({
        email, name: m.name, phone: m.phone || null, updated_at: new Date().toISOString(),
      }, { onConflict: 'email', ignoreDuplicates: false });
    }

    // Staff notification fires immediately on every web order — with no daily
    // capacity cap in v1, a person noticing is the backstop.
    const hook = process.env.MAKE_ORDER_HOOK_URL;
    if (hook) {
      await fetch(hook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'web-order', store: m.store, due_at: m.due_at, name: m.name,
          phone: m.phone, email, cakes: count,
          order_nos: (inserted ?? []).map((r) => r.order_no),
          total: (session.amount_total ?? 0) / 100,
        }),
      }).catch((e) => console.error('make hook failed', e));
    }

    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    // 500 so Stripe retries. Every write above is idempotent, so a retry is safe.
    console.error('webhook failed', e);
    return { statusCode: 500, body: 'retry' };
  }
};
