/**
 * Generate the Supabase auth email templates from the site's own email shell.
 *
 * Supabase's auth emails are not sent by our code — they are HTML pasted into
 * the dashboard (Authentication → Emails), so without this they would be the
 * one place the brand silently doesn't apply, and the only copy of the design
 * would live in a textarea nobody can diff. Generating them from
 * `netlify/lib/email-shell.mjs` means the coupon email and these two cannot
 * drift apart.
 *
 *   node scripts/build-auth-emails.mjs
 *
 * writes `supabase-email-templates/*.html`. Paste each into the matching
 * template in the Supabase dashboard. They are checked in so a change is
 * reviewable, and `verify-blog.mjs` fails the build if they go stale.
 *
 * ⚠️ Two Supabase-specific rules:
 * - `{{ .Token }}` and `{{ .ConfirmationURL }}` are Go template tags. They
 *   must survive verbatim, so nothing may HTML-escape them.
 * - **Confirm signup carries the code and NO link.** A link opens a different
 *   tab, so the tab they signed up in never learns they confirmed and sits on
 *   "check your email" forever. See CLAUDE.md — this has bitten before.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  shell, BODY, DISPLAY, PROD, eyebrowRule, button, fine, para,
} from '../netlify/lib/email-shell.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase-email-templates');

const heading = (line1, line2) => `
        <tr><td class="pad" style="padding:26px 56px 0 56px;">
          <h1 class="h1 ink" style="margin:0;font-family:${DISPLAY};font-size:38px;line-height:44px;font-weight:400;color:#2C1A0E;letter-spacing:-.4px;mso-line-height-rule:exactly;">
            ${line1}<br><em style="font-style:italic;color:#C85478;">${line2}</em>
          </h1>
        </td></tr>`;

/* ---------------------------------------------------------- confirm signup */

const confirmRows = `
${heading('Nearly there,', 'just one code to go.')}
${fine('Enter this in the tab you signed up in and you&#39;re done &mdash; no need to sign in again.', 18)}
${eyebrowRule('Your code')}

        <tr><td class="pad" align="center" style="padding:22px 56px 22px 56px;">
          <!-- {{ .Token }} verbatim, and NO link anywhere in this email: a link
               opens a different tab, so the tab they signed up in never learns
               they confirmed and sits on "check your email" forever. That is
               the exact bug the code flow exists to avoid. -->
          <div class="code" style="font-family:${BODY};font-size:34px;line-height:40px;font-weight:500;letter-spacing:7px;color:#C85478;mso-line-height-rule:exactly;-webkit-user-select:all;-moz-user-select:all;-ms-user-select:all;user-select:all;white-space:nowrap;">{{ .Token }}</div>
        </td></tr>

        <tr><td class="pad" style="padding:0 56px;">
          <div class="rule" style="border-bottom:1px solid #EBD3DA;font-size:0;line-height:0;">&nbsp;</div>
        </td></tr>
${fine('The code expires in an hour. If you didn&#39;t create an account with us, you can ignore this &mdash; nothing was set up.')}`;

const confirm = shell({
  title: 'Confirm your email address',
  preheader: 'Your 8-digit code is inside. It expires in an hour.',
  rows: confirmRows,
});

/* ---------------------------------------------------------- reset password */

const reset = shell({
  title: 'Reset your password',
  preheader: 'A link to choose a new password. It expires in an hour.',
  rows: `
${heading('Let&#39;s get you', 'back in.')}
${para('Choose a new password and you&#39;re back to ordering cake.', 18)}
${button('{{ .ConfirmationURL }}', 'Choose a new password')}
${fine('The link expires in an hour and works once. If you didn&#39;t ask to reset your password, ignore this &mdash; your account is unchanged and your current password still works.', 28)}
${fine('Button not working? Paste this into your browser:<br><span style="word-break:break-all;color:#C85478;">{{ .ConfirmationURL }}</span>')}`,
  // Transactional. There is nothing to unsubscribe from, and offering it here
  // teaches people the link is meaningless.
});

/* ------------------------------------------------------------------ write */

mkdirSync(OUT, { recursive: true });
const files = [['confirm-signup.html', confirm], ['reset-password.html', reset]];
for (const [name, html] of files) {
  writeFileSync(join(OUT, name), html);
  console.log(`wrote supabase-email-templates/${name}  (${(html.length / 1024).toFixed(1)}kB)`);
}

// Cheap guards against the two ways this file breaks silently.
if (!confirm.includes('{{ .Token }}')) throw new Error('confirm-signup lost {{ .Token }}');
// Checked on the BODY only: the masthead's link home and the fonts <link>
// in <head> are both fine. What must not exist is a link in the message that
// navigates away and re-opens the confirmation in a second tab.
if (/href=/i.test(confirmRows))
  throw new Error('confirm-signup body must contain NO link — see CLAUDE.md on the stuck-tab bug');
if (!reset.includes('{{ .ConfirmationURL }}')) throw new Error('reset-password lost {{ .ConfirmationURL }}');
