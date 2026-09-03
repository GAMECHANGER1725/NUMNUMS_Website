#!/usr/bin/env node
// Verifies every blog invariant that has silently broken in the past.
// Run before committing a batch and after resolving a blog-drafts -> main merge.
//   node verify-blog.mjs          # report + exit 1 on failure
//
// Why this exists: these checks used to live as greps scattered through
// HOW-TO-ADD-BLOG-POSTS.md. Two 5am runs skipped them, published .html URLs
// against clean-URL canonicals, and double-listed 5 posts in llms.txt.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SITE = 'https://numnumsbakery.com.au';
const read = (f) => readFileSync(join(ROOT, f), 'utf8');

const failures = [];
const notes = [];
const fail = (msg) => failures.push(msg);

const sorted = (s) => [...s].sort();
const dupes = (arr) => {
  const seen = new Set(), dup = new Set();
  for (const x of arr) (seen.has(x) ? dup : seen).add(x);
  return sorted(dup);
};
const missing = (a, b) => sorted(a).filter((x) => !b.has(x));

// ---------- 1. Source of truth: post files on disk ----------
const posts = readdirSync(join(ROOT, 'blog'))
  .filter((f) => f.endsWith('.html') && f !== 'index.html')
  .map((f) => f.replace(/\.html$/, ''));
const postSet = new Set(posts);

// ---------- 2. Index cards ----------
const indexHtml = read('blog/index.html');
const cardRe = /class="reveal blog-card-wrap"\s+data-topics="([^"]*)"([\s\S]{0,600}?)href="\/blog\/([a-z0-9-]+)"/g;
const cards = [];
for (const m of indexHtml.matchAll(cardRe)) {
  cards.push({ topics: m[1].trim().split(/\s+/).filter(Boolean), slug: m[3] });
}
const cardSlugs = cards.map((c) => c.slug);
const cardSet = new Set(cardSlugs);

const totalWraps = (indexHtml.match(/blog-card-wrap"/g) || []).length;
if (totalWraps !== cards.length) {
  fail(`index.html: ${totalWraps} card wrappers but only ${cards.length} parsed with a /blog/ link — a card is malformed or links to a non-clean URL.`);
}

// ---------- 3. sitemap.xml ----------
const sitemap = read('sitemap.xml');
const sitemapSlugs = [...sitemap.matchAll(new RegExp(`<loc>${SITE}/blog/([a-z0-9-]+)</loc>`, 'g'))].map((m) => m[1]);
const sitemapSet = new Set(sitemapSlugs);

// ---------- 4. llms.txt ----------
const llms = read('llms.txt');
const llmsSlugs = [...llms.matchAll(new RegExp(`${SITE}/blog/([a-z0-9-]+)`, 'g'))].map((m) => m[1]);
const llmsSet = new Set(llmsSlugs);

// ---------- 5. netlify.toml redirects ----------
const netlify = read('netlify.toml');
const redirectSlugs = [...netlify.matchAll(/from = "\/blog\/([a-z0-9-]+)\.html"/g)].map((m) => m[1]);
const redirectSet = new Set(redirectSlugs);

// ---------- Cross-checks ----------
const layers = [
  ['index.html cards', cardSlugs, cardSet],
  ['sitemap.xml', sitemapSlugs, sitemapSet],
  ['llms.txt', llmsSlugs, llmsSet],
];

for (const [name, arr, set] of layers) {
  const d = dupes(arr);
  if (d.length) fail(`${name}: duplicate entries → ${d.join(', ')}`);
  const absent = missing(postSet, set);
  if (absent.length) fail(`${name}: missing ${absent.length} post(s) → ${absent.slice(0, 10).join(', ')}`);
  const orphan = missing(set, postSet);
  if (orphan.length) fail(`${name}: ${orphan.length} entr(ies) with no post file → ${orphan.slice(0, 10).join(', ')}`);
}

// Redirects: every post needs one. /blog/index.html -> /blog/ is the one extra.
// A retired/merged slug (Phase 4 consolidation) also keeps its own .html redirect,
// but repointed at the survivor post instead of itself — that's legitimate, not an
// orphan, as long as the target is a different real post. Track those targets so
// the orphan check can tell the two apart.
const redirectTargets = new Map(); // from-slug -> to-slug, .html redirects only
for (const block of netlify.split('[[redirects]]')) {
  const f = block.match(/^\s*from = "\/blog\/([a-z0-9-]+)\.html"/m);
  const t = block.match(/^\s*to = "\/blog\/([a-z0-9-]+)"/m);
  if (f && t) redirectTargets.set(f[1], t[1]);
}
const mergeRedirectSlugs = new Set(
  [...redirectTargets].filter(([from, to]) => from !== to && postSet.has(to)).map(([from]) => from),
);
{
  const d = dupes(redirectSlugs);
  if (d.length) fail(`netlify.toml: duplicate redirects → ${d.join(', ')}`);
  const absent = missing(postSet, redirectSet);
  if (absent.length) fail(`netlify.toml: ${absent.length} post(s) with no .html→clean 301 → ${absent.slice(0, 10).join(', ')}`);
  const orphan = missing(redirectSet, postSet).filter((s) => s !== 'index' && !mergeRedirectSlugs.has(s));
  if (orphan.length) fail(`netlify.toml: redirect(s) with no post file and no valid merge-target → ${orphan.join(', ')}`);
  if (!redirectSet.has('index')) notes.push('netlify.toml: no /blog/index.html → /blog/ redirect (expected but not fatal).');

  // Every merge-redirect's .html form must have a matching clean-URL redirect too
  // (from = "/blog/<slug>" with NO .html, to the same survivor) — Google has the
  // clean URL indexed, not the .html one, so the .html redirect alone isn't enough.
  const cleanRedirectFrom = new Set(
    [...netlify.matchAll(/from = "\/blog\/([a-z0-9-]+)"/g)].map((m) => m[1]),
  );
  const missingCleanRedirect = [...mergeRedirectSlugs].filter((s) => !cleanRedirectFrom.has(s));
  if (missingCleanRedirect.length) {
    fail(`netlify.toml: merged slug(s) missing a clean-URL redirect (from = "/blog/<slug>" with no .html) → ${missingCleanRedirect.join(', ')}`);
  }
}

// ---------- Clean-URL rule ----------
const htmlLocs = (sitemap.match(/<loc>[^<]*\.html<\/loc>/g) || []).length;
if (htmlLocs) fail(`sitemap.xml: ${htmlLocs} <loc> still ends in .html — those are redirect URLs Google won't index.`);

const llmsHtml = (llms.match(new RegExp(`${SITE}/blog/[a-z0-9-]+\\.html`, 'g')) || []).length;
if (llmsHtml) fail(`llms.txt: ${llmsHtml} blog URL(s) still end in .html.`);

const cardHtmlLinks = (indexHtml.match(/href="[a-z0-9-]+\.html"/g) || []).length;
if (cardHtmlLinks) fail(`index.html: ${cardHtmlLinks} card link(s) still use the relative <slug>.html form — each costs a 301 hop.`);

// ---------- Canonicals ----------
for (const slug of posts) {
  const html = read(`blog/${slug}.html`);
  const m = html.match(/<link[^>]+rel="canonical"[^>]*>/i);
  if (!m) { fail(`blog/${slug}.html: no rel="canonical".`); continue; }
  const href = m[0].match(/href="([^"]+)"/i)?.[1];
  const want = `${SITE}/blog/${slug}`;
  if (href !== want) fail(`blog/${slug}.html: canonical is "${href}", expected "${want}".`);
}

// ---------- Topics filter counts ----------
const realCounts = new Map();
for (const c of cards) for (const t of c.topics) realCounts.set(t, (realCounts.get(t) || 0) + 1);

const tagRe = /<label class="tag-item" data-tag="([^"]+)"[\s\S]*?<span class="tag-count">(\d+)<\/span>/g;
const declared = new Map();
for (const m of indexHtml.matchAll(tagRe)) declared.set(m[1], Number(m[2]));

if (!declared.size) {
  fail('index.html: could not parse any Topics filter chips.');
} else {
  if (declared.has('all') && declared.get('all') !== cards.length) {
    fail(`Topics filter: "all" says ${declared.get('all')} but there are ${cards.length} cards.`);
  }
  for (const [tag, n] of declared) {
    if (tag === 'all') continue;
    const real = realCounts.get(tag) || 0;
    if (real !== n) fail(`Topics filter: "${tag}" says ${n} but ${real} card(s) carry it.`);
  }
  for (const [tag, real] of realCounts) {
    if (!declared.has(tag)) fail(`Topics filter: tag "${tag}" is used by ${real} card(s) but has no chip.`);
  }
}

// ---------- Workflow files must exist AND be tracked ----------
// A file that exists locally but was never `git add`ed is invisible to the cloud
// routine and never deploys. indexnow.mjs and its IndexNow key sat untracked from
// 2026-07-11 to 2026-08-17: the key 404'd on the live site, so every IndexNow
// submission would have been rejected, silently, for every post.
{
  const INDEXNOW_KEY = '8a811016cc8e6931dbe358599d9112e9';
  const required = ['indexnow.mjs', `${INDEXNOW_KEY}.txt`, 'serve.mjs', 'netlify.toml'];

  let tracked = null;
  try {
    tracked = new Set(
      execFileSync('git', ['ls-files', ...required], { cwd: ROOT, encoding: 'utf8' })
        .split('\n').filter(Boolean),
    );
  } catch {
    notes.push('git not available — skipped the tracked-file check.');
  }

  for (const f of required) {
    if (!existsSync(join(ROOT, f))) { fail(`${f}: required by the routine but missing from the repo.`); continue; }
    if (tracked && !tracked.has(f)) {
      fail(`${f}: exists locally but is NOT tracked by git — the cloud routine won't see it and Netlify won't deploy it. Run: git add ${f}`);
    }
  }

  // The IndexNow key file must contain exactly the key that names it.
  const keyFile = `${INDEXNOW_KEY}.txt`;
  if (existsSync(join(ROOT, keyFile))) {
    const body = read(keyFile).trim();
    if (body !== INDEXNOW_KEY) {
      fail(`${keyFile}: contains "${body}" but must contain exactly "${INDEXNOW_KEY}" — IndexNow verifies ownership by matching the file to its name.`);
    }
  }
}

// ---------- 8. Factual consistency across the corpus ----------
// Structural checks above prove the plumbing works. These prove the site does
// not contradict itself on the four things customers actually ask about, and
// that the entity graph stays consolidated. Every one of these classes has
// silently drifted before: 81 serving-size contradictions, 223 dead /shop/
// URLs in llms.txt, a Harris Park entity split across two @ids.
//
// FACTS is the single source of truth. If the business changes a price or a
// flavour, change it HERE and on /cakes and /order — nowhere else.
const FACTS = {
  // size -> [serves, price] — canonical chart on /order and /cakes
  sizes: { 6: ['6-8', '39.99'], 8: ['12-14', '49.99'], 10: ['20-22', '74.99'],
           12: ['25-30', '89.99'], 14: ['40-45', '114.99'], 16: ['50-55', '134.99'] },
  // the 15 orderable flavours, from the /order dropdown
  flavours: ['Vanilla', 'Chocolate', 'Red Velvet', 'Butterscotch', 'Black Forest',
             'White Forest', 'Strawberry', 'Mango', 'Cookies & Cream', 'Lychee',
             'Pineapple', 'Tiramisu', 'Blueberry', 'Rasmalai', 'Ferrero Rocher'],
  // flavour names that have appeared on the site but are NOT orderable
  offMenu: ['Lotus Biscoff', 'Saffron Pistachio', 'Rose Cardamom', 'Coconut Pandan',
            'Mango Passion', 'Lemon Zest', 'Salted Caramel', 'Kesar Pista', 'Taro',
            'Chocolate Fudge', 'Vanilla Bean', 'Strawberry Cream'],
  addresses: {
    harrisPark: 'Shop 1, 96–98 Wigram Street',
    riverstone: 'Shop 8, Riverstone Shopping Centre',
  },
  // one @id per shop — a split entity is two businesses to Google and to AI answer engines
  entityIds: ['https://numnumsbakery.com.au/#harrispark',
              'https://numnumsbakery.com.au/#riverstone',
              'https://numnumsbakery.com.au/#organization'],
};

{
  const pages = [...posts.map((s) => `blog/${s}.html`),
    'index.html', 'cakes.html', 'order.html', 'about.html',
    'indian-sweet.html', 'locations.html', 'privacy-policy.html'].filter((f) => existsSync(join(ROOT, f)));

  const DASH = '(?:-|–|&ndash;)';
  const SIZE = '(?:"|&quot;|”|″|-inch|\\s?inch(?:es)?)';
  // Only same-clause assertions: no sentence/clause punctuation between the size
  // and the number, or we match across "an 8-inch works; for 30-40 guests, size up".
  const servesRe = new RegExp(`(6|8|10|12|14|16)\\s*${SIZE}([^.;:,<>\\d]{0,45}?)(\\d{1,2})\\s*(?:${DASH}|\\s+to\\s+)\\s*(\\d{1,2})\\s*(?:guests|people|servings|serves)`, 'gi');
  const priceRe = new RegExp(`(6|8|10|12|14|16)\\s*${SIZE}([^.;:,<>]{0,60}?)\\$(\\d{2,3}\\.\\d{2})`, 'gi');
  // a square / tiered / sheet cake legitimately serves a different number
  const qualified = /square|tier|sheet|slab|rectangl|plus|\+|build/i;

  const serveBad = [], priceBad = [], offMenuHits = new Map();
  let ldBad = 0, ldTotal = 0;

  for (const f of pages) {
    const h = read(f);

    for (const m of h.matchAll(servesRe)) {
      const want = FACTS.sizes[m[1]]?.[0];
      if (want && `${m[3]}-${m[4]}` !== want && !qualified.test(m[0])) {
        serveBad.push(`${f}: ${m[1]}" serves "${m[3]}-${m[4]}" but /order says ${want}`);
      }
    }
    for (const m of h.matchAll(priceRe)) {
      const want = FACTS.sizes[m[1]]?.[1];
      if (want && m[3] !== want) priceBad.push(`${f}: ${m[1]}" priced $${m[3]} but /cakes says $${want}`);
    }
    for (const fl of FACTS.offMenu) {
      const n = (h.match(new RegExp(fl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (n) offMenuHits.set(fl, (offMenuHits.get(fl) || 0) + n);
    }
    for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      ldTotal++;
      try { JSON.parse(m[1]); } catch { ldBad++; fail(`${f}: JSON-LD block does not parse — rich results will be dropped.`); }
    }
  }

  if (serveBad.length) fail(`serving sizes: ${serveBad.length} assertion(s) contradict the canonical chart on /order → ${serveBad.slice(0, 5).join(' | ')}`);
  if (priceBad.length) fail(`prices: ${priceBad.length} assertion(s) contradict /cakes → ${priceBad.slice(0, 5).join(' | ')}`);

  // Off-menu flavours are a WARNING, not a failure: 62 mentions are awaiting an
  // owner decision on whether those flavours are genuinely unavailable. Flip this
  // to fail() once that list is resolved to zero.
  if (offMenuHits.size) {
    const top = [...offMenuHits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, v]) => `${k}×${v}`).join(', ');
    notes.push(`off-menu flavours still referenced (${[...offMenuHits.values()].reduce((a, b) => a + b, 0)} mentions): ${top}. Confirm availability or rewrite to the canonical 15.`);
  }

  // NAP: every page that names a shop street must use the one canonical form.
  const hp = pages.filter((f) => /Wigram Street/.test(read(f)) && !read(f).includes(FACTS.addresses.harrisPark));
  if (hp.length) fail(`NAP: ${hp.length} page(s) reference Wigram Street without the canonical "${FACTS.addresses.harrisPark}" → ${hp.slice(0, 5).join(', ')}`);

  // Entity graph: exactly one @id per shop. A second spelling splits the entity.
  const strayIds = new Set();
  for (const f of pages) {
    for (const m of read(f).matchAll(/"@id"\s*:\s*"(https:\/\/numnumsbakery\.com\.au\/#[a-z-]+)"/g)) {
      if (!FACTS.entityIds.includes(m[1]) && !/#(website|article|breadcrumb|webpage|faq|product|logo)/.test(m[1])) strayIds.add(m[1]);
    }
  }
  if (strayIds.size) fail(`entity graph: non-canonical @id(s) split the business entity → ${[...strayIds].join(', ')}. Canonical: ${FACTS.entityIds.join(', ')}`);

  // Internal links must land directly on a live URL: no 301 hop, no retired target.
  const liveSlugs = new Set(posts);
  const topSlugs = new Set(readdirSync(ROOT).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)));
  const ASSET = /\.(css|js|png|jpe?g|webp|svg|ico|xml|txt|pdf|mp4|webm|json)$/i;
  const linkBad = { relative: 0, htmlHop: 0, retired: 0, broken: 0 };
  const linkEx = [];
  for (const f of pages) {
    for (const m of read(f).matchAll(/<a\b[^>]*href="([^"]*)"/gi)) {
      const raw = m[1];
      if (!raw || /^(https?:|#|mailto:|tel:)/.test(raw)) continue;
      const clean = raw.split('#')[0].split('?')[0];
      if (!clean || ASSET.test(clean)) continue;
      const slug = clean.replace(/\/$/, '').split('/').pop().replace(/\.html$/, '');
      if (!raw.startsWith('/')) { linkBad.relative++; linkEx.push(`${f} → ${raw} (relative)`); continue; }
      if (clean.endsWith('.html')) { linkBad.htmlHop++; linkEx.push(`${f} → ${raw} (.html costs a 301 hop)`); continue; }
      const key = clean.replace(/\/$/, '');
      if (key.startsWith('/blog/') && key !== '/blog' && !liveSlugs.has(slug)) { linkBad.retired++; linkEx.push(`${f} → ${raw} (no such post)`); continue; }
      if (key && !key.startsWith('/blog/') && !topSlugs.has(slug) && !['blog', 'review', ''].includes(slug)) { linkBad.broken++; linkEx.push(`${f} → ${raw} (no such page)`); }
    }
  }
  const linkTotal = Object.values(linkBad).reduce((a, b) => a + b, 0);
  if (linkTotal) {
    fail(`internal links: ${linkTotal} problem(s) — ${JSON.stringify(linkBad)}. Links must be absolute and extensionless. → ${linkEx.slice(0, 5).join(' | ')}`);
  }

  // Local assets must exist. A broken <img src> is a visible defect; a broken
  // schema image weakens the entity. Handles ../ prefixes and %20 escapes, both
  // of which have hidden broken paths from earlier greps.
  const missingAssets = new Map();
  for (const f of pages) {
    for (const m of read(f).matchAll(/(?:src|href|content)="([^"]*(?:brand_assets|cake_photos)\/[^"]+)"/g)) {
      const rel = decodeURIComponent(
        m[1].split('?')[0]
          .replace(/^https?:\/\/numnumsbakery\.com\.au/, '')  // absolute site URLs resolve locally
          .replace(/^\.\.\//, '')
          .replace(/^\//, ''),
      );
      if (/^https?:\/\//.test(m[1].replace(/^https?:\/\/numnumsbakery\.com\.au/, ''))) continue;  // off-site, can't check
      if (!existsSync(join(ROOT, rel))) {
        if (!missingAssets.has(m[1])) missingAssets.set(m[1], f);
      }
    }
  }
  if (missingAssets.size) {
    const ex = [...missingAssets.entries()].slice(0, 5).map(([u, f]) => `${u} (${f})`).join(' | ');
    fail(`assets: ${missingAssets.size} referenced file(s) do not exist → ${ex}`);
  }

  notes.push(`facts: ${pages.length} pages · ${ldTotal} JSON-LD blocks (${ldBad} invalid) · serving sizes, prices, NAP, entity @ids and internal links all checked`);
}

// ---------- Report ----------
const n = posts.length;
console.log(`posts ${n} | cards ${cardSlugs.length} | sitemap ${sitemapSlugs.length} | llms ${llmsSlugs.length} | redirects ${redirectSlugs.length} (= posts + 1)`);
for (const note of notes) console.log(`note: ${note}`);

if (failures.length) {
  console.error(`\n✗ ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ all blog invariants hold');
