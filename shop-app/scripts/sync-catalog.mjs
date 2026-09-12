/**
 * Copies ops/catalog.mjs into this app.
 *
 * Not a second price list: a byte-for-byte copy, regenerated before every dev
 * run and every build, and `verify-blog.mjs` fails the deploy if the committed
 * copy ever differs from the original. Turbopack's root is pinned to this
 * directory (two lockfiles exist, and without the pin Next picks the wrong
 * one), so it cannot resolve a path — or a symlink — that leaves it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', 'ops', 'catalog.mjs');
const out = join(here, '..', 'lib', 'catalog.generated.mjs');
const banner = '// GENERATED from ops/catalog.mjs by scripts/sync-catalog.mjs — do not edit.\n';
writeFileSync(out, banner + readFileSync(src, 'utf8'));
console.log('catalog synced');
