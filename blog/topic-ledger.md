# Blog Topic Ledger

State file for blog topic selection, mirroring the GBP anti-repetition pattern
(`GBP/posts-queue.md` + `GBP/used-images.txt`). Read before picking any topic,
per `skills/blog-write/SKILL.md`'s TOPIC SELECTION gate and the
`NumNums-Blog-Writer-5am` routine prompt.

**Why this exists:** the prior process relied on `git log -10 -- blog/` plus a
fixed occasion calendar, which produced 359 posts with no demand validation and
real cannibalization (e.g. four separate "how do I order a cake online" pages
written on four different days). See `blog-cluster-report.md`,
`blog-gsc-per-page.md`, and `blog-consolidation-worklist.md` in the repo root
for the audit that found this. This ledger replaces the calendar as the topic
source going forward.

---

## Cluster registry

Reference only — which cluster pillar a new post's topic belongs under, and
who to interlink with. Derived from `blog-cluster-report.md`'s Tier 1 table
(2026-09-01), then corrected 2026-09-01 after Phase 4 execution — several
originally-named pillars did not survive the GSC-corrected consolidation
(`blog-consolidation-worklist.md`) and were themselves merged into a
higher-traffic page in their own cluster. Update this table if a future
cluster-analysis run changes the architecture.

| Cluster | Pillar page(s) |
|---|---|
| Site-wide | `eggless-cake-sydney.html` → `celebration-cake-sydney.html` |
| Suburb / near-me | `eggless-cakes-near-me-sydney.html`, `cake-delivery-areas-sydney.html`, `eggless-cakes-northwest-sydney.html` |
| Festival | `eggless-cakes-diwali-indian-festivals-sydney.html` (South Asian), `eggless-cakes-eid-milad-un-nabi-sydney.html` (other — was `multicultural-celebration-cake-sydney.html`, retired, 262 vs 173 impr/90d) |
| Life-event | `celebration-cake-sydney.html` |
| Dietary | `eggless-cake-calories-guide-sydney.html` (was `eggless-cake-nutrition-sydney.html`, retired, 589 vs 128 impr/90d), `eggless-cake-for-egg-allergy.html` |
| Vs-comparisons | `eggless-cake-vs-regular-cake.html` |
| Kids-birthday | `kids-birthday-cake-sydney.html` |
| Design | `custom-cake-sydney.html` |
| Ingredients | `eggless-cake-egg-substitutes.html` (was `how-eggless-cakes-are-made.html`, retired, 1197 vs 123 impr/90d) |
| Price/size | `cake-price-guide-sydney.html` (was `eggless-cake-price-sydney.html`, retired, 689 vs 23 impr/90d), `cake-serving-size-guide-sydney.html` (was `eggless-cake-size-guide-sydney.html`, retired, 1306 vs 28 impr/90d) |
| Ordering | `how-to-order-cake-sydney.html` (was `eggless-cake-online-order.html`, retired — literal quadruplicate, see cluster report) |
| Delivery | `eggless-cake-delivery-sydney.html` (was `cake-delivery-sydney.html`, retired, 148 vs 58 impr/90d) |
| Flavour | `eggless-cake-flavours.html` (was `cake-flavour-guide-sydney.html`, retired, 80 vs 58 impr/90d) |
| Seasonal | interlink only, no single pillar (4 posts, all keep) |
| Indian sweets | `indian-sweets-harris-park-riverstone-sydney.html` — currently the ONLY page for this product line; see open gap below |

---

## Open topic gaps

Validated-but-unwritten work goes here — a target URL + the cluster it belongs
to + the GSC evidence that justifies it. **Nothing goes in this section without
a real GSC query/impressions number attached.** The blog-writer routine's
TOPIC SELECTION gate checks here first; if this section is empty, it falls
back to a live GSC check for that run.

**Populated 2026-09-02** from a 90-day GSC pull (2026-06-04 → 2026-09-01,
`seo-baseline/2026-09-02/`). Evidence source is GSC query data for every row —
Google Ads Keyword Planner was not used (no API credentials configured); seeds
for an optional later cross-check are in
`seo-baseline/2026-09-02/keyword-planner-seeds.csv`.

**Read this before picking anything below.** Almost every validated gap here is
an *improve an existing page* job, not a new post. The research report
(`SEO and Content Strategy Frameworks for Num Num's Bakery.md`, §1 and §6) is
explicit that neglecting existing pages in favour of constant new content is a
documented pitfall, and that iterative improvement of existing pages beats
adding URLs. Only ONE row below justifies a new URL.

### Tier 1 — owner page exists but earns none of its own demand (IMPROVE, do not write new)

Each row: the site already has a dedicated page, but Google ranks a *different*
page for the theme. Fix = strengthen the owner page and point internal links at
it, per the report's cluster-owner rule. No new URL.

| Theme | Owner page | 90d impr | Clicks | % impr on owner | Action |
|---|---|---:|---:|---:|---|
| Dairy-free cakes | `dairy-free-vs-eggless-cakes` | 517 | 0 | **0%** | Owner earns nothing; `best-eggless-cake-shops-sydney-2026` absorbs 351. Retitle owner to target "dairy free cakes sydney", add FAQ, link from the pillar with exact anchor. |
| Halal cakes | `halal-friendly-cakes-eggless-sydney` | 481 | 2 | 25% | Homepage outranks the owner (352 impr). Strengthen owner, add FAQ + internal links. |
| Number cakes | `number-cakes-sydney` | 281 | 1 | **2%** | Homepage/`/cakes` absorb it at pos 64–66. Owner is effectively invisible — check indexation first, then strengthen. |
| Nut-free cakes | `eggless-cake-nut-free-sydney` | 260 | 1 | 30% | Pillar outranks owner. Link pillar → owner on the exact phrase. |
| Gluten-free cakes | `eggless-cake-gluten-free-sydney` | 38 | 2 | **0%** | Low volume; bundle into the same dietary-cluster pass rather than a standalone job. |

### Tier 2 — commercial page with a CTR problem, not a ranking problem

| Theme | Page | 90d impr | Clicks | Position | Action |
|---|---|---:|---:|---:|---|
| Indian sweets / barfi | `/indian-sweet` | 1,106 | **3** | 7.9 on "barfi near me" (677 impr, **0 clicks**) | Ranks well, converts nothing. Page is only **528 words**, has **no FAQ section and no FAQPage schema**. Rewrite title/meta for the click, expand to answer real questions, add FAQ + schema. This is the largest single untapped query on the site. |

The report flags this product line directly: one page carries the entire Indian
sweets range against ~150 cake pages. The GSC data confirms real demand
(1,106 impressions) and near-zero capture (3 clicks).

### Tier 3 — the one justified NEW URL

| Proposed slug | Cluster | 90d impr | Clicks | Evidence |
|---|---|---:|---:|---|
| `rasmalai-cake-sydney` | Flavour | 291 | **14** | No owner page exists. "rasmalai cake near me" 123 impr/6 clicks pos 7.8; "rasmalai cake" 92 impr/5 clicks pos 4.1; "rasmalai cake sydney" 24 impr/1 click. Best click-through of any unowned theme, and Rasmalai is a real premium flavour the business sells. Currently scattered across `/`, `/cakes`, and a suburb page. |

Before writing it: confirm against the doorway/cannibalisation rules in
`SEO-ACTION-PLAN-2026-09-02.md` §5, and name `eggless-cake-flavours` as its
cluster owner so it interlinks rather than competes.

### Explicitly REJECTED candidates (do not write these)

Logged so the same false leads are not re-validated later:

| Query | 90d impr | Why rejected |
|---|---:|---|
| `organic neem cake in sydney` | 189 | Agricultural fertiliser, not food. Irrelevant intent. |
| `15 cullum street bossley park nsw 2176` | 90 | A street address; navigational noise. |
| `num noms cake` | 68 | Toy-brand confusion, not the business. |
| `cakes mosman` | 64 | Outside both shop catchments; the report warns against suburb pages for areas the business does not genuinely serve. |
| Per-suburb "eggless cakes <suburb>" expansion | — | **Permanently rejected.** 59 URLs already compete for "eggless cake near me". Adding more is the exact doorway-page pattern the report and Google's spam policy describe. |

---


## Published history

Append one line per post, newest at the bottom. Never rewrite existing lines.

| Date | Slug | Cluster | Demand evidence | Gap claimed (if any) |
|---|---|---|---|---|

