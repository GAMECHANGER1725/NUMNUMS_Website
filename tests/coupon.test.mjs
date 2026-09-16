/**
 * Who is allowed to spend a coupon.
 *
 * The offer is "10% off your NEXT order", and that word is load-bearing. The
 * popup mints a code for any address that merely looks like an email, so
 * without a history check a new address is a new 10% off, forever — single-use
 * codes only stop the *same* address getting two. Requiring a real order first
 * means entering the loop costs a full-price cake.
 *
 * Every refusal path is asserted, including the one that matters most: a failed
 * order lookup must refuse, never wave the discount through.
 *
 * Run from verify-blog.mjs, which gates the public deploy.
 */
import { couponFor } from '../netlify/lib/shared.mjs';

const realError = console.error;
console.error = () => {};

let bad = 0;
const check = (name, cond) => { if (!cond) { bad++; realError(`FAIL ${name}`); } };

const FUTURE = new Date(Date.now() + 30 * 86_400_000).toISOString();
const PAST = new Date(Date.now() - 86_400_000).toISOString();

/**
 * A stand-in for PostgREST: one coupon row, and a count of that email's
 * non-cancelled orders. `orderError` forces the lookup to fail.
 */
function fakeDb({ coupon = null, orders = 0, orderError = null }) {
  return {
    from(table) {
      if (table === 'coupons') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: coupon, error: null }) }),
          }),
        };
      }
      if (table === 'orders') {
        const chain = {
          eq: () => chain,
          neq: async () => ({ count: orders, error: orderError }),
        };
        return { select: () => chain };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

const LIVE = { code: 'NN-ABC123', email: 'buyer@example.com', percent: 10, expires_at: FUTURE, redeemed_at: null };

// A returning customer — the only case that should succeed.
{
  const r = await couponFor(fakeDb({ coupon: LIVE, orders: 1 }), 'NN-ABC123', 'buyer@example.com');
  check('returning customer gets the discount', r.coupon?.code === 'NN-ABC123' && r.problem === null);
  check('the bound email is not echoed back', r.coupon && !('email' in r.coupon));
}

// The abuse case this rule exists to close.
{
  const r = await couponFor(fakeDb({ coupon: LIVE, orders: 0 }), 'NN-ABC123', 'buyer@example.com');
  check('a first-time address is refused', r.coupon === null);
  check('and is told it is for their next order', /next order/i.test(r.problem ?? ''));
}

// Case should not decide eligibility.
{
  const r = await couponFor(fakeDb({ coupon: LIVE, orders: 2 }), '  nn-abc123  ', 'BUYER@Example.COM');
  check('code and email are normalised', r.coupon?.code === 'NN-ABC123' && r.problem === null);
}

// Somebody else's code answers exactly like a code that does not exist, so the
// endpoint cannot be used to work out whose code is whose.
{
  const r = await couponFor(fakeDb({ coupon: LIVE, orders: 5 }), 'NN-ABC123', 'mallory@example.com');
  check('another address is refused', r.coupon === null);
  check('and is not an oracle', r.problem === "We don't recognise that code.");
  const missing = await couponFor(fakeDb({ coupon: null, orders: 5 }), 'NN-NOPE00', 'mallory@example.com');
  check('an unknown code answers identically', missing.problem === r.problem);
}

// Spent and expired still refuse, and say which.
{
  const spent = { ...LIVE, redeemed_at: PAST };
  const r = await couponFor(fakeDb({ coupon: spent, orders: 3 }), 'NN-ABC123', 'buyer@example.com');
  check('a spent code is refused', r.coupon === null && /already been used/i.test(r.problem ?? ''));

  const stale = { ...LIVE, expires_at: PAST };
  const r2 = await couponFor(fakeDb({ coupon: stale, orders: 3 }), 'NN-ABC123', 'buyer@example.com');
  check('an expired code is refused', r2.coupon === null && /expired/i.test(r2.problem ?? ''));
}

// A broken lookup must cost the discount, not hand it out.
{
  const r = await couponFor(
    fakeDb({ coupon: LIVE, orders: 0, orderError: { message: 'connection reset' } }),
    'NN-ABC123', 'buyer@example.com',
  );
  check('a failed order lookup refuses rather than assuming', r.coupon === null);
}

// The two "you have not filled this in yet" paths.
{
  const noCode = await couponFor(fakeDb({}), '', 'buyer@example.com');
  check('an empty code asks for one', /enter a code/i.test(noCode.problem ?? ''));
  const noEmail = await couponFor(fakeDb({ coupon: LIVE }), 'NN-ABC123', '');
  check('an empty email asks for one', /email/i.test(noEmail.problem ?? ''));
}

console.error = realError;

if (bad) {
  console.error(`coupon: ${bad} failure(s)`);
  process.exit(1);
}
console.log('coupon: the discount needs a prior order, and refuses without leaking whose code it is');
