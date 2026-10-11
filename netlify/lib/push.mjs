/**
 * A phone notification for every paid web order (Vaidik, 2026-10-11: Dad reads
 * Gmail every 2-3 days, so an emailed order can sit unseen until pickup).
 *
 * Who gets it: every phone that turned the bell on in ops (`push_subscriptions`)
 * whose owner is an admin or the baker (Vaidik, 2026-10-11: not counter staff)
 * and can see the order's store (`profiles.stores`). The role check lives here,
 * not only in the hidden bell, because this is the gate that sends. A shared tablet
 * signed up by two people rings once, so endpoints are deduped.
 *
 * Never allowed to fail the order: the row is already written and the emails
 * already sent. A missing VAPID_PRIVATE_KEY means "not set up yet", not an error.
 */
import webpush from 'web-push';
import { PUSH_PUBLIC_KEY } from '../../ops/catalog.mjs';

const SUBJECT = 'mailto:info.numnumsbakery@gmail.com';
export const NOTIFY_ROLES = ['admin', 'baker'];

export async function notifyStaff(db, store, message) {
  const key = process.env.VAPID_PRIVATE_KEY;
  if (!key) return 0;
  webpush.setVapidDetails(SUBJECT, PUSH_PUBLIC_KEY, key);

  const { data, error } = await db.from('push_subscriptions')
    .select('endpoint, p256dh, auth, profiles!inner(stores, role)')
    .in('profiles.role', NOTIFY_ROLES)
    .contains('profiles.stores', [store]);
  if (error) { console.error('push: could not read subscriptions', error); return 0; }

  const seen = new Set();
  const subs = (data ?? []).filter((s) => !seen.has(s.endpoint) && seen.add(s.endpoint));
  const body = JSON.stringify(message);

  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      // A day of TTL: a phone that was off overnight still hears about it.
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body, { TTL: 86_400, urgency: 'high' });
      sent++;
    } catch (e) {
      // 404/410 is the push service saying that phone unsubscribed or the app
      // was deleted. Drop it, or every order retries a dead endpoint forever.
      if (e.statusCode === 404 || e.statusCode === 410) {
        await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      } else {
        console.error('push failed', e.statusCode, e.body);
      }
    }
  }));
  return sent;
}
