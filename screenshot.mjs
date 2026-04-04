import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir   = './temporary screenshots';

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

// Auto-increment: find next N
const existing = existsSync(dir)
  ? readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'))
  : [];
const nums = existing.map(f => parseInt(f.replace('screenshot-', '').replace(/(-\w+)?\.png$/, ''), 10)).filter(n => !isNaN(n));
const next = nums.length ? Math.max(...nums) + 1 : 1;

const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath  = join(dir, filename);

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Scroll through page so IntersectionObserver fires for all reveal elements
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y <= pageHeight; y += 400) {
  await page.evaluate(yPos => window.scrollTo(0, yPos), y);
  await new Promise(r => setTimeout(r, 150));
}
// Scroll to bottom to catch anything at the very end
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 300));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 400));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved: ${outPath}`);
