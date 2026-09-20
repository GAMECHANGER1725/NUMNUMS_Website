/**
 * The "Copy code" landing page for the coupon email.
 *
 * **An email cannot copy anything.** Every client strips `<script>`, so a real
 * clipboard button inside the message is impossible — the button in the email
 * is a link, and this is where it lands. The page shows the code large and
 * copies it on tap.
 *
 * The copy is wired to a **tap, not to page load**. Safari refuses
 * `navigator.clipboard.writeText` without a user gesture and Chrome is heading
 * the same way, so an auto-copy would silently do nothing on a phone, which is
 * exactly where somebody is trying to avoid retyping a code. It also falls back
 * to selecting the text, so the page is still useful where the clipboard API is
 * blocked outright.
 *
 * **v2 function** — must return a `Response`. See the v1/v2 note in CLAUDE.md.
 *
 * It reads the code from the query string and renders it, so the code is
 * validated against the minting format before it reaches the page. Anything
 * else is dropped rather than echoed: this is a reflected-input boundary.
 */

// Matches `newCode()` in subscribe.mjs: 'NN-' + 6 base36 chars, upper-cased.
const CODE_RE = /^NN-[A-Z0-9]{4,12}$/;

const esc = (s) => String(s).replace(/[<>&"']/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));

const page = (code) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${code ? 'Your code' : 'Code not found'} — Num Num's Bakery</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
         background:#FFF8F2;font-family:'Jost','Helvetica Neue',Arial,sans-serif;padding:24px; }
  .card { width:100%;max-width:440px;text-align:center;background:#fff;border-radius:4px;
          padding:44px 32px;border-top:3px solid #C85478;
          box-shadow:0 1px 2px rgba(44,26,14,.04),0 8px 24px -12px rgba(44,26,14,.16); }
  h1 { font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:30px;
       line-height:36px;color:#2C1A0E;margin:0 0 6px; }
  .sub { font-size:14px;line-height:22px;color:#8A6B55;font-weight:300;margin:0 0 26px; }
  .code { font-size:32px;line-height:40px;font-weight:500;letter-spacing:6px;color:#C85478;
          user-select:all;-webkit-user-select:all;word-break:break-all;margin:0 0 22px; }
  button, .link { font-family:inherit;font-size:13px;letter-spacing:1.4px;text-transform:uppercase;
          font-weight:400;border-radius:3px;padding:13px 28px;cursor:pointer;display:inline-block;
          text-decoration:none;border:1px solid #C85478; }
  button { background:#C85478;color:#FFF8F2;width:100%;max-width:260px; }
  button:hover, button:focus-visible { background:#A03D5E;border-color:#A03D5E; }
  button[data-done] { background:#fff;color:#C85478; }
  .link { background:none;color:#C85478;border:0;padding:14px 0 0;display:block; }
  .note { font-size:13px;line-height:20px;color:#8A6B55;font-weight:300;margin:22px 0 0; }
</style></head>
<body><div class="card">
${code ? `
  <h1>Your 10% off code</h1>
  <p class="sub">Use it on your next order, with the email address it was sent to.</p>
  <p class="code" id="code">${code}</p>
  <button id="copy" type="button">Copy code</button>
  <a class="link" href="/shop">Browse the cakes</a>
  <p class="note">It only works once you&rsquo;ve ordered with us before.</p>
` : `
  <h1>We couldn&rsquo;t read that code</h1>
  <p class="sub">The link may have been broken by your email app. The code is written in the email itself &mdash; you can type it in at checkout.</p>
  <a class="link" href="/shop">Browse the cakes</a>
`}
</div>
${code ? `<script>
(function () {
  var btn = document.getElementById('copy');
  var el = document.getElementById('code');
  if (!btn || !el) return;
  btn.addEventListener('click', function () {
    var text = el.textContent.trim();
    var done = function () {
      btn.textContent = 'Copied';
      btn.setAttribute('data-done', '1');
      setTimeout(function () { btn.textContent = 'Copy code'; btn.removeAttribute('data-done'); }, 2500);
    };
    // Selecting it is the fallback, not an afterthought: a blocked clipboard
    // should still leave the code highlighted and ready for a manual copy.
    var select = function () {
      try {
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      } catch (e) {}
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { select(); btn.textContent = 'Press \\u2318C to copy'; });
    } else {
      select();
      btn.textContent = 'Press \\u2318C to copy';
    }
  });
})();
</script>` : ''}
</body></html>`;

export default async (req) => {
  const raw = (new URL(req.url).searchParams.get('c') || '').trim().toUpperCase();
  const code = CODE_RE.test(raw) ? esc(raw) : null;
  return new Response(page(code), {
    status: code ? 200 : 404,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
};
