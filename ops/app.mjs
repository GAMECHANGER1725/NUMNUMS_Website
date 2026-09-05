// Ops app: view routing, rendering and form handling.
//
// Lives in its own file rather than an inline <script> so the production CSP
// can keep script-src to 'self' plus the pinned CDN, with no 'unsafe-inline'.
// Inlining this would silently break only in production, where the CSP applies.

import {
  sb, PEOPLE, STORES, storeLabel, STATUS_LABEL,
  signIn, signOut, currentProfile, listProfiles,
  listOrders, listToBake, createOrder, updateOrder, setStatus, setCost,
  findCustomerByPhone, searchCustomers, getCustomer,
  recentAuthEvents, uploadPhoto, photoUrl,
  listCustomers, allCustomers, ordersForCustomer, authTrail, ordersBetween,
  writeStamp,
  listPrintJobs, listPrintFlags, listOpenOrders, createPrintJob, updatePrintJob, setPrintStatus, deletePrintJob,
} from './db.mjs';
import {
  sydneyParts, daysBetween, dayBucket, weekStartKey, summarise, weeklyStats,
  busiestHours, bakerSections, paidOn,
  monthGrid, shiftMonth, sydneyDateTimeToISO,
  dayLabel, soldWithin, salesByWeek, logSections, inDateRange, inStoreTally,
  missingPrice, searchOrders, byWeekday, leadTimes, missingPhone, WEEKDAYS, weekdayIndex,
  printSections, storeBreakdown, exportRanges, toCsv, productMix, sortMix, staleOpen,
  dailyTakings, weeklyByStore, customerLeaderboard, forwardBook, weekdayNorm,
} from './stats.mjs';
import { SIZES, FLAVOURS, basePrice, isPremium } from './catalog.mjs';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// One formatter, cents always shown. The old whole-dollar variant rounded, so
// a $130.50 cake read as $131 on its docket and every analytics total was off
// by the accumulated rounding — the exact opposite of what this app is for.
const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const timeFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: 'numeric', minute: '2-digit', hour12: true });
const dateFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short' });
const dateTimeFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
const takenFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

let me = null;          // profile row
let store = null;       // active store tab
let view = 'log';
let orders = [];        // orders for the active view
let peopleById = new Map();
let logQuery = '';
let logRange = null;     // {from, to} Sydney day keys, or null for the live worklist
let printKind = '3d';    // active tab on the print board
let printJobs = [];      // jobs for the active print view
let printsByOrder = new Map();   // order id → its print jobs, for card flags
let analyticsPage = 'finance';   // which analytics page the drawer last opened
let bakeStore = 'all';           // store filter on the baker's queue

// ── Boot ────────────────────────────────────────────────────────────────────
const ddWho = mountDropdown($('who'), {
  value: PEOPLE[0].email,
  options: PEOPLE.map((p) => ({ value: p.email, label: p.name })),
});

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('login-btn'), msg = $('login-msg');
  btn.disabled = true; btn.textContent = 'Signing in…'; msg.textContent = ''; msg.className = 'msg';
  try {
    await signIn(ddWho.value(), $('pw').value);
    $('pw').value = '';
    await start();
  } catch (err) {
    msg.textContent = /invalid/i.test(err.message) ? 'That password does not match. Try again.' : err.message;
    msg.className = 'msg msg-error';
  } finally {
    btn.disabled = false; btn.textContent = 'Sign in';
  }
});

$('signout').addEventListener('click', async () => {
  await signOut();
  me = null;
  $('app').classList.add('hidden');
  $('login').classList.remove('hidden');
});

async function start() {
  me = await currentProfile();
  if (!me) return;

  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('me-name').textContent = me.name;
  $('me-role').textContent = me.role;

  store = me.stores[0] || 'harris-park';
  buildStoreSwitch();
  buildTabs();
  view = me.role === 'baker' ? 'bake' : 'log';
  await render();
}

function buildStoreSwitch() {
  const el = $('store-switch');
  const mine = STORES.filter((s) => me.stores.includes(s.code));
  // One store means no decision to make — the switcher would just be noise.
  if (mine.length < 2) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.innerHTML = mine.map((s) => `
    <button class="segmented-btn" role="tab" data-store="${s.code}"
            aria-selected="${s.code === store}">${esc(s.label)}</button>`).join('');
  el.querySelectorAll('[data-store]').forEach((b) =>
    b.addEventListener('click', () => { store = b.dataset.store; buildStoreSwitch(); render(); }));
}

const TABS = {
  log:       { label: 'Orders',    roles: ['admin', 'staff'], icon: '<path d="M4 5h16M4 12h16M4 19h10"/>' },
  new:       { label: 'New',       roles: ['admin', 'staff'], icon: '<path d="M12 5v14M5 12h14"/>' },
  bake:      { label: 'To bake',   roles: ['admin', 'baker'], icon: '<path d="M5 20h14M6 20v-6a6 6 0 0112 0v6M12 5V3"/>' },
  prints:    { label: 'Prints',    roles: ['admin', 'baker'], icon: '<path d="M7 8V3h10v5M7 18H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v7H7z"/>' },
};

function buildTabs() {
  $('tabbar').innerHTML = Object.entries(TABS)
    .filter(([, t]) => t.roles.includes(me.role))
    .map(([key, t]) => `
      <button class="tab" data-tab="${key}" aria-current="${key === view ? 'page' : 'false'}">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
        <span>${t.label}</span>
      </button>`).join('');
  $('tabbar').querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => go(b.dataset.tab)));
}

function go(next) {
  if (next === 'new') { openNewOrder(); return; }
  view = next;
  buildTabs();
  render();
}

// ── Render ──────────────────────────────────────────────────────────────────
async function render() {
  $('view-title').textContent = view === 'analytics'
    ? (ANALYTICS_TITLE[analyticsPage] || 'Analytics')
    : (VIEW_TITLE[view] || 'Orders');
  // Nothing but analytics lives in the drawer yet, so nobody else gets a button.
  $('menu-btn').classList.toggle('hidden', !menuGroups().length);
  $('store-switch').classList.toggle('hidden',
    view !== 'log' || STORES.filter((s) => me.stores.includes(s.code)).length < 2);
  $('logbar').classList.toggle('hidden', view !== 'log');
  $('logsearch-row').classList.toggle('hidden', view !== 'log');
  if (view !== 'log') closeRange();

  for (const v of ['log', 'bake', 'prints', ...DRAWER_VIEWS]) $(`view-${v}`).classList.toggle('hidden', v !== view);

  const PAINT = {
    log: renderLog, bake: renderBake, prints: renderPrints,
    analytics: renderAnalytics, directory: renderDirectory,
    staff: renderStaff, export: renderExport,
  };
  // Supabase retries a failed request internally before giving up, so a dead
  // connection sits on "Loading…" for about ten seconds. Say something at four.
  const painting = view;
  const slow = setTimeout(() => {
    const root = $(`view-${painting}`);
    if (root && view === painting && /Loading/.test(root.textContent)) {
      root.innerHTML = '<p class="empty"><span class="empty-note">Still trying — the connection may be slow.</span></p>';
    }
  }, 4000);

  try {
    await (PAINT[view] || renderLog)();
  } catch (err) {
    // Without this the promise rejects into nothing and the view sits on
    // "Loading…" for the rest of the shift, with no error and no way back.
    console.warn('view failed:', err);   // the detail belongs in the console
    renderViewError(view);
  } finally {
    clearTimeout(slow);
  }
  paintOfflineBar();
}

// A baker cannot act on "TypeError: Failed to fetch".
const offlineReason = () => (navigator.onLine === false
  ? 'This phone has no connection.'
  : 'Could not reach the order book — the shop internet may be down.');

function renderViewError(v) {
  const root = $(`view-${v}`);
  if (!root) return;
  root.innerHTML = `
    <div class="empty">
      <div class="empty-mark">Nothing loaded</div>
      <p class="empty-note">${esc(offlineReason())}<br>Nothing has been lost — the orders are on the server.</p>
      <button class="btn btn-primary" data-retry>Try again</button>
    </div>`;
  root.querySelector('[data-retry]').addEventListener('click', () => render());
}

/** Says the list on screen is a held copy, and offers the way out. */
function paintOfflineBar() {
  const bar = $('offlinebar');
  if (!staleSince) { bar.classList.add('hidden'); return; }
  bar.innerHTML = `<span>Showing the copy from ${esc(agoText(Date.now() - staleSince))} — could not refresh.</span>
    <button data-retry>Retry</button>`;
  bar.querySelector('[data-retry]').addEventListener('click', () => render());
  bar.classList.remove('hidden');
}

/**
 * Which cakes have something waiting on the printer.
 *
 * Fetched once per render rather than per card, and only for the two roles the
 * board belongs to — staff cannot read the table at all, and asking would just
 * return an empty list on every paint.
 */
async function loadPrintFlags() {
  if (me.role !== 'admin' && me.role !== 'baker') { printsByOrder = new Map(); return; }
  try {
    const jobs = await listPrintFlags();
    printsByOrder = new Map();
    for (const j of jobs) {
      if (!printsByOrder.has(j.order_id)) printsByOrder.set(j.order_id, []);
      printsByOrder.get(j.order_id).push(j);
    }
  } catch { printsByOrder = new Map(); }   // never hold up the worklist for a flag
}

/** "3D toppers", "Photo prints", or both — however the cake is described out loud. */
const printKindsLabel = (jobs) => {
  const kinds = [...new Set(jobs.map((j) => j.kind))];
  return kinds.map((k) => (k === '3d' ? '3D toppers' : 'Photo prints')).join(' and ');
};

const printFlagHtml = (orderId) => {
  const jobs = printsByOrder.get(orderId) || [];
  if (!jobs.length) return '';
  const left = jobs.filter((j) => j.status !== 'printed');
  const kinds = [...new Set((left.length ? left : jobs).map((j) => j.kind))]
    .map((k) => (k === '3d' ? '3D' : 'Photo')).join(' + ');
  return left.length
    ? `<span class="print-flag">${esc(kinds)} to print</span>`
    : `<span class="print-flag is-done">${esc(kinds)} printed</span>`;
};

/**
 * Custom or normal, on the card itself.
 *
 * It rides next to the pickup time because that is the pair being read
 * together — what has to be made, and by when — and because the answer used to
 * cost opening the order.
 */
const kindTag = (o) => o.kind === 'custom'
  ? '<span class="tag tag-custom">Custom</span>'
  : '<span class="tag tag-normal">Normal</span>';

const spineFor = (o, now) => {
  if (['picked_up', 'cancelled'].includes(o.status)) return 'spine-done';
  const d = daysBetween(sydneyParts(now).dayKey, sydneyParts(o.due_at).dayKey);
  if (d < 0) return 'spine-overdue';
  if (d === 0) return 'spine-today';
  if (d === 1) return 'spine-tomorrow';
  return 'spine-later';
};

function docketHtml(o, now, { showStore = false } = {}) {
  // The baker never sees money. The database already stops him changing it,
  // but that is no reason to put every customer's balance in front of him.
  const showMoney = me.role !== 'baker';
  const what = [o.size, o.flavour].filter(Boolean).join(' · ');
  const pay = showMoney ? payState(o) : null;
  return `
    <button class="docket ${spineFor(o, now)}" data-order="${o.id}">
      <div class="docket-head">
        <span class="docket-no">${esc(o.order_no)}</span>
        ${o.walk_in ? '<span class="tag tag-walkin">In store</span>' : ''}
        ${showStore ? `<span class="tag tag-store">${esc(storeLabel(o.store))}</span>` : ''}
        <span class="docket-when">${kindTag(o)}${timeFmt.format(new Date(o.due_at))}</span>
      </div>
      <div class="docket-body">
        ${o.photo_path
          ? `<img class="thumb" data-photo="${esc(o.photo_path)}" alt="" loading="lazy">`
          : '<div class="thumb thumb-empty" aria-hidden="true">◍</div>'}
        <div class="docket-lines">
          <div class="docket-name">${esc(o.customer_name)}</div>
          <div class="docket-what">${esc(what || '—')}</div>
          <div class="docket-foot">
            <span class="status-dot st-${o.status}">${esc(STATUS_LABEL[o.status])}</span>
            ${showMoney && o.price ? `<span>${money.format(o.price)}</span>` : ''}
            ${pay ? `<span class="tag ${pay.cls}">${esc(pay.label)}</span>` : ''}
            ${printFlagHtml(o.id)}
          </div>
          <div class="docket-taken">Taken ${esc(takenFmt.format(new Date(o.created_at)))}</div>
        </div>
      </div>
    </button>`;
}

/** Signed URLs are fetched after paint so a long list is not held up by them. */
function hydrateThumbs(root) {
  root.querySelectorAll('img[data-photo]').forEach(async (img) => {
    const url = await photoUrl(img.dataset.photo);
    if (url) img.src = url;
    else img.replaceWith(Object.assign(document.createElement('div'),
      { className: 'thumb thumb-empty', textContent: '◍' }));
  });
}

/**
 * The rows behind the order log, held per store.
 *
 * Searching and picking dates filter what is already in memory, but every
 * keystroke was re-running the fetch first: typing a four-letter name cost
 * sixteen round trips to redraw a list the page was already holding. Only a
 * store switch, a write, or a stale copy genuinely needs the network.
 */
// Keyed by store, because staff flip between the two tabs constantly and a
// single slot would make every flip a fresh fetch of a list just seen.
let logCache = new Map();
const LOG_TTL = 120000;

/**
 * When a refresh fails.
 *
 * Shop wifi drops mid-shift. Blowing a loaded list away and showing an error
 * is the wrong trade — the baker still needs the queue from two minutes ago —
 * so a held copy is served instead, with the banner saying so. Only a view
 * with nothing held at all raises.
 */
let staleSince = null;

/**
 * Mark every held copy out of date without throwing it away.
 *
 * A phone picked back up should refetch, but discarding the rows first means a
 * wake-up on bad wifi lands on an error page instead of the list that was on
 * screen a moment ago. Expiring keeps them available as the fallback.
 */
function expireCaches() {
  // A flag, not `at = 0`: `at` is also how old the copy is, and zeroing it made
  // the "showing a held copy" banner think there was nothing held.
  for (const hit of logCache.values()) hit.expired = true;
  if (bakeCache) bakeCache.expired = true;
  if (analyticsCache) analyticsCache.expired = true;
}

async function orFallback(fetchFn, held) {
  try {
    const v = await fetchFn();
    staleSince = null;
    return v;
  } catch (err) {
    if (!held) throw err;
    staleSince = held.at;
    return held.rows;
  }
}

function logFresh(forStore) {
  const hit = logCache.get(forStore);
  return Boolean(hit) && !hit.expired && hit.stamp === writeStamp.v && Date.now() - hit.at < LOG_TTL;
}

async function logData(forStore) {
  if (logFresh(forStore)) return logCache.get(forStore).rows;
  return orFallback(async () => {
    const [rows] = await Promise.all([
      listOrders({ store: forStore, withCosts: me.role === 'admin' }),
      loadPrintFlags(),
    ]);
    logCache.set(forStore, { at: Date.now(), stamp: writeStamp.v, rows });
    return rows;
  }, logCache.get(forStore));
}

async function renderLog() {
  const root = $('view-log');
  // Only flash "Loading…" when something is actually being fetched; on a
  // filter keystroke it would strobe the list on every letter.
  if (!logFresh(store)) root.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';
  orders = await logData(store);

  const now = new Date();
  // A date range is a lookup, not the daily worklist, so it keeps every
  // collected order in the window instead of ageing them out after a week.
  // Searching or picking dates is a lookup, not the daily worklist, so both
  // keep every collected order instead of ageing them out after a week.
  const lookup = Boolean(logQuery || logRange);
  let rows = logRange ? inDateRange(orders, logRange.from, logRange.to) : orders;
  rows = searchOrders(rows, logQuery);
  const sections = logSections(rows, now, { collectedDays: lookup ? Infinity : 7 });
  paintRangeLabel();

  if (!sections.length) {
    if (logQuery) {
      root.innerHTML = `<div class="empty">
        <div class="empty-mark">Nothing matches</div>
        <p class="empty-note">No order for “${esc(logQuery)}”.<br>Try part of a name, a phone number, or a docket number.</p>
      </div>`;
      return;
    }
    root.innerHTML = logRange
      ? `<div class="empty">
           <div class="empty-mark">No cakes in those dates</div>
           <p class="empty-note">Nothing for ${esc(storeLabel(store))} between those days.<br>Tap <strong>Clear</strong> to go back to the worklist.</p>
         </div>`
      : `<div class="empty">
           <div class="empty-mark">Nothing on the book</div>
           <p class="empty-note">New orders for ${esc(storeLabel(store))} will show up here.<br>Tap <strong>New</strong> to log one.</p>
         </div>`;
    return;
  }

  root.innerHTML = sections.map(([label, rows]) => {
    // Overdue and Collected span several days, so a single date would mislead.
    const oneDay = label !== 'Overdue' && label !== 'Collected';
    const date = oneDay ? dateFmt.format(new Date(rows[0].due_at)) : '';
    return `
      <div class="section-head ${label === 'Overdue' ? 'is-overdue' : ''}">
        <span class="section-name">${esc(label)}</span>
        ${date ? `<span class="section-date">${esc(date)}</span>` : ''}
        <span class="section-count">${rows.length}</span>
      </div>
      ${rows.map((o) => docketHtml(o, now)).join('')}`;
  }).join('');

  wireDockets(root);
  hydrateThumbs(root);
}

let bakeCache = null;

const bakeFresh = () =>
  Boolean(bakeCache) && !bakeCache.expired
  && bakeCache.stamp === writeStamp.v && Date.now() - bakeCache.at < LOG_TTL;

/** The queue and the in-store tally. Flipping the store tabs filters these in
 *  memory — every cake is already here — so only a write reloads them. */
async function bakeData() {
  if (bakeFresh()) return bakeCache.rows;
  return orFallback(async () => {
    const twoDays = new Date(Date.now() - 3 * 86400000).toISOString();
    const rows = await Promise.all([
      listToBake(),
      listOrders({ since: twoDays }),
      loadPrintFlags(),
    ]);
    bakeCache = { at: Date.now(), stamp: writeStamp.v, rows };
    return rows;
  }, bakeCache);
}

async function renderBake() {
  const root = $('view-bake');
  if (!bakeFresh()) root.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';

  // The queue is what to make next; the tally is what already walked out the
  // door. Both matter to the baker: without the tally he restocks the counter
  // from memory and guesses which flavours moved.
  const [queue, recent] = await bakeData();
  orders = queue;

  const now = new Date();
  const todayKey = sydneyParts(now).dayKey;
  const yestKey = sydneyParts(new Date(Date.now() - 86400000)).dayKey;
  const today = inStoreTally(recent, todayKey);
  const yesterday = inStoreTally(recent, yestKey);

  const tallyPanel = `
    <details class="panel collapse" ${today.count ? 'open' : ''}>
      <summary class="collapse-head">
        <span class="panel-title">Sold in store today</span>
        <span class="list-meta">${today.count} cake${today.count === 1 ? '' : 's'}${
          yesterday.count ? ` · ${yesterday.count} yesterday` : ''}</span>
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </summary>
      <div class="collapse-body">
        ${today.count ? today.rows.map((r) => `
          <div class="list-row">
            <span class="num">${r.count}×</span>
            <span class="grow">${esc(r.size)} · ${esc(r.flavour)}</span>
          </div>`).join('')
        : '<div class="list-row"><span class="grow list-meta">Nothing sold off the counter yet today.</span></div>'}
        ${yesterday.count ? `
          <div class="mix-head">Yesterday</div>
          ${yesterday.rows.map((r) => `
            <div class="list-row">
              <span class="num">${r.count}×</span>
              <span class="grow">${esc(r.size)} · ${esc(r.flavour)}</span>
            </div>`).join('')}` : ''}
      </div>
    </details>`;

  const BAKE_TABS = [{ code: 'all', label: 'Both stores' },
    ...STORES.map((st) => ({ code: st.code, label: st.label }))];
  const waiting = (code) => (code === 'all' ? queue.length : queue.filter((o) => o.store === code).length);
  const storeBar = `
    <div class="segmented" role="tablist" aria-label="Store">
      ${BAKE_TABS.map((t) => `
        <button class="segmented-btn" role="tab" data-bakestore="${t.code}"
                aria-selected="${t.code === bakeStore}">${esc(t.label)}${
          waiting(t.code) ? ` · ${waiting(t.code)}` : ''}</button>`).join('')}
    </div>`;

  const wireBar = () => root.querySelectorAll('[data-bakestore]').forEach((b) =>
    b.addEventListener('click', () => { bakeStore = b.dataset.bakestore; renderBake(); }));

  const mine = bakeStore === 'all' ? queue : queue.filter((o) => o.store === bakeStore);
  const sections = bakerSections(mine, now);

  if (!sections.length) {
    root.innerHTML = storeBar + tallyPanel + `<div class="empty">
      <div class="empty-mark">All caught up</div>
      <p class="empty-note">${bakeStore === 'all'
        ? 'Nothing waiting to be baked.'
        : `Nothing waiting for ${esc(BAKE_TABS.find((t) => t.code === bakeStore).label)}.`}</p>
    </div>`;
    wireBar();
    return;
  }

  root.innerHTML = storeBar + tallyPanel + sections.map(([label, rows]) => `
    <div class="section-head ${label === 'Overdue' ? 'is-overdue' : ''}">
      <span class="section-name">${esc(label)}</span>
      ${label !== 'Overdue' ? `<span class="section-date">${esc(dateFmt.format(new Date(rows[0].due_at)))}</span>` : ''}
      <span class="section-count">${rows.length}</span>
    </div>
    ${rows.map((o) => docketHtml(o, now, { showStore: bakeStore === 'all' })).join('')}`).join('');

  wireBar();
  wireDockets(root);
  hydrateThumbs(root);
}

// ── Print board ─────────────────────────────────────────────────────────────
//
// The original failure this fixes: dad would take an order needing 3D toppers
// and forget to tell Vaidik, so the cake was baked with nothing on it. A job
// here points at the order rather than restating it, so there is one record of
// the cake and the print brief hangs off it.

const PRINT_TABS = [
  { code: '3d',    label: '3D prints' },
  { code: 'photo', label: 'Photo prints' },
];

/** The baker may tick off a photo print; 3D toppers are Vaidik's to mark. */
const canPrintStatus = (job) => me.role === 'admin' || job.kind === 'photo';

function printCardHtml(j, now) {
  const o = j.order;
  const done = j.status === 'printed';
  const what = [o.size, o.flavour].filter(Boolean).join(' · ');
  return `
    <button class="docket ${done ? 'spine-done' : spineFor(o, now)}" data-job="${j.id}">
      <div class="docket-head">
        <span class="docket-no">${esc(o.order_no)}</span>
        <span class="tag ${j.kind === '3d' ? 'tag-3d' : 'tag-photo'}">${j.kind === '3d' ? '3D' : 'Photo'}</span>
        <span class="tag tag-store">${esc(storeLabel(o.store))}</span>
        <span class="docket-when">${kindTag(o)}${esc(timeFmt.format(new Date(o.due_at)))}</span>
      </div>
      <div class="docket-body">
        ${o.photo_path
          ? `<img class="thumb" data-photo="${esc(o.photo_path)}" alt="" loading="lazy">`
          : '<div class="thumb thumb-empty" aria-hidden="true">◍</div>'}
        <div class="docket-lines">
          <div class="docket-name">${esc(o.customer_name)}</div>
          <div class="docket-what">${esc(what || '—')}</div>
          <div class="docket-print"><strong>Print:</strong> ${esc(j.what)}</div>
          <div class="docket-foot">
            <span class="tag ${done ? 'tag-done' : 'tag-todo'}">${done ? 'Printed' : 'To print'}</span>
            ${done && j.printed_at ? `<span>${esc(takenFmt.format(new Date(j.printed_at)))}</span>` : ''}
          </div>
        </div>
      </div>
    </button>`;
}

async function renderPrints() {
  const root = $('view-prints');
  root.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';

  try {
    printJobs = await listPrintJobs();
  } catch (err) {
    root.innerHTML = `<div class="empty"><div class="empty-mark">Could not load the print board</div>
      <p class="empty-note">${esc(err.message)}</p></div>`;
    return;
  }

  const now = new Date();
  const mine = printJobs.filter((j) => j.kind === printKind);
  const sections = printSections(mine, now);
  const waiting = (code) => printJobs.filter((j) => j.kind === code && j.status !== 'printed').length;

  const head = `
    <div class="segmented" role="tablist" aria-label="Print type">
      ${PRINT_TABS.map((t) => `
        <button class="segmented-btn" role="tab" data-pk="${t.code}"
                aria-selected="${t.code === printKind}">${esc(t.label)}${
          waiting(t.code) ? ` · ${waiting(t.code)}` : ''}</button>`).join('')}
    </div>
    ${me.role === 'admin' ? `
      <button class="btn btn-primary" id="print-add" style="margin-bottom:6px;">Add a print job</button>` : ''}`;

  const body = sections.length
    ? sections.map(([label, rows]) => `
        <div class="section-head ${label === 'Overdue' ? 'is-overdue' : ''}">
          <span class="section-name">${esc(label)}</span>
          ${label !== 'Overdue' && label !== 'Printed'
            ? `<span class="section-date">${esc(dateFmt.format(new Date(rows[0].order.due_at)))}</span>` : ''}
          <span class="section-count">${rows.length}</span>
        </div>
        ${rows.map((j) => printCardHtml(j, now)).join('')}`).join('')
    : `<div class="empty">
         <div class="empty-mark">Nothing to print</div>
         <p class="empty-note">No ${printKind === '3d' ? '3D topper' : 'photo print'} jobs on the book.${
           me.role === 'admin' ? '<br>Tap <strong>Add a print job</strong> to link one to an order.' : ''}</p>
       </div>`;

  root.innerHTML = head + body;

  root.querySelectorAll('[data-pk]').forEach((b) =>
    b.addEventListener('click', () => { printKind = b.dataset.pk; renderPrints(); }));
  if (me.role === 'admin') $('print-add').addEventListener('click', openNewPrintJob);
  root.querySelectorAll('[data-job]').forEach((b) =>
    b.addEventListener('click', () => openPrintJob(b.dataset.job)));
  hydrateThumbs(root);
}

async function openPrintJob(id) {
  const j = printJobs.find((x) => x.id === id);
  if (!j) return;
  const o = j.order;
  const done = j.status === 'printed';
  const isAdmin = me.role === 'admin';

  const body = openSheet(`${o.order_no} · ${j.kind === '3d' ? '3D print' : 'Photo print'}`, `
    ${o.photo_path ? `<img class="detail-photo" data-photo="${esc(o.photo_path)}" alt="Cake design">` : ''}

    <div class="block-label">What to print</div>
    <p class="detail-v">${esc(j.what)}</p>
    ${j.notes ? `<p class="detail-v quiet" style="margin-top:6px;">${esc(j.notes)}</p>` : ''}

    <hr class="rule">
    <div class="detail-grid">
      ${field('Customer', o.customer_name)}
      ${field('Phone', o.customer_phone)}
      ${field('Pick up', dateTimeFmt.format(new Date(o.due_at)))}
      ${field('Store', storeLabel(o.store))}
      ${field('Size', o.size)}
      ${field('Flavour', o.flavour)}
      ${field('Wording', o.wording, 'span-2')}
      ${o.design_notes ? field('Design notes', o.design_notes, 'span-2') : ''}
      ${field('Cake status', STATUS_LABEL[o.status], 'span-2')}
    </div>

    <hr class="rule">
    <div class="block-label">Print status
      <span class="status-now"><span class="tag ${done ? 'tag-done' : 'tag-todo'}">${done ? 'Printed' : 'To print'}</span></span>
    </div>
    ${canPrintStatus(j)
      ? `<div class="action-row">
           <button class="btn ${done ? 'btn-quiet' : 'btn-primary'}" id="print-toggle">
             ${done ? 'Move back to to-print' : 'Mark printed'}</button>
         </div>`
      : '<p class="panel-note" style="margin:0;">Only an admin marks a 3D topper printed — tell Vaidik when it is done.</p>'}
    <p class="msg" id="print-msg" role="status" aria-live="polite"></p>

    ${isAdmin ? `
      <hr class="rule">
      <div class="block-label">Edit</div>
      <div class="field">
        <label class="field-label" for="pj-what">What to print</label>
        <textarea class="textarea" id="pj-what">${esc(j.what)}</textarea>
      </div>
      <div class="field">
        <label class="field-label" for="pj-notes">Notes</label>
        <textarea class="textarea" id="pj-notes">${esc(j.notes || '')}</textarea>
      </div>
      <div class="row-2">
        <button class="btn btn-outline" id="pj-delete">Delete job</button>
        <button class="btn btn-primary" id="pj-save">Save</button>
      </div>` : ''}
  `);

  const img = body.querySelector('.detail-photo');
  if (img) photoUrl(img.dataset.photo).then((u) => { if (u) img.src = u; });

  if (canPrintStatus(j)) {
    $('print-toggle').addEventListener('click', async () => {
      const btn = $('print-toggle');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        await setPrintStatus(j.id, done ? 'todo' : 'printed');
        closeSheet();
        toast(done ? `${o.order_no} moved back to the print list.` : `${o.order_no} marked printed.`);
        await renderPrints();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = done ? 'Move back to to-print' : 'Mark printed';
        $('print-msg').textContent = err.message;
        $('print-msg').className = 'msg msg-error';
      }
    });
  }

  if (isAdmin) {
    $('pj-save').addEventListener('click', async () => {
      const what = $('pj-what').value.trim();
      const msg = $('print-msg');
      if (!what) { msg.textContent = 'Say what needs printing.'; msg.className = 'msg msg-error'; return; }
      try {
        await updatePrintJob(j.id, { what, notes: $('pj-notes').value.trim() || null });
        closeSheet();
        toast('Print job updated.');
        await renderPrints();
      } catch (err) { msg.textContent = err.message; msg.className = 'msg msg-error'; }
    });

    // Two taps to delete: the first turns the button into the confirmation, so
    // a mis-tap on a phone cannot wipe a job with no way back.
    let armed = false;
    $('pj-delete').addEventListener('click', async () => {
      const btn = $('pj-delete');
      if (!armed) {
        armed = true;
        btn.textContent = 'Tap again to delete';
        setTimeout(() => { if (armed) { armed = false; btn.textContent = 'Delete job'; } }, 4000);
        return;
      }
      try {
        await deletePrintJob(j.id);
        closeSheet();
        toast('Print job deleted.');
        await renderPrints();
      } catch (err) {
        $('print-msg').textContent = err.message;
        $('print-msg').className = 'msg msg-error';
      }
    });
  }
}

/**
 * Add a job by pointing at an order instead of re-describing the cake.
 *
 * The picker is a grid of photos, not a list of docket numbers: dad recognises
 * the cake by its picture, and picking it carries every detail — store, size,
 * pickup day — across without anyone re-typing them.
 */
async function openNewPrintJob() {
  let picked = null;
  // Plenty of cakes need a topper AND a photo sheet. They stay two rows — the
  // baker owns the photo and Vaidik owns the topper, and they finish at
  // different times — but they get logged in one pass off one order.
  const kinds = new Set([printKind]);

  const body = openSheet('New print job', `
    <div class="kind-pick">
      ${PRINT_TABS.map((t) => `
        <button class="kind-card" data-pkind="${t.code}" aria-pressed="${kinds.has(t.code)}">
          <div class="kind-name">${t.code === '3d' ? '3D' : 'Photo'}</div>
          <div class="kind-note">${t.code === '3d' ? 'Toppers, names, figures' : 'Edible photo sheet'}</div>
        </button>`).join('')}
    </div>
    <p class="panel-note" style="margin:-2px 0 0;">Tap both if this cake needs both.</p>

    <hr class="rule">

    <div class="field">
      <span class="field-label">Which cake <span class="req">*</span></span>
      <button type="button" class="dd-btn" id="pick-btn" aria-expanded="false">
        <span class="dd-val is-empty" id="pick-val">Choose an order</span>
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="cal hidden" id="pick-panel"><div class="pick-grid" id="pick-grid"></div></div>
      <div class="hidden" id="pick-summary"></div>
    </div>

    <div class="field" id="what-3d">
      <label class="field-label" for="pj-what-3d">What to 3D print <span class="req">*</span></label>
      <textarea class="textarea" id="pj-what-3d" placeholder="Ganesh topper + name plate"></textarea>
    </div>

    <div class="field" id="what-photo">
      <label class="field-label" for="pj-what-photo">What to photo print <span class="req">*</span></label>
      <textarea class="textarea" id="pj-what-photo" placeholder="The family picture from WhatsApp"></textarea>
    </div>

    <div class="field">
      <label class="field-label" for="pj-new-notes">Notes</label>
      <textarea class="textarea" id="pj-new-notes" placeholder="Gold filament, matches the photo"></textarea>
    </div>

    <button class="btn btn-primary" id="pj-new-save">Save print job</button>
    <p class="msg" id="pj-new-msg" role="status" aria-live="polite"></p>
  `, { center: true });

  function paintKinds() {
    body.querySelectorAll('[data-pkind]').forEach((x) =>
      x.setAttribute('aria-pressed', String(kinds.has(x.dataset.pkind))));
    $('what-3d').classList.toggle('hidden', !kinds.has('3d'));
    $('what-photo').classList.toggle('hidden', !kinds.has('photo'));
    // One kind selected needs no disambiguating label; two do.
    $('what-3d').querySelector('.field-label').firstChild.textContent =
      kinds.size > 1 ? 'What to 3D print ' : 'What needs printing ';
    $('what-photo').querySelector('.field-label').firstChild.textContent =
      kinds.size > 1 ? 'What to photo print ' : 'What needs printing ';
  }

  body.querySelectorAll('[data-pkind]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.pkind;
    // Never let both come off — a job with no kind is not a job.
    if (kinds.has(k)) { if (kinds.size > 1) kinds.delete(k); }
    else kinds.add(k);
    paintKinds();
  }));
  paintKinds();

  const grid = $('pick-grid');
  grid.innerHTML = '<p class="empty-note" style="padding:12px;">Loading orders…</p>';

  let openOrders = [];
  try { openOrders = await listOpenOrders(); }
  catch (err) { grid.innerHTML = `<p class="empty-note" style="padding:12px;">${esc(err.message)}</p>`; }

  if (!openOrders.length) {
    grid.innerHTML = '<p class="empty-note" style="padding:12px;">No orders are open right now.</p>';
  } else {
    grid.innerHTML = openOrders.map((o) => `
      <button type="button" class="pick-tile" data-pick="${o.id}" aria-pressed="false">
        <span class="pick-shot">
          ${o.photo_path ? `<img data-photo="${esc(o.photo_path)}" alt="" loading="lazy">` : '◍'}
          <span class="pick-no">${esc(o.order_no)}</span>
        </span>
        <span class="pick-meta">
          <span class="pick-name">${esc(o.customer_name)}</span>
          <span class="pick-when">${o.kind === 'custom' ? 'Custom' : 'Normal'} · ${esc(dateFmt.format(new Date(o.due_at)))}</span>
        </span>
      </button>`).join('');

    grid.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
      picked = openOrders.find((o) => o.id === b.dataset.pick);
      grid.querySelectorAll('[data-pick]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $('pick-val').textContent = `${picked.order_no} · ${picked.customer_name}`;
      $('pick-val').classList.remove('is-empty');
      $('pick-panel').classList.add('hidden');
      $('pick-btn').setAttribute('aria-expanded', 'false');

      const what = [picked.size, picked.flavour].filter(Boolean).join(' · ');
      const sum = $('pick-summary');
      sum.className = 'pick-summary';
      sum.innerHTML = `
        ${picked.photo_path
          ? `<img class="thumb" data-photo="${esc(picked.photo_path)}" alt="">`
          : '<div class="thumb thumb-empty" aria-hidden="true">◍</div>'}
        <div class="grow">
          <div class="docket-name">${esc(picked.customer_name)}</div>
          <div class="docket-what">${esc(what || '—')} · ${esc(storeLabel(picked.store))}</div>
          <div class="docket-taken">Pick up ${esc(dateTimeFmt.format(new Date(picked.due_at)))}</div>
        </div>`;
      hydrateThumbs(sum);
      body.querySelector('#what-3d:not(.hidden) textarea, #what-photo:not(.hidden) textarea')?.focus();
    }));

    // Signed URLs after paint, same as every other list of cake photos.
    grid.querySelectorAll('img[data-photo]').forEach(async (img) => {
      const url = await photoUrl(img.dataset.photo);
      if (url) img.src = url; else img.replaceWith(document.createTextNode('◍'));
    });
  }

  $('pick-btn').addEventListener('click', () => {
    const opening = $('pick-panel').classList.contains('hidden');
    $('pick-panel').classList.toggle('hidden', !opening);
    $('pick-btn').setAttribute('aria-expanded', String(opening));
  });

  $('pj-new-save').addEventListener('click', async () => {
    const msg = $('pj-new-msg');
    const wants = PRINT_TABS.map((t) => t.code).filter((k) => kinds.has(k))
      .map((k) => ({ kind: k, what: $(k === '3d' ? 'pj-what-3d' : 'pj-what-photo').value.trim() }));

    if (!picked) { msg.textContent = 'Pick the order this print is for.'; msg.className = 'msg msg-error'; return; }
    const blank = wants.find((w) => !w.what);
    if (blank) {
      msg.textContent = wants.length > 1
        ? `Say what to ${blank.kind === '3d' ? '3D' : 'photo'} print.`
        : 'Say what needs printing.';
      msg.className = 'msg msg-error';
      return;
    }

    const btn = $('pj-new-save');
    btn.disabled = true; btn.textContent = 'Saving…';
    const notes = $('pj-new-notes').value.trim() || null;
    try {
      for (const w of wants) {
        await createPrintJob({ order_id: picked.id, kind: w.kind, what: w.what, notes });
      }
      printKind = wants[0].kind;
      closeSheet();
      toast(wants.length > 1
        ? `3D and photo prints added for ${picked.order_no}.`
        : `${wants[0].kind === '3d' ? '3D print' : 'Photo print'} added for ${picked.order_no}.`);
      await renderPrints();
    } catch (err) {
      msg.textContent = err.message; msg.className = 'msg msg-error';
      btn.disabled = false; btn.textContent = 'Save print job';
    }
  });
}

function wireDockets(root) {
  root.querySelectorAll('[data-order]').forEach((b) =>
    b.addEventListener('click', () => openOrder(b.dataset.order)));
}

// ── Date range filter ───────────────────────────────────────────────────────

/**
 * Find every cake due between two dates.
 *
 * Staff asked for this to answer "what have we got on for the long weekend"
 * without scrolling the whole book. Tap once for a single day, twice for a
 * range; the second tap can land either side of the first.
 */
const dayKeyLabel = (key, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', ...opts })
    .format(new Date(Date.UTC(y, m - 1, d)));
};

const addDayKey = (key, n) => {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  const pad = (v) => String(v).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
};

function paintRangeLabel() {
  const label = $('logbar-label');
  const clear = $('range-clear');
  if (!logRange) {
    label.textContent = 'All upcoming';
    clear.classList.add('hidden');
    return;
  }
  label.textContent = logRange.from === logRange.to
    ? dayKeyLabel(logRange.from)
    : `${dayKeyLabel(logRange.from)} – ${dayKeyLabel(logRange.to)}`;
  clear.classList.remove('hidden');
}

function closeRange() {
  $('range-cal').classList.add('hidden');
  $('range-btn').setAttribute('aria-expanded', 'false');
}

let rangePick = { anchor: null, view: null };

function paintRangePanel() {
  const panel = $('range-cal');
  const today = sydneyParts(new Date()).dayKey;
  const v = rangePick.view || { year: +today.slice(0, 4), month: +today.slice(5, 7) };
  rangePick.view = v;

  const from = logRange?.from ?? rangePick.anchor;
  const to = logRange?.to ?? rangePick.anchor;

  panel.innerHTML = `
    <div class="cal-head">
      <button type="button" class="cal-nav" data-step="-1" aria-label="Previous month">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
      </button>
      <div class="cal-month">${esc(new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', month: 'long', year: 'numeric' })
        .format(new Date(Date.UTC(v.year, v.month - 1, 15))))}</div>
      <button type="button" class="cal-nav" data-step="1" aria-label="Next month">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
      </button>
    </div>
    <div class="cal-dow">${['S','M','T','W','T','F','S'].map((d) => `<span>${d}</span>`).join('')}</div>
    <div class="cal-grid">
      ${monthGrid(v.year, v.month).flat().map((d) => {
        const edge = d.key === from || d.key === to;
        const inside = from && to && d.key > (from < to ? from : to) && d.key < (from < to ? to : from);
        return `<button type="button" data-day="${d.key}"
          aria-label="${esc(dayKeyLabel(d.key, { weekday: 'long', day: 'numeric', month: 'long' }))}"
          class="cal-day${d.inMonth ? '' : ' is-other'}${d.key === today ? ' is-today' : ''}${edge ? ' is-edge' : ''}${inside ? ' is-inrange' : ''}"
        >${d.day}</button>`;
      }).join('')}
    </div>
    <div class="cal-foot">
      <button type="button" class="btn btn-quiet" data-quick="today">Today</button>
      <button type="button" class="btn btn-quiet" data-quick="week">Next 7 days</button>
      <button type="button" class="btn btn-primary" data-done>Done</button>
    </div>
    <p class="range-hint">${rangePick.anchor && !logRange
      ? 'Now tap the last day, or the same day again for just that one.'
      : 'Tap a day, then tap another for a range.'}</p>`;

  panel.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    rangePick.view = shiftMonth(v.year, v.month, Number(b.dataset.step));
    paintRangePanel();
  }));

  panel.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => {
    const key = b.dataset.day;
    if (!rangePick.anchor || logRange) {
      rangePick.anchor = key;
      logRange = null;
    } else {
      const a = rangePick.anchor;
      logRange = { from: a <= key ? a : key, to: a <= key ? key : a };
      rangePick.anchor = null;
    }
    paintRangePanel();
    renderLog();
  }));

  panel.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => {
    logRange = b.dataset.quick === 'today'
      ? { from: today, to: today }
      : { from: today, to: addDayKey(today, 6) };
    rangePick.anchor = null;
    paintRangePanel();
    renderLog();
  }));

  panel.querySelector('[data-done]').addEventListener('click', closeRange);
}

$('range-btn').addEventListener('click', () => {
  const opening = $('range-cal').classList.contains('hidden');
  $('range-cal').classList.toggle('hidden', !opening);
  $('range-btn').setAttribute('aria-expanded', String(opening));
  if (opening) paintRangePanel();
});

let searchTimer = null;
$('log-search').addEventListener('input', (e) => {
  logQuery = e.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { if (view === 'log') renderLog(); }, 180);
});

$('range-clear').addEventListener('click', () => {
  logRange = null;
  rangePick = { anchor: null, view: null };
  closeRange();
  renderLog();
});

/**
 * In-app message instead of alert().
 *
 * A native alert freezes the page behind a system dialog someone has to
 * dismiss before they can look at anything — the worst possible interruption
 * mid-order with a customer waiting. This says the same thing and gets out of
 * the way, while errors stay until dismissed so nothing important is missed.
 */
function toast(message, kind = 'ok') {
  let host = $('toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    host.className = 'toasts';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  el.innerHTML = `<span class="toast-msg"></span><button class="toast-x" aria-label="Dismiss">✕</button>`;
  el.querySelector('.toast-msg').textContent = message;

  const close = () => {
    el.classList.add('is-going');
    setTimeout(() => el.remove(), 200);
  };
  el.querySelector('.toast-x').addEventListener('click', close);
  host.appendChild(el);
  if (kind !== 'error') setTimeout(close, 4200);
  return close;
}

// ── Custom dropdown ─────────────────────────────────────────────────────────

/**
 * Replaces every native <select>.
 *
 * A native select hands rendering to the OS — an iOS wheel, an Android system
 * sheet — so it was the one control that still looked like somebody else's app
 * in the middle of a branded form. This keeps the same keyboard and
 * screen-reader semantics (button + listbox) while looking like the rest.
 *
 * `options`: [{ value, label, tag?, note? }]. Returns { value, set, el }.
 */
function mountDropdown(host, { options, value = null, placeholder = 'Choose…', onChange } = {}) {
  let current = value;
  host.classList.add('dd');
  host.innerHTML = `
    <button type="button" class="dd-btn" aria-expanded="false" aria-haspopup="listbox">
      <span class="dd-val"></span>
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
    </button>
    <div class="dd-menu hidden" role="listbox"></div>`;

  const btn = host.querySelector('.dd-btn');
  const val = host.querySelector('.dd-val');
  const menu = host.querySelector('.dd-menu');
  const find = (v) => options.find((o) => String(o.value) === String(v));

  function paintValue() {
    const o = find(current);
    val.textContent = o ? o.label : placeholder;
    val.classList.toggle('is-empty', !o);
  }

  function open(isOpen) {
    if (isOpen) {
      menu.innerHTML = options.map((o) => `
        <button type="button" class="dd-opt" role="option" data-value="${esc(o.value)}"
                aria-selected="${String(o.value) === String(current)}">
          <span>${esc(o.label)}</span>
          ${o.tag ? `<span class="dd-tag">${esc(o.tag)}</span>` : ''}
          ${o.note ? `<span class="dd-note">${esc(o.note)}</span>` : ''}
        </button>`).join('');
      menu.querySelectorAll('[data-value]').forEach((b) => b.addEventListener('click', () => {
        current = b.dataset.value;
        paintValue();
        open(false);
        onChange?.(current, find(current));
      }));
    }
    menu.classList.toggle('hidden', !isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    open(menu.classList.contains('hidden'));
  });

  // Close on an outside tap. Bails once the host is gone so listeners left by
  // a torn-down sheet do not pile up across every order logged in a shift.
  document.addEventListener('click', (e) => {
    if (!host.isConnected) return;
    if (!host.contains(e.target)) open(false);
  });

  paintValue();
  return { value: () => current, set: (v) => { current = v; paintValue(); }, el: host };
}

/**
 * How an order's payment reads on a card.
 * "$50 owing" told staff what was missing; they asked for what was *taken*,
 * which is the number they say out loud at the counter.
 */
function payState(o) {
  const price = Number(o.price || 0);
  const paid = paidOn(o);
  if (!price) return null;
  if (paid <= 0) return { label: 'Unpaid', cls: 'tag-unpaid' };
  if (paid >= price) return { label: 'Paid', cls: 'tag-paid' };
  return { label: `Paid ${money.format(paid)}`, cls: 'tag-part' };
}

// ── Order detail sheet ──────────────────────────────────────────────────────
function closeSheet() { $('sheet-root').innerHTML = ''; document.body.style.overflow = ''; }

function openSheet(title, bodyHtml, { center = false } = {}) {
  document.body.style.overflow = 'hidden';
  $('sheet-root').innerHTML = `
    <div class="sheet-scrim" data-close></div>
    <div class="sheet${center ? ' sheet-center' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-head">
        <h2 class="sheet-title display">${esc(title)}</h2>
        <button class="sheet-close" data-close aria-label="Close">✕</button>
      </div>
      <div class="sheet-body">${bodyHtml}</div>
    </div>`;
  $('sheet-root').querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeSheet));
  return $('sheet-root').querySelector('.sheet-body');
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

const field = (k, v, cls = '') =>
  `<div class="${cls}"><div class="detail-k">${k}</div><div class="detail-v${v ? '' : ' quiet'}">${v ? esc(v) : '—'}</div></div>`;

async function openOrder(id) {
  const o = orders.find((x) => x.id === id);
  if (!o) return;

  const owing = Math.max(0, Number(o.price || 0) - paidOn(o));
  const author = peopleById.get(o.created_by);

  const timeline = [
    ['Logged',     o.created_at],
    ['Baked',      o.baked_at],
    ['At store',   o.arrived_at],
    ['Picked up',  o.picked_up_at],
  ].filter(([, t]) => t);

  const canEdit = me.role === 'admin' || me.role === 'staff';
  const showMoney = me.role !== 'baker';
  const orderPrints = printsByOrder.get(o.id) || [];

  const body = openSheet(o.order_no, `
    ${o.photo_path ? '<img class="detail-photo" data-photo="' + esc(o.photo_path) + '" alt="Cake design">' : ''}

    <div class="detail-grid" id="detail-view">
      ${field('Customer', o.customer_name)}
      ${field('Phone', o.customer_phone)}
      <div class="span-2 hidden" id="cust-history"></div>
      ${field('Pick up', dateTimeFmt.format(new Date(o.due_at)))}
      ${field('Store', storeLabel(o.store))}
      ${field('Flavour', o.flavour)}
      ${field('Size', o.size)}
      ${field('Wording', o.wording, 'span-2')}
      ${o.design_notes ? field('Design notes', o.design_notes, 'span-2') : ''}
      ${o.notes ? field('Notes', o.notes, 'span-2') : ''}
      ${showMoney ? field('Price', o.price ? money.format(o.price) : '') : ''}
      ${showMoney ? field('Paid', owing > 0
        ? `${money.format(paidOn(o))} of ${money.format(o.price || 0)} — ${money.format(owing)} still to collect`
        : money.format(paidOn(o))) : ''}
      ${me.role === 'admin' ? field('Cost', o.cost != null ? money.format(o.cost) : '') : ''}
      ${field('Kind', o.kind === 'custom' ? 'Custom cake' : (o.walk_in ? 'Normal · bought in store' : 'Normal · ordered ahead'), 'span-2')}
    </div>

    ${orderPrints.length ? `
      <div class="warnbox" id="print-block">
        <div class="warnbox-title">${esc(printKindsLabel(orderPrints))} on this cake</div>
        <div class="warnbox-note">Do not call it finished until these are on it.</div>
        ${orderPrints.map((j) => `
          <div class="list-row">
            <span class="tag ${j.kind === '3d' ? 'tag-3d' : 'tag-photo'}">${j.kind === '3d' ? '3D' : 'Photo'}</span>
            <span class="grow">${esc(j.what)}</span>
            <span class="tag ${j.status === 'printed' ? 'tag-done' : 'tag-todo'}">${j.status === 'printed' ? 'Printed' : 'To print'}</span>
          </div>`).join('')}
      </div>` : ''}

    ${canEdit ? `<button type="button" class="btn btn-outline" id="edit-toggle" style="width:100%;margin-top:2px;">Edit details</button>` : ''}

    <div class="hidden" id="edit-panel">
      <div class="row-2">
        <div class="field">
          <label class="field-label" for="edit-name">Customer</label>
          <input class="input" id="edit-name" value="${esc(o.customer_name)}">
        </div>
        <div class="field">
          <label class="field-label" for="edit-phone">Phone</label>
          <input class="input nums" id="edit-phone" type="tel" inputmode="tel" value="${esc(o.customer_phone || '')}">
        </div>
      </div>

      <div class="field">
        <span class="field-label">Pick up</span>
        <button type="button" class="datefield" id="edit-due-btn" aria-expanded="false">
          <span class="datefield-value is-empty" id="edit-due-label">Choose a date and time</span>
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
          </svg>
        </button>
        <div class="cal hidden" id="edit-due-cal"></div>
        <input type="hidden" id="edit-due">
      </div>

      <div class="row-2">
        <div class="field"><span class="field-label">Flavour</span><div id="edit-dd-flavour"></div></div>
        <div class="field"><span class="field-label">Size</span><div id="edit-dd-size"></div></div>
      </div>

      <div class="field">
        <label class="field-label" for="edit-wording">Wording on cake</label>
        <input class="input" id="edit-wording" value="${esc(o.wording || '')}">
      </div>

      ${o.kind === 'custom' ? `
      <div class="field">
        <label class="field-label" for="edit-design">Design notes</label>
        <textarea class="textarea" id="edit-design">${esc(o.design_notes || '')}</textarea>
      </div>` : ''}

      <div class="field">
        <label class="field-label" for="edit-notes">Anything else</label>
        <textarea class="textarea" id="edit-notes">${esc(o.notes || '')}</textarea>
      </div>

      <div class="row-2">
        <button class="btn btn-quiet" type="button" id="edit-cancel">Cancel</button>
        <button class="btn btn-primary" type="button" id="edit-save">Save changes</button>
      </div>
      <p class="msg" id="edit-msg" role="status" aria-live="polite"></p>
    </div>

    <hr class="rule">
    <div class="block-label">Status <span id="status-now" class="status-now"></span></div>
    <div class="action-row" id="status-actions"></div>
    <div id="print-warn"></div>

    ${me.role === 'admin' ? `
      <hr class="rule">
      <div class="block-label">Cost to make <span style="font-weight:400;text-transform:none;letter-spacing:0;">(admin only)</span></div>
      <div class="row-2">
        <div class="money"><input class="input nums" id="cost-input" type="number" step="0.01" min="0"
               inputmode="decimal" placeholder="0.00" value="${o.cost ?? ''}"></div>
        <button class="btn btn-outline" id="cost-save">Save cost</button>
      </div>
      <p class="msg" id="cost-msg" role="status" aria-live="polite"></p>` : ''}

    ${canEdit ? `
      <hr class="rule">
      <div class="block-label">Payment</div>
      <div class="row-2">
        <div><div class="detail-k">Price</div>
          <div class="money"><input class="input nums" id="price-input" type="number" step="0.01" min="0" inputmode="decimal" value="${o.price ?? ''}"></div></div>
        <div><div class="detail-k">Deposit</div>
          <div class="money"><input class="input nums" id="deposit-input" type="number" step="0.01" min="0" inputmode="decimal" value="${o.deposit ?? 0}"></div></div>
      </div>
      <button class="btn btn-outline" id="pay-save" style="width:100%;margin-top:9px;">Save payment</button>
      <p class="msg" id="pay-msg" role="status" aria-live="polite"></p>` : ''}

    <hr class="rule">
    <div class="block-label">History</div>
    <div class="timeline">
      ${timeline.map(([k, t]) => `
        <div class="tl-item"><span>${k}</span>
          ${k === 'Logged' && author ? `<span class="list-meta">by ${esc(author.name)}</span>` : ''}
          <span class="tl-when">${esc(dateTimeFmt.format(new Date(t)))}</span></div>`).join('')}
    </div>
  `);

  hydrateThumbs(body);

  // Loaded after paint: knowing someone is a regular changes how staff greet
  // them at the counter, but it must never hold up opening the order.
  if (o.customer_phone) {
    getCustomer(o.customer_phone).then((c) => {
      const host = $('cust-history');
      if (!c || !host || Number(c.order_count) < 2) return;
      host.innerHTML = `
        <div class="detail-k">Customer history</div>
        <div class="detail-v">
          <span class="repeat-chip">Regular</span>
          ${c.order_count} orders · ${money.format(Number(c.spend || 0))} all up
          <span class="list-meta">· since ${esc(dateFmt.format(new Date(c.first_order)))}</span>
        </div>`;
      host.classList.remove('hidden');
    }).catch(() => {});
  }

  const detailImg = body.querySelector('.detail-photo');
  if (detailImg) photoUrl(detailImg.dataset.photo).then((u) => { if (u) detailImg.src = u; });

  // Status buttons the database will actually accept for this role — the guard
  // trigger rejects anything else, so offering it would only produce an error.
  const allowed = me.role === 'admin'
    ? ['placed', 'baked', 'arrived', 'picked_up', 'cancelled']
    : me.role === 'baker'
      ? ['placed', 'baked']
      : ['placed', 'arrived', 'picked_up', 'cancelled'];

  $('status-actions').innerHTML = allowed
    .filter((s) => s !== o.status)
    .map((s) => `<button class="btn btn-quiet" data-status="${s}">${esc(STATUS_LABEL[s])}</button>`)
    .join('');
  $('status-now').innerHTML =
    `<span class="status-dot st-${o.status}">${esc(STATUS_LABEL[o.status])}</span>`;

  const commitStatus = async (status, b) => {
    b.disabled = true; b.textContent = 'Saving…';
    try { await setStatus(o.id, status); closeSheet(); await render(); }
    catch (err) {
      b.disabled = false;
      b.textContent = STATUS_LABEL[status];
      toast(err.message, 'error');
    }
  };

  // The whole reason this app exists is that a cake went out without its
  // toppers. Calling one baked or collected is the last moment anyone can
  // catch that, so it asks first instead of saving silently.
  function askAboutPrints(status, b) {
    const left = orderPrints.filter((j) => j.status !== 'printed');
    const host = $('print-warn');
    $('print-block')?.classList.add('hidden');
    host.innerHTML = `
      <div class="warnbox">
        <div class="warnbox-title">${esc(printKindsLabel(orderPrints))} — are they on the cake?</div>
        <div class="warnbox-note">${left.length
          ? `${left.length} of ${orderPrints.length} ${left.length === 1 ? 'is' : 'are'} still marked as not printed.`
          : 'All printed — just confirming they made it onto the cake.'}</div>
        ${left.map((j) => `
          <div class="list-row">
            <span class="tag ${j.kind === '3d' ? 'tag-3d' : 'tag-photo'}">${j.kind === '3d' ? '3D' : 'Photo'}</span>
            <span class="grow">${esc(j.what)}</span>
            ${canPrintStatus(j)
              ? `<button class="logbar-clear" data-mark="${orderPrints.indexOf(j)}">Mark printed</button>`
              : '<span class="tag tag-todo">To print</span>'}
          </div>`).join('')}
        <div class="action-row">
          <button class="btn btn-quiet" data-warn="no">Not yet</button>
          <button class="btn btn-primary" data-warn="yes">Yes — ${esc(STATUS_LABEL[status])}</button>
        </div>
      </div>`;

    host.querySelectorAll('[data-mark]').forEach((mb) => mb.addEventListener('click', async () => {
      const j = orderPrints[Number(mb.dataset.mark)];
      mb.disabled = true; mb.textContent = 'Saving…';
      try {
        Object.assign(j, await setPrintStatus(j.id, 'printed'));
        askAboutPrints(status, b);
      } catch (err) { toast(err.message, 'error'); mb.disabled = false; mb.textContent = 'Mark printed'; }
    }));

    host.querySelector('[data-warn="no"]').addEventListener('click', () => {
      host.innerHTML = '';
      $('print-block')?.classList.remove('hidden');
      b.disabled = false; b.textContent = STATUS_LABEL[status];
    });
    host.querySelector('[data-warn="yes"]').addEventListener('click', () => commitStatus(status, b));
    host.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  $('status-actions').querySelectorAll('[data-status]').forEach((b) =>
    b.addEventListener('click', () => {
      const status = b.dataset.status;
      if (orderPrints.length && (status === 'baked' || status === 'picked_up')) {
        b.disabled = true;
        askAboutPrints(status, b);
        return;
      }
      commitStatus(status, b);
    }));

  if (me.role === 'admin') {
    $('cost-save').addEventListener('click', async () => {
      const msg = $('cost-msg');
      try {
        await setCost(o.id, $('cost-input').value);
        o.cost = $('cost-input').value === '' ? null : Number($('cost-input').value);
        msg.textContent = 'Cost saved.'; msg.className = 'msg msg-ok';
      } catch (err) { msg.textContent = err.message; msg.className = 'msg msg-error'; }
    });
  }

  if (canEdit) {
    $('pay-save').addEventListener('click', async () => {
      const msg = $('pay-msg');
      try {
        const updated = await updateOrder(o.id, {
          price: $('price-input').value === '' ? null : Number($('price-input').value),
          deposit: Number($('deposit-input').value || 0),
        });
        Object.assign(o, updated);
        msg.textContent = 'Payment saved.'; msg.className = 'msg msg-ok';
      } catch (err) { msg.textContent = err.message; msg.className = 'msg msg-error'; }
    });

    // ── Edit details ─────────────────────────────────────────────────────────
    // Everything a customer might ring up and ask to change: name, phone, cake,
    // and pickup time. Store and kind are not editable here — moving an order
    // between stores or between custom and normal is a different order, not a
    // correction, and would silently break the per-store docket numbering.
    let editMounted = false;
    let editDue = null, editFlavour = null, editSize = null;

    $('edit-toggle').addEventListener('click', () => {
      $('detail-view').classList.add('hidden');
      $('edit-toggle').classList.add('hidden');
      $('edit-panel').classList.remove('hidden');

      if (!editMounted) {
        editMounted = true;
        editDue = mountDuePicker('edit-due', o.due_at);
        editFlavour = mountDropdown($('edit-dd-flavour'), {
          value: o.flavour, placeholder: 'Choose flavour',
          options: FLAVOURS.map((f) => ({ value: f.name, label: f.name, tag: f.premium ? 'Premium' : null })),
        });
        editSize = mountDropdown($('edit-dd-size'), {
          value: o.size, placeholder: 'Choose size',
          options: SIZES.map((sz) => ({ value: sz.code, label: sz.label })),
        });
      }
    });

    const closeEdit = () => {
      $('edit-panel').classList.add('hidden');
      $('detail-view').classList.remove('hidden');
      $('edit-toggle').classList.remove('hidden');
      $('edit-msg').textContent = '';
    };
    $('edit-cancel').addEventListener('click', closeEdit);

    $('edit-save').addEventListener('click', async () => {
      const msg = $('edit-msg');
      const name = $('edit-name').value.trim();
      if (!name) { msg.textContent = 'Customer name cannot be blank.'; msg.className = 'msg msg-error'; return; }
      if (!editDue.value()) { msg.textContent = 'Pick a date and time.'; msg.className = 'msg msg-error'; return; }

      const btn = $('edit-save');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const patch = {
          customer_name: name,
          customer_phone: $('edit-phone').value.trim() || null,
          due_at: editDue.value(),
          flavour: editFlavour.value() || null,
          size: editSize.value() || null,
          wording: $('edit-wording').value.trim() || null,
          notes: $('edit-notes').value.trim() || null,
        };
        if (o.kind === 'custom') patch.design_notes = $('edit-design').value.trim() || null;

        const updated = await updateOrder(o.id, patch);
        Object.assign(o, updated);
        closeSheet();
        toast(`${o.order_no} updated.`);
        await render();
      } catch (err) {
        msg.textContent = err.message; msg.className = 'msg msg-error';
        btn.disabled = false; btn.textContent = 'Save changes';
      }
    });
  }
}

// ── New order ───────────────────────────────────────────────────────────────
function openNewOrder() {
  let kind = null;
  let photoFile = null;
  let priceTouched = false;          // stop size autofill from clobbering a typed price
  const mine = STORES.filter((s) => me.stores.includes(s.code));

  const body = openSheet('New order', `
    <div class="kind-pick">
      <button class="kind-card" data-kind="custom" aria-pressed="false">
        <div class="kind-name">Custom cake</div>
        <div class="kind-note">Made to a design</div>
      </button>
      <button class="kind-card" data-kind="normal" aria-pressed="false">
        <div class="kind-name">Normal cake</div>
        <div class="kind-note">Off the menu</div>
      </button>
    </div>

    <form id="order-form" class="hidden">
      <hr class="rule">

      <div class="field hidden" id="walkin-field">
        <span class="field-label">How was it bought</span>
        <div id="dd-walkin"></div>
      </div>

      ${mine.length > 1 ? `
        <div class="field">
          <span class="field-label">Store</span>
          <div id="dd-store"></div>
        </div>` : ''}

      <div class="row-2">
        <div class="field">
          <label class="field-label" for="f-name">Customer <span class="req">*</span></label>
          <div class="type-wrap">
            <input class="input" id="f-name" required autocomplete="off"
                   role="combobox" aria-expanded="false" aria-autocomplete="list">
            <div class="dd-menu hidden" id="name-suggest" role="listbox"></div>
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="f-phone">Phone</label>
          <input class="input nums" id="f-phone" type="tel" inputmode="tel" autocomplete="off">
        </div>
      </div>

      <p class="autofill-note hidden" id="autofill-note"></p>

      <div class="field">
        <span class="field-label">Pick up <span class="req">*</span></span>
        <button type="button" class="datefield" id="f-due-btn" aria-expanded="false">
          <span class="datefield-value is-empty" id="f-due-label">Choose a date and time</span>
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
          </svg>
        </button>
        <div class="cal hidden" id="f-due-cal"></div>
        <input type="hidden" id="f-due">
      </div>

      <div class="row-2">
        <div class="field">
          <span class="field-label">Flavour</span>
          <div id="dd-flavour"></div>
        </div>
        <div class="field">
          <span class="field-label">Size</span>
          <div id="dd-size"></div>
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="f-wording">Wording on cake</label>
        <input class="input" id="f-wording" placeholder="Happy Birthday Jainam" autocomplete="off">
      </div>

      <div class="field" id="design-field">
        <label class="field-label" for="f-design">Design notes</label>
        <textarea class="textarea" id="f-design" placeholder="Both shape cake, pink fairies…"></textarea>
      </div>

      <div class="field" id="photo-field">
        <span class="field-label">Design photo <span class="req">*</span></span>
        <div class="photo-drop">
          <span class="photo-shot hidden" id="photo-shot">
            <img class="photo-preview" id="photo-preview" alt="Attached design photo">
            <button type="button" class="photo-remove" id="photo-remove" aria-label="Remove this photo">✕</button>
          </span>
          <div style="flex:1;min-width:0">
            <!-- No capture attribute: on Android it makes Chrome skip the picker
                 and open the camera, so staff could not attach a photo the
                 customer had already sent. Without it both options appear. -->
            <input class="photo-input" type="file" id="f-photo" accept="image/*">
            <label class="photo-pick" for="f-photo">
              <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.4"/><path d="M8 6l1.6-2.4h4.8L16 6"/>
              </svg>
              <span id="photo-pick-label">Add a photo</span>
            </label>
            <p class="photo-name hidden" id="photo-name"></p>
            <p class="photo-hint">Camera or gallery. Shrunk before upload, and deleted 14 days after the order.</p>
          </div>
        </div>
      </div>

      <div class="row-2">
        <div class="field">
          <label class="field-label" for="f-price">Price</label>
          <div class="money"><input class="input nums" id="f-price" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></div>
          <p class="money-hint hidden" id="price-hint"></p>
        </div>
        <div class="field">
          <label class="field-label" for="f-deposit">Deposit taken</label>
          <div class="money"><input class="input nums" id="f-deposit" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></div>
        </div>
      </div>

      <div class="field">
        <span class="field-label">Payment</span>
        <div class="pay-toggle" id="pay-toggle">
          <button type="button" class="pay-opt" data-pay="unpaid" aria-pressed="true">Unpaid</button>
          <button type="button" class="pay-opt" data-pay="deposit" aria-pressed="false">Deposit</button>
          <button type="button" class="pay-opt" data-pay="paid" aria-pressed="false">Paid in full</button>
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="f-notes">Anything else</label>
        <textarea class="textarea" id="f-notes"></textarea>
      </div>

      <button class="btn btn-primary" id="save-order" type="submit">Save order</button>
      <p class="msg" id="order-msg" role="status" aria-live="polite"></p>
    </form>
  `, { center: true });

  // ── Dropdowns ─────────────────────────────────────────────────────────────
  const ddWalkin = mountDropdown($('dd-walkin'), {
    value: 'later',
    options: [
      { value: 'later', label: 'Ordered for later' },
      { value: 'now',   label: 'Bought in store now' },
    ],
  });

  const ddStore = mine.length > 1
    ? mountDropdown($('dd-store'), {
        value: store,
        options: mine.map((s) => ({ value: s.code, label: s.label })),
      })
    : { value: () => mine[0].code };

  const ddFlavour = mountDropdown($('dd-flavour'), {
    placeholder: 'Choose flavour',
    options: FLAVOURS.map((f) => ({
      value: f.name, label: f.name, tag: f.premium ? 'Premium' : null,
    })),
    onChange: refreshPriceHint,
  });

  const ddSize = mountDropdown($('dd-size'), {
    placeholder: 'Choose size',
    options: SIZES.map((sz) => ({ value: sz.code, label: sz.label })),
    onChange: (code) => {
      // Fill the standard price so staff only type when it differs. Never
      // overwrite a price they have already typed.
      const base = basePrice(code);
      if (base != null && !priceTouched) $('f-price').value = base.toFixed(2);
      refreshPriceHint();
      syncPayment();
    },
  });

  function refreshPriceHint() {
    const hint = $('price-hint');
    const flavour = ddFlavour.value();
    if (flavour && isPremium(flavour)) {
      hint.textContent = `${flavour} is a premium flavour — add the surcharge to the base price.`;
      hint.classList.remove('hidden');
    } else {
      hint.classList.add('hidden');
    }
  }

  $('f-price').addEventListener('input', () => { priceTouched = true; syncPayment(); });

  // ── Customer lookup ───────────────────────────────────────────────────────
  // Typing a name searches people the shop has already served. Picking one
  // fills the phone and nothing else: the cake is a fresh decision every time,
  // so carrying over the last flavour or price would put stale details on a
  // new order without anyone noticing.
  const nameEl = $('f-name');
  const phoneEl = $('f-phone');
  const suggest = $('name-suggest');
  const note = $('autofill-note');

  const clearAutofill = () => {
    nameEl.classList.remove('is-autofilled');
    phoneEl.classList.remove('is-autofilled');
    note.classList.add('hidden');
  };

  const closeSuggest = () => {
    suggest.classList.add('hidden');
    nameEl.setAttribute('aria-expanded', 'false');
  };

  const ordinal = (n) => {
    const suffix = (n % 100 >= 11 && n % 100 <= 13) ? 'th'
      : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
    return `${n}${suffix}`;
  };

  function pickCustomer(c) {
    nameEl.value = c.name;
    phoneEl.value = c.phone || '';
    nameEl.classList.add('is-autofilled');
    if (c.phone) phoneEl.classList.add('is-autofilled');
    note.textContent = `Filled from a past order — this is ${c.name.split(' ')[0]}'s ${ordinal(Number(c.order_count) + 1)} cake.`;
    note.classList.remove('hidden');
    closeSuggest();
    $('f-due-btn').focus();
  }

  let nameTimer = null;
  nameEl.addEventListener('input', () => {
    clearAutofill();
    clearTimeout(nameTimer);
    const term = nameEl.value.trim();
    if (term.length < 2) { closeSuggest(); return; }
    nameTimer = setTimeout(async () => {
      let hits = [];
      try { hits = await searchCustomers(term); }
      catch { /* never block taking an order on a lookup */ }
      if (!hits.length || nameEl.value.trim() !== term) { closeSuggest(); return; }

      suggest.innerHTML = hits.map((c, i) => `
        <button type="button" class="dd-opt" role="option" data-i="${i}" aria-selected="false">
          <span class="sug-name">${esc(c.name)}</span>
          <span class="sug-phone">${esc(c.phone || '')}</span>
          <span class="dd-note">${c.order_count}×</span>
        </button>`).join('');
      suggest.querySelectorAll('[data-i]').forEach((b) =>
        b.addEventListener('mousedown', (e) => { e.preventDefault(); pickCustomer(hits[+b.dataset.i]); }));
      suggest.classList.remove('hidden');
      nameEl.setAttribute('aria-expanded', 'true');
    }, 200);
  });

  phoneEl.addEventListener('input', () => phoneEl.classList.remove('is-autofilled'));
  nameEl.addEventListener('blur', () => setTimeout(closeSuggest, 120));

  // A number typed straight in still finds the customer, for staff who work
  // phone-first because that is what the WhatsApp message leads with.
  phoneEl.addEventListener('change', async () => {
    if (nameEl.value.trim()) return;
    try {
      const hit = await findCustomerByPhone(phoneEl.value);
      if (hit && !nameEl.value.trim()) {
        nameEl.value = hit.customer_name;
        nameEl.classList.add('is-autofilled');
        note.textContent = 'Filled from a past order.';
        note.classList.remove('hidden');
      }
    } catch { /* lookups are a convenience, never a blocker */ }
  });

  // ── Payment ───────────────────────────────────────────────────────────────
  let payMode = 'unpaid';
  function syncPayment() {
    const price = Number($('f-price').value || 0);
    const dep = $('f-deposit');
    if (payMode === 'unpaid') { dep.value = '0'; dep.disabled = true; }
    else if (payMode === 'paid') { dep.value = price ? price.toFixed(2) : ''; dep.disabled = true; }
    else { dep.disabled = false; }
  }
  $('pay-toggle').querySelectorAll('[data-pay]').forEach((b) => b.addEventListener('click', () => {
    payMode = b.dataset.pay;
    $('pay-toggle').querySelectorAll('[data-pay]')
      .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    syncPayment();
    if (payMode === 'deposit') $('f-deposit').focus();
  }));
  syncPayment();

  // ── Photo ─────────────────────────────────────────────────────────────────
  const showPhoto = (file) => {
    const prev = $('photo-preview');
    if (prev.dataset.url) URL.revokeObjectURL(prev.dataset.url);
    if (file) {
      const url = URL.createObjectURL(file);
      prev.src = url;
      prev.dataset.url = url;
      $('photo-shot').classList.remove('hidden');
      $('photo-name').textContent = file.name;
      $('photo-name').classList.remove('hidden');
      $('photo-pick-label').textContent = 'Change photo';
    } else {
      prev.removeAttribute('src');
      delete prev.dataset.url;
      $('photo-shot').classList.add('hidden');
      $('photo-name').classList.add('hidden');
      $('photo-pick-label').textContent = 'Add a photo';
    }
  };

  $('f-photo').addEventListener('change', (e) => {
    photoFile = e.target.files[0] || null;
    showPhoto(photoFile);
  });

  $('photo-remove').addEventListener('click', () => {
    photoFile = null;
    $('f-photo').value = '';
    showPhoto(null);
  });

  const due = mountDuePicker();

  // ── Kind ──────────────────────────────────────────────────────────────────
  body.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => {
    kind = b.dataset.kind;
    body.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('order-form').classList.remove('hidden');
    // A custom cake is defined by its design, so the photo is required and the
    // walk-in question is meaningless. A normal cake is the reverse.
    $('walkin-field').classList.toggle('hidden', kind !== 'normal');
    $('photo-field').classList.toggle('hidden', kind !== 'custom');
    $('design-field').classList.toggle('hidden', kind !== 'custom');
    $('f-name').focus();
  }));

  // ── Save ──────────────────────────────────────────────────────────────────
  $('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('save-order'), msg = $('order-msg');
    const walkIn = kind === 'normal' && ddWalkin.value() === 'now';

    if (!due.value()) {
      msg.textContent = 'Pick the date and time the cake is being collected.';
      msg.className = 'msg msg-error';
      $('f-due-btn').focus();
      return;
    }
    if (kind === 'custom' && !photoFile) {
      msg.textContent = 'A custom cake needs a photo of the design.';
      msg.className = 'msg msg-error';
      return;
    }

    btn.disabled = true; btn.textContent = 'Saving…'; msg.textContent = ''; msg.className = 'msg';
    try {
      const order = await createOrder({
        store: ddStore.value(),
        kind,
        walk_in: walkIn,
        customer_name: $('f-name').value.trim(),
        customer_phone: $('f-phone').value.trim() || null,
        due_at: due.value(),
        flavour: ddFlavour.value() || null,
        size: ddSize.value() || null,
        wording: $('f-wording').value.trim() || null,
        design_notes: $('f-design').value.trim() || null,
        notes: $('f-notes').value.trim() || null,
        price: $('f-price').value === '' ? null : Number($('f-price').value),
        deposit: Number($('f-deposit').value || 0),
      });

      if (photoFile) {
        btn.textContent = 'Uploading photo…';
        try {
          await uploadPhoto(order, photoFile);
        } catch (err) {
          // The order is the thing that matters; a failed photo must not lose it.
          closeSheet();
          await render();
          toast(`${order.order_no} saved, but the photo did not upload. Open the order to add it again.`, 'error');
          return;
        }
      }

      closeSheet();
      toast(`${order.order_no} saved for ${order.customer_name}.`);
      if (view !== 'log') go('log'); else await render();
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'msg msg-error';
      btn.disabled = false; btn.textContent = 'Save order';
    }
  });
}

/**
 * Date + time picker for the pickup field.
 *
 * The native <input type="datetime-local"> popup is browser chrome: it cannot
 * be styled, and it rendered as a bright blue system panel in the middle of a
 * cream sheet. This is a plain calendar grid plus three time controls, built
 * from the same Sydney date helpers the rest of the app uses, so a pickup time
 * means the same thing here as it does on the baker's list.
 *
 * Returns { value } — the chosen instant as an ISO string, or '' if unset.
 */
function mountDuePicker(prefix = 'f-due', initialISO = null) {
  const btn    = $(`${prefix}-btn`);
  const panel  = $(`${prefix}-cal`);
  const label  = $(`${prefix}-label`);
  const hidden = $(prefix);

  const today = sydneyParts(new Date());
  let view = { year: today.year, month: today.month };
  let selected = null;
  let hour = 15, minute = 0;   // 3pm: a sane default pickup, still overridable

  // Editing an order starts from its current pickup time rather than empty.
  if (initialISO) {
    const p = sydneyParts(initialISO);
    selected = p.dayKey;
    hour = p.hour;
    minute = p.minute;
    view = { year: p.year, month: p.month };
  }

  const pad = (n) => String(n).padStart(2, '0');
  const addDays = (key, n) => {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
  };
  // Formatting a UTC-midnight date in UTC keeps the calendar date intact.
  const dayLabel = (key, opts) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', ...opts })
      .format(new Date(Date.UTC(y, m - 1, d)));
  };
  const timeLabel = () => {
    const h12 = ((hour + 11) % 12) + 1;
    return `${h12}:${pad(minute)} ${hour < 12 ? 'am' : 'pm'}`;
  };

  function commit() {
    if (!selected) { hidden.value = ''; return; }
    hidden.value = sydneyDateTimeToISO(selected, hour, minute);
    label.textContent = `${dayLabel(selected, { weekday: 'short', day: 'numeric', month: 'short' })} · ${timeLabel()}`;
    label.classList.remove('is-empty');
  }

  function paint() {
    const h12 = ((hour + 11) % 12) + 1;
    const isPm = hour >= 12;
    const monthName = new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', month: 'long', year: 'numeric' })
      .format(new Date(Date.UTC(view.year, view.month - 1, 15)));

    panel.innerHTML = `
      <div class="cal-head">
        <button type="button" class="cal-nav" data-step="-1" aria-label="Previous month">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div class="cal-month">${esc(monthName)}</div>
        <button type="button" class="cal-nav" data-step="1" aria-label="Next month">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>

      <div class="cal-dow">${['S','M','T','W','T','F','S'].map((d) => `<span>${d}</span>`).join('')}</div>

      <div class="cal-grid">
        ${monthGrid(view.year, view.month).flat().map((d) => `
          <button type="button" data-day="${d.key}"
            aria-label="${esc(dayLabel(d.key, { weekday: 'long', day: 'numeric', month: 'long' }))}"
            aria-pressed="${d.key === selected}"
            class="cal-day${d.inMonth ? '' : ' is-other'}${d.key === today.dayKey ? ' is-today' : ''}${d.key === selected ? ' is-selected' : ''}${d.key < today.dayKey ? ' is-past' : ''}"
          >${d.day}</button>`).join('')}
      </div>

      <div class="cal-time">
        <div id="cal-h" class="cal-time-dd"></div>
        <span class="cal-colon">:</span>
        <div id="cal-m" class="cal-time-dd"></div>
        <div class="ampm">
          <button type="button" data-ampm="am" aria-pressed="${!isPm}">am</button>
          <button type="button" data-ampm="pm" aria-pressed="${isPm}">pm</button>
        </div>
      </div>

      <div class="cal-foot">
        <button type="button" class="btn btn-quiet" data-quick="0">Today</button>
        <button type="button" class="btn btn-quiet" data-quick="1">Tomorrow</button>
        <button type="button" class="btn btn-primary" data-done>Done</button>
      </div>`;

    panel.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
      view = shiftMonth(view.year, view.month, Number(b.dataset.step));
      paint();
    }));

    panel.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => {
      selected = b.dataset.day;
      commit();
      paint();
    }));

    panel.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => {
      selected = addDays(today.dayKey, Number(b.dataset.quick));
      const [y, m] = selected.split('-').map(Number);
      view = { year: y, month: m };
      commit();
      paint();
    }));

    const isPmNow = () =>
      panel.querySelector('[data-ampm="pm"]').getAttribute('aria-pressed') === 'true';

    mountDropdown($('cal-h'), {
      value: String(h12),
      options: Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
      onChange: (v) => { hour = (Number(v) % 12) + (isPmNow() ? 12 : 0); commit(); paint(); },
    });

    mountDropdown($('cal-m'), {
      value: String(minute),
      options: Array.from({ length: 12 }, (_, i) => ({ value: String(i * 5), label: pad(i * 5) })),
      onChange: (v) => { minute = Number(v); commit(); paint(); },
    });

    panel.querySelectorAll('[data-ampm]').forEach((b) => b.addEventListener('click', () => {
      panel.querySelectorAll('[data-ampm]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      hour = (hour % 12) + (b.dataset.ampm === 'pm' ? 12 : 0);
      commit();
      paint();
    }));

    panel.querySelector('[data-done]').addEventListener('click', () => toggle(false));
  }

  function toggle(open) {
    panel.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', String(open));
    if (!open) return;
    paint();
    // The panel opens inside a scrolling sheet, so on a phone it can appear
    // below the fold with the month header cut off. Pull it into view.
    requestAnimationFrame(() => panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }

  btn.addEventListener('click', () => toggle(panel.classList.contains('hidden')));

  if (initialISO) commit();   // show the existing pickup time immediately, not "Choose a date"

  return { value: () => hidden.value };
}

// ── More menu ───────────────────────────────────────────────────────────────
//
// Analytics is several pages now, and none of them are touched mid-shift, so
// they sit behind a drawer rather than a fifth tab. Groups expand in place and
// the leaves are the pages — the shape of Search Console's sidebar, which is
// where dad already reads numbers.

const MENU = [
  {
    label: 'Analytics',
    roles: ['admin'],
    icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    children: [
      { view: 'analytics', page: 'finance',   label: 'Finance',   note: 'Sales, margin, money still owed' },
      { view: 'analytics', page: 'customers', label: 'Customers', note: 'Repeat rate, how far ahead people book' },
      { view: 'analytics', page: 'data',      label: 'Data',      note: 'Stores, what sells, who logged what' },
    ],
  },
  {
    label: 'Customers',
    // Staff get this too: the person asking "I ordered last month" is standing
    // at their counter, not Vaidik's. The view is security_invoker, so they
    // still only see people who ordered at their own store.
    roles: ['admin', 'staff'],
    icon: '<path d="M16 20v-1.5a4 4 0 00-4-4H7a4 4 0 00-4 4V20M9.5 6.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0zM21 20v-1.5a4 4 0 00-3-3.87M16.5 3.6a4 4 0 010 7.75"/>',
    children: [
      { view: 'directory', label: 'Directory', note: 'Look someone up by name or number' },
    ],
  },
  {
    label: 'Staff',
    roles: ['admin'],
    icon: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M16 7a4 4 0 11-8 0 4 4 0 018 0z"/>',
    children: [
      { view: 'staff', label: 'People & sign-ins', note: 'Who has an account, and who has been on' },
    ],
  },
  {
    label: 'Export',
    roles: ['admin'],
    icon: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    children: [
      { view: 'export', label: 'Orders for the bookkeeper', note: 'Download a month or a financial year as CSV' },
    ],
  },
];

const VIEW_TITLE = {
  log: 'Orders', bake: 'To bake', prints: 'Prints',
  directory: 'Customers', staff: 'Staff', export: 'Export',
};
const ANALYTICS_TITLE = { finance: 'Finance', customers: 'Customers', data: 'Data' };

/** Every view the drawer can reach, so render() knows what to show and hide. */
const DRAWER_VIEWS = ['analytics', 'directory', 'staff', 'export'];

const menuGroups = () => MENU.filter((g) => g.roles.includes(me.role));

// Only Analytics starts open. With four groups, expanding them all would push
// the last one under the fold on a phone.
let navOpen = new Set(['Analytics']);

function closeDrawer() {
  $('drawer-root').innerHTML = '';
  $('menu-btn').setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

const isCurrent = (c) =>
  view === c.view && (!c.page || analyticsPage === c.page);

function openDrawer() {
  document.body.style.overflow = 'hidden';
  $('menu-btn').setAttribute('aria-expanded', 'true');
  $('drawer-root').innerHTML = `
    <div class="drawer-scrim" data-drawer-close></div>
    <nav class="drawer" aria-label="More">
      <div class="drawer-head">
        <span class="drawer-mark display">Num Num's</span>
        <button class="drawer-x" data-drawer-close aria-label="Close">✕</button>
      </div>
      ${menuGroups().map((g) => `
        <button class="nav-head" data-group="${esc(g.label)}" aria-expanded="${navOpen.has(g.label)}">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g.icon}</svg>
          <span class="grow">${esc(g.label)}</span>
          <svg class="nav-chev" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="nav-kids${navOpen.has(g.label) ? '' : ' hidden'}">
          ${g.children.map((c) => `
            <button class="nav-item" data-view="${esc(c.view)}" data-page="${esc(c.page || '')}"
                    aria-current="${isCurrent(c) ? 'page' : 'false'}">
              <span class="nav-item-name">${esc(c.label)}</span>
              <span class="nav-item-note">${esc(c.note)}</span>
            </button>`).join('')}
        </div>`).join('')}
    </nav>`;

  $('drawer-root').querySelectorAll('[data-drawer-close]')
    .forEach((b) => b.addEventListener('click', closeDrawer));

  $('drawer-root').querySelectorAll('[data-group]').forEach((b) => b.addEventListener('click', () => {
    const g = b.dataset.group;
    if (navOpen.has(g)) navOpen.delete(g); else navOpen.add(g);
    openDrawer();
  }));

  $('drawer-root').querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    view = b.dataset.view;
    if (b.dataset.page) analyticsPage = b.dataset.page;
    closeDrawer();
    buildTabs();
    render();
  }));
}

$('menu-btn').addEventListener('click', () =>
  ($('drawer-root').innerHTML ? closeDrawer() : openDrawer()));

// Tuck the button away while reading down a page and bring it back on the way
// up. Without this it parks itself over the right-hand column of every list,
// which on these pages is the amounts.
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (Math.abs(y - lastScrollY) < 6) return;
  $('menu-btn').classList.toggle('is-tucked', y > lastScrollY && y > 90);
  lastScrollY = y;
}, { passive: true });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('drawer-root').innerHTML) closeDrawer();
});

// ── Customer directory ──────────────────────────────────────────────────────
//
// Customer data existed already — it just had nowhere to be looked at. It
// surfaced as a typeahead while logging an order and a top-six in analytics,
// so "she says she ordered here last month" had no answer at the counter.

let custSort = 'recent';
let custQuery = '';
let custTimer = null;

const CUST_SORTS = [
  { key: 'recent', label: 'Recent' },
  { key: 'orders', label: 'Most orders' },
  { key: 'spend',  label: 'Biggest spend' },
  { key: 'name',   label: 'A–Z' },
];

async function renderDirectory() {
  const root = $('view-directory');
  const first = !root.querySelector('#cust-search');

  if (first) {
    root.innerHTML = `
      <div class="field type-wrap" style="margin-bottom:12px;">
        <span class="logbar-search">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
          </svg>
          <input class="input" id="cust-search" type="search" autocomplete="off"
                 role="combobox" aria-expanded="false" aria-autocomplete="list"
                 placeholder="Search a name or number" aria-label="Search customers">
        </span>
        <div class="dd-menu hidden" id="cust-suggest" role="listbox"></div>
      </div>
      <div class="sortbar" id="cust-sort" role="group" aria-label="Sort customers"></div>
      <div id="cust-list"></div>`;

    const suggest = $('cust-suggest');
    const closeSuggest = () => {
      suggest.classList.add('hidden');
      $('cust-search').setAttribute('aria-expanded', 'false');
    };

    $('cust-search').addEventListener('input', (e) => {
      custQuery = e.target.value;
      clearTimeout(custTimer);
      custTimer = setTimeout(async () => {
        if (view !== 'directory') return;
        paintDirectory();               // the list narrows as you type

        // …and the dropdown offers the exact person, so a known name is one tap
        // rather than a scroll through everyone who half-matches.
        const term = custQuery.trim();
        if (term.length < 2) { closeSuggest(); return; }
        let hits = [];
        try { hits = await listCustomers({ term, sort: 'orders', limit: 6 }); } catch { return; }
        if (!hits.length || $('cust-search').value.trim() !== term) { closeSuggest(); return; }

        suggest.innerHTML = hits.map((c, i) => `
          <button type="button" class="dd-opt" role="option" data-i="${i}" aria-selected="false">
            <span class="sug-name">${esc(c.name)}</span>
            <span class="sug-phone">${esc(c.phone || '')}</span>
            <span class="dd-note">${c.order_count}×</span>
          </button>`).join('');
        suggest.querySelectorAll('[data-i]').forEach((b) =>
          b.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            closeSuggest();
            openCustomer(hits[+b.dataset.i].phone_key, hits[+b.dataset.i]);
          }));
        suggest.classList.remove('hidden');
        $('cust-search').setAttribute('aria-expanded', 'true');
      }, 200);
    });

    $('cust-search').addEventListener('blur', () => setTimeout(closeSuggest, 140));
    $('cust-search').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSuggest(); });
  }

  $('cust-sort').innerHTML = CUST_SORTS.map((s) => `
    <button data-sort="${s.key}" aria-pressed="${s.key === custSort}">${esc(s.label)}</button>`).join('');
  $('cust-sort').querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => {
    custSort = b.dataset.sort;
    renderDirectory();
  }));

  await paintDirectory();
}

async function paintDirectory() {
  const list = $('cust-list');
  list.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';

  let rows = [];
  try { rows = await listCustomers({ term: custQuery, sort: custSort }); }
  catch (err) {
    list.innerHTML = `<div class="empty"><div class="empty-mark">Could not load customers</div>
      <p class="empty-note">${esc(err.message)}</p></div>`;
    return;
  }

  if (!rows.length) {
    list.innerHTML = custQuery
      ? `<div class="empty"><div class="empty-mark">Nobody matches</div>
           <p class="empty-note">No customer for “${esc(custQuery)}”.<br>Try part of a name, or the last few digits of a number.</p></div>`
      : `<div class="empty"><div class="empty-mark">No customers yet</div>
           <p class="empty-note">Everyone who orders shows up here once they have a phone number on the docket.</p></div>`;
    return;
  }

  list.innerHTML = rows.map((c) => {
    const n = Number(c.order_count);
    return `
      <button class="cust-row" data-cust="${esc(c.phone_key)}">
        <div class="cust-head">
          <span class="cust-name">${esc(c.name)}</span>
          ${n > 1 ? `<span class="repeat-chip">${n}×</span>` : ''}
        </div>
        <div class="cust-phone">${esc(c.phone || 'No number')}</div>
        <div class="cust-facts">
          <span>${money.format(Number(c.spend || 0))} all up</span>
          <span>last ${esc(dateFmt.format(new Date(c.last_order)))}</span>
          <span>since ${esc(dateFmt.format(new Date(c.first_order)))}</span>
        </div>
      </button>`;
  }).join('');

  list.querySelectorAll('[data-cust]').forEach((b) =>
    b.addEventListener('click', () => openCustomer(b.dataset.cust, rows.find((r) => r.phone_key === b.dataset.cust))));
}

async function openCustomer(phoneKey, c) {
  const body = openSheet(c.name, `
    <div class="detail-grid">
      ${field('Phone', c.phone)}
      ${field('Orders', String(c.order_count))}
      ${field('Spent', money.format(Number(c.spend || 0)))}
      ${field('Average', money.format(Number(c.spend || 0) / Math.max(1, Number(c.order_count))))}
      ${field('First order', dateFmt.format(new Date(c.first_order)))}
      ${field('Last order', dateFmt.format(new Date(c.last_order)))}
    </div>
    <hr class="rule">
    <div class="block-label">Every order</div>
    <div id="cust-orders"><p class="empty-note">Loading…</p></div>
  `, { center: true });

  let rows = [];
  try { rows = await ordersForCustomer(phoneKey); }
  catch (err) { $('cust-orders').innerHTML = `<p class="empty-note">${esc(err.message)}</p>`; return; }

  const showMoney = me.role !== 'baker';
  $('cust-orders').innerHTML = rows.map((o) => `
    <div class="list-row">
      <span class="num">${esc(o.order_no)}</span>
      <span class="tag ${o.kind === 'custom' ? 'tag-custom' : 'tag-normal'}">${o.kind === 'custom' ? 'Custom' : 'Normal'}</span>
      <span class="grow">${esc([o.size, o.flavour].filter(Boolean).join(' · ') || '—')}</span>
      <span class="list-meta">${esc(dateFmt.format(new Date(o.created_at)))}</span>
      ${showMoney ? `<span class="num">${o.price ? money.format(o.price) : '—'}</span>` : ''}
    </div>`).join('');
  void body;
}

// ── Staff ───────────────────────────────────────────────────────────────────
//
// Read-only on purpose. Roles and store scoping are what RLS enforces, so they
// are changed in Supabase where the change is deliberate — an admin fat-
// fingering their own row here could lock the shop out of its own order book.

async function renderStaff() {
  const root = $('view-staff');
  root.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';

  const [profiles, events] = await Promise.all([listProfiles(), authTrail(200)]);
  peopleById = new Map(profiles.map((p) => [p.id, p]));

  const lastSeen = new Map();
  for (const e of events) if (!lastSeen.has(e.user_id)) lastSeen.set(e.user_id, e);

  const ROLE_ORDER = { admin: 0, baker: 1, staff: 2 };
  const people = [...profiles].sort((a, b) =>
    (ROLE_ORDER[a.role] - ROLE_ORDER[b.role]) || a.name.localeCompare(b.name));

  const storeText = (p) => {
    const mine = (p.stores || []).map((c) => storeLabel(c));
    return mine.length === STORES.length ? 'Both stores' : (mine.join(', ') || 'No store');
  };

  const seenText = (p) => {
    const e = lastSeen.get(p.id);
    if (!e) return 'Never signed in';
    return `${e.event === 'login' ? 'On since' : 'Left'} ${takenFmt.format(new Date(e.at))}`;
  };

  root.innerHTML = `
    <div class="panel">
      <div class="panel-title">People</div>
      <div class="panel-note">
        Roles and store scoping are enforced in the database, not here — change
        them in Supabase so the change is deliberate.
      </div>
      ${people.map((p) => `
        <div class="person">
          <span class="person-dot">${esc(p.name.slice(0, 1))}</span>
          <span class="person-lines">
            <span class="person-name">${esc(p.name)}</span>
            <span class="person-meta">${esc(p.role)} · ${esc(storeText(p))}</span>
          </span>
          <span class="person-when">${esc(seenText(p))}</span>
        </div>`).join('')}
    </div>

    <div class="panel">
      <div class="panel-title">Sign-in history</div>
      <div class="panel-note">The last ${events.length} sign-ins and sign-outs, newest first.</div>
      ${events.length ? events.map((e) => `
        <div class="list-row">
          <span class="grow">${esc(peopleById.get(e.user_id)?.name || 'Unknown')}</span>
          <span class="list-meta">${e.event === 'login' ? 'signed in' : 'signed out'}</span>
          <span class="num list-meta">${esc(dateTimeFmt.format(new Date(e.at)))}</span>
        </div>`).join('')
      : '<div class="list-row"><span class="grow list-meta">Nothing recorded yet.</span></div>'}
    </div>`;
}

// ── Export ──────────────────────────────────────────────────────────────────
//
// The point of logging any of this was to hand a bookkeeper real numbers.
// Windows are named months and the Australian financial year rather than a
// free-form range, so the file still means something a week later.

let exportKey = 'last-month';

async function renderExport() {
  const root = $('view-export');
  const ranges = exportRanges(new Date());
  const chosen = ranges.find((r) => r.key === exportKey) || ranges[0];

  root.innerHTML = `
    <div class="panel">
      <div class="panel-title">Orders for the bookkeeper</div>
      <div class="panel-note">
        One row per order, by the date it was taken. Includes cost, so treat the
        file the way you would treat the books.
      </div>
      <div class="range-pick">
        ${ranges.map((r) => `
          <button class="range-opt" data-range="${esc(r.key)}" aria-pressed="${r.key === exportKey}">
            <span class="range-tick">
              <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>
            </span>
            <span class="grow">
              <span class="range-opt-name">${esc(r.label)}</span><br>
              <span class="range-opt-note">${esc(r.note)} · ${esc(dayKeyLabel(r.fromKey))} – ${esc(dayKeyLabel(r.toKey))}</span>
            </span>
          </button>`).join('')}
      </div>
      <button class="btn btn-primary" id="export-go" style="margin-top:12px;">Download CSV</button>
      <p class="msg" id="export-msg" role="status" aria-live="polite"></p>
    </div>`;

  root.querySelectorAll('[data-range]').forEach((b) => b.addEventListener('click', () => {
    exportKey = b.dataset.range;
    renderExport();
  }));

  $('export-go').addEventListener('click', () => downloadOrders(chosen));
}

const CSV_COLUMNS = [
  ['Order',        (o) => o.order_no],
  ['Store',        (o) => storeLabel(o.store)],
  ['Taken',        (o) => csvDate(o.created_at)],
  ['Taken time',   (o) => timeFmt.format(new Date(o.created_at))],
  ['Pickup',       (o) => csvDate(o.due_at)],
  ['Status',       (o) => STATUS_LABEL[o.status] || o.status],
  ['Kind',         (o) => (o.kind === 'custom' ? 'Custom' : o.walk_in ? 'Normal (in store)' : 'Normal (ordered)')],
  ['Customer',     (o) => o.customer_name],
  ['Phone',        (o) => o.customer_phone],
  ['Flavour',      (o) => o.flavour],
  ['Size',         (o) => o.size],
  ['Wording',      (o) => o.wording],
  ['Notes',        (o) => o.notes],
  ['Price',        (o) => (o.price == null ? '' : Number(o.price).toFixed(2))],
  ['Deposit',      (o) => Number(o.deposit || 0).toFixed(2)],
  ['Balance',      (o) => (o.price == null ? '' : (Number(o.price) - paidOn(o)).toFixed(2))],
  ['Cost',         (o) => (o.cost == null ? '' : Number(o.cost).toFixed(2))],
  ['Logged by',    (o) => peopleById.get(o.created_by)?.name || ''],
];

// ISO dates, not Australian ones: a spreadsheet reads 03/09 as March in half
// the world, and a bookkeeper's machine is not necessarily set to en-AU.
function csvDate(iso) {
  const p = sydneyParts(iso);
  return p.dayKey;
}

async function downloadOrders(range) {
  const btn = $('export-go');
  const msg = $('export-msg');
  btn.disabled = true; btn.textContent = 'Building…';
  msg.textContent = ''; msg.className = 'msg';

  try {
    if (!peopleById.size) peopleById = new Map((await listProfiles()).map((p) => [p.id, p]));

    const rows = await ordersBetween(
      sydneyDateTimeToISO(range.fromKey, 0, 0),
      sydneyDateTimeToISO(range.toKey, 23, 59),
    );

    if (!rows.length) {
      msg.textContent = `No orders were taken in ${range.label}.`;
      msg.className = 'msg msg-error';
      return;
    }

    const csv = toCsv(CSV_COLUMNS.map((c) => c[0]), rows.map((o) => CSV_COLUMNS.map((c) => c[1](o))));
    // The BOM is what makes Excel open a UTF-8 file without mangling the ’ and
    // the — that customers put in cake wording.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numnums-orders-${range.fromKey}-to-${range.toKey}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);

    msg.textContent = `${rows.length} order${rows.length === 1 ? '' : 's'} downloaded.`;
    msg.className = 'msg msg-ok';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'msg msg-error';
  } finally {
    btn.disabled = false; btn.textContent = 'Download CSV';
  }
}

/**
 * A warning row you can act on.
 *
 * These panels used to name the problem and stop there — an order number, and
 * a trip to the log to search for it. The whole point of flagging a gap is
 * closing it, so each row opens its order.
 */
const fixRow = (o, note) => `
  <button class="fix-row" data-order="${o.id}">
    <span class="num fix-no">${esc(o.order_no)}</span>
    <span class="grow fix-who">${esc(o.customer_name)}</span>
    <span class="fix-note">${esc(note)}</span>
    <svg class="fix-go" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
  </button>`;

// ── What sells ──────────────────────────────────────────────────────────────

const MIX_SORTS = [
  { key: 'count',   label: 'By cakes' },
  { key: 'revenue', label: 'By takings' },
  { key: 'margin',  label: 'By margin' },
];

let mixSort = 'count';

/** One flavour or size, with the measure being ranked on carrying the bar. */
function mixBlock(title, rows) {
  const measure = (r) => ({ count: r.count, revenue: r.revenue, margin: r.marginTotal ?? 0 }[mixSort]);
  const best = Math.max(1, ...rows.map(measure));

  return `<div class="mix-head">${esc(title)}</div>` + rows.slice(0, 6).map((r) => `
    <div class="mix-row">
      <span class="mix-name">${esc(r.k)}</span>
      <span class="mix-bar"><span class="meter"><span class="meter-fill"
        style="width:${Math.max(0, (measure(r) / best) * 100).toFixed(0)}%"></span></span></span>
      <span class="mix-nums">
        <span class="mix-lead">${mixSort === 'count' ? `${r.count}×`
          : mixSort === 'revenue' ? money.format(r.revenue)
          : (r.marginTotal == null ? '—' : money.format(r.marginTotal))}</span>
        <span class="mix-sub${r.marginPct != null && !r.marginTrusted ? ' is-thin' : ''}">${
          mixSort === 'count' ? `${money.format(r.revenue)}`
          : mixSort === 'revenue' ? `${r.count} cake${r.count === 1 ? '' : 's'} · avg ${money.format(r.avgPrice)}`
          : (r.marginPct == null
              ? 'no costs recorded'
              : `${r.marginPct.toFixed(0)}%${r.marginTrusted ? '' : ` · only ${r.costedCount} of ${r.count} costed`}`)}</span>
      </span>
    </div>`).join('');
}

// ── Customer leaderboard ────────────────────────────────────────────────────

const BOARDS = [
  { key: 'spend',  label: 'Most spent',   note: 'Total across every cake they have bought.' },
  { key: 'orders', label: 'Most cakes',   note: 'How many times they have come back.' },
  { key: 'avg',    label: 'Biggest average', note: 'Average spend per cake, for anyone with more than one order — one big cake does not make a regular.' },
  { key: 'lapsed', label: 'Gone quiet',   note: 'Regulars who have not ordered in 45 days or more. The only board that is a to-do list.' },
];

let boardKey = 'spend';

function paintBoard(board) {
  const meta = BOARDS.find((b) => b.key === boardKey);
  $('board-note').textContent = meta.note;
  $('board-tabs').querySelectorAll('[data-board]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.board === boardKey)));

  const rows = board[boardKey];
  if (!rows.length) {
    $('board-rows').innerHTML = `<div class="list-row"><span class="grow list-meta">${
      boardKey === 'lapsed'
        ? 'Nobody has gone quiet — every regular has ordered inside the last 45 days.'
        : 'Not enough orders yet.'}</span></div>`;
    return;
  }

  const best = Math.max(...rows.map((c) => metricOf(c)));
  $('board-rows').innerHTML = rows.map((c, i) => `
    <div class="lb-row">
      <span class="lb-rank${i < 3 ? ' is-top' : ''}">${i + 1}</span>
      <span class="lb-lines">
        <span class="lb-name">${esc(c.name)}</span>
        <span class="lb-sub">${esc(subOf(c))}</span>
      </span>
      <span class="lb-right">
        <span class="lb-val">${esc(valueOf(c))}</span>
        <span class="meter"><span class="meter-fill" style="width:${((metricOf(c) / best) * 100).toFixed(1)}%"></span></span>
      </span>
    </div>`).join('');
}

const metricOf = (c) => ({ spend: c.spend, orders: c.orders, avg: c.avg, lapsed: c.daysSince }[boardKey]);
const valueOf = (c) => ({
  spend: money.format(c.spend),
  orders: `${c.orders}×`,
  avg: money.format(c.avg),
  lapsed: `${c.daysSince} days`,
}[boardKey]);
const subOf = (c) => ({
  spend: `${c.orders} cake${c.orders === 1 ? '' : 's'} · ${money.format(c.avg)} average`,
  orders: `${money.format(c.spend)} all up · last ${dayKeyLabel(c.lastKey)}`,
  avg: `${c.orders} cakes · ${money.format(c.spend)} all up`,
  lapsed: `${c.orders} cakes · ${money.format(c.spend)} · last ${dayKeyLabel(c.lastKey)}`,
}[boardKey]);

// ── Charts ──────────────────────────────────────────────────────────────────
//
// Hand-rolled inline SVG rather than a library: the ops CSP allows one CDN and
// a charting bundle would be the heaviest thing on a page staff open on a phone
// over shop wifi, for two charts.
//
// Series colours are the brand's own rose-deep and a lighter crust gold. That
// pair was picked by running the palette through a CVD check — the obvious
// rose/sage pairing came out at ΔE 5.7 under deuteranopia, which is two bars
// nobody with red-green colour blindness could tell apart.
const SERIES = ['#A03D5E', '#C08A2E'];
const AXIS_INK = 'rgba(139,106,90,.85)';
const GRID = '#E4D3C4';

const niceCeil = (v) => {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / mag) * mag;
};

/** A column whose top corners are rounded and whose baseline stays square. */
function roundedTop(x, y, w, h, r, fill) {
  const rr = Math.min(r, w / 2, h);
  return `<path d="M${x.toFixed(1)},${(y + h).toFixed(1)}V${(y + rr).toFixed(1)}`
    + `a${rr},${rr} 0 0 1 ${rr},${-rr}h${(w - rr * 2).toFixed(1)}`
    + `a${rr},${rr} 0 0 1 ${rr},${rr}V${(y + h).toFixed(1)}Z" fill="${fill}"/>`;
}

const shortMoney = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `$${Math.round(v)}`);

/**
 * Takings per day as an area + line, with a marker on the best day and on today.
 * Points are evenly spaced because every day is present — see dailyTakings.
 */
function takingsChart(rows) {
  const W = 320, H = 132, padL = 34, padR = 8, padT = 10, padB = 18;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const max = niceCeil(Math.max(1, ...rows.map((r) => r.revenue)));
  const x = (i) => padL + (rows.length === 1 ? plotW / 2 : (i / (rows.length - 1)) * plotW);
  const y = (v) => padT + plotH - (v / max) * plotH;

  const line = rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r.revenue).toFixed(1)}`).join('');
  const area = `${line}L${x(rows.length - 1).toFixed(1)},${padT + plotH}L${padL},${padT + plotH}Z`;

  const bestIdx = rows.reduce((b, r, i) => (r.revenue > rows[b].revenue ? i : b), 0);
  const marks = [...new Set([bestIdx, rows.length - 1])].filter((i) => rows[i].revenue > 0);

  const ticks = [0, max / 2, max];
  const label = (k) => dayKeyLabel(k, { day: 'numeric', month: 'short' });

  return `
    <div class="chart" role="img"
         aria-label="Takings per day for the last ${rows.length} days. Highest ${money.format(rows[bestIdx].revenue)} on ${esc(label(rows[bestIdx].dayKey))}.">
      <svg viewBox="0 0 ${W} ${H}" class="chart-svg">
        ${ticks.map((t) => `
          <line x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" stroke="${GRID}" stroke-width="1"/>
          <text x="${padL - 6}" y="${(y(t) + 3.5).toFixed(1)}" class="ax" text-anchor="end">${esc(shortMoney(t))}</text>`).join('')}
        <path d="${area}" fill="${SERIES[0]}" fill-opacity=".1"/>
        <path d="${line}" fill="none" stroke="${SERIES[0]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${marks.map((i) => `
          <circle cx="${x(i).toFixed(1)}" cy="${y(rows[i].revenue).toFixed(1)}" r="4"
                  fill="${SERIES[0]}" stroke="var(--cream)" stroke-width="2"/>`).join('')}
        <text x="${padL}" y="${H - 5}" class="ax" text-anchor="start">${esc(label(rows[0].dayKey))}</text>
        <text x="${W - padR}" y="${H - 5}" class="ax" text-anchor="end">${esc(label(rows[rows.length - 1].dayKey))}</text>
      </svg>
      <div class="chart-peak">Best day ${money.format(rows[bestIdx].revenue)} · ${esc(label(rows[bestIdx].dayKey))}</div>
    </div>`;
}

/** Weekly takings as columns stacked by store, newest at the right. */
function weeklyStoreChart(rows, stores) {
  const W = 320, H = 138, padL = 34, padR = 6, padT = 10, padB = 20;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const max = niceCeil(Math.max(1, ...rows.map((r) => r.total)));
  const band = plotW / rows.length;
  const bw = Math.min(24, band - 7);            // capped, and the leftover is air
  const y = (v) => padT + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];

  return `
    <div class="chart" role="img"
         aria-label="Weekly takings for the last ${rows.length} weeks, split by store.">
      <svg viewBox="0 0 ${W} ${H}" class="chart-svg">
        ${ticks.map((t) => `
          <line x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" stroke="${GRID}" stroke-width="1"/>
          <text x="${padL - 6}" y="${(y(t) + 3.5).toFixed(1)}" class="ax" text-anchor="end">${esc(shortMoney(t))}</text>`).join('')}
        ${rows.map((r, i) => {
          const cx = padL + band * i + (band - bw) / 2;
          const present = stores.map((st, si) => ({ si, v: r.byStore[st.code] || 0 })).filter((x) => x.v > 0);
          let cursor = padT + plotH;
          // Bottom-up, so the 2px surface gap falls between segments. Only the
          // last one drawn is the column's data-end and gets the rounded cap.
          return present.map(({ si, v }, n) => {
            const h = Math.max(1.5, (v / max) * plotH);
            const top = cursor - h;
            const cap = n === present.length - 1;
            cursor = top - 2;
            return cap ? roundedTop(cx, top, bw, h, 4, SERIES[si])
              : `<rect x="${cx.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${SERIES[si]}"/>`;
          }).join('');
        }).join('')}
        ${rows.map((r, i) => `
          <text x="${(padL + band * i + band / 2).toFixed(1)}" y="${H - 6}" class="ax" text-anchor="middle"
            >${i % 2 === 0 || rows.length <= 5 ? esc(r.key.slice(8)) + '/' + esc(r.key.slice(5, 7)) : ''}</text>`).join('')}
      </svg>
      <div class="legend">
        ${stores.map((st, i) => `
          <span class="legend-key"><span class="legend-dot" style="background:${SERIES[i]}"></span>${esc(st.label)}</span>`).join('')}
      </div>
    </div>`;
}

/** The numbers behind a chart, because a picture is not an accessible record. */
const chartTable = (title, head, rows) => `
  <details class="sub chart-table">
    <summary class="collapse-head">
      <span class="grow list-meta">${esc(title)}</span>
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
    </summary>
    <div>
      ${rows.map((r) => `
        <div class="list-row">
          <span class="grow">${esc(r[0])}</span>
          ${r.slice(1).map((c) => `<span class="num">${esc(c)}</span>`).join('')}
        </div>`).join('')}
    </div>
  </details>`;

// ── Analytics ───────────────────────────────────────────────────────────────
const delta = (now, before) => {
  if (!before) return { cls: 'flat', text: before === 0 && now > 0 ? 'first week' : '—' };
  const pct = ((now - before) / before) * 100;
  return {
    cls: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat',
    text: `${pct > 0 ? '▲' : pct < 0 ? '▼' : '·'} ${Math.abs(pct).toFixed(0)}% vs last week`,
  };
};

/**
 * One fetch behind three pages.
 *
 * Finance, Customers and Data are three views of the same 63 days, and every
 * tap between them was re-running five round trips — including the whole
 * customer table — for bytes the page already had. Held until something is
 * written (see writeStamp) or the data goes stale, whichever comes first.
 */
let analyticsCache = null;
const ANALYTICS_TTL = 120000;

const cacheAge = () => (analyticsCache ? Date.now() - analyticsCache.at : 0);
const cacheFresh = () =>
  Boolean(analyticsCache) && !analyticsCache.expired
  && analyticsCache.stamp === writeStamp.v && cacheAge() < ANALYTICS_TTL;

async function analyticsData({ force = false } = {}) {
  if (!force && cacheFresh()) return analyticsCache.data;

  const held = analyticsCache && { at: analyticsCache.at, rows: analyticsCache.data };
  return orFallback(async () => {
    const since = new Date(Date.now() - 63 * 86400000).toISOString();
    const [all, profiles, events, customerRows] = await Promise.all([
      // includeOpen keeps money still owed on old orders visible no matter how
      // long ago it was ordered — that debt is the whole point of tracking it.
      listOrders({ since, withCosts: true, includeOpen: true }),
      listProfiles(),
      recentAuthEvents(40),
      // Over every order ever, not the 63-day window the charts use.
      allCustomers().catch(() => []),
    ]);
    analyticsCache = { at: Date.now(), stamp: writeStamp.v, data: { all, profiles, events, customerRows } };
    return analyticsCache.data;
  }, held);
}

/** "just now" / "4 min ago" — enough to know whether to hit Refresh. */
function agoText(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

async function renderAnalytics({ force = false } = {}) {
  const root = $('view-analytics');
  if (force || !cacheFresh()) root.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';

  const { all, profiles, events, customerRows } = await analyticsData({ force });
  peopleById = new Map(profiles.map((p) => [p.id, p]));
  orders = all;

  const now = new Date();
  const todayKey = sydneyParts(now).dayKey;

  // Sales windows key off when the order was TAKEN. Bucketing them by pickup
  // date meant a cake sold today but collected next week counted as zero this
  // week — which is why a freshly logged order showed "0 orders".
  const sold7  = soldWithin(all, 7, now);
  const sold30 = soldWithin(all, 30, now);
  const soldToday = soldWithin(all, 1, now);
  const w = salesByWeek(all, now);

  const s7 = summarise(sold7);
  const sToday = summarise(soldToday);
  const dRev = delta(w.thisWeek.revenue, w.lastWeek.revenue);
  const dCount = delta(w.thisWeek.count, w.lastWeek.count);

  // Operational, not financial: these legitimately belong to the pickup date.
  const dueToday = all.filter((o) => sydneyParts(o.due_at).dayKey === todayKey);
  const sDueToday = summarise(dueToday);

  const open = all.filter((o) => !['picked_up', 'cancelled'].includes(o.status));
  const owingRows = open
    .map((o) => ({ o, owing: Number(o.price || 0) - paidOn(o) }))
    .filter((r) => r.owing > 0)
    .sort((a, b) => new Date(a.o.due_at) - new Date(b.o.due_at));
  const owingTotal = owingRows.reduce((t, r) => t + r.owing, 0);

  const noPrice = missingPrice(sold30);
  const noPhone = missingPhone(sold30);
  const lead = leadTimes(sold30);
  const weekdays = byWeekday(all.filter((o) => {
    const d = daysBetween(sydneyParts(o.due_at).dayKey, todayKey);
    return d >= 0 && d < 56;          // pickups that have already happened
  }));

  const daily = dailyTakings(all, 30, now);
  const weeks = weeklyByStore(all, STORES.map((st) => st.code), 8, now);
  const board = customerLeaderboard(customerRows, now);
  const ahead = forwardBook(all, 7, now);
  const stale = staleOpen(all, now);
  const norm = weekdayNorm(all, 6, now);

  const hours = busiestHours(all.filter((o) => {
    const d = daysBetween(sydneyParts(o.due_at).dayKey, todayKey);
    return d >= 0 && d < 30;             // pickups that have actually happened
  }));
  const peakHour = hours.indexOf(Math.max(...hours));
  const hourLabel = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;

  // 30 days, not 7: a week of one shop's trading is noise, and this panel is
  // the one that has to answer whether a store is worth keeping open.
  const stores = storeBreakdown(sold30, STORES.map((st) => st.code));

  // What sells: flavour and size mix over the last 30 days of sales.
  const flavourMix = productMix(sold30, 'flavour');
  const sizeMix = productMix(sold30, 'size');

  const walkIns = sold30.filter((o) => o.walk_in && o.status !== 'cancelled');
  const aheadOrders = sold30.filter((o) => !o.walk_in && o.status !== 'cancelled');

  // Who logged what — collapsed, because it is a reference, not a headline.
  const byStaff = new Map();
  for (const o of sold30) {
    const id = o.created_by;
    const row = byStaff.get(id) || { id, count: 0, revenue: 0, orders: [] };
    row.count += 1;
    row.revenue += Number(o.price || 0);
    row.orders.push(o);
    byStaff.set(id, row);
  }
  const staffRows = [...byStaff.values()].sort((a, b) => b.count - a.count);

  const bar = (v, max, h = 76) => Math.round((v / Math.max(1, max)) * h);

  // Three pages off one fetch. Splitting the query per page would triple the
  // round trips for numbers that all come out of the same 63 days of orders.
  const PAGES = {
    finance: `
    <div class="stat-grid">
      <div class="stat">
        <div class="stat-k">Sold this week</div>
        <div class="stat-v">${money.format(w.thisWeek.revenue)}</div>
        <div class="stat-delta ${dRev.cls}">${dRev.text}</div>
      </div>
      <div class="stat">
        <div class="stat-k">Orders this week</div>
        <div class="stat-v">${w.thisWeek.count}</div>
        <div class="stat-delta ${dCount.cls}">${dCount.text}</div>
      </div>
      <div class="stat">
        <div class="stat-k">Avg order</div>
        <div class="stat-v">${money.format(w.thisWeek.avgOrder)}</div>
        <div class="stat-delta flat">last 7 days ${money.format(s7.avgOrder)}</div>
      </div>
      <div class="stat">
        <div class="stat-k">Taken today</div>
        <div class="stat-v">${money.format(sToday.revenue)}</div>
        <div class="stat-delta flat">${sToday.count} order${sToday.count === 1 ? '' : 's'}</div>
      </div>
    </div>

    ${stale.length ? `
      <div class="panel panel-warn">
        <div class="panel-title">${stale.length} order${stale.length === 1 ? '' : 's'} past pickup and still open</div>
        <div class="panel-note">
          Either these went out and nobody moved the status — in which case the
          takings below are short and the customer still reads as owing — or they
          were missed. Tap one to close it off.
        </div>
        ${stale.slice(0, 8).map((o) => fixRow(o, `${o.daysLate} day${o.daysLate === 1 ? '' : 's'} late`)).join('')}
        ${stale.length > 8 ? `<p class="fix-more">and ${stale.length - 8} more</p>` : ''}
      </div>` : ''}

    <div class="panel">
      <div class="panel-title">The week ahead</div>
      <div class="panel-note">${ahead.count
        ? `${ahead.count} cake${ahead.count === 1 ? '' : 's'} booked${ahead.custom ? `, ${ahead.custom} of them custom` : ''} — ${money.format(ahead.value)} on the book, ${money.format(ahead.owing)} of it still to collect.`
        : 'Nothing booked for the next seven days.'}</div>
      ${ahead.rows.map((r, i) => {
        const usual = norm[weekdayIndex(`${r.dayKey}T03:00:00Z`)];
        // A count only means something against what that weekday usually holds.
        // The baseline is an average, so it is routinely fractional — demanding
        // usual >= 1 let a Monday running seven times its norm slip through
        // because that norm was 0.83. A weekday with no history at all still
        // counts: three cakes on a day that normally has none is the same news.
        const heavy = r.count >= 3 && (usual === 0 || r.count >= usual * 1.6);
        return `
        <div class="ahead-row${r.count ? '' : ' is-empty'}">
          <span class="ahead-day">
            <span class="ahead-name">${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : esc(dayKeyLabel(r.dayKey, { weekday: 'long' }))}</span>
            <span class="ahead-date">${esc(dayKeyLabel(r.dayKey, { day: 'numeric', month: 'short' }))}</span>
          </span>
          <span class="ahead-bar"><span class="meter"><span class="meter-fill"
            style="width:${((r.count / Math.max(1, ahead.busiest.count)) * 100).toFixed(0)}%"></span></span></span>
          <span class="ahead-nums">
            <span class="ahead-count">${r.count || '—'}${heavy ? '<span class="ahead-heavy">heavy</span>' : ''}</span>
            <span class="ahead-money">${r.count ? money.format(r.value) : ''}</span>
          </span>
        </div>`;
      }).join('')}
      ${ahead.unpriced ? `<p class="ahead-warn">${ahead.unpriced} of these ${ahead.unpriced === 1 ? 'has' : 'have'} no price yet, so the totals above are understated.</p>` : ''}
    </div>

    <div class="panel">
      <div class="panel-title">Takings, last 30 days</div>
      <div class="panel-note">Every day the shop took money, by the date the order was written.</div>
      ${takingsChart(daily)}
      ${chartTable('Show the daily numbers', null,
        daily.filter((d) => d.count).reverse().map((d) => [
          dayKeyLabel(d.dayKey), `${d.count} order${d.count === 1 ? '' : 's'}`, money.format(d.revenue)]))}
    </div>

    <div class="panel">
      <div class="panel-title">Weekly takings by store</div>
      <div class="panel-note">Monday weeks, by the date the order was taken. Stacked, so the column height is the whole week.</div>
      ${weeklyStoreChart(weeks, STORES)}
      ${chartTable('Show the weekly numbers', null,
        [...weeks].reverse().map((wk) => [
          `Week of ${dayKeyLabel(wk.key)}`,
          ...STORES.map((st) => money.format(wk.byStore[st.code] || 0)),
          money.format(wk.total)]))}
    </div>

    <div class="panel">
      <div class="panel-title">Margin, last 7 days</div>
      <div class="panel-note">
        ${s7.costedCount
          ? `Across the ${s7.costedCount} of ${s7.count} orders with a cost recorded. Rent, wages and power are not included.`
          : 'No costs recorded yet — add a cost on an order to see margin here.'}
      </div>
      ${s7.margin != null ? `
        <div class="list-row"><span class="grow">Revenue</span><span class="num">${money.format(s7.revenue)}</span></div>
        <div class="list-row"><span class="grow">Cost recorded</span><span class="num">${money.format(s7.cost)}</span></div>
        <div class="list-row"><span class="grow"><strong>Gross margin</strong></span>
          <span class="num"><strong>${money.format(s7.margin)}</strong> · ${s7.marginPct.toFixed(0)}%</span></div>` : ''}
    </div>

    <div class="panel">
      <div class="panel-title">Still to collect</div>
      <div class="panel-note">${owingRows.length
        ? `${money.format(owingTotal)} across ${owingRows.length} order${owingRows.length === 1 ? '' : 's'} not yet handed over.`
        : 'Nothing outstanding.'}</div>
      ${owingRows.slice(0, 8).map((r) => `
        <div class="list-row">
          <span class="num">${esc(r.o.order_no)}</span>
          <span class="grow">${esc(r.o.customer_name)}</span>
          <span class="list-meta">${esc(dateFmt.format(new Date(r.o.due_at)))}</span>
          <span class="num owing">${money.format(r.owing)}</span>
        </div>`).join('')}
    </div>

    <div class="panel">
      <div class="panel-title">How people buy, last 30 days</div>
      <div class="panel-note">Walk-ins are cakes bought off the counter; ordered ahead are booked in advance.</div>
      <div class="list-row"><span class="grow">Bought in store</span>
        <span class="list-meta">${walkIns.length} cake${walkIns.length === 1 ? '' : 's'}</span>
        <span class="num">${money.format(summarise(walkIns).revenue)}</span></div>
      <div class="list-row"><span class="grow">Ordered ahead</span>
        <span class="list-meta">${aheadOrders.length} cake${aheadOrders.length === 1 ? '' : 's'}</span>
        <span class="num">${money.format(summarise(aheadOrders).revenue)}</span></div>
    </div>

    ${noPrice.length ? `
      <div class="panel panel-warn">
        <div class="panel-title">${noPrice.length} order${noPrice.length === 1 ? '' : 's'} with no price</div>
        <div class="panel-note">From the last 30 days of sales; every figure covering that period is understated by whatever these were worth. Tap one to add its price.</div>
        ${noPrice.slice(0, 8).map((o) => fixRow(o, dateFmt.format(new Date(o.created_at)))).join('')}
        ${noPrice.length > 8 ? `<p class="fix-more">and ${noPrice.length - 8} more</p>` : ''}
      </div>` : ''}
    `,
    customers: `
    <div class="panel">
      <div class="panel-title">Leaderboard</div>
      <div class="panel-note">
        Everyone with a phone number on their docket, over every order on record.
      </div>
      <div class="sortbar" id="board-tabs" role="group" aria-label="Leaderboard metric">
        ${BOARDS.map((t) => `
          <button data-board="${t.key}" aria-pressed="${t.key === boardKey}">${esc(t.label)}</button>`).join('')}
      </div>
      <p class="panel-note" id="board-note" style="margin-bottom:10px;"></p>
      <div id="board-rows"></div>
    </div>

    <div class="panel">
      <div class="panel-title">Customers</div>
      <div class="panel-note">
        Matched on phone number, over every order on record. Repeat customer rate is
        the share who have ordered more than once — the clearest read on whether the
        cakes bring people back, and it needs no extra data entry.
      </div>
      <div class="rcr">
        <div class="rcr-num">${board.rate.toFixed(0)}<span class="rcr-pct">%</span></div>
        <div class="rcr-side">
          <div class="rcr-label">Repeat customer rate</div>
          <div class="meter meter-wide"><span class="meter-fill" style="width:${Math.min(100, board.rate).toFixed(1)}%"></span></div>
          <div class="list-meta">${board.returningCount} of ${board.total} customers have come back</div>
        </div>
      </div>
      <div class="list-row"><span class="grow">Ordered once</span><span class="num">${board.newCount}</span></div>
      <div class="list-row"><span class="grow">Came back</span><span class="num">${board.returningCount}</span></div>

    </div>

    ${lead.count ? `
      <div class="panel">
        <div class="panel-title">How far ahead people order</div>
        <div class="panel-note">
          Last 30 days of ordered-ahead cakes. Half are booked
          ${lead.median === 0 ? 'the same day' : `${lead.median} day${lead.median === 1 ? '' : 's'} ahead`}
          or less; the longest was ${lead.longest} days. Walk-ins are excluded.
        </div>
        ${lead.bands.map((b) => `
          <div class="list-row">
            <span class="grow">${esc(b.label)}</span>
            <span class="meter"><span class="meter-fill" style="width:${bar(b.count, Math.max(1, ...lead.bands.map((x) => x.count)), 100)}%"></span></span>
            <span class="num">${b.count}</span>
          </div>`).join('')}
      </div>` : ''}

    ${noPhone.length ? `
      <div class="panel panel-warn">
        <div class="panel-title">${noPhone.length} order${noPhone.length === 1 ? '' : 's'} with no phone number</div>
        <div class="panel-note">From the last 30 days. These customers can never be matched to another order, so the repeat rate above reads lower than it really is. Tap one to add a number.</div>
        ${noPhone.slice(0, 8).map((o) => fixRow(o, dateFmt.format(new Date(o.created_at)))).join('')}
        ${noPhone.length > 8 ? `<p class="fix-more">and ${noPhone.length - 8} more</p>` : ''}
      </div>` : ''}
    `,
    data: `
    <div class="panel">
      <div class="panel-title">Today</div>
      <div class="panel-note">What is happening in the shop right now.</div>
      <div class="list-row"><span class="grow">Cakes due for pickup today</span><span class="num">${sDueToday.count}</span></div>
      <div class="list-row"><span class="grow">Orders taken today</span><span class="num">${sToday.count}</span></div>
      <div class="list-row"><span class="grow">Still to be baked</span><span class="num">${all.filter((o) => o.status === 'placed').length}</span></div>
    </div>

    <div class="panel">
      <div class="panel-title">By store, last 30 days</div>
      <div class="panel-note">
        Counted against the store that took the order. Margin is worked out from
        the orders that have a cost recorded, so it is only as good as how many
        of them do — that count is shown against each store.
      </div>
      ${stores.rows.map((r) => {
        const st = STORES.find((x) => x.code === r.code);
        return `
        <div class="store-row">
          <div class="store-head">
            <span class="store-name">${esc(st ? st.label : r.code)}</span>
            <span class="num store-rev">${money.format(r.revenue)}</span>
          </div>
          <div class="meter meter-wide"><span class="meter-fill" style="width:${r.share.toFixed(1)}%"></span></div>
          <div class="store-facts">
            <span>${r.count} order${r.count === 1 ? '' : 's'}</span>
            <span>avg ${money.format(r.avgOrder)}</span>
            <span>${r.share.toFixed(0)}% of takings</span>
          </div>
          <div class="store-margin${r.margin == null ? ' is-thin' : r.marginTrusted ? '' : ' is-thin'}">
            ${r.margin == null
              ? `<span>No costs recorded yet — add a cost on ${r.count ? 'these orders' : 'an order'} to see margin here.</span>`
              : `<span><strong>${money.format(r.margin)}</strong> gross margin · ${r.marginPct.toFixed(0)}%</span>
                 <span class="store-cover">${r.marginTrusted
                    ? `from ${r.costedCount} of ${r.count}`
                    : `only ${r.costedCount} of ${r.count} costed — treat as a hint`}</span>`}
          </div>
        </div>`;
      }).join('')}
      ${stores.total ? '' : '<div class="list-row"><span class="grow list-meta">No sales in the last 30 days.</span></div>'}
    </div>

    ${flavourMix.length ? `
      <div class="panel">
        <div class="panel-title">What sells, last 30 days</div>
        <div class="panel-note">
          Counting cakes says what is popular; it does not say what is worth
          making. Margin uses only the orders with a cost recorded.
        </div>
        <div class="sortbar" id="mix-tabs" role="group" aria-label="Rank products by">
          ${MIX_SORTS.map((t) => `
            <button data-mix="${t.key}" aria-pressed="${t.key === mixSort}">${esc(t.label)}</button>`).join('')}
        </div>
        <div id="mix-rows"></div>
      </div>` : ''}

    <div class="panel">
      <div class="panel-title">Busiest days</div>
      <div class="panel-note">Pickups over the last 8 weeks. This is what to roster against.</div>
      ${weekdays.map((d) => `
        <div class="list-row">
          <span class="grow">${esc(d.label)}</span>
          <span class="meter"><span class="meter-fill" style="width:${bar(d.count, Math.max(1, ...weekdays.map((x) => x.count)), 100)}%"></span></span>
          <span class="list-meta">${d.count}</span>
          <span class="num">${money.format(d.revenue)}</span>
        </div>`).join('')}
    </div>

    <div class="panel">
      <div class="panel-title">Busiest pickup times</div>
      <div class="panel-note">Pickups over the last 30 days.${hours.some(Boolean) ? ` Peak around ${hourLabel(peakHour)}.` : ''}</div>
      <div class="bars">
        ${hours.map((c, h) => (h >= 7 && h <= 20) ? `
          <div class="bar-col">
            <div class="bar ${c ? '' : 'is-quiet'}" style="height:${bar(c, Math.max(...hours))}px"
                 title="${hourLabel(h)} · ${c}"></div>
            <div class="bar-label">${[8, 12, 16, 20].includes(h) ? hourLabel(h) : ''}</div>
          </div>` : '').join('')}
      </div>
    </div>

    <details class="panel collapse">
      <summary class="collapse-head">
        <span class="panel-title">Who logged what</span>
        <span class="list-meta">${staffRows.length} staff · last 30 days</span>
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </summary>
      <div class="collapse-body">
        ${staffRows.map((r) => `
          <details class="sub">
            <summary class="collapse-head">
              <span class="grow">${esc(peopleById.get(r.id)?.name || 'Unknown')}</span>
              <span class="list-meta">${r.count} order${r.count === 1 ? '' : 's'}</span>
              <span class="num">${money.format(r.revenue)}</span>
              <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
            </summary>
            ${r.orders.slice(0, 25).map((o) => `
              <div class="list-row">
                <span class="num">${esc(o.order_no)}</span>
                <span class="grow">${esc(o.customer_name)}</span>
                <span class="list-meta">${esc(takenFmt.format(new Date(o.created_at)))}</span>
                <span class="num">${o.price ? money.format(o.price) : '—'}</span>
              </div>`).join('')}
          </details>`).join('')}
      </div>
    </details>

    <details class="panel collapse">
      <summary class="collapse-head">
        <span class="panel-title">Who's been on</span>
        <span class="list-meta">recent sign-ins</span>
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </summary>
      <div class="collapse-body">
        ${events.length ? events.map((e) => `
          <div class="list-row">
            <span class="grow">${esc(peopleById.get(e.user_id)?.name || 'Unknown')}</span>
            <span class="list-meta">${e.event === 'login' ? 'signed in' : 'signed out'}</span>
            <span class="num list-meta">${esc(dateTimeFmt.format(new Date(e.at)))}</span>
          </div>`).join('') : '<div class="list-row"><span class="grow list-meta">Nothing recorded yet.</span></div>'}
      </div>
    </details>
    `,
  };

  // A cache the reader cannot see is a cache they cannot trust, so the page
  // says how old it is and offers the way out.
  const freshRow = `
    <div class="freshbar">
      <span id="fresh-when">Updated ${esc(agoText(cacheAge()))}</span>
      <button class="freshbar-btn" id="fresh-go">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6"/>
        </svg>
        Refresh
      </button>
    </div>`;

  root.innerHTML = freshRow + (PAGES[analyticsPage] || PAGES.finance);

  $('fresh-go').addEventListener('click', async () => {
    const btn = $('fresh-go');
    btn.disabled = true;
    $('fresh-when').textContent = 'Refreshing…';
    await renderAnalytics({ force: true });
  });

  // The rows are buttons carrying an order id, so the log's own handler works.
  wireDockets(root);

  if (analyticsPage === 'data' && flavourMix.length) {
    const paintMix = () => {
      $('mix-tabs').querySelectorAll('[data-mix]')
        .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mix === mixSort)));
      $('mix-rows').innerHTML =
        mixBlock('Flavour', sortMix(flavourMix, mixSort)) + mixBlock('Size', sortMix(sizeMix, mixSort));
    };
    $('mix-tabs').querySelectorAll('[data-mix]').forEach((b) =>
      b.addEventListener('click', () => { mixSort = b.dataset.mix; paintMix(); }));
    paintMix();
  }

  if (analyticsPage === 'customers') {
    $('board-tabs').querySelectorAll('[data-board]').forEach((b) =>
      b.addEventListener('click', () => { boardKey = b.dataset.board; paintBoard(board); }));
    paintBoard(board);
  }
}

// ── Keep a waking phone current ─────────────────────────────────────────────
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !me || $('sheet-root').innerHTML) return;
  expireCaches();
  render();
});

// Restore an existing session so it is one sign-in per phone, not per shift.
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    try { await start(); }
    catch { $('login').classList.remove('hidden'); }
  }
  if (!me) {
    peopleById = new Map();
    $('login').classList.remove('hidden');
  }
})();
