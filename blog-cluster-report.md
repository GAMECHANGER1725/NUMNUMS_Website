# Blog Cluster Report — Num Num's Bakery

Analysis date: 2026-09-01. Corpus: 359 posts in `blog/*.html` (all filenames below are relative to `blog/`, `.html` omitted for brevity except where needed to disambiguate). Read-only analysis — no blog files were edited, moved, or deleted to produce this report.

## Methodology note

Given 359 posts, exhaustive live pairwise SERP-overlap checks (WebSearch every keyword pair) is not feasible token-wise and wasn't attempted for all ~12,800 possible pairs. Instead:

1. Pulled `<title>`, meta description, and H1 for **all 359 posts** (not a sample) via a single grep pass — this is the primary evidence base below, since on this site title/H1/meta are a reliable, consistently-templated proxy for target query and search intent.
2. Pulled full visible body text (tags stripped) for a representative sample per cluster (suburb pages, near-me pages, festival pages, price/size pages) to confirm the meta-level read matches actual on-page content depth and structure.
3. Ran **live WebSearch SERP checks** on the two highest-risk geographic cannibalization zones flagged in the brief (`eggless-cakes-guildford*` family and the Mount Druitt / western-suburbs family). Both confirmed self-competition empirically — see "Empirical SERP evidence" below — which is used as the evidentiary anchor for the suburb-cluster policy rather than re-running the same check 140 more times.
4. Every "MERGE" verdict below is a same-post-tier call (SERP-overlap methodology's 7–10-shared-URL band, inferred from near-identical H1/title templates or confirmed duplicate intent, not just topical similarity). Every "INTERLINK" call is the 2–3-shared-URL band (adjacent intent, distinct enough to stay separate, but should cross-link). Anything not flagged is treated as its own distinct intent (0–1 shared) and kept as-is.

**Empirical SERP evidence used:** A live search for `eggless cake shop near me Mount Druitt NSW` returned **three separate Num Num's URLs** in a single results page — `eggless-cakes-mount-druitt`, `eggless-cakes-willmot`, and `eggless-cakes-minchinbury` — i.e. the site is already competing against itself for one real query. This confirms the brief's hypothesis that the suburb cluster's adjacent/low-population pages cannibalize rather than expand coverage, and is the basis for the suburb-cluster merge policy below.

---

## Executive Summary

| Verdict | Count | % of corpus |
|---|---|---|
| **Keep as-is** (distinct intent, no content change — link-matrix work only) | ~233 | 65% |
| **Merge** (301-redirect into a stronger survivor page; fold any unique facts — local stats, specific festival dates — into the survivor as a paragraph/FAQ item before redirecting) | ~125 | 35% |
| **Prune** (delete outright, no redirect target makes sense) | 1 | <1% |

Merge breakdown:
- **71 suburb pages** (`eggless-cakes-<suburb>.html`) merge into a neighbouring, larger/better-known suburb page in the same drive-time band and shop catchment.
- **31 festival/occasion pages** (single-culture, low-mainstream-recognition observances) merge into `multicultural-celebration-cake-sydney.html`, which becomes an expanded cultural-calendar pillar.
- **23 pairs/groups** across the remaining clusters are near-duplicate intent under different slugs — several are literal quadruplicates (four separate "how to order a cake online" pages with near-identical H1s).

**Headline read for the dilution problem described in the brief:** the suburb cluster is the single largest lever — 150 pages (42% of the corpus) built on one template, many covering suburbs 2–5 minutes apart by car. That's the primary source of the flat-position/compressed-CTR signature in GSC, not the festival or life-event clusters (which, once the true near-duplicates are merged out, are legitimately differentiated intents).

**Caveat, per the task brief:** none of this analysis has access to real Google Search Console query/impression data. Every suburb MERGE verdict below is based on geographic adjacency + near-identical drive-time-band content + the empirical Mount Druitt SERP self-competition proof, not confirmed zero search volume. Before executing any redirect, a future session with GSC access should sanity-check that the page being merged away genuinely has near-zero impressions — a suburb with surprising real query volume should be kept even if it's geographically tight to its neighbour.

---

## Cluster 1: Suburb / "Near Me" Geo Pages (150 files, `eggless-cakes-<suburb>.html` + variants)

### Pattern confirmed
Every page follows an identical template: `Eggless Cakes Near [Suburb] | Num Num's Bakery`, H1 states drive time to Harris Park or Riverstone, body opens with a suburb-specific ABS/council demographic stat, then the same allergic-disease/eggless-difficulty boilerplate reused near-verbatim across pages (confirmed via full-text diff sample of `eggless-cakes-northmead.html` vs `eggless-cakes-norwest.html` — ~2,500 visible words each, same structure, same "Costly Reactions" NACE stat block, only the suburb name/distance/local census figure changes). Content is not literally duplicate (real unique local stats are woven in), but **search intent is functionally identical within a drive-time band** — "eggless cakes near me" from any of 4–6 adjacent suburbs resolves to the same answer (same shop, same ~10 minute band), which is exactly what the Mount Druitt SERP test proved.

### Policy
Keep one page per **drive-time band + shop catchment**, using the largest/best-known suburb name in that micro-cluster as the survivor. Merge (301 redirect + fold 1–2 unique local facts into survivor) the smaller/newer/adjacent suburb pages within ~5 minutes drive-time of the survivor.

### Harris Park catchment — 68 pages → 36 keep / 32 merge

| Keep (survivor / spoke) | Merges into it |
|---|---|
| eggless-cakes-clyde | — |
| eggless-cakes-granville | eggless-cakes-mays-hill, eggless-cakes-south-granville |
| eggless-cakes-rosehill | eggless-cakes-camellia |
| eggless-cakes-telopea | — |
| eggless-cakes-westmead | — |
| eggless-cakes-north-parramatta | — |
| eggless-cakes-rydalmere | — |
| eggless-cakes-sydney-olympic-park | eggless-cakes-newington |
| eggless-cakes-homebush | eggless-cakes-silverwater |
| eggless-cakes-lidcombe | — |
| eggless-cakes-auburn | — |
| eggless-cakes-berala | eggless-cakes-regents-park, eggless-cakes-birrong, eggless-cakes-yagoona |
| eggless-cakes-ermington | eggless-cakes-melrose-park |
| eggless-cakes-dundas | eggless-cakes-dundas-valley, eggless-cakes-oatlands |
| eggless-cakes-carlingford | eggless-cakes-north-rocks |
| eggless-cakes-wentworth-point | — |
| eggless-cakes-merrylands | eggless-cakes-merrylands-west, eggless-cakes-holroyd |
| eggless-cakes-guildford | eggless-cakes-guildford-west, eggless-cakes-old-guildford, eggless-cakes-yennora, eggless-cakes-woodville |
| eggless-cakes-chester-hill | eggless-cakes-sefton, eggless-cakes-villawood |
| eggless-cakes-girraween | eggless-cakes-constitution-hill, eggless-cakes-pemulwuy |
| eggless-cakes-pendle-hill | — |
| eggless-cakes-winston-hills | — |
| eggless-cakes-greystanes | eggless-cakes-prospect |
| eggless-cakes-wentworthville | — |
| eggless-cakes-toongabbie | eggless-cakes-old-toongabbie |
| eggless-cakes-northmead | — |
| eggless-cakes-baulkham-hills | — |
| eggless-cakes-fairfield | eggless-cakes-fairfield-heights |
| eggless-cakes-smithfield | eggless-cakes-prairiewood |
| eggless-cakes-wetherill-park | eggless-cakes-bossley-park |
| eggless-cakes-cabramatta | eggless-cakes-bonnyrigg |
| eggless-cakes-beecroft | — |
| eggless-cakes-ryde | eggless-cakes-denistone, eggless-cakes-meadowbank, eggless-cakes-west-ryde |
| eggless-cakes-eastwood | eggless-cakes-marsfield |
| eggless-cakes-epping | — |
| eggless-cakes-strathfield | — |
| eggless-cakes-blacktown | — |

### Riverstone catchment — ~59 pages → ~20 keep / 39 merge

| Keep (survivor / spoke) | Merges into it |
|---|---|
| eggless-cakes-marsden-park | eggless-cakes-vineyard, eggless-cakes-dean-park, eggless-cakes-colebee, eggless-cakes-grantham-farm, eggless-cakes-maraylya |
| eggless-cakes-schofields | eggless-cakes-nelson-nsw |
| eggless-cakes-tallawong | — |
| eggless-cakes-box-hill-sydney | — |
| eggless-cakes-the-ponds | — |
| eggless-cakes-riverstone | eggless-cakes-berkshire-park |
| eggless-cakes-quakers-hill | eggless-cakes-acacia-gardens, eggless-cakes-parklea, eggless-cakes-shanes-park |
| eggless-cakes-kellyville | eggless-cakes-kellyville-ridge, eggless-cakes-north-kellyville |
| eggless-cakes-rouse-hill | eggless-cakes-stanhope-gardens |
| eggless-cakes-glenwood | eggless-cakes-kings-langley |
| eggless-cakes-norwest | eggless-cakes-bella-vista |
| eggless-cakes-south-windsor | eggless-cakes-mcgraths-hill, eggless-cakes-bligh-park |
| eggless-cakes-windsor | eggless-cakes-wilberforce, eggless-cakes-pitt-town, eggless-cakes-cattai |
| eggless-cakes-richmond | eggless-cakes-north-richmond |
| eggless-cakes-mount-druitt | eggless-cakes-hebersham, eggless-cakes-whalan, eggless-cakes-tregear, eggless-cakes-bidwill, eggless-cakes-shalvey, eggless-cakes-lethbridge-park, eggless-cakes-emerton, eggless-cakes-willmot |
| eggless-cakes-doonside | — |
| eggless-cakes-rooty-hill | eggless-cakes-minchinbury |
| eggless-cakes-plumpton | eggless-cakes-oakhurst, eggless-cakes-glendenning, eggless-cakes-woodcroft, eggless-cakes-kings-park |
| eggless-cakes-castle-hill | eggless-cakes-cherrybrook |
| eggless-cakes-dural | eggless-cakes-glenhaven, eggless-cakes-glenorie, eggless-cakes-kenthurst, eggless-cakes-annangrove, eggless-cakes-galston |

### Generic geo/directory pages (not suburb-specific — keep, they're the natural link hubs for the table above)
- `eggless-cakes-northwest-sydney.html` — **KEEP.** Already positioned (per its own meta description) as the catchment hub for Schofields/The Ponds/Box Hill/Tallawong/Marsden Park. Becomes the explicit pillar for the Riverstone growth-corridor merge group above.
- `cake-delivery-areas-sydney.html` — **KEEP.** 80-suburb directory; becomes the site-wide index page linking to every surviving suburb spoke.
- `birthday-cake-near-me-sydney-suburbs.html` — **KEEP.** Directory-style, birthday-specific angle; distinct enough from `cake-delivery-areas-sydney` (different framing — "which suburbs do you serve for a birthday cake" vs "delivery area map").
- `cake-shop-near-me-marsden-park-talawong.html` — **KEEP.** Genuinely distinct hyper-local dual-suburb long-tail, not covered elsewhere.

---

## Cluster 2: Festival / Occasion Pages (53 files)

### Keep as standalone spokes (21) — mainstream Australian calendar or large, distinct Sydney communities with plausible independent search volume
`eggless-cakes-christmas-sydney`, `eggless-cakes-easter-sydney`, `eggless-cakes-valentines-day-sydney`, `eggless-cakes-mothers-day-sydney`, `eggless-cakes-fathers-day-sydney`, `halloween-cake-sydney`, `eggless-cakes-new-year-sydney`, `eggless-cakes-lunar-new-year-sydney`, `eggless-cakes-eid-sydney`, `eggless-cakes-eid-ul-adha-sydney`, `eggless-cakes-diwali-indian-festivals-sydney` (cluster hub), `eggless-cakes-navratri-sydney`, `eggless-cakes-holi-sydney`, `eggless-cakes-raksha-bandhan-sydney`, `eggless-cakes-ramadan-sydney`, `hanukkah-cakes-sydney`, `grand-final-party-cake-sydney`, `hsc-results-day-cake-sydney`, `tet-vietnamese-new-year-sydney`, `eggless-cakes-karwa-chauth-sydney`, `eggless-cakes-dussehra-sydney`.

### Merge into `multicultural-celebration-cake-sydney.html` (31) — small single-community observances, each individually low-volume in a Sydney-search context; the existing page's "one page, every culture" framing is the natural pillar
`assyrian-new-year-kha-b-nisan-sydney`, `basant-panchami-saraswati-puja-sydney`, `dashain-tihar-sydney`, `eggless-cakes-bhai-dooj-sydney`, `eggless-cakes-chhath-puja-sydney`, `eggless-cakes-chuseok-sydney`, `eggless-cakes-durga-puja-sydney`, `eggless-cakes-eid-milad-un-nabi-sydney`, `eggless-cakes-ganesh-chaturthi-sydney`, `eggless-cakes-guru-nanak-gurpurab-sydney`, `eggless-cakes-janmashtami-sydney`, `eggless-cakes-lohri-sydney`, `eggless-cakes-maha-shivratri-sydney`, `eggless-cakes-mid-autumn-festival-sydney`, `eggless-cakes-nowruz-sydney`, `eggless-cakes-onam-sydney`, `eggless-cakes-pongal-sydney`, `eggless-cakes-purim-sydney`, `eggless-cakes-sinhala-tamil-new-year-sydney`, `eggless-cakes-thaipusam-sydney`, `eggless-cakes-ugadi-sydney`, `eggless-cakes-vaisakhi-sydney`, `eggless-cakes-vesak-day-sydney`, `eggless-cakes-vishu-sydney`, `orthodox-christmas-cakes-sydney`, `passover-cakes-sydney`, `rosh-hashanah-cakes-sydney`, `songkran-thai-new-year-sydney`, `teej-sydney`, `eggless-cakes-teachers-day-sydney`, `eggless-cakes-teachers-day-sydney` *(dup removed)*.

Note: fold each merged page's specific 2026 date (many cite exact dates, e.g. Navratri "11–20 Oct 2026", Ugadi "20 March 2026") into the multicultural hub as a dated FAQ/table row rather than dropping the date entirely — that specificity is real value worth preserving even after the standalone page is retired.

### Reclassified out of this cluster
- `eggless-cakes-mehendi-sydney` → belongs to **Cluster 3 (life-event)**, it's a wedding-ceremony page, not a calendar festival.

---

## Cluster 3: Life-Event / Milestone Pages (~33 files, incl. 2 reclassified from dietary/festival)

### Confirmed duplicate pairs — MERGE
- `eggless-cakes-bat-mitzvah-sydney` → **MERGE into `eggless-cakes-bar-mitzvah-sydney`**. The bar-mitzvah page's own title already covers both ("Eggless Bar & Bat Mitzvah Cakes Sydney"); the standalone bat-mitzvah page is a straight subset.
- `eggless-cakes-confirmation-sydney` → **MERGE into `eggless-cakes-first-communion-sydney`**. First-communion page's title already says "First Communion & Confirmation Cakes Sydney".
- `anniversary-cake-sydney` → **MERGE into `eggless-cakes-anniversary-sydney`**. Same query ("eggless anniversary cake Sydney"), same "1st to 50th" framing in both; survivor picked for slug consistency with the rest of the corpus. Do not confuse with `cake-for-work-anniversary-sydney`, which is a genuinely distinct intent (workplace tenure, not relationship anniversary) — keep that one separate, just interlink.
- `eggless-cakes-corporate-events-sydney` → **MERGE into `corporate-cake-sydney`**. Same intent ("corporate/office cake, inclusive for the team"); keep `eggless-cake-bulk-order-sydney`, `eggless-cake-catering-sydney`, `eggless-cake-wholesale-sydney` separate — those are genuinely distinct B2B angles (quantity, event-service, resale) that should interlink with the merged corporate survivor, not merge into it.

### Keep as distinct spokes (rest of cluster)
`eggless-cakes-baby-shower-sydney`, `eggless-cakes-bridal-shower-sydney`, `christening-naming-day-cakes-sydney`, `eggless-cakes-engagement-sydney`, `eggless-cakes-filipino-debut-sydney`, `eggless-cakes-gender-reveal-sydney`, `eggless-cakes-graduation-sydney`, `eggless-cakes-housewarming-sydney`, `eggless-cakes-quinceanera-sydney`, `eggless-cakes-retirement-sydney`, `eggless-cakes-sweet-16-sydney`, `push-present-cake-sydney`, `farewell-cake-sydney`, `reunion-cake-sydney`, `milestone-birthday-cake-sydney`, `first-birthday-cake-sydney`, `eggless-cake-for-seniors-sydney` *(reclassified from dietary — life-stage, not diet)*, `eggless-cake-for-toddlers-sydney` *(reclassified from dietary)*, `cake-cutting-ceremony-sydney`, `cake-for-new-job-promotion-sydney`, `cake-for-work-anniversary-sydney`, `cake-for-university-events-sydney`, `eggless-cake-office-birthday-sydney`, `eggless-cakes-mehendi-sydney` *(reclassified from festival)*.

All genuinely distinct events with no meaningful pairwise overlap — this cluster was the most "correctly built" of the entire corpus.

---

## Cluster 4: Dietary / Health (13 keep, 1 merge, 2 reclassified out)

### Merge
- `eggless-cake-calories-guide-sydney` → **MERGE into `eggless-cake-nutrition-sydney`**. Calories is a subset of the nutrition page's own scope; near-identical "what's in a slice" framing.

### Keep as distinct spokes — each is a genuinely different restriction/audience
`are-eggless-cakes-healthy`, `eggless-cake-for-egg-allergy` (the core business differentiator — arguably deserves stronger internal linking than any other single spoke), `eggless-cake-for-vegetarians-sydney`, `eggless-cake-gluten-free-sydney`, `eggless-cake-keto-low-carb-sydney`, `eggless-cake-lactose-intolerance`, `eggless-cake-low-fodmap-sydney`, `eggless-cake-for-diabetics-sydney`, `eggless-cake-lower-sugar-options-sydney` *(interlink, don't merge, with diabetics page — adjacent but not identical audience)*, `eggless-cake-nut-free-sydney`, `eggless-cake-nutrition-sydney` (survivor/hub), `eggless-cake-for-pregnancy-sydney`, `halal-friendly-cakes-eggless-sydney`, `sensory-friendly-cake-sydney`, `eggless-cake-ingredient-labels-sydney`.

### Reclassified out
- `eggless-cake-for-seniors-sydney`, `eggless-cake-for-toddlers-sydney` → moved to Cluster 3 (life-stage, not dietary restriction).
- `dairy-free-vs-eggless-cakes`, `vegan-vs-eggless-cakes-difference` → belong to Cluster 5 ("vs" cluster) by structure/intent.

---

## Cluster 5: "X vs Y" Comparison Pages (16 files — 14 original + 2 folded in from dietary)

Every page targets a **different opponent** in the comparison (brownies, cheesecake, cupcakes, ice cream cake, mud cake, pavlova, regular cake, sponge cake, supermarket cake, tart, dessert table, buttercream-vs-fondant, recipe-vs-bakery, dairy-free-vs-eggless, vegan-vs-eggless, cake-smash-vs-first-birthday). This is the **best-built cluster in the corpus** — genuinely zero pairwise overlap, no merges needed.

**All 16 KEEP.** Hub: `eggless-cake-vs-regular-cake.html` (broadest, most fundamental comparison) — designate as pillar, all 15 others link to it, it links to all 15.

Files: `eggless-cake-vs-brownies`, `eggless-cake-vs-cheesecake-sydney`, `eggless-cake-vs-cupcakes-sydney`, `eggless-cake-vs-ice-cream-cake-sydney`, `eggless-cake-vs-mud-cake`, `eggless-cake-vs-pavlova`, `eggless-cake-vs-regular-cake`, `eggless-cake-vs-sponge-cake`, `eggless-cake-vs-supermarket-cake`, `eggless-cake-vs-tart-sydney`, `cake-smash-vs-first-birthday-cake-sydney`, `cake-vs-dessert-table-sydney`, `dairy-free-vs-eggless-cakes`, `vegan-vs-eggless-cakes-difference`, `eggless-cake-buttercream-vs-fondant`, `eggless-cake-recipe-vs-bakery-sydney`.

---

## Cluster 6: Kids-Birthday / Cake-Smash (13 files)

### Merge
- `eggless-cake-for-birthday` → **MERGE into `eggless-birthday-cakes-sydney`**. Near-identical H1 template ("Eggless Cake for a Birthday: The Complete Sydney Guide" vs "Eggless Birthday Cakes in Sydney: Your Complete 2026 Guide") — same query, same "complete guide" framing.
- `kids-birthday-cake-north-west-sydney` → **MERGE into `birthday-cake-north-west-sydney`**. Same geo-scoped intent; the non-kids page is broader and a better survivor since kids-specific NW-Sydney demand is already served by `kids-birthday-cake-sydney` city-wide plus `custom-kids-birthday-cakes-marsden-park-schofields` hyper-locally.

### Keep as distinct spokes
`cake-smash-cakes-sydney`, `kids-birthday-cake-sydney`, `custom-kids-birthday-cakes-marsden-park-schofields` (genuinely distinct dual-suburb long-tail), `eggless-cupcakes-kids-birthday-party-sydney`, `top-7-custom-eggless-cake-designs-kids-birthdays`, `eggless-birthday-cakes-every-age-sydney` (age-segmented listicle — distinct angle, becomes the internal-linking spine to first-birthday/milestone/toddler/senior spokes), `birthday-cake-for-men-sydney`, `unique-birthday-cake-ideas-sydney`, `how-to-design-birthday-cake-sydney`, `birthday-cake-north-west-sydney` (survivor above).

Cross-listed with Cluster 3 (`first-birthday-cake-sydney`, `milestone-birthday-cake-sydney`) and Cluster 1 (`birthday-cake-near-me-sydney-suburbs`) — no action needed beyond interlinking.

---

## Cluster 7: Design / Style / Customization (~20 files)

### Merge
- `semi-naked-cake-sydney` → **MERGE into `naked-cake-sydney`**. The naked-cake page's own meta description already says "rustic semi-naked and fully naked designs" — the standalone semi-naked page is a subset.
- `eggless-cake-customization-sydney` → **MERGE into `custom-cake-sydney`**. Both are "how to customise/order a custom cake" with heavy H1 overlap.
- `eggless-cake-flavours` → **MERGE into `cake-flavour-guide-sydney`**. Both are "how to choose the best of the 15 flavours" — the flavour-guide page is the more complete reference (explicit list of all 15), keep as survivor.
- `cake-design-trends-sydney-2026` → **MERGE into `eggless-cake-trends-sydney-2026`**. Running two separate "2026 trends" pieces (one design-scoped, one broader) is exactly the annual-thin-content duplication pattern; consolidate into one trends pillar with a design-trends section.

### Keep as distinct spokes
`drip-cake-sydney`, `photo-cake-sydney`, `number-cakes-sydney`, `theme-cakes-sydney`, `tiered-cakes-sydney`, `novelty-sculpted-cake-designs-sydney`, `sheet-cake-sydney`, `cake-toppers-sydney`, `cake-display-ideas-sydney`, `cake-message-ideas-sydney`, `eggless-cake-design-ideas-sydney` (evergreen looks list — distinct from the year-specific trends page), `eggless-cake-food-colouring-sydney`, `luxury-cake-sydney` **(see technical defect below)**, `custom-cake-sydney` (survivor), `eggless-cake-flavour-pairing-guide` (occasion-matching angle, distinct from the flavour-guide reference), `eggless-cake-indian-flavours`, `eggless-cake-seasonal-flavours` (interlink with Cluster 9 seasonal pages, don't merge).

**Technical defect found, not a cluster issue:** `luxury-cake-sydney.html` has an **empty H1 tag** (`<h1></h1>` with no text). This is an on-page SEO defect independent of clustering — fix it, don't merge/prune the page; "luxury cake" is a legitimate distinct positioning query.

---

## Cluster 8: Ingredients / How-Made / Texture (16 files)

### Merge
- `eggless-cake-egg-substitutes` → **MERGE into `how-eggless-cakes-are-made`**. Both explain what replaces eggs and why; the "how are cakes made" page is the broader, better-linking survivor.
- `eggless-cakes-soft-moist-myths-vs-facts` → **MERGE into `eggless-cake-texture-moist`**. Near-identical question ("Are eggless cakes moist?" / "Are eggless cakes really soft and moist?").

### Keep
`eggless-cake-ingredients-sydney`, `natural-ingredients-eggless-cakes` (borderline overlap with ingredients-sydney — keep both for now but flag for a future merge review once GSC data is available; brand-story angle is distinct enough to justify as a spoke today), `eggless-cake-types`, `eggless-cake-storage-freshness-guide`, `eggless-cake-transport-packaging-sydney`, `why-we-chose-100-percent-eggless-bakery` (unique brand story, no overlap), `eggless-cake-ingredient-labels-sydney` (cross-listed with Cluster 4).

### Prune
- `eggless-cake-troubleshooting.html` — **PRUNE (delete, no redirect).** This is DIY home-baking troubleshooting content ("why didn't it rise") aimed at people baking their own cake, not ordering one — it doesn't fit the commercial funnel of a bakery blog and has no natural merge target; nothing else in the corpus serves this audience, so there's no equity to preserve via redirect either.

### Reclassified out
- `eggless-cake-ordering-mistakes`, `how-to-choose-cake-sydney` → moved to Cluster 10 (ordering), they're about the ordering/decision process, not the product itself.

---

## Cluster 9: Price / Size (5 files → 3 survivors)

- `cake-price-guide-sydney` → **MERGE into `eggless-cake-price-sydney`**. Both cite the identical "$3–$6 per serve" 2026 figure for the same question.
- `cake-serving-size-guide-sydney` → **MERGE into `eggless-cake-size-guide-sydney`**. Both answer "how many people does an 8/10-inch cake feed" with the same numbers.
- `eggless-cake-small-gatherings-sydney` — **KEEP**, distinct enough (mini-cake/4–6" format for small events vs. the general sizing reference), interlink with the size-guide survivor.

---

## Cluster 10: Ordering / How-To (10 files, incl. 2 reclassified in from Cluster 8)

### Merge — the largest single duplicate group in the corpus
`cake-order-online-sydney`, `how-to-order-cake-sydney`, and `how-to-order-custom-eggless-cake-online` all **MERGE into `eggless-cake-online-order`**. All four have near-identical H1s built from the same template:
- `cake-order-online-sydney`: "How to Order a Cake Online in Sydney: A Simple Step-by-Step Guide"
- `eggless-cake-online-order`: "How to Order an Eggless Cake Online in Sydney: A Simple Step-by-Step Guide" ← survivor (word-for-word template match with the one above, minus "Eggless")
- `how-to-order-cake-sydney`: "How to Order a Custom Eggless Cake in Sydney"
- `how-to-order-custom-eggless-cake-online`: "How to Order a Custom Eggless Cake Online: Step by Step"

This is a literal quadruplicate — four pages answering the exact same "how do I order" question, almost certainly written by the automated routine on four separate days without checking `blog/` first.

### Keep as distinct spokes
`cake-consultation-sydney`, `eggless-cake-tasting-sydney`, `eggless-cake-cancellation-policy-sydney`, `eggless-cake-ordering-mistakes` *(reclassified in)*, `how-to-choose-cake-sydney` *(reclassified in — decision/selection guide, distinct from the transactional "place an order" survivor)*, `eggless-cake-bulk-order-sydney`.

---

## Cluster 11: Delivery (5 files)

- `eggless-cake-delivery-sydney` → **MERGE into `cake-delivery-sydney`**. Both are generic "cake delivery Sydney" pages; the survivor's courier-vs-click-and-collect explainer framing is more link-worthy than the marketing-page framing of the merged one.
- **Keep:** `cake-delivery-areas-sydney` (suburb directory — cross-listed with Cluster 1), `eggless-cake-transport-packaging-sydney` (DIY safe-transport tips, distinct from the delivery-service page), `same-day-cake-sydney` (urgency/timing angle, distinct).

---

## Cluster 12: Near-Me / Directory (11 files → 8 survivors)

- `cakes-near-me-sydney` → **MERGE into `eggless-cakes-near-me-sydney`**. Literal same query, "cakes near me" vs "eggless cakes near me" in Sydney.
- `best-eggless-cakes-near-me` → **MERGE into `eggless-cakes-near-me-sydney`**. Not a competitor-comparison piece despite the "best" framing — it's Num Num's own offering, same intent as the near-me survivor.
- `cake-shop-western-sydney` → **MERGE into `eggless-cake-bakery-harris-park-riverstone-sydney`**. Both are "here's our two shops" pages with near-identical H1 framing.
- **Keep:** `eggless-cakes-near-me-sydney` (survivor), `best-eggless-cake-shops-sydney-2026` (genuine competitor-comparison content type — distinct), `best-cake-sydney` (broader "best cake" framing, not eggless-specific comparison — interlink with the 2026 shops-comparison page), `best-dessert-shop-sydney` (dessert vs. cake framing, distinct), `eggless-cake-bakery-harris-park-riverstone-sydney` (survivor), `cake-shop-near-me-marsden-park-talawong` (cross-listed with Cluster 1), `birthday-cake-near-me-sydney-suburbs` (cross-listed with Cluster 1).

---

## Cluster 13: Gifting / Corporate (2 files → 1 survivor, folded into Cluster 3's corporate note)

- `cake-gifting-sydney` → **MERGE into `eggless-cake-gifting-guide-sydney`**. Literal duplicate intent ("gift a cake in Sydney"), same "inclusive gift everyone can enjoy" framing; the "guide" version is more complete.

---

## Cluster 14: Seasonal (4 files) — no changes

`spring-cake-sydney`, `summer-cake-sydney`, `autumn-cake-sydney`, `winter-cake-sydney` — four genuinely discrete seasons, zero overlap. **All 4 KEEP.** Interlink with `eggless-cake-seasonal-flavours.html` (Cluster 7), which is the natural cross-cluster hub tying all four together.

---

## Cluster 15: Product/Flavour-Specific (4 files) — no changes

`eggless-chocolate-cake-sydney`, `eggless-red-velvet-cake-sydney`, `eggless-fruit-cake-sydney`, `eggless-cupcakes-sydney` — distinct product/flavour queries. **All 4 KEEP**, link up to `cake-flavour-guide-sydney` (Cluster 7 survivor).

---

## Cluster 16: Site-wide Pillars (not really a cluster — the top of the hierarchy)

`eggless-cake-sydney.html` is the broadest, highest-commercial-intent page on the site ("eggless cake Sydney") and should function as the **top-level pillar above every other cluster**, not just its own cluster. `celebration-cake-sydney.html` is the second-broadest ("cake for any celebration") and sits directly beneath it. Neither needs content changes — this is a link-architecture role, not a merge/prune verdict.

Also standalone, no overlap found anywhere in the corpus: `afternoon-tea-cakes-sydney`, `eggless-wedding-cakes-sydney` (interlink tightly with `wedding-cake-sydney-north-west`, the geo-variant — keep both, high-value category justifies the split), `eggless-mini-cakes-cupcake-towers-sydney` (interlink, don't merge, with `eggless-cake-small-gatherings-sydney` — format vs. event-size framing are genuinely different angles), `eggless-cake-school-celebration-sydney` and `cake-school-fete-fundraiser-sydney` (interlink — in-class party vs. fundraiser/fete are different intents), `multicultural-celebration-cake-sydney` (Cluster 2 hub), `eggless-cake-reviews-sydney`, `eggless-cake-flavour-pairing-guide` (Cluster 7), `indian-sweets-harris-park-riverstone-sydney` (only Indian-sweets page on the site — no competing content, but flagged in Content Gaps below since it's currently a single page carrying an entire product line).

---

## Internal Link Matrix (surviving corpus)

Structure: **mandatory** = spoke↔pillar bidirectional; **recommended** = spoke↔spoke within the same cluster; **optional** = cross-cluster.

### Tier 0 — site pillar
`eggless-cake-sydney.html` ← mandatory inbound link from every surviving post in the corpus (currently likely inconsistent; verify). Mandatory outbound link to `celebration-cake-sydney.html` and to each cluster-level pillar below.

### Tier 1 — cluster pillars (mandatory bidirectional link to every surviving spoke in their cluster)
| Cluster | Pillar |
|---|---|
| 1. Suburb/near-me | `eggless-cakes-near-me-sydney.html` (query hub) + `cake-delivery-areas-sydney.html` (directory hub) + `eggless-cakes-northwest-sydney.html` (Riverstone-corridor sub-hub) |
| 2. Festival | `eggless-cakes-diwali-indian-festivals-sydney.html` (South Asian) + `multicultural-celebration-cake-sydney.html` (everything else) |
| 3. Life-event | `celebration-cake-sydney.html` |
| 4. Dietary | `eggless-cake-nutrition-sydney.html` (general) + `eggless-cake-for-egg-allergy.html` (core differentiator — treat as a de facto second pillar) |
| 5. Vs-comparisons | `eggless-cake-vs-regular-cake.html` |
| 6. Kids-birthday | `kids-birthday-cake-sydney.html` |
| 7. Design | `custom-cake-sydney.html` |
| 8. Ingredients | `how-eggless-cakes-are-made.html` |
| 9. Price/size | `eggless-cake-price-sydney.html` + `eggless-cake-size-guide-sydney.html` |
| 10. Ordering | `eggless-cake-online-order.html` |
| 11. Delivery | `cake-delivery-sydney.html` |
| 12. Flavour | `cake-flavour-guide-sydney.html` |

### Tier 2 — recommended spoke-spoke links (same cluster, adjacent intent)
- Every merged suburb page's survivor should link to its 1–4 immediate neighbour suburb spokes (e.g. `eggless-cakes-guildford` ↔ `eggless-cakes-fairfield` ↔ `eggless-cakes-merrylands`, since they form a contiguous corridor even after consolidation).
- Dietary cluster: `eggless-cake-for-diabetics-sydney` ↔ `eggless-cake-lower-sugar-options-sydney` ↔ `eggless-cake-keto-low-carb-sydney` (all blood-sugar/weight-conscious audience).
- Design cluster: `eggless-cake-design-ideas-sydney` ↔ `eggless-cake-trends-sydney-2026` (evergreen vs. year-specific — should reference each other, not compete).
- Seasonal cluster: all 4 seasonal pages ↔ `eggless-cake-seasonal-flavours.html`.
- Ordering cluster: `eggless-cake-online-order` ↔ `cake-consultation-sydney` ↔ `eggless-cake-tasting-sydney` (natural funnel sequence: consult → taste → order).
- Life-event cluster: `push-present-cake-sydney` ↔ `eggless-cakes-baby-shower-sydney` (before/after birth sequence).

### Tier 3 — optional cross-cluster links
- Every suburb spoke → the 1–2 most relevant festival spokes for that suburb's dominant community (e.g. suburbs with high South Asian population per their own cited census stats → `eggless-cakes-diwali-indian-festivals-sydney`).
- `eggless-cake-for-egg-allergy` → every dietary-cluster page (cross-sell: "also dealing with X? see our Y guide").
- Wedding pages (`eggless-wedding-cakes-sydney`, `wedding-cake-sydney-north-west`) → `tiered-cakes-sydney`, `naked-cake-sydney` (Cluster 7 design pages commonly used for weddings).

### No-orphan check
Every surviving page above has at least one Tier-1 mandatory link path back to a cluster pillar and onward to the site pillar (`eggless-cake-sydney.html`) — confirm this programmatically once the merges are executed, since the current corpus's actual link density wasn't audited here (out of scope — this report is architecture, not a link-graph crawl).

---

## Content Gaps (unvalidated — flagged for GSC cross-check only, not asserted as confirmed opportunities)

Per the task brief, none of the following are asserted as real demand — they're structural gaps worth checking against actual GSC query data before writing anything:

1. **Indian sweets get one page for the entire product line** (`indian-sweets-harris-park-riverstone-sydney.html`) versus ~150 pages for eggless cakes. If GSC shows real query volume for sweet-specific terms (e.g. "gulab jamun Sydney", "Diwali mithai Harris Park"), this product line may be as under-built as the cake side is over-built — worth checking before assuming cakes are the only content priority.
2. **No suburb pages exist for Sydney's Eastern Suburbs, Inner West, North Shore, or CBD** — the entire suburb cluster is western/north-western Sydney only, consistent with the two physical shop locations. This is presumably intentional (delivery-radius-bound), but worth confirming it isn't leaving plausible outer-radius delivery demand (e.g. a customer willing to pick up from Harris Park while working in Parramatta CBD) unaddressed by a single "how far will you deliver / can I pick up if I don't live nearby" page — `cake-delivery-areas-sydney.html` may already cover this; verify.
3. **No page targets "eggless cake" + specific non-Sydney-qualified generic terms** that a voice/AI-search query might use, e.g. "cake shop that doesn't use eggs" phrased conversationally — worth checking GEO/AI-search query patterns (separate from this cluster analysis) rather than adding more pages speculatively.
4. **Price/size cluster is thin relative to its search-funnel importance** — after the two merges in Cluster 9, only 3 pages remain for what's typically one of the highest-intent, highest-conversion query types for a local bakery ("how much does a cake cost"). This is not a "write more" recommendation — the existing 3 may already be sufficient — but worth checking whether GSC shows price-related queries landing on suburb pages instead (a sign the price answer isn't ranking where it should).

None of the above should be built into new posts without GSC query-level validation, per the task brief's explicit instruction not to invent demand.
