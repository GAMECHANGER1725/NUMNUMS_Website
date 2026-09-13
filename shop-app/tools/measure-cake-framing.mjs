/**
 * Measures where the cake actually sits in each product shot, so
 * lib/cake-framing.ts holds numbers rather than guesses.
 *
 * Run with the dev server up:  node tools/measure-cake-framing.mjs
 * from the repo root, then paste the map into lib/cake-framing.ts.
 */
import puppeteer from 'puppeteer';
import { readdirSync } from 'node:fs';

const names = readdirSync('shop-app/public/cakes').filter(f => f.endsWith('.webp'));
const b = await puppeteer.launch({ headless: 'new' });
const p = await b.newPage();
await p.goto('http://localhost:4000/shop', { waitUntil: 'domcontentloaded' });

const rows = await p.evaluate(async (names) => {
  const out = [];
  for (const n of names) {
    const img = new Image();
    img.src = '/shop/cakes/' + n;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    // Product shots on white. "Content" is anything meaningfully off-white.
    let top = c.height, bot = -1, left = c.width, right = -1;
    for (let y = 0; y < c.height; y++) {
      for (let xx = 0; xx < c.width; xx++) {
        const i = (y * c.width + xx) * 4;
        if (d[i] < 238 || d[i+1] < 238 || d[i+2] < 238) {
          if (y < top) top = y;
          if (y > bot) bot = y;
          if (xx < left) left = xx;
          if (xx > right) right = xx;
        }
      }
    }
    out.push({ n, w: c.width, h: c.height, top, bot, left, right });
  }
  return out;
}, names);

// Put each cake's base on a common line, the way products sit on a shelf.
const BASELINE = 0.93;
const map = {};
let tightest = 100;
for (const x of rows) {
  const r = x.h / x.w;                    // portrait, so the width fits the square
  const y = 100 * ((x.bot / x.h) * r - BASELINE) / (r - 1);
  const headroom = BASELINE * 100 - ((x.bot - x.top) / x.h) * r * 100;
  tightest = Math.min(tightest, headroom);
  map[x.n.replace('.webp', '')] = Math.round(Math.max(0, Math.min(100, y)));
}
console.log(JSON.stringify(map, null, 2));
console.log('// tightest headroom: ' + tightest.toFixed(1) + '% — below 0 means a photo is being clipped');
await b.close();
