// Ops app: view routing, rendering and form handling.
//
// Lives in its own file rather than an inline <script> so the production CSP
// can keep script-src to 'self' plus the pinned CDN, with no 'unsafe-inline'.
// Inlining this would silently break only in production, where the CSP applies.

import {
  sb, PEOPLE, STORES, storeLabel, STATUS_LABEL,
  signIn, signOut, currentProfile, listProfiles,
  listOrders, listToBake, createOrder, updateOrder, setStatus, setCost,
  recentAuthEvents, uploadPhoto, photoUrl,
} from './db.mjs';
import {
  sydneyParts, daysBetween, dayBucket, weekStartKey, summarise, weeklyStats,
  busiestHours, repeatCustomers, bakerSections, paidOn,
  monthGrid, shiftMonth, sydneyDateTimeToISO,
} from './stats.mjs';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const money2 = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const timeFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: 'numeric', minute: '2-digit', hour12: true });
const dateFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short' });
const dateTimeFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

let me = null;          // profile row
let store = null;       // active store tab
let view = 'log';
let orders = [];        // orders for the active view
let peopleById = new Map();

// ── Boot ────────────────────────────────────────────────────────────────────
$('who').innerHTML = PEOPLE.map((p) => `<option value="${esc(p.email)}">${esc(p.name)}</option>`).join('');

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('login-btn'), msg = $('login-msg');
  btn.disabled = true; btn.textContent = 'Signing in…'; msg.textContent = ''; msg.className = 'msg';
  try {
    await signIn($('who').value, $('pw').value);
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
  const owing = Math.max(0, Number(o.price || 0) - paidOn(o));
  const what = [o.size, o.flavour].filter(Boolean).join(' · ');
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
            ${showMoney && owing > 0 ? `<span class="owing">${money.format(owing)} owing</span>` : ''}
          </div>
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

function sectionsForLog(list, now) {
  const buckets = [
    ['Overdue',   []], ['Today', []], ['Tomorrow', []],
    ['This week', []], ['Later', []], ['Collected', []],
  ];
  const by = Object.fromEntries(buckets);
  const thisWeek = weekStartKey(now);

  for (const o of list) {
    const age = daysBetween(sydneyParts(o.due_at).dayKey, sydneyParts(now).dayKey);
    if (['picked_up', 'cancelled'].includes(o.status)) {
      // Finished orders stay for a week and then drop off. Otherwise the log
      // becomes an ever-growing archive that buries the work still to do.
      if (age <= 7) by['Collected'].push(o);
      continue;
    }
    const d = daysBetween(sydneyParts(now).dayKey, sydneyParts(o.due_at).dayKey);
    if (d < 0) by['Overdue'].push(o);
    else if (d === 0) by['Today'].push(o);
    else if (d === 1) by['Tomorrow'].push(o);
    else if (weekStartKey(o.due_at) === thisWeek) by['This week'].push(o);
    else by['Later'].push(o);
  }
  return buckets.filter(([, rows]) => rows.length);
}

async function renderLog() {
  const root = $('view-log');
  root.innerHTML = '<p class="empty"><span class="empty-note">Loading…</span></p>';
  orders = await listOrders({ store, withCosts: me.role === 'admin' });

  const now = new Date();
  const sections = sectionsForLog(orders, now);

  if (!sections.length) {
    root.innerHTML = `<div class="empty">
      <div class="empty-mark">Nothing on the book</div>
      <p class="empty-note">New orders for ${esc(storeLabel(store))} will show up here.<br>Tap <strong>New</strong> to log one.</p>
    </div>`;
    return;
  }

  root.innerHTML = sections.map(([label, rows]) => {
    const date = label === 'Today' || label === 'Tomorrow'
      ? dateFmt.format(new Date(rows[0].due_at)) : '';
    return `
      <div class="section-head ${label === 'Overdue' ? 'is-overdue' : ''}">
        <span class="section-name">${label}</span>
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
  orders = await listToBake();

  const now = new Date();
  const sections = bakerSections(orders, now);

  if (!sections.length) {
    root.innerHTML = `<div class="empty">
      <div class="empty-mark">All caught up</div>
      <p class="empty-note">Nothing waiting to be baked.</p>
    </div>`;
    return;
  }

  root.innerHTML = sections.map(([label, rows]) => `
    <div class="section-head ${label === 'Overdue' ? 'is-overdue' : ''}">
      <span class="section-name">${esc(label)}</span>
      <span class="section-date">${esc(dateFmt.format(new Date(rows[0].due_at)))}</span>
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

    <div class="detail-grid">
      ${field('Customer', o.customer_name)}
      ${field('Phone', o.customer_phone)}
      ${field('Pick up', dateTimeFmt.format(new Date(o.due_at)))}
      ${field('Store', storeLabel(o.store))}
      ${field('Flavour', o.flavour)}
      ${field('Size', o.size)}
      ${field('Wording', o.wording, 'span-2')}
      ${o.design_notes ? field('Design notes', o.design_notes, 'span-2') : ''}
      ${o.notes ? field('Notes', o.notes, 'span-2') : ''}
      ${showMoney ? field('Price', o.price ? money2.format(o.price) : '') : ''}
      ${showMoney ? field('Paid', money2.format(paidOn(o)) + (owing > 0 ? ` · ${money2.format(owing)} owing` : '')) : ''}
      ${me.role === 'admin' ? field('Cost', o.cost != null ? money2.format(o.cost) : '') : ''}
      ${field('Kind', o.kind === 'custom' ? 'Custom cake' : (o.walk_in ? 'Normal · bought in store' : 'Normal · ordered ahead'), 'span-2')}
    </div>

    <hr class="rule">
    <div class="block-label">Status <span id="status-now" class="status-now"></span></div>
    <div class="action-row" id="status-actions"></div>

    ${me.role === 'admin' ? `
      <hr class="rule">
      <div class="block-label">Cost to make <span style="font-weight:400;text-transform:none;letter-spacing:0;">(admin only)</span></div>
      <div class="row-2">
        <input class="input nums" id="cost-input" type="number" step="0.01" min="0"
               inputmode="decimal" placeholder="0.00" value="${o.cost ?? ''}">
        <button class="btn btn-outline" id="cost-save">Save cost</button>
      </div>
      <p class="msg" id="cost-msg" role="status" aria-live="polite"></p>` : ''}

    ${canEdit ? `
      <hr class="rule">
      <div class="block-label">Payment</div>
      <div class="row-2">
        <div><div class="detail-k">Price</div>
          <input class="input nums" id="price-input" type="number" step="0.01" min="0" inputmode="decimal" value="${o.price ?? ''}"></div>
        <div><div class="detail-k">Deposit</div>
          <input class="input nums" id="deposit-input" type="number" step="0.01" min="0" inputmode="decimal" value="${o.deposit ?? 0}"></div>
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
      catch (err) { b.disabled = false; b.textContent = STATUS_LABEL[b.dataset.status]; alert(err.message); }
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
  }
}

// ── New order ───────────────────────────────────────────────────────────────
function openNewOrder() {
  let kind = null;
  let photoFile = null;
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
        <label class="field-label" for="walkin">How was it bought</label>
        <select class="select" id="walkin">
          <option value="later">Ordered for later</option>
          <option value="now">Bought in store now</option>
        </select>
      </div>

      ${mine.length > 1 ? `
        <div class="field">
          <label class="field-label" for="f-store">Store</label>
          <select class="select" id="f-store">
            ${mine.map((s) => `<option value="${s.code}" ${s.code === store ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}
          </select>
        </div>` : ''}

      <div class="row-2">
        <div class="field">
          <label class="field-label" for="f-name">Customer <span class="req">*</span></label>
          <input class="input" id="f-name" required autocomplete="off">
        </div>
        <div class="field">
          <label class="field-label" for="f-phone">Phone</label>
          <input class="input nums" id="f-phone" type="tel" inputmode="tel" autocomplete="off">
        </div>
      </div>

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
          <label class="field-label" for="f-flavour">Flavour</label>
          <input class="input" id="f-flavour" autocomplete="off">
        </div>
        <div class="field">
          <label class="field-label" for="f-size">Size</label>
          <input class="input" id="f-size" placeholder='8 inch' autocomplete="off">
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
        <label class="field-label" for="f-photo">Design photo <span class="req" id="photo-req">*</span></label>
        <div class="photo-drop">
          <span class="photo-shot hidden" id="photo-shot">
            <img class="photo-preview" id="photo-preview" alt="Attached design photo">
            <button type="button" class="photo-remove" id="photo-remove"
                    aria-label="Remove this photo">✕</button>
          </span>
          <div style="flex:1">
            <input type="file" id="f-photo" accept="image/*" capture="environment"
                   style="max-width:100%;font-size:13px;">
            <p class="photo-hint" id="photo-hint">Shrunk before upload, and deleted 14 days after the order.</p>
          </div>
        </div>
      </div>

      <div class="row-2">
        <div class="field">
          <label class="field-label" for="f-price">Price</label>
          <input class="input nums" id="f-price" type="number" step="0.01" min="0" inputmode="decimal">
        </div>
        <div class="field">
          <label class="field-label" for="f-deposit">Deposit taken</label>
          <input class="input nums" id="f-deposit" type="number" step="0.01" min="0" inputmode="decimal" value="0">
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

  body.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => {
    kind = b.dataset.kind;
    body.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('order-form').classList.remove('hidden');
    // A custom cake is defined by its design, so the photo is required and the
    // walk-in question is meaningless. A normal cake is the reverse.
    $('walkin-field').classList.toggle('hidden', kind !== 'normal');
    $('photo-field').classList.toggle('hidden', kind !== 'custom');
    $('design-field').classList.toggle('hidden', kind !== 'custom');
    $('f-photo').required = kind === 'custom';
    $('f-name').focus();
  }));

  // Attaching the wrong photo is easy on a phone, so it has to be undoable.
  const showPhoto = (file) => {
    const prev = $('photo-preview');
    if (prev.dataset.url) URL.revokeObjectURL(prev.dataset.url);
    if (file) {
      const url = URL.createObjectURL(file);
      prev.src = url;
      prev.dataset.url = url;
      $('photo-shot').classList.remove('hidden');
    } else {
      prev.removeAttribute('src');
      delete prev.dataset.url;
      $('photo-shot').classList.add('hidden');
    }
  };

  $('f-photo').addEventListener('change', (e) => {
    photoFile = e.target.files[0] || null;
    showPhoto(photoFile);
  });

  $('photo-remove').addEventListener('click', () => {
    photoFile = null;
    $('f-photo').value = '';   // clears the file input's own "no file chosen" text
    showPhoto(null);
    $('f-photo').focus();
  });

  const due = mountDuePicker();

  $('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('save-order'), msg = $('order-msg');
    const walkIn = kind === 'normal' && $('walkin').value === 'now';

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
        store: mine.length > 1 ? $('f-store').value : mine[0].code,
        kind,
        walk_in: walkIn,
        customer_name: $('f-name').value.trim(),
        customer_phone: $('f-phone').value.trim() || null,
        due_at: due.value(),
        flavour: $('f-flavour').value.trim() || null,
        size: $('f-size').value.trim() || null,
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
          alert(`Order ${order.order_no} saved, but the photo did not upload: ${err.message}\n\nOpen the order to try again.`);
          return;
        }
      }

      closeSheet();
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
function mountDuePicker() {
  const btn    = $('f-due-btn');
  const panel  = $('f-due-cal');
  const label  = $('f-due-label');
  const hidden = $('f-due');

  const today = sydneyParts(new Date());
  let view = { year: today.year, month: today.month };
  let selected = null;
  let hour = 15, minute = 0;   // 3pm: a sane default pickup, still overridable

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
        <select class="select nums" id="cal-h" aria-label="Hour">
          ${Array.from({ length: 12 }, (_, i) => i + 1).map((h) =>
            `<option value="${h}"${h === h12 ? ' selected' : ''}>${h}</option>`).join('')}
        </select>
        <span class="cal-colon">:</span>
        <select class="select nums" id="cal-m" aria-label="Minute">
          ${Array.from({ length: 12 }, (_, i) => i * 5).map((m) =>
            `<option value="${m}"${m === minute ? ' selected' : ''}>${pad(m)}</option>`).join('')}
        </select>
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

    const setTime = () => {
      const h = Number($('cal-h').value) % 12;
      hour = h + (panel.querySelector('[data-ampm="pm"]').getAttribute('aria-pressed') === 'true' ? 12 : 0);
      minute = Number($('cal-m').value);
      commit();
    };
    $('cal-h').addEventListener('change', () => { setTime(); paint(); });
    $('cal-m').addEventListener('change', () => { setTime(); paint(); });
    panel.querySelectorAll('[data-ampm]').forEach((b) => b.addEventListener('click', () => {
      panel.querySelectorAll('[data-ampm]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      setTime();
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
    listOrders({ since, withCosts: true }),
    listProfiles(),
    recentAuthEvents(12),
  ]);
  peopleById = new Map(profiles.map((p) => [p.id, p]));
  orders = all;

  const now = new Date();
  const todayKey = sydneyParts(now).dayKey;
  const today = all.filter((o) => sydneyParts(o.due_at).dayKey === todayKey);
  const last7 = all.filter((o) => {
    const d = daysBetween(sydneyParts(o.due_at).dayKey, todayKey);
    return d >= 0 && d < 7;
  });

  const w = weeklyStats(all, now);
  const s7 = summarise(last7);
  const sToday = summarise(today);
  const dRev = delta(w.thisWeek.revenue, w.lastWeek.revenue);
  const dCount = delta(w.thisWeek.count, w.lastWeek.count);

  // Money still to collect, on cakes not yet handed over.
  const open = all.filter((o) => !['picked_up', 'cancelled'].includes(o.status));
  const owingRows = open
    .map((o) => ({ o, owing: Number(o.price || 0) - paidOn(o) }))
    .filter((r) => r.owing > 0)
    .sort((a, b) => new Date(a.o.due_at) - new Date(b.o.due_at));
  const owingTotal = owingRows.reduce((t, r) => t + r.owing, 0);

  // Eight trailing weeks of revenue by pickup date.
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const key = weekStartKey(new Date(Date.now() - i * 7 * 86400000));
    const rows = all.filter((o) => weekStartKey(o.due_at) === key);
    weeks.push({ key, revenue: summarise(rows).revenue });
  }
  const peak = Math.max(1, ...weeks.map((x) => x.revenue));

  const hours = busiestHours(last7);
  const peakHour = hours.indexOf(Math.max(...hours));
  const hourLabel = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;

  const repeat = repeatCustomers(all);
  const byStore = STORES.map((s) => ({ ...s, sum: summarise(last7.filter((o) => o.store === s.code)) }));

  root.innerHTML = `
    <div class="stat-grid">
      <div class="stat">
        <div class="stat-k">This week</div>
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
        <div class="stat-k">Due today</div>
        <div class="stat-v">${sToday.count}</div>
        <div class="stat-delta flat">${money.format(sToday.revenue)} booked</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">Revenue, last 8 weeks</div>
      <div class="panel-note">By pickup date, Monday weeks.</div>
      <div class="bars">
        ${weeks.map((x, i) => `
          <div class="bar-col">
            <div class="bar ${i === weeks.length - 1 ? '' : 'is-quiet'}"
                 style="height:${Math.round((x.revenue / peak) * 76)}px"
                 title="${esc(x.key)} · ${money.format(x.revenue)}"></div>
            <div class="bar-label">${esc(x.key.slice(8))}/${esc(x.key.slice(5, 7))}</div>
          </div>`).join('')}
      </div>
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
      <div class="panel-title">By store, last 7 days</div>
      <div class="panel-note">Pickups counted against the store they were collected from.</div>
      ${byStore.map((s) => `
        <div class="list-row">
          <span class="grow">${esc(s.label)}</span>
          <span class="list-meta">${s.sum.count} orders</span>
          <span class="num">${money2.format(s.sum.revenue)}</span>
        </div>`).join('')}
    </div>

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
      <div class="panel-title">Busiest pickup times</div>
      <div class="panel-note">${last7.length
        ? `Last 7 days. Peak around ${hourLabel(peakHour)}.`
        : 'No pickups in the last 7 days yet.'}</div>
      <div class="bars">
        ${hours.map((c, h) => (h >= 7 && h <= 20) ? `
          <div class="bar-col">
            <div class="bar ${c ? '' : 'is-quiet'}" style="height:${Math.round((c / Math.max(1, ...hours)) * 76)}px"
                 title="${hourLabel(h)} · ${c}"></div>
            <div class="bar-label">${[8, 12, 16, 20].includes(h) ? hourLabel(h) : ''}</div>
          </div>` : '').join('')}
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">Customers</div>
      <div class="panel-note">Matched on phone number, so the same person typed different ways counts once.</div>
      <div class="list-row"><span class="grow">One order only</span><span class="num">${repeat.newCount}</span></div>
      <div class="list-row"><span class="grow">Come back</span><span class="num">${repeat.returningCount}</span></div>
      ${repeat.top.slice(0, 5).map((c) => `
        <div class="list-row">
          <span class="grow">${esc(c.name)}</span>
          <span class="list-meta">${c.orders} orders</span>
          <span class="num">${money2.format(c.spend)}</span>
        </div>`).join('')}
    </div>

    <div class="panel">
      <div class="panel-title">Who's been on</div>
      <div class="panel-note">Sign-ins and sign-outs, most recent first.</div>
      ${events.length ? events.map((e) => `
        <div class="list-row">
          <span class="grow">${esc(peopleById.get(e.user_id)?.name || 'Unknown')}</span>
          <span class="list-meta">${e.event === 'login' ? 'signed in' : 'signed out'}</span>
          <span class="num list-meta">${esc(dateTimeFmt.format(new Date(e.at)))}</span>
        </div>`).join('') : '<div class="list-row"><span class="grow list-meta">Nothing recorded yet.</span></div>'}
    </div>
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
