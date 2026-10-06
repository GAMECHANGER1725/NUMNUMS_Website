/**
 * The money path's build gate. Run from verify-blog.mjs, so a price that stops
 * reconciling fails the deploy rather than the books.
 *
 * Node stdlib only — verify-blog.mjs runs on Netlify with no npm install.
 */
import assert from 'node:assert/strict';
import {
  priceLine, priceCart, splitCents, depositCents, DEPOSIT_RATE,
  resolveDueAt, cleanWording, collectionSlots, slotLabel,
  earliestDueDay, nextSaturday, BadRequest, MAX_LINES, MAX_WORDING,
} from '../netlify/lib/shared.mjs';
import { listPriceCents, SIZES, FLAVOURS } from '../ops/catalog.mjs';

let n = 0;
const test = (name, fn) => { fn(); n++; };
const throws = (fn, re) => assert.throws(fn, (e) => e instanceof BadRequest && re.test(e.message));

// ── every size × flavour, against a literal table ───────────────────────────
// Written out rather than recomputed: a test that derives the answer the same
// way the code does passes even when both are wrong.
test('all 90 size x flavour prices', () => {
  const BASE = { '6 inch': 3999, '8 inch': 4999, '10 inch': 7499, '12 inch': 8999, '14 inch': 11499, '16 inch': 13499 };
  const PREMIUM = {
    'Rasmalai':       { '6 inch': 1000, '8 inch': 2000, '10 inch': 2500, '12 inch': 3500, '14 inch': 4000, '16 inch': 4500 },
    'Ferrero Rocher': { '6 inch':  500, '8 inch': 1500, '10 inch': 1500, '12 inch': 2500, '14 inch': 3000, '16 inch': 3500 },
  };
  let checked = 0;
  for (const [size, base] of Object.entries(BASE)) {
    for (const { name } of FLAVOURS) {
      assert.equal(listPriceCents(size, name), base + (PREMIUM[name]?.[size] ?? 0), `${size} ${name}`);
      checked++;
    }
  }
  assert.equal(checked, 90, 'expected 6 sizes x 15 flavours');
});

test('a slice and a tiered cake have no online price, and are refused', () => {
  assert.equal(listPriceCents('Slice', 'Vanilla'), null);
  assert.equal(listPriceCents('tiered', 'Vanilla'), null);
  throws(() => priceLine({ size: 'Slice', flavour: 'Vanilla' }), /not sold online/);
  throws(() => priceLine({ size: 'tiered', flavour: 'Vanilla' }), /not sold online/);
  // and null must never have become NaN on the way through
  assert.ok(SIZES.some((s) => s.price == null));
});

test('an unknown size or flavour is refused, not priced at zero', () => {
  throws(() => priceLine({ size: '9 inch', flavour: 'Vanilla' }), /Unknown size/);
  throws(() => priceLine({ size: '8 inch', flavour: 'Lotus Biscoff' }), /Unknown flavour/);
});

test('a price sent by the browser is ignored', () => {
  const l = priceLine({ size: '8 inch', flavour: 'Vanilla', cents: 1, price: 0.01 });
  assert.equal(l.cents, 4999);
});

// ── splitting an amount reconciles to the cent ───────────────────────────────
test('a multi-line discount sums back to exactly the discount', () => {
  const cases = [
    [[3999, 4999, 7499], 1649],            // 10% of a 3-cake cart
    [[3999, 3999, 3999], 1200],            // splits three ways with a remainder
    [[4999], 500],
    [[3999, 17999], 2199],
    [[3999, 4999, 7499, 8999, 11499], 3699],
  ];
  for (const [lines, total] of cases) {
    const shares = splitCents(lines, total);
    assert.equal(shares.reduce((a, b) => a + b, 0), total, `lines ${lines} discount ${total}`);
    shares.forEach((s, i) => assert.ok(s >= 0 && s <= lines[i], 'a share must not exceed its line'));
  }
});

test('a 10% reduction on a three-cake cart reconciles line by line', () => {
  const lines = [3999, 4999, 7499];
  const subtotal = lines.reduce((a, b) => a + b, 0);
  const discount = Math.round((subtotal * 10) / 100);
  const shares = splitCents(lines, discount);
  const charged = lines.map((c, i) => c - shares[i]).reduce((a, b) => a + b, 0);
  assert.equal(charged, subtotal - discount, 'what Stripe charges must equal sum(price - discount)');
});

test('no discount, and a discount larger than the cart', () => {
  assert.deepEqual(splitCents([3999, 4999], 0), [0, 0]);
  const all = splitCents([3999, 4999], 999999);
  assert.equal(all.reduce((a, b) => a + b, 0), 8998, 'a discount cannot exceed the cart');
});

// ── lead time ───────────────────────────────────────────────────────────────
// A shop cake is next day. The rule is a CALENDAR rule, so it is tested as
// day strings — and the two nights a year Sydney shifts DST are in here
// because that is when adding 86_400_000ms to an instant lands on the wrong
// date and books a cake for the wrong day.
test('next day, computed in Sydney parts', () => {
  // 10:00 Sydney, mid-week.
  assert.equal(earliestDueDay(new Date('2026-09-15T00:00:00Z')), '2026-09-16');
  // 23:30 Sydney the same day — still tomorrow, because there is no cut-off.
  assert.equal(earliestDueDay(new Date('2026-09-15T13:30:00Z')), '2026-09-16');
  // Month rollover.
  assert.equal(earliestDueDay(new Date('2026-09-30T02:00:00Z')), '2026-10-01');
  // Year rollover.
  assert.equal(earliestDueDay(new Date('2026-12-31T02:00:00Z')), '2027-01-01');
});

test('DST does not move the earliest day', () => {
  // Sydney gains an hour on the first Sunday of October (4 Oct 2026, 2am).
  // 2026-10-03 11:00 Sydney = 2026-10-03T00:00:00Z.
  assert.equal(earliestDueDay(new Date('2026-10-03T00:00:00Z')), '2026-10-04');
  // And loses it on the first Sunday of April (5 Apr 2026).
  assert.equal(earliestDueDay(new Date('2026-04-04T01:00:00Z')), '2026-04-05');
});

test('tomorrow is bookable and today is not', () => {
  const now = new Date('2026-09-15T00:00:00Z');                 // 10am Sydney
  assert.ok(resolveDueAt('riverstone', '2026-09-16', 9 * 60, now));       // opening
  assert.ok(resolveDueAt('riverstone', '2026-09-16', 18 * 60 + 30, now)); // closing
  throws(() => resolveDueAt('riverstone', '2026-09-15', 18 * 60, now), /until tomorrow/);
  throws(() => resolveDueAt('riverstone', '2026-09-14', 12 * 60, now), /until tomorrow/);
});

test('the horizon and a malformed date still hold', () => {
  const now = new Date('2026-09-15T00:00:00Z');
  throws(() => resolveDueAt('riverstone', '2027-06-01', 12 * 60, now), /too far ahead/);
  throws(() => resolveDueAt('riverstone', 'not-a-date', 12 * 60, now), /collection date/);
  throws(() => resolveDueAt('mulgrave', '2026-09-20', 12 * 60, now), /Pick a shop/);
});

// ── per-store collection hours ──────────────────────────────────────────────
// Harris Park 11:00–22:00, Riverstone 09:00–18:30. Written out as literals
// rather than derived from COLLECTION, so a typo in the window is caught
// instead of being asserted against itself.
test('each shop keeps its own hours, to the half hour', () => {
  const now = new Date('2026-09-15T00:00:00Z');
  const ok  = (s, m) => assert.ok(resolveDueAt(s, '2026-09-20', m, now), `${s} ${m}`);
  const no  = (s, m) => throws(() => resolveDueAt(s, '2026-09-20', m, now), /collects between/);

  // Harris Park: nothing before 11am, evening trade right up to 10pm.
  no('harris-park', 9 * 60);
  no('harris-park', 10 * 60 + 30);
  ok('harris-park', 11 * 60);
  ok('harris-park', 21 * 60 + 30);
  ok('harris-park', 22 * 60);
  no('harris-park', 22 * 60 + 30);

  // Riverstone: opens earlier, shuts at 6:30 — the half hour is the whole
  // reason this is minutes and not hours.
  ok('riverstone', 9 * 60);
  no('riverstone', 8 * 60 + 30);
  ok('riverstone', 18 * 60);
  ok('riverstone', 18 * 60 + 30);
  no('riverstone', 19 * 60);
  // 9pm is fine at one shop and refused at the other. If this ever passes
  // for both, the per-store window has collapsed back to a global one.
  ok('harris-park', 21 * 60);
  no('riverstone', 21 * 60);
});

test('a time between the half hours is refused, not rounded', () => {
  const now = new Date('2026-09-15T00:00:00Z');
  for (const m of [11 * 60 + 1, 11 * 60 + 15, 11 * 60 + 29, 12 * 60 + 45]) {
    throws(() => resolveDueAt('harris-park', '2026-09-20', m, now), /collects between/);
  }
  // And nothing that is not an integer minute.
  for (const m of [null, undefined, NaN, '11:00', 11.5 * 60 + 0.5]) {
    throws(() => resolveDueAt('harris-park', '2026-09-20', m, now), /collects between/);
  }
});

test('the slot lists are the right shape and labelled correctly', () => {
  assert.deepEqual(collectionSlots('harris-park').slice(0, 3), [660, 690, 720]);
  assert.equal(collectionSlots('harris-park').at(-1), 1320);
  assert.equal(collectionSlots('harris-park').length, 23);
  assert.equal(collectionSlots('riverstone').at(0), 540);
  assert.equal(collectionSlots('riverstone').at(-1), 1110);
  assert.equal(collectionSlots('riverstone').length, 20);
  assert.deepEqual(collectionSlots('mulgrave'), []);

  assert.equal(slotLabel(540), '9:00 AM');
  assert.equal(slotLabel(690), '11:30 AM');
  assert.equal(slotLabel(720), '12:00 PM');   // noon is 12 PM, not 0
  assert.equal(slotLabel(1110), '6:30 PM');
  assert.equal(slotLabel(1320), '10:00 PM');
});

test('the resolved instant carries the half hour into Sydney time', () => {
  const now = new Date('2026-09-15T00:00:00Z');
  // 6:30pm Sydney on 20 Sep 2026 is AEST (+10), so 08:30 UTC.
  assert.equal(resolveDueAt('riverstone', '2026-09-20', 18 * 60 + 30, now), '2026-09-20T08:30:00.000Z');
  // After the October DST flip Sydney is +11, so the same wall clock is 07:30Z.
  const later = new Date('2026-10-20T00:00:00Z');
  assert.equal(resolveDueAt('riverstone', '2026-11-10', 18 * 60 + 30, later), '2026-11-10T07:30:00.000Z');
});

// ── carts ───────────────────────────────────────────────────────────────────
test('a cart is bounded, stored and dated', () => {
  const now = new Date('2026-09-14T02:00:00Z');
  const one = { store: 'harris-park', dueDate: '2026-09-18', dueMin: 12 * 60, lines: [{ size: '8 inch', flavour: 'Vanilla' }] };
  assert.equal(priceCart(one, now).subtotalCents, 4999);
  throws(() => priceCart({ ...one, lines: [] }, now), /empty/);
  throws(() => priceCart({ ...one, store: 'mulgrave' }, now), /Pick a shop/);
  throws(() => priceCart({ ...one, lines: Array(MAX_LINES + 1).fill(one.lines[0]) }, now), /limited to/);
});

test('wording is bounded and stripped of control characters', () => {
  assert.equal(cleanWording('Happy  Birthday\n'), 'Happy  Birthday');
  assert.equal(cleanWording('x'.repeat(200)).length, MAX_WORDING);
  assert.equal(cleanWording(null), '');
  assert.equal(cleanWording(undefined), '');
});

// ── quantities ──────────────────────────────────────────────────────────────
// A quantity is not a display detail: every cake it stands for becomes its own
// orders row, docket and share of the deposit. If expansion and the kitchen ever
// disagree, somebody pays for three cakes and collects one.
test('a quantity expands into one priced line per cake', () => {
  const now = new Date('2026-09-14T02:00:00Z');
  const base = { store: 'harris-park', dueDate: '2026-09-18', dueMin: 12 * 60 };
  const cart = { ...base, lines: [
    { size: '8 inch', flavour: 'Vanilla', qty: 3 },
    { size: '6 inch', flavour: 'Chocolate', qty: 2 },
  ] };
  const priced = priceCart(cart, now);
  assert.equal(priced.lines.length, 5);
  assert.equal(priced.subtotalCents, 4999 * 3 + 3999 * 2);
  // A cart written before quantities existed means one cake, not none.
  assert.equal(priceCart({ ...base, lines: [{ size: '8 inch', flavour: 'Vanilla' }] }, now).lines.length, 1);
});

test('the cap counts cakes, not rows', () => {
  const now = new Date('2026-09-14T02:00:00Z');
  const base = { store: 'harris-park', dueDate: '2026-09-18', dueMin: 12 * 60 };
  const line = (qty) => ({ size: '8 inch', flavour: 'Vanilla', qty });
  assert.equal(priceCart({ ...base, lines: [line(5), line(5)] }, now).lines.length, MAX_LINES);
  throws(() => priceCart({ ...base, lines: [line(6), line(5)] }, now), /limited to/);
  throws(() => priceCart({ ...base, lines: [line(0)] }, now), /quantity/);
  throws(() => priceCart({ ...base, lines: [line(1.5)] }, now), /quantity/);
  throws(() => priceCart({ ...base, lines: [line(-2)] }, now), /quantity/);
  throws(() => priceCart({ ...base, lines: [line(99)] }, now), /quantity/);
});

test('a discount over expanded cakes still reconciles to the cent', () => {
  const now = new Date('2026-09-14T02:00:00Z');
  const cart = { store: 'harris-park', dueDate: '2026-09-18', dueMin: 12 * 60,
    lines: [{ size: '8 inch', flavour: 'Rasmalai', qty: 3 }] };
  const { lines, subtotalCents } = priceCart(cart, now);
  // 10% of 3 x $69.99 is 2099.7c — the third of a cent that has to land somewhere.
  const total = Math.round((subtotalCents * 10) / 100);
  const shares = splitCents(lines.map((l) => l.cents), total);
  assert.equal(shares.reduce((a, b) => a + b, 0), total);
  assert.equal(shares.length, 3);
});

// ── the mobile number ───────────────────────────────────────────────────────
// Required at both ends. A web order with no number is one nobody can chase,
// and the browser's own check proves nothing.
test('an Australian mobile is accepted however it is typed', () => {
  const AU = /^(?:\+?61|0)4\d{8}$/;
  const clean = (v) => v.replace(/[\s()-]/g, '');
  for (const good of ['0412 345 678', '+61 412 345 678', '61412345678', '0412345678', '(04) 1234 5678']) {
    assert.ok(AU.test(clean(good)), good);
  }
  for (const bad of ['', '0212345678', '041234567', '04123456789', 'not a phone', '412345678']) {
    assert.ok(!AU.test(clean(bad)), bad);
  }
});

// ── the 50% deposit ─────────────────────────────────────────────────────────
// Half now, half at the counter. Two things must hold or money goes missing:
// the deposit is never more than the total, and the per-line deposits sum to
// the charge EXACTLY. A cent lost here is a cent the books can never find.
test('the deposit is half, floored, and never reaches the total', () => {
  assert.equal(DEPOSIT_RATE, 0.5);
  // The real catalogue prices, worked by hand rather than recomputed.
  assert.equal(depositCents(3999), 1999);   // 6"  -> $19.99 now, $20.00 later
  assert.equal(depositCents(4999), 2499);   // 8"  -> $24.99 now, $25.00 later
  assert.equal(depositCents(7499), 3749);   // 10"
  assert.equal(depositCents(13499), 6749);  // 16"
  assert.equal(depositCents(5000), 2500);   // an even total splits cleanly
  // The customer is never asked for more up front than they owe at the
  // counter — floor, so the balance is always the larger half.
  for (const t of [1, 2, 3, 99, 3999, 4999, 10000, 13499, 99999]) {
    const d = depositCents(t);
    assert.ok(d <= t - d || t === 1, `deposit ${d} exceeds balance on ${t}`);
    assert.ok(d >= 1 && d <= t, `deposit ${d} out of range on ${t}`);
  }
  assert.equal(depositCents(0), 0);
});

test('per-line deposits sum to the charge exactly', () => {
  // Odd cents on every line is the case naive halving gets wrong.
  const carts = [
    [3999], [3999, 4999], [3999, 4999, 7499], [4999, 4999, 4999],
    [3999, 3999, 3999, 3999, 3999, 3999, 3999, 3999, 3999, 3999],
    [13499, 3999, 11499],
  ];
  for (const lines of carts) {
    const net = lines.reduce((a, b) => a + b, 0);
    const depositTotal = depositCents(net);
    const per = splitCents(lines, depositTotal);
    assert.equal(per.reduce((a, b) => a + b, 0), depositTotal,
      `deposits do not sum on ${lines.join('+')}`);
    assert.ok(per.every((c) => c >= 0), 'a negative deposit line');
    // And the balance still reconciles against the full price.
    assert.equal(net - depositTotal, lines.reduce((a, b) => a + b, 0) - depositTotal);
  }
});

test('a reduced total and a deposit compose without losing a cent', () => {
  // 10% off three cakes, then half of what is left — splitCents twice.
  const lines = [3999, 4999, 7499];
  const gross = lines.reduce((a, b) => a + b, 0);
  const discountTotal = Math.round((gross * 10) / 100);
  const shares = splitCents(lines, discountTotal);
  assert.equal(shares.reduce((a, b) => a + b, 0), discountTotal);

  const net = lines.map((c, i) => c - shares[i]);
  const netTotal = net.reduce((a, b) => a + b, 0);
  assert.equal(netTotal, gross - discountTotal);

  const depositTotal = depositCents(netTotal);
  const deposits = splitCents(net, depositTotal);
  assert.equal(deposits.reduce((a, b) => a + b, 0), depositTotal);
  // Every cake owes a non-negative balance at the counter.
  net.forEach((c, i) => assert.ok(c - deposits[i] >= 0, `line ${i} owes negative`));
});

// The "N pickups left for Saturday" line names a date; a wrong one is a false claim.
test('nextSaturday is the first bookable Saturday, in Sydney days', () => {
  // Tue 6 Oct 2026, 10am Sydney -> earliest Wed 7 -> Sat 10.
  assert.equal(nextSaturday(new Date('2026-10-05T23:00:00Z')), '2026-10-10');
  // Fri 9 Oct, 2pm Sydney -> earliest Sat 10 itself.
  assert.equal(nextSaturday(new Date('2026-10-09T03:00:00Z')), '2026-10-10');
  // Sat 10 Oct, 11pm Sydney (still Sat 10 Oct in UTC midday terms) -> earliest Sun 11 -> Sat 17.
  assert.equal(nextSaturday(new Date('2026-10-10T12:00:00Z')), '2026-10-17');
  // Year rollover: Thu 31 Dec 2026 -> earliest Fri 1 Jan -> Sat 2 Jan 2027.
  assert.equal(nextSaturday(new Date('2026-12-30T22:00:00Z')), '2027-01-02');
});

console.log(`checkout: ${n} checks pass`);
