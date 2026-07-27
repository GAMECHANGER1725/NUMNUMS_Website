#!/usr/bin/env node
/**
 * IndexNow submitter for numnumsbakery.com.au
 *
 * Pings IndexNow (Bing, Yandex, Seznam, Naver, etc.) so freshly published or
 * updated pages are discovered faster — improves Bing Copilot freshness (GEO).
 *
 * Usage:
 *   node indexnow.mjs                          # submit every URL in sitemap.xml
 *   node indexnow.mjs https://numnumsbakery.com.au/blog/new-post   # submit specific URL(s)
 *   node indexnow.mjs --dry                     # print what would be submitted, send nothing
 *
 * Run this AFTER a deploy goes live (the key file and pages must be reachable).
 * IndexNow asks you to submit only changed URLs — prefer passing the specific
 * new/updated URLs as arguments rather than the whole sitemap on every deploy.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOST = 'numnumsbakery.com.au';
const KEY = '8a811016cc8e6931dbe358599d9112e9';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const urlArgs = args.filter((a) => a.startsWith('http'));

async function urlsFromSitemap() {
  const xml = await readFile(join(__dirname, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const urlList = urlArgs.length ? urlArgs : await urlsFromSitemap();

  if (!urlList.length) {
    console.error('No URLs to submit.');
    process.exit(1);
  }

  console.log(`IndexNow: ${urlList.length} URL(s) → ${ENDPOINT}`);
  urlList.forEach((u) => console.log('  •', u));

  if (dryRun) {
    console.log('\n--dry: nothing sent.');
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  // IndexNow returns 200 (accepted) or 202 (accepted, pending validation).
  if (res.ok) {
    console.log(`\n✅ Submitted. HTTP ${res.status} ${res.statusText}`);
  } else {
    const body = await res.text().catch(() => '');
    console.error(`\n❌ Failed. HTTP ${res.status} ${res.statusText}\n${body}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('IndexNow error:', err);
  process.exit(1);
});
