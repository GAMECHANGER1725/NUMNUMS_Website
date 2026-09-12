// Ops app: view routing, rendering and form handling.
//
// Lives in its own file rather than an inline <script> so the production CSP
// can keep script-src to 'self' plus the pinned CDN, with no 'unsafe-inline'.
// Inlining this would silently break only in production, where the CSP applies.

import {
  sb, PEOPLE, STORES, BUSINESS, storeLabel, STATUS_LABEL,
  signIn, signOut, currentProfile, listProfiles, isAuthError, refreshSession,
  listOrders, listToBake, createOrder, updateOrder, setStatus, setCost,
  findCustomerByPhone, searchCustomers, getCustomer,
  recentAuthEvents, orderEvents, uploadPhotos, removePhoto, orderPhotos, photoUrls, photoForPdf,
  invoiceUrl, deleteOrder, deletedOrders,
  listCustomers, allCustomers, ordersForCustomer, authTrail, ordersBetween, ordersWithPhotos,
  ordersDueBetween, searchOrdersRemote,
  writeStamp,
  listPrintJobs, listPrintFlags, listOpenOrders, createPrintJob, updatePrintJob, setPrintStatus, deletePrintJob,
} from './db.mjs';
import {
  sydneyParts, daysBetween, dayBucket, weekStartKey, summarise, weeklyStats,
  busiestHours, bakerSections, paidOn, netPrice, discountOn,
  monthGrid, shiftMonth, sydneyDateTimeToISO,
  dayLabel, soldWithin, salesByWeek, logSections, inStoreTally,
  missingPrice, searchOrders, byWeekday, leadTimes, missingPhone, WEEKDAYS, weekdayIndex, inDateRange,
  printSections, storeBreakdown, exportRanges, toCsv, productMix, sortMix, staleOpen, photoHealth, cancellationStats, pricingGaps,
  dailyTakings, takingsMetrics, weeklyByStore, customerLeaderboard, forwardBook, weekdayNorm,
} from './stats.mjs';
import { SIZES, FLAVOURS, basePrice, isPremium, cakeImage, TIERED, tierLabel, tierText, parseTiers, isTiered, toNinetyNine, PAV, pavSize }
  from './catalog.mjs';
import { receiptPdf, receiptName } from './receipt.mjs';
import { helpHtml, startTour, tourSeen, markTourSeen } from './help.mjs';

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
let bakeRange = null;    // the same filter over the baking queue, kept separately
let printKind = '3d';    // active tab on the print board
let printJobs = [];      // jobs for the active print view
let printsByOrder = new Map();   // order id → its print jobs, for card flags
let analyticsPage = 'finance';   // which analytics page the drawer last opened
let bakeStore = 'all';           // store filter on the baker's queue
let beforeHelp = null;           // the view the ? button was pressed from

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
  view = homeView();
  await render();

  // First sign-in for this person: walk them round the real buttons. Nobody
  // gets sat down with this app, so it has to introduce itself.
  if (!tourSeen(me.id)) runTour();
}

/** Where each role starts, and where the tour wants to be run from. */
const homeView = () => (me.role === 'baker' ? 'bake' : 'log');

/** Start a walkthrough. `tourAct` below is the app's half of it. */
async function runTour(key = 'intro') {
  closeDrawer();
  closeSheet();
  await startTour(key, {
    role: me.role,
    act: tourAct,
    onDone: (problem) => {
      markTourSeen(me.id);
      if (typeof problem === 'string') toast(problem, 'error');
    },
  });
}

/**
 * The app's half of a walkthrough: the navigation a step asks for, performed as
 * the reader advances onto it, so the step before it could spotlight the button
 * they would have pressed. Being teleported into the order form teaches nothing
 * about how to get there.
 *
 * Returns a sentence instead of true when the thing cannot be opened, and the
 * walk stops there saying why rather than collapsing to one step.
 */
async function tourAct(what) {
  if (what.startsWith('view:')) {
    const want = what.slice(5) === 'home' ? homeView() : what.slice(5);
    closeDrawer();
    if (view !== want) { view = want; buildTabs(); await render(); }
    return true;
  }
  if (what === 'drawer') { openDrawer(); return true; }
  if (what === 'new-order') { openNewOrder(); return true; }
  if (what === 'new-print') { await openNewPrintJob(); return true; }
  if (what === 'first-order') {
    if (!orders.length) return 'There are no orders on the book to open — this walkthrough needs one to point at.';
    await openOrder(richestOrder().id);
    return true;
  }
  if (what === 'first-print') {
    if (!printJobs.length) return 'Nothing is waiting on the print board — this walkthrough needs a job to point at.';
    await openPrintJob(printJobs[0].id);
    return true;
  }
  return true;
}

/**
 * Which order to teach on. A step whose target is not on screen is dropped, so
 * opening a bare normal cake costs the walkthrough its photo step and its print
 * warning — the two things hardest to explain in words. Prefer a cake that has
 * both, then one with photos, then whatever is first.
 */
const outstanding = (o) => (printsByOrder.get(o.id) || []).some((j) => j.status !== 'printed');
const richestOrder = () =>
  orders.find((o) => orderPhotos(o).length && outstanding(o))
  || orders.find((o) => orderPhotos(o).length)
  || orders[0];

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
  prints:    { label: 'Prints',    roles: ['admin', 'baker', 'staff'], icon: '<path d="M7 8V3h10v5M7 18H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v7H7z"/>' },
};

// A 2x2 grid, not another set of stacked lines: the Orders icon is already
// three horizontal rules and a hamburger beside it reads as the same thing.
const MORE_ICON = '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/>'
  + '<rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/>'
  + '<rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/>'
  + '<rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>';

function buildTabs() {
  const items = Object.entries(TABS)
    .filter(([, t]) => t.roles.includes(me.role))
    .map(([key, t]) => ({ key, label: t.label, icon: t.icon, current: key === view }));

  // Everything the drawer holds is a view in its own right, so the tab shows as
  // current whenever one of them is on screen — the same as the other four.
  if (menuGroups().length) {
    items.push({ key: 'more', label: 'More', icon: MORE_ICON, current: DRAWER_VIEWS.includes(view) });
  }

  $('tabbar').innerHTML = items.map((t) => `
      <button class="tab" data-tab="${t.key}" aria-current="${t.current ? 'page' : 'false'}">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
        <span>${t.label}</span>
      </button>`).join('');
  $('tabbar').querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => go(b.dataset.tab)));
}

function go(next) {
  if (next === 'new') { openNewOrder(); return; }
  if (next === 'more') { openDrawer(); return; }
  view = next;
  buildTabs();
  render();
}

// ── Render ──────────────────────────────────────────────────────────────────
async function render() {
  $('view-title').textContent = view === 'analytics'
    ? (ANALYTICS_TITLE[analyticsPage] || 'Analytics')
    : (VIEW_TITLE[view] || 'Orders');

  $('store-switch').classList.toggle('hidden',
    view !== 'log' || STORES.filter((s) => me.stores.includes(s.code)).length < 2);
  // The date filter serves both worklists; the search box is the order log's.
  $('logbar').classList.toggle('hidden', !RANGE_VIEWS.includes(view));
  $('logsearch-row').classList.toggle('hidden', view !== 'log');
  if (!RANGE_VIEWS.includes(view)) closeRange();
  if (RANGE_VIEWS.includes(view)) paintRangeLabel();

  for (const v of ['log', 'bake', 'prints', 'help', ...DRAWER_VIEWS]) $(`view-${v}`).classList.toggle('hidden', v !== view);
  $('help-btn').setAttribute('aria-pressed', String(view === 'help'));

  const PAINT = {
    log: renderLog, bake: renderBake, prints: renderPrints,
    analytics: renderAnalytics, directory: renderDirectory,
    staff: renderStaff, export: renderExport, help: renderHelp,
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
    renderViewError(view, err);
  } finally {
    clearTimeout(slow);
  }
  paintOfflineBar();
}

// A baker cannot act on "TypeError: Failed to fetch".
const offlineReason = () => (navigator.onLine === false
  ? 'This phone has no connection.'
  : 'Could not reach the order book — the shop internet may be down.');

/**
 * The reason, small and grey, under the retry button.
 *
 * It used to go only to console.warn, which nobody on a phone is ever going to
 * open — so every report of this screen arrived as "it says nothing loaded" and
 * could not be told apart from any other. One line of detail turns the next one
 * into evidence.
 */
function errorDetail(err) {
  const status = err?.status ?? err?.originalError?.status;
  const bits = [err?.code, status ? `HTTP ${status}` : null, err?.message]
    .filter(Boolean).map(String);
  const text = [...new Set(bits)].join(' · ');
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

/**
 * Set when a fetch failed because the sign-in has run out rather than because
 * the connection has. The two need opposite advice and opposite buttons: one
 * is worth retrying, the other never will be.
 */
let sessionLost = false;

function renderViewError(v, err) {
  const root = $(`view-${v}`);
  if (!root) return;
  const expired = sessionLost || isAuthError(err);

  root.innerHTML = expired
    ? `<div class="empty">
        <div class="empty-mark">Signed out</div>
        <p class="empty-note">This sign-in has run out — it happens after a phone
          has been left alone for a while.<br>Nothing has been lost; the orders are on
          the server.</p>
        <button class="btn btn-primary" data-signin>Sign in again</button>
      </div>`
    : `<div class="empty">
        <div class="empty-mark">Nothing loaded</div>
        <p class="empty-note">${esc(offlineReason())}<br>Nothing has been lost — the orders are on the server.</p>
        <button class="btn btn-primary" data-retry>Try again</button>
        ${err ? `<p class="empty-detail">${esc(errorDetail(err))}</p>` : ''}
      </div>`;

  root.querySelector('[data-retry]')?.addEventListener('click', () => render());
  // Signing out clears the dead token; without that the login form would hand
  // it straight back and land on this screen again.
  root.querySelector('[data-signin]')?.addEventListener('click', () => backToLogin());
}

/** Drop a dead session and show the login form, without a page reload. */
async function backToLogin() {
  sessionLost = false;
  try { await signOut(); } catch { /* the token is already dead; the UI still has to move */ }
  window.location.reload();
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
  : `<span class="tag tag-normal">${o.kind === 'pav' ? 'Pav' : 'Normal'}</span>`;

/** When the customer ordered. Falls back to the log time for rows written
 *  before the column existed, or by the older build still in production. */
const orderedAt = (o) => new Date(o.ordered_at || o.created_at);

/** Only worth showing both times when they are actually different. */
const loggedLater = (o) =>
  Boolean(o.ordered_at) && Math.abs(new Date(o.created_at) - new Date(o.ordered_at)) > 60000;

// `bakedDone` is the baker's board only. A baked cake there is finished work and
// should read as quiet; on the order log the same cake is still to be collected,
// so it keeps the urgency of its pickup day.
const spineFor = (o, now, bakedDone = false) => {
  if (['picked_up', 'cancelled'].includes(o.status)) return 'spine-done';
  if (bakedDone && o.status === 'baked') return 'spine-done';
  const d = daysBetween(sydneyParts(now).dayKey, sydneyParts(o.due_at).dayKey);
  if (d < 0) return 'spine-overdue';
  if (d === 0) return 'spine-today';
  if (d === 1) return 'spine-tomorrow';
  return 'spine-later';
};

function docketHtml(o, now, { showStore = false, bakedDone = false } = {}) {
  // The baker never sees money. The database already stops him changing it,
  // but that is no reason to put every customer's balance in front of him.
  const showMoney = me.role !== 'baker';
  const what = [o.size, o.flavour].filter(Boolean).join(' · ');
  const pay = showMoney ? payState(o) : null;
  return `
    <button class="docket ${spineFor(o, now, bakedDone)}" data-order="${o.id}">
      <div class="docket-head">
        <span class="docket-no">${esc(o.order_no)}</span>
        ${o.walk_in ? '<span class="tag tag-walkin">In store</span>' : ''}
        ${showStore ? `<span class="tag tag-store">${esc(storeLabel(o.store))}</span>` : ''}
        <span class="docket-when">${kindTag(o)}${timeFmt.format(new Date(o.due_at))}</span>
      </div>
      <div class="docket-body">
        ${thumbHtml(o)}
        <div class="docket-lines">
          <div class="docket-name">${esc(o.customer_name)}</div>
          <div class="docket-what">${esc(what || '—')}</div>
          <div class="docket-foot">
            <span class="status-dot st-${o.status}">${esc(STATUS_LABEL[o.status])}</span>
            ${showMoney && o.price ? (discountOn(o) > 0
              ? `<span><s class="was">${money.format(o.price)}</s> ${money.format(netPrice(o))}</span>`
              : `<span>${money.format(o.price)}</span>`) : ''}
            ${pay ? `<span class="tag ${pay.cls}">${esc(pay.label)}</span>` : ''}
            ${printFlagHtml(o.id)}
          </div>
          <div class="docket-taken">Ordered ${esc(takenFmt.format(orderedAt(o)))}${
            loggedLater(o) ? ` · Log time ${esc(takenFmt.format(new Date(o.created_at)))}` : ''}</div>
        </div>
      </div>
    </button>`;
}

/**
 * The picture on a card.
 *
 * A custom cake shows the customer's own reference photo. A normal cake never
 * has one — and what it is a picture *of* was never a mystery, it is the
 * flavour on the board — so it shows that instead of a grey disc. Deliberately
 * **not** for a custom cake: a stock Vanilla standing in for a design someone
 * drew is worse than no picture, because it looks like an answer.
 *
 * The stock file is local to the ops site (`img-src 'self'`) and carries no
 * `data-photo`, so it is untouched by the signing pass and never reaches
 * `orderPhotos` — it is decoration, not a design reference, and must not end up
 * on an invoice.
 */
function thumbHtml(o, cls = 'thumb') {
  const attr = cls ? ` class="${cls}"` : '';
  if (o.photo_path) return `<img${attr} data-photo="${esc(o.photo_path)}" alt="" loading="lazy">`;

  const stock = o.kind === 'normal' ? cakeImage(o.flavour) : null;
  if (stock) return `<img${attr} src="${esc(stock)}" alt="${esc(o.flavour)} cake" loading="lazy">`;

  return cls ? `<div class="${cls} thumb-empty" aria-hidden="true">◍</div>` : '◍';
}

/** Signed after paint, and all in one request — see photoUrls. */
async function hydrateThumbs(root) {
  const imgs = [...root.querySelectorAll('img[data-photo]')];
  if (!imgs.length) return;
  const urls = await photoUrls(imgs.map((i) => i.dataset.photo));
  for (const img of imgs) {
    const url = urls.get(img.dataset.photo);
    if (url) {
      img.src = url;
      // The detail sheet wraps each photo in a link so it can be opened full
      // size; everywhere else there is no link and this does nothing.
      const full = img.closest('a[data-full]');
      if (full) full.href = url;
    } else img.replaceWith(Object.assign(document.createElement('div'),
      { className: 'thumb thumb-empty', textContent: '◍' }));
  }
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
  lookupCache = null;
  // A flag, not `at = 0`: `at` is also how old the copy is, and zeroing it made
  // the "showing a held copy" banner think there was nothing held.
  for (const hit of logCache.values()) hit.expired = true;
  if (bakeCache) bakeCache.expired = true;
  if (analyticsCache) analyticsCache.expired = true;
}

/**
 * Run a fetch; on failure fall back to the copy already on screen.
 *
 * A lapsed sign-in is handled first and separately. It is not a network
 * problem: falling back to a held copy would leave someone reading yesterday's
 * queue behind a banner blaming the wifi, and every write they then tried would
 * fail. One silent refresh covers the ordinary case — a phone that slept
 * through the token expiry — and anything it cannot fix is surfaced as what it
 * is, a sign-in that has run out.
 */
async function orFallback(fetchFn, held) {
  try {
    const v = await fetchFn();
    staleSince = null;
    sessionLost = false;
    return v;
  } catch (err) {
    if (isAuthError(err)) {
      if (await refreshSession()) {
        try {
          const v = await fetchFn();
          staleSince = null;
          sessionLost = false;
          return v;
        } catch (again) {
          if (!isAuthError(again)) { if (held) { staleSince = held.at; return held.rows; } throw again; }
        }
      }
      sessionLost = true;
      throw err;
    }
    if (!held) throw err;
    staleSince = held.at;
    return held.rows;
  }
}

function logFresh(forStore) {
  const hit = logCache.get(forStore);
  return Boolean(hit) && !hit.expired && hit.stamp === writeStamp.v && Date.now() - hit.at < LOG_TTL;
}

// The worklist shows open orders plus the last 90 days of collected ones,
// rather than the store's entire history — every column of every order ever
// taken. `includeOpen` is what makes the window safe: nothing unfinished ages
// out of it, however old. Supabase keeps everything regardless; the window is
// only what the phone downloads, and search and date ranges still reach the
// whole book server-side. Paged, because 90 days will pass 1000 rows and
// PostgREST truncates at that without raising.
const LOG_WINDOW_DAYS = 90;

async function logData(forStore) {
  if (logFresh(forStore)) return logCache.get(forStore).rows;
  return orFallback(async () => {
    const since = new Date(Date.now() - LOG_WINDOW_DAYS * 86400000).toISOString();
    const [rows] = await Promise.all([
      listOrders({ store: forStore, since, includeOpen: true, complete: true, withCosts: me.role === 'admin' }),
      loadPrintFlags(),
    ]);
    logCache.set(forStore, { at: Date.now(), stamp: writeStamp.v, rows });
    return rows;
  }, logCache.get(forStore));
}

/**
 * Searching or picking dates is a lookup over the whole book, which is no
 * longer the same thing as what the worklist holds. Both go to the server.
 */
let lookupCache = null;

async function lookupData(forStore, query, range) {
  const key = `${forStore}|${query}|${range ? `${range.from}>${range.to}` : ''}`;
  if (lookupCache && lookupCache.key === key
      && lookupCache.stamp === writeStamp.v
      && Date.now() - lookupCache.at < LOG_TTL) return lookupCache.rows;

  const withCosts = me.role === 'admin';
  const rows = query
    ? await searchOrdersRemote({ term: query, store: forStore, withCosts })
    : await ordersDueBetween({
        store: forStore,
        fromISO: sydneyDateTimeToISO(range.from, 0, 0),
        toISO: sydneyDateTimeToISO(range.to, 23, 59),
        withCosts,
      });
  lookupCache = { key, at: Date.now(), stamp: writeStamp.v, rows };
  return rows;
}

async function renderLog() {
  const root = $('view-log');
  // Only flash "Loading…" when something is actually being fetched; on a
  // filter keystroke it would strobe the list on every letter.
  const lookup = Boolean(logQuery || logRange);
  if (!lookup && !logFresh(store)) {
    root.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';
  }
  orders = lookup ? await lookupData(store, logQuery, logRange) : await logData(store);

  const now = new Date();
  // A date range is a lookup, not the daily worklist, so it keeps every
  // collected order in the window instead of ageing them out after a week.
  // Searching or picking dates is a lookup, not the daily worklist, so both
  // keep every collected order instead of ageing them out after a week.
  // A lookup arrives already filtered by the server; the worklist does not.
  const rows = lookup ? orders : searchOrders(orders, logQuery);
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
      <div class="docket-grid">${rows.map((o) => docketHtml(o, now)).join('')}</div>`;
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

  // A date filter narrows the whole board, counts included: tabs reading the
  // untouched total beside a list showing four cakes is worse than no count.
  const inRange = (rows) => (bakeRange ? inDateRange(rows, bakeRange.from, bakeRange.to) : rows);
  const BAKE_TABS = [{ code: 'all', label: 'Both stores' },
    ...STORES.map((st) => ({ code: st.code, label: st.label }))];
  const waiting = (code) => inRange(queue.filter((o) =>
    o.status !== 'baked' && (code === 'all' || o.store === code))).length;
  const storeBar = `
    <div class="segmented" role="tablist" aria-label="Store">
      ${BAKE_TABS.map((t) => `
        <button class="segmented-btn" role="tab" data-bakestore="${t.code}"
                aria-selected="${t.code === bakeStore}">${esc(t.label)}${
          waiting(t.code) ? ` · ${waiting(t.code)}` : ''}</button>`).join('')}
    </div>`;

  const wireBar = () => root.querySelectorAll('[data-bakestore]').forEach((b) =>
    b.addEventListener('click', () => { bakeStore = b.dataset.bakestore; renderBake(); }));

  const mine = inRange(bakeStore === 'all' ? queue : queue.filter((o) => o.store === bakeStore));
  const sections = bakerSections(mine, now);
  paintRangeLabel();

  if (!sections.length) {
    const where = bakeStore === 'all' ? '' : ` for ${BAKE_TABS.find((t) => t.code === bakeStore).label}`;
    root.innerHTML = storeBar + tallyPanel + `<div class="empty">
      <div class="empty-mark">${bakeRange ? 'Nothing on those days' : 'All caught up'}</div>
      <p class="empty-note">${bakeRange
        ? `No cakes to bake${esc(where)} between those days.<br>Tap <strong>Clear</strong> to see the whole queue.`
        : `Nothing waiting to be baked${esc(where)}.`}</p>
    </div>`;
    wireBar();
    return;
  }

  // 'Just baked' spans whatever was finished in the last day, so a single date
  // beside it would be a guess — the same reason Overdue carries none.
  const dated = (label) => label !== 'Overdue' && label !== 'Just baked';
  root.innerHTML = storeBar + tallyPanel + sections.map(([label, rows]) => `
    <div class="section-head ${label === 'Overdue' ? 'is-overdue' : ''}">
      <span class="section-name">${esc(label)}</span>
      ${dated(label) ? `<span class="section-date">${esc(dateFmt.format(new Date(rows[0].due_at)))}</span>` : ''}
      <span class="section-count">${rows.length}</span>
    </div>
    ${label === 'Just baked'
      ? '<p class="bake-undo">Tapped by mistake? Open the cake and put it back to <strong>Order placed</strong>.</p>'
      : ''}
    <div class="docket-grid">${rows.map((o) =>
      docketHtml(o, now, { showStore: bakeStore === 'all', bakedDone: true })).join('')}</div>`).join('');

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

/**
 * The kitchen ticks a print off; the counter reads the board.
 *
 * The baker used to be allowed photo prints and not 3D toppers, which only
 * meant a finished topper sat unticked until someone asked Vaidik to tap it —
 * the machines are both in the kitchen. Either of them may now mark any job.
 * What the baker still cannot touch is the brief itself: `guard_print_job_updates()`
 * refuses a change to what is being printed, its notes, or the order it points
 * at, because those are the record of what was asked for.
 *
 * Staff get no button at all. The database would refuse the write, and offering
 * one that errors is worse than not offering it.
 */
const canPrintStatus = () => me.role === 'admin' || me.role === 'baker';

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
        ${thumbHtml(o)}
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
        <div class="docket-grid">${rows.map((j) => printCardHtml(j, now)).join('')}</div>`).join('')
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
    ${orderPhotos(o).length ? `<div class="detail-gallery">${orderPhotos(o).map((path, i) =>
        `<a class="detail-shot" data-full target="_blank" rel="noopener">
           <img class="detail-photo" data-photo="${esc(path)}" alt="Cake design ${i + 1}">
         </a>`).join('')}</div>
      <p class="gallery-note">${orderPhotos(o).length === 1 ? 'Tap the photo to see it full size'
        : `${orderPhotos(o).length} photos on this order — tap one to see it full size`}</p>` : ''}

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
    ${canPrintStatus()
      ? `<div class="action-row">
           <button class="btn ${done ? 'btn-quiet' : 'btn-primary'}" id="print-toggle">
             ${done ? 'Move back to to-print' : 'Mark printed'}</button>
         </div>`
      : '<p class="panel-note" style="margin:0;">The kitchen marks prints done — this page is here so you can see what is still coming.</p>'}
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

  hydrateThumbs(body);

  if (canPrintStatus()) {
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
          ${thumbHtml(o, '')}
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
        ${thumbHtml(picked)}
        <div class="grow">
          <div class="docket-name">${esc(picked.customer_name)}</div>
          <div class="docket-what">${esc(what || '—')} · ${esc(storeLabel(picked.store))}</div>
          <div class="docket-taken">Pick up ${esc(dateTimeFmt.format(new Date(picked.due_at)))}</div>
        </div>`;
      hydrateThumbs(sum);
      body.querySelector('#what-3d:not(.hidden) textarea, #what-photo:not(.hidden) textarea')?.focus();
    }));

    // Signed after paint, in one request, same as every other list of photos.
    const tiles = [...grid.querySelectorAll('img[data-photo]')];
    photoUrls(tiles.map((i) => i.dataset.photo)).then((urls) => {
      for (const img of tiles) {
        const url = urls.get(img.dataset.photo);
        if (url) img.src = url; else img.replaceWith(document.createTextNode('◍'));
      }
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

/**
 * The two worklists that carry a date filter, and the one panel that drives
 * both.
 *
 * The baker asked for the same thing staff have — "what have we got on for the
 * long weekend" is the same question in the kitchen — so it is the same
 * control, in the same place, rather than a second one that behaves not quite
 * the same. The ranges are kept apart: flipping to the queue to check Saturday
 * should not silently narrow the order log you left behind.
 */
const RANGE_VIEWS = ['log', 'bake'];
const rangeOf = () => (view === 'bake' ? bakeRange : logRange);
const setRange = (r) => { if (view === 'bake') bakeRange = r; else logRange = r; };
const repaintRange = () => (view === 'bake' ? renderBake() : renderLog());

function paintRangeLabel() {
  const label = $('logbar-label');
  const clear = $('range-clear');
  const range = rangeOf();
  if (!range) {
    label.textContent = view === 'bake' ? 'Everything to bake' : 'All upcoming';
    clear.classList.add('hidden');
    return;
  }
  label.textContent = range.from === range.to
    ? dayKeyLabel(range.from)
    : `${dayKeyLabel(range.from)} – ${dayKeyLabel(range.to)}`;
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

  const range = rangeOf();
  const from = range?.from ?? rangePick.anchor;
  const to = range?.to ?? rangePick.anchor;

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
    <p class="range-hint">${rangePick.anchor && !range
      ? 'Now tap the last day, or the same day again for just that one.'
      : 'Tap a day, then tap another for a range.'}</p>`;

  panel.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    rangePick.view = shiftMonth(v.year, v.month, Number(b.dataset.step));
    paintRangePanel();
  }));

  panel.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => {
    const key = b.dataset.day;
    if (!rangePick.anchor || rangeOf()) {
      rangePick.anchor = key;
      setRange(null);
    } else {
      const a = rangePick.anchor;
      setRange({ from: a <= key ? a : key, to: a <= key ? key : a });
      rangePick.anchor = null;
    }
    paintRangePanel();
    repaintRange();
  }));

  panel.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => {
    setRange(b.dataset.quick === 'today'
      ? { from: today, to: today }
      : { from: today, to: addDayKey(today, 6) });
    rangePick.anchor = null;
    paintRangePanel();
    repaintRange();
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
  setRange(null);
  rangePick = { anchor: null, view: null };
  closeRange();
  repaintRange();
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
/**
 * The tier boxes behind the "Tiered / tall" size.
 *
 * A stacked cake is a list of widths and heights, bottom first, and the labels
 * come from the count — two tiers are Bottom and Top, three gain a Middle. The
 * boxes write straight into the model without a redraw, so a cursor never jumps
 * mid-number; only adding or removing a tier redraws.
 */
function mountTiers(prefix, initial) {
  const host = $(`${prefix}-tiers`);
  const panel = $(`${prefix}-tier-field`);
  let tiers = parseTiers(initial);
  if (!tiers.length) tiers = [{ w: '', h: '' }, { w: '', h: '' }];

  function draw() {
    host.innerHTML = tiers.map((t, i) => {
      const name = tierLabel(i, tiers.length);
      return `<div class="tier-row">
          <span class="tier-name">${esc(name)}</span>
          <div class="inch"><input class="input nums" type="number" step="0.5" min="1"
            inputmode="decimal" placeholder="8" value="${esc(t.w)}"
            data-t="${i}" data-k="w" aria-label="${esc(name)} tier width in inches"></div>
          <div class="inch"><input class="input nums" type="number" step="0.5" min="1"
            inputmode="decimal" placeholder="6" value="${esc(t.h)}"
            data-t="${i}" data-k="h" aria-label="${esc(name)} tier height in inches"></div>
          ${tiers.length > 1 ? `<button type="button" class="tier-drop" data-drop="${i}"
            aria-label="Remove the ${esc(name.toLowerCase())} tier">✕</button>` : ''}
        </div>`;
    }).join('');

    host.querySelectorAll('input[data-t]').forEach((el) => el.addEventListener('input', () => {
      tiers[Number(el.dataset.t)][el.dataset.k] = el.value.trim();
    }));
    host.querySelectorAll('[data-drop]').forEach((b) => b.addEventListener('click', () => {
      tiers.splice(Number(b.dataset.drop), 1);
      draw();
    }));
  }
  draw();

  $(`${prefix}-tier-add`).addEventListener('click', () => {
    if (tiers.length >= 5) { toast('Five tiers is the limit.', 'error'); return; }
    tiers.push({ w: '', h: '' });
    draw();
  });

  return {
    show: (on) => panel.classList.toggle('hidden', !on),
    value: () => tierText(tiers),
    /** Half a tier is worse than none: it prints a cake nobody can build. */
    complete: () => tiers.length > 0 && tiers.every((t) => t.w && t.h),
  };
}

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
  const price = netPrice(o);        // what is actually owed, discount taken off
  const paid = paidOn(o);
  if (!price) return null;
  if (paid <= 0) return { label: 'Unpaid', cls: 'tag-unpaid' };
  if (paid >= price) return { label: 'Paid', cls: 'tag-paid' };
  return { label: `Paid ${money.format(paid)}`, cls: 'tag-part' };
}


/**
 * Ties a dollar discount and a percentage discount together.
 *
 * Only the dollar amount is ever stored — a receipt has to show money, and a
 * percentage of a price that later changes is not a fact about the sale. The
 * percent box is a way of typing, not a second source of truth.
 *
 * Which box was last touched decides what happens when the PRICE changes.
 * Someone who typed "10%" means ten percent, so a corrected price keeps the
 * percentage and moves the dollars; someone who typed "$10" means ten dollars,
 * so it keeps the dollars and moves the percentage. Guessing the same way in
 * both cases is wrong half the time.
 *
 * The field being typed in is never rewritten. Rounding $8.999 to $9.00 and
 * feeding it back would turn "10" into "10.001" under the cursor.
 */
function linkDiscount({ price, amount, pct, onChange = () => {} }) {
  const $p = $(price), $a = $(amount), $c = $(pct);
  let mode = 'amount';                       // which box the person is driving

  const priceOf = () => Math.max(0, Number($p.value || 0));
  const clean = (n) => (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');

  function paint(skip, quiet) {
    const full = priceOf();
    // Percent of nothing is nothing: with no price there is no percentage to
    // show, and letting someone type one would silently do nothing.
    $c.disabled = full <= 0;
    if (full <= 0) {
      if (skip !== 'pct') $c.value = '';
    } else if (mode === 'pct') {
      const p = Math.min(100, Math.max(0, Number($c.value || 0)));
      const off = Math.round(full * p) / 100;
      if (skip !== 'amount') $a.value = off ? off.toFixed(2) : '';
    } else {
      const off = Math.min(full, Math.max(0, Number($a.value || 0)));
      if (skip !== 'pct') $c.value = off ? clean((off / full) * 100) : '';
    }
    if (!quiet) onChange();
  }

  $a.addEventListener('input', () => { mode = 'amount'; paint('amount'); });
  $c.addEventListener('input', () => { mode = 'pct';    paint('pct'); });

  // Out-of-range values are clamped when the box is left, not while it is being
  // typed in — pinning it mid-keystroke fights the person. What is saved is
  // clamped either way; this is so nobody looks at "500" in the box and
  // believes they gave $500 off a $200 cake.
  const settle = () => {
    const full = priceOf();
    if (full > 0 && Number($a.value || 0) > full) $a.value = full.toFixed(2);
    if (Number($c.value || 0) > 100) $c.value = '100';
    paint();
  };
  $a.addEventListener('change', settle);
  $c.addEventListener('change', settle);
  // A changed price re-derives whichever half the person is not driving.
  $p.addEventListener('input', () => paint(mode === 'pct' ? 'pct' : 'amount'));

  // Quiet on the way in. Setting the boxes up is not a change, and calling back
  // during construction reaches the caller's own state before it is
  // initialised — which is a ReferenceError, not a stale number.
  paint(undefined, true);
  return { refresh: () => paint() };
}

// ── Order detail sheet ──────────────────────────────────────────────────────
/**
 * Overlays and the phone's back button.
 *
 * Opening a sheet pushes a history entry so that Android's back gesture closes
 * it. Without this, back walks out of the app entirely — mid-order, with the
 * form filled in — which is what it did until now.
 *
 * Closing by any other route pops that entry back off, so the history does not
 * silently fill with dead steps a customer-facing back press has to chew
 * through. popstate does nothing when nothing is open, which is what makes the
 * two paths safe to mix: our own history.back() lands there and finds the work
 * already done.
 */
let sheetPushed = false;
let drawerPushed = false;

function pushOverlay(which) {
  if (which === 'sheet' ? sheetPushed : drawerPushed) return;
  if (which === 'sheet') sheetPushed = true; else drawerPushed = true;
  history.pushState({ opsOverlay: which }, '');
}

function closeSheet({ fromHistory = false } = {}) {
  if (!$('sheet-root').innerHTML) return;
  $('sheet-root').innerHTML = '';
  document.body.style.overflow = '';
  const pushed = sheetPushed;
  sheetPushed = false;
  if (pushed && !fromHistory) history.back();
}

window.addEventListener('popstate', () => {
  // Back was pressed. Close the drawer first — it sits above the sheet.
  if ($('drawer-root').innerHTML) { closeDrawer({ fromHistory: true }); return; }
  if ($('sheet-root').innerHTML) closeSheet({ fromHistory: true });
});

function openSheet(title, bodyHtml, { center = false } = {}) {
  pushOverlay('sheet');
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
  $('sheet-root').querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeSheet()));
  return $('sheet-root').querySelector('.sheet-body');
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

const field = (k, v, cls = '') =>
  `<div class="${cls}"><div class="detail-k">${k}</div><div class="detail-v${v ? '' : ' quiet'}">${v ? esc(v) : '—'}</div></div>`;

async function openOrder(id) {
  const o = orders.find((x) => x.id === id);
  if (!o) return;

  const net = netPrice(o);
  const off = discountOn(o);
  const owing = Math.max(0, net - paidOn(o));
  const author = peopleById.get(o.created_by);

  const timeline = [
    ...(loggedLater(o) ? [['Ordered', o.ordered_at]] : []),
    ['Log time',   o.created_at],
    ['Baked',      o.baked_at],
    ['At store',   o.arrived_at],
    ['Picked up',  o.picked_up_at],
    ['Cancelled',  o.cancelled_at],
  ].filter(([, t]) => t);

  const canEdit = me.role === 'admin' || me.role === 'staff';
  const showMoney = me.role !== 'baker';
  const orderPrints = printsByOrder.get(o.id) || [];

  // Several reference photos is the normal case, so the detail sheet shows the
  // lot. The first is the cover the dockets already show; the rest sit beside it.
  const photos = orderPhotos(o);

  // Shrunk for the PDF while the sheet is being read rather than when the button
  // is pressed, so the invoice is ready the moment it is asked for. These are the
  // signed URLs the gallery above is already loading, so it costs the network
  // nothing.
  let invoiceReady = me.role === 'admin' && photos.length ? null : [];
  const invoicePhotos = invoiceReady || Promise.all(photos.slice(0, 6).map((path) => photoForPdf(path)))
    .then((list) => { invoiceReady = list.filter(Boolean); return invoiceReady; });

  const body = openSheet(o.order_no, `
    ${photos.length ? `<div class="detail-gallery">${photos.map((path, i) => `
        <div class="detail-cell">
          <a class="detail-shot" data-full target="_blank" rel="noopener">
            <img class="detail-photo" data-photo="${esc(path)}" alt="Cake design ${i + 1}">
          </a>
          ${canEdit ? `<button type="button" class="photo-remove" data-drop-photo="${esc(path)}"
            aria-label="Remove photo ${i + 1} from this order">✕</button>` : ''}
        </div>`).join('')}</div>
      <p class="gallery-note">${photos.length === 1 ? 'Tap the photo to see it full size'
        : `${photos.length} photos on this order — tap one to see it full size`}</p>` : ''}
    ${canEdit ? `
      <div class="addphoto">
        <input class="photo-input" type="file" id="add-photo" accept="image/*" multiple>
        <label class="photo-pick" for="add-photo">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>${photos.length ? 'Add more photos' : 'Add a photo'}</span>
        </label>
        <p class="msg" id="add-photo-msg" role="status" aria-live="polite"></p>
      </div>` : ''}

    <div class="detail-grid" id="detail-view">
      ${field('Customer', o.customer_name)}
      ${field('Phone', o.customer_phone)}
      <div class="span-2 hidden" id="cust-history"></div>
      ${field('Order time', dateTimeFmt.format(orderedAt(o)))}
      ${field('Pick up', dateTimeFmt.format(new Date(o.due_at)))}
      ${field('Store', storeLabel(o.store))}
      ${field('Flavour', o.flavour)}
      ${field('Size', o.size)}
      ${field('Wording', o.wording, 'span-2')}
      ${o.design_notes ? field('Design notes', o.design_notes, 'span-2') : ''}
      ${o.notes ? field('Notes', o.notes, 'span-2') : ''}
      ${showMoney ? field('Price', o.price ? money.format(o.price) : '') : ''}
      ${showMoney && off > 0 ? field('Discount',
        `− ${money.format(off)} · customer pays ${money.format(net)}`) : ''}
      ${showMoney ? field('Paid', owing > 0
        ? `${money.format(paidOn(o))} of ${money.format(net)} — ${money.format(owing)} still to collect`
        : money.format(paidOn(o))) : ''}
      ${me.role === 'admin' ? field('Cost', o.cost != null ? money.format(o.cost) : '') : ''}
      ${field('Kind', o.kind === 'custom' ? 'Custom cake'
        : `${o.kind === 'pav' ? 'Pav' : 'Normal'} · ${o.walk_in ? 'bought in store' : 'ordered ahead'}`, 'span-2')}
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
        <span class="field-label">Order time</span>
        <button type="button" class="datefield" id="edit-ordered-btn" aria-expanded="false">
          <span class="datefield-value is-empty" id="edit-ordered-label">Choose a date and time</span>
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
          </svg>
        </button>
        <div class="cal hidden" id="edit-ordered-cal"></div>
        <input type="hidden" id="edit-ordered">
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

      <div class="field hidden" id="edit-tier-field">
        <span class="field-label">Tiers</span>
        <div id="edit-tiers"></div>
        <button type="button" class="btn btn-quiet tier-add" id="edit-tier-add">+ Add a tier</button>
        <p class="photo-hint">Bottom tier first — width across, then height tall.</p>
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
        <div><div class="detail-k">Discount</div>
          <div class="disc-pair">
            <div class="money"><input class="input nums" id="discount-input" type="number" step="0.01" min="0" inputmode="decimal" value="${o.discount ?? 0}" aria-label="Discount in dollars"></div>
            <div class="pct"><input class="input nums" id="discount-pct" type="number" step="0.1" min="0" max="100" inputmode="decimal" placeholder="0" aria-label="Discount as a percentage"></div>
          </div></div>
      </div>
      <div class="row-2" style="margin-top:9px;">
        <div><div class="detail-k">Deposit</div>
          <div class="money"><input class="input nums" id="deposit-input" type="number" step="0.01" min="0" inputmode="decimal" value="${o.deposit ?? 0}"></div></div>
        <div><div class="detail-k">Customer pays</div>
          <div class="detail-v" id="pay-net">${esc(money.format(net))}</div></div>
      </div>
      <button class="btn btn-outline" id="pay-save" style="width:100%;margin-top:9px;">Save payment</button>
      <p class="msg" id="pay-msg" role="status" aria-live="polite"></p>` : ''}

    <hr class="rule">
    <div class="block-label">History</div>
    <div class="timeline">
      ${timeline.map(([k, t]) => `
        <div class="tl-item"><span>${k}</span>
          ${k === 'Log time' && author ? `<span class="list-meta">by ${esc(author.name)}</span>` : ''}
          <span class="tl-when">${esc(dateTimeFmt.format(new Date(t)))}</span></div>`).join('')}
    </div>
    <div id="edit-trail"></div>

    ${me.role === 'admin' ? `
      <hr class="rule">
      <button type="button" class="btn btn-outline" id="receipt-btn" style="width:100%;">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
             style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.7;vertical-align:-3px;margin-right:7px;">
          <path d="M12 3v11m0 0l-4-4m4 4l4-4M4 17v3h16v-3"/>
        </svg>Download tax invoice
      </button>

      <hr class="rule">
      <div class="block-label">Delete this order</div>
      <p class="danger-note">
        For an order that should never have existed — a double entry, or one
        typed against the wrong shop. It goes completely: the cake, its costs,
        its prints and its photos. <strong>Cancel instead if the customer pulled
        out</strong>, or the cancellation rate stops meaning anything.
      </p>
      <button type="button" class="btn btn-danger" id="order-delete" style="width:100%;">Delete order</button>` : ''}
  `);

  // Two taps, same as deleting a print job: this is not undoable from the app,
  // and it sits directly under a button people press all day.
  if (me.role === 'admin') {
    let armed = false;
    $('order-delete').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      if (!armed) {
        armed = true;
        btn.textContent = `Tap again to delete ${o.order_no}`;
        setTimeout(() => { if (armed) { armed = false; btn.textContent = 'Delete order'; } }, 4000);
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Deleting…';
      try {
        await deleteOrder(o);
        closeSheet();
        await render();
        toast(`${o.order_no} deleted.`);
      } catch (err) {
        armed = false;
        btn.disabled = false;
        btn.textContent = 'Delete order';
        toast(err.message, 'error');
      }
    });
  }

  if (me.role === 'admin') $('receipt-btn').addEventListener('click', async (e) => {
    // Fetching and shrinking the design photos takes a moment on shop wifi, and
    // a button that looks dead is a button that gets pressed four times.
    const btn = e.currentTarget;
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Building the invoice…';
    try {
      // Every amount is handed over already formatted by the one `money` we use
      // everywhere, so the PDF cannot round differently from the screen.
      const ctx = {
        store: STORES.find((st) => st.code === o.store),
        business: BUSINESS, money, dateFmt, dateTimeFmt, orderedAt, paidOn,
        photos: invoiceReady || await invoicePhotos,
      };
      // Straight to the file's own URL. The browser sees an attachment and
      // saves it — the one route that works on a phone as well as a laptop.
      location.href = await invoiceUrl(o, receiptPdf(o, ctx), receiptName(o, ctx));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = label;
    }
  });

  // The timeline above says what state the order reached. This says what was
  // changed on the way — a price corrected after the customer called, a pickup
  // moved. Loaded after paint and silent on failure: it is a record, not a
  // reason to hold up the sheet.
  if (me.role === 'admin') {
    orderEvents(o.id).then((events) => {
      const edits = events.filter((e) => e.kind === 'edit');
      const host = $('edit-trail');
      if (!edits.length || !host) return;
      host.innerHTML = `
        <div class="block-label" style="margin-top:14px;">Changes</div>
        <div class="timeline">
          ${edits.map((e) => `
            <div class="tl-item">
              <span>${esc([...new Set(Object.keys(e.detail).map(fieldLabel))].join(', '))}</span>
              ${peopleById.get(e.actor)
                ? `<span class="list-meta">by ${esc(peopleById.get(e.actor).name)}</span>` : ''}
              <span class="tl-when">${esc(dateTimeFmt.format(new Date(e.at)))}</span>
            </div>`).join('')}
        </div>`;
    }).catch(() => {});
  }

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
          ${Number(c.discount_given) > 0
            ? `<span class="list-meta">· ${money.format(Number(c.discount_given))} discounted</span>` : ''}
          <span class="list-meta">· since ${esc(dateFmt.format(new Date(c.first_order)))}</span>
        </div>`;
      host.classList.remove('hidden');
    }).catch(() => {});
  }

  // Wrong photo attached, or a design the customer changed their mind about.
  // Adding without removing meant the baker had to guess which picture was live.
  if (canEdit) body.querySelectorAll('[data-drop-photo]').forEach((b) => {
    b.addEventListener('click', async () => {
      const path = b.dataset.dropPhoto;
      const note = $('add-photo-msg');
      // Two taps, like deleting a print job: the picture does not come back, and
      // these buttons sit on top of a photo someone is trying to look at.
      if (!b.classList.contains('is-armed')) {
        body.querySelectorAll('.photo-remove.is-armed').forEach((o2) => o2.classList.remove('is-armed'));
        b.classList.add('is-armed');
        note.className = 'msg';
        note.textContent = 'Tap ✕ again to delete that photo.';
        setTimeout(() => {
          if (!b.classList.contains('is-armed')) return;
          b.classList.remove('is-armed');
          if (note.textContent === 'Tap ✕ again to delete that photo.') note.textContent = '';
        }, 4000);
        return;
      }
      note.className = 'msg';
      note.textContent = 'Removing…';
      b.disabled = true;
      try {
        await removePhoto(o, path);
        closeSheet();
        await render();
        toast(`Photo removed from ${o.order_no}.`);
      } catch (err) {
        b.disabled = false;
        note.className = 'msg msg-error';
        note.textContent = err.message;
      }
    });
  });

  if (canEdit) $('add-photo').addEventListener('change', async (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    if (!picked.length) return;
    const note = $('add-photo-msg');
    note.className = 'msg';
    note.textContent = `Uploading ${picked.length} photo${picked.length === 1 ? '' : 's'}…`;
    try {
      await uploadPhotos(o, picked, { append: true });
      closeSheet();
      await render();
      toast(`${picked.length} photo${picked.length === 1 ? '' : 's'} added to ${o.order_no}.`);
    } catch (err) {
      note.className = 'msg msg-error';
      note.textContent = err.message;
    }
  });

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
            ${canPrintStatus()
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

  // Cancelling an order in here does NOT refund the card. Staff will assume it
  // did — that is the whole danger — so a web order says so before it saves,
  // and names where the money actually has to be given back.
  function askAboutRefund(status, b) {
    const host = $('print-warn');
    $('print-block')?.classList.add('hidden');
    host.innerHTML = `
      <div class="warnbox">
        <div class="warnbox-title">This cake was paid for online</div>
        <div class="warnbox-note">Cancelling here does <strong>not</strong> refund the card.
          Refund it in Stripe as well, or the customer has no cake and no money back.</div>
        <div class="action-row">
          <button class="btn btn-quiet" data-warn="no">Go back</button>
          <button class="btn btn-primary" data-warn="yes">I'll refund in Stripe — cancel it</button>
        </div>
      </div>`;
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
      if (status === 'cancelled' && o.stripe_session_id) {
        b.disabled = true;
        askAboutRefund(status, b);
        return;
      }
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
    // The two inputs and the number they produce, kept in step. Without it the
    // "customer pays" line goes stale the moment a discount is typed, which is
    // worse than not showing it.
    const syncNet = () => {
      const full = Number($('price-input').value || 0);
      const off = Math.min(Number($('discount-input').value || 0), full);
      $('pay-net').textContent = money.format(full - off);
    };
    linkDiscount({
      price: 'price-input', amount: 'discount-input', pct: 'discount-pct', onChange: syncNet,
    });

    $('pay-save').addEventListener('click', async () => {
      const msg = $('pay-msg');
      try {
        const updated = await updateOrder(o.id, {
          price: $('price-input').value === '' ? null : Number($('price-input').value),
          discount: Math.min(Number($('discount-input').value || 0),
                             Number($('price-input').value || 0)),
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
    let editDue = null, editOrdered = null, editFlavour = null, editSize = null, editTiers = null;

    $('edit-toggle').addEventListener('click', () => {
      $('detail-view').classList.add('hidden');
      $('edit-toggle').classList.add('hidden');
      $('edit-panel').classList.remove('hidden');

      if (!editMounted) {
        editMounted = true;
        editDue = mountDuePicker('edit-due', o.due_at);
        editOrdered = mountDuePicker('edit-ordered', o.ordered_at || o.created_at, { back: true });
        editFlavour = mountDropdown($('edit-dd-flavour'), {
          value: o.flavour, placeholder: 'Choose flavour',
          options: FLAVOURS.map((f) => ({ value: f.name, label: f.name, tag: f.premium ? 'Premium' : null })),
        });
        // A tiered order stores its tier list as the size, so the dropdown is
        // put back on "Tiered / tall" and the boxes are filled from the string.
        editTiers = mountTiers('edit', o.size);
        editTiers.show(isTiered(o.size));
        editSize = mountDropdown($('edit-dd-size'), {
          value: isTiered(o.size) ? TIERED : o.size, placeholder: 'Choose size',
          options: SIZES.map((sz) => ({ value: sz.code, label: sz.label })),
          onChange: (code) => editTiers.show(code === TIERED),
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
      const tiered = editSize.value() === TIERED;
      if (tiered && !editTiers.complete()) {
        msg.textContent = 'Give every tier a width and a height.'; msg.className = 'msg msg-error'; return;
      }

      const btn = $('edit-save');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const patch = {
          customer_name: name,
          customer_phone: $('edit-phone').value.trim() || null,
          due_at: editDue.value(),
          ordered_at: editOrdered.value() || null,
          flavour: editFlavour.value() || null,
          size: (tiered ? editTiers.value() : editSize.value()) || null,
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
  let photoFiles = [];
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
      <button class="kind-card" data-kind="pav" aria-pressed="false">
        <div class="kind-name">Pav</div>
        <div class="kind-note">${esc(PAV.label)}, ${money.format(PAV.price)} each</div>
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

      <div class="row-2" id="cake-fields">
        <div class="field">
          <span class="field-label">Flavour</span>
          <div id="dd-flavour"></div>
        </div>
        <div class="field">
          <span class="field-label">Size</span>
          <div id="dd-size"></div>
        </div>
      </div>

      <div class="field hidden" id="qty-field">
        <label class="field-label" for="f-qty">Quantity <span class="req">*</span></label>
        <input class="input nums" id="f-qty" type="number" min="1" step="1" inputmode="numeric" value="1">
        <p class="money-hint">How many ${esc(PAV.label)}s.</p>
      </div>

      <div class="field hidden" id="f-tier-field">
        <span class="field-label">Tiers <span class="req">*</span></span>
        <div id="f-tiers"></div>
        <button type="button" class="btn btn-quiet tier-add" id="f-tier-add">+ Add a tier</button>
        <p class="photo-hint">Bottom tier first — width across, then height tall.</p>
      </div>

      <div class="field" id="wording-field">
        <label class="field-label" for="f-wording">Wording on cake</label>
        <input class="input" id="f-wording" placeholder="Happy Birthday Jainam" autocomplete="off">
      </div>

      <div class="field" id="design-field">
        <label class="field-label" for="f-design">Design notes</label>
        <textarea class="textarea" id="f-design" placeholder="Both shape cake, pink fairies…"></textarea>
      </div>

      <div class="field" id="photo-field">
        <span class="field-label">Design photos</span>
        <div class="photo-drop">
          <!-- Customers routinely send three or four reference pictures, so
               this is a strip that grows rather than one slot that replaces
               itself. The first is the cover the dockets show. -->
          <div class="photo-strip hidden" id="photo-strip"></div>
          <div style="flex:1;min-width:0">
            <div class="photo-pickers">
              <!-- capture opens the camera straight away. It belongs on this
                   input and only this one. -->
              <input class="photo-input" type="file" id="f-photo-cam" accept="image/*" capture="environment">
              <label class="photo-pick" for="f-photo-cam">
                <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.4"/><path d="M8 6l1.6-2.4h4.8L16 6"/>
                </svg>
                <span>Take photo</span>
              </label>

              <!-- and NOT on this one. With capture here, Android skips the
                   picker and opens the camera, so the photo the customer
                   already sent over WhatsApp cannot be attached at all. That
                   was the bug; verify.mjs now fails the build if it comes back. -->
              <input class="photo-input" type="file" id="f-photo" accept="image/*" multiple>
              <label class="photo-pick" for="f-photo">
                <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="9.5" r="1.4"/>
                </svg>
                <span>Choose photos</span>
              </label>
            </div>
            <p class="photo-name hidden" id="photo-name"></p>
            <p class="photo-hint">Add as many as the customer sent — or none, if they have left the design to us. Shrunk before upload, and deleted 14 days after the order.</p>
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
          <label class="field-label" for="f-discount">Discount</label>
          <div class="disc-pair">
            <div class="money"><input class="input nums" id="f-discount" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00" aria-label="Discount in dollars"></div>
            <div class="pct"><input class="input nums" id="f-discount-pct" type="number" step="0.1" min="0" max="100" inputmode="decimal" placeholder="0" aria-label="Discount as a percentage"></div>
          </div>
        </div>
      </div>

      <!-- Price stays the full price and the discount comes off it, so what the
           customer is actually being asked for is a third number. Showing it
           live is the difference between logging a discount and second-guessing
           whether you were meant to type the discounted price in the box above. -->
      <p class="net-line hidden" id="net-line"></p>

      <div class="field">
        <label class="field-label" for="f-deposit">Deposit taken</label>
        <div class="money"><input class="input nums" id="f-deposit" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></div>
      </div>

      <div class="field">
        <span class="field-label">Payment</span>
        <div class="pay-toggle" id="pay-toggle">
          <button type="button" class="pay-opt" data-pay="unpaid" aria-pressed="true">Unpaid</button>
          <button type="button" class="pay-opt" data-pay="half" aria-pressed="false">50% deposit</button>
          <button type="button" class="pay-opt" data-pay="deposit" aria-pressed="false">Other amount</button>
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

  // Declared up here because the size dropdown's onChange refreshes it, and a
  // `const` defined further down would be in the temporal dead zone if that
  // ever fired during mount.
  let discountLink = null;

  const ddFlavour = mountDropdown($('dd-flavour'), {
    placeholder: 'Choose flavour',
    options: FLAVOURS.map((f) => ({
      value: f.name, label: f.name, tag: f.premium ? 'Premium' : null,
    })),
    onChange: refreshPriceHint,
  });

  const tiers = mountTiers('f');

  const ddSize = mountDropdown($('dd-size'), {
    placeholder: 'Choose size',
    options: SIZES.map((sz) => ({ value: sz.code, label: sz.label })),
    onChange: (code) => {
      tiers.show(code === TIERED);
      // Fill the standard price so staff only type when it differs. Never
      // overwrite a price they have already typed.
      const base = basePrice(code);
      // A normal cake sold off the menu keeps this figure as the final price —
      // staff rarely retype it — so it is forced onto a .99 ending here.
      // Custom is left alone: it is always a starting point someone edits
      // before saving, most often straight after picking a premium flavour.
      const shown = kind === 'normal' ? toNinetyNine(base) : base;
      if (base != null && !priceTouched) $('f-price').value = shown.toFixed(2);
      refreshPriceHint();
      // Setting .value fires no input event, so the discount pair would keep a
      // percentage worked out against the old price.
      discountLink?.refresh();
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

  // A pav has one price and no variants, so the quantity is the whole order —
  // it fills the price until someone types over it, the same rule as size.
  const pavQty = () => Math.max(1, Math.floor(Number($('f-qty').value) || 1));
  const fillPavPrice = () => {
    if (kind !== 'pav' || priceTouched) return;
    $('f-price').value = (pavQty() * PAV.price).toFixed(2);
    discountLink?.refresh();
    syncPayment();
  };
  $('f-qty').addEventListener('input', fillPavPrice);

  $('f-price').addEventListener('input', () => { priceTouched = true; syncPayment(); });
  discountLink = linkDiscount({
    price: 'f-price', amount: 'f-discount', pct: 'f-discount-pct', onChange: syncPayment,
  });

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
    // Deposits are a share of what is actually owed, not of the list price:
    // half of a $90 cake with $20 off is $35, not $45.
    const full = Number($('f-price').value || 0);
    const off = Math.min(Number($('f-discount').value || 0), full);
    const price = full - off;
    const dep = $('f-deposit');

    const line = $('net-line');
    line.classList.toggle('hidden', !(off > 0));
    if (off > 0) {
      line.innerHTML = `<s>${esc(money.format(full))}</s> less ${esc(money.format(off))} off`
        + ` — customer pays <strong>${esc(money.format(price))}</strong>`;
    }
    if (payMode === 'unpaid') { dep.value = '0'; dep.disabled = true; }
    else if (payMode === 'paid') { dep.value = price ? price.toFixed(2) : ''; dep.disabled = true; }
    else if (payMode === 'half') {
      // Worked in cents so an odd price lands on a real amount: half of $89.99
      // is $45.00, not $44.995, and the balance is then exactly the rest.
      dep.value = price ? (Math.round(price * 50) / 100).toFixed(2) : '';
      dep.disabled = true;
    }
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

  // ── Photos ────────────────────────────────────────────────────────────────
  const MAX_PHOTOS = 8;

  const drawPhotos = () => {
    const strip = $('photo-strip');
    strip.querySelectorAll('img[data-url]').forEach((i) => URL.revokeObjectURL(i.dataset.url));
    strip.classList.toggle('hidden', !photoFiles.length);
    strip.innerHTML = photoFiles.map((f, i) => {
      const url = URL.createObjectURL(f);
      return `<span class="photo-shot">
          <img class="photo-preview" src="${url}" data-url="${url}" alt="Design photo ${i + 1}">
          ${i === 0 ? '<span class="photo-cover">Cover</span>' : ''}
          <button type="button" class="photo-remove" data-drop="${i}"
            aria-label="Remove photo ${i + 1}">✕</button>
        </span>`;
    }).join('');
    strip.querySelectorAll('[data-drop]').forEach((b) => b.addEventListener('click', () => {
      photoFiles.splice(Number(b.dataset.drop), 1);
      drawPhotos();
    }));
    $('photo-name').textContent = photoFiles.length
      ? `${photoFiles.length} photo${photoFiles.length === 1 ? '' : 's'} attached`
      : '';
    $('photo-name').classList.toggle('hidden', !photoFiles.length);
  };

  const PHOTO_INPUTS = ['f-photo', 'f-photo-cam'];

  PHOTO_INPUTS.forEach((id) => $(id).addEventListener('change', (e) => {
    const picked = [...e.target.files];
    if (!picked.length) return;   // a cancelled camera or picker must not clear what is already attached
    const room = MAX_PHOTOS - photoFiles.length;
    if (room <= 0) { toast(`That is the ${MAX_PHOTOS} photo limit.`, 'error'); }
    photoFiles = photoFiles.concat(picked.slice(0, Math.max(0, room)));
    // Both inputs are cleared, or re-picking the same file fires no change event.
    PHOTO_INPUTS.forEach((other) => { $(other).value = ''; });
    drawPhotos();
  }));

  const due = mountDuePicker();

  // ── Kind ──────────────────────────────────────────────────────────────────
  body.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => {
    kind = b.dataset.kind;
    body.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('order-form').classList.remove('hidden');
    // A custom cake has a design to show and no walk-in question to answer; a
    // normal cake is the reverse. The photos are offered, not demanded —
    // plenty of customers say "do it your way" and hand over nothing.
    $('walkin-field').classList.toggle('hidden', kind === 'custom');
    $('photo-field').classList.toggle('hidden', kind !== 'custom');
    $('design-field').classList.toggle('hidden', kind !== 'custom');
    // A pav has no flavour, no size and nothing written on it — it has a count.
    $('cake-fields').classList.toggle('hidden', kind === 'pav');
    $('wording-field').classList.toggle('hidden', kind === 'pav');
    $('qty-field').classList.toggle('hidden', kind !== 'pav');
    if (kind === 'pav') { $('f-tier-field').classList.add('hidden'); fillPavPrice(); }
    $('f-name').focus();
  }));

  // ── Save ──────────────────────────────────────────────────────────────────
  $('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('save-order'), msg = $('order-msg');
    const walkIn = kind !== 'custom' && ddWalkin.value() === 'now';
    const isPav = kind === 'pav';

    if (!due.value()) {
      msg.textContent = 'Pick the date and time the cake is being collected.';
      msg.className = 'msg msg-error';
      $('f-due-btn').focus();
      return;
    }
    const tiered = !isPav && ddSize.value() === TIERED;
    if (tiered && !tiers.complete()) {
      msg.textContent = 'Give every tier a width and a height.';
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
        flavour: isPav ? null : (ddFlavour.value() || null),
        size: isPav ? pavSize(pavQty()) : ((tiered ? tiers.value() : ddSize.value()) || null),
        wording: isPav ? null : ($('f-wording').value.trim() || null),
        design_notes: $('f-design').value.trim() || null,
        notes: $('f-notes').value.trim() || null,
        price: $('f-price').value === '' ? null : Number($('f-price').value),
        // More off than the cake costs would store a negative sale; the column
        // check only stops it going below zero.
        discount: Math.min(Number($('f-discount').value || 0),
                           Number($('f-price').value || 0)),
        deposit: Number($('f-deposit').value || 0),
      });

      if (photoFiles.length) {
        btn.textContent = photoFiles.length > 1
          ? `Uploading ${photoFiles.length} photos…` : 'Uploading photo…';
        try {
          await uploadPhotos(order, photoFiles);
        } catch (err) {
          // The order is the thing that matters; a failed photo must not lose it.
          closeSheet();
          await render();
          toast(`${order.order_no} saved, but the photos did not upload. Open the order to add them again.`, 'error');
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
/**
 * `back: true` flips which half of the calendar reads as unavailable. A pickup
 * is always ahead of you, but the time a customer placed the order is always
 * behind you — greying yesterday on that field said the opposite of the truth.
 */
function mountDuePicker(prefix = 'f-due', initialISO = null, { back = false } = {}) {
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
            class="cal-day${d.inMonth ? '' : ' is-other'}${d.key === today.dayKey ? ' is-today' : ''}${d.key === selected ? ' is-selected' : ''}${(back ? d.key > today.dayKey : d.key < today.dayKey) ? ' is-past' : ''}"
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
        <button type="button" class="btn btn-quiet" data-quick="${back ? -1 : 1}">${back ? 'Yesterday' : 'Tomorrow'}</button>
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


/** Column name -> what it is called on the form, for the change trail. */
const FIELD_LABEL = {
  customer_name: 'Customer', customer_phone: 'Phone', due_at: 'Pick up',
  ordered_at: 'Order time', flavour: 'Flavour', size: 'Size',
  wording: 'Wording', design_notes: 'Design notes', notes: 'Notes',
  price: 'Price', discount: 'Discount', deposit: 'Deposit', photo_path: 'Photos', photo_paths: 'Photos',
  store: 'Store', kind: 'Cake type', walk_in: 'Walk-in',
};
const fieldLabel = (k) => FIELD_LABEL[k] || k.replace(/_/g, ' ');

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
  directory: 'Customers', staff: 'Staff', export: 'Export', help: 'Help',
};
const ANALYTICS_TITLE = { finance: 'Finance', customers: 'Customers', data: 'Data' };

/** Every view the drawer can reach, so render() knows what to show and hide. */
const DRAWER_VIEWS = ['analytics', 'directory', 'staff', 'export'];

const menuGroups = () => MENU.filter((g) => g.roles.includes(me.role));

// Only Analytics starts open. With four groups, expanding them all would push
// the last one under the fold on a phone.
let navOpen = new Set(['Analytics']);

function closeDrawer({ fromHistory = false } = {}) {
  if (!$('drawer-root').innerHTML) return;
  $('drawer-root').innerHTML = '';
  markMoreTab(false);
  document.body.style.overflow = '';
  const pushed = drawerPushed;
  drawerPushed = false;
  if (pushed && !fromHistory) history.back();
}

const isCurrent = (c) =>
  view === c.view && (!c.page || analyticsPage === c.page);

function openDrawer() {
  pushOverlay('drawer');
  document.body.style.overflow = 'hidden';
  markMoreTab(true);
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
    .forEach((b) => b.addEventListener('click', () => closeDrawer()));

  $('drawer-root').querySelectorAll('[data-group]').forEach((b) => b.addEventListener('click', () => {
    const g = b.dataset.group;
    if (navOpen.has(g)) navOpen.delete(g); else navOpen.add(g);
    openDrawer();   // pushOverlay is a no-op while one is already pushed
  }));

  $('drawer-root').querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    view = b.dataset.view;
    if (b.dataset.page) analyticsPage = b.dataset.page;
    closeDrawer();
    buildTabs();
    render();
  }));
}

/** The More tab reads as pressed while its drawer is open. */
function markMoreTab(open) {
  const tab = $('tabbar').querySelector('[data-tab="more"]');
  if (tab) tab.setAttribute('aria-expanded', String(open));
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('drawer-root').innerHTML) closeDrawer();
});

// ── Help ────────────────────────────────────────────────────────────────────
//
// A view rather than a sheet: it is long, it is read rather than acted on, and
// leaving it open while you try the thing it describes is the whole point. The
// ? toggles, so the same tap that opened it puts you back where you were.

$('help-btn').addEventListener('click', () => {
  if (view === 'help') { view = beforeHelp || homeView(); beforeHelp = null; }
  else { beforeHelp = view; view = 'help'; }
  buildTabs();
  render();
});

function renderHelp() {
  const root = $('view-help');
  root.innerHTML = helpHtml(me);
  root.querySelectorAll('[data-tour]').forEach((b) =>
    b.addEventListener('click', () => runTour(b.dataset.tour)));
}

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
      <span class="list-meta">${esc(dateFmt.format(orderedAt(o)))}</span>
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
  ['Ordered',      (o) => csvDate(o.ordered_at || o.created_at)],
  ['Ordered time', (o) => timeFmt.format(orderedAt(o))],
  ['Logged',       (o) => csvDate(o.created_at)],
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
  ['Discount',     (o) => Number(o.discount || 0).toFixed(2)],
  // What the shop actually earned. The bookkeeper wants this column, not Price:
  // Price is the list price and says nothing about what came through the till.
  ['Net',          (o) => (o.price == null ? '' : netPrice(o).toFixed(2))],
  ['Deposit',      (o) => Number(o.deposit || 0).toFixed(2)],
  ['Balance',      (o) => (o.price == null ? '' : (netPrice(o) - paidOn(o)).toFixed(2))],
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
  { key: 'discount', label: 'Most discounted', note: 'Who we have given the most off. Not a complaint — a regular worth keeping sweet looks exactly like this — but it was invisible before.' },
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
        : boardKey === 'discount'
          ? 'No discounts recorded against a customer yet.'
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

const metricOf = (c) => ({ spend: c.spend, orders: c.orders, avg: c.avg, discount: c.discount, lapsed: c.daysSince }[boardKey]);
const valueOf = (c) => ({
  spend: money.format(c.spend),
  orders: `${c.orders}×`,
  avg: money.format(c.avg),
  discount: money.format(c.discount),
  lapsed: `${c.daysSince} days`,
}[boardKey]);
const subOf = (c) => ({
  spend: `${c.orders} cake${c.orders === 1 ? '' : 's'} · ${money.format(c.avg)} average`,
  orders: `${money.format(c.spend)} all up · last ${dayKeyLabel(c.lastKey)}`,
  avg: `${c.orders} cakes · ${money.format(c.spend)} all up`,
  discount: `${c.discountPct.toFixed(0)}% off · ${money.format(c.spend)} paid over ${c.orders} cake${c.orders === 1 ? '' : 's'}`,
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
 * The takings panel: four figures across the top, and whichever one is tapped
 * drawn underneath.
 *
 * One line at a time rather than four at once, because these are four different
 * units — dollars, cakes, dollars-per-cake — and a chart with two y-scales on it
 * is the one chart mistake worth never making. Colour therefore encodes nothing
 * about identity here (the tile says what is drawn), so it is used for kind:
 * rose for money, gold for a count.
 */
const METRICS = [
  { key: 'revenue',  label: 'Takings',       colour: SERIES[0], money: true },
  { key: 'count',    label: 'Orders',        colour: SERIES[1], money: false },
  { key: 'average',  label: 'Average order', colour: SERIES[0], money: true },
  // More discount given is not automatically good news, so the arrow that means
  // "well done" points the other way on this one.
  { key: 'discount', label: 'Discounts',     colour: SERIES[1], money: true, lowerIsBetter: true },
];

const metricSpec = (key) => METRICS.find((m) => m.key === key) || METRICS[0];
const metricValue = (row, key) => (key === 'average'
  ? (row.count ? row.revenue / row.count : 0)
  : row[key] || 0);
const metricText = (m, v) => (m.money ? money.format(v) : String(Math.round(v)));
const metricAxis = (m, v) => (m.money ? shortMoney(v) : String(Math.round(v)));

/**
 * A monotone cubic through the points — the curve Recharts calls `monotone`.
 *
 * Control points are held to the shorter of the two neighbouring gaps, which is
 * what stops a quiet Tuesday between two Saturdays from bowing the curve below
 * zero and drawing takings the shop never had.
 */
function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0].x},${pts[0].y}` : '';
  const slopes = pts.map((_, i) => {
    if (i === 0 || i === pts.length - 1) return 0;
    const a = (pts[i].y - pts[i - 1].y) / (pts[i].x - pts[i - 1].x);
    const b = (pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x);
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  });
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i];
    const dx = (p1.x - p0.x) / 3;
    d += `C${(p0.x + dx).toFixed(1)},${(p0.y + slopes[i - 1] * dx).toFixed(1)}`
      + ` ${(p1.x - dx).toFixed(1)},${(p1.y - slopes[i] * dx).toFixed(1)}`
      + ` ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }
  return d;
}

/** The four tiles. The selected one is the chart below. */
function metricTiles(stats, key) {
  return METRICS.map((m) => {
    const now = stats.now[m.key];
    const was = stats.was[m.key];
    const change = stats.change[m.key];
    const good = change == null ? null : (m.lowerIsBetter ? change < 0 : change > 0);
    return `
      <button type="button" class="mtile${m.key === key ? ' is-on' : ''}" data-metric="${m.key}"
              aria-pressed="${m.key === key}">
        <span class="mtile-top">
          <span class="mtile-label">${esc(m.label)}</span>
          ${change == null ? '' : `
            <span class="mchip ${good ? 'is-up' : 'is-down'}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${change >= 0
                ? 'M12 19V5m0 0l-6 6m6-6l6 6' : 'M12 5v14m0 0l-6-6m6 6l6-6'}"/></svg>
              ${Math.abs(change).toFixed(1)}%
            </span>`}
        </span>
        <span class="mtile-val">${esc(metricText(m, now))}</span>
        <span class="mtile-was">${change == null ? 'no earlier period to compare'
          : `from ${esc(metricText(m, was))}`}</span>
      </button>`;
  }).join('');
}

/** The line for one metric, over the days the panel covers. */
function takingsChart(rows, key) {
  const m = metricSpec(key);
  const W = 320, H = 150, padL = 36, padR = 10, padT = 12, padB = 20;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const vals = rows.map((r) => metricValue(r, key));
  const max = niceCeil(Math.max(1, ...vals));
  const x = (i) => padL + (rows.length === 1 ? plotW / 2 : (i / (rows.length - 1)) * plotW);
  const y = (v) => padT + plotH - (v / max) * plotH;
  const pts = vals.map((v, i) => ({ x: x(i), y: y(v) }));

  // Four gaps for money; for a count, no more than there are whole numbers to
  // land on — a busy-Saturday scale of 3 was printing 0 1 2 2 3 up the side.
  const steps = m.money ? 4 : Math.max(1, Math.min(4, Math.round(max)));
  const ticks = Array.from({ length: steps + 1 }, (_, i) => (max * i) / steps);
  const label = (k) => dayKeyLabel(k, { day: 'numeric', month: 'short' });
  const every = Math.max(1, Math.round(rows.length / 5));
  const best = vals.reduce((b, v, i) => (v > vals[b] ? i : b), 0);

  return `
    <svg viewBox="0 0 ${W} ${H}" class="chart-svg" id="takings-svg" data-metric="${key}"
         role="img" aria-label="${esc(m.label)} per day over the last ${rows.length} days. Highest ${esc(metricText(m, vals[best]))} on ${esc(label(rows[best].dayKey))}.">
      <defs>
        <pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r=".8" fill="${GRID}"/>
        </pattern>
        <linearGradient id="under" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${m.colour}" stop-opacity=".22"/>
          <stop offset="1" stop-color="${m.colour}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="url(#dots)"/>
      ${ticks.map((t) => `
        <line x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"
              stroke="${GRID}" stroke-width="${t === 0 ? 1 : 0.6}" stroke-opacity="${t === 0 ? 1 : 0.55}"/>
        <text x="${padL - 6}" y="${(y(t) + 3.5).toFixed(1)}" class="ax" text-anchor="end">${esc(metricAxis(m, t))}</text>`).join('')}
      <path d="${smoothPath(pts)}L${x(rows.length - 1).toFixed(1)},${padT + plotH}L${padL},${padT + plotH}Z"
            fill="url(#under)" stroke="none"/>
      <!-- The lift under the line is a fill and a fat soft stroke rather than an
           feDropShadow: a filter re-rasterises the whole path on every redraw,
           and this one redraws on a tile tap, on a phone. Two flat paints. -->
      <path d="${smoothPath(pts)}" fill="none" stroke="${m.colour}" stroke-width="6"
            stroke-opacity=".13" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${smoothPath(pts)}" fill="none" stroke="${m.colour}" stroke-width="2"
            stroke-linejoin="round" stroke-linecap="round"/>
      ${rows.map((r, i) => (i % every === 0 && i < rows.length - 1) || i === rows.length - 1 ? `
        <text x="${x(i).toFixed(1)}" y="${H - 5}" class="ax"
              text-anchor="${i === 0 ? 'start' : i === rows.length - 1 ? 'end' : 'middle'}">${esc(label(r.dayKey))}</text>` : '').join('')}
      <line id="takings-rule" x1="0" x2="0" y1="${padT}" y2="${padT + plotH}" stroke="${m.colour}"
            stroke-width="1" stroke-dasharray="3 3" stroke-opacity=".5" style="display:none"/>
      <circle id="takings-dot" r="4.5" fill="${m.colour}" stroke="var(--cream)" stroke-width="2" style="display:none"/>
    </svg>`;
}

/**
 * Tiles and chart in one block, plus the reading under the pointer.
 *
 * The whole thing redraws from `rows` on a tile tap rather than re-running the
 * analytics page, which would refetch nothing but rebuild every panel on it.
 */
function takingsPanel(stats, key = 'revenue') {
  return `
    <div class="metric-row" id="metric-row">${metricTiles(stats, key)}</div>
    <div class="chart chart-live" id="takings-chart">
      ${takingsChart(stats.rows, key)}
      <div class="chart-tip" id="takings-tip" hidden></div>
    </div>`;
}

/** Tile taps redraw the line; a finger or a mouse on the line reads it out. */
function wireTakings(stats) {
  let key = 'revenue';

  const paint = () => {
    $('metric-row').innerHTML = metricTiles(stats, key);
    $('takings-chart').firstElementChild?.remove();
    $('takings-chart').insertAdjacentHTML('afterbegin', takingsChart(stats.rows, key));
    wireRow();
    wireSvg();
  };

  const wireRow = () => $('metric-row').querySelectorAll('[data-metric]').forEach((b) =>
    b.addEventListener('click', () => { key = b.dataset.metric; paint(); }));

  const wireSvg = () => {
    const svg = $('takings-svg');
    const tip = $('takings-tip');
    const rule = $('takings-rule');
    const dot = $('takings-dot');
    const m = metricSpec(key);
    const W = 320, padL = 36, padR = 10, padT = 12, plotH = 150 - padT - 20;
    const plotW = W - padL - padR;
    const vals = stats.rows.map((r) => metricValue(r, key));
    const max = niceCeil(Math.max(1, ...vals));

    const hide = () => { tip.hidden = true; rule.style.display = 'none'; dot.style.display = 'none'; };

    const read = (e) => {
      const box = svg.getBoundingClientRect();
      const vx = ((e.clientX - box.left) / box.width) * W;
      const i = Math.max(0, Math.min(stats.rows.length - 1,
        Math.round(((vx - padL) / plotW) * (stats.rows.length - 1))));
      const px = padL + (i / (stats.rows.length - 1)) * plotW;
      const py = padT + plotH - (vals[i] / max) * plotH;

      rule.setAttribute('x1', px); rule.setAttribute('x2', px);
      rule.style.display = '';
      dot.setAttribute('cx', px); dot.setAttribute('cy', py);
      dot.style.display = '';

      tip.innerHTML = `<span class="tip-day">${esc(dayKeyLabel(stats.rows[i].dayKey, { weekday: 'short', day: 'numeric', month: 'short' }))}</span>`
        + `<span class="tip-val"><span class="tip-dot" style="background:${m.colour}"></span>`
        + `${esc(m.label)} <strong>${esc(metricText(m, vals[i]))}</strong></span>`;
      tip.hidden = false;
      // Kept inside the panel: pinned to the reading until it would run off an
      // edge, and clamped there instead.
      tip.style.left = `${Math.min(88, Math.max(12, (px / W) * 100))}%`;
    };

    svg.addEventListener('pointermove', read);
    svg.addEventListener('pointerdown', read);
    svg.addEventListener('pointerleave', hide);
    svg.addEventListener('pointercancel', hide);
  };

  wireRow();
  wireSvg();
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
    const [all, profiles, events, customerRows, photoRows, binned] = await Promise.all([
      // includeOpen keeps money still owed on old orders visible no matter how
      // long ago it was ordered — that debt is the whole point of tracking it.
      listOrders({ since, withCosts: true, includeOpen: true, complete: true }),
      listProfiles(),
      recentAuthEvents(40),
      // Over every order ever, not the 63-day window the charts use.
      allCustomers().catch(() => []),
      ordersWithPhotos().catch(() => []),
      // Rides along with the rest so the Data page costs one fetch, not two.
      deletedOrders(40).catch(() => []),
    ]);
    analyticsCache = { at: Date.now(), stamp: writeStamp.v, data: { all, profiles, events, customerRows, photoRows, binned } };
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

  const { all, profiles, events, customerRows, photoRows, binned } = await analyticsData({ force });
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
  const s30 = summarise(sold30);
  const sToday = summarise(soldToday);
  const dRev = delta(w.thisWeek.revenue, w.lastWeek.revenue);
  const dCount = delta(w.thisWeek.count, w.lastWeek.count);

  // Operational, not financial: these legitimately belong to the pickup date.
  const dueToday = all.filter((o) => sydneyParts(o.due_at).dayKey === todayKey);
  const sDueToday = summarise(dueToday);

  const open = all.filter((o) => !['picked_up', 'cancelled'].includes(o.status));
  const owingRows = open
    .map((o) => ({ o, owing: netPrice(o) - paidOn(o) }))
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

  // Sixty days for a thirty-day panel: the older half is what the tiles compare
  // against and is never drawn.
  const daily = dailyTakings(all, 60, now);
  const takings = takingsMetrics(daily, 30);
  const weeks = weeklyByStore(all, STORES.map((st) => st.code), 8, now);
  const board = customerLeaderboard(customerRows, now);
  const ahead = forwardBook(all, 7, now);
  const stale = staleOpen(all, now);
  const photos = photoHealth(photoRows || [], now);
  const cancels = cancellationStats(all, 63, now);
  const pricing = pricingGaps(all, basePrice, { days: 30, now });
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
      <div class="panel-note">Against the thirty days before it. Tap a figure to draw it — by the date the order was written.</div>
      ${takingsPanel(takings)}
      ${chartTable('Show the daily numbers', null,
        takings.rows.filter((d) => d.count).reverse().map((d) => [
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
      <div class="panel-title">Discounts given, last 30 days</div>
      <div class="panel-note">${s30.discount > 0
        ? `${money.format(s30.discount)} came off ${s30.discounted} of ${s30.count} order${s30.count === 1 ? '' : 's'}. `
          + `The same cakes at list would have been ${money.format(s30.listRevenue)}.`
        : 'Nothing discounted in the last 30 days.'}</div>
      <div class="list-row"><span class="grow">Sold at list</span>
        <span class="num">${money.format(s30.listRevenue)}</span></div>
      <div class="list-row"><span class="grow"><strong>Total discounts</strong></span>
        <span class="num"><strong>&minus; ${money.format(s30.discount)}</strong>${
          s30.discount > 0 ? ` · ${s30.discountRate.toFixed(1)}%` : ''}</span></div>
      <div class="list-row"><span class="grow">Actually taken</span>
        <span class="num">${money.format(s30.revenue)}</span></div>
      ${s30.discount > 0 ? `
        <div class="list-row"><span class="grow">This week</span>
          <span class="num">${money.format(s7.discount)}</span></div>` : ''}
      ${s30.discount > 0 && s7.margin != null ? `
        <p class="panel-foot">Margin above is worked out after discounts, so this is
        money already out of it — not a further deduction.</p>` : ''}
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
      <div class="panel-title">Cancellations, last 63 days</div>
      <div class="panel-note">${cancels.total
        ? `${cancels.cancelled} of ${cancels.total} ordered-ahead cakes came off the book — ${money.format(cancels.value)} that was promised and earned nothing. Walk-ins are excluded; they were never at risk.`
        : 'No ordered-ahead cakes on the book yet.'}</div>
      ${cancels.total ? `
        <div class="rcr">
          <div class="rcr-num">${cancels.rate.toFixed(0)}<span class="rcr-pct">%</span></div>
          <div class="rcr-side">
            <div class="rcr-label">Cancellation rate</div>
            <div class="meter meter-wide"><span class="meter-fill" style="width:${Math.min(100, cancels.rate).toFixed(1)}%"></span></div>
            <div class="list-meta">${money.format(cancels.value)} lost across ${cancels.cancelled} cake${cancels.cancelled === 1 ? '' : 's'}</div>
          </div>
        </div>

        <div class="mix-head">Does a deposit hold them?</div>
        ${[['Deposit taken', cancels.withDeposit], ['No deposit', cancels.noDeposit]].map(([label, g]) => `
          <div class="list-row">
            <span class="grow">${label}</span>
            <span class="meter"><span class="meter-fill" style="width:${Math.min(100, g.rate).toFixed(0)}%"></span></span>
            <span class="list-meta">${g.cancelled} of ${g.total}</span>
            <span class="num">${g.total ? `${g.rate.toFixed(0)}%` : '—'}</span>
          </div>`).join('')}
        <p class="ahead-warn" style="${cancels.confident ? '' : 'color:var(--taupe)'}">${cancels.confident
          ? (cancels.gap > 5
              ? `Cakes without a deposit come off the book ${Math.round(cancels.gap)} points more often. On these numbers, asking for one is worth it.`
              : 'A deposit is making little difference to whether a cake is cancelled.')
          : 'Not enough orders in either group yet to read anything into the split — it needs ten of each.'}</p>

        ${cancels.byStore.length > 1 ? `
          <div class="mix-head">By store</div>
          ${cancels.byStore.map((r) => `
            <div class="list-row">
              <span class="grow">${esc(storeLabel(r.store))}</span>
              <span class="list-meta">${r.cancelled} of ${r.total}</span>
              <span class="num">${r.rate.toFixed(0)}%</span>
            </div>`).join('')}` : ''}` : ''}
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

    ${pricing.under.length ? `
      <div class="panel panel-warn">
        <div class="panel-title">${pricing.under.length} cake${pricing.under.length === 1 ? '' : 's'} sold under the list price</div>
        <div class="panel-note">
          ${money.format(pricing.shortfall)} below what those sizes list at, across
          ${pricing.checked} priced order${pricing.checked === 1 ? '' : 's'} in the last 30 days.
          Some will be discounts you meant to give; a large gap is usually a missing
          digit. Slices and sizes with no list price are not counted, and a premium
          flavour can only push a price up, so nothing here is flagged for being Rasmalai.
        </div>
        ${pricing.under.slice(0, 8).map((o) =>
          fixRow(o, `${money.format(o.price)} vs ${money.format(o.base)}`)).join('')}
        ${pricing.under.length > 8 ? `<p class="fix-more">and ${pricing.under.length - 8} more</p>` : ''}
      </div>` : ''}

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

    <div class="panel">
      <div class="panel-title">Discounts given</div>
      <div class="panel-note">${board.discountTotal > 0
        ? `Across every order on record, not the last 63 days — a discount given in March still cost what it cost.`
        : 'No discounts recorded against a customer yet.'}</div>
      <div class="list-row"><span class="grow"><strong>Total given away</strong></span>
        <span class="num"><strong>${money.format(board.discountTotal)}</strong></span></div>
      <div class="list-row"><span class="grow">Customers who got one</span>
        <span class="num">${board.discountedCount} of ${board.total}</span></div>
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

    <div class="panel${photos.overdue ? ' panel-warn' : ''}">
      <div class="panel-title">${photos.overdue
        ? `${photos.overdue} design photo${photos.overdue === 1 ? '' : 's'} should already be deleted`
        : 'Photo storage'}</div>
      <div class="panel-note">
        Photos go 14 days after the order, or once a long-lead cake is finished.
        ${photos.overdue
          ? 'The nightly job reports success the moment it fires, so anything still here means it is not actually deleting. Left alone the storage quota fills and photo uploads start failing mid-shift.'
          : 'The nightly job reports success the moment it fires, so this count is the only real check that it works.'}
      </div>
      <div class="list-row"><span class="grow">Photos held</span><span class="num">${photos.held}</span></div>
      <div class="list-row"><span class="grow">Oldest</span><span class="num">${photos.oldestDays} day${photos.oldestDays === 1 ? '' : 's'}</span></div>
      ${photos.overdue ? photos.rows.slice(0, 6).map((o) =>
        fixRow(o, `${Math.floor((now - new Date(o.created_at)) / 86400000)} days old`)).join('') : ''}
      ${photos.overdue > 6 ? `<p class="fix-more">and ${photos.overdue - 6} more</p>` : ''}
    </div>

    <div class="panel">
      <div class="panel-title">Deleted orders</div>
      <div class="panel-note">
        Orders taken off the book entirely, newest first. They are in no figure
        on any page — not takings, not a customer's spend, not the cancellation
        rate — so this is the only record they were ever here. Only an admin can
        delete one${binned.length ? '' : ', and none have been'}.
      </div>
      ${binned.slice(0, 12).map((d) => {
        const row = d.row || {};
        const who = profiles.find((pr) => pr.id === d.deleted_by);
        const price = row.price == null ? null : Number(row.price) - Number(row.discount || 0);
        return `
        <div class="binned">
          <span class="binned-what">
            <span class="binned-no">${esc(d.order_no)}</span>
            <span class="list-meta">${esc(storeLabel(d.store))}${row.customer_name ? ` · ${esc(row.customer_name)}` : ''}${
              price == null ? '' : ` · ${esc(money.format(price))}`}</span>
          </span>
          <span class="binned-who">
            <span>${esc(who?.name || 'Unknown')}</span>
            <span class="list-meta">${esc(dateTimeFmt.format(new Date(d.deleted_at)))}</span>
          </span>
        </div>`;
      }).join('')}
      ${binned.length > 12 ? `<p class="fix-more">and ${binned.length - 12} more</p>` : ''}
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

  if (analyticsPage === 'finance') wireTakings(takings);

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
