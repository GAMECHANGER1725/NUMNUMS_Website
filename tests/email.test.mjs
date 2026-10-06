/**
 * The unsubscribe token, and which host email links point at.
 *
 * **The unsubscribe token is a signature.** A forged one must not unsubscribe
 * somebody else, and a link we generated must keep working.
 *
 * Run from verify-blog.mjs, which gates the public deploy.
 */
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_fake_for_tests';

const { siteFor } = await import('../netlify/lib/email-shell.mjs');
const { unsubscribeToken, unsubscribeUrl, emailFromToken } =
  await import('../netlify/lib/unsubscribe.mjs');

let bad = 0;
const ok = (cond, what) => { if (!cond) { bad++; console.error(`FAIL ${what}`); } };

// ---- the unsubscribe token -------------------------------------------------

const EMAIL = 'someone@example.com';
const tok = unsubscribeToken(EMAIL);

ok(emailFromToken(tok) === EMAIL, 'a token we minted round-trips');
ok(emailFromToken(unsubscribeToken('MiXeD@Example.COM')) === 'mixed@example.com',
  'address is normalised before signing, so one person is one token');

// Forgeries. Each of these is somebody unsubscribing an address that is not
// theirs, which is the only real attack on this endpoint.
const [payload, sig] = tok.split('.');
ok(emailFromToken(`${payload}.${'0'.repeat(sig.length)}`) === null, 'wrong signature is refused');
ok(emailFromToken(`${payload}.${sig.slice(0, -1)}`) === null, 'truncated signature is refused');
ok(emailFromToken(`${Buffer.from('victim@example.com').toString('base64url')}.${sig}`) === null,
  'swapping the address under a valid signature is refused');
ok(emailFromToken('') === null, 'empty token is refused');
ok(emailFromToken(null) === null, 'missing token is refused');
ok(emailFromToken('nodot') === null, 'malformed token is refused');
ok(emailFromToken(`${Buffer.from('not-an-address').toString('base64url')}.x`) === null,
  'a payload that is not an address is refused');

// ---- which host the links point at ----------------------------------------

const at = (u) => siteFor(new Request(u));
ok(at('https://numnumsbakery.com.au/api/subscribe') === 'https://numnumsbakery.com.au', 'production maps to production');
ok(at('https://abc123--numnumstest.netlify.app/api/subscribe') === 'https://abc123--numnumstest.netlify.app',
  'a deploy preview links to itself, so the email can be tested before publishing');
ok(at('http://localhost:4000/api/subscribe') === 'http://localhost:4000', 'localhost links to localhost');
// The host is attacker-controlled; echoing it into an email we send is a
// phishing vector, so anything unrecognised must fall back to production.
ok(at('https://numnumsbakery.com.au.evil.test/api/subscribe') === 'https://numnumsbakery.com.au', 'suffix lookalike is refused');
ok(at('https://evil--numnumstest.netlify.app.evil.test/x') === 'https://numnumsbakery.com.au', 'preview lookalike is refused');
ok(at('https://attacker.test/api/subscribe') === 'https://numnumsbakery.com.au', 'unknown host falls back to production');

ok(unsubscribeUrl(EMAIL).startsWith('https://numnumsbakery.com.au/unsubscribe?t='),
  'the link points at the route netlify.toml declares');
ok(!unsubscribeUrl(EMAIL).includes('@'), 'the raw address is not sitting in the query string');

if (bad) {
  console.error(`email: ${bad} failure(s)`);
  process.exit(1);
}
console.log('email: unsubscribe token and link host OK');
