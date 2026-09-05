// Pure aggregation + date logic for the ops app. No DOM, no network — kept
// separate from the UI purely so it can be tested, because this is the one
// place where a silent bug produces confident wrong numbers, which is the
// exact problem this app exists to fix.
//
// Everything is bucketed in Australia/Sydney local time. Using UTC would push
// a Sunday-evening pickup into the wrong week and put cakes in the wrong
// section of the baker's list.

const TZ = 'Australia/Sydney';

const partsFmt = new Intl.DateTimeFormat('en-AU', {
  timeZone: TZ,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
  hourCycle: 'h23',
});

const toDate = (v) => (v instanceof Date ? v : new Date(v));
const num = (v) => (v == null || v === '' ? 0 : Number(v));

/** Calendar parts as they read on a clock in Sydney. */
export function sydneyParts(input) {
  const p = {};
  for (const { type, value } of partsFmt.formatToParts(toDate(input))) {
    if (type !== 'literal') p[type] = value;
  }
  return {
    year: +p.year,
    month: +p.month,
    day: +p.day,
    hour: +p.hour,
    minute: +p.minute,
    dayKey: `${p.year}-${p.month}-${p.day}`,
  };
}

const dayKeyToUTC = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/**
 * Whole calendar days from one Sydney day to another. Diffing UTC midnights of
 * the two calendar dates makes this DST-proof — subtracting raw timestamps
 * would be an hour out across a changeover and silently shift a whole day.
 */
export function daysBetween(fromKey, toKey) {
  return Math.round((dayKeyToUTC(toKey) - dayKeyToUTC(fromKey)) / 86400000);
}

/** 'Overdue' | 'Today' | 'Tomorrow' | 'In N days' from a whole-day offset. */
export function dayLabel(diff) {
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

/** Day section for one order, relative to now. */
export function dayBucket(dueAt, now = new Date()) {
  return dayLabel(daysBetween(sydneyParts(now).dayKey, sydneyParts(dueAt).dayKey));
}

/** Monday-start week, as the Sydney day key of that Monday. */
export function weekStartKey(input) {
  const { year, month, day } = sydneyParts(input);
  const utc = Date.UTC(year, month - 1, day);
  const back = (new Date(utc).getUTCDay() + 6) % 7; // Monday = 0
  const d = new Date(utc - back * 86400000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

/**
 * What has actually been paid on an order. A collected cake is assumed paid in
 * full — the deposit field only tracks money taken up front, so without this
 * every completed order would look like it still owed the balance.
 */
export function paidOn(order) {
  if (order.status === 'picked_up') return num(order.price);
  return num(order.deposit);
}

/**
 * Money and volume over a set of orders. Cancelled orders are excluded
 * entirely. Orders with no cost recorded still count toward revenue but are
 * left out of margin, so a half-costed week reports an honest margin over the
 * part it can actually see rather than a flattering one over all of it.
 */
export function summarise(orders) {
  let count = 0, revenue = 0, collected = 0;
  let costedRevenue = 0, cost = 0, costedCount = 0;

  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    count++;
    revenue += num(o.price);
    collected += paidOn(o);
    if (o.cost != null) {
      costedCount++;
      cost += num(o.cost);
      costedRevenue += num(o.price);
    }
  }

  return {
    count,
    revenue,
    collected,
    owing: revenue - collected,
    avgOrder: count ? revenue / count : 0,
    cost,
    costedCount,
    margin: costedCount ? costedRevenue - cost : null,
    marginPct: costedRevenue ? ((costedRevenue - cost) / costedRevenue) * 100 : null,
  };
}

/** Orders falling in a given Sydney week, by pickup date. */
export function inWeek(orders, weekKey) {
  return orders.filter((o) => weekStartKey(o.due_at) === weekKey);
}

/** This week vs last week, Monday-start, by pickup date. */
export function weeklyStats(orders, now = new Date()) {
  const thisKey = weekStartKey(now);
  const lastKey = weekStartKey(new Date(dayKeyToUTC(thisKey) - 86400000));
  return {
    thisWeekKey: thisKey,
    lastWeekKey: lastKey,
    thisWeek: summarise(inWeek(orders, thisKey)),
    lastWeek: summarise(inWeek(orders, lastKey)),
  };
}

/** 24-slot histogram of pickup times — when the shop is actually busy. */
export function busiestHours(orders) {
  const hours = new Array(24).fill(0);
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    hours[sydneyParts(o.due_at).hour]++;
  }
  return hours;
}

/**
 * Australian mobile/landline numbers to one comparable form, so the same
 * customer typed three different ways counts once.
 */
export function normalisePhone(phone) {
  if (!phone) return null;
  let d = String(phone).replace(/\D/g, '');
  if (d.startsWith('0061')) d = d.slice(4);
  else if (d.startsWith('61')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  return d ? `0${d}` : null;
}

/** New vs returning customers, plus who orders most. */
export function repeatCustomers(orders) {
  const byPhone = new Map();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const key = normalisePhone(o.customer_phone);
    if (!key) continue;
    const seen = byPhone.get(key) || { phone: key, name: o.customer_name, orders: 0, spend: 0 };
    seen.orders++;
    seen.spend += num(o.price);
    byPhone.set(key, seen);
  }
  const all = [...byPhone.values()];
  const returning = all.filter((c) => c.orders > 1);
  return {
    total: all.length,
    newCount: all.filter((c) => c.orders === 1).length,
    returningCount: returning.length,
    // Repeat customer rate: the share of known customers who came back at
    // least once. The single clearest measure of whether the cakes are good
    // enough to bring people back, and it needs no extra data entry.
    rate: all.length ? (returning.length / all.length) * 100 : 0,
    top: returning.sort((a, b) => b.orders - a.orders || b.spend - a.spend),
  };
}

/** Group orders into the baker's day sections, custom cakes first. */
export function bakerSections(orders, now = new Date()) {
  const sections = new Map();
  const sorted = [...orders].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'custom' ? -1 : 1;
    return new Date(a.due_at) - new Date(b.due_at);
  });
  for (const o of sorted) {
    const label = dayBucket(o.due_at, now);
    if (!sections.has(label)) sections.set(label, []);
    sections.get(label).push(o);
  }
  // Overdue first, then chronologically by how far out the day is.
  const rank = (label) => {
    if (label === 'Overdue') return -1;
    if (label === 'Today') return 0;
    if (label === 'Tomorrow') return 1;
    return Number(label.match(/\d+/)[0]);
  };
  return [...sections.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
}

/**
 * Six Sunday-start weeks covering a month, for the date picker grid.
 * Always six rows so the panel never changes height between months, which
 * would make the buttons below it jump under a thumb mid-tap.
 * `month` is 1-12. Dates are built in UTC purely as calendar arithmetic; the
 * keys they produce are compared against Sydney day keys, never re-timezoned.
 */
export function monthGrid(year, month) {
  const pad = (n) => String(n).padStart(2, '0');
  const first = Date.UTC(year, month - 1, 1);
  const start = first - new Date(first).getUTCDay() * 86400000;

  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start + (w * 7 + d) * 86400000);
      row.push({
        key: `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`,
        day: dt.getUTCDate(),
        inMonth: dt.getUTCMonth() === month - 1,
      });
    }
    weeks.push(row);
  }
  return weeks;
}

/** Step a {year, month} pair by whole months, rolling the year over. */
export function shiftMonth(year, month, by) {
  const i = (year * 12 + (month - 1)) + by;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

/** A Sydney day key + local hour/minute back into a real instant. */
export function sydneyDateTimeToISO(dayKey, hour, minute) {
  const [y, m, d] = dayKey.split('-').map(Number);
  // Sydney is UTC+10 or +11; try both and keep whichever round-trips to the
  // wall-clock time that was actually chosen. Beats hard-coding the DST rules.
  for (const offset of [10, 11]) {
    const guess = new Date(Date.UTC(y, m - 1, d, hour - offset, minute));
    const back = sydneyParts(guess);
    if (back.dayKey === dayKey && back.hour === hour && back.minute === minute) {
      return guess.toISOString();
    }
  }
  // Inside the skipped hour of a DST jump that wall-clock time does not exist;
  // +10 lands on the next valid instant, which is what a clock would show.
  return new Date(Date.UTC(y, m - 1, d, hour - 10, minute)).toISOString();
}

// ── Windows ─────────────────────────────────────────────────────────────────

/**
 * Orders whose *sale* happened in the last `days` days.
 *
 * Sales windows key off `created_at`, not `due_at`. A cake booked today for a
 * pickup three weeks out is money taken today; bucketing it by pickup date
 * reported $0 for the week the sale actually happened and then dumped the whole
 * amount into a future week. That mismatch is what made a freshly logged order
 * show as "0 orders" under "last 7 days".
 *
 * `due_at` is still the right field for production views — what is due today,
 * what the baker makes next, when pickups cluster — and those keep using it.
 */
export function soldWithin(orders, days, now = new Date()) {
  const todayKey = sydneyParts(now).dayKey;
  return orders.filter((o) => {
    const d = daysBetween(sydneyParts(o.created_at).dayKey, todayKey);
    return d >= 0 && d < days;
  });
}

/** Orders sold in the Sydney week (Mon-Sun) containing `ref`, by sale date. */
export function soldInWeek(orders, weekKey) {
  return orders.filter((o) => weekStartKey(o.created_at) === weekKey);
}

/** This week vs last week by *sale* date — what the shop actually took. */
export function salesByWeek(orders, now = new Date()) {
  const thisKey = weekStartKey(now);
  const lastKey = weekStartKey(new Date(dayKeyToUTC(thisKey) - 86400000));
  return {
    thisWeekKey: thisKey,
    lastWeekKey: lastKey,
    thisWeek: summarise(soldInWeek(orders, thisKey)),
    lastWeek: summarise(soldInWeek(orders, lastKey)),
  };
}

/** How many orders are missing a price — revenue is understated by exactly these. */
export function missingPrice(orders) {
  return orders.filter((o) => o.status !== 'cancelled' && (o.price == null || o.price === ''));
}

// ── Order log sections ──────────────────────────────────────────────────────

/**
 * Groups the order log into one section per day rather than lumping everything
 * past tomorrow into "This week" / "Later". Staff plan by the day, so the
 * section header has to name the day.
 *
 * Finished orders drop off after `collectedDays` so the log stays a worklist
 * rather than an ever-growing archive.
 */
export function logSections(orders, now = new Date(), { collectedDays = 7 } = {}) {
  const todayKey = sydneyParts(now).dayKey;
  const open = new Map();
  const collected = [];
  const cancelled = [];

  for (const o of orders) {
    const dueKey = sydneyParts(o.due_at).dayKey;
    // A cancelled cake is not a finished one. Filed together they read as the
    // same outcome, and staff could not tell a collected order from a dropped
    // one without opening it.
    if (o.status === 'cancelled') {
      if (daysBetween(dueKey, todayKey) <= collectedDays) cancelled.push(o);
      continue;
    }
    if (o.status === 'picked_up') {
      if (daysBetween(dueKey, todayKey) <= collectedDays) collected.push(o);
      continue;
    }
    const diff = daysBetween(todayKey, dueKey);
    const label = dayLabel(diff);
    // Every overdue day collapses into one section, sorted to the top.
    const rank = diff < 0 ? -1 : diff;
    if (!open.has(label)) open.set(label, { label, rank, rows: [] });
    open.get(label).rows.push(o);
  }

  const sections = [...open.values()]
    .sort((a, b) => a.rank - b.rank)
    .map((s) => [s.label, s.rows]);

  if (collected.length) {
    collected.sort((a, b) => new Date(b.due_at) - new Date(a.due_at));
    sections.push(['Collected', collected]);
  }
  if (cancelled.length) {
    cancelled.sort((a, b) => new Date(b.due_at) - new Date(a.due_at));
    sections.push(['Cancelled', cancelled]);
  }
  return sections;
}

/** Orders whose pickup falls inside an inclusive Sydney day-key range. */
export function inDateRange(orders, fromKey, toKey) {
  const [lo, hi] = fromKey <= toKey ? [fromKey, toKey] : [toKey, fromKey];
  return orders.filter((o) => {
    const k = sydneyParts(o.due_at).dayKey;
    return k >= lo && k <= hi;
  });
}

// ── In-store sales tally ────────────────────────────────────────────────────

/**
 * What was sold over the counter on a given day, grouped by size and flavour.
 *
 * Walk-ins are cakes the customer saw and bought on the spot, so they are
 * created already collected — `created_at` is the moment of sale. The baker
 * uses this to know what actually moved and what to make more of; without it
 * he is replenishing the counter from memory.
 */
export function inStoreTally(orders, dayKey, { store = null } = {}) {
  const rows = new Map();
  let count = 0, revenue = 0;

  for (const o of orders) {
    if (!o.walk_in || o.status === 'cancelled') continue;
    if (store && o.store !== store) continue;
    if (sydneyParts(o.created_at).dayKey !== dayKey) continue;

    const size = o.size || '—';
    const flavour = o.flavour || '—';
    const key = `${size}|${flavour}`;
    const row = rows.get(key) || { size, flavour, count: 0, revenue: 0 };
    row.count += 1;
    row.revenue += num(o.price);
    rows.set(key, row);

    count += 1;
    revenue += num(o.price);
  }

  return {
    count,
    revenue,
    rows: [...rows.values()].sort((a, b) => b.count - a.count || b.revenue - a.revenue),
  };
}

/** The stable tail of an Australian number — matches the DB's phone_key. */
export function phoneKey(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length >= 6 ? digits.slice(-9) : null;
}

/**
 * Free-text order search over the things staff actually remember: the customer,
 * the docket number, the phone, and what the cake was.
 * Digits in the query are matched against the phone tail so "697 725",
 * "0425697725" and "+61425697725" all find the same customer.
 */
export function searchOrders(orders, term) {
  const q = String(term ?? '').trim().toLowerCase();
  if (!q) return orders;
  // Normalise a full number the same way the stored key is normalised, or the
  // +61 form is longer than what it is being compared against and never matches.
  // Shorter queries stay as-is so a partial number still works as a substring.
  const qDigits = q.replace(/\D/g, '');
  const qPhone = qDigits.length >= 4
    ? (qDigits.length >= 9 ? qDigits.slice(-9) : qDigits)
    : null;

  return orders.filter((o) => {
    const hay = [o.customer_name, o.order_no, o.flavour, o.size, o.wording]
      .filter(Boolean).join(' ').toLowerCase();
    if (hay.includes(q)) return true;
    if (qPhone) {
      const key = phoneKey(o.customer_phone);
      if (key && key.includes(qPhone)) return true;
    }
    return false;
  });
}

/** Sydney weekday, 0 = Sunday. */
export function weekdayIndex(input) {
  const { year, month, day } = sydneyParts(input);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Pickups and takings by day of the week.
 *
 * Tells the shop which days actually carry the week — the difference between
 * rostering on a feeling and rostering on the book.
 */
export function byWeekday(orders, field = 'due_at') {
  const days = WEEKDAYS.map((label) => ({ label, count: 0, revenue: 0 }));
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const d = days[weekdayIndex(o[field])];
    d.count += 1;
    d.revenue += num(o.price);
  }
  return days;
}

/**
 * How far ahead people order.
 *
 * Drives two decisions nothing else answers: how much notice the baker
 * realistically gets, and how far out the counter needs stock ready. Walk-ins
 * are excluded — bought and collected in the same breath, they have no lead
 * time and would drag the median to zero.
 */
export function leadTimes(orders) {
  const days = [];
  for (const o of orders) {
    if (o.status === 'cancelled' || o.walk_in) continue;
    const d = daysBetween(sydneyParts(o.created_at).dayKey, sydneyParts(o.due_at).dayKey);
    if (d >= 0) days.push(d);
  }
  days.sort((a, b) => a - b);

  const bands = [
    { label: 'Same day',     min: 0,  max: 0 },
    { label: '1–2 days',     min: 1,  max: 2 },
    { label: '3–6 days',     min: 3,  max: 6 },
    { label: '1–2 weeks',    min: 7,  max: 14 },
    { label: 'Over 2 weeks', min: 15, max: Infinity },
  ].map((b) => ({ ...b, count: days.filter((d) => d >= b.min && d <= b.max).length }));

  return {
    count: days.length,
    median: days.length ? days[Math.floor(days.length / 2)] : null,
    longest: days.length ? days[days.length - 1] : null,
    bands,
  };
}

/**
 * Orders with no phone number. Each one is a customer who can never be matched
 * to a past or future order, so the repeat rate reads lower than reality.
 */
export function missingPhone(orders) {
  return orders.filter((o) => o.status !== 'cancelled' && !phoneKey(o.customer_phone));
}

/**
 * Print jobs grouped the same way the baker's queue is: by the pickup day of
 * the cake they belong to, soonest first, so "what has to be printed before
 * Saturday" is one glance rather than a scan of every job.
 *
 * Finished jobs collapse into a single trailing section and age out after a
 * week — long enough to notice a mistake, short enough that the board stays
 * a worklist instead of an archive.
 */
export function printSections(jobs, now = new Date()) {
  const todayKey = sydneyParts(now).dayKey;
  const sections = new Map();

  const pending = jobs
    .filter((j) => j.status !== 'printed')
    .sort((a, b) => new Date(a.order.due_at) - new Date(b.order.due_at));

  for (const j of pending) {
    const label = dayBucket(j.order.due_at, now);
    if (!sections.has(label)) sections.set(label, []);
    sections.get(label).push(j);
  }

  const rank = (label) => {
    if (label === 'Overdue') return -1;
    if (label === 'Today') return 0;
    if (label === 'Tomorrow') return 1;
    return Number(label.match(/\d+/)[0]);
  };
  const out = [...sections.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));

  const done = jobs
    .filter((j) => j.status === 'printed' && j.printed_at
      && daysBetween(sydneyParts(j.printed_at).dayKey, todayKey) < 7)
    .sort((a, b) => new Date(b.printed_at) - new Date(a.printed_at));
  if (done.length) out.push(['Printed', done]);

  return out;
}

/**
 * Per-store trading summary.
 *
 * "Is Riverstone actually profitable" was one of the two questions this whole
 * app was built to answer, and until now the store panel showed revenue and a
 * count — which tells you which shop is busier, not which one makes money.
 *
 * Margin here is deliberately computed off only the orders that have a cost
 * recorded, and the coverage is returned alongside it, because a 60% margin
 * drawn from two of twenty cakes is worse than no number at all.
 */
export function storeBreakdown(orders, storeCodes) {
  const rows = storeCodes.map((code) => {
    const mine = orders.filter((o) => o.store === code);
    return { code, ...summarise(mine) };
  });

  const total = rows.reduce((t, r) => t + r.revenue, 0);
  for (const r of rows) {
    r.share = total ? (r.revenue / total) * 100 : 0;
    // Enough of the sample priced up to be worth reading as a rate.
    r.marginTrusted = r.count > 0 && r.costedCount / r.count >= 0.5;
  }
  return { rows: rows.sort((a, b) => b.revenue - a.revenue), total };
}

// ── Bookkeeper export ───────────────────────────────────────────────────────

const pad2 = (n) => String(n).padStart(2, '0');
const lastDayOf = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();   // m is 1-12

/**
 * The windows a bookkeeper actually asks for. Months and the Australian
 * financial year (1 July – 30 June), not a free-form range nobody can name
 * afterwards when the file is sitting in their inbox.
 *
 * Boundaries are Sydney days, so an order taken at 9pm on the 31st belongs to
 * that month rather than the next one.
 */
export function exportRanges(now = new Date()) {
  const t = sydneyParts(now);
  const monthKeys = (y, m) => ({ fromKey: `${y}-${pad2(m)}-01`, toKey: `${y}-${pad2(m)}-${pad2(lastDayOf(y, m))}` });
  const monthName = (y, m) => new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', month: 'long', year: 'numeric' })
    .format(new Date(Date.UTC(y, m - 1, 15)));

  const prevY = t.month === 1 ? t.year - 1 : t.year;
  const prevM = t.month === 1 ? 12 : t.month - 1;

  // The FY that today sits in: starts 1 July of this year if we are past June.
  const fyStart = t.month >= 7 ? t.year : t.year - 1;

  return [
    { key: 'this-month', label: monthName(t.year, t.month), note: 'This month so far',
      ...monthKeys(t.year, t.month), toKey: t.dayKey },
    { key: 'last-month', label: monthName(prevY, prevM), note: 'Last full month',
      ...monthKeys(prevY, prevM) },
    { key: 'quarter', label: 'Last 90 days', note: 'Rolling',
      fromKey: addDayKey(t.dayKey, -89), toKey: t.dayKey },
    { key: 'fy', label: `FY ${fyStart}–${String(fyStart + 1).slice(2)}`, note: 'From 1 July',
      fromKey: `${fyStart}-07-01`, toKey: t.dayKey },
  ];
}

function addDayKey(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/**
 * CSV a spreadsheet will open without mangling anything.
 *
 * Two hazards this closes. Quotes and commas inside a cake's notes would end
 * the field early and shunt every later column across by one — silently, and
 * only on the rows where someone typed a comma. And a value opening with
 * = + - @ is executed as a formula by Excel and Sheets, so a notes field is a
 * live injection into whoever opens the books; those get a leading apostrophe,
 * which the spreadsheet strips on display.
 */
export function csvCell(value) {
  if (value == null) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers, rows) {
  return [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

// ── Series for the finance charts ───────────────────────────────────────────

/**
 * Takings per Sydney day, oldest first, with empty days kept.
 *
 * The gaps matter: dropping a zero-revenue Monday would slide Tuesday left and
 * quietly redraw the weekly rhythm the chart exists to show.
 */
export function dailyTakings(orders, days = 30, now = new Date()) {
  const todayKey = sydneyParts(now).dayKey;
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i--) buckets.set(addDayKey(todayKey, -i), { revenue: 0, count: 0 });

  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const b = buckets.get(sydneyParts(o.created_at).dayKey);
    if (!b) continue;
    b.revenue += num(o.price);
    b.count += 1;
  }
  return [...buckets.entries()].map(([dayKey, b]) => ({ dayKey, ...b }));
}

/** Revenue per Monday-week per store, oldest first, for the stacked columns. */
export function weeklyByStore(orders, storeCodes, weeks = 8, now = new Date()) {
  const keys = [];
  for (let i = weeks - 1; i >= 0; i--) {
    keys.push(weekStartKey(new Date(now.getTime() - i * 7 * 86400000)));
  }
  const rows = keys.map((key) => ({
    key,
    total: 0,
    byStore: Object.fromEntries(storeCodes.map((c) => [c, 0])),
  }));
  const index = new Map(rows.map((r) => [r.key, r]));

  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const r = index.get(weekStartKey(o.created_at));
    if (!r || !(o.store in r.byStore)) continue;
    r.byStore[o.store] += num(o.price);
    r.total += num(o.price);
  }
  return rows;
}

/**
 * Customer leaderboards, over rows of the `customers` view.
 *
 * The view, not the analytics fetch: that window is 63 days, and a customer who
 * has "gone quiet" has by definition not ordered inside it — computing this off
 * the same rows as the charts made that board permanently empty, and quietly
 * understated the other three.
 *
 * Four boards off one pass, because the useful question changes by the day:
 * who spends most, who comes most often, who is worth the most per visit, and
 * — the one nobody thinks to ask — which regular has stopped coming.
 */
export function customerLeaderboard(customers, now = new Date(), limit = 8) {
  const todayKey = sydneyParts(now).dayKey;

  const all = customers.map((c) => {
    const orders = Number(c.order_count) || 0;
    const spend = Number(c.spend) || 0;
    return {
      key: c.phone_key,
      name: c.name,
      phone: c.phone,
      orders,
      spend,
      avg: orders ? spend / orders : 0,
      firstKey: sydneyParts(c.first_order).dayKey,
      lastKey: sydneyParts(c.last_order).dayKey,
      daysSince: daysBetween(sydneyParts(c.last_order).dayKey, todayKey),
    };
  });

  const top = (rows, cmp) => [...rows].sort(cmp).slice(0, limit);

  const returning = all.filter((c) => c.orders > 1);

  return {
    total: all.length,
    newCount: all.length - returning.length,
    returningCount: returning.length,
    // Repeat customer rate: the share of known customers who came back at least
    // once. Computed here rather than off the analytics fetch, so it means what
    // the panel says it means — every order on record, not the last 63 days.
    rate: all.length ? (returning.length / all.length) * 100 : 0,
    spend:  top(all, (a, b) => b.spend - a.spend || b.orders - a.orders),
    orders: top(all, (a, b) => b.orders - a.orders || b.spend - a.spend),
    // One big cake does not make a high-value customer, so this board needs a
    // repeat history behind the average before it means anything.
    avg:    top(all.filter((c) => c.orders >= 2), (a, b) => b.avg - a.avg),
    // Regulars who have gone quiet — the only board that is a to-do list.
    lapsed: top(all.filter((c) => c.orders >= 2 && c.daysSince >= 45),
                (a, b) => b.daysSince - a.daysSince || b.spend - a.spend),
  };
}

// ── The forward book ────────────────────────────────────────────────────────

/**
 * What is already booked for the days ahead.
 *
 * Every other panel in this app looks backwards, which answers how trading
 * went but not the question actually asked at the end of a shift: what have we
 * got on. For a shop that takes orders a week out, the forward book is the
 * half you can still do something about — roster against it, buy against it,
 * and chase the deposits sitting inside it.
 *
 * Collected orders are excluded: a cake already handed over is not "coming up",
 * even on a day that has not finished yet.
 */
export function forwardBook(orders, days = 7, now = new Date()) {
  const todayKey = sydneyParts(now).dayKey;
  const rows = [];
  for (let i = 0; i < days; i++) {
    rows.push({ dayKey: addDayKey(todayKey, i), count: 0, custom: 0, value: 0, collected: 0, owing: 0, unpriced: 0 });
  }
  const index = new Map(rows.map((r) => [r.dayKey, r]));

  for (const o of orders) {
    if (o.status === 'picked_up' || o.status === 'cancelled') continue;
    const r = index.get(sydneyParts(o.due_at).dayKey);
    if (!r) continue;
    r.count += 1;
    if (o.kind === 'custom') r.custom += 1;
    r.value += num(o.price);
    r.collected += paidOn(o);
    if (o.price == null) r.unpriced += 1;
  }
  for (const r of rows) r.owing = Math.max(0, r.value - r.collected);

  const sum = (k) => rows.reduce((t, r) => t + r[k], 0);
  return {
    rows,
    count: sum('count'),
    custom: sum('custom'),
    value: sum('value'),
    collected: sum('collected'),
    owing: sum('owing'),
    unpriced: sum('unpriced'),
    busiest: rows.reduce((b, r) => (r.count > b.count ? r : b), rows[0]),
  };
}

/**
 * Average pickups per weekday over the trailing weeks, so a day in the forward
 * book can be read against what that weekday normally holds. Four booked on a
 * Tuesday means nothing until you know Tuesday usually runs two.
 */
export function weekdayNorm(orders, weeks = 6, now = new Date()) {
  const todayKey = sydneyParts(now).dayKey;
  const counts = WEEKDAYS.map(() => 0);

  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const key = sydneyParts(o.due_at).dayKey;
    const age = daysBetween(key, todayKey);
    if (age <= 0 || age > weeks * 7) continue;      // finished days only
    counts[weekdayIndex(o.due_at)] += 1;
  }
  return counts.map((c) => c / weeks);
}

/**
 * How each flavour or size actually trades.
 *
 * Counting cakes says what is popular, which is not the same question as what
 * is worth making. The cheapest sponge can top the list on volume and sit near
 * the bottom on money earned, and until margin is on the same row nobody can
 * see that.
 *
 * Margin comes only from the orders with a cost recorded, and the coverage
 * rides along, for the same reason it does per store: a rate drawn from two of
 * twenty cakes is a hint, not a fact.
 */
export function productMix(orders, field) {
  const m = new Map();

  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const k = o[field] || '—';
    const row = m.get(k) || { k, count: 0, revenue: 0, cost: 0, costedCount: 0, costedRevenue: 0 };
    row.count += 1;
    row.revenue += num(o.price);
    if (o.cost != null) {
      row.costedCount += 1;
      row.cost += num(o.cost);
      row.costedRevenue += num(o.price);
    }
    m.set(k, row);
  }

  const rows = [...m.values()];
  const total = rows.reduce((t, r) => t + r.revenue, 0);

  for (const r of rows) {
    r.avgPrice = r.count ? r.revenue / r.count : 0;
    r.margin = r.costedCount ? r.costedRevenue - r.cost : null;
    r.marginPct = r.costedRevenue ? ((r.costedRevenue - r.cost) / r.costedRevenue) * 100 : null;
    r.share = total ? (r.revenue / total) * 100 : 0;
    r.marginTrusted = r.count > 0 && r.costedCount / r.count >= 0.5;
    // What this line actually contributed, not the rate — a thin-margin cake
    // sold constantly can still be the one paying the rent.
    r.marginTotal = r.marginPct == null ? null : (r.marginPct / 100) * r.revenue;
  }
  return rows;
}

/** Sort a product mix by the measure being asked about. */
export function sortMix(rows, by = 'count') {
  const key = {
    count: (r) => r.count,
    revenue: (r) => r.revenue,
    margin: (r) => (r.marginTotal == null ? -1 : r.marginTotal),
  }[by] || ((r) => r.count);
  return [...rows].sort((a, b) => key(b) - key(a) || b.revenue - a.revenue);
}

/**
 * Orders whose pickup day has passed but which nobody closed off.
 *
 * Either the cake went out and the status was never moved — in which case
 * every sales figure is wrong and the customer still shows as owing — or it
 * genuinely got missed. Both need a person, and neither shows up as a problem
 * anywhere: the log files them under "Overdue" alongside the live worklist,
 * which is where they quietly stay.
 *
 * `grace` keeps today out of it; a cake due at 4pm is not late at noon.
 */
export function staleOpen(orders, now = new Date(), grace = 1) {
  const todayKey = sydneyParts(now).dayKey;
  return orders
    .filter((o) => {
      if (o.status === 'picked_up' || o.status === 'cancelled') return false;
      return daysBetween(sydneyParts(o.due_at).dayKey, todayKey) >= grace;
    })
    .map((o) => ({ ...o, daysLate: daysBetween(sydneyParts(o.due_at).dayKey, todayKey) }))
    .sort((a, b) => b.daysLate - a.daysLate);
}
