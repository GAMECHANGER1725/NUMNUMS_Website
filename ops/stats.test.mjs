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
  dailyTakings, takingsMetrics, weeklyByStore, customerLeaderboard, forwardBook, weekdayNorm,
  productMix, sortMix, staleOpen, photosToPurge, photoHealth, cancellationStats, pricingGaps,
  netPrice, discountOn,
} from './stats.mjs';
import { receiptSource } from './receipt.mjs';
import { toNinetyNine } from './catalog.mjs';

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

// ── Catalogue pricing ────────────────────────────────────────────────────────
// A normal cake's price always ends in .99. This is the safety net behind the
// size autofill, not the source of truth (SIZES already reads .99) — it exists
// so a future catalogue edit that lands on a round number still shows the
// shop's real pricing instead of a $50.00 sticking out on a docket.
test('a round-dollar price rounds down to the .99 below it', () => {
  assert.equal(toNinetyNine(50), 49.99);
  assert.equal(toNinetyNine(100), 99.99);
});

test('a price already ending in .99 is left alone', () => {
  assert.equal(toNinetyNine(49.99), 49.99);
  assert.equal(toNinetyNine(39.99), 39.99);
});

test('rounding down means the .99 at or below, not up', () => {
  // The bug this guards: floor(cents/100) on an exact whole dollar is that
  // same dollar, so adding 99 back on lands one dollar too high ($50.00 ->
  // $50.99) unless the dollar is stepped down first.
  assert.equal(toNinetyNine(50.5), 49.99);
});

test('null and undefined prices pass through unchanged', () => {
  assert.equal(toNinetyNine(null), null);
  assert.equal(toNinetyNine(undefined), undefined);
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

// Marking a cake baked used to take it off the board for good: the baker has no
// order log to go and find it in, so a mistap needed an admin. Baked cakes now
// stay in one heading at the bottom, where they can be opened and put back.
test('baked cakes are filed under one trailing heading, not a day', () => {
  const orders = [
    { kind: 'normal', status: 'placed', due_at: '2026-09-03T06:00:00Z' },
    { kind: 'normal', status: 'baked', due_at: '2026-09-03T06:00:00Z', baked_at: '2026-09-02T01:00:00Z' },
    { kind: 'normal', status: 'baked', due_at: '2026-08-30T06:00:00Z', baked_at: '2026-09-02T03:00:00Z' },
  ];
  const sections = bakerSections(orders, '2026-09-02T04:00:00Z');
  const labels = sections.map(([l]) => l);
  assert.deepEqual(labels, ['Tomorrow', 'Just baked']);
  // Both baked cakes land in the one heading even though their pickup days
  // differ — an overdue one must not reappear at the top as work to do.
  assert.equal(sections[1][1].length, 2);
  // Most recently baked first: a mistap is undone seconds later, not tomorrow.
  assert.equal(sections[1][1][0].baked_at, '2026-09-02T03:00:00Z');
});

test('a queue of nothing but baked cakes still ranks without crashing', () => {
  // rank() reads a number out of the day label, so a non-day label reaching it
  // would throw on `null[0]` and take the whole view down.
  const sections = bakerSections(
    [{ kind: 'normal', status: 'baked', due_at: '2026-09-03T06:00:00Z', baked_at: '2026-09-02T03:00:00Z' }],
    '2026-09-02T04:00:00Z',
  );
  assert.deepEqual(sections.map(([l]) => l), ['Just baked']);
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

test('the takings tiles compare a period with the one before it', () => {
  const now = new Date('2026-09-04T02:00:00Z');            // Fri 12pm Sydney
  // Two $100 cakes in the last two days, one $50 four days back. With days = 2
  // the older $50 is the whole comparison period.
  const daily = dailyTakings([
    { status: 'picked_up', created_at: '2026-09-04T01:00:00Z', price: 120, discount: 20 },
    { status: 'picked_up', created_at: '2026-09-03T01:00:00Z', price: 100 },
    { status: 'picked_up', created_at: '2026-09-01T01:00:00Z', price: 50 },
  ], 4, now);
  const m = takingsMetrics(daily, 2);

  assert.deepEqual(m.rows.map((r) => r.dayKey), ['2026-09-03', '2026-09-04']);
  assert.equal(m.now.revenue, 200);            // net of the $20 off, not $220
  assert.equal(m.now.discount, 20);
  assert.equal(m.now.count, 2);
  assert.equal(m.now.average, 100);
  assert.equal(m.was.revenue, 50);
  assert.equal(Math.round(m.change.revenue), 300);
  assert.equal(Math.round(m.change.count), 100);
});

test('the average is the period average, not the average of the days', () => {
  const now = new Date('2026-09-04T02:00:00Z');
  // One $40 cake on one day, four $100 cakes on the next. The mean of the two
  // daily averages is $70; what the shop actually averaged is $88.
  const daily = dailyTakings([
    { status: 'picked_up', created_at: '2026-09-03T01:00:00Z', price: 40 },
    ...Array.from({ length: 4 }, () => ({ status: 'picked_up', created_at: '2026-09-04T01:00:00Z', price: 100 })),
  ], 2, now);
  const m = takingsMetrics(daily, 2);
  assert.equal(m.now.average, 88);
});

test('nothing to compare against reads as no comparison, not as a rise', () => {
  const now = new Date('2026-09-04T02:00:00Z');
  const daily = dailyTakings([
    { status: 'picked_up', created_at: '2026-09-04T01:00:00Z', price: 100 },
  ], 4, now);
  const m = takingsMetrics(daily, 2);
  assert.equal(m.was.revenue, 0);
  assert.equal(m.change.revenue, null, 'up from nothing is not a percentage');
  assert.equal(m.change.discount, null);
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


test('the forward book counts only what is still coming, per day', () => {
  const now = new Date('2026-09-04T02:00:00Z');           // Fri 12pm Sydney
  const o = (dueKey, price, deposit, status, kind) => ({
    due_at: `${dueKey}T05:00:00Z`, price, deposit, status: status || 'placed', kind: kind || 'normal',
  });
  const b = forwardBook([
    o('2026-09-04', 100, 40),                              // today, part paid
    o('2026-09-04', 200, 0, 'placed', 'custom'),
    o('2026-09-05', 150, 150),                             // paid in full
    o('2026-09-06', null, 0),                              // no price yet
    o('2026-09-04', 999, 0, 'picked_up'),                  // already collected
    o('2026-09-04', 999, 0, 'cancelled'),
    o('2026-09-20', 999, 0),                               // beyond the window
  ], 7, now);

  assert.equal(b.rows.length, 7);
  assert.equal(b.rows[0].dayKey, '2026-09-04');
  assert.equal(b.rows[0].count, 2);
  assert.equal(b.rows[0].custom, 1);
  assert.equal(b.rows[0].value, 300);
  assert.equal(b.rows[0].owing, 260);                      // 300 booked, 40 taken
  assert.equal(b.count, 4);
  assert.equal(b.value, 450);
  assert.equal(b.collected, 190);
  assert.equal(b.owing, 260);                              // the fully-paid day adds nothing
  assert.equal(b.unpriced, 1);
  assert.equal(b.busiest.dayKey, '2026-09-04');
});

test('weekday norm averages finished pickups only, never the day itself', () => {
  const now = new Date('2026-09-04T02:00:00Z');            // Friday
  const rows = [];
  // three Fridays back, two cakes each
  for (const d of ['2026-08-28', '2026-08-21', '2026-08-14']) {
    rows.push({ due_at: `${d}T05:00:00Z`, status: 'picked_up' });
    rows.push({ due_at: `${d}T06:00:00Z`, status: 'picked_up' });
  }
  rows.push({ due_at: '2026-09-04T05:00:00Z', status: 'placed' });   // today, must not count
  rows.push({ due_at: '2026-09-11T05:00:00Z', status: 'placed' });   // future, must not count

  const norm = weekdayNorm(rows, 6, now);
  assert.equal(norm[weekdayIndex('2026-08-28T05:00:00Z')], 1);       // 6 cakes over a 6-week window
  assert.equal(norm[weekdayIndex('2026-09-01T05:00:00Z')], 0);       // a Tuesday with nothing
});

test('product mix separates what sells from what earns', () => {
  const o = (flavour, price, cost, status) => ({ flavour, price, cost, status: status || 'picked_up' });
  const rows = productMix([
    // cheap and popular: four cakes, thin margin
    o('Vanilla', 50, 40), o('Vanilla', 50, 40), o('Vanilla', 50, 40), o('Vanilla', 50, 40),
    // dear and rare: one cake, fat margin
    o('Rasmalai', 250, 60),
    o('Mango', 100, null),            // no cost recorded
    o('Mango', 999, null, 'cancelled'),
  ], 'flavour');

  const v = rows.find((r) => r.k === 'Vanilla');
  const r = rows.find((r) => r.k === 'Rasmalai');
  const m = rows.find((r) => r.k === 'Mango');

  assert.equal(v.count, 4);
  assert.equal(v.revenue, 200);
  assert.equal(v.marginPct, 20);          // 200 rev - 160 cost
  assert.equal(r.count, 1);
  assert.equal(r.marginPct, 76);          // (250 - 60) / 250
  assert.equal(m.count, 1);               // the cancelled one never counts
  assert.equal(m.margin, null);
  assert.equal(m.marginTrusted, false);

  // Volume says Vanilla; money earned says Rasmalai. That is the whole point.
  assert.equal(sortMix(rows, 'count')[0].k, 'Vanilla');
  assert.equal(sortMix(rows, 'revenue')[0].k, 'Rasmalai');
  assert.equal(sortMix(rows, 'margin')[0].k, 'Rasmalai');
  assert.equal(v.marginTotal, 40);        // 20% of 200
  assert.equal(r.marginTotal, 190);       // 76% of 250
});

test('a mix row with no costs sorts last on margin rather than first', () => {
  const rows = productMix([
    { flavour: 'Priced', price: 100, cost: 10, status: 'picked_up' },
    { flavour: 'Unknown', price: 900, cost: null, status: 'picked_up' },
  ], 'flavour');
  assert.deepEqual(sortMix(rows, 'margin').map((r) => r.k), ['Priced', 'Unknown']);
  assert.equal(sortMix(rows, 'revenue')[0].k, 'Unknown');   // it still out-sold
});

test('stale orders are the ones nobody closed off, oldest first', () => {
  const now = new Date('2026-09-10T02:00:00Z');            // Thu 12pm Sydney
  const o = (id, dueKey, status) => ({ id, due_at: `${dueKey}T05:00:00Z`, status });

  const rows = staleOpen([
    o('a', '2026-09-01', 'placed'),      // 9 days late
    o('b', '2026-09-08', 'baked'),       // 2 days late
    o('c', '2026-09-09', 'arrived'),     // 1 day late
    o('d', '2026-09-10', 'placed'),      // due today — not late
    o('e', '2026-09-12', 'placed'),      // still to come
    o('f', '2026-09-01', 'picked_up'),   // closed off properly
    o('g', '2026-09-01', 'cancelled'),
  ], now);

  assert.deepEqual(rows.map((r) => r.id), ['a', 'b', 'c']);
  assert.equal(rows[0].daysLate, 9);
  assert.equal(rows[2].daysLate, 1);
});

test('a cake due later today is not late yet', () => {
  const now = new Date('2026-09-10T02:00:00Z');            // noon Sydney
  const later = [{ id: 'x', due_at: '2026-09-10T09:00:00Z', status: 'placed' }];  // 7pm Sydney
  assert.equal(staleOpen(later, now).length, 0);
  // …and with no grace at all it still is not, because the day has not passed
  assert.equal(staleOpen(later, now, 0).length, 1);        // grace 0 means "today counts"
});

test('photo purge rule matches the one in Postgres', () => {
  const now = new Date('2026-09-30T00:00:00Z');
  const o = (id, createdKey, dueKey, status, photo = 'p.jpg') =>
    ({ id, created_at: `${createdKey}T00:00:00Z`, due_at: `${dueKey}T00:00:00Z`, status, photo_path: photo });

  const rows = [
    // due inside the 14-day window: goes at day 14 regardless of status
    o('a', '2026-09-01', '2026-09-03', 'picked_up'),   // 29 days old -> purge
    o('b', '2026-09-20', '2026-09-22', 'picked_up'),   // 10 days old -> keep
    o('c', '2026-09-01', '2026-09-03', 'placed'),      // still open, but past 14 days -> purge
    // due beyond the window: kept until the order is finished, however old
    o('d', '2026-08-01', '2026-10-30', 'placed'),      // 60 days old, not finished -> keep
    o('e', '2026-08-01', '2026-10-30', 'picked_up'),   // finished -> purge
    o('f', '2026-08-01', '2026-10-30', 'cancelled'),   // finished -> purge
    o('g', '2026-09-01', '2026-09-03', 'picked_up', null),  // no photo at all
  ];

  assert.deepEqual(photosToPurge(rows, now).map((r) => r.id).sort(), ['a', 'c', 'e', 'f']);
});

test('exactly fourteen days is the boundary, not fifteen', () => {
  const made = '2026-09-01T00:00:00Z';
  const row = [{ id: 'x', created_at: made, due_at: '2026-09-02T00:00:00Z', status: 'picked_up', photo_path: 'p' }];
  assert.equal(photosToPurge(row, new Date('2026-09-14T23:59:00Z')).length, 0);   // day 13
  assert.equal(photosToPurge(row, new Date('2026-09-15T00:00:00Z')).length, 1);   // day 14
});

test('photo health reports what is held and what is overdue', () => {
  const now = new Date('2026-09-30T00:00:00Z');
  const rows = [
    { id: 'a', created_at: '2026-08-01T00:00:00Z', due_at: '2026-08-02T00:00:00Z', status: 'picked_up', photo_path: 'p' },
    { id: 'b', created_at: '2026-09-28T00:00:00Z', due_at: '2026-09-29T00:00:00Z', status: 'placed', photo_path: 'p' },
    { id: 'c', created_at: '2026-09-28T00:00:00Z', due_at: '2026-09-29T00:00:00Z', status: 'placed', photo_path: null },
  ];
  const h = photoHealth(rows, now);
  assert.equal(h.held, 2);           // the one with no photo is not held
  assert.equal(h.overdue, 1);
  assert.equal(h.oldestDays, 60);
  assert.equal(h.rows[0].id, 'a');
});

test('cancellation stats split by deposit, and know when not to claim a pattern', () => {
  const now = new Date('2026-09-30T02:00:00Z');
  const o = (dayKey, status, deposit, price, store = 'harris-park') =>
    ({ created_at: `${dayKey}T02:00:00Z`, status, deposit, price, store, walk_in: false });

  const rows = [
    ...Array.from({ length: 20 }, () => o('2026-09-01', 'picked_up', 40, 100)),
    ...Array.from({ length: 2 },  () => o('2026-09-01', 'cancelled', 40, 100)),   // 2/22 with deposit
    ...Array.from({ length: 10 }, () => o('2026-09-02', 'picked_up', 0, 100, 'riverstone')),
    ...Array.from({ length: 6 },  () => o('2026-09-02', 'cancelled', 0, 150, 'riverstone')),  // 6/16 without
    o('2026-01-01', 'cancelled', 0, 999),                                          // outside the window
    { created_at: '2026-09-02T02:00:00Z', status: 'cancelled', deposit: 0, price: 999, store: 'harris-park', walk_in: true },
  ];

  const c = cancellationStats(rows, 90, now);
  assert.equal(c.total, 38);                     // walk-in and the old order both excluded
  assert.equal(c.cancelled, 8);
  assert.equal(c.value, 2 * 100 + 6 * 150);      // only cancelled orders count toward the loss
  assert.equal(c.withDeposit.total, 22);
  assert.equal(Math.round(c.withDeposit.rate), 9);
  assert.equal(c.noDeposit.total, 16);
  assert.equal(Math.round(c.noDeposit.rate), 38);
  assert.equal(c.confident, true);
  assert.ok(c.gap > 28);
  assert.equal(c.byStore[0].store, 'riverstone');   // worst rate first
});

test('a handful of orders is not a pattern', () => {
  const now = new Date('2026-09-30T02:00:00Z');
  const o = (status, deposit) =>
    ({ created_at: '2026-09-20T02:00:00Z', status, deposit, price: 100, store: 'harris-park', walk_in: false });
  // 1 of 3 without a deposit cancelled: a 33% rate that means nothing
  const c = cancellationStats([o('picked_up', 40), o('cancelled', 0), o('picked_up', 0), o('picked_up', 0)], 90, now);
  assert.equal(c.noDeposit.total, 3);
  assert.equal(c.confident, false);
});

test('no orders at all does not divide by zero', () => {
  const c = cancellationStats([], 90, new Date('2026-09-30T02:00:00Z'));
  assert.equal(c.total, 0);
  assert.equal(c.rate, 0);
  assert.equal(c.confident, false);
  assert.deepEqual(c.byStore, []);
});

test('pricing gaps flag only what was undercharged', () => {
  const now = new Date('2026-09-30T02:00:00Z');
  const baseFor = (size) => ({ '8 inch': 49.99, '10 inch': 74.99, Slice: null }[size] ?? null);
  const o = (id, size, price, opts = {}) => ({
    id, size, price, status: opts.status || 'picked_up',
    created_at: `${opts.day || '2026-09-20'}T02:00:00Z`,
  });

  const g = pricingGaps([
    o('under',    '8 inch', 40.00),                       // $9.99 short
    o('way-off',  '10 inch', 7.50),                       // a missing digit: $67.49 short
    o('exact',    '8 inch', 49.99),                       // on list
    o('premium',  '8 inch', 74.99),                       // Rasmalai, above list — fine
    o('slice',    'Slice',  6.00),                        // no list price to judge
    o('nolist',   '20 inch', 5.00),                       // size not in the catalogue
    o('unpriced', '8 inch', null),
    o('void',     '8 inch', 1.00, { status: 'cancelled' }),
    o('old',      '8 inch', 1.00, { day: '2026-01-01' }), // outside the window
  ], baseFor, { days: 30, now });

  assert.equal(g.checked, 4);                             // under, way, exact, premium
  assert.deepEqual(g.under.map((r) => r.id), ['way-off', 'under']);   // biggest shortfall first
  assert.equal(Math.round(g.shortfall * 100) / 100, 77.48);
  assert.equal(g.under[0].base, 74.99);
});

test('a penny of floating point noise is not a discount', () => {
  const now = new Date('2026-09-30T02:00:00Z');
  const baseFor = () => 0.1 + 0.2;                        // 0.30000000000000004
  const rows = [{ id: 'x', size: '8 inch', price: 0.3, status: 'picked_up', created_at: '2026-09-20T02:00:00Z' }];
  assert.equal(pricingGaps(rows, baseFor, { days: 30, now }).under.length, 0);
});

// ── Discounts ───────────────────────────────────────────────────────────────

// `price` is the list price and `discount` is what came off it. Every revenue
// figure has to read the difference, or a discount is money the books think
// arrived. The whole point of a separate column is that it stays measurable.
test('revenue is net of the discount, everywhere it is counted', () => {
  const o = (id, price, discount, extra = {}) => ({
    id, price, discount, status: 'picked_up', deposit: 0,
    created_at: '2026-09-20T02:00:00Z', due_at: '2026-09-20T05:00:00Z',
    store: 'harris-park', customer_phone: '0425 000 00' + id, customer_name: 'C' + id,
    ...extra,
  });
  assert.equal(netPrice(o(1, 89.99, 15)), 74.99);
  assert.equal(discountOn(o(1, 89.99, 15)), 15);
  assert.equal(netPrice({ price: 50 }), 50);              // no discount column at all
  assert.equal(netPrice({ price: 50, discount: null }), 50);

  const s = summarise([o(1, 100, 10), o(2, 50, 0), o(3, 40, 40)]);
  assert.equal(s.revenue, 140);          // 90 + 50 + 0
  assert.equal(s.discount, 50);
  assert.equal(s.listRevenue, 190);
  assert.equal(s.discounted, 2);         // the $0-off order does not count
  assert.equal(s.count, 3);
  assert.equal(Math.round(s.discountRate * 10) / 10, 26.3);   // 50/190
  assert.equal(s.avgOrder, 140 / 3);
});

// A collected cake is "paid in full" — of the discounted amount. Treating the
// list price as paid would show every discount as an overpayment.
test('paid in full means the discounted amount', () => {
  const done = { status: 'picked_up', price: 89.99, discount: 15, deposit: 0 };
  assert.equal(paidOn(done), 74.99);
  const open = { status: 'placed', price: 89.99, discount: 15, deposit: 25 };
  assert.equal(paidOn(open), 25);
  // Rounded to cents deliberately: the raw subtraction is 49.989999999999995,
  // which `money` absorbs and a naive assertion would not.
  assert.equal(Math.round((netPrice(open) - paidOn(open)) * 100), 4999);
});

// A logged discount is a decision, not a mistake. Flagging it as underpricing
// would bury the shortfalls nobody logged, which is what that panel is for.
test('a logged discount is not an underpriced cake', () => {
  const now = new Date('2026-09-30T02:00:00Z');
  const rows = [{ id: 'a', size: '8 inch', price: 49.99, discount: 20,
                  status: 'picked_up', created_at: '2026-09-20T02:00:00Z' }];
  const g = pricingGaps(rows, () => 49.99, { days: 30, now });
  assert.equal(g.under.length, 0, 'the cake was sold at list and then discounted');
});

test('the customer boards read discount off the view', () => {
  const now = new Date('2026-09-30T02:00:00Z');
  const c = (key, name, orders, spend, discount, last) => ({
    phone_key: key, name, phone: '04' + key, order_count: orders, spend,
    discount_given: discount, first_order: '2026-01-01T00:00:00Z', last_order: last,
  });
  const b = customerLeaderboard([
    c('1', 'Generous',  6, 700, 300, '2026-09-28T00:00:00Z'),
    c('2', 'Full price', 4, 600,   0, '2026-09-27T00:00:00Z'),
    c('3', 'Small',      2,  90,  10, '2026-09-26T00:00:00Z'),
  ], now);

  assert.equal(b.discountTotal, 310);
  assert.equal(b.discountedCount, 2);
  assert.deepEqual(b.discount.map((r) => r.name), ['Generous', 'Small']);
  assert.equal(Math.round(b.discount[0].discountPct), 30);   // 300 of 1000 at list
  // Spend is already net in the view, so the boards need no second subtraction.
  assert.equal(b.spend[0].name, 'Generous');
  assert.equal(b.spend[0].spend, 700);
});

// ── Design photos on the invoice ────────────────────────────────────────────

// A real 6x3 JPEG, so the check is against something a PDF reader would accept
// rather than a plausible-looking byte array.
const TINY_JPEG_B64 = '/9j/4AAQSkZJRgABAQAASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAABqAD'
  + 'AAQAAAABAAAAAwAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+'
  + '/+IB2ElDQ19QUk9GSUxFAAEBAAAByAAAAAAEMAAAbW50clJHQiBYWVogB+AAAQABAAAAAAAAYWNzcAAAAAAAAAAAAAAAAAAA'
  + 'AAAAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  + 'AAAAAAAJZGVzYwAAAPAAAAAkclhZWgAAARQAAAAUZ1hZWgAAASgAAAAUYlhZWgAAATwAAAAUd3RwdAAAAVAAAAAUclRSQwAA'
  + 'AWQAAAAoZ1RSQwAAAWQAAAAoYlRSQwAAAWQAAAAoY3BydAAAAYwAAAA8bWx1YwAAAAAAAAABAAAADGVuVVMAAAAIAAAAHABz'
  + 'AFIARwBCWFlaIAAAAAAAAG+iAAA49QAAA5BYWVogAAAAAAAAYpkAALeFAAAY2lhZWiAAAAAAAAAkoAAAD4QAALbPWFlaIAAA'
  + 'AAAAAPbWAAEAAAAA0y1wYXJhAAAAAAAEAAAAAmZmAADypwAADVkAABPQAAAKWwAAAAAAAAAAbWx1YwAAAAAAAAABAAAADGVu'
  + 'VVMAAAAgAAAAHABHAG8AbwBnAGwAZQAgAEkAbgBjAC4AIAAyADAAMQA2/8AAEQgAAwAGAwEiAAIRAQMRAf/EAB8AAAEFAQEB'
  + 'AQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEV'
  + 'UtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SV'
  + 'lpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEB'
  + 'AQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkj'
  + 'M1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKT'
  + 'lJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAgICAgIC'
  + 'AwICAwUDAwMFBgUFBQUGCAYGBgYGCAoICAgICAgKCgoKCgoKCgwMDAwMDA4ODg4ODw8PDw8PDw8PD//bAEMBAgICBAQEBwQE'
  + 'BxALCQsQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEP/dAAQAAf/aAAwDAQACEQMR'
  + 'AD8A9F/4JK28bX/xMA3IEXSwAjMg+7L1CkAn3PNftF9lj/vyf9/X/wDiq/GT/gkn/wAhD4n/AE0v/wBBlr9pK5MOvcR6OY6V'
  + '5Jdz/9k=';
const tinyJpeg = () => {
  const bin = Buffer.from(TINY_JPEG_B64, 'base64');
  return { bytes: new Uint8Array(bin), width: 6, height: 3 };
};

// ── Tax invoice ─────────────────────────────────────────────────────────────

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const dfmt = (o) => new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', ...o });
// The address is the only thing that differs between the shops; the seller is
// one company. Getting that backwards put a second entity and a second ABN on
// Harris Park invoices, which is why these two fixtures are separate.
const HP = { code: 'harris-park', label: 'Harris Park',
             address: 'Shop 1, 96–98 Wigram Street, Harris Park NSW 2150' };
const RV = { code: 'riverstone', label: 'Riverstone',
             address: 'Shop 8, Riverstone Shopping Centre, Riverstone NSW 2765' };
const BIZ = { name: "Num Num's Bakery", tagline: '100% eggless cakes & Indian sweets',
              entity: 'GNT Ventures Pty Ltd', abn: '39 634 402 412', gstRegistered: true,
              phone: '+61 425 697 725', email: 'a@b.com', site: 'numnumsbakery.com.au' };
const ctxFor = (store, business = BIZ) => ({
  store, business, money,
  dateFmt: dfmt({ day: 'numeric', month: 'short', year: 'numeric' }),
  dateTimeFmt: dfmt({ day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }),
  orderedAt: (o) => new Date(o.ordered_at || o.created_at),
  paidOn,
});
/** Every run of text the PDF actually draws. */
const drawnOn = (order, store = HP, business = BIZ) =>
  [...receiptSource(order, ctxFor(store, business)).matchAll(/\((.*?)\) Tj/g)].map((m) => m[1]);

const ORDER = {
  order_no: 'HP-1725', store: 'harris-park', kind: 'custom', status: 'placed',
  customer_name: 'Priya Sharma', customer_phone: '0425 111 222',
  flavour: 'Red Velvet', size: '8 inch', wording: 'Happy 30th',
  price: '49.99', deposit: '25.00',
  ordered_at: '2026-09-05T09:00:00Z', due_at: '2026-09-12T05:00:00Z',
};

// A tax invoice missing any one of these is not a tax invoice, and the customer
// cannot claim the GST back off it. GST Act s29-70(1); ATO "Tax invoices".
test('the invoice carries everything the ATO requires of one', () => {
  const drawn = drawnOn(ORDER);
  const has = (t) => assert.ok(drawn.includes(t), `missing "${t}" — got ${drawn.join(' | ')}`);
  has('TAX INVOICE');                       // the words, prominently
  has('GNT Ventures Pty Ltd');              // seller identity
  has('ABN 39 634 402 412');                // seller ABN
  has('HP-1725');                           // invoice number
  has('5 Sept 2026');                       // date of issue
  has('12 Sept 2026');                      // date of supply — the ACL wants this too
  has('Custom cake · Red Velvet · 8 inch'); // description
  has('1');                                 // quantity
  has('Taxable supply');                    // extent to which the sale is taxable
  has('Total price includes GST.');
  has('Priya Sharma');                      // buyer identity: mandatory at $1,000+
});

// $49.99 inc GST is $45.45 + $4.54. All three have to appear and add up: a
// whole-dollar formatter slipping back in would print $50.00 and read as real.
test('GST is a real eleventh, and nothing is rounded to dollars', () => {
  const drawn = drawnOn(ORDER);
  for (const amt of ['$45.45', '$4.54', '$49.99', '$25.00', '$24.99']) {
    assert.ok(drawn.includes(amt), `missing ${amt} — got ${drawn.join(' | ')}`);
  }
  assert.ok(!drawn.includes('$50.00'), 'the price was rounded to $50.00');
  assert.equal(4545 + 454, 4999);           // the arithmetic the page claims
});

// One company, two shops. The address changes and nothing else does; an entity
// or ABN that follows the store is the bug this test exists to catch.
test('both shops invoice as the same company', () => {
  for (const [store, suburb] of [[HP, 'Harris Park'], [RV, 'Riverstone']]) {
    const drawn = drawnOn({ ...ORDER, store: store.code }, store);
    assert.ok(drawn.includes('GNT Ventures Pty Ltd'), `${suburb} names the wrong seller`);
    assert.ok(drawn.includes('ABN 39 634 402 412'), `${suburb} carries the wrong ABN`);
    assert.ok(!drawn.some((t) => /Jai Balaji/i.test(t)), `${suburb} still names the old entity`);
    assert.ok(!drawn.some((t) => /66 637 495 642/.test(t)), `${suburb} still carries the old ABN`);
    // Compared with the non-ASCII stripped: the en dash in "96–98" is drawn as
    // its WinAnsi byte, so the literal string will never match.
    const plain = (t) => t.replace(/[^\x20-\x7E]/g, '');
    assert.ok(drawn.some((t) => plain(t) === plain(store.address)),
      `${suburb} shows the wrong address`);
    assert.ok(drawn.some((t) => t.includes(suburb)), `${suburb} is not named on the invoice`);
  }
});

test('a $1,000+ sale still names the buyer', () => {
  const drawn = drawnOn({ ...ORDER, price: '1250.00', deposit: '0' });
  assert.ok(drawn.includes('Priya Sharma'), 'buyer identity is mandatory over $1,000');
  assert.ok(drawn.includes('$1,250.00'), 'total missing');
  assert.ok(drawn.includes('$113.64'), 'GST on $1,250 is $113.64');
  assert.ok(drawn.includes('$1,136.36'), 'ex-GST subtotal missing');
});

// GST is a tenth of what the customer was actually charged. Charging it on the
// list price would overstate the shop's liability and hand the customer a
// credit for money nobody paid.
test('GST is worked out after the discount, not before', () => {
  const drawn = drawnOn({ ...ORDER, price: '89.99', discount: '15.00', deposit: '25.00' });
  const has = (t) => assert.ok(drawn.includes(t), `missing "${t}" — got ${drawn.join(' | ')}`);
  has('$89.99');          // the price line
  has('- $15.00');        // what came off — a real minus, not a dropped glyph
  has('$68.17');          // 74.99 ex GST
  has('$6.82');           // 74.99 / 11
  has('$74.99');          // total inc GST
  has('$49.99');          // balance after the $25 deposit
  assert.ok(!drawn.includes('$8.18'), 'GST was taken on the undiscounted price');
  assert.equal(6817 + 682, 7499);

  // The form lets staff enter a discount either way round, but a customer's
  // copy states money. "16.7% off" on a $89.99 cake is not something anyone can
  // check against what they handed over.
  const bare = drawn.filter((t) => /^-?\s*\d+(\.\d+)?\s*%$/.test(t));
  assert.deepEqual(bare, [], `the receipt shows a bare percentage: ${bare.join(', ')}`);
});

test('a collected order reads as paid in full', () => {
  const drawn = drawnOn({ ...ORDER, status: 'picked_up', price: '130.50', deposit: '0',
    picked_up_at: '2026-09-12T05:10:00Z' });
  assert.ok(drawn.includes('PAID IN FULL'));
  assert.ok(drawn.includes('$130.50'), 'cents dropped from $130.50');
  assert.ok(drawn.includes('$0.00'), 'balance should read $0.00');
  assert.ok(!drawn.includes('$131.00'), '$130.50 was rounded');
});

// Issuing a document headed "tax invoice" showing GST when the seller is not
// registered for it is not a formatting slip, so the switch is explicit.
test('a seller not registered for GST issues an invoice, not a tax invoice', () => {
  const drawn = drawnOn(ORDER, HP, { ...BIZ, gstRegistered: false });
  assert.ok(drawn.includes('INVOICE'), 'still needs a heading');
  assert.ok(!drawn.includes('TAX INVOICE'), 'must not claim to be a tax invoice');
  assert.ok(!drawn.some((t) => t.startsWith('GST (')), 'must not show a GST line');
  assert.ok(!drawn.includes('Total price includes GST.'));
  assert.ok(drawn.includes('No GST charged'));
  assert.ok(drawn.includes('$49.99'), 'the price is still the price');
});

// The design photos the customer sent, on their copy. Embedding binary into a
// file whose cross-reference table is counted in characters is the part that
// breaks quietly — a PDF that opens in one reader and is rejected by the next.
test('design photos are embedded, and the file still parses', () => {
  const photos = [tinyJpeg(), tinyJpeg(), tinyJpeg()];
  const pdf = receiptSource(ORDER, { ...ctxFor(HP), photos });

  assert.match(pdf, /\/XObject<<\/Im0 9 0 R\/Im1 10 0 R\/Im2 11 0 R>>/,
    'the page does not reference the images');
  assert.equal((pdf.match(/\/Subtype\/Image/g) || []).length, 3, 'wrong number of image objects');
  assert.match(pdf, /\/Filter\/DCTDecode/, 'a JPEG must be embedded as DCTDecode');
  assert.match(pdf, /\/ColorSpace\/DeviceRGB/, 'canvas output is three-channel');
  assert.match(pdf, new RegExp(`/Width 6/Height 3`), 'image dimensions missing');
  assert.equal((pdf.match(/\/Im\d Do/g) || []).length, 3, 'images declared but never drawn');
  assert.ok(pdf.includes('DESIGN REFERENCE'), 'no heading over the photos');

  // Every byte of the JPEG has to survive into the file intact.
  const bytes = tinyJpeg().bytes;
  assert.match(pdf, new RegExp(`/Length ${bytes.length}>>`), 'stream length is wrong');
  const start = pdf.indexOf('/DCTDecode') && pdf.indexOf('stream\n', pdf.indexOf('/DCTDecode')) + 7;
  assert.equal(pdf.charCodeAt(start), bytes[0], 'the JPEG stream does not start where it says');
  assert.equal(pdf.charCodeAt(start + 1), bytes[1], 'the JPEG stream is corrupted');

  // Offsets are character counts; binary shifts every one of them.
  const startxref = Number(pdf.slice(pdf.lastIndexOf('startxref') + 9).trim().split('\n')[0]);
  assert.equal(pdf.slice(startxref, startxref + 4), 'xref', 'binary broke the xref offset');
  assert.match(pdf.slice(startxref), /^xref\n0 12\n/, 'wrong object count');

  // Every entry, not just the first: the offsets that drift are the ones AFTER
  // the binary, and a reader that trusts the table lands mid-JPEG.
  const entries = [...pdf.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
  assert.equal(entries.length, 11, 'wrong number of xref entries');
  entries.forEach((at, i) => {
    assert.equal(pdf.slice(at, at + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`,
      `xref entry ${i + 1} points at the wrong byte`);
  });
});

test('an order with no photos embeds none', () => {
  const pdf = receiptSource(ORDER, ctxFor(HP));
  assert.ok(!pdf.includes('/XObject'), 'an empty XObject dictionary was written anyway');
  assert.ok(!pdf.includes('/Subtype/Image'));
  assert.ok(!pdf.includes('DESIGN REFERENCE'));
  const at = Number(pdf.slice(pdf.lastIndexOf('startxref') + 9).trim().split('\n')[0]);
  assert.match(pdf.slice(at), /^xref\n0 9\n/, 'object count changed with no images');
});

// A photo purged on its fourteenth day, or shop wifi dropping mid-download,
// must cost the invoice a picture and nothing else.
test('a photo that will not load is simply absent', () => {
  const photos = [tinyJpeg(), null, tinyJpeg()].filter(Boolean);   // what the sheet hands over
  const pdf = receiptSource(ORDER, { ...ctxFor(HP), photos });
  assert.equal((pdf.match(/\/Subtype\/Image/g) || []).length, 2);
  assert.ok(pdf.includes('$49.99'), 'the money is still on it');
  assert.ok(pdf.trimEnd().endsWith('%%EOF'));
});

test('the PDF is structurally valid', () => {
  const pdf = receiptSource(ORDER, ctxFor(HP));
  assert.ok(pdf.startsWith('%PDF-1.4'), 'not a PDF');
  assert.ok(pdf.trimEnd().endsWith('%%EOF'), 'truncated');
  // Offsets are character counts because the file is written Latin-1; counting
  // UTF-8 bytes puts the table out by three for every em dash on the page.
  const startxref = Number(pdf.slice(pdf.lastIndexOf('startxref') + 9).trim().split('\n')[0]);
  assert.equal(pdf.slice(startxref, startxref + 4), 'xref', 'startxref points at the wrong byte');
  const first = pdf.indexOf('0000000000 65535 f \n') + 20;
  assert.equal(pdf.slice(Number(pdf.slice(first, first + 10)), Number(pdf.slice(first, first + 10)) + 7),
    '1 0 obj', 'xref entry points at the wrong byte');
});

console.log(`${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
