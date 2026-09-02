# GEO Analysis — Num Num's Bakery

**Site:** https://numnumsbakery.com.au
**Analyzed:** 2026-06-05
**Scope:** AI Overviews · ChatGPT · Perplexity · Bing Copilot

---

## GEO Readiness Score: 84 / 100

This is a strong GEO foundation — well above typical local-business sites. The site is fully server-rendered, allows all major AI crawlers, ships rich schema on every page, and has an llms.txt + RSL license already in place. The main gaps are *freshness/completeness of llms.txt*, *one un-schema'd commercial page*, and *thin off-site brand-entity signals* (the single biggest lever for AI visibility per Ahrefs' 2025 study).

| Category | Weight | Score | Notes |
|----------|--------|-------|-------|
| Citability | 25% | 20/25 | FAQ + answer-first blocks strong; some passages exceed optimal 134–167 words |
| Structural Readability | 20% | 18/20 | Clean H1→H2→H3, FAQ Q&A format, tables on cakes page |
| Multi-Modal Content | 15% | 11/15 | Images + hero video present; few charts/infographics |
| Authority & Brand Signals | 20% | 12/20 | On-page author/dates good; off-site entity presence weak |
| Technical Accessibility | 20% | 19/20 | SSR, crawlers allowed, llms.txt + RSL present |

---

## Platform Breakdown

| Platform | Est. Readiness | Why |
|----------|---------------|-----|
| **Google AI Overviews** | 88/100 | Strong traditional SEO + schema + answer-first FAQ. Local intent ("eggless cake Sydney") well covered. |
| **ChatGPT** | 78/100 | Entity facts in llms.txt help; weak Wikipedia/Reddit presence caps ceiling. |
| **Perplexity** | 74/100 | Good citable passages; Perplexity leans on Reddit (46.7% of citations) where brand has no footprint. |
| **Bing Copilot** | 82/100 | Crawlable + schema-rich; would benefit from IndexNow. |

---

## 1. AI Crawler Access — PASS

All key AI crawlers are explicitly allowed in `robots.txt`:

| Crawler | Status |
|---------|--------|
| GPTBot (OpenAI) | ✅ Allow |
| OAI-SearchBot | ✅ Allow |
| ChatGPT-User | ✅ Allow |
| ClaudeBot | ✅ Allow |
| anthropic-ai | ✅ Allow |
| PerplexityBot | ✅ Allow |
| CCBot | ✅ Allow |

No AI crawler is blocked. Nothing to fix here.

---

## 2. llms.txt — PRESENT but STALE ⚠️

`/llms.txt` exists and is well-structured (entity facts, locations, NAP, pages, RSL license). **However it lists only 17 of 79 blog posts — 62 posts are missing.** AI assistants reading llms.txt get an incomplete map of your content.

**Action:** Regenerate the `## Blog Posts` section to include all current posts, or trim it to a curated "best 20" set and add a line pointing to the sitemap for the full list. Make updating llms.txt part of the blog-publish checklist (you already do this for sitemap.xml per your memory rules).

---

## 3. Server-Side Rendering — PASS

All content is static HTML in the source — headings, body copy, prices, and FAQ answers are all present without JavaScript execution. React/Babel/unpkg are loaded **only to mount the mobile nav** (decorative); no main content depends on JS. AI crawlers (which do not run JS) see the full page. This is the single most important technical GEO factor and it's done correctly.

---

## 4. Schema — STRONG, one gap

| Page | Schema | Verdict |
|------|--------|---------|
| index | Organization, WebSite+SearchAction, BakeryOrCafe ×2, Review ×9, AggregateRating | ✅ Excellent |
| about | AboutPage, Organization, BreadcrumbList | ✅ Good |
| cakes | Product ×6, Offer ×6, FAQPage, ItemList, Brand | ✅ Excellent |
| locations | BakeryOrCafe ×2, Review, GeoCoordinates, OpeningHours | ✅ Excellent |
| order | Service, City, BreadcrumbList | ✅ Good |
| **indian-sweet** | **NONE** | ❌ **Missing** |
| blog (78 posts) | Article + Person + FAQPage + BreadcrumbList | ✅ Excellent |

**Action — indian-sweet.html:** Add `Product`/`ItemList` schema (one Product per sweet: Kaju, Barfi, Peda, Milk Sweets, Gulab Jamun/Rasgulla, Laddoo) with `Offer` price + `priceCurrency: AUD`, plus a `BreadcrumbList`. The page already has clean H2s and prices — the schema just makes them machine-readable. This is the highest-ROI schema fix on the site.

---

## 5. Brand Mention / Entity Signals — WEAKEST AREA ⚠️

Per Ahrefs' Dec 2025 study (75k brands), **brand mentions correlate ~3× more strongly with AI citation than backlinks.** Current footprint:

| Signal | Status |
|--------|--------|
| Instagram (sameAs) | ✅ Present |
| Facebook (sameAs) | ✅ Present |
| Google Business Profile | ✅ (4.6★, in llms.txt) |
| YouTube | ❌ None (strongest AI-correlation signal, ~0.737) |
| Reddit | ❌ None (Perplexity's #1 source) |
| Wikipedia / Wikidata | ❌ None |
| LinkedIn | ❌ None |

This is the ceiling on your ChatGPT/Perplexity scores. You can't fix it in code, but it's the biggest lever:
- **Wikidata entity** (free, achievable now): create an item for "Num Num's Bakery" with locations, founding year, sameAs links → directly feeds ChatGPT.
- **Reddit:** organic presence in r/sydney, r/JainFood, r/vegan threads about eggless/Jain cakes.
- **YouTube:** even 3–5 short cake-decorating / store-tour videos create the highest-correlation mention signal.

---

## 6. Passage-Level Citability — GOOD

Optimal AI-citation passage length is **134–167 words** in self-contained blocks. Your blog FAQ answers and the cakes-page FAQ are ideal (direct "X is…" answers, specific facts: 48-hour notice, 6"–16" sizing, 15+ flavours, prices). Strong citable facts already on-site:

- "100% eggless — no eggs in any product, ever. Jain-friendly and fully vegetarian."
- "Cakes from 6 inch (serves 6–8) to 16 inch (serves 50–55)."
- "Minimum 48 hours notice for custom orders."
- "4.6-star Google rating."

**Minor tightening:** a few blog intro sections run long before the answer. Lead each H2 with a 40–60 word direct answer, then expand.

---

## Top 5 Highest-Impact Changes

1. **Add Product + ItemList + Breadcrumb schema to indian-sweet.html** — only un-schema'd commercial page; prices already on-page. (Code, ~30 min)
2. **Refresh llms.txt blog list** (62 posts missing) and add it to your publish checklist. (Code, ~15 min)
3. **Create a Wikidata entity** for Num Num's Bakery with sameAs links — single biggest off-site lever for ChatGPT. (Off-site, free)
4. **Build Reddit + YouTube presence** — directly raises Perplexity/ChatGPT citation odds. (Off-site, ongoing)
5. **Add IndexNow** (ping Bing/Yandex on publish) — your netlify.toml already handles redirects; IndexNow improves Copilot freshness. (Code/config)

---

## Schema Recommendations (ready to implement)

**indian-sweet.html** — add before `</head>`:
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {"@type":"Product","name":"Kaju Sweets","brand":{"@type":"Brand","name":"Num Num's Bakery"},
     "offers":{"@type":"Offer","price":"39.99","priceCurrency":"AUD","availability":"https://schema.org/InStock"}},
    {"@type":"Product","name":"Barfi","offers":{"@type":"Offer","price":"34.99","priceCurrency":"AUD"}},
    {"@type":"Product","name":"Peda","offers":{"@type":"Offer","price":"34.99","priceCurrency":"AUD"}},
    {"@type":"Product","name":"Milk Sweets","offers":{"@type":"Offer","price":"36.99","priceCurrency":"AUD"}},
    {"@type":"Product","name":"Laddoos","offers":{"@type":"Offer","price":"33.99","priceCurrency":"AUD"}}
  ]
}
```
(All eggless/vegetarian — add `"suitableForDiet":"https://schema.org/VegetarianDiet"` per product for extra AI signal.)

---

## What's Already Right (don't touch)

- ✅ Full SSR — AI crawlers see all content
- ✅ All AI crawlers allowed in robots.txt
- ✅ llms.txt + RSL 1.0 license present
- ✅ Rich schema on 6 of 7 main pages + all 78 blog posts
- ✅ FAQPage + Article + Person + dates on every blog post
- ✅ Answer-first FAQ format with quotable, specific facts
- ✅ Local entity facts (NAP, hours, ratings) well structured
