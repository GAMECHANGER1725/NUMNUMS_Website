/**
 * "Did that work?" for the ops bell. Turning notifications on calls this, and it
 * sends one real notification to the caller's own phones through the same
 * sender a paid order uses, then hands back what FCM / Apple answered. Before
 * this, the only way to find out an iPhone was silent was a real order.
 *
 * v2 function (returns a Response). Called cross-origin from the ops subdomain
 * with the staff member's Supabase access token; it only ever sends to that
 * person's own rows, so a stranger with a token gets nothing to aim at.
 */
import { createClient } from '@supabase/supabase-js';
import { json } from '../lib/shared.mjs';
import { notifyStaff } from '../lib/push.mjs';

const ORIGINS = ['https://ops.numnumsbakery.com.au', 'http://localhost:4000'];

export default async (req) => {
  const origin = req.headers.get('origin');
  const cors = {
    'access-control-allow-origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'POST',
    vary: 'origin',
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const out = (status, body) => {
    const r = json(status, body);
    for (const [k, v] of Object.entries(cors)) r.headers.set(k, v);
    return r;
  };
  if (req.method !== 'POST') return out(405, { error: 'POST only' });

  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!token) return out(401, { error: 'not signed in' });

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data: { user } = {}, error } = await db.auth.getUser(token);
  if (error || !user) return out(401, { error: 'not signed in' });
  if (!process.env.VAPID_PRIVATE_KEY) return out(503, { error: 'VAPID_PRIVATE_KEY is not set on the site' });

  const results = await notifyStaff(db, null, {
    title: 'Notifications are on',
    body: 'This is what a new web order will look like on this phone.',
    url: './',
    tag: 'push-test',
  }, { userId: user.id });
  return out(200, { results });
};
