# SEO loop backlog

Worked top to bottom by the SEO improvement loop, one item per iteration. Each item
is safe to ship on its own and leaves `node verify-blog.mjs` green. Data: GSC, 28 days
to 6 Nov vs the 28 before (`seo-baseline/2026-11-07/daily_page.json`, `daily_query.json`).

Rules every item obeys (from `plans/SEO Fix Plan — 2026-10.md` and CLAUDE.md):
- **No new URLs.** No new blog posts, no new location or occasion pages.
- A page Google dropped gets **merged**, never re-requested.
- Facts (prices, sizes, flavours, hours, lead time) come from `ops/catalog.mjs`, never memory.
  No invented statistics, order data, reviews or scarcity. Pickup only. Not halal-certified.
- `blog-write` skill before rewriting any post body; `frontend-design` before any layout change.
- Change only what the item names. Mark it `[x]` with the date and what changed, in the same commit.

## Backlog

### A. Snippets on page-1 pages with weak CTR (highest leverage: they already rank)
Title ≤ 60 chars, meta ≤ 160 with two concrete numbers, answer the query in the first
sentence. Use the page's own top queries (pull them per page from the GSC API).
- [x] A1 2026-11-12 `/blog/eggless-cake-storage-freshness-guide`. Before (GSC 14 Oct–10 Nov): 2,744 impr, 25 clicks (0.91%), pos 5.6. The 31 "fresh cream cake" queries are 510 impr at pos 5–9 with **0 clicks**: the old title/meta led with "eggless" and the meta said "~5 days in the fridge", which is the buttercream figure and contradicted the body's 2–3 days for fresh cream. Changed: title → "How Long Does Fresh Cream Cake Last in the Fridge? 2–3 Days" (59), meta/og/twitter/Article description lead with 2–3 days at 5°C and the 2-hour out-of-fridge limit (both already sourced on the page to NSW Food Authority), Quick answer now opens with the fresh-cream answer. H1 and body unchanged. Evidence: `seo-baseline/2026-11-12/blog__eggless-cake-storage-freshness-guide.json` (re-pull with `page_queries.py`). Re-check from ~10 Dec, after it is published.
- [x] A2 2026-11-12 `/blog/cake-serving-size-guide-sydney`. Before (GSC 14 Oct–10 Nov): 3,314 impr, 17 clicks (0.51%), pos 6.3. Top queries are "how many people does an 8 / 6 inch cake feed" at pos 4–6 with 0 clicks; the old title was a label and the meta asked the question back without answering it. Changed: title → "How Many Does an 8 Inch Cake Feed? Cake Size Guide Sydney" (57), meta/og/twitter answer it (8 inch 12–14, 6 inch 6–8, up to 16 inch 50–55, from $39.99, all from `ops/catalog.mjs` SIZES). Quick answer already led with the chart, body unchanged. "cake size guide" (21 impr, pos 18) and "cake serving guide" (20, pos 30) are head terms we sit far off; not a snippet job. Evidence: `seo-baseline/2026-11-12/blog__cake-serving-size-guide-sydney.json`.
- [x] A3 2026-11-12 `/blog/indian-sweets-harris-park-riverstone-sydney`. Before (GSC 14 Oct–10 Nov): 2,845 impr, 17 clicks (0.60%), pos 7.1. "indian sweets near me" 445 impr pos 8.2 (3 clicks); the Harris Park shop queries ("harris park sweet shop" 67, "sweet shop harris park" 56, "harris park sweets" 26, "sweet shop in harris park" 17) sit at pos ~5 with **0 clicks**, "indian sweets parramatta" 47 at pos 6.7. Changed: title/og/twitter → "Indian Sweet Shop Harris Park, Parramatta and Riverstone" (56); meta/og/twitter description → both shops with their hours from `ops/catalog.mjs` COLLECTION (11am–10pm, 9am–6:30pm) and the sweets. Body and H1 unchanged. Evidence: `seo-baseline/2026-11-12/blog__indian-sweets-harris-park-riverstone-sydney.json`.
- [x] A4 2026-11-12 `/indian-sweet` vs the A3 hub: **no cannibalisation to fix**. Owners: the hub takes local intent ("indian sweets near me" 8.2 vs 11.7, every Harris Park/Parramatta query); `/indian-sweet` takes product intent. Before (14 Oct–10 Nov): 2,478 impr, 22 clicks, pos 9.5; "gulab jamun near me" 45 at 8.7, "kaju katli sydney/near me" 37 at ~9, "buy indian bakery online" 82 at 5.4, all 0 clicks. Changed: title/og/twitter → "Eggless Indian Sweets Sydney: Kaju Katli, Gulab Jamun, Barfi" (60; the page already uses both katli and katri), descriptions name those sweets, from $33.99/kg (the page's own price), 2 pickup shops. Already says pickup only, incl. the delivery FAQ; body unchanged.
  Evidence from A3 (2026-11-12): the hub out-ranks `/indian-sweet` on "indian sweets near me" (8.2 vs 11.7) and every Harris Park/Parramatta shop query, so the hub owns local intent; `/indian-sweet` gets product/online queries ("buy indian bakery online" 82 at 5.4, "gulab jamun near me" 45, "kaju katli sydney" 20, "indian sweets sydney" 80 at 11.5). It also shows "indian sweets delivery sydney" (19 impr, 2 clicks): check the page says pickup only. Snippet: 2,478 impr, 22 clicks, pos 9.5.
- [x] A5 2026-11-12 `/blog/eggless-cakes-soft-moist-myths-vs-facts`. Before (14 Oct–10 Nov): 1,238 impr, 7 clicks (0.57%), pos 7.0. Queries are "are eggless cakes really eggless" (34, pos 4.2), "does cake contain egg" (26), "does eggless cake taste different" / "do egg free cakes taste different" (~37 combined, pos 6–8), "how to identify eggless cake" (11), all 0 clicks; the old title said "soft and moist", which nobody searches. Changed: title/og/twitter → "Do Eggless Cakes Taste Different? 8 Myths vs Facts" (50); descriptions answer "really eggless" (15 flavours from `ops/catalog.mjs`, 100% egg-free kitchen) and name the 8 myths the page covers. Body unchanged.
- [x] A6 2026-11-12 `/blog/eggless-cake-vs-regular-cake`. Before (14 Oct–10 Nov): 1,640 impr, 11 clicks (0.67%), pos 7.0. Queries: "does cake contain egg" / "do cakes have eggs" / "does cake have eggs" / "do all cakes have eggs" (~77 combined, pos 5–8), "eggless cake means/meaning" (39, pos 8.6), "eggless cake vs egg cake", "egg vs eggless cake", "difference between egg and eggless cake" (~60), all 0 clicks. Merged vegan-vs-eggless had 455 impr in 90 days at pos 6.9. Changed: title/og/twitter → "Eggless Cake vs Egg Cake: Meaning, Taste and Difference" (55); descriptions answer "does cake contain egg" and name vegan vs eggless. Also fixed an FAQ answer (body + schema) that still sent readers to "our vegan vs eggless guide", which was merged into this page today.
  **Overlap with A5:** both pages rank for "does cake contain egg" and "does eggless cake taste different" (pos 5–9 on each). Owners now: A5 (myths) for taste, A6 for difference/meaning/contains egg. Re-check the split in December with `page_queries.py`; merge only if they still trade places.
- [x] A7 2026-11-12 `/blog/are-eggless-cakes-healthy`: **no change, on purpose.** Before (14 Oct–10 Nov): 2,458 impr, 4 clicks (0.16%), pos 8.0. 92% of impressions are diet questions, not cake: "is egg free diet safe" 1,384 at pos 9.8, "clean eating vs egg free diet" 411, "egg free vs calorie counting diet" 92, "egg free vs clean eating diet" 46, "calorie counting vs egg free diet" 28, all 0 clicks. The page never mentions an egg-free diet, clean eating or calorie counting; Google is matching it loosely. Retargeting it would mean writing diet-safety advice (YMYL) on a bakery blog for searchers who are not buying cake, so the low CTR is the right result. The cake-intent queries ("are eggless cakes good" 15 at 2.1, "is cake healthy" 27 at 10.8) are already served by the current title. Do not re-propose a diet rewrite.
- [x] A8 2026-11-12 Unsourced "In blind tests, most people cannot tell the difference" removed from the A5 post's FAQ (visible answer + FAQ schema), replaced with the qualitative "Not in a way most people notice." No study was cited and none is ours. It was the only post carrying it.

### B. Diagnose losses
- [x] B1 2026-11-12 `/blog/best-eggless-cake-shops-sydney-2026`: **diagnosed, no page change.** 16 Sep–13 Oct vs 14 Oct–10 Nov: clicks 50 → 13, impr 2,232 → 1,584, pos 10.0 → 11.7 (`seo-baseline/2026-11-12/b1_loss.py`, `b1_loss.json`, `b1_sydney_queries.json`). Two causes:
  1. **"eggless cake near me" (10 → 0 clicks, pos 7.7 → 10.3)** is the biggest single loss. Google now spreads that query over our own local pages: `/blog/eggless-cakes-schofields` (203 impr, pos 6.1, 5 clicks), `/` (152, pos 10.5, 8 clicks), `/blog/eggless-cakes-dean-park` (154, pos 10.0). The clicks moved to other pages of ours rather than to a competitor, and near-me is local, so per fix-plan rule 4 this is not a fix. B2 measures the query site-wide.
  2. **"eggless cake sydney" (pos 9.7 → 16.3) and "eggless cakes sydney" (12.2 → 22.2)** went to the **old `/cakes` URL**, which Google still holds: `/cakes` rose to pos 10.8 / 12.3 on 116 / 167 impr with 0 clicks, although it has 301'd to `/order` since 8 Oct. Ours, but the fix is a recrawl, not code: see E1 and Needs Vaidik.
  Watch: `/blog/eggless-cakes-near-me-sydney` newly ranks for "eggless cake shop" (80 impr, pos 8.3) beside this page (108, pos 6.6). One month is not a pattern; re-check in December before treating it as cannibalisation.
- [ ] B2 "eggless cake near me": 849 impr, pos 10.0, clicks 35 → 20. Which URL ranks for it, per device? Near-me queries are local, so many URLs is normal (fix plan rule 4). Only act on a clear signal.

### C. Round 3 merges: pages that are unindexed and earn nothing
Re-run `SP=seo-baseline/<today> python3 seo-baseline/2026-10-10/inspect_all.py` first.
Merge only pages that are **still** "Crawled/Discovered – not indexed" **and** had under
25 impressions in 90 days. Use the Phase 1 mapping in the fix plan, with the
`merge_round2.py` mechanics. Fold each page's unique facts into its target first.
**Survivors must be indexed.** `wedding-cake-sydney-north-west` is gone, so wedding
pages go to `tiered-cakes-sydney`.
- [ ] C1 Suburb pages from the fix plan's Phase 1 list that are still unindexed → location hub (keep Schofields, Dean Park).
- [ ] C2 Topic pages from the Phase 1 table that are still unindexed → their owners.
- [ ] C3 `eggless-cakes-mothers-day-sydney`: no indexed owner. Decide: merge into `best-cake-sydney` (occasions card) or leave until March. Do not rewrite before February.

### D. Internal links into the pages that earn
- [ ] D1 `/locations` (1,426 impr, pos 5.3, now indexed): link to it from the 10 blog pages with the most impressions, with an exact anchor ("our two shops", "Harris Park and Riverstone shops"), where it reads naturally.
- [ ] D2 The location hub (the top-earning blog page): check that the surviving suburb pages link to it, not to merged URLs.

### E. Technical
- [ ] E1 Re-check `/cakes` with URL Inspection. If it still shows the 19 Sep crawl, note it for Vaidik (manual Request indexing). Do not change code for it.
- [ ] E2 Run the netlify.toml redirect resolver after every merge round: no chains, no dead targets.

## Needs Vaidik
- [ ] **Request indexing for `/cakes` in Search Console** (URL Inspection → Request indexing). Google still serves the pre-301 page for "eggless cake sydney" (116 impr, pos 10.8) and "eggless cakes sydney" (167, pos 12.3), with 0 clicks, which is also what pushed `best-eggless-cake-shops-sydney-2026` down for those terms (B1). The API cannot request indexing. Added 2026-11-12.

## Done
- [x] 2026-11-12 Christmas page rewritten as owner (`e5164e05`).
- [x] 2026-11-12 Round 2: 14 dropped pages merged (`967f3eb1`).
