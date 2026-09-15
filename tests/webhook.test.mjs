/**
 * Does the webhook actually refuse a forgery?
 *
 * A 200 on a bad signature tells Stripe the forgery was accepted, and the
 * base64 branch is the single most common cause of "signature verification
 * failed" on Netlify — so both are asserted rather than assumed.
 *
 * Run from verify-blog.mjs, which gates the public deploy.
 */
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_testsecret123';
// The function now refuses to run at all without these. orders.created_by is
// NOT NULL DEFAULT auth.uid(), and the webhook writes with the SERVICE ROLE,
// where auth.uid() is null — so a missing ONLINE_ORDERS_USER_ID means every
// paid order fails its insert, Stripe retries for three days, and the customer
// has paid for a cake nobody is baking.
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_fake';
process.env.ONLINE_ORDERS_USER_ID = '00000000-0000-4000-8000-000000000000';
// The function logs every rejection; that is right in production and noise here.
const realError = console.error;
console.error = () => {};
const { handler } = await import('../netlify/functions/stripe-webhook.mjs');
const Stripe = (await import('stripe')).default;
const stripe = new Stripe('sk_test_fake');

const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed',
  data: { object: { id: 'cs_test_1', payment_status: 'unpaid', metadata: {} } } });

const cases = [
  ['no signature header', { body: payload, headers: {} }],
  ['garbage signature', { body: payload, headers: { 'stripe-signature': 't=1,v1=deadbeef' } }],
  ['valid signature, wrong secret', { body: payload, headers: {
      'stripe-signature': stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_someoneelse' }) } }],
  ['tampered body, real signature', { body: payload.replace('unpaid', 'paid'), headers: {
      'stripe-signature': stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_testsecret123' }) } }],
];
let bad = 0;
for (const [name, ev] of cases) {
  const r = await handler(ev);
  const ok = r.statusCode === 400;
  if (!ok) { bad++; realError(`FAIL ${name} -> ${r.statusCode}`); }
}
// The good path must be accepted, through BOTH encodings.
for (const [name, enc] of [['utf8', false], ['base64', true]]) {
  const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_testsecret123' });
  const r = await handler({ body: enc ? Buffer.from(payload).toString('base64') : payload,
                            isBase64Encoded: enc, headers: { 'stripe-signature': sig } });
  // payment_status is 'unpaid', so a verified event is accepted and then ignored.
  const ok = r.statusCode === 200 && r.body === 'unpaid';
  if (!ok) { bad++; realError(`FAIL valid signature (${name}) -> ${r.statusCode} ${r.body}`); }
}
// ── the misconfiguration guard ──────────────────────────────────────────────
// Each required variable, removed one at a time, must stop the function before
// it accepts an event it cannot fulfil — and must answer 500, not 200, so
// Stripe keeps the event queued for replay once the variable is set.
{
  const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_testsecret123' });
  for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ONLINE_ORDERS_USER_ID']) {
    const saved = process.env[key];
    delete process.env[key];
    const r = await handler({ body: payload, headers: { 'stripe-signature': sig } });
    if (r.statusCode !== 500) {
      bad++; realError(`FAIL missing ${key} -> ${r.statusCode} (want 500 so Stripe retries)`);
    }
    process.env[key] = saved;
  }
}

console.error = realError;
console.log(bad ? `${bad} FAILED` : 'webhook: signature holds on all 6 paths, and refuses 3 misconfigurations');
process.exit(bad ? 1 : 0);
