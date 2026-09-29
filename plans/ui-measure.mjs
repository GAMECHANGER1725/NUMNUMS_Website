// N1/N8 walker. Usage: node measure.mjs <baseline|after>
// Deterministic: same selectors, same order, same viewports every run.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const ROOT = '/Users/vaidikpatel/Downloads/Home/Num Nums Bakery/Website';
const require = createRequire(ROOT + '/package.json');
const puppeteer = require('puppeteer');

const KEY = process.argv[2] || 'baseline';
const BASE = 'http://localhost:4000';
const SHOTS = `${ROOT}/temporary screenshots`;
mkdirSync(SHOTS, { recursive: true });
const VPS = {
  m390: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  d1440: { width: 1440, height: 900 },
};
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r2 = (n) => Math.round(n * 100) / 100;

async function open(browser, vpKey) {
  const vp = VPS[vpKey];
  const page = await browser.newPage();
  await page.setViewport(vp);
  if (vp.isMobile) await page.setUserAgent(IPHONE);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 180)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 180)));
  await page.evaluateOnNewDocument(() => {
    window.__cls = 0;
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {}
    window.open = (u) => { window.__opened = String(u); return null; };
  });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (/googletagmanager|google-analytics|facebook\.(net|com)|doubleclick|clarity\.ms/.test(r.url())) r.abort();
    else r.continue();
  });
  return { page, errors, vp, vpKey };
}

async function settle(page, ms = 1300) {
  await page.waitForNetworkIdle({ idleTime: 400, timeout: 9000 }).catch(() => {});
  await sleep(ms);
}

async function pageFacts(page) {
  return page.evaluate(() => ({
    path: location.pathname,
    hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    cls: Math.round((window.__cls || 0) * 1000) / 1000,
    popup: !!document.querySelector('.nnp-backdrop'),
  }));
}

/** First visible element for a selector (optionally filtered by text). */
async function find(page, sel, text) {
  const hs = await page.$$(sel);
  for (const h of hs) {
    const ok = await h.evaluate((e, text) => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || cs.display === 'none') return false;
      // Ancestor display only: .reveal sections sit at opacity 0 until scrolled to.
      let p = e;
      while (p) { if (getComputedStyle(p).display === 'none') return false; p = p.parentElement; }
      if (e.closest('[aria-hidden="true"]')) return false;
      return !text || e.textContent.includes(text);
    }, text);
    if (ok) return h;
  }
  return null;
}

function newRun(ctx, path) {
  return { ctx, path, taps: 0, scroll: 0, steps: [], blockers: [], pages: [], shot: 0 };
}

async function shot(run, label) {
  const f = `ui-${KEY}-${run.ctx.vpKey}-${run.path}-${String(++run.shot).padStart(2, '0')}-${label}.png`;
  await run.ctx.page.screenshot({ path: `${SHOTS}/${f}` });
}

async function tap(run, handle, label) {
  const { page, vp } = run.ctx;
  if (!handle) { run.blockers.push(`missing target: ${label}`); throw new Error('missing ' + label); }
  const pre = await handle.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { absBottom: r.bottom + scrollY, absTop: r.top + scrollY, h: r.height, w: r.width };
  });
  const foldScreens = r2(Math.max(0, (pre.absBottom - vp.height) / vp.height));
  const y0 = await page.evaluate(() => scrollY);
  await handle.evaluate((e) => e.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
  await sleep(350);
  // A fixed header can sit over a target scrolled to the top edge.
  let occ = await handle.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + Math.min(r.height / 2, 20);
    const at = document.elementFromPoint(x, y);
    if (!at || e.contains(at) || at.contains(e)) return null;
    return (at.id ? '#' + at.id : '') + '.' + String(at.className || '').split(' ')[0] + ` @y${Math.round(y)}`;
  });
  if (occ) { await page.evaluate(() => scrollBy(0, -120)); await sleep(250); }
  const y1 = await page.evaluate(() => scrollY);
  run.scroll += Math.abs(y1 - y0);
  occ = await handle.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const at = document.elementFromPoint(x, y);
    if (!at || e.contains(at) || at.contains(e)) return null;
    return (at.id ? '#' + at.id : '') + '.' + String(at.className || '').split(' ')[0];
  });
  if (occ) {
    run.blockers.push(`${label}: covered by ${occ}`);
    await handle.evaluate((e) => e.click());
  } else if (vp.isMobile) await handle.tap();
  else await handle.click();
  run.taps++;
  run.steps.push({ label, fold_screens: foldScreens, scrolled: Math.abs(y1 - y0), size: `${Math.round(pre.w)}x${Math.round(pre.h)}` });
}

async function record(run) {
  const f = await pageFacts(run.ctx.page);
  run.pages.push(f);
  if (f.hscroll) run.blockers.push(`horizontal scroll on ${f.path} (${f.scrollWidth}px)`);
}

async function go(run, url) {
  await run.ctx.page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await settle(run.ctx.page);
}

async function waitPath(page, prefix) {
  await page.waitForFunction((p) => location.pathname.startsWith(p), { timeout: 12000 }, prefix);
  await settle(page, 900);
}

/* ── P1: normal cake ──────────────────────────────────────────────────── */
async function p1(browser, vpKey) {
  const ctx = await open(browser, vpKey);
  const run = newRun(ctx, 'P1');
  const { page } = ctx;
  try {
    await go(run, '/');
    await record(run); await shot(run, 'home');
    let link = await find(page, 'nav a[href="/shop"]');
    if (!link) {
      await tap(run, await find(page, '#mobile-menu-btn'), 'open menu');
      await sleep(900);
      link = await find(page, '#mobile-menu a[href="/shop"]');
    }
    await tap(run, link, 'nav → /shop');
    await waitPath(page, '/shop');
    await record(run); await shot(run, 'shop');
    await tap(run, await find(page, 'main a.cake-card'), 'first cake card');
    await waitPath(page, '/shop/cakes/');
    run.slug = await page.evaluate(() => location.pathname);
    await record(run); await shot(run, 'product');
    await tap(run, await find(page, 'main button.btn-cta', 'Add to order'), 'add to order');
    await sleep(600);
    await tap(run, await find(page, 'main a[href="/shop/cart"]', 'Your order'), 'go to cart');
    await waitPath(page, '/shop/cart');
    await record(run); await shot(run, 'cart');
    await tap(run, await find(page, '#c-store label'), 'pick shop');
    await sleep(300);
    await tap(run, await find(page, '.nd-cal-day:not([disabled])'), 'pick day');
    await sleep(500);
    await tap(run, await find(page, '.nn-time-row'), 'pick time');
    await sleep(500);
    await shot(run, 'cart-ready');
    // A phone user taps the sticky bar if it is up; otherwise the summary button.
    const sticky = await find(page, 'div.fixed button.btn-cta');
    const resP = page.waitForResponse((r) => r.url().includes('/api/create-checkout'), { timeout: 8000 }).catch(() => null);
    await tap(run, sticky || await find(page, 'aside button.btn-cta'), sticky ? 'pay (sticky bar)' : 'pay (summary)');
    const res = await resP;
    run.checkout = res ? res.status() : 'no request';
    if (res && res.status() === 404) run.env = 'create-checkout is a Netlify function; serve.mjs cannot run it, so the Stripe hop stops here locally';
    await sleep(700);
    await shot(run, 'after-pay');
  } catch (e) { run.error = String(e.message).slice(0, 200); }
  run.errors = ctx.errors;
  await page.close();
  return run;
}

/* ── P2: custom cake ──────────────────────────────────────────────────── */
async function p2(browser, vpKey) {
  const ctx = await open(browser, vpKey);
  const run = newRun(ctx, 'P2');
  const { page } = ctx;
  try {
    await go(run, '/');
    await record(run);
    await tap(run, await find(page, '.hero-content a[href="/order"]'), 'hero → /order');
    await waitPath(page, '/order');
    await record(run); await shot(run, 'order');
    await tap(run, await find(page, 'label.loc-btn'), 'pick shop');
    await tap(run, await find(page, '#cal-grid .nd-cal-day:not([disabled])'), 'pick day');
    await sleep(400);
    await tap(run, await find(page, '#when-times .nn-time-row'), 'pick time');
    await sleep(300);
    await tap(run, await find(page, '#cake-name'), 'name field');
    await page.keyboard.type('Priya');
    for (const [id, label] of [['cake-flavour', 'flavour'], ['cake-size', 'size']]) {
      await tap(run, await page.evaluateHandle((id) => document.getElementById(id).parentElement.querySelector('.nd-btn'), id), `${label} menu`);
      await sleep(300);
      await tap(run, await page.evaluateHandle((id) => document.getElementById(id).parentElement.querySelector('.nd-opt'), id), `${label} option`);
      await sleep(250);
    }
    await shot(run, 'order-filled');
    await tap(run, await find(page, '#cake-order-form button[type="submit"]'), 'submit');
    await sleep(500);
    const modal = await find(page, '#pricing-confirm-continue');
    if (modal) { await shot(run, 'pricing-modal'); await tap(run, modal, 'confirm pricing modal'); }
    await sleep(300);
    run.opened = await page.evaluate(() => (window.__opened || '').slice(0, 40));
    if (!run.opened.includes('wa.me')) run.blockers.push('WhatsApp link never opened');
  } catch (e) { run.error = String(e.message).slice(0, 200); }
  run.errors = ctx.errors;
  await page.close();
  return run;
}

/* ── P3: shared chrome ────────────────────────────────────────────────── */
const NAV_PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'color', 'paddingTop', 'paddingLeft', 'height', 'lineHeight'];
async function navStyles(page) {
  return page.evaluate((props) => {
    const pick = (e) => { if (!e) return null; const cs = getComputedStyle(e); const o = {}; for (const p of props) o[p] = p === 'height' ? Math.round(e.getBoundingClientRect().height) + 'px' : cs[p]; return o; };
    const links = [...document.querySelectorAll('nav a, header a')].filter((a) => a.getBoundingClientRect().width > 0);
    // Indian Sweets is the active page on neither surface, so state cannot differ.
    const shop = links.find((a) => a.textContent.trim() === 'Indian Sweets');
    const cart = document.querySelector('#nav-cart') || document.querySelector('nav a.nn-cta');
    const c = cart && getComputedStyle(cart);
    return {
      link: pick(shop),
      cart: cart ? { text: cart.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), bg: c.backgroundColor, color: c.color, radius: c.borderRadius, height: Math.round(cart.getBoundingClientRect().height) + 'px', fontSize: c.fontSize, fontWeight: c.fontWeight, visible: cart.getBoundingClientRect().width > 0 } : null,
    };
  }, NAV_PROPS);
}
async function smallTargets(page) {
  return page.evaluate(() => [...document.querySelectorAll('nav a, nav button, body > header a, body > header button, body > div > header a, #mobile-menu-btn')]
    .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 32 || r.height < 32); })
    .map((e) => `${(e.textContent.trim() || e.getAttribute('aria-label') || e.tagName).slice(0, 24)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
}
async function p3(browser, vpKey) {
  const ctx = await open(browser, vpKey);
  const run = newRun(ctx, 'P3');
  const { page } = ctx;
  try {
    await go(run, '/locations');
    await record(run);
    const staticNav = await navStyles(page);
    const staticSmall = await smallTargets(page);
    await go(run, '/shop');
    await record(run);
    const shopNav = await navStyles(page);
    const shopSmall = await smallTargets(page);
    // Font stacks differ only by next/font's metric-matched fallback name.
    const norm = (k, v) => (k === 'fontFamily' && v ? v.replace(/, "Jost Fallback"/, '') : v);
    const diffs = [];
    const cmp = (part, a, b) => { a = a || {}; b = b || {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (k !== 'text' && norm(k, a[k]) !== norm(k, b[k])) diffs.push(`${part}.${k}: static=${a[k]} shop=${b[k]}`);
    };
    cmp('link', staticNav.link, shopNav.link);
    run.nav = { static: staticNav, shop: shopNav, diffs, small_static: staticSmall, small_shop: shopSmall };
    for (const s of [...staticSmall.map((x) => 'static ' + x), ...shopSmall.map((x) => 'shop ' + x)]) run.blockers.push(`tap target <32px: ${s}`);

    // Popup: a fresh visitor on the homepage, reading the hero for 6 seconds.
    await page.evaluate(() => { try { sessionStorage.clear(); localStorage.clear(); } catch {} });
    const t0 = Date.now();
    await go(run, '/');
    await page.waitForSelector('.nnp-backdrop', { timeout: 7000 }).catch(() => null);
    const popAt = await page.$('.nnp-backdrop') ? Date.now() - t0 : null;
    run.popup = { opened_after_ms: popAt };
    if (popAt != null) {
      await sleep(600);
      await shot(run, 'popup');
      run.popup.close = await page.evaluate(() => { const x = document.querySelector('.nnp-x'); if (!x) return null; const r = x.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; });
      run.popup.scrollLocked = await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden' || getComputedStyle(document.documentElement).overflow === 'hidden');
      run.blockers.push(`offer popup covers the homepage after ${Math.round(popAt / 100) / 10}s`);
      await tap(run, await find(page, '.nnp-x'), 'dismiss popup');
      await sleep(400);
    }
    // Cart pill with one cake in the cart, from a static page to the cart.
    await page.evaluate(() => localStorage.setItem('nn_cart_v1', JSON.stringify({ store: '', dueDate: '', dueMin: 0, lines: [{ size: '8 inch', flavour: 'Chocolate', wording: '', qty: 1 }], coupon: null })));
    await go(run, '/locations');
    await record(run);
    await shot(run, 'pill-with-cake');
    run.pill_static = await navStyles(page).then((n) => n.cart);
    let pill = await find(page, '#nav-cart');
    if (!pill) pill = await find(page, 'a[href="/shop/cart"]');
    if (!pill) {
      run.blockers.push('no visible cart pill with a cake in the cart');
      await tap(run, await find(page, '#mobile-menu-btn'), 'open menu');
      await sleep(900);
      pill = await find(page, '#mobile-menu a[href="/shop/cart"]');
    }
    await tap(run, pill, 'cart pill → cart');
    await waitPath(page, '/shop/cart');
    await record(run);
    // The same pill, same cart, on the shop's own board.
    await go(run, '/shop');
    run.pill_shop = await navStyles(page).then((n) => n.cart);
    cmp('cart', run.pill_static, run.pill_shop);
    if (diffs.length) run.blockers.push(`${diffs.length} nav style differences static vs shop`);
  } catch (e) { run.error = String(e.message).slice(0, 200); }
  run.errors = ctx.errors;
  await page.close();
  return run;
}

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const out = {};
for (const vpKey of Object.keys(VPS)) {
  for (const [name, fn] of [['P1', p1], ['P2', p2], ['P3', p3]]) {
    const r = await fn(browser, vpKey);
    delete r.ctx;
    out[`${name}@${vpKey}`] = {
      taps: r.taps,
      scroll_px: Math.round(r.scroll),
      cta_fold_screens: r.steps[0]?.fold_screens ?? null,
      blockers: [...new Set(r.blockers)],
      console_errors: [...new Set(r.errors)],
      cls_max: Math.max(0, ...r.pages.map((p) => p.cls)),
      steps: r.steps,
      pages: r.pages,
      ...(r.slug && { slug: r.slug }), ...(r.checkout && { checkout_status: r.checkout }), ...(r.env && { env: r.env }),
      ...(r.opened && { opened: r.opened }), ...(r.popup && { popup: r.popup }), ...(r.nav && { nav: r.nav }),
      ...(r.pill_static && { pill_static: r.pill_static, pill_shop: r.pill_shop }), ...(r.error && { error: r.error }),
    };
  }
}
await browser.close();
const statePath = `${ROOT}/plans/ui-graph-state.json`;
const state = JSON.parse(readFileSync(statePath, 'utf8'));
state[KEY] = out;
writeFileSync(statePath, JSON.stringify(state, null, 2));
for (const [k, v] of Object.entries(out)) {
  console.log(k, JSON.stringify({ taps: v.taps, scroll: v.scroll_px, fold: v.cta_fold_screens, cls: v.cls_max, blockers: v.blockers, err: v.console_errors.slice(0, 3), error: v.error, checkout: v.checkout_status, opened: v.opened }));
}
