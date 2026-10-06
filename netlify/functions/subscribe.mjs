/**
 * Newsletter signup from the popup. Email in, subscribed contact out, plus a
 * one-off welcome note from Tarun (`../lib/welcome-email.mjs`). No discount and
 * no code (Vaidik, 2026-10-06: the 10% welcome code was dropped).
 *
 * This is NOT account creation — it takes a name and an email and nothing
 * else. The popup that calls it is a subscribe form: its heading, its button
 * and the notice under it all say so, which is what makes this **express
 * consent** under the Spam Act rather than consent bundled into some other
 * action. That distinction is the whole reason there is no tickbox here: a
 * pre-ticked box beside a different primary action is what ACMA prohibits,
 * and a form whose only purpose is subscribing is the opposite of that.
 *
 * A Netlify Function rather than a browser write because `marketing_contacts`
 * is service-role-only — RLS with no write policy at all — and that is
 * deliberate.
 */
import { createClient } from '@supabase/supabase-js';
import { json } from '../lib/shared.mjs';
import { siteFor } from '../lib/email-shell.mjs';
import { unsubscribeUrl } from '../lib/unsubscribe.mjs';
import { welcomeEmail } from '../lib/welcome-email.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The exact words the subscriber agreed to, stored with the consent. */
const CONSENT_WORDING =
  'By submitting, you agree to receive marketing communications from ' +
  "Num Num's Bakery via email and confirm that you've read and understood " +
  'our Privacy Policy.';

/**
 * Send the welcome through Resend, from the verified domain the auth emails
 * already use (one sending reputation). Replies go to the shop inbox, because a
 * note signed by Tarun invites one.
 *
 * Returns false rather than throwing: the subscriber is already saved, and a
 * lost welcome is not worth telling them their signup failed.
 */
async function sendWelcome({ email, name, site }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('RESEND_API_KEY is not set — welcome not sent'); return false; }
  const unsub = unsubscribeUrl(email, site);
  const { subject, html, text } = welcomeEmail({ name, site, unsubscribeUrl: unsub });
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: "Tarun at Num Num's Bakery <orders@numnumsbakery.com.au>",
        reply_to: 'info.numnumsbakery@gmail.com',
        to: [email],
        subject,
        html,
        text,
        // One-click unsubscribe in Gmail and Apple Mail's own chrome, on top of
        // the footer link — Gmail expects it on marketing mail.
        headers: {
          'List-Unsubscribe': `<${unsub}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    });
    if (!res.ok) { console.error('resend refused', res.status, await res.text()); return false; }
    return true;
  } catch (e) {
    console.error('resend send failed', e);
    return false;
  }
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Malformed request.' }); }

  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json(400, { error: 'That email address does not look right.' });
  const name = String(body?.name ?? '').trim().slice(0, 80);

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const now = new Date().toISOString();

    // Welcome only someone who was not already on the list. A buyer's row
    // (written by fulfil.mjs) has no opt-in, and an unsubscribed one is
    // re-joining — both count as new. Resubmitting the popup does not.
    const { data: before } = await db.from('marketing_contacts')
      .select('email_opt_in,unsubscribed_at').eq('email', email).maybeSingle();
    const isNew = !before || !before.email_opt_in || !!before.unsubscribed_at;

    const { error } = await db.from('marketing_contacts').upsert({
      email,
      name: name || null,
      email_opt_in: true,
      // The popup asks for an email address and nothing else, so it carries no
      // consent for SMS. Leaving this false is the point, not an oversight.
      sms_opt_in: false,
      consent_at: now,
      consent_source: `promo-popup: ${CONSENT_WORDING}`,
      unsubscribed_at: null,
      updated_at: now,
    }, { onConflict: 'email' });
    // supabase-js reports a failed write in `error`, it does not throw — so
    // without this a refused upsert answered "subscribed" to someone who was not.
    if (error) throw error;

    if (isNew) await sendWelcome({ email, name, site: siteFor(req) });

    // No Make call: MAKE_ORDER_HOOK_URL feeds the web-order scenario, which
    // emails the shop "New web order" for every payload it receives.
    return json(200, { subscribed: true });
  } catch (e) {
    console.error('subscribe failed', e);
    return json(500, { error: 'Could not sign you up just then. Please try again.' });
  }
};
