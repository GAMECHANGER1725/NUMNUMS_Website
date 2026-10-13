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

export async function notifyStaff(db, store, message, { userId } = {}) {
  const key = process.env.VAPID_PRIVATE_KEY;
  if (!key) return [];
  webpush.setVapidDetails(SUBJECT, PUSH_PUBLIC_KEY, key);

  let q = db.from('push_subscriptions')
    .select('endpoint, p256dh, auth, profiles!inner(stores, role)')
    .in('profiles.role', NOTIFY_ROLES);
  q = userId ? q.eq('user_id', userId) : q.contains('profiles.stores', [store]);
  const { data, error } = await q;
  if (error) { console.error('push: could not read subscriptions', error); return []; }

  const seen = new Set();
  const subs = (data ?? []).filter((s) => !seen.has(s.endpoint) && seen.add(s.endpoint));
  const body = JSON.stringify(message);

  // Every answer is written onto the row (last_status/last_error). An iPhone
  // that stayed silent on the first live order left nothing behind but a
  // console line nobody reads, so FCM and Apple could not be told apart.
  return Promise.all(subs.map(async (s) => {
    const host = new URL(s.endpoint).host;
    let status, err = null;
    try {
      // A day of TTL: a phone that was off overnight still hears about it.
      ({ statusCode: status } = await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body, { TTL: 86_400, urgency: 'high' }));
    } catch (e) {
      status = e.statusCode ?? 0;
      err = String(e.body || e.message || e).slice(0, 300);
      console.error('push failed', host, status, err);
    }
    // 404/410 is the push service saying that phone unsubscribed or the app
    // was deleted. Drop it, or every order retries a dead endpoint forever.
    if (status === 404 || status === 410) {
      await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
    } else {
      await db.from('push_subscriptions')
        .update({ last_sent_at: new Date().toISOString(), last_status: status, last_error: err })
        .eq('endpoint', s.endpoint);
    }
    return { host, status, error: err };
  }));
}
