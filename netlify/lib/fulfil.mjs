/**
 * Turn a PAID Stripe Checkout session into order rows. The one place a web
 * order becomes real, called from two doors:
 *
 * - `stripe-webhook`, Stripe telling us, and retrying for three days; and
 * - `order-status`, the confirmation page asking, after it has fetched the
 *   session from Stripe itself with the secret key and seen `paid`.
 *
 * Both is what Stripe recommends (docs.stripe.com/checkout/fulfillment): the
 * webhook covers a customer who closes the tab, the page covers a webhook that
 * is late, or that cannot arrive at all — a Netlify deploy preview has a new
 * address every build, so no webhook can be registered to it, and before this
 * a preview checkout took the money and never wrote the order.
 *
 * Running twice is safe by construction, not by care: the rows go in as ONE
 * insert against the unique (stripe_session_id, cart_line) index, and a
 * duplicate returns before any side effect — coupon claim, next coupon,
 * contact, staff hook. Two callers racing get one winner and one 23505.
 *
 * The caller must have established `payment_status === 'paid'` from Stripe.
 * Throws on any other failure, so the webhook can answer 500 and be retried.
 */
const DUPLICATE = '23505';

const code = () => 'NN-' + Math.random().toString(36).slice(2, 8).toUpperCase();

export async function fulfilSession(db, session) {
  const m = session.metadata ?? {};
  const count = Number(m.lines ?? 0);
  const groupId = crypto.randomUUID();
  const email = (session.customer_email ?? session.customer_details?.email ?? '').toLowerCase();
  // Collected on Stripe's page. `m.name`/`m.phone` cover sessions created
  // before that, when our own checkout page asked. Stripe hands back
  // +61412345678; the shop reads and texts 0412 345 678, and phone_key
  // (last nine digits) matches either way.
  const name = m.name
    || session.custom_fields?.find((f) => f.key === 'name')?.text?.value
    || session.customer_details?.name || '';
  const phone = String(m.phone || session.customer_details?.phone || '').replace(/^\+61/, '0');

  const rows = [];
  for (let i = 0; i < count; i++) {
    const l = JSON.parse(m[`l${i}`]);
    rows.push({
      store: m.store,
      kind: 'normal',
      // NEVER true: set_order_defaults() forces a walk-in to picked_up, and
      // the cake would never be baked.
      walk_in: false,
      customer_name: name,
      customer_phone: phone || null,
      customer_email: email,
      flavour: l.f,
      size: l.s,
      wording: l.w || null,
      due_at: m.due_at,
      ordered_at: new Date(session.created * 1000).toISOString(),
      price: l.c / 100,
      discount: l.d / 100,
      // What the card was actually charged for this cake, carried through
      // from create-checkout rather than recomputed — see the note on `p`
      // there. `paidOn()` reads this until the cake is collected, so ops
      // stamps DEPOSIT PAID and the invoice prints the real balance owing,
      // both with no further changes.
      //
      // `?? (l.c - l.d)` is for sessions created before deposits existed:
      // one could still be sitting unpaid in a customer's tab, and it was
      // quoted at the full price, so it must be recorded as paid in full.
      deposit: (l.p ?? (l.c - l.d)) / 100,
      // A sandbox payment lands in the same order book the kitchen bakes from,
      // so it says so on the docket rather than passing for a real cake.
      notes: (session.livemode === false ? 'TEST ORDER (Stripe sandbox, no real payment). Delete once checked. ' : '')
        + (l.p == null
          ? 'Paid online via website.'
          : `Paid online via website — 50% deposit. Balance $${((l.c - l.d - l.p) / 100).toFixed(2)} due on collection.`),
      stripe_session_id: session.id,
      order_group_id: groupId,
      cart_line: i,
      created_by: process.env.ONLINE_ORDERS_USER_ID,
    });
  }

  // One array insert, so a three-cake cart cannot half-land.
  const { data: inserted, error } = await db.from('orders').insert(rows).select('order_no');
  if (error && error.code !== DUPLICATE) throw error;
  if (error?.code === DUPLICATE) return 'already recorded';

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
  let nextCoupon = null;
  if (email) {
    const expires = new Date(Date.now() + 90 * 86_400_000).toISOString();
    const newCode = code();
    const { error: cErr } = await db.from('coupons').insert({
      code: newCode, email, percent: 10, expires_at: expires,
    });
    if (cErr && cErr.code !== DUPLICATE) console.error('coupon issue failed', cErr);
    // Only hand it to Make if the insert actually landed — a retry that hits
    // the duplicate guard must not re-announce a code nobody wrote twice.
    else if (!cErr) nextCoupon = { code: newCode, expires_at: expires };
  }

  if (email) {
    await db.from('marketing_contacts').upsert({
      email, name, phone: phone || null, updated_at: new Date().toISOString(),
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
        kind: 'web-order', store: m.store, due_at: m.due_at, name,
        phone, email, cakes: count,
        order_nos: (inserted ?? []).map((r) => r.order_no),
        total: (session.amount_total ?? 0) / 100,
        // The whole reason this field exists: it is what a Make scenario
        // needs to email the customer their next-order code. Before this it
        // was minted in the database and never told to anyone.
        coupon_code: nextCoupon?.code ?? null,
        coupon_expires_at: nextCoupon?.expires_at ?? null,
      }),
    }).catch((e) => console.error('make hook failed', e));
  }

  return 'ok';
}
