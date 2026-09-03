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
  return {
    newCount: all.filter((c) => c.orders === 1).length,
    returningCount: all.filter((c) => c.orders > 1).length,
    top: all.filter((c) => c.orders > 1).sort((a, b) => b.orders - a.orders || b.spend - a.spend),
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

  for (const o of orders) {
    const dueKey = sydneyParts(o.due_at).dayKey;
    if (o.status === 'picked_up' || o.status === 'cancelled') {
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
