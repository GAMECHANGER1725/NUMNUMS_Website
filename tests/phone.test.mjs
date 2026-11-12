/**
 * The phone assistant's rules (netlify/lib/phone.mjs). Run from verify-blog.mjs.
 *
 * What these guard: the secret check refuses an unset secret instead of
 * accepting anyone; spoken order numbers and phone numbers normalise the way
 * `orders.order_no` / `phone_key` store them; the custom-cake date rule is the
 * same 2-calendar-day Sydney rule as the shop and respects each shop's hours;
 * and nothing a caller said reaches the email unescaped or the lock screen at all.
 */
import assert from 'node:assert/strict';
import {
  authorised, SECRET_HEADER, orderNo, phoneKey, firstName, storeCode, localPhone,
  pickupProblem, spokenWhen, noteEmail, noteMessage,
} from '../netlify/lib/phone.mjs';

const req = (h) => new Request('https://x.test/', { headers: h });

// Secret: unset refuses everything, wrong refuses, right passes.
assert.equal(authorised(req({ [SECRET_HEADER]: 'abc' }), ''), false);
assert.equal(authorised(req({}), ''), false);
assert.equal(authorised(req({ [SECRET_HEADER]: 'abd' }), 'abc'), false);
assert.equal(authorised(req({}), 'abc'), false);
assert.equal(authorised(req({ [SECRET_HEADER]: 'abc' }), 'abc'), true);

// Order numbers as speech-to-text writes them.
for (const s of ['HP-1831', 'hp 1831', 'H P 1 8 3 1', 'hp1831']) assert.equal(orderNo(s), 'HP-1831', s);
assert.equal(orderNo('rv-1888'), 'RV-1888');
assert.equal(orderNo('XX-1831'), null);
assert.equal(orderNo('HP-18'), null);
assert.equal(orderNo(''), null);

// Phone: same last-nine rule as the generated phone_key column.
assert.equal(phoneKey('0412 345 678'), '412345678');
assert.equal(phoneKey('+61412345678'), '412345678');
assert.equal(phoneKey('12345'), null);
assert.equal(localPhone('+61412345678'), '0412345678');

// Names: first word, case and accents ignored, nothing fuzzier.
assert.equal(firstName('Priya Shah'), 'priya');
assert.equal(firstName('  PRIYA '), 'priya');
assert.equal(firstName('Pria'), 'pria');
assert.notEqual(firstName('Pria'), firstName('Priya'));
assert.equal(firstName(''), null);

assert.equal(storeCode('Harris Park'), 'harris-park');
assert.equal(storeCode('riverstone'), 'riverstone');
assert.equal(storeCode('Parramatta'), null);

// Custom-cake pickup rule. 2026-11-07 10:00 Sydney (AEDT, UTC+11) = 23:00 UTC the day before.
const now = new Date('2026-11-06T23:00:00Z');
assert.match(pickupProblem('harris-park', '2026-11-08', '12:00', now), /less than 2 days/);
assert.match(pickupProblem('harris-park', '2026-11-08', '12:00', now), /Monday 9 November/);
assert.equal(pickupProblem('harris-park', '2026-11-09', '12:00', now), null);
assert.equal(pickupProblem('harris-park', '2026-11-09', '22:00', now), null);       // close is bookable
assert.match(pickupProblem('harris-park', '2026-11-09', '10:30', now), /11:00 AM to 10:00 PM/);
assert.match(pickupProblem('riverstone', '2026-11-09', '19:00', now), /9:00 AM to 6:30 PM/);
assert.equal(pickupProblem('riverstone', '2026-11-09', '18:30', now), null);
assert.match(pickupProblem(null, '2026-11-09', '12:00', now), /which shop/);
assert.match(pickupProblem('riverstone', '2026-02-30', '12:00', now), /not understood/);
assert.match(pickupProblem('riverstone', '2026-11-09', '3pm', now), /not understood/);
// Late at night Sydney is still "today": 11:30pm Sat 7 Nov still offers Mon 9 Nov.
assert.equal(pickupProblem('riverstone', '2026-11-09', '12:00', new Date('2026-11-07T12:30:00Z')), null);

// Spoken pickup in Sydney time, not UTC.
assert.deepEqual(spokenWhen('2026-11-14T04:30:00Z'), { pickup_date: 'Saturday 14 November', pickup_time: '3:30 pm' });

// Email: caller text escaped, urgent flagged, no unsubscribe on a staff email.
const note = {
  kind: 'custom_cake', priority: 'urgent', store: 'riverstone', caller_name: '<b>Priya</b>',
  caller_phone: '0412345678', summary: 'Wants "<script>"', conversation_id: 'conv_1',
  details: { wording: 'Happy 50th <Mum>', has_photos: true, on_whatsapp: false },
};
const mail = noteEmail(note, 'https://numnumsbakery.com.au');
assert.match(mail.subject, /^\[URGENT\] Phone: Custom cake brief/);
assert.ok(!mail.html.includes('<script>') && !mail.html.includes('<Mum>') && !mail.html.includes('<b>Priya'));
assert.ok(mail.html.includes('Happy 50th &lt;Mum&gt;'));
// (the shell's own HTML comment mentions the word, so look for the link itself)
assert.ok(!/>Unsubscribe<\/a>/.test(mail.html) && !/unsubscribe/i.test(mail.text));
assert.match(mail.text, /On WhatsApp: No/);

// Lock screen: no phone number, no summary.
const push = noteMessage({ ...note, caller_name: 'Priya Shah', summary: 'call 0412345678' });
assert.ok(!JSON.stringify(push).includes('0412'));
assert.match(push.title, /URGENT/);
assert.match(push.body, /^Priya:/);

console.log('phone: secret check, normalising, 2-day/shop-hours rule, escaping and lock-screen privacy all hold');
