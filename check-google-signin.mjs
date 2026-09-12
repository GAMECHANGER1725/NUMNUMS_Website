#!/usr/bin/env node
// Is "Continue with Google" actually usable, or does it just look usable?
//
//   node check-google-signin.mjs                      # localhost:3000 (shop dev server)
//   node check-google-signin.mjs https://numnumsbakery.com.au/shop/sign-up
//
// This exists because the failure is invisible. Google Identity Services draws
// a perfect, clickable "Continue with Google" button whether or not the page's
// origin is authorised for the client ID — it only refuses when someone clicks
// it, and it reports the refusal to the browser console where no customer will
// ever look. So a broken sign-in and a working one are pixel-identical, and the
// only honest signal is the console.
//
// Run it after any change to the Google Cloud client, and after the first
// production deploy — a JavaScript origin is per-origin, so localhost passing
// says nothing about numnumsbakery.com.au.

import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:3000/shop/sign-up';
const REJECTED = /not allowed for the given client|origin is not allowed/i;

const browser = await puppeteer.launch();
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(m.text()));
page.on('pageerror', (e) => logs.push(`PAGEERROR ${e}`));

await page.setViewport({ width: 1280, height: 1000 });
try {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
} catch (e) {
  console.error(`could not load ${url} — ${e.message}`);
  await browser.close();
  process.exit(1);
}
// GIS loads async and logs the refusal a beat after it draws.
await new Promise((r) => setTimeout(r, 6000));

const drawn = await page.evaluate(() => {
  const note = [...document.querySelectorAll('p')]
    .find((n) => /By continuing with Google/.test(n.innerText));
  const wrap = note?.parentElement;
  return Boolean(wrap && !wrap.hidden && wrap.firstElementChild?.childElementCount);
});

const rejected = logs.filter((l) => REJECTED.test(l));
const gsi = logs.filter((l) => /GSI_LOGGER/i.test(l));

console.log(`origin : ${new URL(url).origin}`);
console.log(`button : ${drawn ? 'rendered' : 'not rendered (script blocked, or no client ID)'}`);
for (const l of gsi) console.log(`gsi    : ${l}`);

if (rejected.length) {
  console.error(`\n✗ Google refuses this origin.
  Add it in Google Cloud → APIs & Services → Credentials → your OAuth client
  → **Authorised JavaScript origins** (NOT "Authorised redirect URIs"):
      ${new URL(url).origin}
  It must match exactly: no trailing slash, and the right scheme and port.
  Changes can take a few minutes to propagate, so retry before re-editing.`);
  process.exit(1);
}
if (!drawn) {
  console.error(`\n✗ The button never rendered, so nothing could be checked.
  Either the GIS script was blocked, or NEXT_PUBLIC_GOOGLE_CLIENT_ID is unset in the build.`);
  process.exit(1);
}
console.log('\n✓ Google sign-in is usable from this origin');
await browser.close();
