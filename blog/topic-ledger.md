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

Validated-but-unwritten topics go here — a slug + the cluster it belongs to +
the GSC evidence that justifies it. **Nothing goes in this section without a
real GSC query/impressions number attached.** The blog-writer routine's
TOPIC SELECTION gate checks here first; if this section is empty, it falls
back to a live GSC check for that run.

*(none logged yet — `blog-cluster-report.md`'s Content Gaps section lists
candidates that need GSC validation before landing here; do not promote them
to this list without actually checking query data first)*

---

## Published history

Append one line per post, newest at the bottom. Never rewrite existing lines.

| Date | Slug | Cluster | Demand evidence | Gap claimed (if any) |
|---|---|---|---|---|

