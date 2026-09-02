# Num Num's Bakery — SEO Backstory & Current State (Brain Dump)

Compiled 2026-09-01. This document is a factual record for external research purposes.
No recommendations, opinions, or judgments are included — only what exists, what was done,
and what the raw data showed.

---

## 1. Business Overview

- **Name:** Num Num's Bakery
- **Location:** Sydney, Australia (Western Sydney) — two physical locations: Harris Park and Riverstone
- **Product scope:** 100% eggless custom cakes + Indian sweets only. No snack foods, no savoury items.
- **Pricing model:** Flat price per cake size, with an optional flavour surcharge (e.g. "Premium" flavours like Rasmalai or Ferrero Rocher carry a surcharge label — this is a flavour designation, not a design/complexity tier).
- **Website type:** Static multi-page HTML site (no CMS, no framework) — `index.html`, `cakes.html`, `order.html`, `about.html`, `indian-sweet.html`, `locations.html`, plus ~234 individual blog post HTML files. Hosted on Netlify, built via GitHub push (auto-build, but auto-*publish* is turned OFF — the business owner manually publishes each build via the Netlify dashboard).
- **Current focus (as of 2026-08-26, expected through ~2026-10/11):** "data perfection" — cleaning up and correcting existing SEO/content signals rather than building new features like an online shop/cart/checkout (deferred ~2-3 months).

---

## 2. What SEO Work Has Been Done Historically

### 2.1 Blog content strategy (the original approach)

- A cloud-automated routine (`NumNums-Blog-Writer-5am`) published **5 blog posts per day**, every day, drawing topics from a **fixed occasion/suburb calendar** — i.e., a pre-set rotation of Sydney suburb names and cultural/religious occasions, not derived from actual search demand data.
- Topic selection for each post relied on `git log -10 -- blog/` (checking the last 10 git commits touching the blog folder) to avoid *very recent* repeats, but had no mechanism to check demand, check for older duplicate topics, or validate that a suburb/occasion combination had any search volume at all.
- This process ran for an extended period and produced **359 total blog posts**.
- The dominant content pattern that emerged: **150 of the 359 posts (42% of the entire blog corpus)** were near-identical suburb pages following the exact same template — `eggless-cakes-<suburb>.html` — each stating a drive-time to Harris Park or Riverstone, opening with a suburb-specific ABS/council demographic statistic, then reusing the same allergic-disease/eggless-difficulty boilerplate paragraph nearly verbatim across pages, with only the suburb name, distance, and one local stat changed.
- A second smaller pattern: **31 single-culture festival/occasion pages** (low-mainstream-recognition religious/cultural observances) that were topically adjacent to each other.
- A third pattern: **~23 pairs/groups of literal near-duplicates** across other clusters — for example, four separate standalone pages all covering "how do I order a cake online" with near-identical H1 headings, written on four different days.

### 2.2 Other SEO-adjacent workflows in place

- **GBP (Google Business Profile) posting automation:** Separate per-location posting rules exist for Harris Park and Riverstone, with an anti-repetition ledger system (`GBP/posts-queue.md`, `GBP/used-images.txt`) that tracks the last 6 suburbs mentioned, last 6 content angles used, and ensures a randomly-selected, not-yet-used image from a 340-photo real-bakery image bank is used each time. A GitHub Actions workflow watches an outbox folder and relays queued posts to a Make.com webhook for publishing.
- **SEO audit routine:** A separate cloud-scheduled routine (originally `NumNums-SEO-Weekly`, running every week) performs technical SEO audits using a third-party vendored audit tool (the `claude-seo` plugin/skill, currently version 2.2.5). This routine checks things like Core Web Vitals, schema markup (JSON-LD structured data), sitemap validity, indexability, and crawlability.
- **Reviews collection:** A separate Next.js sub-application handles review submissions via a Netlify serverless function, forwarding to a Make.com webhook.
- **Structured data / schema:** The site includes a Wikidata `sameAs` link (linking the business entity to its Wikidata record) on every page's schema markup.
- **Meta Pixel:** Facebook/Meta advertising pixel installed site-wide for conversion tracking (Pixel ID present, Content-Security-Policy allowlisted for Facebook domains).
- **IndexNow:** A script (`indexnow.mjs`) exists to ping search engines (Bing/IndexNow protocol) after a production deploy goes live, notifying them of URL changes so they re-crawl faster than waiting for organic discovery.
- **GEO (Generative Engine Optimization):** An `llms.txt` file is maintained listing all blog posts, intended to help AI answer engines (ChatGPT, Perplexity, Google AI Overviews, etc.) discover and cite the site's content. Google Search itself explicitly does not use `llms.txt` as a ranking signal — it is solely for AI-citation-discovery purposes, separate from traditional Google organic search.

### 2.3 Site-wide technical SEO practices

- `sitemap.xml` is maintained and every blog post must be added to it (this was a known recurring failure point — an audit on 2026-05-23 found 7 posts missing from the sitemap).
- `llms.txt` must also list every blog post (an audit on 2026-06-05 found 62 posts missing from it).
- A script (`verify-blog.mjs`) validates blog-related invariants on demand: no duplicate slugs, no duplicate images across posts, every post present in the index page's card grid, sitemap, and llms.txt.
- `netlify.toml` is the single source of truth for URL redirects, rewrites, and Content-Security-Policy headers for the production site (localhost testing does not perfectly replicate CSP restrictions).

---

## 3. What Was Discovered to Be Wrong (Diagnostic Phase)

On 2026-09-01, Google Search Console (GSC) data was reviewed and showed the following pattern over roughly a 3-month window:

- **Impressions were climbing** steadily (more pages in the index = more opportunities to appear in search results for something).
- **Average position stayed flat at approximately 11** the entire time (i.e., stuck at the bottom of page 1 / top of page 2 — never breaking into a consistently higher ranking position).
- **Click-through rate (CTR) compressed from 2.8% to 2.6%** over the same window (getting shown more but clicked proportionally less).

This combination — rising impressions, flat position, falling CTR — was interpreted as a topical-authority dilution signature: wide keyword/topic coverage without any single cluster having enough concentrated ranking signal (backlinks, internal links, click history, content depth) to actually break into a strong ranking position.

### 3.1 Empirical confirmation

A live search for the query `eggless cake shop near me Mount Druitt NSW` returned **three separate Num Num's Bakery URLs on the same results page** — `eggless-cakes-mount-druitt`, `eggless-cakes-willmot`, and `eggless-cakes-minchinbury` — demonstrating the site was actively competing against its own pages for a single real search query, rather than each page capturing distinct search intent.

### 3.2 Formal cluster analysis

A full-corpus analysis was run against all 359 posts (title, meta description, and H1 pulled for every post; full body text compared for a representative sample per cluster). Results:

| Verdict | Count | % of corpus |
|---|---|---|
| Keep as-is (distinct search intent) | ~233 | 65% |
| Merge (301-redirect into a stronger page in the same topic) | ~125 | 35% |
| Prune (delete outright, no reasonable redirect target) | 1 | <1% |

Merge breakdown:
- 71 suburb pages merged into a neighbouring, larger/better-known suburb page within the same ~5-minute drive-time band and shop catchment.
- 31 festival/occasion pages merged into a single expanded multicultural-celebration pillar page.
- 23 pairs/groups across other topic clusters were near-duplicate intent under different URLs/slugs (including the four-way "how to order online" quadruplicate).

**Important caveat noted at the time:** the initial cluster analysis was performed using topical/geographic similarity only — it did NOT have access to real Google Search Console query/impression data at first. A follow-up pass cross-referenced the cluster analysis against actual 90-day GSC impression data per page, and found that **49 of the 125 proposed merge pairs (39%) had the "keep" and "merge into" pages backwards** — i.e., the page the topical analysis assumed was the weaker/smaller one was actually pulling substantially more real search impressions than the page it was about to be redirected into. Survivor page selections were corrected before execution based on actual traffic data, not just geographic/topical reasoning.

Examples of corrected survivor swaps (post-GSC-correction):
- `cake-serving-size-guide-sydney` (1,306 impressions/90 days) kept; `eggless-cake-size-guide-sydney` (28 impressions/90 days) merged in — original analysis had this backwards.
- `eggless-cake-egg-substitutes` (1,197 impr/90d) kept; `how-eggless-cakes-are-made` (123 impr/90d) merged in — original analysis had this backwards.
- `cake-price-guide-sydney` (689 impr/90d) kept; `eggless-cake-price-sydney` (23 impr/90d) merged in — original analysis had this backwards.

---

## 4. What Was Actually Changed (Execution Phase, 2026-09-01)

1. **Blog post count reduced from 359 to 233.** 126 posts were removed from active status: 125 were merged into 57 "survivor" pages, and 1 was pruned outright (a DIY troubleshooting post judged to have no realistic path to a sale/conversion).
2. **301 redirects** were configured for every retired post (both the extensionless clean URL and the `.html` form) pointing to its survivor page, so any existing backlinks, bookmarks, or lingering search-index entries land on a live page instead of a 404.
3. **Internal link repointing:** approximately 314 internal links across the 140 remaining posts were updated to point directly at survivor pages, instead of going through the redirect hop (previously, a link to a retired page would 301 through to the survivor; now the link itself points straight at the survivor).
4. **Content folding:** 17 suburb "survivor" pages had their "Serving Nearby Areas" section updated to explicitly list the suburb names that had just been absorbed into them, so the survivor page's on-page content reflects its now-broader geographic coverage.
5. **`verify-blog.mjs` (the site's blog-validation script) was extended** to recognize legitimate merge-redirects as valid, rather than flagging every retired URL as a broken/orphaned page.
6. **A topic-selection "ledger" system was created** (`blog/topic-ledger.md`) as a new single source of truth for what topic to write about next, replacing the old fixed-calendar approach. It has three sections:
   - A **cluster registry** — a reference table mapping each content pillar/theme (e.g. suburb/near-me, festival, dietary, pricing, ordering, ingredients, delivery, flavour) to its designated surviving pillar page, for interlinking purposes.
   - An **open topic gaps** list — validated-but-unwritten topic ideas. The explicit rule enforced: nothing may be added to this list without a real, checked Google Search Console query/impression number attached as evidence. As of this writing, this list is empty — no gap-validation pass has been completed yet.
   - A **published history log** — an append-only table intended to record every future post's date, slug, cluster, and demand evidence once published under the new process. Currently empty (no posts have been published under this new gate yet).
7. **Blog posting cadence was reduced from 5 posts/day to 1 post/week**, and the automated routine's topic-selection logic was rewritten to require either a validated gap from the new ledger or a live GSC demand check before writing anything — with an explicit instruction to abort rather than fall back to a calendar if neither source validates a topic. This routine is currently **disabled**, pending the topic-gap-validation list actually being populated with real entries.
8. **The SEO audit routine's cadence was changed from weekly to monthly**, and its underlying audit tooling (a third-party vendored skill/plugin) was updated from version 2.0.0 to version 2.2.5.
9. **Post-deployment verification:** redirect behavior was checked twice — once via a local simulation against the site's own Netlify redirect configuration (confirmed no redirect loops, all single-hop), and once against the live production site after the business owner manually published the deploy (confirmed: merged suburb pages 301 → survivor → 200 OK; the one pruned page correctly returns 404 with no redirect target; a quadruplicate "order online" merge correctly 301s).
10. **IndexNow pings** were sent for 183 URLs (126 retired pages + 57 survivor pages) to notify search engines of the change, confirmed successful (HTTP 200 responses) after verifying the IndexNow key file was live on the production domain.

### 4.1 Known, deliberately deferred gaps in this work

- Internal links that were repointed to survivor pages kept their **original anchor text** — only the destination URL (href) changed, not the visible link text. This is described as cosmetic, not functional.
- "Content folding" (weaving unique facts, local stats, or specific dates from a retired page into its survivor before/after redirecting) was only performed for the suburb-page cluster. The roughly 16 non-suburb merge groups (covering things like festival dates and price figures) redirect correctly but did not have their unique factual content manually preserved on the survivor page.

---

## 5. Current Open / Unresolved Items

- **Formal tracking of results is in progress, not complete.** The stated success signal to watch for is *average search position* moving off its ~11 plateau — explicitly NOT impression count, since impressions are expected to temporarily dip as the 126 retired/redirected URLs fall out of the search index. The plan is to monitor Google Search Console weekly for 4–6 weeks from 2026-09-01 to see whether position improves.
- **The topic-gap validation list (`blog/topic-ledger.md`'s "Open topic gaps" section) has not yet been populated.** This means the currently-disabled blog-writer automation, if re-enabled today, would have no pre-validated gap to pull from and would fall back to a live per-run GSC check every single time — functional, but not yet using a pre-vetted backlog.
- **A follow-up structured "content gaps" analysis exists in a separate report** (referenced as `blog-cluster-report.md`'s Content Gaps section) listing candidate new topics — but these candidates explicitly have NOT yet been checked against real GSC query data, so per the ledger's own rule, none of them may be promoted into the validated gap list without that check being done first.
- The blog-writer automation remains disabled and is intended to stay disabled until the gap-validation backlog exists in a meaningful form.

---

## 6. Raw Numbers Reference Table

| Metric | Value |
|---|---|
| Total blog posts before consolidation | 359 |
| Total blog posts after consolidation | 233–234 |
| Posts merged (301-redirected) | 125 (into 57 survivor pages) |
| Posts pruned (deleted, no redirect) | 1 |
| Suburb pages that existed before consolidation | 150 (42% of full corpus) |
| Suburb pages merged away | 71 |
| Festival/occasion pages merged away | 31 |
| Other near-duplicate pairs/groups merged | 23 |
| Internal links repointed | ~314, across 140 posts |
| Suburb survivor pages with updated "nearby areas" content | 17 |
| Merge-pair survivor corrections after adding real GSC data | 49 of 125 pairs (39%) had picks reversed |
| Old blog cadence | 5 posts/day |
| New blog cadence (currently disabled) | 1 post/week, gated by validated demand |
| Old SEO audit cadence | Weekly |
| New SEO audit cadence | Monthly |
| GSC average position at diagnosis (2026-09-01) | ~11, flat for 3 months |
| GSC CTR trend at diagnosis | 2.8% → 2.6% (compressing) over 3 months |
| IndexNow URLs pinged post-launch | 183 (126 retired + 57 survivors) |
