/**
 * The "Our Cakes" menu, driven in a real browser.
 *
 * NOT run by `verify-blog.mjs` — it needs Chrome and a live server, neither of
 * which the Netlify build has. Run it by hand after touching `mountCakesMenu`
 * in promo.js or `shop-app/components/ui/cakes-menu.tsx`:
 *
 *     node serve.mjs &
 *     node tests/nav-menu.browser.mjs
 *
 * The build gate can only check that the two item lists still agree. Every
 * behaviour below — hover, the close delay, Escape, the tubelight indicator,
 * the hamburger's flattened grouping — fails silently and only in a browser.
 */
import puppeteer from 'puppeteer';

/* ---- the static pages ---- */
{
  const b = await puppeteer.launch();
  const fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };

  for (const [path, label] of [['/', 'index'], ['/order', 'order'], ['/locations', 'locations'], ['/blog/', 'blog']]) {
    const p = await b.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.setViewport({ width: 1440, height: 900 });
    // The newsletter popup covers the whole nav after 15s; this test is about
    // the menu, so suppress it the same way a returning visitor does.
    await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem('nn_promo_seen_v1', '1'); } catch (e) {} });
    await p.goto('http://localhost:4000' + path, { waitUntil: 'domcontentloaded' });
    // The loading skeleton covers the nav until window 'load', which never
    // arrives headless because the pixel and the hero video hang.
    await p.evaluate(() => document.getElementById('sk-overlay')?.remove());
    await new Promise(r => setTimeout(r, 400));

    const pre = await p.evaluate(() => {
      const pill = document.getElementById('nav-pill');
      return {
        btn: !!document.querySelector('.nn-cakes-btn'),
        btnText: (document.querySelector('.nn-cakes-btn')?.textContent || '').trim(),
        strayShop: !!pill?.querySelector('a.nav-link[href="/shop"]'),
        strayOrder: !!pill?.querySelector('a.nav-link[href="/order"]'),
        popOpen: document.querySelector('.nn-cakes-pop')?.classList.contains('nn-open'),
        active: document.querySelector('.nn-cakes-btn')?.classList.contains('nav-active'),
        indW: document.getElementById('nav-indicator')?.style.width,
        labels: [...(pill?.querySelectorAll('a.nav-link') || [])].map(a => a.textContent.trim()),
      };
    });
    ok(pre.btn, `${label}: no "Our Cakes" button`);
    ok(pre.btnText === 'Our Cakes', `${label}: trigger reads "${pre.btnText}"`);
    ok(!pre.strayShop && !pre.strayOrder, `${label}: old Signature/Custom links still loose in the pill`);
    ok(pre.popOpen === false, `${label}: menu is open on load`);
    if (label === 'order') {
      ok(pre.active, 'order: trigger is not marked active on the custom-cakes page');
      ok(pre.indW && pre.indW !== '0px' && pre.indW !== '0', `order: tubelight indicator is ${pre.indW}`);
    }

    await p.hover('.nn-cakes-btn');
    await new Promise(r => setTimeout(r, 450));
    const on = await p.evaluate(() => {
      const pop = document.querySelector('.nn-cakes-pop');
      const items = [...document.querySelectorAll('.nn-cakes-item')];
      const r = pop.getBoundingClientRect();
      return {
        open: pop.classList.contains('nn-open'),
        expanded: document.querySelector('.nn-cakes-btn').getAttribute('aria-expanded'),
        vis: getComputedStyle(pop).visibility,
        inView: r.left >= 0 && r.right <= innerWidth,
        hrefs: items.map(a => a.getAttribute('href')),
        names: items.map(a => a.querySelector('.nn-cakes-name').textContent.trim()),
        current: items.filter(a => a.getAttribute('aria-current')).map(a => a.getAttribute('href')),
        minH: Math.min(...items.map(a => a.getBoundingClientRect().height)),
      };
    });
    ok(on.open && on.vis === 'visible', `${label}: hover did not open the menu`);
    ok(on.expanded === 'true', `${label}: aria-expanded is ${on.expanded}`);
    ok(on.inView, `${label}: menu overflows the viewport`);
    ok(String(on.hrefs) === '/shop,/build-your-cake,/order', `${label}: items are ${on.hrefs}`);
    ok(on.minH >= 32, `${label}: smallest item is ${on.minH}px tall`);
    if (label === 'order') ok(String(on.current) === '/order', `order: aria-current is ${on.current}`);

    // keyboard: Escape closes and returns focus
    await p.focus('.nn-cakes-btn');
    await p.keyboard.press('ArrowDown');
    await new Promise(r => setTimeout(r, 200));
    const kb1 = await p.evaluate(() => document.activeElement?.className);
    ok(/nn-cakes-item/.test(kb1 || ''), `${label}: ArrowDown did not focus the first item (got ${kb1})`);
    await p.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 250));
    const kb2 = await p.evaluate(() => ({
      focus: document.activeElement?.className,
      open: document.querySelector('.nn-cakes-pop').classList.contains('nn-open'),
    }));
    ok(!kb2.open, `${label}: Escape did not close the menu`);
    ok(/nn-cakes-btn/.test(kb2.focus || ''), `${label}: Escape did not return focus to the trigger`);

    // mobile grouping
    await p.setViewport({ width: 390, height: 780 });
    await new Promise(r => setTimeout(r, 300));
    const m = await p.evaluate(() => {
      const mob = document.getElementById('mobile-menu');
      const desk = document.querySelector('.nn-cakes');
      return {
        deskHidden: desk ? getComputedStyle(desk).display === 'none' : null,
        order: [...mob.children].map(n => (n.tagName === 'A' || n.tagName === 'P')
          ? n.tagName + ':' + n.textContent.trim() : n.tagName),
      };
    });
    ok(m.deskHidden === true, `${label}: the hover menu is still rendered at 390px`);
    const seq = m.order.join(' | ');
    ok(/P:Our Cakes \| A:Signature Flavours \| A:Build Your Cake \| A:Custom Cakes/.test(seq), `${label}: mobile menu reads ${seq}`);

    // horizontal overflow + JS errors
    const scroll = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    ok(!scroll, `${label}: horizontal scroll at 390px`);
    ok(errs.length === 0, `${label}: JS error ${errs[0]}`);
    await p.close();
  }
  await b.close();
  if (fails.length) { console.error('FAIL:\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('nav dropdown: all checks pass on index, order, locations, blog');
}

/* ---- bespoke blog navs and the React shop ---- */
{
  const b = await puppeteer.launch();
  const fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };

  const paths = [
    '/blog/eggless-cake-flavour-pairing-guide',
    '/blog/eggless-cake-for-vegetarians-sydney',
    '/blog/eggless-cakes-ramadan-sydney',
    '/indian-sweet',
    '/shop/',            // the React header
    '/shop/cakes/vanilla',
  ];
  for (const path of paths) {
    const p = await b.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.setViewport({ width: 1440, height: 900 });
    await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem('nn_promo_seen_v1','1'); } catch(e){} });
    await p.goto('http://localhost:4000' + path, { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => document.getElementById('sk-overlay')?.remove());
    await new Promise(r => setTimeout(r, 600));

    const react = path.startsWith('/shop');
    const sel = react ? '[class*="nn-nav-link"]' : '.nn-cakes-btn';
    const trigger = await p.$(react ? 'button.nn-nav-link' : '.nn-cakes-btn');
    ok(!!trigger, `${path}: no "Our Cakes" trigger`);
    if (!trigger) { await p.close(); continue; }
    void sel;

    const txt = await p.evaluate(el => el.textContent.trim(), trigger);
    ok(txt === 'Our Cakes', `${path}: trigger reads "${txt}"`);

    await trigger.hover();
    await new Promise(r => setTimeout(r, 600));
    const on = await p.evaluate(() => {
      const items = [...document.querySelectorAll('.nn-cakes-item, [class*="nn-cakes-popup"] a')];
      const box = document.querySelector('.nn-cakes-card, .nn-cakes-popup');
      const r = box?.getBoundingClientRect();
      return {
        n: items.length,
        names: items.map(a => a.textContent.trim().split('\n')[0].trim()),
        hrefs: items.map(a => a.getAttribute('href')),
        inView: r ? (r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1) : false,
        minH: items.length ? Math.min(...items.map(a => a.getBoundingClientRect().height)) : 0,
      };
    });
    ok(on.n === 3, `${path}: menu has ${on.n} items`);
    ok(on.inView, `${path}: menu overflows the viewport`);
    ok(on.minH >= 32, `${path}: smallest item ${on.minH}px`);
    ok(/Signature Flavours/.test(on.names[0] || ''), `${path}: first item is "${on.names[0]}"`);
    ok(/Build Your Cake/.test(on.names[1] || ''), `${path}: second item is "${on.names[1]}"`);
  ok(/Custom Cakes/.test(on.names[2] || ''), `${path}: third item is "${on.names[2]}"`);
    const want = ['/shop', '/build-your-cake', '/order'];  // basePath turns the app's own '/' into /shop
    ok(String(on.hrefs) === String(want), `${path}: hrefs are ${on.hrefs}, expected ${want}`);
    ok(errs.length === 0, `${path}: JS error ${errs[0]}`);

    // no horizontal scroll at phone width
    await p.setViewport({ width: 360, height: 760 });
    await new Promise(r => setTimeout(r, 400));
    const sw = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    ok(!sw, `${path}: horizontal scroll at 360px`);
    await p.close();
  }
  await b.close();
  if (fails.length) { console.error('FAIL:\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('cakes menu works on bespoke blog navs, a static page, and both React shop routes');
}

/* ---- the responsive sweep ---- */
{
  const b = await puppeteer.launch();
  const fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  for (const path of ['/', '/order', '/shop/']) {
    for (const w of [320, 375, 430, 768, 900, 1025, 1280, 1440]) {
      const p = await b.newPage();
      await p.setViewport({ width: w, height: 800 });
      await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem('nn_promo_seen_v1','1'); } catch(e){} });
      await p.goto('http://localhost:4000' + path, { waitUntil: 'domcontentloaded' });
      await p.evaluate(() => document.getElementById('sk-overlay')?.remove());
      await new Promise(r => setTimeout(r, 500));
      const react = path.startsWith('/shop');
      const t = await p.$(react ? 'button.nn-nav-link' : '.nn-cakes-btn');
      const shown = t ? await p.evaluate(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && getComputedStyle(el).display !== 'none';
      }, t) : false;
      // above 1024 the menu must be there; at or below it must be gone
      ok(w >= 1025 ? shown : !shown, `${path} @${w}: trigger ${shown ? 'visible' : 'hidden'}`);
      if (shown) {
        await t.hover();
        await new Promise(r => setTimeout(r, 550));
        const fit = await p.evaluate(() => {
          const box = document.querySelector('.nn-cakes-card, .nn-cakes-popup');
          if (!box) return null;
          const r = box.getBoundingClientRect();
          return r.left >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
        });
        ok(fit === true, `${path} @${w}: menu does not fit the viewport (${fit})`);
      }
      // The page-level 320px overflow is #trust-track, the marquee, and predates
      // this work — verified by reverting promo.js. So the assertion is scoped to
      // what the menu itself adds.
      const bad = await p.evaluate(() => [...document.querySelectorAll(
        '.nn-cakes, .nn-cakes-btn, .nn-cakes-pop, .nn-cakes-card, .nn-cakes-root, .nn-cakes-popup, .nn-m-group, .nn-m-sub')]
        .filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); })
        .map(el => el.className));
      ok(bad.length === 0, `${path} @${w}: nav element overflows — ${bad}`);
      await p.close();
    }
  }
  await b.close();
  if (fails.length) { console.error('FAIL:\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('responsive sweep: 3 pages x 8 widths, menu fits and never causes overflow');
}
