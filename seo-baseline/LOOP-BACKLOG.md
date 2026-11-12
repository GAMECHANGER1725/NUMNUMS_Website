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
- [ ] A4 `/indian-sweet`: 1,997 impr, pos 9.9, 21 clicks. Check that A3 and A4 do not compete for the same queries; pick an owner per query.
  Evidence from A3 (2026-11-12): the hub out-ranks `/indian-sweet` on "indian sweets near me" (8.2 vs 11.7) and every Harris Park/Parramatta shop query, so the hub owns local intent; `/indian-sweet` gets product/online queries ("buy indian bakery online" 82 at 5.4, "gulab jamun near me" 45, "kaju katli sydney" 20, "indian sweets sydney" 80 at 11.5). It also shows "indian sweets delivery sydney" (19 impr, 2 clicks): check the page says pickup only. Snippet: 2,478 impr, 22 clicks, pos 9.5.
- [ ] A5 `/blog/eggless-cakes-soft-moist-myths-vs-facts`: 1,362 impr, pos 7.1, 7 clicks (0.5%).
- [ ] A6 `/blog/eggless-cake-vs-regular-cake`: 1,320 impr, pos 7.0, 9 clicks. It absorbed three merged pages on 2026-11-12, so check its snippet covers vegan-vs-eggless too.
- [ ] A7 `/blog/are-eggless-cakes-healthy`: 717 impr, pos 5.9, 4 clicks. "is egg free diet safe" and "clean eating vs egg free diet" land here at pos 6–7.

### B. Diagnose losses
- [ ] B1 `/blog/best-eggless-cake-shops-sydney-2026`: clicks 56 → 15, position 9.5 → 10.4. Find which queries left (GSC query × page) and whether another of our pages took them (cannibalisation) or a competitor did. Fix only if the cause is ours.
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

## Done
- [x] 2026-11-12 Christmas page rewritten as owner (`e5164e05`).
- [x] 2026-11-12 Round 2: 14 dropped pages merged (`967f3eb1`).
