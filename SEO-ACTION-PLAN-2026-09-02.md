# SEO Action Plan — Num Num's Bakery
### Execution date 2026-09-02 · derived from `SEO and Content Strategy Frameworks for Num Num's Bakery.md`

**Status: executed, not proposed.** Everything marked ✅ below was completed on 2026-09-02.
Baseline data, audits and QA logs are in `seo-baseline/2026-09-02/`.

**Provenance rule.** Every recommendation here traces to the research report. Anything naming a
specific file, slug, threshold or command that the report does not state is tagged
**[Implementation inference]**. Supersedes nothing — `ACTION-PLAN.md` (2026-06-05) remains as
history; its still-open items are carried into §2.

**The one-line finding of the day:** the 2026-09-01 consolidation was sound and is holding
(156/160 redirects clean, 0 chains), but it left three things undone that were costing more than
the merges gained — 29 festival pages redirecting into an unrelated Eid page, 680 internal links
still pointing at retired or `.html` URLs, and five dietary pages that earn none of their own
search demand because nothing links to them.

---

## Baseline at a glance (90 days, 2026-06-04 → 2026-09-01)

| Metric | Value | Note |
|---|---:|---|
| Clicks | 2,010 | |
| Impressions | 89,578 | **Expected to fall** as 126 retired URLs leave the index — not a regression |
| CTR | 2.24% | Report's diagnosis was 2.8% → 2.6% compressing; now lower still |
| Average position (impression-weighted) | 10.7 | The "~11 plateau" the report identifies |
| Indexed URLs earning impressions | 381 | vs 241 files on disk — 126 are retired-but-still-indexed |
| Distinct queries | 3,413 | |
| GA4 organic sessions / users | 2,410 / 2,092 | |
| Non-brand queries with 2+ URLs competing | 104 | 8,442 impressions on non-owner URLs |
| Non-brand queries where a **weaker** page outranks the owner | 62 | |

Blog earns 55,029 impressions at 1.41% CTR; commercial pages earn 34,549 at 3.57%. The blog
generates reach, the commercial pages generate clicks — which is why §5 pushes internal links
toward commercial owners.

---

# 1. Complete Extraction of Findings

Every actionable item in the report, bucketed. `Complete today?` reflects what actually happened.

## 1.1 Technical SEO and site health

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 | Maintain a fast, mobile-friendly, technically sound site | §6: foundational steps include maintaining a fast, mobile-friendly site and regularly auditing indexation, Core Web Vitals and structured-data errors | Technical soundness is the precondition for both organic and AI visibility (§5) | Monthly `seo-audit` routine already does this; keep cadence | Ongoing system | Medium | Low | Monthly routine | Yes (already running) | Report |
| T2 | Preserve link equity through single-hop redirects | §2: consolidation should preserve accumulated link equity and impressions through proper redirects | Multi-hop chains dilute the equity the merges were meant to concentrate | Fixed 4 legacy WordPress rules that chained `/blog` → `/blog/`; now single-hop | One-off | Low | Low | `netlify.toml` | ✅ Yes | Report + **[Implementation inference]** on the specific rules |
| T3 | Eliminate duplicate URL forms | §2: cannibalisation is multiple pages on the same coordinates | `.html` and clean URLs were splitting authority for 12 posts | Verified `.html` → clean 301 is **already live** (`ACTION-PLAN.md` item 4 is done). 16 `.html` URLs still in GSC = index lag, will decay. No action needed, monitor only | Monitoring | Medium | None | GSC | ✅ Verified | **[Implementation inference]** |
| T4 | No broken internal links | §2/§6: technical soundness; §3: avoid orphaned pages | Three internal links pointed at hard 404s | Fixed `/privacy` → `/privacy-policy`, removed dead `/terms` link, `/blog/lunar-new-year-sydney` → real slug | One-off | Medium | Low | — | ✅ Yes | **[Implementation inference]** |
| T5 | Canonical host consistency | §2/§6 technical foundations | An `http://www` variant appears in historical GSC data | Verified all four host variants resolve to `https://numnumsbakery.com.au`; canonicals correct. `http://www` takes 2 hops — cosmetic | Monitoring | Low | None | — | ✅ Verified | **[Implementation inference]** |
| T6 | Structured data correctness | §6: implement LocalBusiness and product schema; audit for structured-data errors | Invalid or false markup risks manual action | `aggregateRating` of **4.6 / 50 is published identically for BOTH locations** in `index.html` and `locations.html`. Third-party sources suggest ~4.1 with a far higher count for Harris Park, and Riverstone has no third-party rating at all | One-off | **High (risk)** | Low | **Owner must supply real per-location numbers from GBP** | ⚠️ Flagged, not changed | **[Implementation inference]** — report requires accurate schema, does not name this defect |
| T7 | Schema on every commercial page | §6: LocalBusiness and product schema | `indian-sweet.html` had 1 JSON-LD block and no FAQPage | FAQPage schema added as part of the sweets rebuild (§1.6) | One-off | Medium | Medium | — | ✅ Yes | Report |

## 1.2 Google Search Console and analytics

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| G1 | GSC as the primary demand source | §4: GSC remains the primary source of demand data for existing pages and queries | Free, first-party, and reflects this site's actual coverage | 90-day pulls on `page`, `query`, `query,page`, `date` → `seo-baseline/2026-09-02/` | One-off (repeat at checkpoints) | High | Low | Service account at `~/.config/claude-seo/` | ✅ Yes | Report |
| G2 | Audit GSC for queries where multiple URLs appear | §2: remediation involves auditing Search Console to identify queries where multiple URLs appear | The only way to detect cannibalisation with evidence rather than by title similarity | `query,page` pull grouped by query → `cannibalisation-audit.csv` | One-off (repeat) | High | Medium | G1 | ✅ Yes | Report |
| G3 | Separate brand from non-brand | — | Brand queries legitimately surface many URLs; counting them as cannibalisation produces false positives | Split the audit: 22 brand vs **104 non-brand** cannibalised queries | One-off | Medium | Low | G2 | ✅ Yes | **[Implementation inference]** |
| G4 | Track business outcomes, not just rankings | §1: topic choices reviewed against GSC **and business metrics (leads, bookings, calls)** before committing | Impressions are the wrong success metric post-consolidation | GA4 organic baseline captured; GBP call/direction metrics require dashboard | Recurring | High | Low | GA4 + GBP | Partially — GA4 ✅, GBP metrics need owner | Report |
| G5 | Establish a comparison baseline | §2: outcomes measured over 4–8 weeks and 1–3 months | The 2026-09-01 consolidation had no baseline; checkpoints had nothing to compare to | `BASELINE-SNAPSHOT.md` + `analyze.py` so checkpoints recompute identically | One-off | High | Low | G1 | ✅ Yes | **[Implementation inference]** |

## 1.3 Content consolidation and keyword cannibalisation

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| C1 | Consolidate overlapping content into stronger pages via 301 | §2: fold unique content from weaker pages into the strongest URL and redirect the old URLs | Resolves cannibalisation, concentrates ranking signal | Already executed 2026-09-01 (125 merges + 1 prune). **Verified today:** 156/160 redirects pass, 0 chains, 0 broken targets | One-off | High | High | — | ✅ Verified | Report |
| C2 | Pick the survivor on impressions/clicks/backlinks/conversions | §2: pick the strongest URL based on impressions, clicks, backlinks and conversions | A topically-chosen survivor can be the weaker page | Already done via `blog-consolidation-worklist.md` (49 of 125 pairs swapped on GSC data) | One-off | High | Medium | — | ✅ Verified | Report |
| C3 | **Fold unique facts into the survivor before redirecting** | §2: "ensure that unique factual content from merged pages is woven into the survivor where commercially relevant"; Implications: "revisiting high-value topics and weaving the most relevant details into pillar pages" | Without folding, the redirect sends users to a page that does not answer their query — Google treats this as a soft 404 | **29 festival pages** (Onam, Vesak, Durga Puja, Pongal, Passover, Chuseok, Nowruz…) were redirected into `eggless-cakes-eid-milad-un-nabi-sydney`, a page that mentioned **none of them**. Rebuilt as a genuine multicultural cultural-calendar pillar | One-off | **High** | High | — | ✅ Yes | Report (the defect is a direct instance of the gap the report names) |
| C4 | Detect residual cannibalisation after consolidation | §2: rankings fluctuate and traffic splits while multiple pages share coordinates | Consolidation halved the suburb cluster but did not solve the head query | **59 URLs** still compete for "eggless cake near me" (3,585 impr, 76 clicks). 104 non-brand queries affected overall | Monitoring → action | High | Medium | G2 | ✅ Measured; remediation is P1/P2 | Report |
| C5 | Do not extend consolidation before measuring | §2: outcomes take 4–8 weeks to stabilise | Merging again now would confound the measurement of what already shipped | **No new merges or redirects performed today**, by design | Decision | — | — | — | ✅ Held | Report |

## 1.4 Local SEO and multi-location architecture

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| L1 | One dedicated page per physical location | §3: one dedicated page per physical location, plus selected service-area pages | Matches the two real shops to two real pages | `locations.html` covers both; keep | Ongoing | High | — | — | ✅ In place | Report |
| L2 | Location pages need map, local testimonials, LocalBusiness schema with precise NAP + coordinates, internal links to service pages | §3, explicit list | These are the ranking inputs for the local pack | Verified present: distinct GBP entities with distinct Google CIDs, map embeds, NAP, schema | Ongoing | High | Low | — | ✅ Verified | Report |
| L3 | **Do not proliferate thin suburb pages** | §3: Google's spam policy defines doorway pages as substantially similar city/state pages existing to capture keyword+location combinations; large-scale city landing page schemes cited as doorway abuse | This is the site's historical failure mode (150 suburb pages, 42% of corpus) | Codified as a permanent rejection in `blog/topic-ledger.md` and §5 below | Ongoing system | High | Low | — | ✅ Yes | Report |
| L4 | Service-area pages only with real demand + substantial unique content | §3: advised only where the business regularly serves the area and can provide 800–1,200 words of unique local content, not boilerplate with the suburb name swapped | The threshold that prevents recurrence | Written into §5's approval gate | Ongoing system | High | Low | — | ✅ Yes | Report |
| L5 | Hub-and-spoke internal linking for locations | §3: a main Locations hub linking down to suburb pages and each linking back, avoiding orphans | Prevents orphaned, doorway-like pages | Locations hub exists; suburb survivors link back. No orphans found in link QA | Ongoing | Medium | Low | — | ✅ Verified | Report |
| L6 | NAP consistency across site and citations | §6: ensuring NAP consistency across the site and citations is foundational | Inconsistent NAP weakens local prominence and AI-citation confidence | **Found:** atParramatta.com publishes a different suite, phone and domain for Harris Park plus a savoury menu contradicting the eggless cake/sweets scope; DoorDash carries a third address form | One-off | High | Medium | **Owner must request corrections** | ⚠️ Documented, needs owner | Report |
| L7 | Internal NAP sources must agree | §6 NAP consistency | The site contradicts itself | **Found:** factory address is `10-12A Wingate Road, Mulgrave 2756` in `locations.html` but `2/4 Nelson Road, Yennora 2161` in `llms.txt`. Still unresolved — the 2026-09-02 owner correction covered the two shop addresses, not the factory | One-off | Medium | Low | **Owner must say which is correct** | ⚠️ Flagged | **[Implementation inference]** |
| L8 | Venue name accuracy | §6 NAP consistency | 218 files say "Riverstone Shopping Centre"; the Uber Eats listing says "Riverstone Village Shopping Centre" | **Resolved 2026-09-02** — owner confirmed both names refer to the same centre: `Shop 8, Riverstone Shopping Centre (Riverstone Village)`. Applied to `locations.html`, `index.html`, `llms.txt`, GBP rule files | One-off | Medium | Low | Owner | ✅ Yes | **[Implementation inference]** |

## 1.5 Google Business Profile optimisation

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| B1 | A separate, fully optimised GBP per location | §3: each physical location page should have its own Google Business Profile; §6: claiming and fully optimising GBP for each location is foundational | Local pack eligibility per location | Verified two distinct GBP entities exist (distinct Google CIDs, extracted from the map embeds) | Ongoing | High | — | — | ✅ Verified | Report |
| B2 | GBP completeness as a shared organic + AI lever | §5: AI summaries favour strong local authority signals — GBP completeness, reviews, citations; §6: fully optimising GBP | The report names GBP as more likely to move AI citation than AI-specific files | Full external audit written per location; dashboard-only items reduced to a ~10-minute tick-list | One-off | High | Medium | Owner's GBP login for the interior items | Partially — external ✅, dashboard pending | Report |
| B3 | Routine GBP posts and review responses | §6: "one substantial new or updated page per month, plus routine GBP posts and review responses, is widely regarded as good performance" | The report names GBP posting as part of baseline "good" performance | **GBP posting has been dead for 80 days** — last published post is dated 2026-06-14, and its CTA points at `/blog/eggless-cake-texture-moist`, a URL retired in the consolidation | One-off + recurring | High | Low | `GBP/posts-queue.md`; the stored Make webhook | ⚠️ Diagnosed, restart needs owner | Report |
| B4 | Record GBP baseline metrics today | §2/§6: measure outcomes; conversions, calls and direction requests are the meaningful metrics | Without today's numbers the 4–6 week review has no comparison | Baseline fields defined in both audit files; values require the dashboard | One-off | High | Low | Owner | ⚠️ Template ready, values pending | Report |

## 1.6 Content strategy, publishing cadence, and topic selection

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | One substantial post every 4–6 weeks | Implications: "approximately one substantial post every four to six weeks"; §1: one to two substantial posts per month | The 5/day calendar process is what caused the dilution | Blog routine already reduced to 1/week and **disabled**. Recommend it stays disabled and returns at 1 post per 4–6 weeks | Decision | High | — | Owner | ✅ Recommended; routine still off | Report |
| S2 | Topics from validated demand, never a fixed calendar | §1: topic choices reviewed against GSC and business metrics before committing; §6: over-producing thin automated posts without demand validation is a documented pitfall | The root cause of 359 posts | `blog/topic-ledger.md` gate already enforces this | Ongoing system | High | — | — | ✅ In place | Report |
| S3 | **Populate the topic ledger with real demand data** | Implications: the ledger "should be actively populated with demand data and customer FAQs, becoming the central planning tool rather than remaining empty" | The single named refinement in the report; the blog routine is blocked on it | Ledger populated from the 90-day GSC pull: 5 Tier-1 improve targets, 1 Tier-2 CTR target, 1 justified new URL, 5 explicit rejections | One-off | **High** | Medium | G1 | ✅ Yes | Report |
| S4 | Focus on high-intent topics: ordering, pricing, serving sizes, dietary, local case studies | Implications: "focused on high-intent topics like ordering, pricing, serving sizes, dietary constraints, and local case studies"; §6: cost guides, ordering FAQs, serving-size explanations, dietary/ingredient guides | These are the commercial-intent question types | All four exist. Audited for correctness — and serving sizes were found to be self-contradictory (§1.11 M3) | Ongoing | High | Medium | — | ✅ Audited + fixed | Report |
| S5 | Prefer updating existing pages over adding URLs | §1: "iterative improvement — reviewing performance monthly or quarterly and updating existing pages with better answers, structure and internal links — rather than constantly adding new URLs"; §6: neglecting existing pages in favour of constant new content is a pitfall | Prevents the corpus regrowing | Ledger is deliberately weighted to *improve* rows; only ONE new URL (`rasmalai-cake-sydney`) is approved | Ongoing system | High | Low | S3 | ✅ Yes | Report |
| S6 | Each ledger entry maps to a cluster owner page | Implications: "each ledger entry should map to a specific cluster owner page to prevent future cannibalisation" | Stops a new post competing with an existing one | Cluster registry already in the ledger; every new row names its owner | Ongoing system | High | Low | — | ✅ Yes | Report |
| S7 | Document customer FAQs in conversational language | §5: "documenting customer FAQs in conversational language" | The GEO lever the report rates above AI-specific files | 9 conversational FAQs added to `/indian-sweet`; 4 dietary FAQs added to the eggless-shops pillar; 5 added to the festival pillar | One-off | High | Medium | — | ✅ Yes | Report |

## 1.7 Keyword research and demand validation

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| K1 | Validate demand before committing to a page | §4: practitioners recommend validating search demand before committing to new pages, especially on limited budgets | Prevents writing for queries nobody searches | Enforced by the ledger gate; applied to every row added today | Ongoing system | High | Low | — | ✅ Yes | Report |
| K2 | GSC + one free tool as the demand stack | §4: Keyword Planner and Search Console together form a robust free stack | Free and sufficient at this scale | GSC used as primary. **Keyword Planner not usable** — `~/.config/claude-seo/google-api.json` has no `ads_developer_token`/`ads_customer_id` and there is no `oauth-token.json`, so `keyword_planner.py` cannot authenticate | One-off | Medium | Low | Google Ads account + dev token | Partially — GSC ✅, Planner ❌ | Report |
| K3 | Leave a seed list for later cross-check | §4: free tools supplement GSC for topics the site has no data on | Makes the Planner step a 10-minute job later | `seo-baseline/2026-09-02/keyword-planner-seeds.csv` — 14 seeds with their GSC numbers | One-off | Low | Low | — | ✅ Yes | **[Implementation inference]** |
| K4 | Require non-zero volume or clear customer demand | §4: require at least minimal volume or clear customer demand (repeated questions, frequent calls) before adding a page | The threshold that keeps the ledger honest | Every ledger row carries a real impressions number; 5 candidates explicitly rejected | Ongoing system | High | Low | — | ✅ Yes | Report |
| K5 | Reject irrelevant-intent queries even when volume looks real | §4/§6: content should target real problems, not artificial keyword combinations | "organic neem cake in sydney" has 189 impressions and is agricultural fertiliser | Logged as permanent rejections so they are not re-validated | Ongoing system | Medium | Low | — | ✅ Yes | Report + **[Implementation inference]** on the specific queries |

## 1.8 Topical authority and internal linking

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| A1 | Topical authority = share of indexed pages coherently supporting one topic | §2: diluting that share with semi-duplicate pages weakens authority | The formula behind the whole consolidation | Corpus held at 233; no new URLs created today | Ongoing | High | — | — | ✅ Held | Report |
| A2 | Hub-and-spoke and parent-child internal linking | §3: hub-and-spoke (a hub linking down to pages and each linking back) and parent-child patterns avoid orphaned or thin doorway-like pages | Distributes authority to the right owner | Verified: no orphans; hub links intact | Ongoing | High | Low | — | ✅ Verified | Report |
| A3 | Internal links should point at the cluster owner | Implications: each ledger entry maps to a cluster owner to prevent cannibalisation; §2: pick the strongest URL and fold others into it | **Root cause found:** the pillar absorbing all dietary demand linked to **none** of the five dietary owner pages, and neither did `/` or `/cakes`. Google had no signal which page owns "dairy free cakes sydney" | Added 4 FAQ items on the pillar linking to all 5 owners with exact-match anchors, plus matching schema | One-off | **High** | Medium | G2 | ✅ Yes | Report |
| A4 | Repoint internal links directly at survivors | §2: preserve link equity through proper redirects | The 2026-09-01 pass repointed ~314 **absolute** links but missed relative ones | Found and fixed **680** internal links: 81 absolute `.html` hops, 411 relative links in `blog/` (64 of them pointing at retired pages), 188 relative links in the 7 top-level pages | One-off | High | Medium | — | ✅ Yes | Report + **[Implementation inference]** on the specific counts |
| A5 | No orphaned or broken internal links | §3: avoid orphaned pages | 3 internal links pointed at hard 404s | Fixed; final site-wide QA returns **0 issues** | One-off | Medium | Low | — | ✅ Yes | **[Implementation inference]** |

## 1.9 Reviews, citations, and local authority

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| R1 | Grow authority through consistent reviews and citations | §6: third step of the framework is growing authority through consistent reviews, citations and occasional content updates | Reviews are named as a lever for both local pack and AI citation | Review app already exists (`reviews-app/` → `/review`); baseline review counts must come from GBP | Ongoing | High | Low | Owner | ⚠️ Baseline pending | Report |
| R2 | Strengthen presence on third-party sources AI systems cite | §5: check which sources AI Mode cites for your questions, then improve presence via updated listings, reviews and content | Off-site entity presence is the weakest signal for this business | Third-party sources observed for core queries recorded in `geo-ai-baseline.md` | One-off → ongoing | High | Medium | — | ✅ Baseline captured | Report |
| R3 | NAP consistency across citations | §6: NAP consistency across the site and citations | Inconsistent NAP suppresses prominence | **atParramatta.com** publishes a different suite (`Shop 2 96-98 Wigram St`), a different phone (`02 9891 4957`), a different domain (`numnums.com.au`) and a **savoury Indian menu** that contradicts the eggless cake/sweets scope. DoorDash carries a third address form | One-off | High | Medium | Owner must request the correction | ⚠️ Documented | Report |
| R4 | Riverstone citation footprint | §6: citations are foundational | Riverstone has only 2 aggregator listings vs 5 for Harris Park, and no third-party rating anywhere, ~9 months after opening | Build out core citations for Riverstone | One-off | High | Medium | Owner | ⚠️ Documented | Report |
| R5 | Do not publish unverifiable review markup | §6: audit for structured-data errors | `aggregateRating` 4.6 / 50 is identical on both locations; third-party sources suggest ~4.1 with a much larger count for Harris Park and nothing for Riverstone | Replace with real per-location figures from GBP, or remove | One-off | High (risk) | Low | Owner's GBP numbers | ⚠️ Flagged, deliberately not guessed | **[Implementation inference]** |

## 1.10 GEO / AI-search visibility

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| E1 | There is no separate AI index or magic markup | §5: Google states the same foundational SEO best practices determine visibility in AI features; generative features draw from the same core systems | Prevents spending on AI-specific gimmicks | Treated GEO as an extension of SEO throughout this plan | Decision | High | — | — | ✅ Held | Report |
| E2 | **`llms.txt` is not a ranking signal and is not a core lever** | §5: "files such as `llms.txt` are currently not recognized by Google as ranking signals… Google explicitly notes that such AI-specific files are unnecessary"; Implications: "optional discovery aids rather than core levers" | Directly reverses `ACTION-PLAN.md` item 8, which said to expand `llms.txt` | **Close `ACTION-PLAN.md` item 8.** Do not prioritise expanding it | Decision | Medium | — | — | ✅ Closed | Report |
| E3 | But what it does contain must be true | §5: technically sound sites with unique, valuable content | `llms.txt` is read by AI engines — errors in it are fed straight into AI answers | **`llms.txt` advertised 223 `/shop/` URLs that all return 404**, plus a pricing model ("design tier Classic/Themed/Premium") that was reversed on 2026-08-26. Replaced with the live size/serving/price table and the canonical 15-flavour list | One-off | **High** | Low | — | ✅ Yes | **[Implementation inference]** — the report requires accuracy, does not name this defect |
| E4 | Clear, direct answers to user questions | §5: AI summaries select sources that give clear, direct answers, with clear headings and FAQ-style subsections | The primary GEO selection criterion | FAQ + FAQPage schema added to `/indian-sweet` (had none), the eggless-shops pillar, and the festival pillar | One-off | High | Medium | — | ✅ Yes | Report |
| E5 | Answer the "why" and non-location questions | §5: build pages that directly answer non-location and "why" questions; informational content around services with a research phase | Cake buying has a real research phase | Existing coverage audited in `geo-ai-baseline.md`; gaps recorded | Monitoring | Medium | Medium | — | ✅ Audited | Report |
| E6 | Technically accessible to AI crawlers | §5: technically accessible sites | Non-JS crawlers must see the content | Verified: all 7 AI crawlers allowed in `robots.txt`; **`text/babel` count is 0 on all live URLs tested** and every H1 plus the price table appears in raw HTTP. **This closes `ACTION-PLAN.md` items 2 and 6** | Monitoring | High | — | — | ✅ Verified + 2 items closed | Report |
| E7 | Consistency is a GEO requirement, not just a UX nicety | §5: "clear, direct answers"; a site that answers its own core question six different ways cannot satisfy that | Serving size is one of the four named high-value question types | See M3 below | One-off | High | Medium | — | ✅ Yes | Report |

## 1.11 Measurement, reporting, and maintenance

| # | Strategy/framework | Source finding | Why it matters | Exact action | Work type | Impact | Effort | Dependencies | Complete today? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| M1 | Expect ranking stabilisation in 4–8 weeks, improvement over 1–3 months | §2: reported outcomes frequently include stabilisation within four to eight weeks and gradual improvement in average position and CTR over one to three months | Sets the review calendar and prevents premature panic | Checkpoints scheduled from **2026-09-01** (the consolidation date), not from today | Ongoing system | High | Low | G5 | ✅ Scheduled | Report |
| M2 | Review performance monthly or quarterly and update existing pages | §1: iterative improvement, reviewing monthly or quarterly | Keeps the corpus improving without growing | Monthly `seo-audit` routine already at the right cadence | Ongoing system | Medium | Low | — | ✅ In place | Report |
| M3 | Factual self-consistency across the corpus | §5 "clear, direct answers"; §6 content should solve real problems | The site gave **six different answers** for how many a 10″ cake serves | Detector written; **81 contradicting assertions across 32 files corrected** to the canonical chart from `/order` (6″ 6–8, 8″ 12–14, 10″ 20–22, 12″ 25–30, 14″ 40–45, 16″ 50–55). 3 format-qualified cases (square, two-tier) correctly left alone | One-off + detector | **High** | Medium | Canonical chart | ✅ Yes; residual = 0 | Report (defect found by applying §5's criterion) |
| M4 | Products advertised must be products sold | §6: content should reflect real customer needs, not artificial constructions | The blog advertised flavours the business cannot supply | Canonical 15-flavour list recovered from the `/order` dropdown. 39 marketing-name mentions renamed to menu names; **62 genuinely off-menu mentions logged for owner review** rather than guessed at | One-off | High | Medium | Owner decision on the remaining 62 | Partially ✅ | **[Implementation inference]** |
| M5 | Track conversions, calls and direction requests, not just rankings | §1: business metrics (leads, bookings, calls); Implications: conversions, calls, direction requests, orders, GBP visibility and local authority are the meaningful long-term outcomes | Impressions will fall by design | Defined in §6 below; GBP-sourced metrics need the dashboard | Recurring | High | Low | Owner | ⚠️ Framework ✅, GBP values pending | Report |
| M6 | Re-runnable measurement | §2: outcomes compared over defined windows | A checkpoint computed differently from the baseline is not a comparison | `seo-baseline/analyze.py` recomputes every metric identically at each checkpoint | One-off | High | Low | — | ✅ Yes | **[Implementation inference]** |

---

# 2. Prioritised Execution Backlog

**P0 — completed today.** **P1 — started today, needs owner input or a future window.**
**P2 — scheduled, depends on a monitoring window or sustained execution.** **P3 — defer or avoid.**

## P0 — Complete today ✅

| Field | P0.1 Capture the measurement baseline |
|---|---|
| Deliverable | `seo-baseline/2026-09-02/` — 5 raw pulls, 5 derived CSVs, `BASELINE-SNAPSHOT.md`, re-runnable `analyze.py` |
| Exact steps | `gsc_query.py` × 4 dimension sets (90d); `ga4_report.py --days 90`; `python3 seo-baseline/analyze.py seo-baseline/2026-09-02` |
| Duration | 30 min |
| Tools | GSC service account at `~/.config/claude-seo/`, GA4 (`pip install google-analytics-data`) |
| Completion criteria | Snapshot totals reconcile against `gsc-pages-90d.csv`; all files non-empty |
| Dependencies | None |
| Risk if skipped | The 4–6 week checkpoint has nothing to compare to — the consolidation becomes unmeasurable forever |
| Report rationale | §2 measures outcomes over 4–8 weeks and 1–3 months; that requires a baseline captured before the window |

| Field | P0.2 Cannibalisation audit on real query data |
|---|---|
| Deliverable | `cannibalisation-audit.csv` — 126 queries, brand-split |
| Exact steps | Group the `query,page` pull by query; flag ≥2 URLs each ≥5 impressions; separate brand from non-brand; rank by impressions on non-owner URLs |
| Duration | 20 min |
| Tools | GSC export, `analyze.py` |
| Completion criteria | Non-brand list produced and manually sanity-checked against 2 known queries |
| Dependencies | P0.1 |
| Risk if skipped | Remediation targets guessed from title similarity — exactly the error that made 49 of 125 merge pairs backwards |
| Report rationale | §2 prescribes auditing GSC for queries where multiple URLs appear — this is that method, run for the first time |
| **Result** | **104 non-brand queries affected, 8,442 impressions on non-owner URLs, 62 where a weaker page outranks the owner. "eggless cake near me" has 59 competing URLs** |

| Field | P0.3 Redirect QA across the whole consolidation |
|---|---|
| Deliverable | `redirect-qa.csv` (160 live checks), `redirect-pairs.txt` (528 rules) |
| Exact steps | Parse `netlify.toml`; static chain + broken-target analysis; `curl -sI` every retired clean URL against production, 12-way parallel; assert 301 → 200 in exactly 1 hop |
| Duration | 25 min |
| Tools | `netlify.toml`, curl, production site |
| Completion criteria | 0 chains, 0 unintended 404s |
| Dependencies | None |
| Risk if skipped | A broken merge silently 404s and the traffic is gone with no signal |
| Report rationale | §2: consolidation must preserve link equity through proper redirects |
| **Result** | **156/160 pass, 0 chains, 0 broken targets. 4 legacy WordPress rules chained via `/blog` → `/blog/` — fixed** |

| Field | P0.4 Internal-link QA and repoint |
|---|---|
| Deliverable | `internal-link-qa.csv`; 680 links corrected across 65 files |
| Exact steps | Parse every `<a href>` in `blog/*.html` + the 7 top-level pages; classify as retired / `.html` hop / relative / broken; rewrite to the direct absolute survivor URL |
| Duration | 45 min |
| Tools | Repo, `redirect-pairs.txt` |
| Completion criteria | Site-wide re-scan returns 0 issues; `node verify-blog.mjs` passes |
| Dependencies | P0.3 |
| Risk if skipped | Link equity keeps bleeding through 301 hops the consolidation was meant to remove |
| Report rationale | §2 preserve link equity; §3 avoid orphaned pages |
| **Result** | **81 absolute `.html` hops, 411 relative links in `blog/` (64 pointing at retired pages), 188 relative nav links in top-level pages, 3 hard 404s. Final scan: 0 issues** |

| Field | P0.5 Fix the festival merge — the worst defect found |
|---|---|
| Deliverable | `blog/eggless-cakes-eid-milad-un-nabi-sydney.html` rebuilt, 2,259 → 6,246 words |
| Exact steps | Re-scope title/H1/meta to a multicultural pillar keeping Eid prominent; add a month-by-month Sydney festival calendar covering all 29 merged observances grouped by community; add a dietary-limits section; 5 new FAQs with matching schema |
| Duration | 90 min (agent) |
| Tools | Repo, `blog-write` skill checklist |
| Completion criteria | All 29 festival names present; 10 visible FAQs == 10 schema questions; one `<h1>`; `verify-blog.mjs` passes |
| Dependencies | None |
| Risk if skipped | 29 festival queries 301 into an unrelated page — Google treats redirects to irrelevant pages as soft 404s, and every one of those searchers bounces |
| Report rationale | §2: "ensure that unique factual content from merged pages is woven into the survivor"; Implications: weave the details into pillar pages |
| **Result** | **Done. Passover/kosher/fasting constraints stated honestly rather than overclaimed** |

| Field | P0.6 Fix `llms.txt` — 223 dead URLs and a wrong pricing model |
|---|---|
| Deliverable | `llms.txt` shop section replaced with the live size/serving/price table and the canonical 15-flavour list |
| Exact steps | Confirm `/shop/*` returns 404 in production; remove the 223 entries; replace with prices read from `/cakes` and flavours read from the `/order` dropdown |
| Duration | 20 min |
| Tools | curl, `cakes.html`, `order.html` |
| Completion criteria | `grep -c '/shop/' llms.txt` = 0; no "design tier" language; `verify-blog.mjs` still passes |
| Dependencies | None |
| Risk if skipped | AI engines are handed 223 dead product links and a pricing model the business abandoned in August |
| Report rationale | §5: `llms.txt` is not a ranking signal, but what it contains is read by AI engines — accuracy is the point |

| Field | P0.7 Fix serving-size self-contradiction |
|---|---|
| Deliverable | 81 assertions corrected in 32 files; `serving-size-corrections.csv` + `serving-size-contradictions.csv` |
| Exact steps | Establish the canonical chart from `/order`; detect same-clause `<size>-inch … X–Y guests` assertions; exclude format-qualified cases (square, tier, sheet, "build"); rewrite; re-scan |
| Duration | 45 min |
| Tools | Repo, canonical chart |
| Completion criteria | Residual same-clause contradictions = 0; all 247 JSON-LD blocks still parse; prose reads correctly on spot-check |
| Dependencies | None |
| Risk if skipped | The site answers one of its four highest-intent questions six different ways, failing §5's first selection criterion by construction |
| Report rationale | §5 clear, direct answers; §6 serving-size explanations are named supporting content |

| Field | P0.8 Point internal links at the dietary cluster owners |
|---|---|
| Deliverable | 4 FAQ items + 4 schema entries on `best-eggless-cake-shops-sydney-2026`, linking all 5 dietary owner pages |
| Exact steps | Confirm the owner-page mismatch in GSC; confirm the pillar links to none of them; add exact-anchor FAQ links; extend `FAQPage` schema; validate |
| Duration | 30 min |
| Tools | GSC data, repo |
| Completion criteria | Pillar links to all 5 owners; 9 visible FAQs == 9 schema questions; JSON-LD valid |
| Dependencies | P0.2 |
| Risk if skipped | 5 dedicated pages keep earning 0–30% of their own demand indefinitely |
| Report rationale | Implications: map each entry to a cluster owner to prevent cannibalisation; §3 hub-and-spoke linking |

| Field | P0.9 Rebuild `/indian-sweet` — the biggest untapped query |
|---|---|
| Deliverable | 516 → 1,957 words, 9 FAQs, `FAQPage` added to the existing `@graph`, new title/meta |
| Exact steps | Rewrite title/meta for the click; add range guide, ordering/bulk/gift info, both stores verbatim from `locations.html`; 9 conversational FAQs mapped to real GSC queries; schema generated from the visible DOM |
| Duration | 70 min (agent) |
| Tools | Repo, GSC query list |
| Completion criteria | 9 visible == 9 schema; one JSON-LD block, valid; Wikidata `sameAs` intact; filter tabs still work; screenshot matches design |
| Dependencies | P0.1 |
| Risk if skipped | "barfi near me" keeps returning 677 impressions at position 7.9 and **zero** clicks |
| Report rationale | §5 FAQ-rich structured content is the priority GEO lever; report names the sweets line as under-built |

| Field | P0.10 Populate the topic ledger |
|---|---|
| Deliverable | `blog/topic-ledger.md` "Open topic gaps" populated with GSC evidence + permanent rejections |
| Exact steps | Derive Tier 1 (owner exists, earns none of its demand), Tier 2 (CTR problem), Tier 3 (the one justified new URL), plus explicit rejections |
| Duration | 40 min |
| Tools | GSC exports |
| Completion criteria | Every row carries a real impressions number; the suburb-page expansion is permanently rejected in writing |
| Dependencies | P0.1, P0.2 |
| Risk if skipped | The blog routine stays blocked, or restarts with no vetted backlog and falls back to per-run guessing |
| Report rationale | Implications: the ledger "should be actively populated with demand data… becoming the central planning tool rather than remaining empty" |

## P1 — Started today, needs owner input or a future window

| Priority | Task | Deliverable | Exact steps | Duration | Tools/access | Completion criteria | Dependencies | Risk if skipped | Report rationale |
|---|---|---|---|---|---|---|---|---|---|
| P1.1 | **Supply real per-location review figures** | Correct `aggregateRating` in `index.html` + `locations.html`, or removal | Open GBP for each store, read the true rating and count, then update both files (4 schema nodes) | 15 min | GBP dashboard | Each location carries its own real numbers, or the markup is removed | Owner | Publishing identical unverifiable ratings for two different shops risks a structured-data manual action | §6 audit for structured-data errors |
| P1.2 | **Correct the atParramatta.com listing** | A corrected citation | Request correction of suite, phone, domain and the savoury menu description; then re-check DoorDash's address form | 30 min | Owner identity | Listing matches the site's NAP exactly | Owner | Conflicting NAP suppresses local prominence and AI-citation confidence | §6 NAP consistency; §5 citations as an AI lever |
| P1.3 | **Resolve the remaining internal NAP conflict** | One factory address | Decide whether the factory is Mulgrave or Yennora and apply site-wide. *(Riverstone venue name resolved 2026-09-02 — see L8. Harris Park suite number also corrected the same day: was `96/96 Wigram Street`, now `Shop 1, 96–98 Wigram Street`, applied across 236 files.)* | 5 min to decide, 5 min to apply | Owner knowledge | Site agrees with itself | Owner | The site contradicts itself on the factory address | §6 NAP consistency |
| P1.4 | **Restart GBP posting** | A live post per location | Fix the CTA that points at a retired URL; retry the stored Make webhook; resume the location rules cadence | 30 min | `GBP/posts-queue.md`, Make webhook | A post publishes to each location | Owner | 80 days dark on the report's named "good performance" baseline | §6 routine GBP posts and review responses |
| P1.5 | **Record GBP baseline metrics** | Filled baseline block in both audit files | Read review count, rating, photo count, calls, direction requests, profile views; write them into the two audit files | 15 min | GBP dashboard | All fields populated with today's values | Owner | The 4–6 week GBP comparison is impossible | Implications: calls, direction requests and GBP visibility are the meaningful outcomes |
| P1.6 | **Decide the 62 off-menu flavour mentions** | A corrected corpus | Confirm whether Pistachio, Lotus Biscoff, Salted Caramel etc. are genuinely available; if not, rewrite those 62 mentions to the canonical 15 | 30 min | `off-menu-flavours.csv`, owner knowledge | 0 off-menu mentions, or an updated canonical list | Owner | The blog advertises flavours customers cannot order | §6 content should reflect real offerings |
| P1.7 | Keyword Planner cross-check | Volume figures against the 14 seeds | Add `ads_developer_token` + `ads_customer_id` to `~/.config/claude-seo/google-api.json`, run `keyword_planner.py volume` | 20 min | Google Ads account | Seeds carry a second volume source | Owner | Ledger rests on GSC alone — sufficient, but single-source | §4: Keyword Planner + GSC as the free stack |
| P1.8 | Write `rasmalai-cake-sydney` | One new post — the only approved new URL | Invoke the `blog-write` skill; name `eggless-cake-flavours` as cluster owner; interlink; add to index/sitemap/llms.txt | 90 min | `blog-write` skill | `verify-blog.mjs` passes; no new cannibalisation | P0.10 | 291 impressions and 14 clicks stay scattered across `/`, `/cakes` and a suburb page | §4 demand validation; ledger Tier 3 |

## P2 — Schedule next (monitoring windows and sustained execution)

| Priority | Task | Deliverable | Duration | Completion criteria | Dependencies | Risk if skipped | Report rationale |
|---|---|---|---|---|---|---|---|
| P2.1 | **4–6 week post-consolidation review** (due **2026-10-06**, from 2026-09-01) | Checkpoint directory + written verdict | 60 min | `analyze.py` re-run; §6 decision rules applied | P0.1 | The consolidation is never actually evaluated | §2: stabilisation within 4–8 weeks |
| P2.2 | **8–12 week review** (due **2026-11-03**) | Second checkpoint + keep/extend decision | 60 min | Position and CTR trend vs baseline | P2.1 | No basis for deciding whether to consolidate further | §2: improvement over 1–3 months |
| P2.3 | Remediate residual cannibalisation on "eggless cake near me" (59 URLs) | Fewer competing URLs, stronger owner | 3–4 h | Owner page holds a clearly larger share | P2.1 | The head query stays split | §2 cannibalisation; §3 doorway risk |
| P2.4 | Lift `/cakes` for "eggless cakes sydney" (currently position 26.8 while blog ranks 8.8) | Commercial page ranks for its own commercial query | 2–3 h | `/cakes` beats the blog for the money query | P0.8 | The converting page keeps losing to informational content | §6 map each page to a clear intent |
| P2.5 | Sustained review collection | Rising review counts at both stores | Ongoing | Riverstone gains third-party ratings | P1.5 | Weakest local-authority signal stays weak | §6 grow authority through reviews |
| P2.6 | Build Riverstone citations | Core directory listings | 2 h | Riverstone reaches parity with Harris Park | P1.2 | Riverstone stays near-invisible off-site | §6 citations |
| P2.7 | One substantial post every 4–6 weeks from the ledger | A validated post per cycle | 90 min each | Every post logged in Published history with evidence | P0.10 | Either stagnation or a return to unvalidated volume | Implications: one substantial post every 4–6 weeks |
| P2.8 | Add FAQ + `FAQPage` to `/order` | `/order` answers the ordering question in prose | 60 min | Visible == schema | — | The ordering page answers nothing; the blog answers for it | §5 FAQ-rich content on commercial pages |

## P3 — Defer or avoid

| Priority | Task | Verdict | Report rationale |
|---|---|---|---|
| P3.1 | **Resume high-volume publishing (5/day, or a fixed calendar)** | **Never.** Keep the routine disabled until a human decides to run it at 4–6 week cadence | §1 and §6: this is the documented pitfall that produced the dilution |
| P3.2 | **Create one page per suburb** | **Permanently rejected.** 59 URLs already compete for one query | §3: Google's spam policy names substantially similar city pages as doorway abuse |
| P3.3 | **Expand `llms.txt` as an SEO lever** | **Close `ACTION-PLAN.md` item 8.** Keep the file accurate; do not treat it as a ranking play | §5: explicitly not recognised by Google; an optional discovery aid |
| P3.4 | Further merges/redirects before the 4–6 week signal | Defer to P2.1 | §2: outcomes take 4–8 weeks; merging now confounds measurement |
| P3.5 | Sitemap `priority`/`changefreq` consistency (`ACTION-PLAN.md` item 10) | Skip — Google ignores them, as that file already concedes | Not supported by the report as a lever |
| P3.6 | Chasing "organic neem cake in sydney" (189 impr) and similar | Reject | §4/§6: target real problems, not artificial keyword volume |
| P3.7 | Rewriting anchor text for its own sake (`backstory` §4.1) | Low value now that every link points directly at its survivor | Report prioritises the destination, not the wording |
| P3.8 | Fixing the 2-hop `http://www` → apex redirect | Cosmetic; canonicals are correct and both variants resolve | Not a report-named lever |

---

# 3. Today's Schedule: 12:00 pm to Completion

Activity types: **analysis only** · **draft/preparation** · **safe non-live update** · **live-site change**.
Data capture and validation came first; nothing on the live site was touched until the QA passed.

| Time | Task | Exact actions | Tools | Output | Verification | Live-site impact |
|---|---|---|---|---|---|---|
| 12:00–12:15 | Confirm access before planning around it | `gsc_query.py sites`; check `~/.config/claude-seo/`; test GA4 client; check Windsor.ai connectors | GSC API, Windsor.ai | Access matrix — GSC ✅, GA4 ✅ (after one `pip install`), Keyword Planner ❌, GBP ❌ | GSC returns the verified property | **analysis only** |
| 12:15–12:35 | Capture the GSC + GA4 baseline | 4 GSC pulls (`page`, `query`, `query,page`, `date`, 90d) + GA4 organic | `gsc_query.py`, `ga4_report.py` | 5 raw JSON files | Row counts non-zero: 381 / 3,413 / 5,331 / 88 | **analysis only** |
| 12:35–12:50 | Derive metrics and the cannibalisation audit | Write `analyze.py`; produce CSVs + `BASELINE-SNAPSHOT.md`; split brand vs non-brand | Python | Snapshot + `cannibalisation-audit.csv` | Totals reconcile with the page CSV | **analysis only** |
| 12:50–13:10 | Decompose the indexed-URL inventory | Compare 381 indexed URLs against 241 files on disk | Python | 126 retired-still-indexed, 16 `.html`, 12 dual-indexed | Matches `blog-gsc-per-page.md` exactly | **analysis only** |
| 13:10–13:35 | Redirect QA | Static chain/target analysis on 528 rules, then 160 live parallel checks | curl, `netlify.toml` | `redirect-qa.csv`, `redirect-pairs.txt` | 0 chains; 156/160 single-hop | **analysis only** |
| 13:35–13:45 | ☕ Break | | | | | |
| 13:45–14:30 | Internal-link QA and repoint | Classify every `<a href>`; rewrite to direct absolute survivor URLs; re-scan | Python, repo | 680 links fixed in 65 files | Site-wide re-scan = **0 issues**; `verify-blog.mjs` passes | **live-site change** (committed later) |
| 14:30–14:45 | Visual regression check | Start `serve.mjs`; screenshot `/` and `/indian-sweet`; read the PNGs | `serve.mjs`, `screenshot.mjs` | 2 screenshots | Nav and layout intact after rewriting every nav link | **analysis only** |
| 14:45–15:00 | Fix the redirect chains | Change 4 rules `to = "/blog"` → `"/blog/"` | `netlify.toml` | 4-line diff | `grep -c 'to = "/blog"$'` = 0 | **live-site change** |
| 15:00–16:30 | Four parallel workstreams | Agents: festival pillar rebuild · GBP audits · GEO baseline · `/indian-sweet` rebuild | Agents, repo, web | 2 pages rebuilt, 3 audit files | Each agent ran `verify-blog.mjs` + JSON-LD + screenshot checks | **live-site change** (2 pages) |
| 15:00–15:30 | *(concurrent)* Populate the topic ledger | Derive Tier 1/2/3 + rejections from GSC | GSC exports | `blog/topic-ledger.md`, `keyword-planner-seeds.csv` | Every row carries a real impressions number | **safe non-live update** |
| 15:30–16:00 | *(concurrent)* Dietary cluster-owner links | Add 4 FAQs + 4 schema entries to the pillar | Repo | Pillar links all 5 owners | 9 visible == 9 schema; JSON-LD valid | **live-site change** |
| 16:00–16:45 | Factual-consistency sweep | Serving-size detector + fix; `llms.txt` shop section; flavour renames | Python, curl | 81 assertions, 223 dead URLs, 39 renames | Residual contradictions = 0; 247/247 JSON-LD valid | **live-site change** |
| 16:45–17:00 | ☕ Break | | | | | |
| 17:00–17:45 | Write this plan | Sections 1–7 with provenance tags | Repo | `SEO-ACTION-PLAN-2026-09-02.md` | Every inference tagged | **safe non-live update** |
| 17:45–18:30 | **End-of-day QA and handover** | Full re-verification: `verify-blog.mjs`, site-wide link scan, JSON-LD parse, redirect re-check, screenshots of every changed page, code review of the diff | All | QA log | Every check green | **analysis only** |
| 18:30–18:45 | Commit and push | Group commits by change type; push to `main` | git | Pushed commits | `git status` clean | **live-site change** — *Netlify auto-publish is OFF; the owner must click publish* |

**Could not be truthfully completed today, with the exact setup done and the checkpoint defined:**

| Item | Setup completed today | Future checkpoint required |
|---|---|---|
| Consolidation outcome | Baseline captured; `analyze.py` written so the checkpoint recomputes identically | **2026-10-06** (4–6 wk) and **2026-11-03** (8–12 wk), measured from 2026-09-01 |
| GBP dashboard metrics | Both audits written with every externally-verifiable field filled; a ~10-min tick-list defined | Owner completes the tick-list; then re-read at each checkpoint |
| Review growth | Review app live; baseline fields defined | Re-count at 2026-10-06 |
| Keyword Planner cross-check | 14 seeds exported with GSC numbers | After Ads API credentials are added |
| The 62 off-menu flavours | Canonical 15 recovered; all mentions catalogued | Owner confirms availability, then a scripted rewrite |

---

# 4. Copy-Paste Operational Checklists

All output paths are relative to the repo root. `<DIR>` = `seo-baseline/<YYYY-MM-DD>/` for the run.

## 4.1 Google Search Console baseline capture

**Tools:** `skills/seo-audit/scripts/gsc_query.py`, service account at `~/.config/claude-seo/`.

```bash
cd skills/seo-audit/scripts
P="sc-domain:numnumsbakery.com.au"; OUT="../../../seo-baseline/$(date +%F)"; mkdir -p "$OUT"
python3 gsc_query.py sites                                                            # 1
python3 gsc_query.py -p "$P" --days 90 --dimensions page       --limit 5000  -j > "$OUT/gsc-pages-90d.json"
python3 gsc_query.py -p "$P" --days 90 --dimensions query      --limit 5000  -j > "$OUT/gsc-queries-90d.json"
python3 gsc_query.py -p "$P" --days 90 --dimensions query,page --limit 25000 -j > "$OUT/gsc-query-page-90d.json"
python3 gsc_query.py -p "$P" --days 90 --dimensions date       --limit 1000  -j > "$OUT/gsc-daily-90d.json"
```

- [ ] Step 1 lists `sc-domain:numnumsbakery.com.au` — **FAIL:** credentials broken, stop and fix before anything else
- [ ] All four files exist and are >1 KB
- [ ] Page rows ≥ 300, query rows ≥ 3,000, query-page rows ≥ 5,000 — **FAIL if far lower:** the API silently truncated; re-run with a higher `--limit`
- [ ] Date rows ≈ 88 (GSC lags 2–3 days; 90 is never returned)

**Output to save:** all four JSON files in `<DIR>`.
**Escalation:** if `sites` fails, check `~/.config/claude-seo/google-api.json` → `service_account_path`, and confirm the service account email is still added to the GSC property.

## 4.2 GA4 baseline capture

**Tools:** `skills/seo-audit/scripts/ga4_report.py`; needs `pip install google-analytics-data`.

```bash
python3 skills/seo-audit/scripts/ga4_report.py --days 90 --limit 200 --json > "<DIR>/ga4-organic-90d.json"
```

- [ ] `totals.sessions` > 0 — **FAIL:** confirm the service account is added to GA4 property `531794710`
- [ ] `date_range` matches the GSC window (allow 1 day of lag drift)
- [ ] `daily_data` has ~88–90 entries
- [ ] Record sessions, users, pageviews into the snapshot

**Escalation:** Windsor.ai also carries GA4 for this property but its free plan blocks multi-account reads — do not rely on it.

## 4.3 Keyword cannibalisation audit

**Tools:** `<DIR>/gsc-query-page-90d.json`, `seo-baseline/analyze.py`.

- [ ] Run `python3 seo-baseline/analyze.py <DIR>`
- [ ] Open `<DIR>/cannibalisation-audit.csv`
- [ ] **Brand rows are excluded from remediation** — a brand query legitimately surfaces many pages
- [ ] For each non-brand query with `split_impressions` > 100: confirm the `owner_url` is the page you *want* to own it
- [ ] Flag every row where `weaker_page_outranks_owner` = True — the fix is internal links to the owner, not a merge
- [ ] Count URLs competing for the top 5 commercial queries and record it — this is the number that must fall

**Pass:** total non-brand split impressions are lower than the previous checkpoint.
**Fail:** split impressions rise, or a new query enters the top 10 by split.
**Output:** `cannibalisation-audit.csv` + the top-5 URL counts in the snapshot.
**Escalation:** if a commercial page is outranked by a blog post for its own query, fix internal links first; only consider a merge after the 8–12 week checkpoint.

## 4.4 Content merge and 301 redirect QA

**Tools:** `netlify.toml`, curl, production site.

- [ ] Extract every `[[redirects]]` triple into `<DIR>/redirect-pairs.txt`
- [ ] **Static:** no `to` value is also a `from` value → **0 chains required**
- [ ] **Static:** every `/blog/...` target has a matching file in `blog/` (ignore splats, sitemap and `/blog/` itself)
- [ ] **Static:** no rule where source slug == target slug except deliberate `.html`/trailing-slash canonicalisation
- [ ] **Live:** every retired clean URL returns `301` and resolves to `200` in **exactly 1 hop**
- [ ] Pruned pages return `404` with no redirect target
- [ ] Spot-check 3 merges against `blog-consolidation-worklist.md` — the survivor must be the GSC-corrected one, not the cluster-report guess

**Pass:** 0 chains, 0 unintended 404s, ≥95% single-hop.
**Fail:** any chain, or a retired URL returning 200 when it should redirect.
**Output:** `redirect-qa.csv`.
**Escalation:** a chain means two merge passes stacked — flatten the first rule to point at the final survivor, never add a third rule.

## 4.5 Internal-link QA after redirects

**Tools:** repo, `redirect-pairs.txt`.

- [ ] Scan every `<a href>` in `blog/*.html` and the 7 top-level pages
- [ ] Exclude assets (`.css`, `.js`, images, `.xml`, `.txt`, `.pdf`, media)
- [ ] Classify: `RETIRED` (href matches a redirect source) · `HTML_HOP` (href ends `.html`) · `RELATIVE` (no leading `/`) · `BROKEN` (no file, no rule)
- [ ] **Relative links are the trap.** A pass that only checks absolute hrefs will report clean while hundreds of relative links still hop — this is exactly what happened on 2026-09-01
- [ ] Rewrite every hit to the direct absolute survivor URL
- [ ] Re-scan → **0 in every category**
- [ ] `node verify-blog.mjs` passes
- [ ] Screenshot one top-level page and one blog post; confirm navigation still renders

**Pass:** 0 issues on re-scan **and** the screenshots look right.
**Fail:** any count > 0.
**Output:** `internal-link-qa.csv`.
**Escalation:** if a slug resolves to neither a file nor a rule, it was deleted without a redirect — add the rule before shipping.

## 4.6 Demand-validation gate for any proposed new content

Run **before** writing a single word. Any "no" kills the topic.

- [ ] Is the topic in `blog/topic-ledger.md` → "Open topic gaps"? If not, it needs validation now
- [ ] Does GSC show real impressions for the query family over the last 90 days? Record the number
- [ ] Is the intent commercially relevant to **eggless cakes or Indian sweets**? (Not neem cake. Not toy brands.)
- [ ] Is the suburb/area one the business genuinely serves from Harris Park or Riverstone?
- [ ] **Does a page already exist for this topic?** If yes → this is an *improve* job, not a new URL. Stop here
- [ ] Which existing page currently ranks for the query? If one does, improving it beats adding a competitor
- [ ] Which cluster owner will this page link to, and which page links down to it?
- [ ] Would this page compete with any of the top-20 rows in `cannibalisation-audit.csv`?
- [ ] Optional: a second volume source (Keyword Planner) agrees the query is non-zero

**Pass:** every box ticked, with the impressions number written into the ledger row.
**Fail:** any unticked box.
**Output:** a ledger row, or a line in the rejected table explaining why.
**Escalation:** if two people disagree, default to *improve the existing page* — the report is explicit that neglecting existing pages in favour of new content is a pitfall.

## 4.7 New-content pre-publish checklist

- [ ] `skills/blog-write/SKILL.md` invoked, and it contains the "Num Nums Bakery HTML Project — Non-negotiable Pre-publish Checklist" section (if not, you have the generic plugin version — stop)
- [ ] `ls blog/` checked — no existing post covers this
- [ ] Passed §4.6 in full
- [ ] Cluster owner named; links both up to the owner and out to 2–3 siblings
- [ ] All internal links are **absolute, extensionless** (`/blog/slug`) — never relative, never `.html`
- [ ] Serving sizes match the canonical chart: 6″ 6–8 · 8″ 12–14 · 10″ 20–22 · 12″ 25–30 · 14″ 40–45 · 16″ 50–55
- [ ] Prices match `/cakes`: $39.99 / $49.99 / $74.99 / $89.99 / $114.99 / $134.99
- [ ] Flavours are from the canonical 15 only (Vanilla, Chocolate, Red Velvet, Butterscotch, Black Forest, White Forest, Strawberry, Mango, Cookies & Cream, Lychee, Pineapple, Tiramisu, Blueberry, Rasmalai, Ferrero Rocher)
- [ ] Product scope respected: eggless cakes and Indian sweets only — no savoury, no snacks
- [ ] Title ≤ 60 chars where possible, keyword front-loaded
- [ ] Visible FAQ count == `FAQPage` schema count, same wording
- [ ] Wikidata `sameAs` (`https://www.wikidata.org/wiki/Q140076208`) on the entity node
- [ ] Exactly one `<h1>`
- [ ] Lenis smooth scroll + pink progress bar present
- [ ] Image not reused from another post (run the image-reuse grep)
- [ ] Double-quoted inline styles only (Netlify minification truncates single-quoted ones)
- [ ] No `transition-all`; no default Tailwind blue/indigo
- [ ] Added to `blog/index.html`, `sitemap.xml`, `llms.txt`
- [ ] `node verify-blog.mjs` passes
- [ ] Screenshotted at 1440px and 390px and visually reviewed
- [ ] Appended to the ledger's Published history with date, slug, cluster and demand evidence

## 4.8 Multi-location and service-area page quality gate

For any page targeting a place.

- [ ] Does the business have a **physical location** there? → full location page, always justified
- [ ] If not: does the business **regularly serve** the area from Harris Park or Riverstone?
- [ ] Is there **validated, non-zero demand** for the service+suburb query? Record the number
- [ ] Can the page carry **800–1,200 words of genuinely unique local content** — local needs, landmarks, real reviews, area-specific FAQs — not boilerplate with the suburb swapped?
- [ ] Is it more than ~5 minutes' drive from an existing suburb survivor? (Closer than that and it merges by the consolidation's own rule)
- [ ] Does it link **up** to the Locations hub and **down** from it?
- [ ] Would it add another URL to a query that already has multiple competitors in `cannibalisation-audit.csv`?

**Pass:** every box ticked.
**Fail:** any unticked box → **do not create the page.** Add a "serving nearby suburbs" mention on the relevant existing survivor instead.
**Escalation:** if more than two new service-area pages are proposed in a quarter, stop — that is the doorway pattern restarting.

## 4.9 Google Business Profile audit — Harris Park

Full version with observed values: `seo-baseline/2026-09-02/gbp-audit-harris-park.md`.

**Externally verifiable (anyone can run):**
- [ ] GBP entity exists and is distinct from Riverstone (CID `9682743011049857083`)
- [ ] Business name string matches the site exactly — watch for `Num Nums` vs `Num Num's`
- [x] Address matches `Shop 1, 96–98 Wigram Street, Harris Park NSW 2150` — **corrected 2026-09-02, owner-confirmed** (was `96/96 Wigram Street`, itself wrong, independent of the atParramatta.com mismatch)
- [ ] Phone matches `+61 425 697 725`
- [ ] Website field points at `numnumsbakery.com.au` (**not** `numnums.com.au`)
- [ ] Category reflects a bakery/cake shop, not a restaurant
- [ ] Hours match `locations.html`
- [ ] **atParramatta.com corrected** — currently `Shop 2 96-98 Wigram Street`, `02 9891 4957`, `numnums.com.au`, with a savoury menu description. **Known FAIL as of 2026-09-02**
- [ ] DoorDash address form (`96/98 Wigram Street`) reconciled. **Known FAIL**

**Dashboard-only — ~10 minutes, yes/no each:**
- [ ] Profile shows no "incomplete" prompts
- [ ] Products/Services populated with real cake and sweet ranges
- [ ] Business description present and within the eggless cakes + Indian sweets scope
- [ ] Attributes set (wheelchair access, payments, pickup/delivery)
- [ ] Q&A queue has no unanswered questions
- [ ] Messaging state is deliberate (on and monitored, or off)
- [ ] Photos added within the last 90 days
- [ ] A post published within the last 30 days — **known FAIL, 80 days dark**

**Baseline to record today:** review count · average rating · photo count · calls (90d) · direction requests (90d) · profile views (90d).
**Escalation:** if the live rating/count differs from the site's `aggregateRating` (4.6 / 50), fix the schema in `index.html` and `locations.html` the same day.

## 4.10 Google Business Profile audit — Riverstone

Full version: `seo-baseline/2026-09-02/gbp-audit-riverstone.md`. Same structure as §4.9, plus:

- [ ] GBP entity distinct from Harris Park (CID `12106213505071216931`)
- [ ] Address matches `Shop 8, Riverstone NSW 2765`
- [x] **Venue name resolved 2026-09-02** — owner confirmed `Shop 8, Riverstone Shopping Centre (Riverstone Village)`; applied to the canonical NAP fields (schema, `llms.txt`, GBP rule files)
- [ ] Citation footprint beyond Uber Eats and Menulog — **known FAIL, only 2 aggregators vs 5 for Harris Park**
- [ ] Any third-party rating exists at all — **known FAIL, none found**
- [ ] `aggregateRating` is Riverstone's own, not a copy of Harris Park's — **known FAIL, identical 4.6 / 50**
- [ ] A post published within the last 30 days — **known FAIL**

**Escalation:** Riverstone opened December 2024. If it still has no third-party ratings at the next checkpoint, review collection for this store becomes P0.

## 4.11 GEO / AI-search visibility baseline audit

Full version: `seo-baseline/2026-09-02/geo-ai-baseline.md`.

- [ ] `robots.txt` allows GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, CCBot
- [ ] `curl -s <url> | grep -c 'text/babel'` returns **0** on the homepage and key pages (**verified 0 on 2026-09-02 — closes `ACTION-PLAN.md` items 2 and 6**)
- [ ] Every H1 and the price table appear in the raw HTTP response, not only after JS
- [ ] Each of the four high-value question types — **ordering, pricing, serving sizes, dietary** — has an owning page
- [ ] Each owning page has a visible FAQ **and** matching `FAQPage` schema
- [ ] Each answers its core question directly and early, not buried
- [ ] Facts are consistent site-wide: serving sizes, prices, flavours, addresses
- [ ] `llms.txt` contains no dead URLs and no stale pricing model (**223 dead `/shop/` URLs removed 2026-09-02**)
- [ ] Third-party sources appearing for core queries recorded, for presence-building

**Pass:** crawlers allowed, 0 `text/babel`, all four question types owned with FAQ + schema, 0 factual contradictions.
**Do NOT:** treat expanding `llms.txt` as a lever — the report says Google does not use it.
**Escalation:** a factual contradiction is the highest-priority GEO defect; a machine has already been observed repeating a price the site's own table disagrees with.

## 4.12 Monthly SEO review

- [ ] Re-run §4.1 and §4.2 into a fresh dated directory
- [ ] `python3 seo-baseline/analyze.py <DIR>`
- [ ] Compare against the previous checkpoint: position, CTR, clicks, conversions — **not impressions**
- [ ] Re-run §4.3; is non-brand split impressions falling?
- [ ] Re-run §4.5; must be 0
- [ ] Run the monthly `seo-audit` routine; compare the 0–100 health score
- [ ] Re-run the serving-size / price / flavour detectors; must be 0
- [ ] Review GBP: new reviews responded to, a post published, metrics recorded
- [ ] Review the ledger: is anything in "Open topic gaps" now stale or already fixed?
- [ ] At most one substantial post published this cycle, logged with evidence

**Output:** a dated directory plus a short written verdict.
**Escalation:** two consecutive months of falling clicks *and* worsening position → stop publishing entirely and re-audit.

## 4.13 Post-consolidation 4–6 week review — due **2026-10-06**

Measured from 2026-09-01, not from the baseline capture.

- [ ] Fresh GSC + GA4 capture; `analyze.py` re-run
- [ ] **Average position vs 10.7** — the primary signal. Improving (lower) = working
- [ ] **CTR vs 2.24%** — improving = the right pages are ranking
- [ ] Impressions vs 89,578 — **a fall here is expected and is not a failure**
- [ ] Count indexed URLs: was 381 against 241 on disk. The 126 retired URLs should be decaying
- [ ] Are the 12 dual-indexed slugs consolidating onto their clean URL?
- [ ] Non-brand split impressions vs 8,442 — falling?
- [ ] "eggless cake near me" competing URLs vs 59 — falling?
- [ ] Do the 5 dietary owner pages now earn a larger share of their themes? (was 0% / 0% / 2% / 25% / 30%)
- [ ] `/indian-sweet` clicks vs 3 from 1,106 impressions
- [ ] Festival pillar: are the merged festival queries landing and holding?
- [ ] GBP: reviews, calls, direction requests vs the recorded baseline
- [ ] Re-run §4.4 and §4.5

**Success:** position improves, CTR improves, split impressions fall — even if impressions fall.
**Problem:** position flat or worse **and** clicks falling **and** split impressions unchanged.
**Escalation:** if clicks fall >25% with no position improvement, check for a lost redirect or a deindexed survivor **before** concluding the strategy failed.

## 4.14 Post-consolidation 8–12 week review — due **2026-11-03**

- [ ] Everything in §4.13
- [ ] Position trend across all three checkpoints — is it a trend or noise?
- [ ] Has average position moved **off the ~11 plateau**? This is the stated success signal
- [ ] Conversions: GA4 key events, WhatsApp clicks, order-form submissions vs baseline
- [ ] GBP calls and direction requests vs baseline — the report's "meaningful long-term outcomes"
- [ ] Are the retired URLs fully out of the index?
- [ ] Decide: **keep** (hold and keep improving existing pages) · **extend** (a second, smaller consolidation using the same GSC-corrected method) · **revert** (only if a specific survivor demonstrably lost traffic a merged page used to earn)
- [ ] Decide whether to re-enable the blog routine at one post per 4–6 weeks

**Success:** position off the plateau, CTR up, conversions flat or up.
**Problem:** position still ~11 after 12 weeks → the bottleneck is not cannibalisation. Look at off-site authority (reviews, citations), which the report names as the weakest signal here.
**Escalation:** do not start another consolidation before this review completes.

---

# 5. Future Content and Local SEO Architecture

> ## The business must NOT recreate one page per suburb.
> §3 of the report cites Google's spam policy: doorway pages are "substantially similar city or state
> landing pages" existing to capture keyword+location combinations, and large-scale city landing-page
> schemes are named as doorway abuse. This site already ran that pattern — 150 suburb pages, 42% of
> the corpus. Even after merging 71 away, **59 URLs still compete for "eggless cake near me."**
> Adding more is not a growth tactic; it is the failure mode.

## 5.1 Page-type model

| Page type | Purpose | Primary intent | Cluster owner | Required content elements | New-URL approval threshold | When to expand an existing page instead |
|---|---|---|---|---|---|---|
| **Home** (`/`) | Brand entity + primary conversion | Navigational / transactional | — (is the root) | Entity schema with Wikidata `sameAs`, both locations, price entry point, reviews, primary CTA | Never — one only | Always |
| **Product: cakes** (`/cakes`) | The cake range and prices | Transactional | Owns commercial cake queries | Size/serving/price table, flavour list, gallery, LocalBusiness + product schema, links down to dietary owners | Never — one only | Always. Currently position 26.8 for "eggless cakes sydney" while a blog post ranks 8.8 — strengthening this page is P2.4 |
| **Product: Indian sweets** (`/indian-sweet`) | The entire sweets line | Transactional | Owns all sweets queries | Per-range guide with per-kg pricing, ordering/bulk/gift info, both stores, FAQ + `FAQPage` | Never — one only | Always. Rebuilt today 516 → 1,957 words |
| **Ordering** (`/order`) | How to order | Transactional | Owns ordering queries | The process stated in prose, lead time, pickup locations, form, FAQ + `FAQPage` **(missing — P2.8)** | Never — one only | Always |
| **Locations hub** (`/locations`) | Parent for both shops | Local | Parent of both location pages | Both stores with map, precise NAP, coordinates, hours, LocalBusiness schema, links down to each store and out to service pages | Never — one only | Always |
| **Physical location** (Harris Park, Riverstone) | One per real shop | Local | Itself | Own GBP, embedded map, location-specific testimonials, LocalBusiness schema with precise NAP + coordinates, internal links to service pages, links back to the hub | **Only if a third physical shop opens** | For any area without a shop |
| **Service-area page** | A suburb genuinely served, with real demand | Local | The nearest suburb survivor, or `eggless-cakes-near-me-sydney` | 800–1,200 words of genuinely unique local content: local needs, landmarks, real reviews, area-specific FAQs, honest drive time | **All four gates in §5.2 — no exceptions** | Almost always. Default to a "serving nearby suburbs" mention on the nearest survivor |
| **Cluster pillar** | Owns a topic cluster | Informational → commercial | Itself | Comprehensive coverage, FAQ + `FAQPage`, links down to every spoke with exact-match anchors | Only when a genuinely new cluster appears | Whenever the topic fits an existing cluster |
| **Supporting post (spoke)** | One specific validated question | Informational | Its registered cluster pillar | Answer-first opening, links up to the pillar and across to 2–3 siblings, FAQ where the query is question-shaped | §4.6 gate passed **and** no existing page covers it | When any existing page already ranks for the query |

## 5.2 Service-area page approval gate — all four required

1. **Business relevance.** The business genuinely and regularly serves the suburb from Harris Park or Riverstone. Outside the real catchment → rejected (this is why "cakes mosman", 64 impressions, is a permanent rejection).
2. **Evidence threshold.** Non-zero validated demand for the service+suburb query, from GSC, with the number recorded in the ledger. Ideally corroborated by a second free tool.
3. **Unique value.** 800–1,200 words of content that could not be produced by swapping a suburb name into a template — local needs, landmarks, genuine reviews, area-specific FAQs.
4. **No cannibalisation.** Not within ~5 minutes' drive of an existing suburb survivor, and it does not add another URL to a query already in the top 20 of `cannibalisation-audit.csv`.

Fail any one → expand the nearest existing survivor instead.

## 5.3 Existing content pillars

From `blog/topic-ledger.md`'s cluster registry — the authoritative list. Every new post must register under one:

Site-wide · Suburb/near-me · Festival · Life-event · Dietary · Vs-comparisons · Kids-birthday · Design ·
Ingredients · Price/size · Ordering · Delivery · Flavour · Seasonal · Indian sweets.

## 5.4 Operating rules

**Supporting content**
- One substantial post every 4–6 weeks. Never a fixed calendar.
- Every post answers one validated question and names its cluster owner before drafting.
- Improving an existing page always beats adding a URL.

**Internal linking**
- Hub-and-spoke: pillar links down to every spoke with exact-match anchors; every spoke links up.
- The cluster owner gets the exact-match anchor. Nothing else does.
- Commercial pages are linked *to* from informational posts, not the reverse — the blog earns 1.41% CTR, commercial pages 3.57%.
- All internal links absolute and extensionless (`/blog/slug`). **Never relative, never `.html`.**
- Every new page must be reachable from at least one existing page. No orphans.

**Topic ledger**
- Nothing enters "Open topic gaps" without a real GSC impressions number.
- Every entry names its cluster owner and target URL.
- Rejected candidates are logged with the reason, so they are not re-validated.
- Published history is append-only.

**URL creation**
- A new URL requires: §4.6 passed, a named cluster owner, no existing page covering it, and no top-20 cannibalisation conflict.
- Service-area pages additionally require all four §5.2 gates.
- Slugs are lowercase, hyphenated, extensionless. No dates, no numbers that will age.

**URL consolidation and retirement**
- Pick the survivor on **GSC impressions and clicks**, never on topical intuition. 49 of 125 pairs were backwards when chosen topically.
- **Fold the unique facts into the survivor before redirecting.** A redirect to a page that does not answer the query is a soft 404 — this is what happened to 29 festival pages.
- Re-scope the survivor's title, H1 and meta if its role has widened.
- Update the `blog/index.html` card, `sitemap.xml` and `llms.txt` in the same change.

**Redirects**
- Retired URL → survivor, 301, single hop, both the clean and `.html` forms.
- Never chain. If the survivor is later merged, flatten the original rule to the final target.
- Prune with no redirect only when no target is a reasonable answer — then let it 404 honestly.
- Re-run §4.5 after every batch: repointing absolute links is not enough, relative links hop too.

**Cannibalisation prevention**
- One page per intent. If two pages answer the same question, one is the owner and the other links to it.
- Before publishing, check the query against `cannibalisation-audit.csv`.
- If a weaker page outranks the owner, fix internal links first — merging is the last resort, not the first.

**Doorway-page prevention**
- No page whose only differentiator is a place name.
- No templated geographic expansion, ever.
- Coverage for thin areas belongs in a "serving nearby suburbs" section on a real page.
- More than two new service-area pages proposed in a quarter is the pattern restarting — stop.

**GEO / AI-answer content**
- Treat GEO as an extension of SEO. There is no separate AI index and no markup that guarantees inclusion.
- Answer the question directly and early, in a self-contained passage.
- Question-shaped headings; FAQ sections in conversational language.
- Visible FAQ and `FAQPage` schema must match exactly.
- **Factual consistency is a GEO requirement.** One canonical answer per fact, site-wide.
- `llms.txt` is a discovery aid, not a lever — keep it accurate, do not invest in expanding it.
- The real AI levers here are GBP completeness, reviews, and citations.

---

# 6. Measurement and Decision Framework

## 6.1 Baseline collected today — the reference for every later checkpoint

| Metric | Baseline (2026-09-02, 90d) | Source |
|---|---:|---|
| Clicks | 2,010 | `gsc-pages-90d.csv` |
| Impressions | 89,578 | " |
| CTR | 2.24% | " |
| Average position (impression-weighted) | 10.7 | " |
| Indexed URLs earning impressions | 381 | " |
| Files on disk | 241 (233 posts + `blog/index` + 7 pages) | repo |
| Retired URLs still indexed | 126 (4,420 impr, 45 clicks) | derived |
| `.html` URLs still indexed | 16 (320 impr) | derived |
| Dual-indexed slugs | 12 | derived |
| Distinct queries | 3,413 | `gsc-queries-90d.csv` |
| Non-brand cannibalised queries | 104 | `cannibalisation-audit.csv` |
| Non-brand split impressions | 8,442 (9.4% of all) | " |
| Queries where a weaker page outranks the owner | 62 | " |
| URLs competing for "eggless cake near me" | 59 | " |
| Blog: URLs / impr / CTR / position | 361 / 55,029 / 1.41% / 9.6 | derived |
| Commercial + home: URLs / impr / CTR / position | 20 / 34,549 / 3.57% / 12.5 | derived |
| GA4 organic sessions / users / pageviews | 2,410 / 2,092 / 5,010 | `ga4-organic-90d.json` |
| `/indian-sweet` impressions / clicks | 1,106 / 3 | derived |
| "barfi near me" impressions / clicks / position | 677 / 0 / 7.9 | derived |
| Dietary theme share on its owner page | dairy 0% · gluten 0% · number 2% · halal 25% · nut 30% | derived |
| GBP reviews / rating / calls / directions | **NOT CAPTURED — dashboard required** | GBP |

## 6.2 Weekly metrics (5 minutes, GSC UI)

Clicks · impressions · CTR · average position, site-wide. Watch the **shape**, not any single week:
impressions falling while position improves is the expected post-consolidation signature.

## 6.3 4–6 week assessment — due 2026-10-06

Average position vs 10.7 · CTR vs 2.24% · clicks vs 2,010 · indexed URL count vs 381 · retired-URL
decay from 126 · non-brand split impressions vs 8,442 · "eggless cake near me" URL count vs 59 ·
dietary owner-page share · `/indian-sweet` clicks vs 3 · festival-query landings · GBP metrics vs
their baseline.

## 6.4 8–12 week assessment — due 2026-11-03

Everything above, plus: has position moved **off the ~11 plateau** (the stated success signal) ·
conversions (GA4 key events, WhatsApp clicks, order-form submissions) · GBP calls and direction
requests · full retired-URL deindexing · the keep / extend / revert decision · whether to re-enable
the blog routine.

## 6.5 Metrics expected to DECLINE — do not treat as failure

| Metric | Why |
|---|---|
| **Total impressions** | 126 retired URLs are leaving the index; they carried 4,420 impressions. The report states impressions may decline after consolidation |
| Indexed URL count | 381 → should fall toward ~241. This is the goal, not a regression |
| Total ranking keywords | Fewer pages cover fewer long-tail variants |
| Blog-section impressions | The blog carried the duplication |
| Impressions on merged suburb queries | The point of the merge |

## 6.6 Success signals

- Average position falls below 10.7 and keeps falling
- CTR rises above 2.24%
- Clicks hold or rise **while impressions fall** — the clearest possible signal
- Non-brand split impressions fall below 8,442
- Competing URLs for "eggless cake near me" fall below 59
- Dietary owner pages earn a rising share of their own themes
- `/indian-sweet` converts more than 3 clicks from ~1,100 impressions
- Commercial pages rank for commercial queries (`/cakes` above position 8.8 for "eggless cakes sydney")
- GBP calls, direction requests and reviews rise

## 6.7 Problem signals

- Position still ~11 at 12 weeks → the bottleneck is **not** cannibalisation; it is off-site authority (reviews, citations), which the report names as this business's weakest signal
- Clicks fall >25% with no position improvement → check for a lost redirect or deindexed survivor before blaming strategy
- Split impressions rise → a new page is competing with an owner
- A survivor loses more traffic than the pages merged into it earned → that specific merge was wrong
- Any retired URL returning 200, or any chain appearing → a redirect regression

## 6.8 Decision rules

| Observation | Decision |
|---|---|
| Position improves, impressions fall | **Keep.** Working as designed. Change nothing |
| Position flat, CTR improves | **Keep.** Titles and snippets are working; give it to the 12-week mark |
| Position flat, clicks falling, split impressions unchanged | **Investigate** internal linking to owners before any new merge |
| One query has 2+ URLs and a weaker page outranks the owner | **Update + link.** Strengthen the owner, add exact-anchor internal links. Do not merge |
| Two pages have genuinely identical intent and both are weak | **Merge** into the higher-impression page — and fold the facts across first |
| A page has near-zero impressions but a real commercial purpose | **Keep and improve.** Never prune a commercial page on traffic alone |
| A page has near-zero impressions, no commercial purpose, no reasonable redirect target | **Prune.** Let it 404 |
| A page has near-zero impressions but a sensible related survivor | **Redirect**, after folding its unique facts in |
| Demand is validated and no existing page covers it | **Create** — after §4.6 and, for places, §5.2 |
| Demand is validated and an existing page half-covers it | **Update the existing page.** The report's default |
| Position still ~11 at 12 weeks | **Shift investment off-site:** reviews, citations, GBP |

## 6.9 Dashboard fields (Google Sheets / Looker Studio)

**Site trend** — date · clicks · impressions · CTR · avg position · indexed URLs · GA4 organic sessions · GA4 key events · GBP calls · GBP direction requests · GBP reviews · GBP rating.

**Page-level** — url · page_type (home/commercial/pillar/spoke/suburb) · cluster · is_cluster_owner ·
clicks · impressions · ctr · position · Δ vs baseline · on_disk (Y/N) · redirect_target ·
inbound_internal_links · has_faq · has_faqpage_schema · action (keep/merge/update/deindex/redirect).

**Query-level** — query · is_brand · total impressions · total clicks · position · urls_competing ·
owner_url · owner_impressions · split_impressions · weaker_page_outranks_owner · Δ split vs baseline ·
intent (informational/commercial/local) · cluster.

Both page- and query-level tables come straight out of `analyze.py`; import the CSVs rather than
re-deriving them, so every checkpoint is computed identically.

## 6.10 Content decision process

For any page, in order — stop at the first that applies:

1. **Commercial purpose?** → keep. Improve it; never prune on traffic alone.
2. **Cluster owner, earning its demand?** → keep, monitor.
3. **Cluster owner *not* earning its demand?** → **update + link.** Strengthen it and point exact-match internal links at it. (All 5 dietary pages were here.)
4. **Duplicate intent with a stronger page?** → **fold facts across, then redirect** to the higher-impression page.
5. **Near-zero impressions, no commercial purpose, a sensible survivor exists?** → **redirect** after folding.
6. **Near-zero impressions, no purpose, no sensible target?** → **prune**, honest 404.
7. **Indexed but shouldn't be?** → **deindex**.
8. **None of the above, and demand is validated with no page covering it?** → **create**, via §4.6 and §5.2.

---

# 7. End-of-Day Deliverables

## What must exist by close of business today

**Baseline and analysis — `seo-baseline/2026-09-02/`**
- [x] `gsc-pages-90d.json` / `.csv` — 381 URLs
- [x] `gsc-queries-90d.json` / `.csv` — 3,413 queries
- [x] `gsc-query-page-90d.json` / `.csv` — 5,331 pairs
- [x] `gsc-daily-90d.json` / `.csv` — 88 days
- [x] `ga4-organic-90d.json` — 2,410 sessions
- [x] `BASELINE-SNAPSHOT.md` — the written baseline narrative
- [x] `seo-baseline/analyze.py` — re-runnable so checkpoints compute identically

**Audits and QA logs**
- [x] `cannibalisation-audit.csv` — 126 queries, brand-split, 104 non-brand
- [x] `redirect-pairs.txt` — all 528 rules extracted
- [x] `redirect-qa.csv` — 160 live checks, 156 pass, 0 chains
- [x] `internal-link-qa.csv` — 680 links corrected, final scan 0 issues
- [x] `serving-size-contradictions.csv` + `serving-size-corrections.csv` — 81 fixed
- [x] `off-menu-flavours.csv` — 62 mentions logged for owner review
- [x] `keyword-planner-seeds.csv` — 14 seeds for the optional cross-check
- [x] `gbp-audit-harris-park.md`
- [x] `gbp-audit-riverstone.md`
- [x] `geo-ai-baseline.md`

**Repo changes shipped**
- [x] `netlify.toml` — 4 redirect chains flattened
- [x] 680 internal links repointed across 65 files
- [x] `blog/eggless-cakes-eid-milad-un-nabi-sydney.html` — multicultural pillar, 2,259 → 6,246 words, 29 festivals covered
- [x] `indian-sweet.html` — 516 → 1,957 words, 9 FAQs + `FAQPage` schema, new title/meta
- [x] `blog/best-eggless-cake-shops-sydney-2026.html` — 4 dietary FAQs linking all 5 cluster owners
- [x] `llms.txt` — 223 dead `/shop/` URLs removed, live pricing table + canonical 15 flavours added
- [x] 81 serving-size assertions corrected across 32 files
- [x] 39 off-menu flavour names corrected
- [x] `blog/index.html` — festival card retitled to match the rebuilt page

**Planning and process**
- [x] `blog/topic-ledger.md` — "Open topic gaps" populated: 5 Tier-1 improve targets, 1 Tier-2 CTR target, 1 approved new URL, 5 permanent rejections
- [x] `SEO-ACTION-PLAN-2026-09-02.md` — this document: extraction, backlog, schedule, 14 checklists, architecture, measurement framework
- [x] Prioritised 90-day board — §2 (P0 done · P1 owner-blocked · P2 scheduled · P3 rejected)
- [x] Measurement checkpoint calendar — **2026-10-06** (4–6 wk) and **2026-11-03** (8–12 wk), from 2026-09-01

**Owner actions — the only SEO work left**
- [ ] **Click publish in Netlify** (auto-publish is off; nothing goes live without it)
- [ ] Supply real per-location review count and rating → fix `aggregateRating` in `index.html` + `locations.html` (P1.1)
- [ ] Request the atParramatta.com listing correction (P1.2)
- [ ] Confirm the factory address (Mulgrave vs Yennora) — the only remaining internal NAP conflict (P1.3). *Harris Park suite number and Riverstone venue name both resolved 2026-09-02.*
- [ ] Restart GBP posting — 80 days dark (P1.4)
- [ ] Record GBP baseline metrics into both audit files (P1.5)
- [ ] Confirm the 62 off-menu flavour mentions (P1.6)

---

# Appendix A — Defects found during end-of-day QA

None of these came from the research report; all were found by verifying the day's work in a real
browser, and all are **[Implementation inference]** fixes. They are recorded because each was a live
functional bug on a page the report's strategy depends on.

| Defect | Scope | Cause | Fix | Verified |
|---|---|---|---|---|
| `lenis is not defined` JS error | 16 pages incl. `/cakes`, `/order`, `/about`, `/locations`, `/blog/` | A duplicated Lenis block whose `var lenis = new Lenis(...)` line had been replaced by a comment, leaving bare `lenis.` calls | Removed the duplicate block (also drops a redundant library load) | 0 pages affected |
| `Lenis is not defined` | 5 pages | `unpkg.com/@studio-freight/lenis@1.1.14` returns **404** — that scoped package version does not exist, so smooth scroll never worked | Repointed to `unpkg.com/lenis@1.1.14/dist/lenis.min.js` (verified 200) | All Lenis URLs resolve |
| Mobile menu completely broken | `/privacy-policy` | An unterminated single-quoted JS string spanning a newline while building `portal.innerHTML` — the documented Netlify-minify hazard, committed into source | Joined onto one line | 0 inline JS syntax errors site-wide |
| `tailwind is not defined` | 4 pages | An orphan `tailwind.config` block with no Tailwind script, on pages that use zero Tailwind classes and load the compiled `/style.css` (it even named fonts the pages don't load) | Removed the dead block | 0 pages affected |
| Invalid SVG `rx="4 4 0 0"` | 2 pages | `rx` takes a single length; browsers ignored it and logged an error | `rx="4"` | Console clean |

**Final QA, post-merge:** `verify-blog.mjs` passes · 247/247 JSON-LD blocks valid · 0 inline JS
syntax errors · 0 internal-link issues · 0 serving-size contradictions · 0 redirect chains ·
0 dead `/shop/` URLs · **16/16 sampled pages load with zero JS errors and exactly one `<h1>`.**

# Appendix B — Merge with the monthly SEO routine

The `NumNums-SEO-Monthly` routine pushed commit `8829d4d` (2026-09-01, 51 files) while this work was
in progress. It was merged rather than overwritten. Two conflicts, both resolved keeping the correct
half of each side:

- **`llms.txt`** — the routine independently removed the same dead `/shop/` section, converging on
  today's finding. Its replacement "## Ordering" section was kept, but its phrase "priced by size,
  flavour, and **design complexity**" was corrected: design-tier pricing was reversed on 2026-08-26.
  The final file carries the live price table, the canonical 15 flavours, and the ordering section.
- **`blog/best-dessert-shop-sydney.html`** — took the routine's fix for a stray `</span>` and this
  work's fix replacing the off-menu flavour name "Chocolate Fudge" with "Chocolate".

`sitemap.xml` was reformatted by the routine and untouched here, so its version was taken whole.
Both sitemaps carried 240 URLs.

---

## Sources

- `SEO and Content Strategy Frameworks for Num Num's Bakery.md` — the research report; sole source of recommendations
- `numnums-seo-backstory.md` — factual record of the 2026-09-01 consolidation
- `blog-cluster-report.md`, `blog-gsc-per-page.md`, `blog-consolidation-worklist.md` — the 2026-09-01 audit trail
- `ACTION-PLAN.md` (2026-06-05) — superseded in part: items 2, 6 and 8 closed today; items 3, 5, 9 remain open
- `seo-baseline/2026-09-02/` — all data captured today
