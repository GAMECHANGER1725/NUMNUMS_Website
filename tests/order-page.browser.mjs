/**
 * The "Start my order" button on the custom-cake gallery's filter bar.
 *
 * NOT run by `verify-blog.mjs` — it needs Chrome and a live server:
 *
 *     node serve.mjs &
 *     node tests/order-page.browser.mjs
 *
 * Two things it pins that are invisible until somebody uses the page on a
 * phone: the button must stay reachable while the tab strip scrolls under it
 * (an auto margin inside an overflowing flex row pushes it off the end), and
 * the jump must clear the 68px fixed nav rather than landing behind it.
 */
import puppeteer from 'puppeteer';
const b = await puppeteer.launch();
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

for (const w of [320, 375, 430, 768, 1024, 1280, 1440]) {
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.setViewport({ width: w, height: 800 });
  await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem('nn_promo_seen_v1','1'); } catch(e){} });
  await p.goto('http://localhost:4000/order', { waitUntil: 'domcontentloaded' });
  // The loading skeleton lifts on window 'load', which never fires headless
  // because unpkg and the pixel hang; left up it covers the whole page.
  await p.evaluate(() => document.getElementById('sk-overlay')?.remove());
  await new Promise(r => setTimeout(r, 1200));

  // scroll the sticky bar into view
  await p.evaluate(() => document.getElementById('gallery').scrollIntoView());
  await new Promise(r => setTimeout(r, 500));

  const m = await p.evaluate(() => {
    const cta = document.querySelector('.gallery-cta');
    if (!cta) return null;
    const r = cta.getBoundingClientRect();
    const tabs = document.querySelector('.no-scrollbar').getBoundingClientRect();
    return {
      text: cta.textContent.trim(),
      href: cta.getAttribute('href'),
      right: Math.round(r.right), left: Math.round(r.left),
      w: Math.round(r.width), h: Math.round(r.height),
      inView: r.right <= innerWidth + 1 && r.left >= -1 && r.top >= 0 && r.bottom <= innerHeight,
      afterTabs: r.left >= tabs.right - 1,
      bg: getComputedStyle(cta).backgroundColor,
    };
  });
  ok(m, `@${w}: no .gallery-cta`);
  if (!m) { await p.close(); continue; }
  ok(m.href === '/build-your-cake', `@${w}: href is ${m.href}`);
  ok(m.text === 'Build your cake', `@${w}: reads "${m.text}"`);
  ok(m.inView, `@${w}: button is not fully on screen (left ${m.left}, right ${m.right}, vw ${w})`);
  ok(m.afterTabs, `@${w}: button is not after the tab strip`);
  ok(m.h >= 32, `@${w}: button is ${m.h}px tall`);
  ok(m.bg === 'rgb(44, 26, 14)', `@${w}: button is ${m.bg}, expected espresso`);

  // It now leaves the page for the builder, so the check is that the link
  // actually lands there rather than that it scrolled.
  await Promise.all([
    p.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null),
    p.click('.gallery-cta'),
  ]);
  await new Promise(r => setTimeout(r, 600));
  const landed = p.url();
  ok(/\/build-your-cake$/.test(landed), `@${w}: landed on ${landed}`);
  ok(await p.evaluate(() => !!document.querySelector('.bld-step.is-on')), `@${w}: builder did not render`);
  ok(errs.length === 0, `@${w}: JS error ${errs[0]}`);
  await p.close();
}
await b.close();
if (fails.length) { console.error('FAIL:\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('gallery CTA: visible and lands on the form at 7 widths');
