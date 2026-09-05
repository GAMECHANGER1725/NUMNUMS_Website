// Run: node ops/stats.test.mjs
// The one check behind the ops app. If the aggregation or the Sydney date
// handling breaks, the app reports confident wrong numbers, which is worse
// than the guessing it replaced — so this guards exactly that.

import assert from 'node:assert/strict';
import {
  sydneyParts, daysBetween, dayBucket, weekStartKey, paidOn,
  summarise, weeklyStats, busiestHours, normalisePhone,
  repeatCustomers, bakerSections, monthGrid, shiftMonth, sydneyDateTimeToISO,
  dayLabel, soldWithin, salesByWeek, logSections, inDateRange, inStoreTally,
  missingPrice, searchOrders, phoneKey,
  byWeekday, leadTimes, missingPhone, weekdayIndex, WEEKDAYS, printSections,
  storeBreakdown, exportRanges, csvCell, toCsv,
  dailyTakings, weeklyByStore, customerLeaderboard,
} from './stats.mjs';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; }
  catch (err) { console.error(`FAIL  ${name}\n      ${err.message}`); process.exitCode = 1; }
};

// ── Sydney day boundaries ───────────────────────────────────────────────────
// Sept is AEST (UTC+10). 14:30Z is already tomorrow in Sydney; 13:30Z is not.
test('UTC evening is already the next day in Sydney', () => {
  assert.equal(sydneyParts('2026-09-02T14:30:00Z').dayKey, '2026-09-03');
  assert.equal(sydneyParts('2026-09-02T13:30:00Z').dayKey, '2026-09-02');
});

test('local clock hour is Sydney time, not UTC', () => {
  assert.equal(sydneyParts('2026-09-02T13:00:00Z').hour, 23);
  assert.equal(sydneyParts('2026-09-02T14:00:00Z').hour, 0);
});

// DST begins Sun 4 Oct 2026 (AEST +10 → AEDT +11). These two instants are 47
// real hours apart but three calendar days, so anything dividing milliseconds
// by 86400000 lands on "Tomorrow" and puts the cake in the wrong section.
test('day counting survives the DST changeover', () => {
  const now = '2026-10-03T09:00:00Z'; // Sat 3 Oct, 19:00 AEST
  const due = '2026-10-05T08:00:00Z'; // Mon 5 Oct, 19:00 AEDT
  assert.equal(sydneyParts(now).dayKey, '2026-10-03');
  assert.equal(sydneyParts(due).dayKey, '2026-10-05');
  assert.equal(daysBetween('2026-10-03', '2026-10-05'), 2);
  assert.equal(dayBucket(due, now), 'In 2 days');
});

test('day buckets label the baker sections', () => {
  const now = '2026-09-02T04:00:00Z'; // Wed 2 Sep, 14:00 AEST
  assert.equal(dayBucket('2026-09-02T12:59:00Z', now), 'Today');    // 22:59 tonight
  assert.equal(dayBucket('2026-09-03T06:00:00Z', now), 'Tomorrow');
  assert.equal(dayBucket('2026-09-05T06:00:00Z', now), 'In 3 days');
  assert.equal(dayBucket('2026-09-01T06:00:00Z', now), 'Overdue');
});

test('a cake due late tonight is Today, not Tomorrow', () => {
  // 2026-09-02T13:00:00Z is 23:00 Wed in Sydney but already Thursday in UTC.
  assert.equal(dayBucket('2026-09-02T13:00:00Z', '2026-09-02T04:00:00Z'), 'Today');
});

test('weeks start Monday in Sydney', () => {
  assert.equal(weekStartKey('2026-09-03T06:00:00Z'), '2026-08-31'); // Thu → Mon
  assert.equal(weekStartKey('2026-08-31T06:00:00Z'), '2026-08-31'); // Mon → itself
  // Sun 6 Sep 22:00 AEST is Monday in UTC — must stay in the week that is ending.
  assert.equal(weekStartKey('2026-09-06T12:00:00Z'), '2026-08-31');
});

// ── Money ───────────────────────────────────────────────────────────────────
const sample = [
  { status: 'placed',    price: 100, deposit: 30, cost: 40,   due_at: '2026-09-03T06:00:00Z', customer_phone: '0425 697 725', customer_name: 'Sharma', kind: 'custom' },
  { status: 'placed',    price:  50, deposit:  0, cost: null, due_at: '2026-09-04T06:00:00Z', customer_phone: '+61425697725', customer_name: 'Sharma', kind: 'normal' },
  { status: 'picked_up', price:  80, deposit: 20, cost: 30,   due_at: '2026-09-02T23:00:00Z', customer_phone: '0400111222',   customer_name: 'Patel',  kind: 'normal' },
  { status: 'cancelled', price: 999, deposit: 999, cost: 999, due_at: '2026-09-03T06:00:00Z', customer_phone: '0400999999',   customer_name: 'Ghost',  kind: 'custom' },
];

test('a collected cake counts as paid in full, not just its deposit', () => {
  assert.equal(paidOn({ status: 'picked_up', price: 80, deposit: 20 }), 80);
  assert.equal(paidOn({ status: 'placed',    price: 80, deposit: 20 }), 20);
});

test('cancelled orders are excluded from every total', () => {
  const s = summarise(sample);
  assert.equal(s.count, 3);
  assert.equal(s.revenue, 230);
});

test('revenue counts uncosted orders, margin does not', () => {
  const s = summarise(sample);
  assert.equal(s.revenue, 230);       // includes the $50 with no cost
  assert.equal(s.costedCount, 2);
  assert.equal(s.cost, 70);
  assert.equal(s.margin, 110);        // (100 + 80) − 70, the $50 left out
  assert.ok(Math.abs(s.marginPct - 61.1111) < 0.001);
});

test('owing is revenue less what has actually been paid', () => {
  const s = summarise(sample);
  assert.equal(s.collected, 110);     // 30 + 0 + 80 (picked up in full)
  assert.equal(s.owing, 120);
});

test('average order value ignores cancellations', () => {
  assert.ok(Math.abs(summarise(sample).avgOrder - 230 / 3) < 1e-9);
});

test('an empty week reports zero, not NaN', () => {
  const s = summarise([]);
  assert.equal(s.count, 0);
  assert.equal(s.avgOrder, 0);
  assert.equal(s.margin, null);
});

test('weeks split by pickup date', () => {
  const w = weeklyStats(sample, '2026-09-02T04:00:00Z');
  assert.equal(w.thisWeekKey, '2026-08-31');
  assert.equal(w.lastWeekKey, '2026-08-24');
  assert.equal(w.thisWeek.count, 3);
  assert.equal(w.lastWeek.count, 0);
});

// ── Customers ───────────────────────────────────────────────────────────────
test('the same number typed three ways is one customer', () => {
  assert.equal(normalisePhone('0425 697 725'), '0425697725');
  assert.equal(normalisePhone('+61 425 697 725'), '0425697725');
  assert.equal(normalisePhone('0061425697725'), '0425697725');
  assert.equal(normalisePhone('(02) 9633 1234'), '0296331234');
  assert.equal(normalisePhone(''), null);
  assert.equal(normalisePhone(null), null);
});

test('repeat customers are found across phone formats', () => {
  const r = repeatCustomers(sample);
  assert.equal(r.returningCount, 1);          // Sharma, two formats, one person
  assert.equal(r.newCount, 1);                // Patel
  assert.equal(r.top[0].orders, 2);
  assert.equal(r.top[0].spend, 150);
});

// ── Baker view ──────────────────────────────────────────────────────────────
test('custom cakes come before normal ones within the queue', () => {
  const sections = bakerSections(sample.filter((o) => o.status === 'placed'),
                                 '2026-09-02T04:00:00Z');
  const labels = sections.map(([label]) => label);
  assert.deepEqual(labels, ['Tomorrow', 'In 2 days']);
  assert.equal(sections[0][1][0].kind, 'custom');
});

test('overdue cakes sort to the top of the baker list', () => {
  const orders = [
    { kind: 'normal', status: 'placed', due_at: '2026-09-05T06:00:00Z' },
    { kind: 'normal', status: 'placed', due_at: '2026-08-30T06:00:00Z' },
  ];
  const labels = bakerSections(orders, '2026-09-02T04:00:00Z').map(([l]) => l);
  assert.equal(labels[0], 'Overdue');
});

test('pickup hours histogram uses Sydney time', () => {
  const h = busiestHours([{ status: 'placed', due_at: '2026-09-02T06:00:00Z' }]); // 16:00 AEST
  assert.equal(h[16], 1);
  assert.equal(h.reduce((a, b) => a + b, 0), 1);
});

// ── Date picker ─────────────────────────────────────────────────────────────
test('month grid is six Sunday-start weeks with the month marked', () => {
  const g = monthGrid(2026, 9);              // Sep 2026 starts on a Tuesday
  assert.equal(g.length, 6);
  assert.ok(g.every((w) => w.length === 7));
  assert.equal(g[0][0].key, '2026-08-30');   // leading Sunday from August
  assert.equal(g[0][0].inMonth, false);
  assert.equal(g[0][2].key, '2026-09-01');   // the 1st lands on Tuesday
  assert.equal(g[0][2].inMonth, true);
  assert.equal(g[0][2].day, 1);
});

test('month grid holds its shape across a year boundary', () => {
  const dec = monthGrid(2026, 12);
  assert.equal(dec.length, 6);
  assert.ok(dec.flat().some((d) => d.key === '2026-12-31' && d.inMonth));
  assert.ok(dec.flat().some((d) => d.key.startsWith('2027-01')));
});

test('stepping months rolls the year over', () => {
  assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  assert.deepEqual(shiftMonth(2026, 1, -1), { year: 2025, month: 12 });
  assert.deepEqual(shiftMonth(2026, 9, 3), { year: 2026, month: 12 });
});

test('picked wall-clock time round-trips to the same Sydney time', () => {
  // AEST (+10)
  const a = sydneyDateTimeToISO('2026-09-03', 15, 30);
  const pa = sydneyParts(a);
  assert.equal(pa.dayKey, '2026-09-03');
  assert.equal(pa.hour, 15);
  assert.equal(pa.minute, 30);

  // AEDT (+11), after the October changeover — a fixed +10 would be an hour out
  const b = sydneyDateTimeToISO('2026-10-05', 19, 0);
  const pb = sydneyParts(b);
  assert.equal(pb.dayKey, '2026-10-05');
  assert.equal(pb.hour, 19);
});

test('a late-evening pickup does not slide into the next day', () => {
  // 11pm Sydney is already tomorrow in UTC; the stored instant must still read
  // back as 11pm on the chosen day.
  const iso = sydneyDateTimeToISO('2026-09-03', 23, 0);
  assert.ok(iso.endsWith('Z'));
  assert.equal(sydneyParts(iso).dayKey, '2026-09-03');
  assert.equal(sydneyParts(iso).hour, 23);
  assert.equal(dayBucket(iso, sydneyDateTimeToISO('2026-09-03', 9, 0)), 'Today');
});

// ── Sales windows (regression: the "0 orders" bug) ──────────────────────────
// A Harris Park order was logged and marked picked up, yet "By store, last 7
// days" showed 0. Cause: the window filtered on due_at, so a cake booked today
// for a pickup even one day out fell outside "the last 7 days" entirely.
test('an order sold today counts today, whatever its pickup date', () => {
  const now = '2026-09-03T09:00:00Z';                      // Thu 3 Sep, 7pm Sydney
  const orders = [
    { status: 'picked_up', price: 56, deposit: 20, store: 'harris-park',
      created_at: '2026-09-03T09:41:00Z', due_at: '2026-09-04T05:00:00Z' },   // due TOMORROW
    { status: 'placed', price: 320, deposit: 100, store: 'harris-park',
      created_at: '2026-09-03T02:00:00Z', due_at: '2026-10-01T05:00:00Z' },   // due in a MONTH
  ];
  const sold = soldWithin(orders, 7, now);
  assert.equal(sold.length, 2, 'both sales happened today');
  assert.equal(summarise(sold).revenue, 376);

  // The old due_at-based window found neither of them.
  const oldWay = orders.filter((o) => {
    const d = daysBetween(sydneyParts(o.due_at).dayKey, sydneyParts(now).dayKey);
    return d >= 0 && d < 7;
  });
  assert.equal(oldWay.length, 0, 'demonstrates the original bug');
});

test('sales windows exclude anything sold before the window', () => {
  const now = '2026-09-10T02:00:00Z';
  const orders = [
    { status: 'placed', price: 10, deposit: 0, created_at: '2026-09-09T02:00:00Z', due_at: '2026-09-20T02:00:00Z' },
    { status: 'placed', price: 20, deposit: 0, created_at: '2026-09-01T02:00:00Z', due_at: '2026-09-20T02:00:00Z' },
  ];
  assert.equal(soldWithin(orders, 7, now).length, 1);
  assert.equal(summarise(soldWithin(orders, 7, now)).revenue, 10);
});

test('week over week compares sales, not pickups', () => {
  const now = '2026-09-03T02:00:00Z';                       // Thu 3 Sep, week of Mon 31 Aug
  const orders = [
    { status: 'placed', price: 100, deposit: 0, created_at: '2026-09-01T02:00:00Z', due_at: '2026-12-01T02:00:00Z' },
    { status: 'placed', price: 50,  deposit: 0, created_at: '2026-08-26T02:00:00Z', due_at: '2026-09-02T02:00:00Z' },
  ];
  const w = salesByWeek(orders, now);
  assert.equal(w.thisWeek.revenue, 100);   // sold Tue this week, due December
  assert.equal(w.lastWeek.revenue, 50);    // sold last week, due this week
});

test('orders with no price are flagged so revenue is not silently understated', () => {
  const orders = [
    { status: 'placed', price: null },
    { status: 'placed', price: 56 },
    { status: 'cancelled', price: null },
  ];
  assert.equal(missingPrice(orders).length, 1);
});

// ── Order log day sections ──────────────────────────────────────────────────
test('the log names every day instead of lumping into This week / Later', () => {
  const now = '2026-09-03T02:00:00Z';   // Thu 3 Sep, noon Sydney
  const at = (d, h = 5) => `2026-09-${String(d).padStart(2, '0')}T0${h}:00:00Z`;
  const orders = [
    { status: 'placed', due_at: at(2) },   // yesterday
    { status: 'placed', due_at: at(3) },   // today
    { status: 'placed', due_at: at(4) },   // tomorrow
    { status: 'placed', due_at: at(5) },
    { status: 'placed', due_at: at(9) },   // 6 days out
  ];
  const labels = logSections(orders, now).map(([l]) => l);
  assert.deepEqual(labels, ['Overdue', 'Today', 'Tomorrow', 'In 2 days', 'In 6 days']);
});

test('"In 1 day" is never rendered as "In 1 days"', () => {
  assert.equal(dayLabel(1), 'Tomorrow');
  assert.equal(dayLabel(2), 'In 2 days');
  assert.equal(dayLabel(0), 'Today');
  assert.equal(dayLabel(-3), 'Overdue');
});

test('every overdue day collapses into one section at the top', () => {
  const now = '2026-09-10T02:00:00Z';
  const orders = [
    { status: 'placed', due_at: '2026-09-01T05:00:00Z' },
    { status: 'placed', due_at: '2026-09-08T05:00:00Z' },
    { status: 'placed', due_at: '2026-09-10T05:00:00Z' },
  ];
  const sections = logSections(orders, now);
  assert.equal(sections[0][0], 'Overdue');
  assert.equal(sections[0][1].length, 2);
  assert.equal(sections[1][0], 'Today');
});

test('collected orders sit last and drop off after a week', () => {
  const now = '2026-09-10T02:00:00Z';
  const orders = [
    { status: 'picked_up', due_at: '2026-09-08T05:00:00Z' },  // 2 days ago, keep
    { status: 'picked_up', due_at: '2026-08-20T05:00:00Z' },  // 21 days ago, drop
    { status: 'placed',    due_at: '2026-09-10T05:00:00Z' },
  ];
  const sections = logSections(orders, now);
  assert.equal(sections[sections.length - 1][0], 'Collected');
  assert.equal(sections[sections.length - 1][1].length, 1);
});

test('cancelled orders get their own section, after collected', () => {
  const now = '2026-09-10T02:00:00Z';
  const orders = [
    { id: 'a', status: 'picked_up', due_at: '2026-09-08T05:00:00Z' },
    { id: 'b', status: 'cancelled', due_at: '2026-09-09T05:00:00Z' },
    { id: 'c', status: 'cancelled', due_at: '2026-08-20T05:00:00Z' },  // aged out
    { id: 'd', status: 'placed',    due_at: '2026-09-10T05:00:00Z' },
  ];
  const labels = logSections(orders, now).map(([l]) => l);
  assert.deepEqual(labels, ['Today', 'Collected', 'Cancelled']);
  const cancelled = logSections(orders, now).find(([l]) => l === 'Cancelled')[1];
  assert.deepEqual(cancelled.map((o) => o.id), ['b']);
});

test('a date range filters by pickup day inclusively, either way round', () => {
  const orders = [
    { due_at: '2026-09-03T05:00:00Z' },
    { due_at: '2026-09-05T05:00:00Z' },
    { due_at: '2026-09-09T05:00:00Z' },
  ];
  assert.equal(inDateRange(orders, '2026-09-03', '2026-09-05').length, 2);
  assert.equal(inDateRange(orders, '2026-09-05', '2026-09-03').length, 2); // reversed
  assert.equal(inDateRange(orders, '2026-09-05', '2026-09-05').length, 1); // single day
});

// ── In-store tally ──────────────────────────────────────────────────────────
test('counter sales tally by size and flavour for the day', () => {
  const orders = [
    { walk_in: true,  status: 'picked_up', size: '6 inch', flavour: 'Chocolate', price: 39.99, created_at: '2026-09-03T02:00:00Z', store: 'harris-park' },
    { walk_in: true,  status: 'picked_up', size: '6 inch', flavour: 'Chocolate', price: 39.99, created_at: '2026-09-03T04:00:00Z', store: 'harris-park' },
    { walk_in: true,  status: 'picked_up', size: 'Slice',  flavour: 'Rasmalai',  price: 8,     created_at: '2026-09-03T05:00:00Z', store: 'riverstone' },
    { walk_in: false, status: 'picked_up', size: '8 inch', flavour: 'Mango',     price: 49.99, created_at: '2026-09-03T05:00:00Z', store: 'harris-park' },
    { walk_in: true,  status: 'picked_up', size: '6 inch', flavour: 'Chocolate', price: 39.99, created_at: '2026-09-02T02:00:00Z', store: 'harris-park' },
  ];
  const t = inStoreTally(orders, '2026-09-03');
  assert.equal(t.count, 3, 'ordered-ahead cakes and other days are excluded');
  assert.ok(Math.abs(t.revenue - 87.98) < 1e-9);
  assert.equal(t.rows[0].count, 2);
  assert.equal(t.rows[0].flavour, 'Chocolate');
  assert.equal(t.rows[0].size, '6 inch');

  const hp = inStoreTally(orders, '2026-09-03', { store: 'harris-park' });
  assert.equal(hp.count, 2, 'can be scoped to one store');
});

test('a day with no counter sales tallies to zero, not NaN', () => {
  const t = inStoreTally([], '2026-09-03');
  assert.equal(t.count, 0);
  assert.equal(t.revenue, 0);
  assert.deepEqual(t.rows, []);
});

// ── Search ──────────────────────────────────────────────────────────────────
const book = [
  { order_no: 'HP-0007', customer_name: 'Sush Chinna',  customer_phone: '0455 667 788', flavour: 'Red Velvet', size: '6 inch', wording: 'Happy Birthday Sush' },
  { order_no: 'RV-0002', customer_name: 'Rahul Mehta',  customer_phone: '+61499001122', flavour: 'Mud Cake',   size: '8 inch', wording: 'Happy Birthday Ananya' },
  { order_no: 'HP-0010', customer_name: 'Gurpreet Kaur', customer_phone: null,          flavour: 'Rasmalai',   size: '12 inch', wording: 'Happy Engagement' },
];

test('phone keys ignore how the number was typed', () => {
  assert.equal(phoneKey('0425 697 725'), '425697725');
  assert.equal(phoneKey('+61 425 697 725'), '425697725');
  assert.equal(phoneKey('(02) 9633 1234'), '296331234');
  assert.equal(phoneKey('123'), null);
  assert.equal(phoneKey(null), null);
});

test('search finds an order by any part of the name', () => {
  assert.equal(searchOrders(book, 'sush').length, 1);
  assert.equal(searchOrders(book, 'MEHTA').length, 1);
  assert.equal(searchOrders(book, 'kaur')[0].order_no, 'HP-0010');
});

test('search finds an order by docket number', () => {
  assert.equal(searchOrders(book, 'HP-0007').length, 1);
  assert.equal(searchOrders(book, '0010')[0].customer_name, 'Gurpreet Kaur');
});

test('search finds a phone however the query is punctuated', () => {
  assert.equal(searchOrders(book, '0455667788').length, 1);
  assert.equal(searchOrders(book, '667 788').length, 1);
  assert.equal(searchOrders(book, '+61455667788').length, 1);
  // stored as +61…, searched as local
  assert.equal(searchOrders(book, '0499001122')[0].order_no, 'RV-0002');
});

test('search covers flavour, size and wording', () => {
  assert.equal(searchOrders(book, 'rasmalai').length, 1);
  assert.equal(searchOrders(book, '12 inch').length, 1);
  assert.equal(searchOrders(book, 'engagement').length, 1);
});

test('an empty query returns everything, a miss returns nothing', () => {
  assert.equal(searchOrders(book, '').length, 3);
  assert.equal(searchOrders(book, '   ').length, 3);
  assert.equal(searchOrders(book, 'zzzz').length, 0);
});

test('a customer with no phone is never matched by a number', () => {
  assert.equal(searchOrders(book, '9999').length, 0);
});

// ── Repeat customer rate ────────────────────────────────────────────────────
test('repeat customer rate is the share who ordered more than once', () => {
  const o = (phone, name) => ({ status: 'placed', price: 50, customer_phone: phone, customer_name: name });
  const r = repeatCustomers([
    o('0400000001', 'A'), o('0400000001', 'A'),   // returning
    o('0400000002', 'B'), o('0400000002', 'B'),   // returning
    o('0400000003', 'C'),                          // one-off
    o('0400000004', 'D'),                          // one-off
  ]);
  assert.equal(r.total, 4);
  assert.equal(r.returningCount, 2);
  assert.equal(r.newCount, 2);
  assert.equal(r.rate, 50);
});

test('the same person in three phone formats is one returning customer', () => {
  const r = repeatCustomers([
    { status: 'placed', price: 10, customer_phone: '0425 697 725', customer_name: 'Anjali' },
    { status: 'placed', price: 10, customer_phone: '+61425697725', customer_name: 'Anjali' },
    { status: 'placed', price: 10, customer_phone: '0425697725',   customer_name: 'Anjali' },
  ]);
  assert.equal(r.total, 1);
  assert.equal(r.returningCount, 1);
  assert.equal(r.rate, 100);
  assert.equal(r.top[0].orders, 3);
});

test('no customers reports a zero rate rather than NaN', () => {
  const r = repeatCustomers([]);
  assert.equal(r.total, 0);
  assert.equal(r.rate, 0);
});

test('cancelled orders do not create or inflate a customer', () => {
  const r = repeatCustomers([
    { status: 'placed',    price: 10, customer_phone: '0400000001', customer_name: 'A' },
    { status: 'cancelled', price: 10, customer_phone: '0400000001', customer_name: 'A' },
    { status: 'cancelled', price: 10, customer_phone: '0400000009', customer_name: 'Z' },
  ]);
  assert.equal(r.total, 1);
  assert.equal(r.returningCount, 0);
  assert.equal(r.rate, 0);
});

// ── Weekday and lead time ───────────────────────────────────────────────────
test('weekday is read in Sydney, not UTC', () => {
  // 2026-09-03T13:00:00Z is 11pm Thursday in Sydney but already Friday in UTC.
  assert.equal(WEEKDAYS[weekdayIndex('2026-09-03T13:00:00Z')], 'Thu');
  assert.equal(WEEKDAYS[weekdayIndex('2026-09-03T14:30:00Z')], 'Fri');
});

test('takings group by the weekday the cake goes out', () => {
  const d = byWeekday([
    { status: 'placed',    price: 100, due_at: '2026-09-05T05:00:00Z' }, // Sat
    { status: 'placed',    price: 50,  due_at: '2026-09-05T07:00:00Z' }, // Sat
    { status: 'placed',    price: 20,  due_at: '2026-09-07T05:00:00Z' }, // Mon
    { status: 'cancelled', price: 999, due_at: '2026-09-05T05:00:00Z' },
  ]);
  const sat = d[WEEKDAYS.indexOf('Sat')];
  assert.equal(sat.count, 2);
  assert.equal(sat.revenue, 150);
  assert.equal(d[WEEKDAYS.indexOf('Mon')].count, 1);
  assert.equal(d[WEEKDAYS.indexOf('Sun')].count, 0);
});

test('lead time reports the median notice the baker gets', () => {
  const mk = (madeDay, dueDay) => ({
    status: 'placed', walk_in: false,
    created_at: `2026-09-${String(madeDay).padStart(2, '0')}T02:00:00Z`,
    due_at: `2026-09-${String(dueDay).padStart(2, '0')}T05:00:00Z`,
  });
  const lt = leadTimes([mk(1, 1), mk(1, 3), mk(1, 8), mk(1, 20), mk(1, 2)]);
  assert.equal(lt.count, 5);
  assert.equal(lt.median, 2);        // 0, 1, 2, 7, 19
  assert.equal(lt.longest, 19);
  assert.equal(lt.bands.find((b) => b.label === 'Same day').count, 1);
  assert.equal(lt.bands.find((b) => b.label === 'Over 2 weeks').count, 1);
});

test('walk-ins are left out of lead time, not counted as same day', () => {
  const base = { status: 'picked_up', created_at: '2026-09-03T02:00:00Z', due_at: '2026-09-03T02:00:00Z' };
  assert.equal(leadTimes([{ ...base, walk_in: true }]).count, 0);
  assert.equal(leadTimes([{ ...base, walk_in: false }]).count, 1);
  assert.equal(leadTimes([]).median, null);
});

test('orders with no usable phone are flagged as unmatched customers', () => {
  const rows = [
    { status: 'placed', customer_phone: '0425 697 725' },
    { status: 'placed', customer_phone: null },
    { status: 'placed', customer_phone: '' },
    { status: 'placed', customer_phone: '123' },        // too short to be a number
    { status: 'cancelled', customer_phone: null },
  ];
  assert.equal(missingPhone(rows).length, 3);
});

test('print jobs group by their cake\'s pickup day, printed ones last', () => {
  const now = new Date('2026-09-04T02:00:00Z');           // 12pm Sydney, Fri
  const job = (id, dueKey, status, printedAt) => ({
    id, status, printed_at: printedAt ?? null,
    order: { due_at: `${dueKey}T05:00:00Z` },              // 3pm Sydney
  });
  const out = printSections([
    job('c', '2026-09-06', 'todo'),
    job('a', '2026-09-04', 'todo'),
    job('b', '2026-09-05', 'todo'),
    job('old', '2026-09-01', 'printed', '2026-09-03T02:00:00Z'),
    job('stale', '2026-08-01', 'printed', '2026-08-01T02:00:00Z'),
  ], now);

  assert.deepEqual(out.map(([label]) => label), ['Today', 'Tomorrow', 'In 2 days', 'Printed']);
  assert.deepEqual(out.map(([, rows]) => rows.map((r) => r.id)), [['a'], ['b'], ['c'], ['old']]);
});

test('an overdue print job sorts ahead of today', () => {
  const now = new Date('2026-09-04T02:00:00Z');
  const out = printSections([
    { id: 'now', status: 'todo', order: { due_at: '2026-09-04T05:00:00Z' } },
    { id: 'late', status: 'todo', order: { due_at: '2026-09-02T05:00:00Z' } },
  ], now);
  assert.deepEqual(out.map(([label]) => label), ['Overdue', 'Today']);
});

test('store breakdown splits revenue, share and margin per store', () => {
  const o = (store, price, cost, status) => ({ store, price, cost, deposit: 0, status: status || 'picked_up' });
  const { rows, total } = storeBreakdown([
    o('harris-park', 100, 40),
    o('harris-park', 200, 80),
    o('riverstone',  50,  null),
    o('harris-park', 100, null, 'cancelled'),   // cancelled never counts
  ], ['harris-park', 'riverstone']);

  assert.equal(total, 350);
  assert.equal(rows[0].code, 'harris-park');    // sorted by revenue
  assert.equal(rows[0].revenue, 300);
  assert.equal(rows[0].count, 2);
  assert.equal(rows[0].margin, 180);            // 300 revenue - 120 cost
  assert.equal(Math.round(rows[0].share), 86);
  assert.equal(rows[0].marginTrusted, true);    // 2 of 2 costed

  assert.equal(rows[1].code, 'riverstone');
  assert.equal(rows[1].margin, null);           // nothing costed
  assert.equal(rows[1].marginTrusted, false);
});

test('a margin drawn from a thin slice of orders is flagged untrusted', () => {
  const rows = [];
  for (let i = 0; i < 10; i++) rows.push({ store: 'riverstone', price: 100, deposit: 0, cost: i === 0 ? 40 : null, status: 'picked_up' });
  const r = storeBreakdown(rows, ['riverstone']).rows[0];
  assert.equal(r.costedCount, 1);
  assert.equal(r.marginPct, 60);                // the rate itself is right...
  assert.equal(r.marginTrusted, false);         // ...but 1 of 10 must not be read as fact
});

test('export windows are Sydney months and the Australian financial year', () => {
  const r = exportRanges(new Date('2026-09-04T09:00:00Z'));      // 7pm Fri, Sydney
  assert.deepEqual(r.map((x) => x.key), ['this-month', 'last-month', 'quarter', 'fy']);
  assert.deepEqual([r[0].fromKey, r[0].toKey], ['2026-09-01', '2026-09-04']);
  assert.deepEqual([r[1].fromKey, r[1].toKey], ['2026-08-01', '2026-08-31']);   // full month
  assert.equal(r[3].fromKey, '2026-07-01');
  assert.equal(r[3].label, 'FY 2026–27');

  // Before July, the financial year still runs from the previous 1 July.
  const may = exportRanges(new Date('2026-05-04T02:00:00Z'));
  assert.equal(may[3].fromKey, '2025-07-01');
  assert.equal(may[3].label, 'FY 2025–26');
  // January must roll "last month" back a year, not to month zero.
  const jan = exportRanges(new Date('2027-01-15T02:00:00Z'));
  assert.deepEqual([jan[1].fromKey, jan[1].toKey], ['2026-12-01', '2026-12-31']);
});

test('a leap February exports its 29th', () => {
  const r = exportRanges(new Date('2028-03-10T02:00:00Z'));
  assert.equal(r[1].toKey, '2028-02-29');
});

test('csv escapes quotes and commas instead of shifting every later column', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('Happy Birthday, Sam'), '"Happy Birthday, Sam"');
  assert.equal(csvCell('she said "hi"'), '"she said ""hi"""');
  assert.equal(csvCell('two\nlines'), '"two\nlines"');
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(0), '0');
});

test('csv defuses values a spreadsheet would run as a formula', () => {
  // Excel and Sheets execute these on open; the books are not a place for it.
  assert.equal(csvCell('=1+1'), "'=1+1");
  assert.equal(csvCell('+61425697725'), "'+61425697725");
  assert.equal(csvCell('-5'), "'-5");
  assert.equal(csvCell('@SUM(A1)'), "'@SUM(A1)");
});

test('toCsv joins with CRLF and keeps the header first', () => {
  const out = toCsv(['a', 'b'], [['1', 'x,y'], ['2', null]]);
  assert.equal(out, 'a,b\r\n1,"x,y"\r\n2,');
});

test('daily takings keeps empty days so the weekly rhythm stays true', () => {
  const now = new Date('2026-09-04T02:00:00Z');            // Fri 12pm Sydney
  const rows = dailyTakings([
    { status: 'picked_up', created_at: '2026-09-04T01:00:00Z', price: 100 },
    { status: 'picked_up', created_at: '2026-09-02T01:00:00Z', price: 50 },
    { status: 'cancelled', created_at: '2026-09-02T01:00:00Z', price: 999 },
    { status: 'picked_up', created_at: '2026-07-01T01:00:00Z', price: 999 },  // outside
  ], 5, now);
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map((r) => r.dayKey),
    ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04']);
  assert.deepEqual(rows.map((r) => r.revenue), [0, 0, 50, 0, 100]);
  assert.equal(rows[4].count, 1);
});

test('weekly store split totals match the sum of its stores', () => {
  const now = new Date('2026-09-04T02:00:00Z');
  const rows = weeklyByStore([
    { status: 'picked_up', created_at: '2026-09-02T01:00:00Z', store: 'harris-park', price: 100 },
    { status: 'picked_up', created_at: '2026-09-03T01:00:00Z', store: 'riverstone',  price: 40 },
    { status: 'cancelled', created_at: '2026-09-03T01:00:00Z', store: 'riverstone',  price: 500 },
  ], ['harris-park', 'riverstone'], 4, now);

  assert.equal(rows.length, 4);
  const last = rows[rows.length - 1];
  assert.equal(last.total, 140);
  assert.equal(last.byStore['harris-park'], 100);
  assert.equal(last.byStore['riverstone'], 40);
  for (const r of rows) {
    assert.equal(r.total, Object.values(r.byStore).reduce((t, v) => t + v, 0));
  }
});

test('leaderboards rank customers-view rows on their own metric', () => {
  const now = new Date('2026-09-04T02:00:00Z');
  const c = (phone_key, name, order_count, spend, firstDay, lastDay) =>
    ({ phone_key, name, phone: '0' + phone_key, order_count, spend,
       first_order: `${firstDay}T01:00:00Z`, last_order: `${lastDay}T01:00:00Z` });

  const b = customerLeaderboard([
    c('400000001', 'Big Spender',  2, 800, '2026-08-01', '2026-09-01'),
    c('400000002', 'Frequent',     3, 150, '2026-09-01', '2026-09-03'),
    c('400000003', 'One Big Cake', 1, 500, '2026-09-01', '2026-09-01'),
    c('400000004', 'Gone Quiet',   2, 200, '2026-01-01', '2026-01-02'),
  ], now);

  assert.equal(b.total, 4);
  assert.equal(b.spend[0].name, 'Big Spender');
  assert.equal(b.spend[1].name, 'One Big Cake');
  assert.equal(b.orders[0].name, 'Frequent');
  // A single 500 cake must not top the average board over a real regular.
  assert.equal(b.avg[0].name, 'Big Spender');
  assert.ok(!b.avg.some((x) => x.name === 'One Big Cake'));
  assert.equal(b.avg[0].avg, 400);
});

test('"gone quiet" needs a window wider than the charts, or it is always empty', () => {
  const now = new Date('2026-09-04T02:00:00Z');
  const c = (name, order_count, lastDay) =>
    ({ phone_key: name, name, phone: '04', order_count, spend: 300,
       first_order: '2026-01-01T01:00:00Z', last_order: `${lastDay}T01:00:00Z` });

  // 96 days ago — outside the 63-day analytics fetch these boards used to read.
  const b = customerLeaderboard([
    c('Lapsed regular', 3, '2026-05-31'),
    c('Still coming',   4, '2026-09-03'),
    c('One-off long ago', 1, '2026-02-01'),   // never a regular, so not a nudge
  ], now);

  assert.deepEqual(b.lapsed.map((x) => x.name), ['Lapsed regular']);
  assert.equal(b.lapsed[0].daysSince, 96);
});


console.log(`${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
