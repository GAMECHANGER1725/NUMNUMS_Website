# Google Field Data: Indexation and CrUX (Num Nums Bakery)
Source: Google API (field data). URL Inspection API, run 2026-10-01 (live index state, not a lag-free view). Property sc-domain:numnumsbakery.com.au. Tier 2 credentials. Data-only run.

## Method and limits
- Sampled 49 distinct URLs, 49 of 49 returned with no quota stop and no API errors: 8 static (/, /order, /about, /locations, /indian-sweet, /privacy-policy, /blog/, /cakes), /blog (no slash), and 40 blog posts (oldest and newest by sitemap lastmod, 15 suburb posts, 12 evenly spaced). The sample over-represents suburb posts and the lastmod extremes, so it is not a random sample.
- One batch entry (a 50th, `.../eggless-cake-vs-ice-cream-cake-sydney`) was corrupted by a missing newline in my URL file and returned "unknown" for a malformed URL. It was discarded and that post was NOT inspected.
- Live deploy is weeks behind main (Netlify auto-publish OFF). Google is reading an older build, so repo state and Google state can legitimately differ.

## Aggregate (blog posts, n=40)
| Coverage state | Count | Share |
|---|---|---|
| Submitted and indexed | 30 | 75% |
| Crawled - currently not indexed | 9 | 22.5% |
| Discovered - currently not indexed | 1 (eggless-cakes-wentworthville) | 2.5% |
| Duplicate / canonical mismatch | 0 | 0% |

Static pages (n=9 strings): indexed 5 (/, /order, /about, /indian-sweet, /cakes); /locations = Discovered - not indexed; /privacy-policy = unknown to Google; /blog/ = "Alternate page with proper canonical tag" (Google canonical is /blog, which is itself Submitted and indexed).

Extrapolation (NOT a measurement): if the 75% post rate held across the 234 sitemap posts, about 175 would be indexed, roughly 140-200 given the small sample (Wilson 95% interval for 30/40 is about 60-86%). About 25% (~50-95 posts) would sit in Crawled/Discovered-not-indexed. Treat as indicative only because the sample is skewed.

## Findings
1. HIGH: 9 of 40 posts are "Crawled - currently not indexed", and 1 more is "Discovered - not indexed". Google fetched the page successfully (fetch SUCCESSFUL, robots ALLOWED, indexing allowed) and declined to index it: a quality/duplication signal, not a technical block. Affected: eggless-birthday-cakes-every-age-sydney, eggless-cupcakes-kids-birthday-party-sydney, eggless-wedding-cakes-sydney, eggless-cakes-mothers-day-sydney, indian-sweets-harris-park-riverstone-sydney, eggless-cakes-parramatta, eggless-cakes-westmead, eggless-cakes-baulkham-hills, eggless-cake-sydney. Pattern: broad head-term posts (eggless-cake-sydney, wedding, parramatta) are among the unindexed, which fits overlap with the homepage, /order and the many suburb posts. This is evidence of cannibalisation/thin-duplicate risk even though no canonical mismatch is reported. Because of the stale deploy, some of these may have been crawled before later edits; re-check after the next publish.
2. MEDIUM: Stale crawls. Last crawl for the unindexed posts is June-August 2026 (oldest 2026-06-04, 119 days ago; 2026-06-11/16/17/19 for several others). Indexed posts were mostly crawled July-September. Not-indexed pages are being recrawled slowly.
3. MEDIUM: /locations is "Discovered - currently not indexed" with no crawl time. It is a key local-SEO page (two NAP locations) and is in the sitemap. Likely cause is weak internal-link discovery or low crawl priority; confirm the live build links to it from the nav/footer. Also /blog/eggless-cakes-wentworthville: Discovered, never crawled.
4. HIGH (stale-deploy artefact): /cakes is "Submitted and indexed" (crawled 2026-09-19, canonical matches itself) and is still in the live sitemap, but the repo deletes it and 301s it to /order. Expected to resolve after publish; until then /cakes and /order compete. After publish, confirm Google drops /cakes and consolidates on /order.
5. LOW: Canonical mismatches (Google vs declared): 0 across all 40 inspected URLs that were crawled. No mismatch to report. One drift to check: the repo's blog/index.html declares canonical `https://numnumsbakery.com.au/blog/` (trailing slash), while Google's chosen and the live user-declared canonical is `https://numnumsbakery.com.au/blog` (no slash). If that tag is changed in the unpublished build, Google may disagree with it. Confirm whether the change is intentional.
6. LOW: /privacy-policy is "URL is unknown to Google". Consistent with its `noindex, follow` tag in the repo and absence from the sitemap, so this is intended.
7. Good: all crawled URLs were fetched as MOBILE (mobile-first indexing) with robots ALLOWED and fetch SUCCESSFUL. Rich results: Breadcrumbs on nearly every indexed page, Review snippets on / (11 items, 0 issues), Product snippets and Merchant listings on /indian-sweet, Product snippets on /cakes. No rich-result issues reported on any URL. No LocalBusiness/FAQ items were detected by Google on any sampled URL.

## Per-URL results (verdict | coverage | last crawl | crawled as | match)
All rows: robots ALLOWED, fetch SUCCESSFUL where crawled; canonical match = true where crawled.
- /  PASS indexed 2026-09-30 MOBILE
- /order  PASS indexed 2026-09-14
- /about  PASS indexed 2026-09-23
- /locations  NEUTRAL Discovered-not-indexed, never crawled
- /indian-sweet  PASS indexed 2026-08-21
- /privacy-policy  NEUTRAL unknown to Google
- /blog/  NEUTRAL Alternate page with proper canonical (-> /blog); /blog  PASS indexed 2026-09-06
- /cakes  PASS indexed 2026-09-19
- Indexed posts (30): top-7-custom-eggless-cake-designs-kids-birthday 07-01; eggless-cakes-diwali-indian-festivals-sydney 07-01; eggless-cake-vs-supermarket-cake 08-23; winter-cake-sydney 08-24; eggless-cake-cancellation-policy-sydney 08-25; autumn-cake-sydney 08-25; eggless-cakes-yalda-night-sydney 08-25; eggless-red-velvet-cake-sydney 08-25; push-present-cake-sydney 08-25; rasmalai-cake-sydney 09-12; eggless-cakes-merrylands-west 09-16; eggless-cake-bakery-harris-park-riverstone-sydney 09-20; eggless-cakes-schofields 09-23; custom-kids-birthday-cakes-marsden-park-schofields 07-03; eggless-cakes-north-parramatta 06-20; eggless-cakes-rouse-hill 06-16; eggless-cakes-blacktown 06-12; eggless-cakes-riverstone 08-20; eggless-cakes-auburn 09-03; eggless-cakes-harris-park 09-29; eggless-cakes-easter-sydney 07-22; eggless-cake-nut-free-sydney 09-22; best-dessert-shop-sydney 09-24; kids-birthday-cake-sydney 09-06; first-birthday-cake-sydney 09-26; eggless-cake-fillings-sydney 09-20; eggless-cakes-constitution-hill 07-04; eggless-cakes-karwa-chauth-sydney 07-14; eggless-cakes-quinceanera-sydney 08-10; hsc-results-day-cake-sydney 08-11 (all 2026).
- Crawled-not-indexed (9), last crawl: eggless-birthday-cakes-every-age-sydney 06-04; eggless-cupcakes-kids-birthday-party-sydney 06-17; eggless-wedding-cakes-sydney 06-16; eggless-cakes-mothers-day-sydney 06-19; indian-sweets-harris-park-riverstone-sydney 07-27; eggless-cakes-parramatta 07-01; eggless-cakes-westmead 06-16; eggless-cakes-baulkham-hills 06-11; eggless-cake-sydney 08-12.
- Discovered-not-indexed (1): eggless-cakes-wentworthville (never crawled).
Full raw JSON: /tmp/claude-0/-home-user-NUMNUMS-Website/714c9815-6421-55f8-a153-945a6c798c3c/scratchpad/insp.json

## Sitemap status (Google side, gsc_query.py sitemaps)
| Sitemap registered in GSC | Last submitted | Submitted URLs | Warnings | Errors |
|---|---|---|---|---|
| /sitemap_index.xml | 2025-10-10 | 241 (web) | 3 | 0 |
| /wp-sitemap.xml (index) | 2025-08-20 | none reported | 4 | 1 |

- HIGH: The sitemap the site actually serves and lists in robots.txt (`/sitemap.xml`, 240 URLs in repo) is NOT registered in GSC. Registered ones are legacy WordPress-era (`/sitemap_index.xml`, `/wp-sitemap.xml`). The wp-sitemap has 1 error and 4 warnings, and Google's referrers for / even cite `wp-sitemap-posts-page-1.xml`. The API gave no last-downloaded or indexed counts (the Sitemaps API does not return indexed counts; the per-URL inspection above is the indexation truth). Action: submit https://numnumsbakery.com.au/sitemap.xml and remove the two legacy entries once confirmed obsolete.
- Note the 241 submitted count (live, via sitemap_index.xml) vs 240 URLs in repo sitemap.xml, consistent with the stale deploy still containing /cakes.

## CrUX origin-level CWV
| Form factor | p75 LCP | p75 INP | p75 CLS | Result |
|---|---|---|---|---|
| Mobile (PHONE) | N/A | N/A | N/A | Not retrievable |
| Desktop | N/A | N/A | N/A | Not retrievable |

Reason: both the CrUX History API (`crux_history.py`) and the direct CrUX `queryRecord` call returned HTTP 403 PERMISSION_DENIED. GOOGLE_API_KEY has the Chrome UX Report API blocked or not enabled for its project (reasons returned: API_KEY_SERVICE_BLOCKED and SERVICE_DISABLED), despite the auth check listing CrUX as OK. This is an API configuration failure, not a finding of insufficient Chrome traffic. No lab data substituted. Fix: enable Chrome UX Report API for the key's GCP project and remove the key's API restriction. Severity MEDIUM (blocks field CWV evidence).

## Indexing API applicability
Not applicable. The Indexing API is only supported for JobPosting and BroadcastEvent (livestream) structured data. A bakery has neither, so it should not be used. Use sitemap submission and, for individual pages, URL Inspection "Request indexing" in the GSC UI (not available via API).

## Recommendations (priority)
1. High: Publish the pending build (removes /cakes from sitemap, enacts the 301), then submit /sitemap.xml in GSC and retire the wp-sitemaps.
2. High: Review the 9 crawled-not-indexed posts for overlap with higher-priority pages; consolidate or differentiate the head-term ones (eggless-cake-sydney, wedding, parramatta, baulkham-hills, westmead).
3. Medium: Strengthen internal links to /locations and eggless-cakes-wentworthville; request indexing in the GSC UI.
4. Medium: Enable the CrUX API and rerun.
5. Low: Decide /blog vs /blog/ canonical and keep it consistent with what Google holds.

## Score
INDEXATION_SCORE: 62/100
Justification: 75% of sampled posts and all key commercial pages except /locations are indexed with zero canonical mismatches, clean fetch/robots states and no rich-result errors (strong). Deductions: 22.5% of posts crawled-but-rejected, /locations not indexed, the live sitemap.xml unregistered in GSC with legacy WordPress sitemaps still carrying an error, and a deleted /cakes URL still indexed because of the stale deploy.
BASIS: 49 URLs inspected via the URL Inspection API (40 blog posts, 9 static strings) plus the GSC Sitemaps API; CrUX unavailable (403). Site-wide figures are extrapolations from a non-random sample.
