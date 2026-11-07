# SEO Checkpoint — 2026-11-07

The 3 Nov decision point in `plans/SEO Fix Plan — 2026-10.md`, read four days late.
Raw pulls in this folder: `pull.py` (GSC date / date×query / date×page 3 Aug – 6 Nov, GA4
weekly channel + organic events), `inspect_all.json` (URL Inspection over all 240 sitemap
URLs, same script as `../2026-10-10/inspect_all.py`). GSC dataState `all`, last day 6 Nov.

## Verdict

**Flat. Stable but not growing.** Clicks have held ~170–215/week since August; the gains
are in position, not traffic. Plan branch: "index count stable and clicks ~200/week →
stop, round 2 only for pages Google drops", plus the Christmas page, which is unindexed.

## 1. Weekly clicks (GSC)

| Week (Mon) | Clicks | Impr | CTR | Pos | Brand clicks | Non-brand clicks |
|---|---:|---:|---:|---:|---:|---:|
| 3 Aug | 201 | 8,608 | 2.34% | 11.8 | 43 | 46 |
| 31 Aug | 212 | 7,051 | 3.01% | 9.7 | 54 | 50 |
| 14 Sep | 215 | 6,899 | 3.12% | 11.0 | 64 | 40 |
| 28 Sep | 138 | 7,174 | 1.92% | 10.3 | 41 | 33 |
| 12 Oct | 206 | 7,217 | 2.85% | 9.5 | 66 | 39 |
| 19 Oct | 171 | 7,789 | 2.20% | 10.7 | 40 | 40 |
| 26 Oct | 195 | 9,378 | 2.08% | 9.8 | 50 | 47 |
| 2 Nov (5 days) | 129 | 6,744 | 1.91% | 8.8 | 30 | 31 |

Brand/non-brand counts are from the query dimension, which drops anonymised queries
(~half of all clicks), so they do not sum to the total.

- **Non-brand clicks have been 31–54/week for three months.** No growth.
- **Non-brand position is improving**: impressions in positions 4–10 went 4,918 → 6,568,
  positions 11–20+ went 8,790 → 6,613 (28 days to 6 Nov vs the 28 before).
- **CTR is falling** (3.1% → ~2.0%) because impressions grew into positions that get few
  clicks, plus informational queries ("is egg free diet safe", "clean eating vs egg free
  diet", "how long does fresh cream cake last") that send almost no traffic.
- GA4 organic sessions: 211–289/week since August; week of 2 Nov is 194 for 5 days (best pace).

## 2. Pages, 28 days to 6 Nov vs 28 before (clicks)

- Up: `/indian-sweet` 12→21, `/blog/cake-serving-size-guide-sydney` 1→16, `/locations`
  0→14, `/blog/indian-sweets-harris-park-riverstone-sydney` 0→12 (newly indexed),
  `/blog/cake-price-guide-sydney` 5→11.
- Down: `/blog/best-eggless-cake-shops-sydney-2026` 56→15 (biggest loss).
- **`/cakes` still gets 38 clicks a month** a month after the 301 went live (verified 301 on
  7 Nov). Google is still showing the old URL. `/order` is 10 clicks at position 13.1
  (was 4.8 on 1,005 impressions); it has not absorbed `/cakes`.
- "eggless cake near me" (top non-brand query): 849 impr, pos 10.0, 20 clicks (was 35).

## 3. Indexing (URL Inspection, 240 sitemap URLs)

| State | 10 Oct | 18 Oct | 7 Nov |
|---|---:|---:|---:|
| Submitted and indexed | 200 | 201 | 199 |
| Crawled – currently not indexed | 35 | 35 | 40 |
| Discovered – currently not indexed | 3 | 3 | 1 |
| URL is unknown | 2 | 1 | 0 |

Count is stable but the set is churning. Since 10 Oct, 14 pages dropped out (blacktown,
marayong, rouse-hill, north-parramatta, marsden-park, anniversary, graduation,
fathers-day, housewarming, wedding-north-west, vegan-vs-eggless,
why-we-chose-100-percent-eggless, birthday-cake-near-me-sydney-suburbs,
recipe-vs-bakery) and 13 came in (locations, parramatta, quakers-hill, baulkham-hills,
rosehill, wentworthville, eggless-cake-sydney, indian-sweets hub, number-cakes, tiered,
milestone, farewell, ramadan). **`eggless-cakes-christmas-sydney` is still unindexed**
(last crawl 16 Jul).

## 4. Conversion

- GA4 shows **zero `view_item` / `add_to_cart` / `begin_checkout` / `purchase` events** from
  any channel, 1 Oct – 6 Nov, though real web orders were paid in that period (RV-1823,
  HP-1789). The live `/shop/` loads GTM-NM5H6SSZ and `analytics.ts` pushes the events to
  the dataLayer, so the likely gap is that the GTM container has no GA4 event tags for
  them. Not verified (no GTM access from here).
- Organic `order_form_submit` 0–3/week, `enquiry_click` 1–3/week. Key events are now marked.

## Next

1. Christmas: merge `eggless-cakes-christmas-sydney` into a page that is indexed, or rewrite
   it as the real owner, before December (plan Phase 3 row 3).
2. Round 2 on the 14 pages that dropped: merge, never re-request (standing rule 2).
3. `/order`: why it ranks at 13 when `/cakes` ranked 9–12 for the same demand.
4. Check why the shop funnel fires nothing in GA4.
