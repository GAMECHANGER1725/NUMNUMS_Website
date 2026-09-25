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
import { requireEnv } from '../lib/shared.mjs';
import { fulfilSession } from '../lib/fulfil.mjs';


/** Stripe signs the bytes it sent. Parse anything first and the check is void. */
function rawBody(event) {
  return event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body ?? '', 'utf8');
}


export const handler = async (event) => {
  // Before the signature check, because a deploy missing these cannot fulfil
  // an order no matter how valid the event is — and ONLINE_ORDERS_USER_ID in
  // particular fails in a way that looks like anything but a config problem.
  try {
    requireEnv(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUPABASE_URL',
                'SUPABASE_SERVICE_ROLE_KEY', 'ONLINE_ORDERS_USER_ID']);
  } catch (e) {
    console.error('stripe-webhook is misconfigured:', e.message);
    // 500 so Stripe keeps retrying: once the variable is set, the queued
    // events replay and the orders land. A 200 here would discard them.
    return { statusCode: 500, body: 'server misconfigured' };
  }

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

  // PayTo is a delayed-notification rail: its session completes `unpaid` and
  // the money arrives later as async_payment_succeeded. Listen for only
  // `completed` and a PayTo customer pays for a cake nobody is told to bake.
  // Both events carry the same session, and the unique index makes a second
  // delivery a no-op.
  if (evt.type !== 'checkout.session.completed' &&
      evt.type !== 'checkout.session.async_payment_succeeded') {
    return { statusCode: 200, body: 'ignored' };
  }
  const session = evt.data.object;
  if (session.payment_status !== 'paid') return { statusCode: 200, body: 'unpaid' };

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const result = await fulfilSession(db, session);
    return { statusCode: 200, body: result };
  } catch (e) {
    // 500 so Stripe retries. Every write above is idempotent, so a retry is safe.
    console.error('webhook failed', e);
    return { statusCode: 500, body: 'retry' };
  }
};
