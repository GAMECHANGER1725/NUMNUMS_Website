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
console.error = realError;
console.log(bad ? `${bad} FAILED` : 'webhook: signature verification holds on all 6 paths');
process.exit(bad ? 1 : 0);
