/**
 * The custom-cake form on /order.
 *
 * NOT run by `verify-blog.mjs` — it needs Chrome and a live server:
 *
 *     node serve.mjs &
 *     node tests/order-form.browser.mjs
 *
 * The build gate can check markup. Everything below only exists at runtime, and
 * the one that matters most is #2: the form used to offer a date it would then
 * refuse, and the person it refused was always the one in a hurry.
 */
import puppeteer from 'puppeteer';

const b = await puppeteer.launch();
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const open = async (w = 390, h = 844) => {
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.setViewport({ width: w, height: h, isMobile: w < 500 });
  await p.setRequestInterception(true);
  p.on('request', (r) => /googletagmanager|facebook|google-analytics/.test(r.url()) ? r.abort() : r.continue());
  await p.evaluateOnNewDocument(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  await p.goto('http://localhost:4000/order', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1600));
  return { p, errs };
};

/* ---- 1. position, and the shape of the form ---- */
{
  const { p, errs } = await open();
  const m = await p.evaluate(() => {
    const f = document.getElementById('custom-form');
    const first = f.querySelector('input:not([type=hidden]),select,textarea,button[id]');
    return {
      formY: Math.round(f.getBoundingClientRect().top + scrollY),
      firstFieldY: Math.round(first.getBoundingClientRect().top + scrollY),
      galleryY: Math.round(document.getElementById('gallery').getBoundingClientRect().top + scrollY),
      controls: f.querySelectorAll('input:not([type=radio]),select,textarea').length + 1,
      occasion: !!document.getElementById('cake-occasion'),
      oldTime: !!(document.getElementById('ord-hour') || document.getElementById('ord-min') || document.getElementById('ord-ampm')),
      newTime: !!document.getElementById('ord-time'),
      popup: !!document.querySelector('.nnp-backdrop'),
    };
  });
  ok(m.formY < 1200, `form starts at ${m.formY}px (want < 1200)`);
  ok(m.formY < m.galleryY, `form (${m.formY}) must come before the gallery (${m.galleryY})`);
  ok(m.controls === 7, `${m.controls} controls (want 7: date, time, name, flavour, wording, size, notes)`);
  ok(!m.occasion, 'Occasion is still present');
  ok(!m.oldTime, 'the three old time selects are still present');
  ok(m.newTime, 'the single #ord-time select is missing');
  ok(!m.popup, 'the newsletter popup opened over the order form');
  ok(errs.length === 0, `JS error: ${errs[0]}`);
  await p.close();
}

/* ---- 2. the form must never offer a date it then refuses ---- */
{
  const { p, errs } = await open();
  const cal = await p.evaluate(() => {
    document.getElementById('date-trigger').click();
    const days = [...document.querySelectorAll('#cal-grid button:not([disabled])')];
    const first = days[0];
    first.click();
    const t = document.getElementById('ord-time');
    return { label: document.getElementById('date-trigger-label').textContent, time: t.value, picked: !!first };
  });
  ok(cal.picked, 'no selectable day in the calendar');
  // Fill everything else and send.
  await p.evaluate(() => {
    document.getElementById('cake-name').value = 'RLS Probe';
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); };
    set('cake-flavour', 'Chocolate');
    set('cake-size', '8"');
    document.getElementById('loc-harris').checked = true;
    document.getElementById('cake-order-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await new Promise((r) => setTimeout(r, 600));
  const after = await p.evaluate(() => ({
    err: document.getElementById('dt-error').style.display,
    errText: document.getElementById('dt-error').textContent,
    modal: document.getElementById('pricing-confirm-modal')?.style.display || 'none',
    waUrl: document.getElementById('pricing-confirm-modal')?.dataset.waUrl || (window.__opened[0] ?? ''),
  }));
  ok(after.err !== 'block', `the FIRST selectable date was rejected: "${after.errText}"`);
  ok(/wa\.me/.test(after.waUrl), 'no WhatsApp message was built from a valid form');
  const msg = decodeURIComponent(String(after.waUrl).split('text=')[1] ?? '');
  for (const want of ['RLS Probe', 'Chocolate', '8"', 'Harris Park']) {
    ok(msg.includes(want), `the message is missing "${want}"`);
  }
  ok(!/Occasion:/.test(msg), 'the message still carries an Occasion line');
  ok(/Pickup time: \d/.test(msg), `the message has no pickup time — got: ${msg.slice(0, 200)}`);
  ok(errs.length === 0, `JS error: ${errs[0]}`);
  await p.close();
}

/* ---- 3. errors surface on blur, not only on submit ---- */
{
  const { p } = await open();
  const r = await p.evaluate(async () => {
    const n = document.getElementById('cake-name');
    n.focus(); n.value = ''; n.blur();
    await new Promise((x) => setTimeout(x, 200));
    const wrap = n.closest('div');
    const err = wrap.parentElement.querySelector('.form-field-error');
    const shownEmpty = err && err.style.display === 'block';
    n.focus(); n.value = 'Priya'; n.blur();
    await new Promise((x) => setTimeout(x, 200));
    return { shownEmpty, clearedAfterFilling: err.style.display === 'none' };
  });
  ok(r.shownEmpty, 'leaving the name blank did not flag it before submit');
  ok(r.clearedAfterFilling, 'the error did not clear once the name was filled');
  await p.close();
}

/* ---- 4. the name is remembered for a return visit ---- */
{
  const { p } = await open();
  await p.evaluate(() => {
    const n = document.getElementById('cake-name');
    n.value = 'Priya Sharma';
    n.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.reload({ waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  const prefilled = await p.evaluate(() => document.getElementById('cake-name').value);
  ok(prefilled === 'Priya Sharma', `name not remembered on reload (got "${prefilled}")`);
  await p.close();
}

/* ---- 5. nothing above the form routes away from it ---- */
{
  const { p } = await open();
  const stray = await p.evaluate(() => {
    const f = document.getElementById('custom-form');
    const out = [];
    document.querySelectorAll('a[href]').forEach((a) => {
      if (f.contains(a)) return;
      // Site navigation is not a stray CTA — the nav, the mobile menu and the
      // account menu promo.js injects are meant to reach the rest of the site.
      // What this is looking for is BODY content on the custom-cake page that
      // sends somebody somewhere other than the form.
      if (a.closest('#navbar, #mobile-menu, .nn-acct, footer')) return;
      if (a.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) {
        const h = a.getAttribute('href') || '';
        if (h.startsWith('/shop') || h.includes('wa.me') || h === '/order') {
          out.push(`${(a.innerText || '').trim().slice(0, 30)} -> ${h}`);
        }
      }
    });
    return out;
  });
  ok(stray.length === 0, `links above the form route away from it: ${stray.join(' | ')}`);
  await p.close();
}

/* ---- 6. responsive: the No OS controls rule requires this sweep ---- */
for (const w of [320, 375, 430, 768, 1024, 1440]) {
  const { p, errs } = await open(w, 800);
  const r = await p.evaluate(() => {
    document.getElementById('date-trigger').click();
    const cal = document.getElementById('cal-popover').getBoundingClientRect();
    const small = [...document.querySelectorAll('#custom-form button, #custom-form .nd-btn, #custom-form input:not([type=radio])')]
      .filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && b.height < 32; }).length;
    return {
      calInView: cal.left >= -1 && cal.right <= innerWidth + 1,
      small,
      scroll: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  ok(r.calInView, `@${w}: the calendar opens outside the viewport`);
  ok(r.small === 0, `@${w}: ${r.small} control(s) under 32px tall`);
  ok(!r.scroll, `@${w}: horizontal scroll`);
  ok(errs.length === 0, `@${w}: JS error ${errs[0]}`);
  await p.close();
}

await b.close();
if (fails.length) { console.error('FAIL:\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('order form: position, the 48h rule, 7 controls, blur validation, name memory, no stray CTAs, 6 widths');
