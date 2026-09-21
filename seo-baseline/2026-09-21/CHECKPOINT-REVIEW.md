# SEO Checkpoint Review — 2026-09-21

First review since the 2026-09-01 consolidation. Compares live Google data
against `seo-baseline/2026-09-02/`, using the same computation
(`seo-baseline/analyze.py`) plus matched-window cuts.

**Verdict: flat overall, working in the direction it was designed to work, and
the payoff has not landed yet. Nothing has got materially worse. The largest
finding in this review is not in the data — nine days of shipped SEO and CRO
work is sitting unpublished on Netlify.**

---

## 0. What is actually live

Verified by fetching production, not by reading the repo.

| Probe | Live result | Repo says |
|---|---|---|
| Homepage nav | `Our Cakes · Indian Sweets · About · Order Online · Locations` | `Shop Cakes · Indian Sweets · Custom Cakes · Locations · Blog` |
| `/shop` | **404** | Next.js export committed as `shop/` |
| `/cakes` | **200**, own H1, crawled 2026-09-19 | deleted; 301 to `/order` |
| CSP `script-src` | no `accounts.google.com`, no Supabase | both present |
| `/order` pricing-confirm screen (commit 2026-09-11) | present | — |

**The live deploy is the 2026-09-11 build.** Everything committed from
2026-09-12 onward has never been published:

- the shop and checkout
- `/cakes` folded into `/order` (the page is still live and still competing)
- `/order` form-first (form moved 8,426px → 781px)
- the `window.load` skeleton fix (measured `/order` 3,475ms → 754ms on fast 4G)
- pickup-only disclosure, nav relabel, GA4 shop funnel

So the only intervention this data measures is **1–11 September**: the blog
consolidation, 680 internal-link repairs, the NAP correction, and the SEO-audit
code fixes. Wave 2 did not happen in production and none of the post-14-Sep data
reflects it.

---

## 1. Headline — matched 17-day windows

Pre: 2026-08-16 → 2026-09-01. Post: 2026-09-02 → 2026-09-18 (GSC final data
ends 18 Sep). Same length, same weekday mix.

| Metric | Pre | Post | Change |
|---|---:|---:|---:|
| Clicks | 510 | 496 | **−2.7%** |
| Impressions | 17,513 | 17,309 | −1.2% |
| CTR | 2.91% | 2.87% | −0.04pp |
| Avg position (impression-weighted) | 10.0 | 10.7 | +0.7 (worse) |
| Distinct queries | 1,202 | 1,498 | **+24.6%** |

A 2.7% click move over 17 days is inside normal weekly variance for this site
(weekly clicks have run 186–225 since mid-August). **Treat this as flat, not as
a decline.**

### Weekly clicks, for shape

| Week commencing | Clicks | Impressions | CTR | Position |
|---|---:|---:|---:|---:|
| 2026-08-03 | 201 | 8,608 | 2.34% | 11.79 |
| 2026-08-10 | 191 | 8,103 | 2.36% | 11.81 |
| 2026-08-17 | 205 | 7,435 | 2.76% | 9.83 |
| 2026-08-24 | 225 | 7,166 | 3.14% | 10.19 |
| 2026-08-31 | 212 | 7,051 | 3.01% | 9.71 |
| 2026-09-07 | 186 | 7,246 | 2.57% | 11.22 |
| 2026-09-14 (5d) | 153 | 4,905 | 3.12% | 10.79 |

Impressions peaked the week of 3 August and have been falling since — which is
what the consolidation was supposed to cause. Clicks have not followed them
down. That is the intended trade.

---

## 2. The single best signal: mobile

Mobile is 74% of clicks. Splitting by device separates two opposite stories that
cancel out in the site average.

| Device | Clicks | Impressions | CTR | Position |
|---|---:|---:|---:|---:|
| Mobile pre | 382 | 11,577 | 3.30% | 7.50 |
| Mobile post | 367 | 10,467 | **3.51%** | **7.30** |
| | −3.9% | −9.6% | +6.4% rel | improved 0.2 |
| Desktop pre | 122 | 5,827 | 2.09% | 15.00 |
| Desktop post | 126 | 6,755 | 1.87% | 16.00 |
| | +3.3% | +15.9% | −10.5% rel | worse 1.0 |

**Mobile did exactly what consolidation is meant to do**: shed 9.6% of
impressions, improved position, and converted the survivors 6.4% harder.

The site-wide "position got worse by 0.7" is a desktop artifact — desktop
gained 928 impressions on new, deep-ranking long-tail queries, which drags the
weighted average down while affecting almost nothing that earns clicks. Do not
read that number as a ranking loss.

---

## 3. Did the consolidation work? — survivors vs retired

The 126 retired posts, isolated from the rest of the blog.

| Set | URLs | Impressions | Clicks | CTR | Position |
|---|---:|---:|---:|---:|---:|
| Survivors pre | 214 | 13,733 | 198 | 1.44% | 9.03 |
| Survivors post | 206 | 13,501 | **216** | **1.60%** | 9.24 |
| | | −1.7% | **+9.1%** | **+11% rel** | +0.2 |
| Retired pre | 111 | 1,742 | 23 | 1.32% | — |
| Retired post | 105 | 1,064 | 8 | 0.75% | — |
| | | −39% | −65% | | |

**This is the mechanism working.** Survivor pages gained 9.1% more clicks on 1.7%
fewer impressions. Retired URLs lost 39% of their impressions.

### But the retirement is only a third done

**105 of the 126 retired URLs still earn impressions 18 days later.** All 126
redirects are present in `netlify.toml` and all spot-checked URLs return a clean
single-hop 301 to the right survivor — the code is correct. Google simply has not
re-crawled them.

URL Inspection on `/blog/eggless-cake-troubleshooting` (still the highest-
impression retired URL at 132 impressions):

```
verdict:        PASS
coverage:       Submitted and indexed
google_canonical: itself
last_crawl:     2026-08-02        ← before the 301 existed
```

Google has not fetched that URL in seven weeks. Until it does, the old page stays
in the index and the cannibalisation the project set out to fix stays in place.
This is the main reason the benefit is not visible yet.

---

## 4. Cannibalisation — essentially unchanged

Matched 17-day windows, queries where 2+ URLs each hold ≥5 impressions:

| | Pre | Post |
|---|---:|---:|
| Queries with 2+ competing URLs | 54 | 52 |
| Impressions on non-owner URLs | 3,574 (33.6%) | 3,541 (31.4%) |
| Queries where a weaker URL outranks the owner | 20 | 17 |

On the framework's 90-day checkpoint (overlapping windows, less clean): 126 → 130
cannibalised queries, 16,641 → 18,570 split impressions, 18.6% → 17.9% of total,
68 → 63 inversions.

**No meaningful movement.** The worst offenders are unchanged or worse:

| Query | Baseline | Now |
|---|---|---|
| `num num bakery` | 61 URLs, 3,524 split | **60 URLs, 4,164 split** |
| `eggless cake near me` | 35 URLs, 2,297 split | 34 URLs, 2,839 split |
| `eggless cake shop` | 6 URLs, 1,326 split | 6 URLs, 1,397 split |

Sixty URLs competing on the brand name is not a blog problem — it is the site
structure, and `/cakes` and `/order` are both in that list. The fix for it is in
the unpublished deploy.

---

## 5. The one real negative: the homepage

| | Pre | Post | Change |
|---|---:|---:|---:|
| Clicks | 294 | 255 | **−13.3%** |
| Impressions | 4,365 | 4,198 | −3.8% |
| Position | 10.7 | 12.7 | worse 2.0 |

GA4 organic sessions to `/` agree independently: 314 → 270 (−14.0%).

It is not a brand-query loss — homepage clicks from *named* queries are flat
(180 → 178), and brand queries site-wide held their position (3.0 → 2.8) and
clicks (137 → 133). The entire 39-click loss sits in GSC's anonymised long-tail,
which is diffuse by construction and cannot be attributed from the API.

The most likely cause is the **2026-09-02 NAP correction** — both shop addresses
changed on the same day. A NAP change is a local-ranking event and a two-position
slip on a homepage carrying local intent is the expected shape of it. It should
recover as Google reconciles the new addresses. Worth re-checking at the next
checkpoint; if it has not recovered by mid-October, it is not the NAP.

---

## 6. Rankings, like for like

Comparing only the entities present in *both* windows removes the tail-expansion
artifact.

**Queries** (539 in both windows)

| | Pre | Post |
|---|---:|---:|
| Impressions | 6,101 | 6,260 (+2.6%) |
| Clicks | 237 | 226 (−4.6%) |
| Impression-weighted position | 11.15 | 13.51 (+2.37 worse) |
| Improved >0.5 / worsened >0.5 | | 181 / **263** |

**Pages** (295 in both windows)

| | Pre | Post |
|---|---:|---:|
| Impressions | 22,120 | 21,665 (−2.1%) |
| Clicks | 514 | 502 (−2.3%) |
| Mean position | 11.52 | **9.42 (−2.11, better)** |
| Improved >0.5 / worsened >0.5 | | **158** / 89 |

The two disagree, and the disagreement is the finding: **most pages improved;
the handful of pages that carry the impressions got worse.** 158 of 295 pages
moved up. The impression-weighted number is dragged negative almost entirely by
the homepage.

New coverage arrived at depth: 959 queries appeared that were not there before,
carrying 1,880 impressions at average position 18.0. Queries ranking 21+ nearly
doubled (205 → 399). That is consolidated pillar pages being shown for broader
terms they have not earned yet — expected, and worth nothing until it moves up.

---

## 7. Conversions and GA4

Matched 17-day windows.

| | Pre | Post | Change |
|---|---:|---:|---:|
| GA4 organic sessions | 644 | 552 | −14.3% |
| GA4 organic pageviews | 1,370 | 1,179 | −13.9% |
| Pages per session | 2.13 | 2.14 | flat |
| `order_form_submit` | 9 | 3 | −67% |
| `enquiry_click` | 2 | 7 | +250% |
| AI Assistant sessions | 53 | 61 | +15% |

Two things to be honest about:

**`order_form_submit` 9 → 3 is the worst number in this review, and it is also
too small to act on.** Nine events. A three-event difference on a base of nine is
not a signal; `enquiry_click` moved the other way by a similar amount. Do not
change anything on the strength of it — but it is the number to watch next
checkpoint, because it is the only one that touches money.

**GA4 organic (−14.3%) and GSC clicks (−2.7%) disagree.** They agree exactly on
the homepage (−14.0% vs −13.3%), so the homepage drop is real. The rest of the
gap is GA4-side: GA4 "Organic Search" includes Bing and DuckDuckGo, which GSC
cannot see. Trust GSC for Google.

### GA4 is being polluted by local development

Direct sessions stepped from ~10–15/day through August to 30–48/day from
**2026-09-12** — the exact day the shop build started — with ~1 user per session:

```
2026-08-29  7     2026-09-12  30
2026-08-30  7     2026-09-14  48
2026-08-31  8     2026-09-15  44
2026-09-05  32    2026-09-18  44
```

`serve.mjs` serves the real `index.html`, GTM included, so every `localhost:4000`
page load during nine days of intensive development is landing in the production
property as Direct. Roughly **250 fake sessions**. Organic figures are unaffected,
but every share-of-traffic and total-session number since 12 September is wrong.

---

## 8. The 90-day framework checkpoint

For the record, `analyze.py` run against both snapshots. **The windows overlap by
71 days**, so this is not a measure of the change — it is the long-run trend.

| Metric | 2026-09-02 | 2026-09-21 | Change |
|---|---:|---:|---:|
| Clicks | 2,010 | 2,346 | **+16.7%** |
| Impressions | 89,578 | 103,712 | +15.8% |
| CTR | 2.24% | 2.26% | +0.02pp |
| Avg position | 10.7 | **10.3** | improved 0.4 |
| URLs with impressions | 381 | 383 | +2 |
| Distinct queries | 3,413 | 3,756 | +10.0% |
| GA4 organic sessions | 2,410 | 2,778 | +15.3% |

The site is still growing on a 90-day view. Written to
`seo-baseline/2026-09-21/BASELINE-SNAPSHOT.md` (the generator hard-codes the
2026-09-02 heading — ignore the title, the numbers are this run's).

---

## 9. Hygiene — what is clean and what is not

**Clean:**
- All 126 redirects present; spot-checked URLs return single-hop 301s to the
  correct survivor. No chains, no 404s.
- `sitemap.xml` and `llms.txt` contain zero retired URLs.
- `node verify-blog.mjs` passes: 234 posts, cards/sitemap/llms all aligned,
  240 pages and 243 JSON-LD blocks valid.
- Key pages all index `PASS`, self-canonical, mobile-crawled.

**Not clean:**
- **Two dead sitemaps registered in GSC.** `sitemap_index.xml` (301s to
  `/sitemap.xml`, 3 warnings) and `wp-sitemap.xml` (**1 error**, a WordPress
  leftover). Remove both from GSC and submit `sitemap.xml` directly. URL
  Inspection still names `wp-sitemap-posts-page-1.xml` as a referring URL for the
  homepage, so Google is still reading it.
- **`/indian-sweet` rich results = FAIL.** It is also the clearest wasted ranking
  on the site: `barfi near me` gives it **220 impressions at position 7.7 with
  zero clicks** over 17 days, and the page went from 53 to 157 distinct queries
  (401 → 606 impressions) for a total of 1 click. It ranks and earns nothing.
- **Core Web Vitals not measured this pass** — CrUX API is disabled on project
  `central-splice-311105` (same 403 as the 2026-09-07 run) and PageSpeed Insights
  hit its daily quota. Last known, 2026-09-07 lab: every page fails mobile LCP
  (4.5s–7.1s vs the 2.5s threshold) while desktop passes; `/cakes` could not
  complete a Lighthouse trace in 120s, twice.

---

## 10. What to do

1. **Publish the Netlify deploy.** Everything else on this list is second. Nine
   days of SEO and CRO work — the `/cakes` fold that kills the biggest remaining
   cannibalisation source, the form-first `/order`, the 2.7-second load
   improvement — is finished, committed, gated green and invisible to Google.
2. **Force a re-crawl of the 105 retired URLs.** `node indexnow.mjs <url ...>`
   already exists. Submit the top 20 by impressions. Until Google refetches them
   the consolidation stays half-applied.
3. **Fix `/indian-sweet` title, meta and schema.** 220 impressions at position 7.7
   on `barfi near me` with a 0% CTR and a failing rich-results verdict is the
   cheapest available win on the site.
4. **Remove `wp-sitemap.xml` and `sitemap_index.xml` from GSC.**
5. **Filter internal traffic out of GA4** — an IP filter, or drop GTM when
   `location.hostname === 'localhost'`. Nine days of dev traffic is already in
   the property.
6. **Do not re-judge the consolidation before ~2026-10-15.** Six weeks is the
   earliest a 126-URL retirement is readable, and only 39% of the old impressions
   have cleared.

---

## Method and limits

- Property `sc-domain:numnumsbakery.com.au` via service account, GA4 property
  531794710. Raw pulls in `seo-baseline/2026-09-21/`.
- **17 days post-change is short.** Every conclusion here is provisional.
- **No year-on-year control.** GSC has no data before 2026-05-28, so seasonality
  is uncontrolled — September vs August differences could be seasonal.
- **GSC anonymises low-volume queries.** Only ~42% of impressions carry a named
  query, so all query-level cuts describe the head, not the whole.
- Position is impression-weighted throughout except where mean position is
  labelled as such; the two disagree and both are reported where they do.
- Two interventions sit inside the post window (1–11 Sep consolidation, 14–15 Sep
  restructure) but the second was never published, so it confounds nothing.
