/**
 * How many web pickups are still open for the coming Saturday.
 *
 * The shop page shows "2 online pickups left for Saturday 10 October" from
 * this, and nothing else. The number is the per-shop daily cap minus the web
 * orders already held, counted by the same `webOrdersOn` that makes
 * `create-checkout` refuse the day once it is full — so the claim on the page
 * is exactly the rule the checkout enforces, and stays true as orders land.
 *
 * Saturday only, because that is the day that sells out (74% of cakes are
 * due Friday or Saturday — plans/Five-Year Direction). Answers `{ day: null }`
 * — and the page shows nothing — when no cap is set, when the day is a
 * blocked date (closed is not "fully booked"), or when the count fails.
 *
 * v2 function: returns a Response, never the v1 object (see shared.mjs json).
 * Called at /.netlify/functions/capacity directly — no netlify.toml redirect.
 */
import { createClient } from '@supabase/supabase-js';
import { json, dailyCap, webOrdersOn, nextSaturday, STORES } from '../lib/shared.mjs';

export default async () => {
  const cap = dailyCap();
  if (!cap || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(200, { day: null });
  }
  const day = nextSaturday();
  const blocked = (process.env.BLOCKED_DATES ?? '').split(',').map((s) => s.trim());
  if (blocked.includes(day)) return json(200, { day: null });

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const counts = await Promise.all(STORES.map((s) => webOrdersOn(db, day, s)));
  if (counts.some((c) => c == null)) return json(200, { day: null });

  // Both shops together: the board does not know which shop the customer
  // will pick, and a total is true of the order they are about to place.
  const left = counts.reduce((n, c) => n + Math.max(0, cap - c), 0);
  return json(200, { day, left });
};
