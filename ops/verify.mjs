// Deploy gate for the ops app.
//
// The public site has verify-blog.mjs standing between a mistake and a live
// deploy; ops had 78 unit tests that nothing ran. This is the equivalent: it
// runs those tests and then checks the rules CLAUDE.md states but nothing
// enforced — every one of which has already cost a debugging round somewhere in
// this app's history.
//
//   node ops/verify.mjs        (and it is the ops site's Netlify build command)

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, f), 'utf8');

let failed = 0;
const fail = (msg) => { console.error(`  ✗ ${msg}`); failed++; };
const pass = (msg) => console.log(`  ✓ ${msg}`);

// ── 1. the unit tests ───────────────────────────────────────────────────────
try {
  execFileSync(process.execPath, [join(here, 'stats.test.mjs')], { stdio: 'pipe' });
  pass('stats tests');
} catch (e) {
  fail(`stats tests failed\n${e.stdout?.toString() || e.message}`);
}

// ── 2. every module parses ──────────────────────────────────────────────────
// db.mjs imports from a CDN so it cannot be executed here, but it can be parsed.
for (const f of ['app.mjs', 'db.mjs', 'stats.mjs', 'catalog.mjs', 'receipt.mjs', 'help.mjs']) {
  try {
    execFileSync(process.execPath, ['--input-type=module', '--check'], { input: read(f), stdio: 'pipe' });
    pass(`${f} parses`);
  } catch (e) {
    fail(`${f} does not parse: ${e.stderr?.toString().split('\n')[0] || e.message}`);
  }
}

const html = read('index.html');
const app = read('app.mjs');

// ── 2b. app.mjs imports every helper it uses ────────────────────────────────
//
// A missed import is not a parse error and not a missing id — it is a
// ReferenceError thrown the first time the line runs, which for a rendering
// helper means the first card that happens to need it. `netPrice` shipped this
// way: the order log was fine on an empty store and blew up the moment a real
// order appeared, so the failure looked like bad data rather than bad code.
{
  const EXPORTERS = ['stats.mjs', 'db.mjs', 'catalog.mjs', 'receipt.mjs', 'help.mjs'];
  const exported = new Map();                       // name -> module that exports it
  for (const f of EXPORTERS) {
    const src = read(f);
    for (const m of src.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)) {
      exported.set(m[1], f);
    }
  }

  const imported = new Set();
  for (const m of app.matchAll(/import\s*\{([^}]*)\}\s*from/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) imported.add(name);
    }
  }

  // Anything app.mjs declares for itself shadows the export and is not a miss.
  const local = new Set();
  for (const m of app.matchAll(/(?:^|\s)(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) {
    local.add(m[1]);
  }

  // Only comments are stripped. Strings and template literals are left alone on
  // purpose: nearly every view in this file is a template literal, and the
  // helpers called from inside `${...}` are exactly the ones that go missing.
  // Trying to strip quotes instead swallowed whole functions, because an
  // apostrophe in "Num Num's" opens a string that never closes — which silently
  // turned this check green while the bug was still there.
  const code = app
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

  const missing = [];
  for (const [name, from] of exported) {
    if (imported.has(name) || local.has(name)) continue;
    if (new RegExp(`\\b${name}\\s*\\(`).test(code)) missing.push(`${name}() from ${from}`);
  }

  if (missing.length) {
    fail(`app.mjs calls these without importing them:\n      ${missing.join('\n      ')}`);
  } else {
    pass('app.mjs imports everything it calls');
  }
}

// ── 3. no inline script ─────────────────────────────────────────────────────
// The ops CSP has no 'unsafe-inline' in script-src, so an inline block works on
// localhost and fails only in production. That has bitten this app once already.
const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attrs, body]) => body.trim() && !/\bsrc=/i.test(attrs));
if (inline.length) fail(`${inline.length} inline <script> block(s) — the CSP will block these in production`);
else pass('no inline <script> (CSP)');

// ── 4. every element the code reaches for exists ────────────────────────────
// $('offlinebar') once returned null in production because the markup edit
// silently did not apply. A missing id is a runtime crash, and it is static.
const declared = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
// ids the app creates itself: in template literals, and assigned as a property
// (`host.id = 'toasts'`), which is how the toast container comes into being.
for (const m of app.matchAll(/\bid="([^"${}]+)"/g)) declared.add(m[1]);
for (const m of app.matchAll(/\.id\s*=\s*'([^']+)'/g)) declared.add(m[1]);
// Ids assembled at runtime cannot be checked statically, so they are excused —
// but only the exact shapes used. `$(`view-${v}`)` gives the prefix "view-";
// `$(`${prefix}-btn`)` gives the suffix "-btn". Empty prefixes are dropped:
// mountDuePicker's `${prefix}-btn` yields "", and `startsWith("")` is true for
// every string, which silently excused every id and made this check useless.
const dynPrefix = [...app.matchAll(/\$\(`([^`$]+)\$\{/g)].map((m) => m[1]).filter(Boolean);
const dynSuffix = [...app.matchAll(/\$\(`\$\{[^}]*\}([^`]+)`\)/g)].map((m) => m[1]).filter(Boolean);
const excused = (id) =>
  dynPrefix.some((pre) => id.startsWith(pre)) || dynSuffix.some((suf) => id.endsWith(suf));
const missing = [...new Set([...app.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]))]
  .filter((id) => !declared.has(id) && !excused(id));
if (missing.length) fail(`$() reaches for ids that do not exist: ${missing.join(', ')}`);
else pass('every $() id exists in the markup');

// ── 5. every sticky element declares a z-index ──────────────────────────────
// position:sticky alone does not lift anything. With z-index auto it paints in
// the same step as positioned wrappers further down the DOM, so the sheet
// header ended up underneath the store dropdown and the customer field as they
// scrolled past it. Cheap to state, and it shipped once without being stated.
const stickyMissingZ = [...html.matchAll(/([^{}]+)\{([^}]*position:\s*sticky[^}]*)\}/g)]
  .filter(([, , body]) => !/z-index\s*:/.test(body))
  .map(([, sel]) => sel.trim().split('\n').pop().trim());
if (stickyMissingZ.length) fail(`position:sticky without z-index (it will be painted over): ${stickyMissingZ.join(', ')}`);
else pass('sticky elements all declare a z-index');

// ── 6. the gallery picker must never carry `capture` ────────────────────────
// With capture on it, Android skips the chooser and opens the camera, so a
// photo the customer already sent cannot be attached. That shipped once. The
// camera button is a separate input and is the only one allowed to have it.
const inputs = [...app.matchAll(/<input[^>]*\bid="(f-photo(?:-cam)?)"[^>]*>/g)]
  .map(([tag, id]) => ({ id, capture: /\bcapture=/.test(tag) }));
const gallery = inputs.find((i) => i.id === 'f-photo');
const camera = inputs.find((i) => i.id === 'f-photo-cam');

if (!gallery || !camera) fail(`expected both photo inputs, found: ${inputs.map((i) => i.id).join(', ') || 'none'}`);
else if (gallery.capture) fail('#f-photo has capture — Android will skip the picker and force the camera');
else if (!camera.capture) fail('#f-photo-cam has lost capture — the camera button will open the file picker instead');
else pass('photo inputs: picker without capture, camera with it');

// ── 6b. the tour still points at something ──────────────────────────────────
//
// A tour step whose target has been renamed does not throw — it is dropped, so
// the tour silently gets shorter and the thing it was there to explain is never
// shown. That is the same failure mode as check 4, one step further out.
{
  const help = read('help.mjs');
  const ids = [...help.matchAll(/sel:\s*'#([\w-]+)'/g)].map((m) => m[1]);
  const gone = ids.filter((id) => !declared.has(id));
  if (!ids.length) fail('no id-based tour steps found in help.mjs — has TOUR moved?');
  else if (gone.length) fail(`tour steps point at ids that no longer exist: ${gone.join(', ')}`);
  else pass(`tour targets all exist (${ids.length} by id)`);

  // A section's Show me button names a tour by string. A typo there is silent:
  // tourFor returns nothing and the button simply never renders.
  const tourKeys = new Set([...help.matchAll(/^  '?([\w-]+)'?:\s*\{$/gm)].map((m) => m[1]));
  const referenced = [...help.matchAll(/tour:\s*'([^']+)'/g)].map((m) => m[1]);
  const unknown = referenced.filter((k) => !tourKeys.has(k));
  if (!referenced.length) fail('no help section references a walkthrough — has `tour:` moved?');
  else if (unknown.length) fail(`help sections name walkthroughs that do not exist: ${unknown.join(', ')}`);
  else pass(`every Show me button names a real walkthrough (${referenced.length})`);

  // Every `do:` on a step is handed to tourAct in app.mjs, which only knows a
  // fixed set. An unknown one is navigation that quietly does nothing, and the
  // step it was meant to open is then dropped for having no target.
  const dos = [...new Set([...help.matchAll(/do:\s*'([^']+)'/g)].map((m) => m[1]))];
  const views = dos.filter((d) => d.startsWith('view:')).map((d) => d.slice(5));
  const plain = dos.filter((d) => !d.startsWith('view:'));
  if (!dos.length) fail('no walkthrough navigates anywhere — has `do:` moved?');
  const badDo = plain.filter((d) => !app.includes(`what === '${d}'`));
  if (badDo.length) fail(`help.mjs asks tourAct to do things it cannot: ${badDo.join(', ')}`);
  else pass(`tourAct handles every step action (${plain.join(', ')})`);

  const badView = views.filter((v) => v !== 'home' && !declared.has(`view-${v}`));
  if (badView.length) fail(`walkthroughs navigate to views that do not exist: ${badView.join(', ')}`);
  else pass(`walkthrough views all exist (${views.join(', ')})`);

  // Navigation is the point: a walkthrough that does not tap its way in drops
  // the reader into a screen with no idea how they got there. Only the intro is
  // exempt, because it is the one that shows where things live.
  const bodies = help.split(/^  '?[\w-]+'?:\s*\{$/m);
  const noNav = [...help.matchAll(/^  '?([\w-]+)'?:\s*\{$/gm)].map((m) => m[1])
    .filter((k, n) => k !== 'intro' && !(bodies[n + 1] || '').includes("do: '"));
  if (noNav.length) fail(`walkthroughs that never navigate: ${noNav.join(', ')}`);
  else pass('every walkthrough taps its way in');

  // Role lists are typed by hand in both files and nothing else compares them.
  const roles = new Set([...help.matchAll(/'(admin|staff|baker|[a-z]+)'/g)]
    .map((m) => m[1]).filter((r) => /^(admin|staff|baker)$/.test(r)));
  const bad = [...help.matchAll(/roles:\s*\[([^\]]*)\]/g)]
    .flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]))
    .filter((r) => !['admin', 'staff', 'baker'].includes(r));
  if (bad.length) fail(`help.mjs has unknown roles: ${[...new Set(bad)].join(', ')}`);
  else pass(`help sections use real roles (${[...roles].sort().join(', ')})`);
}

// ── 7. the catalogue has not drifted from the build gate ────────────────────
// catalog.mjs mirrors FACTS in verify-blog.mjs. Nothing enforced that, so the
// ops app could quote a price the public site had already moved on from.
const facts = readFileSync(join(here, '..', 'verify-blog.mjs'), 'utf8');
const factSizes = new Map(
  [...facts.slice(facts.indexOf('sizes: {'), facts.indexOf('flavours:'))
    .matchAll(/(\d+):\s*\['[^']*',\s*'([\d.]+)'\]/g)].map((m) => [m[1], m[2]]),
);
const catalog = read('catalog.mjs');
const catSizes = new Map(
  [...catalog.matchAll(/code:\s*'(\d+) inch'[^}]*?price:\s*([\d.]+)/g)].map((m) => [m[1], m[2]]),
);

if (!factSizes.size) fail('could not read FACTS.sizes out of verify-blog.mjs');
else {
  const drift = [...factSizes].filter(([size, price]) => catSizes.get(size) !== price)
    .map(([size, price]) => `${size}" is ${price} in FACTS but ${catSizes.get(size) ?? 'missing'} in catalog.mjs`);
  const extra = [...catSizes.keys()].filter((k) => !factSizes.has(k));
  if (drift.length || extra.length) fail(['catalogue drift:', ...drift, ...extra.map((k) => `${k}" is in catalog.mjs but not FACTS`)].join('\n      '));
  else pass(`catalogue matches FACTS (${factSizes.size} sizes)`);
}

const factFlavours = (facts.match(/flavours:\s*\[([\s\S]*?)\]/) || [, ''])[1]
  .match(/'([^']+)'/g)?.map((s) => s.slice(1, -1)) || [];
const catFlavours = [...catalog.matchAll(/\{\s*name:\s*'([^']+)'/g)].map((m) => m[1]);
if (factFlavours.length && factFlavours.join('|') !== catFlavours.join('|')) {
  fail(`flavours differ from FACTS\n      FACTS:   ${factFlavours.join(', ')}\n      catalog: ${catFlavours.join(', ')}`);
} else pass(`catalogue matches FACTS (${catFlavours.length} flavours)`);

// The premium surcharge is charged by the web checkout, so it gets the same
// treatment as the base prices: one table, diffed against the build gate.
// Read as text on both sides rather than imported, because a drifted FACTS
// block must fail here rather than quietly agreeing with itself.
{
  const factBlock = facts.slice(facts.indexOf('surcharge: {'), facts.indexOf('// the 15 orderable'));
  const catBlock = catalog.slice(catalog.indexOf('export const SURCHARGE'), catalog.indexOf('export const listPriceCents'));
  const rows = (text, sizeRe) => {
    const out = new Map();
    for (const m of text.matchAll(/'([^']+)':\s*\{([^}]*)\}/g)) {
      for (const n of m[2].matchAll(sizeRe)) out.set(`${m[1]}/${n[1]}`, n[2]);
    }
    return out;
  };
  const wanted = rows(factBlock, /(\d+):\s*(\d+)/g);
  const got = rows(catBlock, /'(\d+) inch':\s*(\d+)/g);
  if (!wanted.size) fail('could not read FACTS.surcharge out of verify-blog.mjs');
  else {
    const drift = [...wanted].filter(([k, v]) => got.get(k) !== v)
      .map(([k, v]) => `${k} is ${v}c in FACTS but ${got.get(k) ?? 'missing'} in catalog.mjs`);
    const extra = [...got.keys()].filter((k) => !wanted.has(k));
    if (drift.length || extra.length) {
      fail(['surcharge drift:', ...drift, ...extra.map((k) => `${k} is in catalog.mjs but not FACTS`)].join('\n      '));
    } else pass(`surcharge matches FACTS (${wanted.size} entries)`);
  }
}

// ── 8. every flavour has its picture ────────────────────────────────────────
// A normal cake has no design photo, so the card shows the cake we sell. The
// filename is derived from the flavour, which means a new flavour silently
// draws a broken image unless its file lands too.
const slug = (name) => name.replace(/&/g, 'and').trim().replace(/[^A-Za-z0-9]+/g, '-');
const missingShots = catFlavours.filter((f) => !existsSync(join(here, 'cakes', `${slug(f)}.webp`)));
if (!catFlavours.length) fail('could not read the flavour list out of catalog.mjs');
else if (missingShots.length) {
  fail(`no cake photo for: ${missingShots.map((f) => `${f} (expected cakes/${slug(f)}.webp)`).join(', ')}`);
} else pass(`every flavour has a cake photo (${catFlavours.length})`);

console.log(failed ? `\n${failed} check(s) FAILED` : '\nops checks pass');
process.exit(failed ? 1 : 0);
