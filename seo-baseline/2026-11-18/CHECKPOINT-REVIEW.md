# SEO Checkpoint — 2026-11-18

Raw pulls in this folder (GSC date / date×query / date×page to 18 Nov, dataState `all`).

## Verdict
**Clicks flat (175–199/week), desktop head terms sliding, and the cause is almost certainly
Google's November 2026 core update, not the site.** Nothing was published between 11 Oct and
12 Nov (Netlify deploy history), yet the slide starts the week of 26 Oct, when rank trackers
show heavy volatility (Mozcast ~80 from 30 Oct; the update was confirmed 10 Nov and runs to
about 24 Nov). The 12 Nov work (Christmas rewrite, 14 merges) was published **18 Nov 21:52
Sydney** (`0871d6ca`), mid-rollout, so its effect cannot be separated from the update's.
Do not react until about two weeks after the rollout ends: **next read 8 Dec**.

## Numbers
| Week | Clicks | Impr | CTR | Pos | Brand | Non-brand |
|---|---:|---:|---:|---:|---:|---:|
| 19 Oct | 171 | 7,789 | 2.20% | 10.7 | 40 | 40 |
| 26 Oct | 195 | 9,378 | 2.08% | 9.8 | 50 | 47 |
| 2 Nov | 199 | 12,451 | 1.60% | 9.1 | 43 | 52 |
| 9 Nov | 175 | 12,435 | 1.41% | 10.5 | 49 | 39 |

- The impressions jump is mostly informational junk: "is egg free diet safe" 2,002 impr,
  0 clicks; "clean eating vs egg free diet" 509, 0. Both land on `are-eggless-cakes-healthy`
  (3,022 impr vs 296, 1 click). CTR "falling" is that, not lost buyers.
- **Head terms, weekly average position, 12 Oct → 9 Nov:** "eggless cake near me" 8 → 21,
  "eggless cake sydney" 15 → 32, "eggless cakes sydney" 19 → 39, "eggless cake shop" 15 → 28.
  The losses are desktop. On mobile, near-me still ranks 4–8 (Quakers Hill 8.0, Schofields 7.7,
  homepage 4.2). Desktop "eggless cake sydney" has the homepage at 44, and the nut-free post
  ranks for it, which is a cannibalisation signal.
- Gaining: the Indian sweets hub (2,234 impr, 13 clicks), serving-size guide (17 clicks),
  cake smash (11), same-day (7). Losing: photo-cake 17 → 9 clicks, `/cakes` 20 → 13.
- GA4 organic sessions 212–254/week, flat. **Shop funnel events are still zero** in November.

## State
- `/cakes`: still indexed from the 19 Sep crawl. Request indexing in Search Console has
  evidently not been done.
- Christmas page: still "Crawled – not indexed" (last crawl 16 Jul). It went live today and
  needs Request indexing too (it has changed, so plan rule 2 allows it).
- IndexNow pinged 18 Nov for the 14 retired URLs, their survivors, the Christmas page and `/cakes` (HTTP 200).
- The SEO loop never ran: `LOOP-BACKLOG.md` has all 16 items open.
