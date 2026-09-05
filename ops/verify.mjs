// Deploy gate for the ops app.
//
// The public site has verify-blog.mjs standing between a mistake and a live
// deploy; ops had 78 unit tests that nothing ran. This is the equivalent: it
// runs those tests and then checks the rules CLAUDE.md states but nothing
// enforced — every one of which has already cost a debugging round somewhere in
// this app's history.
//
//   node ops/verify.mjs        (and it is the ops site's Netlify build command)

import { readFileSync } from 'node:fs';
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
for (const f of ['app.mjs', 'db.mjs', 'stats.mjs', 'catalog.mjs']) {
  try {
    execFileSync(process.execPath, ['--input-type=module', '--check'], { input: read(f), stdio: 'pipe' });
    pass(`${f} parses`);
  } catch (e) {
    fail(`${f} does not parse: ${e.stderr?.toString().split('\n')[0] || e.message}`);
  }
}

const html = read('index.html');
const app = read('app.mjs');

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

// ── 5. the gallery picker must never carry `capture` ────────────────────────
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

// ── 6. the catalogue has not drifted from the build gate ────────────────────
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

console.log(failed ? `\n${failed} check(s) FAILED` : '\nops checks pass');
process.exit(failed ? 1 : 0);
