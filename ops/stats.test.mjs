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
  missingPrice,
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

console.log(`${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
