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
import { createClient } from '@supabase/supabase-js';
import { json } from '../lib/shared.mjs';

export default async (req) => {
  const s = new URL(req.url).searchParams.get('s') ?? '';
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(s)) return json(400, { error: 'bad session' });

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await db.from('orders')
    .select('order_no,due_at,store,price,discount')
    .eq('stripe_session_id', s)
    .order('cart_line');

  if (error) return json(500, { error: 'lookup failed' });
  if (!data?.length) return json(200, { paid: false });

  return json(200, {
    paid: true,
    order_nos: data.map((r) => r.order_no),
    due_at: data[0].due_at,
    store: data[0].store,
    total: data.reduce((a, r) => a + Number(r.price) - Number(r.discount), 0),
  });
};
