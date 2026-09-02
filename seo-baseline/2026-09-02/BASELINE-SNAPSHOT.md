# GSC + GA4 Baseline Snapshot — 2026-09-02

Captured the day after the 2026-09-01 consolidation (359 → 233 posts).
This is the reference every later checkpoint compares against. Per the
research report, **impressions are expected to fall** from here as the 126
retired URLs leave the index — that is not a regression signal. Position,
CTR, query quality and conversions are.

## Site totals — last 90 days

| Metric | Value |
|---|---|
| Clicks | 2,010 |
| Impressions | 89,578 |
| CTR | 2.24% |
| Average position (impression-weighted) | 10.7 |
| URLs with impressions | 381 |
| Distinct queries | 3,413 |
| GA4 organic sessions | 2,410 |
| GA4 organic users | 2,092 |
| GA4 organic pageviews | 5,010 |

## Trend within the window (first half vs second half)

| Half | Impressions | Clicks | CTR | Avg position |
|---|---:|---:|---:|---:|
| First 44d | 24,202 | 732 | 3.02% | 12.3 |
| Second 44d | 46,801 | 1,246 | 2.66% | 10.9 |
| Change | +22,599 | +514 | -0.36pp | -1.5 |

## Blog vs commercial pages

| Set | URLs | Impressions | Clicks | CTR | Avg position |
|---|---:|---:|---:|---:|---:|
| Blog | 361 | 55,029 | 777 | 1.41% | 9.6 |
| Commercial + home | 20 | 34,549 | 1,233 | 3.57% | 12.5 |

## Cannibalisation at baseline

- Queries where 2+ URLs each hold ≥5 impressions: **126**
- Impressions sitting on non-owner URLs: **16,641** (18.6% of all impressions)
- Queries where a *weaker* URL outranks the owner: **68**

Full detail: `cannibalisation-audit.csv`.

### Top 20 by impressions lost to the non-owner URL

| Query | URLs | Total impr | Split impr | Owner |
|---|---:|---:|---:|---|
| num num bakery | 61 | 4,495 | 3,524 | / |
| eggless cake near me | 35 | 3,537 | 2,297 | /blog/eggless-cake-bakery-harris-park-riverstone-sydney |
| eggless cake shop | 6 | 2,015 | 1,326 | /blog/best-eggless-cake-shops-sydney-2026 |
| num num bakery riverstone | 13 | 1,069 | 805 | / |
| eggless cake sydney | 7 | 1,116 | 761 | /blog/eggless-cake-bakery-harris-park-riverstone-sydney |
| eggless cakes sydney | 10 | 932 | 655 | /cakes |
| num nums bakery | 13 | 946 | 584 | / |
| eggless cakes near me | 12 | 849 | 532 | /blog/eggless-cake-bakery-harris-park-riverstone-sydney |
| num num bakery harris park | 22 | 616 | 508 | / |
| numnum bakery | 6 | 691 | 472 | / |
| num num riverstone | 9 | 464 | 341 | / |
| num num harris park | 10 | 415 | 313 | / |
| num nums bakery riverstone | 13 | 373 | 288 | / |
| num num bakery wentworthville | 9 | 399 | 273 | / |
| eggless cakes | 5 | 582 | 249 | /blog/best-eggless-cake-shops-sydney-2026 |
| num nums bakery riverstone menu | 15 | 294 | 216 | / |
| num num cakes | 10 | 224 | 173 | / |
| num nums bakery menu | 15 | 259 | 170 | / |
| riverstone bakery | 6 | 342 | 170 | / |
| eggless cake | 3 | 285 | 131 | /blog/best-eggless-cake-shops-sydney-2026 |

## Top 25 pages by impressions

| Page | Clicks | Impr | CTR | Pos |
|---|---:|---:|---:|---:|
| / | 1,068 | 21,568 | 5.0% | 13.7 |
| /blog/eggless-cake-bakery-harris-park-riverstone-sydney | 108 | 7,689 | 1.4% | 7.8 |
| /blog/best-eggless-cake-shops-sydney-2026 | 148 | 6,345 | 2.3% | 9.6 |
| /cakes | 53 | 4,769 | 1.1% | 14.4 |
| /blog/photo-cake-sydney | 99 | 3,797 | 2.6% | 8.5 |
| /blog/eggless-cake-storage-freshness-guide | 17 | 3,202 | 0.5% | 7.8 |
| /order | 27 | 2,722 | 1.0% | 5.3 |
| /blog/best-dessert-shop-sydney | 35 | 2,438 | 1.4% | 9.2 |
| /indian-sweet | 20 | 2,233 | 0.9% | 10.8 |
| /blog/best-cake-sydney | 13 | 2,055 | 0.6% | 13.3 |
| /about | 6 | 1,390 | 0.4% | 4.9 |
| /blog/cake-serving-size-guide-sydney | 15 | 1,349 | 1.1% | 6.6 |
| /blog/eggless-cake-vs-regular-cake | 9 | 1,341 | 0.7% | 6.8 |
| /blog/eggless-cake-egg-substitutes | 3 | 1,223 | 0.2% | 9.4 |
| http://www.numnumsbakery.com.au/ | 55 | 1,130 | 4.9% | 7.7 |
| /blog/eggless-cakes-dean-park | 13 | 1,016 | 1.3% | 8.1 |
| /blog/vegan-vs-eggless-cakes-difference | 2 | 800 | 0.2% | 8.1 |
| /blog/cake-price-guide-sydney | 14 | 700 | 2.0% | 6.1 |
| /blog/wedding-cake-sydney-north-west | 4 | 669 | 0.6% | 15.5 |
| /blog/eggless-cake-for-vegetarians-sydney | 5 | 660 | 0.8% | 20.2 |
| /blog/same-day-cake-sydney | 14 | 600 | 2.3% | 8.5 |
| /blog/eggless-cake-calories-guide-sydney | 1 | 589 | 0.2% | 7.7 |
| /blog | 4 | 543 | 0.7% | 14.5 |
| /blog/eggless-cakes-schofields | 17 | 535 | 3.2% | 6.9 |
| /blog/are-eggless-cakes-healthy | 7 | 494 | 1.4% | 4.8 |

## Top 25 queries by impressions

| Query | Clicks | Impr | CTR | Pos |
|---|---:|---:|---:|---:|
| eggless cake near me | 74 | 2,309 | 3.2% | 8.9 |
| eggless cake shop | 1 | 1,919 | 0.1% | 20.2 |
| eggless cake sydney | 18 | 1,023 | 1.8% | 18.1 |
| num num bakery | 204 | 973 | 21.0% | 2.0 |
| cake shop near me | 26 | 806 | 3.2% | 6.8 |
| num nums | 4 | 778 | 0.5% | 5.5 |
| eggless cakes near me | 14 | 754 | 1.9% | 19.0 |
| eggless cakes sydney | 6 | 679 | 0.9% | 20.1 |
| barfi near me | 0 | 677 | 0.0% | 7.9 |
| eggless cakes | 4 | 570 | 0.7% | 17.9 |
| best cakes sydney | 3 | 546 | 0.6% | 10.9 |
| num num | 8 | 397 | 2.0% | 2.5 |
| num nums bakery | 54 | 378 | 14.3% | 1.7 |
| bakery near me | 4 | 330 | 1.2% | 9.3 |
| dessert near me | 0 | 324 | 0.0% | 17.6 |
| riverstone bakery | 2 | 306 | 0.7% | 5.9 |
| nom nom bakery | 10 | 303 | 3.3% | 5.0 |
| eggless cake | 6 | 303 | 2.0% | 8.1 |
| num num bakery riverstone | 50 | 266 | 18.8% | 1.3 |
| egg free cakes parramatta | 0 | 234 | 0.0% | 15.3 |
| photo cake | 3 | 233 | 1.3% | 11.7 |
| numnum bakery | 64 | 220 | 29.1% | 1.3 |
| harris park cake shop | 6 | 215 | 2.8% | 6.0 |
| indian bakery | 0 | 211 | 0.0% | 10.4 |
| organic neem cake in sydney | 0 | 189 | 0.0% | 58.2 |
