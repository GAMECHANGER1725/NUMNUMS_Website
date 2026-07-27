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
{
  const d = dupes(redirectSlugs);
  if (d.length) fail(`netlify.toml: duplicate redirects → ${d.join(', ')}`);
  const absent = missing(postSet, redirectSet);
  if (absent.length) fail(`netlify.toml: ${absent.length} post(s) with no .html→clean 301 → ${absent.slice(0, 10).join(', ')}`);
  const orphan = missing(redirectSet, postSet).filter((s) => s !== 'index');
  if (orphan.length) fail(`netlify.toml: redirect(s) with no post file → ${orphan.join(', ')}`);
  if (!redirectSet.has('index')) notes.push('netlify.toml: no /blog/index.html → /blog/ redirect (expected but not fatal).');
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
