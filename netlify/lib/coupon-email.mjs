/**
 * The coupon email — the 10% code, sent by `netlify/functions/subscribe.mjs`.
 *
 * The brand, the masthead, the footer and every colour live in
 * `email-shell.mjs`, which the two Supabase auth emails are built from as
 * well. Only what is specific to this message is here.
 *
 * `esc` runs over every interpolated value; `name` is customer-supplied and
 * reaches an HTML document, so this is the trust boundary.
 */
import {
  shell, esc, BODY, DISPLAY, PROD, eyebrowRule, button, fine, textFooter,
} from './email-shell.mjs';

export { siteFor } from './email-shell.mjs';

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

/**
 * Build the email. Returns the three parts Resend wants.
 *
 * `unsubscribeUrl` has no default on purpose: this is a commercial electronic
 * message under the Spam Act 2003, so it cannot go out without a working
 * unsubscribe facility, and a required parameter cannot be forgotten.
 */
export function couponEmail({ name, coupon, unsubscribeUrl, site = PROD }) {
  const hi = name ? `Hi ${esc(String(name).trim().split(/\s+/)[0])},` : 'Hi there,';
  const code = esc(coupon.code);
  const pct = Number(coupon.percent);
  const expires = prettyDate(coupon.expires_at);

  const rows = `
        <tr><td class="pad" style="padding:26px 56px 0 56px;">
          <p class="muted" style="margin:0 0 20px 0;font-family:${BODY};font-size:15px;line-height:22px;color:#5C3A22;">${hi}</p>
          <h1 class="h1 ink" style="margin:0;font-family:${DISPLAY};font-size:38px;line-height:44px;font-weight:400;color:#2C1A0E;letter-spacing:-.4px;mso-line-height-rule:exactly;">
            ${pct}% off,<br><em style="font-style:italic;color:#C85478;">whenever you&#39;re ready.</em>
          </h1>
        </td></tr>
${fine('Thanks for joining the list. Your code is below &mdash; it keeps, so there&#39;s no rush.', 18)}
${eyebrowRule('Your code')}

        <tr><td class="pad" align="center" style="padding:22px 56px 22px 56px;">
          <!-- Live text, and one tap selects the whole of it. An email cannot
               copy anything on its own (every client strips script tags), so
               the button beside it links to /coupon, which does the real
               clipboard write on tap.
               No backticks in this comment: it is inside a template literal. -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td class="code" align="center" style="font-family:${BODY};font-size:34px;line-height:40px;font-weight:500;letter-spacing:7px;color:#C85478;mso-line-height-rule:exactly;-webkit-user-select:all;-moz-user-select:all;-ms-user-select:all;user-select:all;white-space:nowrap;">${code}</td>
              <td width="14" style="font-size:0;line-height:0;">&nbsp;</td>
              <td valign="middle">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr><td align="center" style="border:1px solid #E6C3CE;border-radius:3px;">
                    <a href="${site}/coupon?c=${encodeURIComponent(coupon.code)}"
                       style="display:inline-block;padding:9px 14px;font-family:${BODY};font-size:11px;line-height:13px;font-weight:500;letter-spacing:1.2px;text-transform:uppercase;color:#C85478;text-decoration:none;white-space:nowrap;">Copy</a>
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td class="pad" style="padding:0 56px;">
          <div class="rule" style="border-bottom:1px solid #EBD3DA;font-size:0;line-height:0;">&nbsp;</div>
        </td></tr>
${expires ? `
        <tr><td class="pad" align="center" style="padding:16px 56px 0 56px;">
          <p class="muted" style="margin:0;font-family:${BODY};font-size:13px;line-height:18px;color:#8A6B55;font-weight:300;">Valid until ${esc(expires)}</p>
        </td></tr>` : ''}

        <!-- The two steps. This email's one genuinely confusing fact is that
             the code does not work yet, so it gets structure rather than small
             print — a code refused at checkout reads as a broken shop.
             Stacked, because it is a sequence, and because two columns need
             ghost-table scaffolding to survive Outlook and a 320px phone. -->
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
${fine('Check out with this same email address &mdash; the code is issued to you, not to the browser.')}
${button(`${site}/shop`, 'Browse the cakes')}`;

  const html = shell({
    title: `Your ${pct}% off code`,
    preheader: `${code} — your ${pct}% off code. It unlocks on your next order.`,
    site,
    rows,
    unsubscribe: unsubscribeUrl,
  });

  const text = [
    hi.replace(/&#39;/g, "'"),
    '',
    `${pct}% off, whenever you're ready.`,
    '',
    `Your code: ${coupon.code}`,
    expires ? `Valid until ${expires}` : null,
    `Copy it: ${site}/coupon?c=${encodeURIComponent(coupon.code)}`,
    '',
    `First, order a cake at the usual price. Then your ${pct}% comes off the next one.`,
    'Check out with this same email address - the code is issued to you, not to the browser.',
    '',
    `Browse the cakes: ${site}/shop`,
    '',
    textFooter(unsubscribeUrl),
  ].filter((l) => l !== null).join('\n');

  return { subject: `Your ${pct}% off code — ${coupon.code}`, html, text };
}
