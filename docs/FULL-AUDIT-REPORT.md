# Full SEO Audit — Num Num's Bakery

**Site:** https://numnumsbakery.com.au/
**Date:** 2026-06-05
**Pages analyzed:** 86 (7 main + 79 blog) — source verified + live-fetched
**Business type:** Local Service — multi-location brick-and-mortar bakery (Harris Park + Riverstone, Sydney NSW). Hybrid retail + custom-order.
**Prior audits:** 2026-05-23 scored 66/100; 2026-05-30 plan targeted 88–90. **This run: 88/100 — target reached.**

---

## Executive Summary

### Overall SEO Health Score: **88 / 100** — Strong

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 90 | 19.8 |
| Content Quality | 23% | 85 | 19.6 |
| On-Page SEO | 20% | 95 | 19.0 |
| Schema / Structured Data | 10% | 88 | 8.8 |
| Performance (CWV) | 10% | 72 | 7.2 |
| AI Search Readiness | 10% | 82 | 8.2 |
| Images | 5% | 100 | 5.0 |
| **Total** | | | **87.6 ≈ 88** |

This is a well-built, deliberately SEO-optimized site. On-page hygiene is near-perfect: **every one of 86 pages has exactly one H1, a unique title, meta description, canonical, Open Graph tags, and 100% image alt-text coverage.** Security headers, HTTPS/www redirects, sitemap, robots.txt, llms.txt, hreflang, and rich LocalBusiness schema are all in place. The score is held back primarily by **client-side JS rendering on key landing pages** (performance + AI-crawler risk) and a **cluster of 23 near-duplicate suburb pages** (helpful-content risk).

### Top 5 Critical / High Issues
1. **[High] 23 suburb pages are ~81% identical** (only the place name swapped) — doorway/near-duplicate content risk under Google's helpful-content & spam policies.
2. **[High] Homepage hero renders via in-browser Babel + JSX** — render-blocking transpilation delays LCP and is invisible to non-JS AI crawlers (GPTBot/ClaudeBot/PerplexityBot).
3. **[Medium] `indian-sweet` page has no structured data** — the only main page missing JSON-LD (no Product/Bakery schema).
4. **[Medium] `.html` URLs return 200, not 301** — every page is reachable at both `/about` and `/about.html` (duplicate URLs; canonical-mitigated but not clean).
5. **[Medium] ~28 title tags exceed 60 characters** — will truncate in SERPs, weakening CTR on the longest (up to 83 chars).

### Top 5 Quick Wins
1. Add LocalBusiness/Product JSON-LD to `indian-sweet.html` (1 page, copy pattern from `index.html`).
2. Trim the ~8 worst title tags to ≤60 chars (front-load the keyword).
3. Change `.html → clean-URL` from 200 to **301 redirect** in `netlify.toml`/`_redirects`.
4. Update sitemap.xml + llms.txt: use `/blog/` (trailing slash) instead of `/blog` to drop a redirect hop.
5. Differentiate suburb pages with genuinely local content (delivery times, nearest store, local landmarks/schools) — or consolidate the weakest into hub pages.

---

## Technical SEO — 90/100

**Strengths (verified live):**
- HTTPS enforced; `http://` → 301 → HTTPS; `www` → 301 → non-www. Clean.
- **Security headers excellent:** HSTS (preload), CSP (correctly allowlists unpkg/GTM), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- Custom **404 returns proper 404 status**.
- `robots.txt` allows all + explicitly welcomes GPTBot, ClaudeBot, PerplexityBot, CCBot, OAI-SearchBot, anthropic-ai. Sitemap declared.
- `sitemap.xml`: 85 URLs, all map to real pages, all have `<lastmod>`, privacy-policy correctly excluded. No orphan/missing entries.
- Blog posts are **fully server-rendered static HTML** (33 `<p>` tags, no JS dependency) — the SEO money pages are clean.

**Issues:**
- **`.html` duplicates (Medium):** `/about.html` serves HTTP 200 (not 301 to `/about`). Canonical tag points to the clean URL so index bloat is mitigated, but Google still crawls both forms. Convert to 301.
- **`/blog` → `/blog/` redirect hop (Low):** sitemap.xml and llms.txt reference `/blog` (no slash), which 301s to `/blog/`. Reference the final URL directly.
- **Mixed JS rendering (High — see Performance/AI):** homepage and some interactive sections render via React UMD + `@babel/standalone` in the browser.

---

## Content Quality — 85/100

**Strengths:**
- **No thin content** — every blog post ≥600 words; main pages 2,100–5,745 words.
- Strong topical authority for "eggless cakes Sydney": flavours, occasions, dietary (Jain/halal/egg-allergy), how-to-order, comparisons (vegan vs eggless, eggless vs regular).
- Clear E-E-A-T signals: real locations, NAP, founding year (2019), 4.6★ rating, two physical stores, author/Person schema in reviews.

**Issues:**
- **23 suburb landing pages ~81% duplicate (High).** Measured: after removing the suburb name, Parramatta vs Westmead share 1,230 / 1,510 vocabulary tokens (81%). Titles/H1s follow a single template ("Eggless Cakes Near [Suburb]"). This is the classic doorway-page pattern Google demotes. **Recommendation:** inject per-suburb specifics (drive time to nearest store, delivery/pickup notes, named local landmarks, suburb-specific testimonials), or consolidate low-value suburbs into a single "North-West Sydney" / "Parramatta region" hub with anchored sections.

---

## On-Page SEO — 95/100

**Near-perfect across all 86 pages:**
- 1 H1 per page (100%), 1 meta description per page (100%), canonical per page (100%), OG tags per page (100%).
- Heading hierarchy logical (H1 → H2 → H3).

**Issues:**
- **~28 titles > 60 chars (Medium).** Worst offenders (will truncate):
  - 83 — "Best Eggless Cakes Near Me Sydney | Flavours, Designs & Ordering | Num Num's Bakery"
  - 83 — "Eggless Cakes for Mother's Day in Sydney: A Gift She'll Remember | Num Num's Bakery"
  - 79 — "Eggless Cakes in Northwest Sydney | Schofields, The Ponds, Box Hill & Tallawong"
  - 77 — "Cakes Near Me Sydney | Custom Birthday & Celebration Cakes | Num Num's Bakery"
  - 77 — "Eggless Cakes Near Box Hill Sydney | Order from Riverstone | Num Num's Bakery"
  - 77 — "Halal-Friendly Cakes: Why Eggless Is a Great Choice | Num Num's Bakery Sydney"
  - 74 — "Birthday Cake Near Me in Sydney: Which Suburbs We Serve | Num Num's Bakery"
  - Target ≤ 60 chars; drop or shorten the "| Num Num's Bakery" suffix where the title is long.

---

## Schema / Structured Data — 88/100

**Strengths (homepage):** rich, valid graph — `BakeryOrCafe` ×2 (both stores) with PostalAddress, GeoCoordinates, OpeningHoursSpecification; `Organization`; `WebSite` + `SearchAction`; `AggregateRating`; 9× `Review`/`Rating` with `Person` authors; `ImageObject`. Recent commit fixed Review nodes to top-level @graph with itemReviewed — good.

**Issues:**
- **`indian-sweet.html` = 0 JSON-LD (Medium).** Only main page with no schema (confirmed live). Add `BakeryOrCafe`/`Product`/`ItemList` for the sweets range.
- Blog posts carry schema (most 1 block; `how-to-order` and `why-we-chose` have 3). Verify all use `Article`/`BlogPosting` + `BreadcrumbList`; consider `FAQPage` where Q&A content exists.

---

## Performance (CWV) — 72/100

- HTML download is fast (130 KB, ~0.06s TTFB live). Fonts use `display=swap` + preconnect. GA4 loaded `async`.
- **Render-blocking JS (High):** production homepage ships `@babel/standalone` and transpiles JSX **in the browser at runtime** before the hero paints. React + ReactDOM + Babel + Lenis all from unpkg. This directly inflates **LCP** and main-thread work (INP risk on mobile).
  - **Fix:** pre-compile JSX at build time (or convert the few interactive widgets to vanilla JS). Ship zero Babel to the browser. This is the single biggest performance lever.
- Tailwind CDN is **not** used in production (verified 0 occurrences live) — good, despite CLAUDE.md noting it for dev.

> No CrUX field data was pulled in this run (no Google API configured). Recommend confirming LCP/INP in PageSpeed Insights after removing browser-side Babel.

---

## Images — 100/100

- **100% alt-text coverage** across all sampled pages (index 7/7, cakes 29/29, about 3/3, locations 2/2, order 2/2, indian-sweet 2/2, blog posts 2/2). No empty `alt=""` on content images.
- Recommendation (Low): confirm WebP/AVIF + width/height attributes to lock CLS; add `loading="lazy"` below the fold.

---

## AI Search Readiness (GEO) — 82/100

**Strengths:** `llms.txt` is well-structured (summary, locations, NAP, page list, license `rsl.ai/1.0/allow-search-only`). robots.txt explicitly allows all major AI crawlers. Blog posts are static HTML → fully citable by non-JS crawlers.

**Issues:**
- **Homepage + blog cards are partly JS-rendered (Medium).** GPTBot/ClaudeBot/PerplexityBot generally **don't execute JS**, so they see an incomplete homepage. Since blog *posts* are static this is partially covered, but the homepage's value props/reviews may be invisible to AI crawlers. Server-render the hero and key content.
- `llms.txt` lists only ~17 of 79 blog posts — expand to the full set so AI crawlers discover the long tail.

---

## Methodology
Live HTTP/header/redirect/render checks via curl + WebFetch against production; full static analysis of all 86 source HTML files (H1/title/meta/canonical/OG/JSON-LD/alt counts, word counts, suburb-page vocabulary diffing); sitemap-vs-disk consistency reconciliation. No DataForSEO/CrUX APIs were available this run — field CWV and SERP-position data not included.
