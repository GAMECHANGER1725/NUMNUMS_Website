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
} from './db.mjs';
import {
  sydneyParts, daysBetween, dayBucket, weekStartKey, summarise, weeklyStats,
  busiestHours, repeatCustomers, bakerSections, paidOn,
  monthGrid, shiftMonth, sydneyDateTimeToISO,
  dayLabel, soldWithin, salesByWeek, logSections, inDateRange, inStoreTally,
  missingPrice, searchOrders, byWeekday, leadTimes, missingPhone, WEEKDAYS,
} from './stats.mjs';
import { SIZES, FLAVOURS, basePrice, isPremium } from './catalog.mjs';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const money2 = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
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
  analytics: { label: 'Analytics', roles: ['admin'],          icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' },
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
  $('view-title').textContent = view === 'bake' ? 'To bake' : view === 'analytics' ? 'Analytics' : 'Orders';
  $('store-switch').classList.toggle('hidden',
    view !== 'log' || STORES.filter((s) => me.stores.includes(s.code)).length < 2);
  $('logbar').classList.toggle('hidden', view !== 'log');
  $('logsearch-row').classList.toggle('hidden', view !== 'log');
  if (view !== 'log') closeRange();

  for (const v of ['log', 'bake', 'analytics']) $(`view-${v}`).classList.toggle('hidden', v !== view);

  if (view === 'log') await renderLog();
  else if (view === 'bake') await renderBake();
  else await renderAnalytics();
}

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
        ${o.kind === 'custom' ? '<span class="tag tag-custom">Custom</span>' : ''}
        ${o.walk_in ? '<span class="tag tag-walkin">In store</span>' : ''}
        ${showStore ? `<span class="tag tag-store">${esc(storeLabel(o.store))}</span>` : ''}
        <span class="docket-when">${timeFmt.format(new Date(o.due_at))}</span>
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

async function renderLog() {
  const root = $('view-log');
  root.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';
  orders = await listOrders({ store, withCosts: me.role === 'admin' });

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

async function renderBake() {
  const root = $('view-bake');
  root.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';

  // The queue is what to make next; the tally is what already walked out the
  // door. Both matter to the baker: without the tally he restocks the counter
  // from memory and guesses which flavours moved.
  const twoDays = new Date(Date.now() - 3 * 86400000).toISOString();
  const [queue, recent] = await Promise.all([
    listToBake(),
    listOrders({ since: twoDays }),
  ]);
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

  const sections = bakerSections(queue, now);

  if (!sections.length) {
    root.innerHTML = tallyPanel + `<div class="empty">
      <div class="empty-mark">All caught up</div>
      <p class="empty-note">Nothing waiting to be baked.</p>
    </div>`;
    return;
  }

  root.innerHTML = tallyPanel + sections.map(([label, rows]) => `
    <div class="section-head ${label === 'Overdue' ? 'is-overdue' : ''}">
      <span class="section-name">${esc(label)}</span>
      ${label !== 'Overdue' ? `<span class="section-date">${esc(dateFmt.format(new Date(rows[0].due_at)))}</span>` : ''}
      <span class="section-count">${rows.length}</span>
    </div>
    ${rows.map((o) => docketHtml(o, now, { showStore: true })).join('')}`).join('');

  wireDockets(root);
  hydrateThumbs(root);
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

function openSheet(title, bodyHtml) {
  document.body.style.overflow = 'hidden';
  $('sheet-root').innerHTML = `
    <div class="sheet-scrim" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
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
      ${showMoney ? field('Price', o.price ? money2.format(o.price) : '') : ''}
      ${showMoney ? field('Paid', owing > 0
        ? `${money2.format(paidOn(o))} of ${money2.format(o.price || 0)} — ${money2.format(owing)} still to collect`
        : money2.format(paidOn(o))) : ''}
      ${me.role === 'admin' ? field('Cost', o.cost != null ? money2.format(o.cost) : '') : ''}
      ${field('Kind', o.kind === 'custom' ? 'Custom cake' : (o.walk_in ? 'Normal · bought in store' : 'Normal · ordered ahead'), 'span-2')}
    </div>

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
          ${c.order_count} orders · ${money2.format(Number(c.spend || 0))} all up
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

  $('status-actions').querySelectorAll('[data-status]').forEach((b) =>
    b.addEventListener('click', async () => {
      b.disabled = true; b.textContent = 'Saving…';
      try { await setStatus(o.id, b.dataset.status); closeSheet(); await render(); }
      catch (err) {
        b.disabled = false;
        b.textContent = STATUS_LABEL[b.dataset.status];
        toast(err.message, 'error');
      }
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
          options: SIZES.map((sz) => ({ value: sz.code, label: sz.label, note: sz.price ? money2.format(sz.price) : null })),
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
  `);

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
    options: SIZES.map((sz) => ({
      value: sz.code,
      label: sz.label,
      note: sz.price ? money2.format(sz.price) : null,
    })),
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

// ── Analytics ───────────────────────────────────────────────────────────────
const delta = (now, before) => {
  if (!before) return { cls: 'flat', text: before === 0 && now > 0 ? 'first week' : '—' };
  const pct = ((now - before) / before) * 100;
  return {
    cls: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat',
    text: `${pct > 0 ? '▲' : pct < 0 ? '▼' : '·'} ${Math.abs(pct).toFixed(0)}% vs last week`,
  };
};

async function renderAnalytics() {
  const root = $('view-analytics');
  root.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';

  const since = new Date(Date.now() - 63 * 86400000).toISOString();
  const [all, profiles, events] = await Promise.all([
    // includeOpen keeps money still owed on old orders visible no matter how
    // long ago it was ordered — that debt is the whole point of tracking it.
    listOrders({ since, withCosts: true, includeOpen: true }),
    listProfiles(),
    recentAuthEvents(40),
  ]);
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

  // Eight trailing weeks of sales.
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const key = weekStartKey(new Date(Date.now() - i * 7 * 86400000));
    weeks.push({ key, revenue: summarise(all.filter((o) => weekStartKey(o.created_at) === key)).revenue });
  }
  const peak = Math.max(1, ...weeks.map((x) => x.revenue));

  const hours = busiestHours(all.filter((o) => {
    const d = daysBetween(sydneyParts(o.due_at).dayKey, todayKey);
    return d >= 0 && d < 30;             // pickups that have actually happened
  }));
  const peakHour = hours.indexOf(Math.max(...hours));
  const hourLabel = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;

  const repeat = repeatCustomers(all);
  const byStore = STORES.map((st) => ({ ...st, sum: summarise(sold7.filter((o) => o.store === st.code)) }));

  // What sells: flavour and size mix over the last 30 days of sales.
  const mix = (field) => {
    const m = new Map();
    for (const o of sold30) {
      if (o.status === 'cancelled') continue;
      const k = o[field] || '—';
      const row = m.get(k) || { k, count: 0, revenue: 0 };
      row.count += 1;
      row.revenue += Number(o.price || 0);
      m.set(k, row);
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  };
  const flavourMix = mix('flavour');
  const sizeMix = mix('size');

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

  root.innerHTML = `
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

    <div class="panel">
      <div class="panel-title">Today</div>
      <div class="panel-note">What is happening in the shop right now.</div>
      <div class="list-row"><span class="grow">Cakes due for pickup today</span><span class="num">${sDueToday.count}</span></div>
      <div class="list-row"><span class="grow">Orders taken today</span><span class="num">${sToday.count}</span></div>
      <div class="list-row"><span class="grow">Still to be baked</span><span class="num">${all.filter((o) => o.status === 'placed').length}</span></div>
    </div>

    ${noPhone.length ? `
      <div class="panel panel-warn">
        <div class="panel-title">${noPhone.length} order${noPhone.length === 1 ? '' : 's'} with no phone number</div>
        <div class="panel-note">These customers can never be matched to another order, so the repeat rate above reads lower than it really is.</div>
      </div>` : ''}

    ${noPrice.length ? `
      <div class="panel panel-warn">
        <div class="panel-title">${noPrice.length} order${noPrice.length === 1 ? '' : 's'} with no price</div>
        <div class="panel-note">Every figure on this page is understated by whatever these were worth. Open each one and add the price.</div>
        ${noPrice.slice(0, 6).map((o) => `
          <div class="list-row">
            <span class="num">${esc(o.order_no)}</span>
            <span class="grow">${esc(o.customer_name)}</span>
            <span class="list-meta">${esc(dateFmt.format(new Date(o.created_at)))}</span>
          </div>`).join('')}
      </div>` : ''}

    <div class="panel">
      <div class="panel-title">Sales, last 8 weeks</div>
      <div class="panel-note">By the date the order was taken, Monday weeks.</div>
      <div class="bars">
        ${weeks.map((x, i) => `
          <div class="bar-col">
            <div class="bar ${i === weeks.length - 1 ? '' : 'is-quiet'}"
                 style="height:${bar(x.revenue, peak)}px"
                 title="${esc(x.key)} · ${money.format(x.revenue)}"></div>
            <div class="bar-label">${esc(x.key.slice(8))}/${esc(x.key.slice(5, 7))}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">By store, last 7 days</div>
      <div class="panel-note">Counted against the store that took the order.</div>
      ${byStore.map((st) => `
        <div class="list-row">
          <span class="grow">${esc(st.label)}</span>
          <span class="list-meta">${st.sum.count} order${st.sum.count === 1 ? '' : 's'}</span>
          <span class="num">${money2.format(st.sum.revenue)}</span>
        </div>`).join('')}
    </div>

    <div class="panel">
      <div class="panel-title">Margin, last 7 days</div>
      <div class="panel-note">
        ${s7.costedCount
          ? `Across the ${s7.costedCount} of ${s7.count} orders with a cost recorded. Rent, wages and power are not included.`
          : 'No costs recorded yet — add a cost on an order to see margin here.'}
      </div>
      ${s7.margin != null ? `
        <div class="list-row"><span class="grow">Revenue</span><span class="num">${money2.format(s7.revenue)}</span></div>
        <div class="list-row"><span class="grow">Cost recorded</span><span class="num">${money2.format(s7.cost)}</span></div>
        <div class="list-row"><span class="grow"><strong>Gross margin</strong></span>
          <span class="num"><strong>${money2.format(s7.margin)}</strong> · ${s7.marginPct.toFixed(0)}%</span></div>` : ''}
    </div>

    <div class="panel">
      <div class="panel-title">How people buy, last 30 days</div>
      <div class="panel-note">Walk-ins are cakes bought off the counter; ordered ahead are booked in advance.</div>
      <div class="list-row"><span class="grow">Bought in store</span>
        <span class="list-meta">${walkIns.length} cake${walkIns.length === 1 ? '' : 's'}</span>
        <span class="num">${money2.format(summarise(walkIns).revenue)}</span></div>
      <div class="list-row"><span class="grow">Ordered ahead</span>
        <span class="list-meta">${aheadOrders.length} cake${aheadOrders.length === 1 ? '' : 's'}</span>
        <span class="num">${money2.format(summarise(aheadOrders).revenue)}</span></div>
    </div>

    ${flavourMix.length ? `
      <div class="panel">
        <div class="panel-title">What sells, last 30 days</div>
        <div class="panel-note">Top flavours and sizes by number of cakes.</div>
        <div class="mix-head">Flavour</div>
        ${flavourMix.slice(0, 6).map((r) => `
          <div class="list-row">
            <span class="grow">${esc(r.k)}</span>
            <span class="meter"><span class="meter-fill" style="width:${bar(r.count, flavourMix[0].count, 100)}%"></span></span>
            <span class="num">${r.count}</span>
          </div>`).join('')}
        <div class="mix-head">Size</div>
        ${sizeMix.slice(0, 6).map((r) => `
          <div class="list-row">
            <span class="grow">${esc(r.k)}</span>
            <span class="meter"><span class="meter-fill" style="width:${bar(r.count, sizeMix[0].count, 100)}%"></span></span>
            <span class="num">${r.count}</span>
          </div>`).join('')}
      </div>` : ''}

    <div class="panel">
      <div class="panel-title">Still to collect</div>
      <div class="panel-note">${owingRows.length
        ? `${money2.format(owingTotal)} across ${owingRows.length} order${owingRows.length === 1 ? '' : 's'} not yet handed over.`
        : 'Nothing outstanding.'}</div>
      ${owingRows.slice(0, 8).map((r) => `
        <div class="list-row">
          <span class="num">${esc(r.o.order_no)}</span>
          <span class="grow">${esc(r.o.customer_name)}</span>
          <span class="list-meta">${esc(dateFmt.format(new Date(r.o.due_at)))}</span>
          <span class="num owing">${money2.format(r.owing)}</span>
        </div>`).join('')}
    </div>

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

    <div class="panel">
      <div class="panel-title">Customers</div>
      <div class="panel-note">
        Matched on phone number, over every order on record. Repeat customer rate is
        the share who have ordered more than once — the clearest read on whether the
        cakes bring people back, and it needs no extra data entry.
      </div>
      <div class="rcr">
        <div class="rcr-num">${repeat.rate.toFixed(0)}<span class="rcr-pct">%</span></div>
        <div class="rcr-side">
          <div class="rcr-label">Repeat customer rate</div>
          <div class="meter meter-wide"><span class="meter-fill" style="width:${Math.min(100, repeat.rate).toFixed(1)}%"></span></div>
          <div class="list-meta">${repeat.returningCount} of ${repeat.total} customers have come back</div>
        </div>
      </div>
      <div class="list-row"><span class="grow">Ordered once</span><span class="num">${repeat.newCount}</span></div>
      <div class="list-row"><span class="grow">Came back</span><span class="num">${repeat.returningCount}</span></div>
      ${repeat.top.length ? '<div class="mix-head">Who comes back most</div>' : ''}
      ${repeat.top.slice(0, 6).map((c) => `
        <div class="list-row">
          <span class="grow">${esc(c.name)}</span>
          <span class="repeat-chip">${c.orders}×</span>
          <span class="num">${money2.format(c.spend)}</span>
        </div>`).join('')}
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
              <span class="num">${money2.format(r.revenue)}</span>
              <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
            </summary>
            ${r.orders.slice(0, 25).map((o) => `
              <div class="list-row">
                <span class="num">${esc(o.order_no)}</span>
                <span class="grow">${esc(o.customer_name)}</span>
                <span class="list-meta">${esc(takenFmt.format(new Date(o.created_at)))}</span>
                <span class="num">${o.price ? money2.format(o.price) : '—'}</span>
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
  `;
}

// ── Keep a waking phone current ─────────────────────────────────────────────
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && me && !$('sheet-root').innerHTML) render();
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
