# GEO / AI-Search Visibility Baseline — Num Num's Bakery

**Baseline date:** 2026-09-02
**Site:** https://numnumsbakery.com.au
**Repo state:** 233 blog posts (post-consolidation, 2026-09-01), 7 top-level pages
**Supersedes as a measurement point:** `GEO-ANALYSIS.md` (2026-06-05, scored 84/100). This document is a
**baseline**, not a score — its purpose is to give the 4–6 week and 8–12 week checkpoints something
re-runnable to diff against.

**Source of recommendations:** `SEO and Content Strategy Frameworks for Num Num's Bakery.md`, §5
("GEO and AI Search Engine Optimization for Local Businesses") and the "Implications" section.
Every recommendation below is either traceable to that report or explicitly labelled
**Implementation inference**.

---

## 1. Baseline date + method

### What I actually did

| Check | Method | Scope |
|---|---|---|
| AI crawler access | `curl -s https://numnumsbakery.com.au/robots.txt` — live, plus repo `robots.txt` diff | Whole site |
| Server-rendering | `curl -s <url>` → grep for `text/babel`, `react`, and for the actual answer strings; Python tag-strip word counts on the fetched bytes | 6 live URLs |
| Response headers | `curl -sI https://numnumsbakery.com.au/` + `netlify.toml` header block review | Homepage + config |
| FAQ presence (visible) | grep for `<details>`, `<summary>`, `Frequently Asked Questions`, `?`-terminated `h2`/`h3`/`summary` | 7 top-level + 234 blog files |
| `FAQPage` JSON-LD | Python: parse every `application/ld+json` block, recursive walk for `@type: FAQPage`, extract `name` / `acceptedAnswer.text` | Same |
| Answer-first | Extracted first ~150 words after `<h1>` and after the first `<h2>` per page, read manually | 15 pages |
| Fact consistency | Regex sweep of `N-inch round … serves X–Y` across all 233 posts, compared to the canonical price/size table on `cakes.html` | Whole blog |
| Third-party sources | 4 × `WebSearch` on core customer questions | See §6 |

### What I could **not** check, and why

- **I did not query ChatGPT, Perplexity, Google AI Overviews, or Google AI Mode.** I have no tool
  that reaches those surfaces. §6 reports what a **web search tool** returned, including the summary
  that tool generated. That is evidence that *an* AI-summarising layer is reading and paraphrasing
  this site — it is **not** an AI Overview, a ChatGPT citation, or a Perplexity citation, and must
  not be reported as one.
- **The search tool is US-region.** Results do not reliably reflect an `google.com.au` searcher in
  Sydney. Treat §6 as directional, not as an AU rank check.
- **GBP completeness, review count, review velocity, citation/NAP consistency** — not verifiable from
  here. Requires GBP access or a listings tool. The report names these as primary GEO levers, so
  this is a real hole in the baseline, flagged in §7.
- **Whether AI crawlers actually fetched the site.** That needs server/CDN request logs. `robots.txt`
  permission ≠ observed crawl.
- **Indexation / impressions.** Needs Search Console; not pulled here.
- **Rendered-DOM verification.** Everything below is raw-HTTP-response evidence only. That is the
  correct standard for AI crawlers (they don't run JS), but it is not a browser render check.

---

## 2. AI crawler access

`curl -s https://numnumsbakery.com.au/robots.txt` — live file matches repo file byte-for-byte.

| Crawler | Directive found | Verdict |
|---|---|---|
| `GPTBot` (OpenAI training/crawl) | `Allow: /` | **PASS** |
| `OAI-SearchBot` (ChatGPT search index) | `Allow: /` | **PASS** |
| `ChatGPT-User` (live user fetch) | `Allow: /` | **PASS** |
| `ClaudeBot` | `Allow: /` | **PASS** |
| `anthropic-ai` | `Allow: /` | **PASS** |
| `PerplexityBot` | `Allow: /` | **PASS** |
| `CCBot` (Common Crawl) | `Allow: /` | **PASS** |
| `*` (all others, incl. Googlebot / Google-Extended) | `Allow: /` | **PASS** |

`Sitemap: https://numnumsbakery.com.au/sitemap.xml` declared. No `Disallow` anywhere in the file.

**Header-level check:** `curl -sI /` returns no `X-Robots-Tag`. The only `X-Robots-Tag: noindex,
nofollow` in `netlify.toml` (line ~3164) is scoped to `/brand_assets/*` — logo/asset files, correctly
excluded, no impact on content crawling.

**Section verdict: PASS, nothing to fix.** Identical to the 2026-06-05 result. This is a maintenance
item, not an opportunity — re-verify at each checkpoint that nothing regressed.

---

## 3. Server-rendering check

The report frames technical accessibility as one of three selection criteria for AI summaries. The
specific historical risk here is `ACTION-PLAN.md` items **#2** and **#6**: the homepage hero was
transpiled in-browser via `@babel/standalone`, so non-JS AI crawlers saw an empty hero.

**Command used (per URL):**

```
curl -s https://numnumsbakery.com.au/<path> -o live-<page>.html
grep -c 'text/babel'   live-<page>.html
grep -c 'babel/standalone\|babel.min.js' live-<page>.html
grep -c 'react'        live-<page>.html
# then: strip <script>/<style>, strip tags, count words
```

| URL | HTTP | Bytes | `text/babel` | `babel/standalone` | `react` refs | H1 text present in raw HTML | Visible words in raw HTML |
|---|---|---|---|---|---|---|---|
| `/` | 200 | 145,810 | **0** | **0** | **0** | ✅ "A Custom Cake So Good, No One Will Guess It's Eggless." | 1,562 |
| `/cakes` | 200 | 143,189 | **0** | **0** | **0** | ✅ "100% Eggless Custom Cakes in Sydney" | 1,833 |
| `/order` | 200 | 111,387 | **0** | **0** | **0** | ✅ "Your Exact Cake, Made Eggless — Ready in 48 Hours" | 714 |
| `/indian-sweet` | 200 | 84,377 | **0** | **0** | **0** | ✅ "Freshly Made Indian Sweets" | 528 |
| `/locations` | 200 | 67,701 | **0** | **0** | **0** | ✅ "Visit Num Num's Bakery: Harris Park & Riverstone" | 650 |
| `/blog/cake-price-guide-sydney` | 200 | 81,134 | **0** | **0** | **0** | ✅ (10 `<h2>`, FAQPage present) | — |

**ACTION-PLAN #2 and #6 are RESOLVED as of 2026-09-02.** The verification command that plan specified
(`curl -s https://numnumsbakery.com.au/ | grep -c 'text/babel'` returns 0) now passes, on the live
site, on every page tested. React and Babel are gone from the homepage entirely; the only remaining
third-party script on `index.html` is Lenis (`unpkg.com/lenis@1.1.14`), which is decorative smooth
scroll and carries no content.

Spot-verified that the *substance* is in the bytes, not just the shell:

- `/cakes` raw HTML contains the full price/serving table — `39.99` ×8, `49.99` ×4, `134.99` ×2.
- `/blog/cake-price-guide-sydney` raw HTML contains `per serve` ×6 and the `$3-$6 per serve` answer.

**Section verdict: PASS.** A non-JS AI crawler sees the complete page on every URL tested. This was
the largest technical GEO risk on the site and it is closed.

---

## 4. Question-coverage matrix

Question types are those the report names as high-value for this business (§6 of the report:
"cost guides, ordering FAQs, serving-size explanations, dietary/ingredient guides"; §5: "'why'
questions", "clear headings and FAQ-style subsections").

| Question type | Owning page | Visible FAQ? | `FAQPage` JSON-LD? | Answer-first? | Gap |
|---|---|---|---|---|---|
| **Ordering** — "how do I order a custom eggless cake?" | `/order` | ❌ none | ❌ none | ⚠️ partial | **Largest gap.** 714 words, almost all form UI. The 5-step process is nowhere on the page as prose. No FAQ block, no schema. |
| Ordering (secondary) | `/blog/how-to-order-cake-sydney` | ✅ | ✅ 5 Q | ✅ H1 → H2 "What Are the 5 Steps…" answers immediately | Blog post carries the answer the money page should own |
| Ordering (tertiary) | `/` FAQ ("How much notice do you need?", "How do I get a quote?") | ✅ 6 × `<details>` | ✅ 6 Q | ✅ | — |
| **Pricing** — "how much does an eggless cake cost?" | `/cakes` | ✅ 6 × `<details>` | ✅ 6 Q | ✅ Table: 6″ $39.99 → 16″ $134.99, surcharges named | Table is inside a "Pricing / How Many Guests?" slider widget rather than a plain `<h2>` question |
| Pricing (secondary) | `/blog/cake-price-guide-sydney` | ✅ | ✅ 5 Q | ✅ "budget roughly $3-$6 per serve" in the first sentence under H2 #1 | **Contradicts `/cakes`** — says "single-tier designs start near $60-$80"; `/cakes` says $39.99 |
| **Serving sizes** — "how many people does a cake feed?" | `/cakes` + `/order` | ✅ | ✅ | ✅ 6″=6–8, 8″=12–14, 10″=20–22, 12″=25–30, 14″=40–45, 16″=50–55 | — (this is canon) |
| Serving sizes (secondary) | `/blog/cake-serving-size-guide-sydney` | ✅ | ✅ 5 Q | ✅ table under H2 #1 | **Directly contradicts canon** — 6″=8–12, 8″=15–20, 10″=25–35 |
| **Dietary / ingredient** — eggless vs vegan, Jain, halal, allergy, gluten, diabetic | `/blog/vegan-vs-eggless-cakes-difference`, `/eggless-cake-ingredients-sydney`, `/eggless-cake-for-egg-allergy`, `/halal-friendly-cakes-eggless-sydney`, `/eggless-cake-gluten-free-sydney`, `/eggless-cake-for-diabetics-sydney`, `/natural-ingredients-eggless-cakes`, `/eggless-cake-ingredient-labels-sydney` | ✅ all | ✅ 5 Q each | ✅ | **Strongest cluster on the site.** No structural gap. |
| Dietary (on money pages) | `/cakes` FAQ ("Are Num Num's cakes suitable for Jain diets?", 121 words) + `/about` H2 "What 100% Eggless Actually Means for Your Family" | ✅ / ❌ | ✅ / ❌ | ✅ / ✅ | `/about` answers it well in prose but has **no** FAQ block and **no** `FAQPage` schema |
| **"Why" questions** — why 100% eggless, why no delivery, why is my quote higher | `/blog/why-we-chose-100-percent-eggless-bakery`, `/cakes` FAQ ("Does Num Num's deliver?" 131 words), `/` FAQ ("Why is my quote higher…" 62 words), `/` "The Problem" section | ✅ | ✅ | ✅ | Well covered. The "why no delivery" answer is a genuinely good citable passage. |
| **Locations / hours** | `/locations` | ❌ none | ❌ none (has `BakeryOrCafe` + `BreadcrumbList`) | ✅ address, hours, phone stated immediately | No FAQ. Common local questions ("do you have parking?", "which store opens earliest?", "can I collect from either store?") unanswered in Q&A form |
| **Indian sweets** — pricing, ordering, dietary | `/indian-sweet` | ❌ none | ❌ none (has `ItemList` + `BreadcrumbList`) | ⚠️ prices present, but no question is asked or answered | **528 words** — thinnest page on the site, and it owns ~half the product line. Zero question-shaped headings except "Ready to place an order?" |
| Indian sweets (secondary) | `/blog/indian-sweets-harris-park-riverstone-sydney` | ✅ | ✅ | ✅ | 2,063 words with an FAQ — the blog post again carries what the money page lacks |
| **Storage / freshness** | `/blog/eggless-cake-storage-freshness-guide` | ✅ | ✅ 5 Q | ✅ | — |
| **Delivery / pickup** | `/blog/eggless-cake-delivery-sydney`, `/blog/cake-delivery-areas-sydney`, `/cakes` FAQ | ✅ | ✅ | ✅ | — |

### Aggregate counts (record these; they are the diffable numbers)

| Metric | 2026-09-02 value |
|---|---|
| Top-level pages with visible FAQ | **2 / 7** (`index`, `cakes`) |
| Top-level pages with `FAQPage` JSON-LD | **2 / 7** (`index`, `cakes`) |
| Blog files with `FAQPage` JSON-LD | **233 / 234** (all but `blog/index.html`) |
| Blog files with visible "Frequently Asked Questions" heading | **232 / 234** |
| Invalid / unparseable JSON-LD blocks across top-level pages | **0** |
| Blog posts | **233** |
| Sitemap `<loc>` entries | **240** |
| `llms.txt` blog links | **233** (was 17/79 in June — gap closed) |
| Pages carrying Wikidata `sameAs` | **241 / 241** |

---

## 5. Citable-passage baseline

The report's criterion: AI summaries "select sources based on clear, direct answers to user
questions". Pass = the page contains a **self-contained passage** that answers its own core question
without needing the rest of the page, present in the raw HTTP response.

| # | Page | Core question | Verdict | One-line reason |
|---|---|---|---|---|
| 1 | `/cakes` | What eggless cakes, at what size and price? | **PASS** | Full table in server HTML: 6″ $39.99 / 6–8 guests → 16″ $134.99 / 50–55, plus named surcharges ("Photo print +$20 · Rasmalai +$10–$45 · Ferrero Rocher +$5–$35") — the single most citable block on the site. |
| 2 | `/` | Where can I get a 100% eggless custom cake in Sydney? | **PASS** | "Send us a photo, we recreate it 100% eggless, fresh in 48 hours" + 6 schema'd FAQ answers of 20–62 words each. |
| 3 | `/blog/cake-price-guide-sydney` | How much does a custom cake cost in Sydney? | **PASS (with a caveat)** | Leads with "budget roughly $3-$6 per serve"; but its "$60-$80 starting" figure contradicts `/cakes`. Citable, and currently cited — see §6 — but citing a number the business's own price table disagrees with. |
| 4 | `/blog/cake-serving-size-guide-sydney` | How many people does each cake size feed? | **FAIL** | The passage is clean and self-contained, but it is *wrong relative to the business's own chart* (8″ = 15–20 here, 12–14 on `/cakes`). A confidently-worded, well-structured, contradictory answer is worse than none. |
| 5 | `/blog/how-to-order-cake-sydney` | How do I order a custom eggless cake? | **PASS (with a caveat)** | 5-step process stated immediately under H2 #1. Caveat: the flavour list in it ("Saffron Pistachio, Rose Cardamom, Coconut Pandan, Taro, Lemon Zest, Mango Passion") is **not the real menu**. |
| 6 | `/blog/vegan-vs-eggless-cakes-difference` | What's the difference, and which do I need? | **PASS** | "The Short Answer" block plus a side-by-side comparison table. Best-constructed citable passage on the site; already being paraphrased near-verbatim (§6). |
| 7 | `/blog/eggless-cake-ingredients-sydney` | What's actually in an eggless cake? | **PASS** | Opens with the three functions of egg and the actual substitution used, in one self-contained paragraph. |
| 8 | `/blog/why-we-chose-100-percent-eggless-bakery` | Why is this bakery 100% eggless? | **PASS** | "Every cake in the shop … is made without eggs. That's not an accommodation. It's the whole point." — direct, quotable, unique to this business. |
| 9 | `/order` | How do I place an order? | **FAIL** | The page *is* a form. There is no prose passage stating the process; the address of the answer is a `<select>` and a date picker. Nothing here is extractable as an answer. |
| 10 | `/indian-sweet` | What Indian sweets, at what price, and how do I order them? | **FAIL** | 528 words. Prices are in cards ("$39.99 / kg"), never in a sentence. No question is posed or answered. No FAQ, no `FAQPage`. |
| 11 | `/locations` | Where are the stores and when are they open? | **PASS** | Both addresses, both sets of hours, phone, and a distinguishing line each ("open latest of our two stores, daily till 10pm" / "doors open from 6am") in server HTML. |
| 12 | `/about` | Who are they and what does 100% eggless mean? | **PASS (prose only)** | Strong self-contained answer under "What 100% Eggless Actually Means for Your Family", but carried entirely in prose — no FAQ block, no `FAQPage`. |

**Baseline: 8 PASS / 3 FAIL / 1 PASS-prose-only of 12 assessed** (the brief asked for 10; two extra
included because `/about` and `/locations` are commercially load-bearing).

---

## 6. Third-party sources observed for core queries

The report advises: "check which sources AI Mode cites for those questions … then improve the
business's presence across those sources."

**Method — read this before using the table.** Four `WebSearch` queries were run. This is a web
search tool that returns ranked results *and* generates a summary from them. It is **not** ChatGPT,
Perplexity, Google AI Overviews, or Google AI Mode, and it is US-region. I did not query those
platforms. What follows is a **proxy** baseline: which sources exist and rank for these questions,
plus a directly observed instance of an AI layer paraphrasing this site.

### Sources appearing for core queries

| Query run | Sources returned (non-NumNums) | NumNums presence |
|---|---|---|
| `eggless cake Sydney` | loomas.com.au · eatwithsimer.com.au · zestpatisserie.com.au · thegreenbakery.com.au · giftdeliverysydney.com · facebook.com/namsegglessbakes · tribuneindia.com | 2 results, both **blog posts** (`best-eggless-cake-shops-sydney-2026`, `eggless-cake-bakery-harris-park-riverstone-sydney`) — **not** `/` or `/cakes` |
| `eggless cake Harris Park Parramatta bakery` | **ubereats.com/au** (NumNums store listing) · singh.com.au | 5 results, **all suburb blog posts** (`eggless-cakes-dundas`, `-northmead`, `-homebush`, `-dundas-valley`, `-mays-hill`) |
| `how much does a custom cake cost Sydney per serve 2026` | weddingnsw.com.au · bakingpleasures.com.au · blowthecandle.com.au · wedadvisor.com · bakefinder.com.au · cakedbycarissa.com | `/blog/cake-price-guide-sydney` returned **first** |
| `difference between eggless and vegan cake Jain friendly` | bakingo.com · **quora.com** · winni.in · gurgaonbakers.com · bakersoven.in · askthepantry.co.uk · ksbakers.com | `/blog/vegan-vs-eggless-cakes-difference` returned |
| `best eggless cake shops Sydney reviews directory` | eatwithsimer.com.au · blowthecandle.com.au · loomas.com.au · zestpatisserie.com.au | `/blog/best-eggless-cake-shops-sydney-2026` returned **first** |

### Directly observed: AI summarisation of NumNums content

Two of the generated summaries reproduced site copy near-verbatim. Both strings were then confirmed
present in the repo files by grep:

1. From the pricing query, the summary asserted *"simple single-tier designs start near $60-$80"* —
   verbatim from `blog/cake-price-guide-sydney.html`.
2. From the dietary query, the summary asserted *"eggless means no eggs but dairy remains — butter,
   milk, yoghurt, cream are still present"* and *"eggless (not vegan) is the correct match for most
   South Asian vegetarian and Jain households"* — both verbatim from
   `blog/vegan-vs-eggless-cakes-difference.html`.

**This is the most important line in the baseline.** The answer-first FAQ structure the report
recommends is already producing machine-quotable output, and a machine is already quoting it. It
also means item #1 above is an AI layer confidently repeating a price figure the business's own
`/cakes` table contradicts.

### Competitor / directory baseline to improve presence on

| Type | Observed | Comparable signal, where visible |
|---|---|---|
| Direct competitor | eatwithsimer.com.au | 4.9/5 from 335 reviews |
| Direct competitor | loomas.com.au | "10,000+ reviews" |
| Direct competitor | zestpatisserie.com.au, blowthecandle.com.au, thegreenbakery.com.au, Bakealicious By Gabriela, Nam's Eggless Bakes | — |
| Marketplace / directory | **ubereats.com/au** — NumNums store page ranks for the Harris Park query | Already present |
| Directory | giftdeliverysydney.com | Not present |
| UGC / Q&A | **quora.com** — ranks for the eggless-vs-vegan question | No NumNums presence |
| Social | facebook.com (competitor page ranks organically) | NumNums FB in `sameAs` |
| Absent from all queries | Reddit, YouTube, TrueLocal, Yelp AU, Zomato AU, Wedding directories | No NumNums presence |

NumNums' own review claim on-site: **4.6★, 50+ Google reviews** (`aggregateRating` on `/` and
`/locations`; `reviewCount: 50`). Consistent everywhere on-site — no contradictions found. Against
competitors showing 335 and 10,000+ reviews, review volume is the weakest comparable signal
observed. **I could not verify the live GBP figure.**

---

## 7. Prioritised findings

### P1 — Contradictory serving-size answers across 29 blog posts vs. the site's own chart

- **Finding.** A regex sweep of all 233 posts for `N-inch round … serves X–Y` found **55 statements
  across 29 files** that disagree with the canonical table on `/cakes`, `/order` and `llms.txt`.
  Worst offenders: `cake-serving-size-guide-sydney` (8″=15–20 vs. canon 12–14), `eggless-cake-sydney`
  (8″=16–24), `eggless-cakes-baby-shower-sydney` (8″=**30–40**), `eggless-cakes-dundas-valley`
  (8″=16–20). Twelve separate posts say 6″ feeds 8–12 or 10–12 where canon says 6–8.
- **Why it matters.** The report names serving sizes as one of the four high-value question types,
  and §5 states AI summaries "select sources based on **clear, direct answers** to user questions".
  A source that answers the same question six different ways is not a clear, direct answer — and the
  contradiction is between a *blog post* and the *page that takes the money*. §6 of the report also
  warns against "neglecting existing pages in favour of constant new content"; this is exactly that
  debt.
- **Exact fix.** Treat the `/cakes` table as canon. Sweep and rewrite the 55 statements in the 29
  files to match 6″=6–8, 8″=12–14, 10″=20–22, 12″=25–30, 14″=40–45, 16″=50–55. Rewrite
  `cake-serving-size-guide-sydney` to *explain* the canonical numbers (and, if the wider ranges are
  defensible as "coffee slice vs. party slice", say so explicitly and reconcile to the chart rather
  than replacing it). Re-run the detector afterward until it returns 0.
- **Effort.** ~3–4 h (29 files, mechanical, scriptable detection + manual copy edit).
- **Support.** **Report-supported** (§5 "clear, direct answers"; §6 "neglecting existing pages").

### P2 — `/order` and `/indian-sweet` answer nothing; the blog answers for them

- **Finding.** `/order` (714 words) and `/indian-sweet` (528 words) have **no visible FAQ, no
  `FAQPage` schema, and no question-shaped headings**. Both are pure UI/catalogue. `/order` is the
  ordering page and contains no statement of the ordering process; `/indian-sweet` covers roughly half
  the product line and never states a price in a sentence. In both cases a blog post carries the
  answer instead (`how-to-order-cake-sydney`, `indian-sweets-harris-park-riverstone-sydney`) — and
  §6's search results confirm the blog, not the money pages, is what surfaces.
- **Why it matters.** The report's explicit priority for this business: *"investing more in clearly
  structured FAQ and informational pages that answer real customer questions … is more likely to move
  the needle for AI citations"*, and §5 names "clear headings and FAQ-style subsections" as a core
  tactic. These are the two commercial pages with zero of that.
- **Exact fix.** Add a visible FAQ block + `FAQPage` JSON-LD to both, using the existing `<details>`
  pattern already proven on `/cakes` and `/index` (6 questions, 100–130-word answers — that length
  band is what `/cakes` already uses and it is the site's strongest citable block). Suggested
  questions, from real customer language already documented in the GBP rules and existing FAQs:
  - `/order`: how do I order · what do I send you · how much notice · can you copy a photo · can I
    pay a deposit · which store do I collect from.
  - `/indian-sweet`: are the sweets eggless · how are they priced (per kg vs per piece) · how much
    notice for a bulk/festival order · can I mix a box · how long do they keep · which store stocks what.
  Also add one plain-prose answer paragraph above the form on `/order` — the process in sentences, so
  there is something extractable.
- **Effort.** ~2–3 h for both.
- **Support.** **Report-supported** (§5 and the report's stated priority sentence).

### P3 — Off-menu flavour names in 5 blog posts

- **Finding.** `how-to-order-cake-sydney`, `eggless-cakes-eid-ul-adha-sydney` and 3 others list
  flavours that do not exist on the menu — "Saffron Pistachio", "Rose Cardamom", "Coconut Pandan",
  "Taro", "Lemon Zest", "Mango Passion", "Vanilla Bean", "Salted Caramel". The real 15 (per
  `/cakes` and `/order`) are Vanilla, Chocolate, Red Velvet, Butterscotch, Black Forest, White
  Forest, Strawberry, Mango, Cookies & Cream, Lychee, Pineapple, Tiramisu, Blueberry, Rasmalai,
  Ferrero Rocher. One §6 search summary already repeated a partly-wrong flavour list back.
- **Why it matters.** Same mechanism as P1. The report's §5 criteria are clear answers + local
  authority; publishing a product list the shop cannot fulfil damages both, and is a live customer
  service problem the moment an AI assistant reads it aloud to someone.
- **Exact fix.** Replace every off-menu flavour name in those 5 files with the real 15. Detection:
  `grep -rlE 'Saffron Pistachio|Rose Cardamom|Coconut Pandan|Salted Caramel|Vanilla Bean|Lemon Zest|Mango Passion' blog/*.html` → must return 0.
- **Effort.** ~45 min.
- **Support.** **Report-supported** (§5 "clear, direct answers"; §6 pitfall "ignoring actual customer
  language … content that targets artificial keyword combinations").

### P4 — Price contradiction between `/blog/cake-price-guide-sydney` and `/cakes`

- **Finding.** The guide says "simple single-tier designs start near $60-$80"; `/cakes` sells a 6″ at
  **$39.99**. The guide currently ranks first for the pricing query **and** §6 recorded an AI summary
  repeating the $60-$80 figure.
- **Why it matters.** The report names pricing as a high-value question type. This is the one case
  where a demonstrably-cited passage is citing a number that undercuts the business's own price list.
- **Exact fix.** Add an explicit reconciling paragraph near the top of the guide: Sydney market range
  ($3-$6/serve, $60-$80 typical single-tier) **vs.** Num Num's own pricing ($39.99 for a 6″, table
  linked). Keeping the market range is fine and is what makes the post citable — it just has to be
  labelled as market context, not as this bakery's price.
- **Effort.** ~30 min.
- **Support.** **Report-supported** (§5; §2 "ensure that unique factual content … is woven into the
  survivor where commercially relevant").

### P5 — No FAQ on `/locations` or `/about`

- **Finding.** Both answer their core question well in prose (verified) but neither has a Q&A block
  or `FAQPage` schema. `/locations` is the natural home for the local questions AI assistants field
  most: parking, which store opens earliest, collect-from-either-store, nearest station.
- **Why it matters.** §5: "structuring content with clear headings and FAQ-style subsections" and
  "strong local authority signals". `/locations` already carries `BakeryOrCafe` + `GeoCoordinates`;
  the FAQ is the missing half.
- **Exact fix.** 4–6 questions each, same `<details>` + `FAQPage` pattern. On `/locations`, prefer
  questions that differentiate the two stores (Harris Park till 10pm; Riverstone from 6am) — that's
  a genuinely unique, quotable local fact.
- **Effort.** ~1.5 h.
- **Support.** **Report-supported** (§5).

### P6 — Review volume is the weakest comparable signal; GBP state unverified

- **Finding.** Site claims 4.6★ / 50+ Google reviews (consistent across schema and copy). Observed
  competitors show 4.9/5 from 335 reviews and "10,000+ reviews". I could not verify the live GBP.
- **Why it matters.** The report's §5 names "strong local authority signals (GBP completeness,
  reviews, citations)" as one of three selection criteria, and its priority sentence names "robust
  GBP optimisation and review collection" alongside FAQ content.
- **Exact fix.** Two parts. (a) Verify: pull live GBP completeness + review count for both locations
  and record them here — this baseline has a hole where that number should be. (b) Act: the site
  already ships a `/review` form (`reviews-app/` → `netlify/functions/submit-review.js`); route
  post-pickup customers to it. Set a review-count target and re-measure at each checkpoint.
- **Effort.** (a) ~30 min once GBP access is available. (b) ongoing.
- **Support.** **Report-supported** (§5, §6, and the report's priority sentence).

### P7 — Suburb blog posts, not money pages, are what surface for local queries

- **Finding.** For `eggless cake Harris Park Parramatta bakery`, **all five** NumNums results were
  suburb blog posts (`eggless-cakes-dundas`, `-northmead`, `-homebush`, `-dundas-valley`,
  `-mays-hill`). `/locations` and `/cakes` did not appear. For `eggless cake Sydney`, both NumNums
  results were blog posts; `/` did not appear.
- **Why it matters.** The report (§3) warns these thin suburb pages carry doorway risk, while
  recommending "one dedicated page per physical location" as the architecture. Right now the
  doorway-risk pages are the ones doing the local visibility work, and the location page is invisible
  for its own query. That is a structural risk, not a win — if those posts are ever pruned or
  demoted, local visibility goes with them.
- **Exact fix.** Do **not** prune further yet. Strengthen `/locations` first (P5 FAQ, plus the
  "serving nearby suburbs" section the report §3 endorses), confirm it starts surfacing, and only
  then reassess the suburb corpus. Measure at each checkpoint which URL type ranks.
- **Effort.** Folded into P5 + measurement.
- **Support.** **Report-supported** for the architecture (§3 hybrid: location pages + limited
  service-area pages). The specific sequencing ("strengthen before pruning") is an
  **Implementation inference** — the report does not prescribe an order of operations.

### P8 — Do NOT prioritise `llms.txt` work

- **Finding.** `llms.txt` now lists all 233 posts (it listed 17 of 79 in June — that gap closed).
  `ACTION-PLAN.md` item #8 ("Expand llms.txt") is complete and should be **closed, not extended**.
- **Why it matters.** The report is explicit: *"files such as `llms.txt` are currently not recognized
  by Google as ranking signals"* and *"optional discovery aids rather than core levers"*, and states
  FAQ/informational content + GBP + reviews move the needle more. Keep `llms.txt` in the publish
  checklist as hygiene; do not spend a work item on it.
- **Effort.** Zero — this is a de-prioritisation.
- **Support.** **Report-supported** (§5, Implications).

### Resolved since the 2026-06-05 baseline (do not re-open)

| Item | June state | 2026-09-02 state |
|---|---|---|
| `ACTION-PLAN` #2/#6 — browser-side Babel/JSX on homepage | Open, hero invisible to non-JS crawlers | **Resolved** — 0 `text/babel`, 0 `react` on all 6 live URLs tested |
| `GEO-ANALYSIS` §4 — `/indian-sweet` had zero JSON-LD | Open | **Resolved** — `ItemList` + `BreadcrumbList` present |
| `GEO-ANALYSIS` §2 — `llms.txt` listed 17/79 posts | Open | **Resolved** — 233/233 |
| `GEO-ANALYSIS` §5 — no Wikidata entity | Open | **Resolved** — `wikidata.org` `sameAs` on all 241 pages |

---

## 8. Metrics to re-check at the 4–6 week and 8–12 week checkpoints

Re-runnable from the repo root. Record the number, not a narrative.

### Technical (must stay at baseline — these are regression guards)

```bash
# 1. AI crawler access — expect the same 8 Allow blocks, zero Disallow
curl -s https://numnumsbakery.com.au/robots.txt

# 2. Server-rendering — expect 0 for every page (baseline: 0/0/0/0/0/0)
for p in "" cakes order indian-sweet locations blog/cake-price-guide-sydney; do
  echo -n "$p: "; curl -s "https://numnumsbakery.com.au/$p" | grep -c 'text/babel'
done

# 3. No noindex header leaked onto content — expect empty (baseline: empty)
curl -sI https://numnumsbakery.com.au/ | grep -i x-robots-tag
```

### Content structure (these are the numbers that should move)

```bash
# 4. Top-level pages with FAQPage JSON-LD   — baseline 2/7, target 6/7 (P2+P5)
grep -l FAQPage *.html | wc -l

# 5. Top-level pages with a visible <details> FAQ — baseline 2/7
grep -lc '<details' *.html | wc -l

# 6. /order and /indian-sweet word counts — baseline 714 and 528
#    (target: both above ~1,100 with an FAQ block)

# 7. Blog FAQPage coverage — baseline 233/234, must not regress
grep -l FAQPage blog/*.html | wc -l
```

### Fact consistency (baseline is bad; these must go to zero)

```bash
# 8. Serving-size contradictions — baseline: 55 statements across 29 files. TARGET 0.
python3 - <<'EOF'
import re,glob
canon={6:(6,8),8:(12,14),10:(20,22),12:(25,30),14:(40,45),16:(50,55)}
pat=re.compile(r'(\d{1,2})-inch round[^.<]{0,60}?serves?\s+(?:roughly |approximately |about )?(\d{1,2})[–\-—](\d{1,2})',re.I)
bad=set(); n=0
for f in sorted(glob.glob('blog/*.html')):
    h=open(f,encoding='utf-8',errors='ignore').read()
    for m in pat.finditer(h):
        s,lo,hi=int(m.group(1)),int(m.group(2)),int(m.group(3))
        if s in canon and (lo,hi)!=canon[s]: bad.add(f); n+=1
print(f"{n} conflicting statements across {len(bad)} files")
EOF

# 9. Off-menu flavour names — baseline: 5 files. TARGET 0.
grep -rlE 'Saffron Pistachio|Rose Cardamom|Coconut Pandan|Salted Caramel|Vanilla Bean|Lemon Zest|Mango Passion' blog/*.html | wc -l

# 10. Price-claim consistency — /cakes must remain canon
grep -ohE 'from \$[0-9]+' blog/*.html *.html | sort | uniq -c   # baseline: $65 ×10, $60 ×3, $34 ×3, $33 ×4, $500, $130, $15
```

### Corpus (context for the above)

```bash
ls -1 blog/*.html | grep -v index | wc -l      # baseline 233
grep -c '<loc>' sitemap.xml                     # baseline 240
grep -c '/blog/' llms.txt                       # baseline 233
```

### Off-site / observational (record, don't automate)

| Metric | 2026-09-02 baseline | How to re-check |
|---|---|---|
| Google review count, Harris Park | **unverified** (site claims 50+ combined, 4.6★) | GBP dashboard |
| Google review count, Riverstone | **unverified** | GBP dashboard |
| GBP completeness (hours, attributes, products, photos, Q&A) both stores | **unverified** | GBP dashboard |
| Does `/locations` surface for `eggless cake Harris Park`? | **No** — 5 suburb blog posts surfaced instead | Re-run the same query |
| Does `/` or `/cakes` surface for `eggless cake Sydney`? | **No** — 2 blog posts surfaced instead | Re-run the same query |
| Does `/blog/cake-price-guide-sydney` still rank first for the pricing query? | **Yes** | Re-run |
| Is site copy being paraphrased by an AI summary layer? | **Yes** — 2 of 4 queries reproduced site strings near-verbatim (both blog posts, neither a money page) | Re-run, note *which* URLs get paraphrased |
| Third-party surfaces carrying NumNums | Uber Eats AU store listing; Facebook; Instagram (`sameAs`) | Re-run + manual |
| Third-party surfaces where NumNums is absent | Reddit, Quora, YouTube, TrueLocal, Yelp AU, Zomato AU, wedding directories | Re-run |
| Competitor review benchmarks | eatwithsimer 4.9/5 (335); loomas "10,000+" | Re-run |

**Re-check caveat for whoever runs this next:** the search tool used here is US-region and is not
ChatGPT / Perplexity / AI Overviews. To compare like with like, re-run the *same five queries* with
the *same tool*. If you gain access to the actual AI platforms, start a separate baseline rather than
diffing against this one.
