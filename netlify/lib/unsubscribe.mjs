/**
 * Signed unsubscribe links.
 *
 * A plain `?email=` link would let anyone unsubscribe anyone by guessing an
 * address, so the address is carried with an HMAC over it.
 *
 * The signing key is `SUPABASE_SERVICE_ROLE_KEY`. That is deliberate and not
 * laziness about key hygiene: it is already set on this site, it is
 * high-entropy, it never leaves the server, and an HMAC of it discloses
 * nothing about it. The alternative was a new secret, and env-var writes need
 * Vaidik at the dashboard — a link that cannot ship is worse than a key with
 * two jobs. If a dedicated `UNSUBSCRIBE_SECRET` ever exists, prefer it here;
 * old links stop working the day the service-role key rotates either way,
 * which is acceptable for a footer link people click once.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

const sign = (payload) => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createHmac('sha256', key).update(payload).digest('base64url').slice(0, 32);
};

/** `<base64url(email)>.<sig>` — opaque to the reader, verifiable by us. */
export const unsubscribeToken = (email) => {
  const p = b64url(String(email).trim().toLowerCase());
  return `${p}.${sign(p)}`;
};

export const unsubscribeUrl = (email) =>
  `https://numnumsbakery.com.au/unsubscribe?t=${encodeURIComponent(unsubscribeToken(email))}`;

/**
 * Returns the address, or null. Compared in constant time — a fast reject on
 * the first wrong byte is a signature oracle, and this one is cheap to avoid.
 */
export const emailFromToken = (token) => {
  const [p, sig] = String(token || '').split('.');
  if (!p || !sig) return null;
  let expected;
  try { expected = sign(p); } catch { return null; }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const email = Buffer.from(p, 'base64url').toString('utf8');
    return email.includes('@') ? email : null;
  } catch { return null; }
};
