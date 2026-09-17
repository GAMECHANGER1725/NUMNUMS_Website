/**
 * Do the v2 functions actually return something Netlify will serve?
 *
 * Netlify's v2 runtime (`export default async (req)`) accepts a `Response` or
 * `undefined` and NOTHING else. Hand it the v1 Lambda shape
 * `{ statusCode, headers, body }` and it answers 502 "Function returned an
 * unsupported value" — the handler's own code never runs.
 *
 * That shipped, and it was invisible three ways over: `checkout.test.mjs`
 * imports pure helpers and never calls a handler, `webhook.test.mjs` covers
 * the one function that is legitimately v1, and the browser only ever showed
 * the popup's generic "try again" because a 502 body carries no `error` field.
 * So the whole priced funnel 502'd on its first line with every test green.
 *
 * This asserts the contract at the boundary the runtime actually checks.
 *
 * Run from verify-blog.mjs, which gates the public deploy.
 */
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_fake';
process.env.ONLINE_ORDERS_USER_ID = '00000000-0000-4000-8000-000000000000';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

const realError = console.error;
console.error = () => {};

let bad = 0;

/** A request the handler will reject early — we are testing the shape, not the logic. */
const req = (url, method = 'POST', body = '{}') =>
  new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    ...(method === 'POST' ? { body } : {}),
  });

/**
 * GET on a POST-only function is the cheapest path that still goes through
 * `json()`, so it exercises the return contract without needing Supabase or
 * Stripe to answer.
 */
const CASES = [
  ['subscribe', '../netlify/functions/subscribe.mjs', 'https://x.test/api/subscribe'],
  ['check-coupon', '../netlify/functions/check-coupon.mjs', 'https://x.test/api/check-coupon'],
  ['create-checkout', '../netlify/functions/create-checkout.mjs', 'https://x.test/api/create-checkout'],
  ['order-status', '../netlify/functions/order-status.mjs', 'https://x.test/api/order-status?session_id=nope'],
];

for (const [name, path, url] of CASES) {
  let mod;
  try {
    mod = await import(path);
  } catch (e) {
    bad++; realError(`FAIL ${name} -> could not import: ${e.message}`);
    continue;
  }

  const fn = mod.default;
  if (typeof fn !== 'function') {
    bad++; realError(`FAIL ${name} -> no default export (v2 functions export default)`);
    continue;
  }

  let res;
  try {
    res = await fn(req(url, 'GET'));
  } catch (e) {
    bad++; realError(`FAIL ${name} -> threw: ${e.message}`);
    continue;
  }

  if (res === undefined) continue; // also legal

  if (!(res instanceof Response)) {
    bad++;
    const shape = res && typeof res === 'object' ? Object.keys(res).join(',') : typeof res;
    realError(`FAIL ${name} -> returned {${shape}}, not a Response. Netlify answers 502.`);
    continue;
  }

  if (typeof res.status !== 'number') {
    bad++; realError(`FAIL ${name} -> Response has no numeric status`);
  }
}

/** The two genuinely-v1 functions must keep the object shape, not gain a Response. */
const v1 = await import('../netlify/functions/stripe-webhook.mjs');
if (typeof v1.handler !== 'function') {
  bad++; realError('FAIL stripe-webhook -> should export `handler` (it is a v1 function)');
}

console.error = realError;

if (bad) {
  console.error(`response-shape: ${bad} failure(s)`);
  process.exit(1);
}
console.log(`response-shape: ${CASES.length} v2 functions return a Response, webhook stays v1`);
