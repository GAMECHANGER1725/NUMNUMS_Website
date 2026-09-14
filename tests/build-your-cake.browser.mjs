/**
 * /build-your-cake, driven in a real browser.
 *
 * NOT run by `verify-blog.mjs` — it needs Chrome and a live server:
 *
 *     node serve.mjs &
 *     node tests/build-your-cake.browser.mjs
 *
 * The build gate can check that the inline price table still matches FACTS and
 * that LEAD_DAYS is still 2. Everything below only exists at runtime: the
 * forward gating, the guests-to-size mapping, the premium surcharge landing on
 * the card, the 48-hour calendar floor, and whether the finished brief actually
 * carries every answer into the WhatsApp message.
 */
import puppeteer from 'puppeteer';

/* ---- the whole flow, once, at desktop width ---- */
{
  const b = await puppeteer.launch();
  const fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.setViewport({ width: 1440, height: 950 });
  await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem('nn_promo_seen_v1','1'); } catch(e){} });
  // wa.me must not actually navigate the test away
  await p.evaluateOnNewDocument(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  await p.goto('http://localhost:4000/build-your-cake', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 900));
  const step = () => p.evaluate(() => +document.querySelector('.bld-step.is-on').dataset.step);
  const sum  = (k) => p.evaluate((k) => document.getElementById('sum-' + k).textContent, k);

  // ── gate: cannot skip forward ──
  await p.click('[data-go="2"]');
  await new Promise(r => setTimeout(r, 300));
  ok(await step() === 1, 'step 1: advanced with no occasion picked');
  ok(await p.evaluate(() => document.getElementById('err-occ').classList.contains('is-on')), 'step 1: no error shown when blocked');
  ok(await p.evaluate(() => document.querySelector('[data-jump="3"]').disabled), 'rail: step 3 reachable before step 1 answered');

  // ── step 1 ──
  await p.click('#occ-tiles .tile[data-val="Wedding"]');
  await new Promise(r => setTimeout(r, 200));
  ok(await sum('occasion') === 'Wedding', `card did not take the occasion (${await sum('occasion')})`);
  await p.click('[data-go="2"]');
  await new Promise(r => setTimeout(r, 500));
  ok(await step() === 2, 'did not advance to step 2');

  // ── step 2: the guest slider drives the size ──
  await p.evaluate(() => {
    const r = document.getElementById('guest-range');
    r.value = 26; r.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 250));
  ok(await sum('size') === '12"', `26 guests should land on 12" — got ${await sum('size')}`);
  await p.evaluate(() => {
    const r = document.getElementById('guest-range');
    r.value = 58; r.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 250));
  ok(await sum('size') === 'Multi-tier', `58 guests should be multi-tier — got ${await sum('size')}`);
  // back to a real size
  await p.click('#size-tiles .tile[data-size="10"]');
  await new Promise(r => setTimeout(r, 250));
  ok(await sum('size') === '10"', 'clicking a size tile did not set it');
  let price = await p.evaluate(() => document.getElementById('sum-price').textContent);
  ok(/\$74\.99/.test(price), `10" base price wrong: ${price}`);
  await p.click('[data-go="3"]');
  await new Promise(r => setTimeout(r, 500));

  // ── step 3: premium must move the price ──
  await p.click('#flav-tiles .tile[data-val="Rasmalai"]');
  await new Promise(r => setTimeout(r, 250));
  price = await p.evaluate(() => document.getElementById('sum-price').textContent);
  ok(/\$99\.99/.test(price), `10" Rasmalai should be 74.99 + 25.00 = $99.99 — got ${price}`);
  ok(await sum('flavour') === 'Rasmalai', 'flavour not on the card');
  await p.click('#flav-tiles .tile[data-val="Chocolate"]');
  await new Promise(r => setTimeout(r, 250));
  price = await p.evaluate(() => document.getElementById('sum-price').textContent);
  ok(/\$74\.99/.test(price), `switching off premium should drop back to $74.99 — got ${price}`);
  await p.click('[data-go="4"]');
  await new Promise(r => setTimeout(r, 500));

  // ── step 4: the wording appears on the cake ──
  await p.type('#bld-wording', 'Happy 30th, Priya');
  await new Promise(r => setTimeout(r, 250));
  ok(await p.evaluate(() => document.getElementById('sum-plaque').textContent) === 'Happy 30th, Priya', 'wording did not reach the plaque');
  ok(await p.evaluate(() => document.getElementById('word-count').textContent) === '17', 'character count wrong');
  await p.type('#bld-notes', 'Gold leaf, navy ribbon.');
  await p.click('[data-go="5"]');
  await new Promise(r => setTimeout(r, 500));

  // ── step 5: 48h lead, blocked days, and the three fields ──
  const cal = await p.evaluate(() => {
    const days = [...document.querySelectorAll('.bld-cal-day')];
    const today = new Date(); const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const first = days.find(d => !d.disabled);
    return {
      total: days.length,
      firstOpen: first ? first.getAttribute('aria-label') : null,
      earliestWanted: new Date(t.getFullYear(), t.getMonth(), t.getDate() + 2).toDateString(),
      anyEnabledBeforeToday: days.some(d => !d.disabled && +d.textContent < today.getDate() &&
        document.getElementById('cal-month').textContent.indexOf(String(today.getFullYear())) > -1),
    };
  });
  ok(cal.total >= 28, `calendar drew ${cal.total} days`);
  ok(cal.firstOpen && new Date(cal.firstOpen.replace(' — not available','')).toDateString() === cal.earliestWanted,
     `first bookable day is "${cal.firstOpen}", expected ${cal.earliestWanted} (48h lead)`);

  await p.click('[data-go="6"]');
  await new Promise(r => setTimeout(r, 400));
  ok(await step() === 5, 'advanced past step 5 with no date/time/store');
  ok(await p.evaluate(() => ['err-date','err-time','err-store'].every(i => document.getElementById(i).classList.contains('is-on'))),
     'step 5 did not flag all three missing fields');

  await p.evaluate(() => [...document.querySelectorAll('.bld-cal-day')].find(d => !d.disabled).click());
  await p.evaluate(() => {
    const s = document.getElementById('bld-time');
    s.value = '2:30 PM'; s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.click('#store-tiles .tile[data-val="Riverstone"]');
  await new Promise(r => setTimeout(r, 300));
  ok(await sum('time') === '2:30 PM', `time not on card: ${await sum('time')}`);
  ok(await sum('store') === 'Riverstone', 'store not on card');
  ok((await sum('date')) !== 'Not yet', 'date not on card');
  await p.click('[data-go="6"]');
  await new Promise(r => setTimeout(r, 500));
  ok(await step() === 6, 'did not reach step 6');

  // ── step 6: mobile validation, then the message ──
  await p.click('#bld-send');
  await new Promise(r => setTimeout(r, 300));
  ok(await p.evaluate(() => document.getElementById('err-name').classList.contains('is-on')), 'missing name not flagged');
  ok(await p.evaluate(() => window.__opened.length === 0), 'sent WhatsApp with no name');
  await p.type('#bld-name', 'Priya Sharma');
  await p.type('#bld-phone', '0400 000');           // too short on purpose
  await p.click('#bld-send');
  await new Promise(r => setTimeout(r, 300));
  ok(await p.evaluate(() => document.getElementById('err-phone').classList.contains('is-on')), 'short mobile accepted');
  ok(await p.evaluate(() => window.__opened.length === 0), 'sent WhatsApp with a bad mobile');
  await p.evaluate(() => { document.getElementById('bld-phone').value = ''; });
  await p.type('#bld-phone', '0412345678');
  await p.evaluate(() => document.getElementById('bld-phone').dispatchEvent(new Event('input', { bubbles: true })));
  await p.click('#bld-send');
  await new Promise(r => setTimeout(r, 400));
  const opened = await p.evaluate(() => window.__opened);
  ok(opened.length === 1, `expected one WhatsApp open, got ${opened.length}`);
  const msg = opened[0] ? decodeURIComponent(opened[0].split('text=')[1]) : '';
  for (const want of ['Priya Sharma', '0412345678', 'Wedding', '10"', 'Chocolate',
                      'Happy 30th, Priya', 'Riverstone', '2:30 PM', 'Gold leaf, navy ribbon.', '$74.99']) {
    ok(msg.includes(want), `WhatsApp message is missing "${want}"`);
  }
  ok(/starting price/i.test(msg), 'message does not say the price is a starting price');
  ok(errs.length === 0, `JS error: ${errs[0]}`);
  await p.close();
  await b.close();
  if (fails.length) { console.error('FAIL:\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('build-your-cake: all six steps, gating, pricing and the WhatsApp brief check out');
}

/* ---- every step at every width ---- */
{
  const b = await puppeteer.launch();
  const fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  for (const w of [320, 375, 430, 768, 1024, 1280, 1440]) {
    const p = await b.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.setViewport({ width: w, height: 820 });
    await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem('nn_promo_seen_v1','1'); } catch(e){} });
    await p.goto('http://localhost:4000/build-your-cake', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));

    // walk every step so each one gets measured at this width
    for (let s = 1; s <= 6; s++) {
      await p.evaluate((s) => {
        // jump straight there; this test is about layout, not gating
        document.querySelectorAll('.bld-step').forEach(el => el.classList.toggle('is-on', +el.dataset.step === s));
      }, s);
      await new Promise(r => setTimeout(r, 150));
      const bad = await p.evaluate(() => {
        const out = [];
        document.querySelectorAll('.bld-room *').forEach(el => {
          const r = el.getBoundingClientRect();
          // .bld-lights is deliberately inset:-30% and the room clips it; the
          // page-level scrollWidth check below is what proves it costs nothing.
          if (el.classList.contains('bld-lights')) return;
          if (r.width && (r.right > innerWidth + 1 || r.left < -1)) {
            out.push(el.tagName + '.' + String(el.className).slice(0, 26));
          }
        });
        const small = [...document.querySelectorAll('.bld-step.is-on button, .bld-step.is-on a, .bld-step.is-on input, .bld-step.is-on .nd-btn')]
          .filter(el => {
            if (el.type === 'file') return false;              // visually hidden, the label is the target
            if (el.closest('.bld-fine')) return false;         // an inline link inside a sentence
            const r = el.getBoundingClientRect();
            return r.width && r.height && r.height < 32;
          })
          .map(el => el.tagName + '.' + String(el.className).slice(0, 22));
        return { over: out.slice(0, 3), small: small.slice(0, 3) };
      });
      ok(bad.over.length === 0, `@${w} step ${s}: overflows — ${bad.over}`);
      // the calendar cells are square and divide by seven; on a 320 phone that is
      // legitimately under 32px, so they are exempt and everything else is not
      ok(bad.small.filter(x => !/cal-day/.test(x)).length === 0, `@${w} step ${s}: tap target under 32px — ${bad.small}`);
    }
    const sw = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    ok(!sw, `@${w}: horizontal scroll on the page`);
    ok(errs.length === 0, `@${w}: JS error ${errs[0]}`);
    await p.close();
  }
  await b.close();
  if (fails.length) { console.error('FAIL:\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('build-your-cake: 6 steps x 7 widths, nothing overflows, no small tap targets');
}
