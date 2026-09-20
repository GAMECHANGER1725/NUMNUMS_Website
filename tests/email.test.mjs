/**
 * The coupon email and its unsubscribe token.
 *
 * Two things in here are worth a test and the rest is markup:
 *
 * 1. **The code has to survive to the inbox as text.** Every earlier bug in
 *    this feature was silent, and "the customer got an email with no code in
 *    it" is the same class. So both parts are checked for the literal code,
 *    and the HTML is checked for not having quietly turned it into an image.
 * 2. **The unsubscribe token is a signature.** A forged one must not
 *    unsubscribe somebody else, and a link we generated must keep working.
 *
 * Run from verify-blog.mjs, which gates the public deploy.
 */
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_fake_for_tests';

const { couponEmail, siteFor } = await import('../netlify/lib/coupon-email.mjs');
const { unsubscribeToken, unsubscribeUrl, emailFromToken } =
  await import('../netlify/lib/unsubscribe.mjs');

let bad = 0;
const ok = (cond, what) => { if (!cond) { bad++; console.error(`FAIL ${what}`); } };

const COUPON = { code: 'NN-YLHB30', percent: 10, expires_at: '2026-12-19T10:12:54.189+00:00' };
const UNSUB = 'https://numnumsbakery.com.au/unsubscribe?t=abc.def';

// ---- the message -----------------------------------------------------------

const { subject, html, text } = couponEmail({ name: 'Vaidik', coupon: COUPON, unsubscribeUrl: UNSUB });

ok(subject.includes('NN-YLHB30'), 'subject carries the code');
ok(html.includes('NN-YLHB30'), 'html carries the code');
ok(text.includes('NN-YLHB30'), 'plain-text part carries the code');
ok(text.length > 200, 'plain-text part is a real alternative, not a stub');

// The code must be selectable text. An <img> would be blank in any inbox that
// blocks images by default, which is most of them.
const imgs = html.match(/<img\b/g) || [];
ok(imgs.length <= 1, `at most the logo is an image (found ${imgs.length})`);
ok(/alt="Num Num&#39;s Bakery"/.test(html), 'the one image names the brand when blocked');

ok(html.includes(UNSUB) && text.includes(UNSUB), 'unsubscribe link is in both parts');
ok(html.includes('/coupon?c=NN-YLHB30'), 'the Copy button links to the copy page');
ok(/user-select:all/.test(html), 'the code is one-tap selectable');

// The copy page is the only reason that button works, so it has to agree with
// the code format. A mismatch shows up as "we couldn't read that code".
const { default: couponPage } = await import('../netlify/functions/coupon.mjs');
const good = await couponPage(new Request('https://x.test/coupon?c=NN-YLHB30'));
ok(good.status === 200, 'copy page accepts a real code');
ok((await good.text()).includes('NN-YLHB30'), 'copy page shows the code');
const bad1 = await couponPage(new Request('https://x.test/coupon?c=%3Cscript%3E'));
ok(bad1.status === 404, 'copy page refuses a code-shaped injection');
ok(!(await bad1.text()).includes('<script>alert'), 'copy page does not echo input');
const bad2 = await couponPage(new Request('https://x.test/coupon'));
ok(bad2.status === 404, 'copy page handles a missing code');
ok(/19 December 2026/.test(html), 'expiry is formatted in Sydney, not raw ISO');
ok(html.includes('Hi Vaidik,'), 'greets by first name');

// Riverstone Teal is location-specific; this is a global send.
ok(!/4EC4D8/i.test(html), 'no Riverstone teal in a global email');

// Missing name must not print "Hi undefined," or "Hi null,".
const anon = couponEmail({ name: '', coupon: COUPON, unsubscribeUrl: UNSUB });
ok(anon.html.includes('Hi there,'), 'falls back to a greeting with no name');
ok(!/undefined|null|NaN/.test(anon.html), 'no undefined/null leaks into the page');

// A name is customer-supplied and lands in an HTML document.
const evil = couponEmail({
  name: '<script>alert(1)</script>', coupon: COUPON, unsubscribeUrl: UNSUB,
});
ok(!evil.html.includes('<script>alert'), 'a hostile name is escaped, not injected');

// An expiry we cannot parse must drop the line, not print "Invalid Date".
const noExp = couponEmail({ name: 'A', coupon: { ...COUPON, expires_at: null }, unsubscribeUrl: UNSUB });
ok(!/Invalid Date|Valid until/.test(noExp.html), 'no expiry line when there is no expiry');

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

const onPreview = couponEmail({
  name: 'A', coupon: COUPON, site: 'https://abc123--numnumstest.netlify.app',
  unsubscribeUrl: 'https://abc123--numnumstest.netlify.app/unsubscribe?t=a.b',
});
ok(!onPreview.html.includes('numnumsbakery.com.au/brand_assets'),
  'a preview email does not point its logo at production, where it would 404');

ok(unsubscribeUrl(EMAIL).startsWith('https://numnumsbakery.com.au/unsubscribe?t='),
  'the link points at the route netlify.toml declares');
ok(!unsubscribeUrl(EMAIL).includes('@'), 'the raw address is not sitting in the query string');

if (bad) {
  console.error(`email: ${bad} failure(s)`);
  process.exit(1);
}
console.log('email: coupon message and unsubscribe token OK');
