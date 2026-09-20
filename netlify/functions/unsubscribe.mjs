/**
 * Unsubscribe from the marketing list.
 *
 * A commercial electronic message to an Australian address must carry a
 * working unsubscribe facility (Spam Act 2003), so this is not optional
 * furniture — the coupon email cannot go out without it.
 *
 * **v2 function** (`export default async (req)`): it must return a `Response`.
 * See the v1/v2 note in CLAUDE.md before touching the return shape.
 *
 * It answers GET with a page rather than JSON because a person clicking a
 * footer link is the only caller. It never reveals whether the address was on
 * the list: an unknown-but-validly-signed token gets the same page as a real
 * one, since a token only exists if we sent it.
 */
import { createClient } from '@supabase/supabase-js';
import { emailFromToken } from '../lib/unsubscribe.mjs';

const page = (title, body) => new Response(
  `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Num Num's Bakery</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Jost:wght@300;400&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light; }
  body { margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
         background:#FFF8F2;font-family:'Jost','Helvetica Neue',Arial,sans-serif;padding:24px; }
  .card { max-width:460px;text-align:center;background:#fff;border-radius:4px;padding:48px 40px;
          border-top:3px solid #C85478;box-shadow:0 8px 24px -12px rgba(44,26,14,.16); }
  h1 { font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:32px;
       line-height:38px;color:#2C1A0E;margin:0 0 12px; }
  p { font-size:15px;line-height:24px;color:#5C3A22;font-weight:300;margin:0 0 24px; }
  a { display:inline-block;background:#C85478;color:#FFF8F2;text-decoration:none;
      padding:13px 28px;border-radius:3px;font-size:13px;letter-spacing:1.4px;
      text-transform:uppercase;font-weight:400; }
  a:hover, a:focus-visible { background:#A03D5E; }
</style></head>
<body><div class="card"><h1>${title}</h1><p>${body}</p>
<a href="https://numnumsbakery.com.au/">Back to the bakery</a></div></body></html>`,
  { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
);

export default async (req) => {
  const token = new URL(req.url).searchParams.get('t');
  const email = emailFromToken(token);

  if (!email) {
    return page('That link didn&rsquo;t work', 'It may have been broken by your email app. Reply to any of our emails and we&rsquo;ll take you off the list by hand.');
  }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { error } = await db.from('marketing_contacts')
    .update({ email_opt_in: false, unsubscribed_at: new Date().toISOString() })
    .eq('email', email);

  if (error) {
    console.error('unsubscribe failed', error);
    return page('We couldn&rsquo;t do that just now', 'Something went wrong on our end. Try the link again in a moment, or reply to any of our emails and we&rsquo;ll sort it out.');
  }

  return page('You&rsquo;re unsubscribed', 'We won&rsquo;t email you offers again. Any order confirmations you ask for will still come through.');
};
