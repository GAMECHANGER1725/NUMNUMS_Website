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
 * A stand-in for PostgREST: one coupon row, plus what
 * `coupon_person_status()` would say about the person asking.
 * `rpcError` forces that lookup to fail.
 */
function fakeDb({ coupon = null, orders = 0, redeemed = false, rpcError = null }) {
  return {
    from(table) {
      if (table === 'coupons') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: coupon, error: null }) }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    async rpc(fn, args) {
      if (fn !== 'coupon_person_status') throw new Error(`unexpected rpc ${fn}`);
      lastRpcArgs = args;
      if (rpcError) return { data: null, error: rpcError };
      return { data: [{ has_ordered: orders > 0, has_redeemed: redeemed }], error: null };
    },
  };
}

let lastRpcArgs = null;

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
    fakeDb({ coupon: LIVE, orders: 0, rpcError: { message: 'connection reset' } }),
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

// ---- one discount per PERSON, for life -------------------------------------

// The abuse this closes: a new email address is free, so "one code per email"
// only ever stopped the same ADDRESS getting two. A person is a mobile.
{
  const r = await couponFor(
    fakeDb({ coupon: LIVE, orders: 3, redeemed: true }),
    'NN-ABC123', 'buyer@example.com', '0412 345 678',
  );
  check('a person who already used a discount is refused', r.coupon === null);
  check('the refusal is gentle, not an accusation',
    /one-time treat/i.test(r.problem) && !/fraud|abuse|denied|not allowed/i.test(r.problem));
  check('and it thanks them for coming back', /thank you/i.test(r.problem));
}

// The mobile has to reach the lookup normalised, or an in-store customer —
// who has a phone on their order and NO email — is never recognised.
{
  await couponFor(fakeDb({ coupon: LIVE, orders: 1 }), 'NN-ABC123', 'buyer@example.com', '+61 412 345 678');
  check('phone is normalised to the last 9 digits for the lookup',
    lastRpcArgs && lastRpcArgs.p_phone_key === '412345678');
  await couponFor(fakeDb({ coupon: LIVE, orders: 1 }), 'NN-ABC123', 'buyer@example.com', '0412345678');
  check('local and +61 forms produce the same key', lastRpcArgs.p_phone_key === '412345678');
  await couponFor(fakeDb({ coupon: LIVE, orders: 1 }), 'NN-ABC123', 'buyer@example.com', '');
  check('a missing phone is sent as null, not an empty string', lastRpcArgs.p_phone_key === null);
}

// A lookup failure must not hand out money, and must not blame the customer.
{
  const r = await couponFor(
    fakeDb({ coupon: LIVE, orders: 3, rpcError: new Error('boom') }),
    'NN-ABC123', 'buyer@example.com', '0412345678',
  );
  check('a failed person lookup refuses the discount', r.coupon === null);
  check('and blames the system, not the shopper',
    /try again|ring us|give us a ring/i.test(r.problem) && !/already/i.test(r.problem));
}

// The "not yet" message should read as an invitation, not a rejection.
{
  const r = await couponFor(fakeDb({ coupon: LIVE, orders: 0 }), 'NN-ABC123', 'buyer@example.com', '0412345678');
  check('first-timer is told when it unlocks', /next order/i.test(r.problem));
  check('and it is worded warmly', /enjoy|waiting/i.test(r.problem));
}

console.error = realError;

if (bad) {
  console.error(`coupon: ${bad} failure(s)`);
  process.exit(1);
}
console.log('coupon: the discount needs a prior order, and refuses without leaking whose code it is');
