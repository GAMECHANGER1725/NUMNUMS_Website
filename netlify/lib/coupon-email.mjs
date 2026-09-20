/**
 * The coupon email.
 *
 * Built to the brand guide in `brand_assets/num_nums_brand_guidelines.html`:
 * Rose Petal #C85478, Vanilla Cream #FFF8F2, Soft Dough #F5EBE0, Dark Espresso
 * #2C1A0E, Warm Chestnut #5C3A22, Cormorant Garamond for display and Jost for
 * everything else. **No teal** — #4EC4D8 is Riverstone-only and this is a
 * global send. Jost is never set above 500, per the same guide, which is why
 * the code is tracked rather than bolded.
 *
 * Email is not the web and the differences here are all load-bearing:
 * - **Tables, not flex/grid.** Outlook renders through Word and ignores both.
 * - **Inline styles.** Several clients drop or rewrite a <style> block; the
 *   one in <head> carries only the media queries, which are a bonus not a
 *   dependency, so the mail is correct with the whole block thrown away.
 * - **The code is live text and never an image.** Images are blocked by
 *   default in a lot of inboxes, and a blocked image here is a customer with
 *   no code at all. The logo is the only image and its alt text is the
 *   wordmark, so a blocked-image render still reads as us.
 * - **A plain-text part is sent alongside.** HTML-only mail scores worse with
 *   spam filters and is unreadable in a text client.
 *
 * `esc` runs over every interpolated value. `name` is customer-supplied and
 * reaches an HTML document, so this is the trust boundary.
 */

const esc = (s) => String(s).replace(/[<>&"']/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));

const SITE = 'https://numnumsbakery.com.au';

// Sydney, because an expiry read in UTC can name the wrong day to a customer
// standing in the shop.
const prettyDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney',
  }).format(d);
};

const DISPLAY = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const BODY = "'Jost', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Build the email. Returns the three parts Resend wants.
 *
 * `unsubscribeUrl` is required rather than optional on purpose: this is a
 * commercial electronic message under the Spam Act 2003, so it cannot go out
 * without a working unsubscribe facility. Making it a parameter with no
 * default means a future caller cannot forget it by omission.
 */
export function couponEmail({ name, coupon, unsubscribeUrl }) {
  const hi = name ? `Hi ${esc(String(name).trim().split(/\s+/)[0])},` : 'Hi there,';
  const code = esc(coupon.code);
  const pct = Number(coupon.percent);
  const expires = prettyDate(coupon.expires_at);

  const preheader = `${code} — your ${pct}% off code. It unlocks on your next order.`;

  const html = `<!doctype html>
<html lang="en" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Your ${pct}% off code</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  /* Progressive only. Everything below degrades to the inline styles. */
  body { margin:0; padding:0; width:100% !important; }
  img { border:0; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
  table { border-collapse:collapse !important; }
  a { color:#C85478; }
  .lift { box-shadow: 0 1px 2px rgba(44,26,14,.04), 0 8px 24px -12px rgba(44,26,14,.16); }
  @media screen and (max-width:620px) {
    .wrap { width:100% !important; }
    .pad { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:30px !important; line-height:36px !important; }
    .code { font-size:26px !important; letter-spacing:4px !important; }
  }
  /* Apple Mail and iOS honour this. Gmail force-inverts on its own and
     ignores it, which is why no colour below is doing structural work —
     the mail is legible with this whole block dropped. */
  @media (prefers-color-scheme: dark) {
    .canvas { background:#17100A !important; }
    .card   { background:#241709 !important; }
    .panel  { background:#31200F !important; }
    .ink    { color:#FFF8F2 !important; }
    .muted  { color:#D9C6B6 !important; }
    /* The footer sits on the canvas, so its espresso ink vanishes without
       this — it was the one thing genuinely broken in dark mode. */
    .foot-display { color:#FFF8F2 !important; }
    .foot         { color:#C9B4A3 !important; }
    .foot a       { color:#C9B4A3 !important; }
    .rule         { border-color:#4A3423 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#FFF8F2;">

<div style="display:none;font-size:1px;color:#FFF8F2;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

<table role="presentation" class="canvas" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF8F2;">
<tr><td align="center" style="padding:32px 12px 48px 12px;">

  <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

    <!-- The card -->
    <tr><td class="card lift" style="background:#FFFFFF;border-radius:4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

        <!-- A 3px rose cap instead of a border all the way round: the guide's
             pink-first rule, stated once, rather than a box shouting it. -->
        <tr><td style="background:#C85478;height:3px;line-height:3px;font-size:3px;border-radius:4px 4px 0 0;">&nbsp;</td></tr>

        <!-- Masthead sits ON the card, not above it: the logo file has a white
             plate baked in (no alpha), which shows as a pale square against the
             cream canvas and reads as a mistake. On white it is invisible.
             Alt text is the wordmark, so images-off still reads as us. -->
        <tr><td align="center" style="padding:32px 24px 4px 24px;">
          <!-- The white plate is padded and rounded rather than fought: on the
               white card it is invisible, and in dark mode it reads as a
               deliberate badge instead of a bare rectangle with a hard edge.
               Flood-filling the plate out was the alternative and it costs the
               wordmark, which is dark red and disappears on dark brown. -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border-radius:10px;">
            <tr><td style="padding:10px 14px;">
              <a href="${SITE}" style="text-decoration:none;">
                <img src="${SITE}/brand_assets/email-logo.png" width="176" alt="Num Num&#39;s Bakery"
                     style="display:block;width:176px;max-width:176px;height:auto;border:0;font-family:${DISPLAY};font-size:21px;color:#2C1A0E;">
              </a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td class="pad" style="padding:26px 56px 8px 56px;">
          <p class="muted" style="margin:0 0 20px 0;font-family:${BODY};font-size:15px;line-height:22px;color:#5C3A22;">${hi}</p>
          <h1 class="h1 ink" style="margin:0;font-family:${DISPLAY};font-size:38px;line-height:44px;font-weight:400;color:#2C1A0E;letter-spacing:-.4px;mso-line-height-rule:exactly;">
            ${pct}% off,<br><em style="font-style:italic;color:#C85478;">whenever you&#39;re ready.</em>
          </h1>
          <p class="muted" style="margin:18px 0 0 0;font-family:${BODY};font-size:15px;line-height:24px;color:#5C3A22;font-weight:300;">
            Thanks for joining the list. Your code is below &mdash; it keeps, so there&#39;s no rush.
          </p>
        </td></tr>

        <!-- Signature element: the code sits between two rose hairlines with a
             small-caps eyebrow interrupting the top one. That is the site's own
             .section-label device, and it is deliberately NOT the dashed ticket
             box every other bakery's coupon email draws. -->
        <tr><td class="pad" style="padding:34px 56px 0 56px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="30%" class="rule" style="border-bottom:1px solid #EBD3DA;font-size:0;line-height:0;">&nbsp;</td>
              <td align="center" style="padding:0 12px;font-family:${BODY};font-size:10px;line-height:12px;letter-spacing:2.4px;text-transform:uppercase;color:#C85478;font-weight:500;white-space:nowrap;">Your code</td>
              <td width="30%" class="rule" style="border-bottom:1px solid #EBD3DA;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
        </td></tr>

        <tr><td class="pad" align="center" style="padding:22px 56px 22px 56px;">
          <!-- Live text, selectable and copyable. Jost at 500, tracked wide —
               the guide forbids bold on Jost, and tracking reads better on a
               string somebody has to transcribe anyway. -->
          <div class="code" style="font-family:${BODY};font-size:34px;line-height:40px;font-weight:500;letter-spacing:7px;color:#C85478;mso-line-height-rule:exactly;">${code}</div>
        </td></tr>

        <tr><td class="pad" style="padding:0 56px;">
          <div class="rule" style="border-bottom:1px solid #EBD3DA;font-size:0;line-height:0;">&nbsp;</div>
        </td></tr>

        ${expires ? `<tr><td class="pad" align="center" style="padding:16px 56px 0 56px;">
          <p class="muted" style="margin:0;font-family:${BODY};font-size:13px;line-height:18px;color:#8A6B55;font-weight:300;">Valid until ${esc(expires)}</p>
        </td></tr>` : ''}

        <!-- The two steps. This email's one genuinely confusing fact is that
             the code does not work yet, so it gets structure rather than a
             sentence of small print near the bottom. A code refused at
             checkout reads as a broken shop.

             Stacked, in one panel, rather than two columns side by side: it is
             a sequence, so top-to-bottom is the honest reading, and it needs
             none of the ghost-table/inline-block scaffolding a two-column row
             takes to survive Outlook and a 320px phone. -->
        <tr><td class="pad" style="padding:34px 56px 0 56px;">
          <table role="presentation" class="panel" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5EBE0;border-radius:3px;">
            <tr><td style="padding:18px 22px 14px 22px;">
              <p style="margin:0 0 4px 0;font-family:${BODY};font-size:10px;line-height:12px;letter-spacing:2.2px;text-transform:uppercase;color:#C85478;font-weight:500;">First</p>
              <p class="ink" style="margin:0;font-family:${BODY};font-size:15px;line-height:22px;color:#2C1A0E;font-weight:300;">Order a cake at the usual price.</p>
            </td></tr>
            <tr><td style="padding:0 22px;"><div class="rule" style="border-bottom:1px solid #E4D2C2;font-size:0;line-height:0;">&nbsp;</div></td></tr>
            <tr><td style="padding:14px 22px 18px 22px;">
              <p style="margin:0 0 4px 0;font-family:${BODY};font-size:10px;line-height:12px;letter-spacing:2.2px;text-transform:uppercase;color:#C85478;font-weight:500;">Then</p>
              <p class="ink" style="margin:0;font-family:${BODY};font-size:15px;line-height:22px;color:#2C1A0E;font-weight:300;">Your ${pct}% comes off the next one.</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td class="pad" style="padding:16px 56px 0 56px;">
          <p class="muted" style="margin:0;font-family:${BODY};font-size:13px;line-height:20px;color:#8A6B55;font-weight:300;">
            Check out with this same email address &mdash; the code is issued to you, not to the browser.
          </p>
        </td></tr>

        <!-- Bulletproof button: a table cell with a background, so Outlook
             renders the whole shape rather than a bare link. -->
        <tr><td class="pad" style="padding:32px 56px 48px 56px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" bgcolor="#C85478" style="background:#C85478;border-radius:3px;">
              <a href="${SITE}/shop" style="display:inline-block;padding:15px 34px;font-family:${BODY};font-size:14px;line-height:18px;font-weight:500;letter-spacing:1.4px;text-transform:uppercase;color:#FFF8F2;text-decoration:none;">Browse the cakes</a>
            </td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>

    <!-- Footer. Sender identity and the unsubscribe are a Spam Act 2003
         obligation on a commercial message, not decoration. -->
    <tr><td style="padding:36px 8px 0 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" class="pad foot" style="padding:0 24px;">
          <p class="foot-display" style="margin:0 0 4px 0;font-family:${DISPLAY};font-size:19px;line-height:26px;color:#2C1A0E;font-style:italic;">100% eggless. Made fresh daily.</p>
          <p class="foot" style="margin:0 0 16px 0;font-family:${BODY};font-size:13px;line-height:21px;color:#5C3A22;font-weight:300;">
            Harris Park &middot; Shop 1, 96&ndash;98 Wigram Street<br>
            Riverstone &middot; Shop 8, Riverstone Shopping Centre
          </p>
          <p class="foot" style="margin:0 0 14px 0;font-family:${BODY};font-size:12px;line-height:19px;color:#8A6B55;font-weight:300;">
            GNT Ventures Pty Ltd &middot; ABN 39 634 402 412
          </p>
          <p class="foot" style="margin:0;font-family:${BODY};font-size:12px;line-height:19px;color:#8A6B55;font-weight:300;">
            You&#39;re getting this because you asked for a discount code at numnumsbakery.com.au.<br>
            <a href="${esc(unsubscribeUrl)}" style="color:#8A6B55;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;

  const text = [
    hi.replace(/&#39;/g, "'"),
    '',
    `${pct}% off, whenever you're ready.`,
    '',
    `Your code: ${coupon.code}`,
    expires ? `Valid until ${expires}` : null,
    '',
    `First, order a cake at the usual price. Then your ${pct}% comes off the next one.`,
    'Check out with this same email address - the code is issued to you, not to the browser.',
    '',
    `Browse the cakes: ${SITE}/shop`,
    '',
    '--',
    "Num Num's Bakery - 100% eggless, made fresh daily",
    'Harris Park, Shop 1, 96-98 Wigram Street',
    'Riverstone, Shop 8, Riverstone Shopping Centre',
    'GNT Ventures Pty Ltd, ABN 39 634 402 412',
    '',
    "You're getting this because you asked for a discount code at numnumsbakery.com.au.",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].filter((l) => l !== null).join('\n');

  return { subject: `Your ${pct}% off code — ${coupon.code}`, html, text };
}
