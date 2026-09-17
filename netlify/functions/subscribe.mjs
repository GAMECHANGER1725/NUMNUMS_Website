/**
 * Newsletter signup from the offer popup. Email in, coupon code out.
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
 * and `coupons` are service-role-only — RLS with no write policy at all — and
 * that is deliberate. Nothing holding the publishable key gets to mint a
 * discount.
 */
import { createClient } from '@supabase/supabase-js';
import { json } from '../lib/shared.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERCENT = 10;
const EXPIRES_DAYS = 90;

/** The exact words the subscriber agreed to, stored with the consent. */
const CONSENT_WORDING =
  'By submitting, you agree to receive marketing communications from ' +
  "Num Num's Bakery via email and confirm that you've read and understood " +
  'our Privacy Policy.';

const newCode = () => 'NN-' + Math.random().toString(36).slice(2, 8).toUpperCase();

const esc = (s) => String(s).replace(/[<>&"]/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/**
 * Send the code to the address it is bound to.
 *
 * Resend over HTTP rather than SMTP: a function has no business opening an SMTP
 * connection, and this needs no dependency. The same verified domain the auth
 * emails use, so there is one sending reputation to look after, not two.
 *
 * Returns false rather than throwing — the caller has already written the
 * contact and the coupon, and needs to answer the customer either way.
 */
async function emailCode({ email, name, coupon }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('RESEND_API_KEY is not set — cannot send the coupon'); return false; }

  const hi = name ? `Hi ${esc(name)},` : 'Hi,';
  const html =
    `<p>${hi}</p>` +
    `<p>Thanks for joining the list. Here is your <b>${coupon.percent}% off</b> code:</p>` +
    `<p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:24px 0;">${esc(coupon.code)}</p>` +
    // Say the rule here, because this is where they read it. A code that is
    // silently refused at checkout reads as a broken shop, not as a condition.
    `<p>It applies to your <b>next order</b>, so it unlocks once you have ordered ` +
    `with us. Enter it at checkout with this same email address &mdash; the code ` +
    `is issued to one address.</p>` +
    `<p>Num Num&#39;s Bakery &mdash; 100% eggless cakes<br />Harris Park &amp; Riverstone</p>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: "Num Num's Bakery <orders@numnumsbakery.com.au>",
        to: [email],
        subject: `Your ${coupon.percent}% off code`,
        html,
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

    await db.from('marketing_contacts').upsert({
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

    // One live coupon per person. Re-subscribing hands back the code they
    // already have rather than minting another — otherwise clearing a cookie
    // and resubmitting is an unlimited discount printer.
    const { data: existing } = await db.from('coupons')
      .select('code,percent,expires_at')
      .eq('email', email)
      .is('redeemed_at', null)
      .gt('expires_at', now)
      .order('issued_at', { ascending: false })
      .limit(1);

    let coupon = existing?.[0];
    if (!coupon) {
      const row = {
        code: newCode(),
        email,
        percent: PERCENT,
        expires_at: new Date(Date.now() + EXPIRES_DAYS * 86_400_000).toISOString(),
      };
      const { error } = await db.from('coupons').insert(row);
      if (error) throw error;
      coupon = row;
    }

    // The code is EMAILED, never returned to the browser. Printing it on screen
    // made the whole offer free to mint: type any address, read the code off the
    // page, repeat. Sending it means you have to hold the inbox it was issued
    // to, which is the same address the code is bound to at checkout.
    const sent = await emailCode({ email, name, coupon });
    if (!sent) {
      // They are subscribed and the coupon exists, so say so honestly rather
      // than inventing a success. Submitting again returns the same live
      // coupon and retries the send — that is the recovery path.
      return json(502, {
        error: "You're subscribed, but we couldn't email your code just then. Try again in a moment.",
      });
    }

    // Best effort, and deliberately after the email: Make is a notification, not
    // the delivery mechanism.
    const hook = process.env.MAKE_ORDER_HOOK_URL;
    if (hook) {
      await fetch(hook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'newsletter-signup', name, email,
          coupon_code: coupon.code, coupon_expires_at: coupon.expires_at,
        }),
      }).catch((e) => console.error('make hook failed', e));
    }

    // No code in the response. The browser has nothing to leak.
    return json(200, { sent: true, percent: coupon.percent });
  } catch (e) {
    console.error('subscribe failed', e);
    return json(500, { error: 'Could not sign you up just then. Please try again.' });
  }
};
