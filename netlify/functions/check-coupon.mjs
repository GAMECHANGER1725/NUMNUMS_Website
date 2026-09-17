/**
 * Does this code work, and how much off? Asked by the checkout coupon box.
 *
 * The browser cannot answer this itself. `coupons` is read-own-by-email under
 * RLS, so a customer who subscribed through the popup and never made an
 * account reads nothing and is told their own code is not recognised — which
 * is the entire payoff of the popup, dead.
 *
 * Advisory only. Nothing here decides a price: `create-checkout` re-validates
 * through the same `couponFor`, and the webhook claims it a third time.
 */
import { createClient } from '@supabase/supabase-js';
import { couponFor, json } from '../lib/shared.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Malformed request.' }); }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // 200 either way — "that code has expired" is an answer, not a failure.
    return json(200, await couponFor(db, body?.code, body?.email));
  } catch (e) {
    console.error('check-coupon failed', e);
    return json(500, { coupon: null, problem: "We couldn't check that code just then." });
  }
};
