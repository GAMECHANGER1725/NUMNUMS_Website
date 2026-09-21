# GSC + GA4 Baseline Snapshot — 2026-09-02

Captured the day after the 2026-09-01 consolidation (359 → 233 posts).
This is the reference every later checkpoint compares against. Per the
research report, **impressions are expected to fall** from here as the 126
retired URLs leave the index — that is not a regression signal. Position,
CTR, query quality and conversions are.

## Site totals — last 90 days

| Metric | Value |
|---|---|
| Clicks | 2,346 |
| Impressions | 103,712 |
| CTR | 2.26% |
| Average position (impression-weighted) | 10.3 |
| URLs with impressions | 383 |
| Distinct queries | 3,756 |
| GA4 organic sessions | 2,778 |
| GA4 organic users | 2,403 |
| GA4 organic pageviews | 5,790 |

## Trend within the window (first half vs second half)

| Half | Impressions | Clicks | CTR | Avg position |
|---|---:|---:|---:|---:|
| First 44d | 34,909 | 998 | 2.86% | 11.2 |
| Second 45d | 47,761 | 1,309 | 2.74% | 10.8 |
| Change | +12,852 | +311 | -0.12pp | -0.4 |

## Blog vs commercial pages

| Set | URLs | Impressions | Clicks | CTR | Avg position |
|---|---:|---:|---:|---:|---:|
| Blog | 369 | 67,857 | 987 | 1.45% | 9.5 |
| Commercial + home | 14 | 35,855 | 1,359 | 3.79% | 12.0 |

## Cannibalisation at baseline

- Queries where 2+ URLs each hold ≥5 impressions: **130**
- Impressions sitting on non-owner URLs: **18,570** (17.9% of all impressions)
- Queries where a *weaker* URL outranks the owner: **63**

Full detail: `cannibalisation-audit.csv`.

### Top 20 by impressions lost to the non-owner URL

| Query | URLs | Total impr | Split impr | Owner |
|---|---:|---:|---:|---|
| num num bakery | 60 | 5,155 | 4,164 | / |
| eggless cake near me | 34 | 4,197 | 2,839 | /blog/best-eggless-cake-shops-sydney-2026 |
| eggless cake shop | 6 | 2,164 | 1,397 | /blog/best-eggless-cake-shops-sydney-2026 |
| num num bakery riverstone | 11 | 1,020 | 760 | / |
| eggless cake sydney | 8 | 1,100 | 714 | /blog/best-eggless-cake-shops-sydney-2026 |
| num nums bakery | 13 | 1,050 | 699 | / |
| eggless cakes sydney | 12 | 878 | 584 | /blog/best-eggless-cake-shops-sydney-2026 |
| num num bakery harris park | 19 | 714 | 578 | / |
| eggless cakes near me | 11 | 832 | 528 | /blog/eggless-cake-bakery-harris-park-riverstone-sydney |
| numnum bakery | 9 | 716 | 507 | / |
| num num riverstone | 9 | 592 | 433 | / |
| num num harris park | 10 | 454 | 338 | / |
| num nums bakery harris park | 9 | 362 | 280 | / |
| num num bakery wentworthville | 8 | 367 | 256 | / |
| eggless cakes | 5 | 728 | 244 | /blog/best-eggless-cake-shops-sydney-2026 |
| num nums bakery riverstone menu | 14 | 308 | 234 | / |
| num nums bakery riverstone | 7 | 285 | 211 | / |
| num num cakes | 13 | 262 | 210 | / |
| riverstone bakery | 6 | 344 | 200 | / |
| numnums bakery | 5 | 297 | 176 | / |

## Top 25 pages by impressions

| Page | Clicks | Impr | CTR | Pos |
|---|---:|---:|---:|---:|
| / | 1,236 | 22,501 | 5.5% | 13.1 |
| /blog/best-eggless-cake-shops-sydney-2026 | 210 | 8,404 | 2.5% | 9.0 |
| /blog/eggless-cake-bakery-harris-park-riverstone-sydney | 114 | 7,495 | 1.5% | 7.5 |
| /blog/photo-cake-sydney | 133 | 5,356 | 2.5% | 9.0 |
| /cakes | 57 | 5,076 | 1.1% | 14.2 |
| /blog/eggless-cake-storage-freshness-guide | 24 | 4,131 | 0.6% | 7.2 |
| /order | 32 | 3,019 | 1.1% | 4.8 |
| /indian-sweet | 22 | 2,927 | 0.8% | 10.8 |
| /blog/best-dessert-shop-sydney | 38 | 2,886 | 1.3% | 9.9 |
| /blog/best-cake-sydney | 14 | 2,296 | 0.6% | 14.5 |
| /blog/cake-serving-size-guide-sydney | 18 | 1,933 | 0.9% | 6.9 |
| /blog/eggless-cake-vs-regular-cake | 12 | 1,841 | 0.7% | 6.9 |
| /blog/eggless-cakes-dean-park | 20 | 1,648 | 1.2% | 8.1 |
| /about | 7 | 1,645 | 0.4% | 4.3 |
| /blog/eggless-cake-egg-substitutes | 3 | 1,337 | 0.2% | 9.1 |
| /blog/eggless-cakes-schofields | 33 | 1,254 | 2.6% | 6.8 |
| /blog/cake-price-guide-sydney | 18 | 910 | 2.0% | 6.1 |
| /blog/kids-birthday-cake-sydney | 17 | 871 | 1.9% | 13.9 |
| /blog/same-day-cake-sydney | 14 | 771 | 1.8% | 8.7 |
| /blog/first-birthday-cake-sydney | 27 | 770 | 3.5% | 10.5 |
| /blog/vegan-vs-eggless-cakes-difference | 2 | 757 | 0.3% | 7.8 |
| /blog/halal-friendly-cakes-eggless-sydney | 7 | 742 | 0.9% | 12.6 |
| /blog/eggless-cake-for-vegetarians-sydney | 6 | 675 | 0.9% | 20.0 |
| /blog | 5 | 672 | 0.7% | 13.7 |
| /blog/eggless-cake-calories-guide-sydney | 1 | 629 | 0.2% | 7.6 |

## Top 25 queries by impressions

| Query | Clicks | Impr | CTR | Pos |
|---|---:|---:|---:|---:|
| eggless cake near me | 89 | 2,612 | 3.4% | 8.8 |
| eggless cake shop | 1 | 2,034 | 0.1% | 20.7 |
| num num bakery | 215 | 993 | 21.6% | 1.8 |
| eggless cake sydney | 23 | 966 | 2.4% | 19.1 |
| barfi near me | 0 | 948 | 0.0% | 7.9 |
| cake shop near me | 26 | 867 | 3.0% | 7.0 |
| num nums | 4 | 845 | 0.5% | 5.6 |
| eggless cakes | 7 | 715 | 1.0% | 17.1 |
| eggless cakes near me | 16 | 710 | 2.2% | 17.9 |
| eggless cakes sydney | 7 | 634 | 1.1% | 20.9 |
| best cakes sydney | 3 | 559 | 0.5% | 11.6 |
| num num | 9 | 424 | 2.1% | 2.4 |
| num nums bakery | 63 | 352 | 17.9% | 1.6 |
| bakery near me | 5 | 331 | 1.5% | 9.1 |
| photo cake | 5 | 326 | 1.5% | 12.6 |
| dessert near me | 0 | 320 | 0.0% | 17.4 |
| riverstone bakery | 2 | 301 | 0.7% | 6.4 |
| eggless cake | 5 | 299 | 1.7% | 8.1 |
| egg free cakes parramatta | 0 | 270 | 0.0% | 15.3 |
| nom nom bakery | 9 | 269 | 3.4% | 5.7 |
| num num bakery riverstone | 55 | 262 | 21.0% | 1.3 |
| photo print cake | 0 | 237 | 0.0% | 11.5 |
| print cake | 0 | 232 | 0.0% | 13.5 |
| indian bakery | 0 | 214 | 0.0% | 11.1 |
| harris park cake shop | 8 | 211 | 3.8% | 5.9 |
