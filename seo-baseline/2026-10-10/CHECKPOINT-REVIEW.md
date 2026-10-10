# SEO Diagnostic — 2026-10-10

Why Google organic clicks fell from ~200/week to ~140/week from late September.
Compares against `seo-baseline/2026-09-21/CHECKPOINT-REVIEW.md`. Raw pulls in this
folder (`pull.py`, `pull2.py` reproduce them).

## 1. Executive summary

**This is not a ranking loss, and it is not caused by the content strategy.**

- Clicks fell **17%** (495 → 410, 17 days vs the 17 before, to 7 Oct) while
  impressions **rose 5.6%** and average position **held or improved** on every page
  group. The loss is a CTR fall, concentrated in brand queries and blog pages.
- **Production was frozen from 13 Sep to 8 Oct** (Netlify publish history). None of
  the weekly routine's improve jobs (17 Sep, 24 Sep, 1 Oct), the Locations retitle or
  the 1 Oct SEO-monthly fixes were live while clicks fell. They cannot be the cause.
- The "1 post per week" routine has produced **one** new post since 1 Sep
  (Rasmalai, 3 Sep). Everything else was improve jobs or NEEDS-TOPIC. The strategy is
  not adding content at a rate that could hurt anything.
- **Demand side explains most of it**: brand-query impressions fell 24% the week of
  28 Sep, which no SEO change can cause. That week is the NSW spring school holidays
  (28 Sep – 9 Oct), the AFL GF (26 Sep), Labour Day long weekend + NRL GF (3–5 Oct),
  and Pitru Paksha (~27 Sep – 10 Oct). GA4 organic sessions fell only ~10%; the ops
  order book was flat (27–30/week).
- **Real SEO problems found, none new**: cannibalisation on the head terms got
  worse, `/locations` has never been crawled, `sitemap.xml` is not registered in GSC,
  and organic conversions are not measured at all.

Confidence: **moderate**. 17 days is short, there is no year-on-year control (GSC
starts 2026-05-28), and only named queries (~40–50% of clicks) can be split.

## 2. Data correlation analysis

Sources: GSC Search Analytics API (`sc-domain:numnumsbakery.com.au`, dataState `all`,
to 2026-10-08, last day partial and excluded); GSC URL Inspection + Sitemaps APIs; GA4
Data API (property 531794710); Supabase `orders`; Netlify deploy API; repo git log;
web research for external dates (sources below).

### Weekly trend (GSC)

| Week | Clicks | Impr | CTR | Pos |
|---|---:|---:|---:|---:|
| 31 Aug | 212 | 7,051 | 3.01% | 9.7 |
| 7 Sep | 186 | 7,246 | 2.57% | 11.2 |
| 14 Sep | 215 | 6,899 | 3.12% | 11.0 |
| 21 Sep | 192 | 8,378 | 2.29% | 11.8 |
| **28 Sep** | **138** | 7,174 | **1.92%** | 10.3 |
| 5 Oct (3 days) | 75 | 3,035 | 2.47% | 10.6 |

### What was live, when (Netlify publish history)

| Published | Content |
|---|---|
| 1 Sep | Blog consolidation 359 → 233 |
| 7 Sep | SEO-audit code fixes |
| 13 Sep | Last publish before the drop |
| — | **Nothing published 14 Sep – 7 Oct** |
| 8 Oct 21:57 | Everything from 14 Sep onward in one deploy (nav, `/cakes` → `/order` 301, shop, form-first `/order`, retitles, improve jobs, 206 link repairs) |

### Changes vs the external calendar

| Date | Event | Source |
|---|---|---|
| 24 Sep – 8 Oct | Google September 2026 spam update | seroundtable.com/google-september-2026-spam-update-done-42235.html |
| 26 Sep | AFL Grand Final | afl.com.au |
| ~27 Sep – 10 Oct | Pitru Paksha (start date disputed 25–27 Sep) | ibtimes.co.in, smartpuja.com |
| 28 Sep – 9 Oct | NSW spring school holidays | nsw.gov.au/living-nsw/school-and-public-holidays |
| 3–5 Oct | Labour Day long weekend; NRL GF 4 Oct | nsw.gov.au, travel.nrl.com |
| from 27 Aug | AI Overviews "dynamic expansion" test (no country named) | seroundtable.com |

No core update in the window; no GSC data anomaly for web search in Sep/Oct.

### Spam update test — not supported

Split at 24 Sep (7–23 Sep vs 24 Sep – 7 Oct, per day):

| Group | Clicks/day | Impr/day | Position |
|---|---|---|---|
| Homepage | 14.5 → 13.6 | 240 → 226 | 13.2 → **12.2** |
| Money pages | 1.6 → 1.6 | 174 → 173 | 9.8 → **8.3** |
| Blog | 12.1 → **8.7** | 820 → **991** | 9.7 → 9.9 |

Of 33 blog URLs with 40+ impressions in both windows: 5 lost over a position, 5
gained, median +0.2. A spam demotion moves positions down; these did not. The blog
lost clicks because its CTR fell (1.48% → 0.88%) on extra impressions, not rankings.

### Where the 85 lost clicks went (17d vs 17d)

| Source | Δ clicks | Reading |
|---|---:|---|
| Brand queries ("num nums bakery…") | ≈ −30 | Fewer people searching the name: demand |
| Homepage | −28 | Mostly the same brand clicks |
| `/blog/best-eggless-cake-shops-sydney-2026` | −22 | Position 7.5 → 10.8 on "eggless cakes"/"eggless cakes sydney" |
| `/blog/photo-cake-sydney` | −19 | Impressions −36%, position steady: demand |
| `/blog/eggless-cake-bakery-harris-park-riverstone-sydney` | −10 | Position steady |

## 3. Identified issues

### Technical

1. **`sitemap.xml` is not submitted in GSC.** Only `sitemap_index.xml` (a 301) and
   `wp-sitemap.xml` (WordPress leftover, 1 error, last read March) are registered.
   Flagged on 21 Sep, still open.
2. **`/locations` is "Discovered – currently not indexed", never crawled**, despite
   260 internal links, a self-canonical and a sitemap entry. The store-finder page is
   absent from Google.
3. **`/blog/number-cakes-sydney` is "Crawled – currently not indexed"** (last crawl
   27 Jul). The 1 Oct improve job pointed internal links at a page Google has dropped.
4. **`/cakes` is still indexed** (last crawl 19 Sep); its 301 went live only on 8 Oct.
   It held 1,191 impressions / 17 clicks in the last 17 days, all of which now moves
   to `/order`.
5. **The 8 Oct deploy shipped 25 days of change at once**, including the nav, a
   redirect of a ranking page and the shop. Expect 2–4 weeks of volatility that is not
   a verdict on any single change.

### Content / keyword

6. **Head-term cannibalisation got worse.** Non-brand queries split across 2+ of our
   URLs: **33 → 47**; impressions on non-owner URLs **1,501 → 2,532**.
   "eggless cake near me" now shows **13 URLs** (was 9): the Schofields page fell
   8.0 → 17.4, the homepage 18.5 → 25.4, and the nut-free and Mays Hill posts appeared.
   "eggless cakes sydney" shows 14.
7. **Unwinnable delivery impressions.** `/blog/eggless-cake-delivery-sydney` began
   ranking 3–6 for six word-order variants of "pennant hills cake delivery" (~430
   impressions, 0 clicks) all at once. Variants appearing simultaneously like that are
   consistent with a third-party rank tracker; either way the shop is pickup-only.
   Those impressions plus other "…delivery sydney" queries inflate impressions and
   lower blog CTR.
8. **Retired-URL residue is now small**: 23 of 125 retired URLs still appear, with 353
   impressions and 0 clicks. The consolidation has mostly cleared.

### Measurement

9. **GA4 records 0 organic key events.** No lead, form or purchase is marked as a key
   event, so SEO can only be judged on clicks, never on orders.
10. **Orders carry no source.** Ops has 27–30 orders/week but cannot say how many came
    from search.

## 4. Actionable recommendations (priority order)

| # | Action | Owner | Effort | Why |
|---|---|---|---|---|
| 1 | **Don't react yet.** No titles, rewrites or new posts on the affected pages until the 3 Nov checkpoint. Re-measure from 13 Oct (holidays over, spam update done, 8 Oct deploy crawled). | — | 0 | The drop is mostly demand and calendar; changes now confound the 8 Oct deploy. |
| 2 | In GSC: **submit `sitemap.xml`**, remove `wp-sitemap.xml` and `sitemap_index.xml`. | Vaidik (SA is read-only) | 5 min | Open since 21 Sep. |
| 3 | In GSC URL Inspection: **Request indexing** for `/locations`, `/order`, `/cakes` (to pick up the 301), `/blog/number-cakes-sydney`. | Vaidik | 5 min | `/locations` has never been crawled. |
| 4 | **Name one owner for "eggless cake near me" / "eggless cakes sydney"** and take the generic phrase out of the titles/H1s of the suburb, nut-free and lower-sugar posts. Exact-anchor links to the owner. | Claude, after 3 Nov | 1–2 h | 33 → 47 split queries. Do it after the checkpoint so it is measurable. |
| 5 | **Mark organic conversions in GA4**: `/order` form submit (Lead), shop `purchase`, tel:/WhatsApp clicks as key events. | Vaidik in GA4 + Claude for any tagging | 30 min | Without it, every future SEO decision is judged on clicks. |
| 6 | Retitle `/blog/eggless-cake-delivery-sydney` so the snippet says pickup / Uber Eats, not "delivery". | Claude | 15 min | Stops pickup-only from being hidden in search, and drops dead impressions. |
| 7 | **Publish smaller and more often.** The routine's weekly improve jobs sat unpublished for 25 days, then went live with everything else. | Vaidik | — | One change per publish is the only way to attribute an effect. |
| 8 | Check GBP Insights for the same weeks (searches, calls, directions). | Vaidik | 5 min | If it dipped too, that confirms the demand reading. Not accessible from here. |

## Open questions (not guessed)

- Which view showed the "decline" (GSC UI 28d, 3m, a specific page)? This report uses
  matched 17-day windows to 7 Oct. A different window could read differently.
- Did Harris Park and Riverstone walk-in trade dip the same weeks? The ops log only
  covers phone/WhatsApp/web orders.

## Method and limits

- Position is impression-weighted. Brand = query matching `num ?num|numnum|nom ?nom|nums`.
- Query-level cuts cover named queries only; GSC anonymises the long tail.
- The research was web-sourced; Pitru Paksha start and any demand effect from it or
  from school holidays are **not confirmed** by any source.

---

## Addendum — same day, done in the browser (info.numnumsbakery@gmail.com)

**Done in Search Console:**
- `sitemap.xml` submitted (read "Couldn't fetch" at submission, which is the normal
  pending state; the live file returns 200, `application/xml`, 240 URLs, valid XML to a
  Googlebot UA). **Re-check it reads Success before removing `sitemap_index.xml`**,
  which is still working (Success, 241 pages, read 4 Oct) and was therefore kept.
- `wp-sitemap.xml` removed.
- Indexing requested: `/locations` (Google now reports it as *URL is unknown to
  Google*), `/order`, `/cakes` (to pick up the 301), `/blog/number-cakes-sydney`.
- No manual action. No spam or security message in the inbox.

**New finding — 40 of the 240 sitemap URLs (17%) are not indexed** (URL Inspection API
over every `<loc>`, raw result in `inspect_all.json`): 35 *Crawled – currently not
indexed*, 3 *Discovered – not indexed*, 2 *unknown to Google*. Most were crawled once in
June–July and declined. They include pages with obvious commercial intent:
`/blog/eggless-cake-sydney`, `/blog/eggless-cakes-parramatta`,
`/blog/eggless-wedding-cakes-sydney`, `/blog/eggless-chocolate-cake-sydney`,
`/blog/theme-cakes-sydney`, `/blog/indian-sweets-harris-park-riverstone-sydney`, plus
15 suburb pages. This is Google's quality/duplication verdict on the bulk-written corpus.
It **predates** the September dip and did not cause it, but it is the largest structural
problem on the site. Do not request indexing for these one by one: a page Google
crawled and declined needs to be merged into its owner or made distinct first.

**Google Business Profile, interactions per month:**

| | Aug | Sep | Oct (≈7 days of data) |
|---|---:|---:|---:|
| Harris Park | 575 | 589 | 76 |
| Riverstone | 380 | 387 | 56 |

September held level with August on both profiles while website clicks fell, so total
Google demand for the shops did not drop in September. The early-October dip on the
profiles matches the school holidays and long weekend. Both profiles show **"Google
updates (2)"** pending review; left untouched.

**GA4 events (60 days):** `order_form_submit` 14, `enquiry_click` 24,
`marketplace_click` 1, `form_start` 481. **None is a key event**, which is why organic
key events read 0. Marking `order_form_submit` and `enquiry_click` as key events (and
`purchase` once the first shop sale fires it) is a two-click change in GA4 Admin →
Events. Awaiting Vaidik's go-ahead.
