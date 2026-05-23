# SEO Full Audit Report — Num Num's Bakery
**Site:** numnumsbakery.com.au  
**Audit Date:** 2026-05-23  
**Scope:** 24 pages (6 core + blog index + 17 blog posts)  
**Business Type:** Brick-and-mortar bakery, 2 locations (Harris Park + Riverstone, Sydney NSW)

---

## Overall SEO Health Score: 66 / 100

| Category | Weight | Score | Weighted |
|----------|--------|-------|---------|
| Technical SEO | 22% | 74 | 16.3 |
| Content Quality / E-E-A-T | 23% | 68 | 15.6 |
| On-Page SEO | 20% | 62 | 12.4 |
| Schema / Structured Data | 10% | 65 | 6.5 |
| Performance (CWV) | 10% | 55 | 5.5 |
| AI Search Readiness | 10% | 72 | 7.2 |
| Images | 5% | 52 | 2.6 |
| **TOTAL** | | | **66 / 100** |

---

## Executive Summary

Num Num's Bakery has a **strong structural foundation**: static HTML on Netlify (ideal for crawlability), all 24 pages indexed, schema markup on every page, AI crawlers explicitly allowed, and llms.txt present. The brand's core differentiator (100% eggless) is consistently communicated throughout.

The score is held back by **three clusters of issues**:

1. **Performance** — React + Babel loaded on every page just for a mobile hamburger menu (~495KB, blocks the main thread 200–600ms). GTM fires synchronously in `<head>` and a duplicate GA4 tag doubles the analytics overhead.

2. **On-Page / Content quality on blog posts** — All 17 post titles exceed 60 characters, all 16 post meta descriptions exceed 160 characters. Zero visible author attribution anywhere. Zero images inside any blog post body.

3. **Schema data integrity** — `reviewCount: "50"` claimed on both locations but only 3–6 reviews embedded. `WebSite.potentialAction` uses `OrderAction` (ignored by Google, should be `SearchAction`). Riverstone's review count is almost certainly copied from Harris Park and is inflated.

### Top 5 Critical Issues
1. React + Babel (~495KB) loaded on every page for a hamburger menu
2. GTM/GA4 double-firing synchronously in `<head>`, costing 150–300ms LCP
3. `privacy-policy.html` is noindexed but listed in sitemap, AND never committed to git (404 on live site)
4. `og:image` is 518×388px — too small for social sharing (minimum 1200×630px)
5. OG site_name "Num Nums Bakery" (missing apostrophe) — NAP inconsistency across all 24 pages

### Top 5 Quick Wins
1. Fix `og:site_name` from "Num Nums Bakery" → "Num Num's Bakery" across all pages (5 min, 24 files)
2. Commit `privacy-policy.html` and remove it from sitemap.xml (2 min)
3. Add `parentOrganization` to both `BakeryOrCafe` schema entities (10 min)
4. Replace all `'Poppins'` CSS references in blog posts with `'Jost'` (5 min)
5. Remove duplicate JSON-LD blocks from `how-to-order-*.html` and `why-we-chose-*.html` (15 min)

---

## Technical SEO — Score: 74 / 100

### CRITICAL

**TECH-C1: `privacy-policy.html` is noindexed but in sitemap**  
`privacy-policy.html` has `<meta name="robots" content="noindex, follow">` but appears in `sitemap.xml` line 119. Google wastes crawl budget fetching a page it will then discard. Remove the `<url>` block for `/privacy-policy` from `sitemap.xml`.

**TECH-C2: GTM `frame-src` missing from CSP**  
`netlify.toml` line 59: `frame-src` only allows `https://interfaces.zapier.com`. GTM's iframe-based tags and GA4's collect mechanism require `https://www.googletagmanager.com` in `frame-src`. Conversion events may silently fail in strict CSP browsers.  
Fix: add `https://www.googletagmanager.com` to `frame-src` in `netlify.toml`.

### HIGH

**TECH-H1: All 17 blog post title tags exceed 60 characters**  
Worst: `eggless-cakes-mothers-day-sydney.html` at 83 chars. Google truncates at ~60 chars, cutting the brand name "| Num Num's Bakery" on virtually every blog post in SERPs. Trim all blog titles to 55–60 chars, front-loading the keyword.

**TECH-H2: All 17 blog post meta descriptions exceed 160 characters**  
Worst: `eggless-cakes-mothers-day-sydney.html` at 221 chars. Optimal range is 140–155 chars. Requires rewriting all 17 descriptions.

**TECH-H3: No 301 redirect from `/*.html` to extensionless URLs**  
No `[[redirects]]` block exists in `netlify.toml`. Both `/about.html` and `/about` resolve without a canonical 301, creating duplicate content. Add:
```toml
[[redirects]]
  from = "/*.html"
  to = "/:splat"
  status = 301
  force = true
```

**TECH-H4: No custom 404 page**  
No `404.html` exists. Crawlers hitting dead links get Netlify's generic error page with no nav or internal links. Create `/404.html` with full site navigation, a helpful heading, and links to Home, Cakes, Order, Locations, and Blog.

**TECH-H5: Keyword cannibalization — 3 posts targeting "eggless birthday cakes Sydney"**  
- `eggless-birthday-cakes-sydney.html` — "complete guide"  
- `eggless-birthday-cakes-every-age-sydney.html` — age-based guide  
- `birthday-cake-near-me-sydney-suburbs.html` — suburb targeting  
Google will suppress one or more. Designate the first as the pillar; add explicit internal links from posts 2 and 3 back to it with anchor text containing the target keyword.

**TECH-H6: 2 suburb blog posts overlap near-totally**  
`birthday-cake-near-me-sydney-suburbs.html` and `cake-shop-near-me-marsden-park-talawong.html` target largely the same suburbs (Riverstone, Marsden Park, Schofields, Box Hill, Rouse Hill). Consider consolidating into a single definitive "Suburbs We Serve" page with a 301.

### MEDIUM

**TECH-M1: No `article:published_time` / `article:modified_time` OG tags on blog posts**  
Blog posts declare `og:type = "article"` without the article namespace properties. Facebook and LinkedIn use these for content freshness. Add to each post head:
```html
<meta property="article:published_time" content="2026-04-17T00:00:00+10:00">
<meta property="article:modified_time" content="2026-05-20T00:00:00+10:00">
<meta property="article:author" content="https://numnumsbakery.com.au/about">
```

**TECH-M2: Duplicate JSON-LD blocks in 2 blog posts**  
`how-to-order-custom-eggless-cake-online.html` and `why-we-chose-100-percent-eggless-bakery.html` each have 3 `application/ld+json` script tags. A duplicate `BreadcrumbList` block will cause Google's Rich Results Test to flag these and may suppress the rich result. Remove the duplicate block from each.

**TECH-M3: 3 newer blog posts reference `'Poppins'` font but load only Jost**  
`eggless-birthday-cakes-sydney.html`, `eggless-birthday-cakes-every-age-sydney.html`, `halal-friendly-cakes-eggless-sydney.html` (and possibly others) reference `font-family: 'Poppins', sans-serif` in nav/button CSS. Poppins is not loaded. Replace all instances with `'Jost', sans-serif`.

**TECH-M4: No IndexNow implementation**  
No IndexNow key file in the project root. With an active blog, Bing discovery relies entirely on sitemap crawl scheduling. Implement IndexNow to push URLs to Bing immediately after deploys.

**TECH-M5: OG images missing `og:image:width` / `og:image:height`**  
All pages lack these tags. Add them alongside fixes to OG image dimensions (see Images section).

### LOW

**TECH-L1: Sitemap `lastmod` dates were bulk-set (now corrected)**  
Sitemap agent corrected all 24 lastmod dates to 2026-05-20 based on git history. Going forward, update only the specific pages that changed on each deploy.

**TECH-L2: No preload hint for LCP image on blog posts**  
Blog posts lack a `<link rel="preload" as="image" fetchpriority="high">` for any first-viewport image. Add when images are added to blog posts (see Images H3).

**TECH-L3: Sparse internal linking from core pages to blog**  
`order.html` has no links into the blog. `cakes.html` has only 2. Add a "Related Reading" section on both pages linking to 2–3 high-value posts.

### PASSING
- robots.txt: excellent — all AI bots explicitly allowed
- Canonicals: self-referencing on all 24 pages, consistent with `og:url` and sitemap URLs
- hreflang `en-AU` / `x-default`: correctly implemented on all pages
- Security headers: HSTS (preload), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy all set via netlify.toml
- Mobile viewport meta tag: present on every page
- All pages fully server-side rendered static HTML — ideal for crawlers
- H1 tags: one per page, all topically aligned
- Core page title tags: within 50–63 characters, keyword-rich and location-specific
- Core page meta descriptions: 131–165 characters, well-differentiated

---

## Content Quality / E-E-A-T — Score: 68 / 100

**E-E-A-T Composite: 67 / 100**
- Experience: 62/100 — First-hand narrative exists (why-we-chose post is excellent) but no visible author signals anywhere
- Expertise: 72/100 — Technically accurate, but claims without baking-science backing
- Authoritativeness: 58/100 — No press, no external citations, schema-level inconsistencies undermine trust
- Trustworthiness: 74/100 — NAP consistent, legal entity in footer, pick-up policy clear; no Privacy Policy page

### CRITICAL

**CONT-C1: Sizing system contradiction between blog and order form**  
`eggless-birthday-cakes-sydney.html` FAQ uses gram-based sizing (500g, 750g, 1kg, 1.5kg, 2kg). `order.html` uses inch-based sizing (6", 8", 10", 12", 14", 16"). A customer reading the blog then navigating to order cannot map one system to the other. An AI assistant citing both pages returns contradictory information. Standardize on inches throughout; update the birthday cakes blog size table and FAQ to use inch measurements with a serving-count column.

**CONT-C2: `reviewCount` schema inflation**  
Both BakeryOrCafe schemas claim `"reviewCount": "50"` while only 6 Review objects are embedded (Harris Park) and 3 (Riverstone). Google's QRG treats structured data accuracy as a direct trustworthiness signal. Change to `"ratingCount": "50"` and set `"reviewCount"` to match the number of actually embedded reviews.

### HIGH

**CONT-H1: Zero visible author attribution across all 17 blog posts**  
Tarun Patel is listed as `author` in JSON-LD on every post. No post has a visible byline, author photo, bio, or link to the about page. The September 2025 QRG requires visible, verifiable author information. Add a reusable author block to every blog post:
- Author name: Tarun Patel  
- One-line credential: "Founder, Num Num's Bakery — since 2019"  
- Link to `/about`
- Optional: small headshot

**CONT-H2: No Privacy Policy page committed to git (404 on live site)**  
`privacy-policy.html` exists locally but has never been committed. The site uses GA4 and GTM, which collect visitor data — Australian Privacy Act obligations and Google's ToS require a published Privacy Policy. Also, no page has a footer link to Privacy Policy. Commit the file and add the footer link.

**CONT-H3: Organization schema missing `sameAs` entity links**  
The Organization `sameAs` array in `index.html` does not link to Instagram, Facebook, or Google Business Profiles. This is the primary mechanism by which Google's Knowledge Graph verifies a business entity. Add Instagram, Facebook, and both GBP URLs to `sameAs`.

**CONT-H4: `how-to-order` blog post duplicates the order page without adding value**  
The post walks through the WhatsApp ordering steps — identical content to `order.html`. Repurpose it to cover "What information do I need to give when ordering a custom cake?" (briefing process, reference photos, colour palettes, dietary requirements) — a user question not answered elsewhere.

### MEDIUM

**CONT-M1: Seasonal posts lack specificity**  
`eggless-cakes-mothers-day-sydney.html`, `eggless-cakes-diwali-indian-festivals-sydney.html`, and `halal-friendly-cakes-eggless-sydney.html` lack: a specific product recommendation with price, a season-specific lead time callout, and at least one piece of information unique to that season.

**CONT-M2: Birthday cake age-post cannibalization**  
`eggless-birthday-cakes-every-age-sydney.html` overlaps significantly with `eggless-birthday-cakes-sydney.html` in intro paragraphs, FAQ, and CTAs. Sharpen differentiation: the guide post owns transactional intent (pricing, sizing, ordering); the age post owns inspirational/educational intent (design ideas by milestone). Remove the size table from the age post.

**CONT-M3: `vegan-vs-eggless` post avoids the key declaration**  
The post never plainly states that Num Num's cakes contain dairy and are therefore not vegan. This is the most important fact a vegan reader needs. State it clearly upfront, then explain the craft trade-off (full-fat dairy produces better crumb texture than current plant-based alternatives at this price point). Honest specificity builds trust.

**CONT-M4: `cakes.html` gallery lacks descriptive copy per category**  
No descriptive text accompanies each gallery filter tab. The page cannot rank for design-intent queries ("Elsa cake Sydney", "dinosaur eggless cake Harris Park"). Add a 50–80 word description per filter section and 1–2 sentence captions on each cake card.

### MISSING CONTENT GAPS

1. **Cake care and storage** — "how to store eggless birthday cake", "how long does eggless cake last in fridge" — post-purchase trust-building queries with near-zero competition for a local bakery
2. **Allergens / dietary information page** — single authoritative page for nut, gluten, and dairy information; currently scattered across multiple posts; legal and trust risk
3. **Corporate / bulk order page** — "bulk cake order Sydney", "office birthday cake" — higher AOV segment with no dedicated content
4. **Flavour detail pages** — 15 flavours listed on order form but no individual content; "chocolate truffle eggless cake Sydney" is an underserved mid-funnel query

---

## On-Page SEO — Score: 62 / 100

### Key Findings

**On-Page title tag performance:**
- Core pages (6): PASS — 50–63 chars, keyword-rich, location-specific
- Blog posts (17): FAIL — all exceed 60 chars; avg ~70 chars; brand suffix truncated universally

**Meta description performance:**
- Core pages (6): PASS — 131–165 chars (blog index at 165 is borderline)
- Blog posts (17): FAIL — all exceed 160 chars; avg ~185 chars

**H1 structure:** PASS — exactly one H1 per page, aligned with title intent

**`og:site_name` inconsistency — affects all 24 pages:**  
`<meta property="og:site_name" content="Num Nums Bakery">` — missing apostrophe. Every other reference uses "Num Num's Bakery". Fix with a project-wide find-replace.

**Internal linking:**  
Blog posts link back to homepage and order page but not to each other. No "Related posts" sections. Add 2–3 contextual in-body links per post and a related-posts footer section.

---

## Schema / Structured Data — Score: 65 / 100

### Schema Inventory
| Page | Types Present |
|------|---------------|
| index.html | Organization, WebSite, BakeryOrCafe ×2, AggregateRating, Review |
| locations.html | BreadcrumbList, BakeryOrCafe ×2, AggregateRating, Review |
| about.html | BreadcrumbList, AboutPage, Organization |
| cakes.html | BreadcrumbList, FAQPage, ItemList, Product ×6, Offer ×6 |
| order.html | BreadcrumbList, Service |
| blog posts | BreadcrumbList, Article, FAQPage (all 17) |
| blog/index.html | BreadcrumbList only |

### CRITICAL

**SCH-C1: `WebSite.potentialAction` uses `OrderAction` — Google ignores it**  
`index.html` line 473. `OrderAction` on `WebSite` is not a recognized rich result. Replace with `SearchAction` (for Sitelinks Searchbox) or remove. The `OrderAction` belongs on the `BakeryOrCafe` entities, not `WebSite`.

**SCH-C2: `reviewCount: "50"` with only 3–6 reviews embedded**  
See CONT-C2. Use `ratingCount: "50"` for total star ratings; set `reviewCount` to match actual embedded Review objects.

**SCH-C3: `BakeryOrCafe` entities missing `parentOrganization`**  
Neither `#harris-park` nor `#riverstone` links back to `#organization`. Google cannot establish these as branches of the same brand. Add to each BakeryOrCafe:
```json
"parentOrganization": { "@id": "https://numnumsbakery.com.au/#organization" }
```

### HIGH

**SCH-H1: Missing `contactPoint`, `paymentAccepted`, `currenciesAccepted` on BakeryOrCafe**  
Add to each location entity:
```json
"contactPoint": { "@type": "ContactPoint", "telephone": "+61425697725", "contactType": "customer service", "availableLanguage": ["English", "Hindi", "Gujarati"], "areaServed": "AU" },
"paymentAccepted": "Cash, Credit Card",
"currenciesAccepted": "AUD"
```

**SCH-H2: Missing `sameAs` on location-level BakeryOrCafe entities**  
`sameAs` (Instagram, Facebook) exists only on Organization. Each BakeryOrCafe should also include `sameAs` with the relevant social profiles and, once confirmed, each store's GBP URL.

**SCH-H3: Individual Review Rating missing `worstRating`**  
All Review entities have `ratingValue` and `bestRating` but not `worstRating`. Add `"worstRating": "1"` to each reviewRating object.

**SCH-H4: Article entities missing `@id` and `mainEntityOfPage`**  
All 17 blog posts lack `@id` on the Article. Without it Google cannot deduplicate across crawls. Add:
```json
"@id": "https://numnumsbakery.com.au/blog/[slug]#article",
"mainEntityOfPage": { "@type": "WebPage", "@id": "https://numnumsbakery.com.au/blog/[slug]" }
```

**SCH-H5: Article entities missing `wordCount`**  
Add approximate word count to each Article schema (aids Google in assessing content depth).

**SCH-H6: Product entities on `cakes.html` missing `aggregateRating`**  
Without `aggregateRating` or `review`, Product rich results will not appear as enhanced snippets. Add the business-level rating to each Product as a proxy.

**SCH-H7: Offer entities missing `itemCondition`**  
Add `"itemCondition": "https://schema.org/NewCondition"` to each Offer on cakes.html.

**SCH-H8: `hasMap` URLs incomplete**  
Current: `https://www.google.com/maps/place/Num+Nums+Bakery/@-33.8206078,151.0089521`  
Add zoom parameter at minimum: `...@-33.8206078,151.0089521,17z`. Ideally replace with CID URL from the "Share" link in Google Maps.

**SCH-H9: No `WebPage` / `CollectionPage` entity on `cakes.html` or `order.html`**  
`about.html` correctly uses `AboutPage` with `isPartOf`. Mirror this pattern on cakes and order pages.

### MEDIUM

**SCH-M1: Organization re-declared in full on `about.html`**  
Replace the full Organization block with an `@id` reference to avoid duplicate entity declarations.

**SCH-M2: `blog/index.html` missing `CollectionPage` schema**  
Only a bare BreadcrumbList is present. Add a CollectionPage entity.

**SCH-M3: 4 blog posts use minified single-line JSON-LD**  
`eggless-cakes-soft-moist-myths-vs-facts.html`, `top-7-custom-eggless-cake-designs-kids-birthdays.html`, `vegan-vs-eggless-cakes-difference.html`, `why-we-chose-100-percent-eggless-bakery.html` — a single rogue character breaks the block with no line reference. Reformat to multi-line.

### LOW

**SCH-L1: No `Person` entity with `@id` for Tarun Patel**  
17 Article schemas reference the same author without a shared `@id`. Add a Person entity to `about.html` and update all blog post `author` references to use `{ "@id": "...#tarun-patel" }`.

**SCH-L2: Article images as plain string URL instead of `ImageObject`**  
Google recommends `ImageObject` with `contentUrl`, `width`, `height`, and `caption` for better image indexing.

**SCH-INFO: FAQPage rich results restricted to government/healthcare (Aug 2023)**  
FAQ schema on commercial pages will NOT produce accordion rich snippets in Google Search. Keep it for AI citation value (ChatGPT, Perplexity, Google AIO) but do not invest time adding new FAQPage markup purely for Google SERP rich results.

---

## Performance (Core Web Vitals) — Score: 55 / 100

### CRITICAL

**PERF-C1: React + Babel + ReactDOM loading on every page for a hamburger menu**  
`index.html` lines 1752–1754: three unpkg scripts (~495KB gzipped, including the full Babel compiler). Babel transpiles ~200 lines of JSX at runtime on every page load. On mid-range Android devices this blocks the main thread for 200–600ms — a direct INP disaster.  
Fix: Rewrite the hamburger menu as ~50 lines of vanilla JavaScript. Eliminate all three script tags.

**PERF-C2: GTM fires synchronously in `<head>` + duplicate standalone GA4 tag**  
The GTM inline bootstrap (lines 5–10) is a parser-blocking microtask. A separate `gtag.js` (lines 12–18) means GA4 fires twice per page view. On a 4G Australian mobile connection this costs 150–300ms of LCP delay.  
Fix: Move both snippets to just before `</body>`. Remove the standalone GA4 script — GTM handles it.

### HIGH

**PERF-H1: Tailwind CDN on blog posts (absent from index.html but present on others)**  
Several blog posts load `https://cdn.tailwindcss.com` (~350KB JavaScript + runtime CSS generation). The main pages use inline styles correctly. Audit all blog posts and remove the Tailwind CDN tag; extract used classes to inline `<style>` blocks.

**PERF-H2: Lenis loaded from unpkg on every page, runs permanent rAF loop on mobile**  
`https://unpkg.com/lenis@1.1.14/dist/lenis.min.js` (line 1978) runs a `requestAnimationFrame` loop indefinitely. On mobile, `smoothTouch: false` means the loop does nothing but still consumes CPU each frame.  
Fix: Self-host Lenis (already in `node_modules/lenis`). Load with `defer`. Initialize only on desktop.

**PERF-H3: Hero video — 1.8MB WebM, 3.1MB MP4**  
`preload="none"` and poster image preload are correctly implemented. But 1.8MB is heavy for slow connections. Re-encode at VP9 CRF 36–38, targeting under 1MB.

**PERF-H4: `Logo_TParent.png` fallback is 1.6MB**  
The `<picture>` element correctly serves `Logo_TParent_56.webp` (4.1KB) to WebP browsers. The PNG fallback is 1.6MB for a 56×56px logo. Create a properly sized PNG export under 3KB.

### MEDIUM

**PERF-M1: Cake card `mousemove` listeners not throttled**  
`getBoundingClientRect()` called on every mousemove event (60–120Hz), triggering style recalculation on each frame. Wrap in a `requestAnimationFrame` gate.

**PERF-M2: Resize listeners not debounced**  
`window.addEventListener('resize', setWidths)` (testimonials, line 1702) and skeleton screen resize listener call layout-reading operations without debouncing. Add 100ms debounce.

**PERF-M3: Cake card images missing `width`/`height` attributes**  
`index.html` lines 975, 997, 1019, 1041. Parent has `aspect-ratio: 3/4` via CSS, but explicit `width`/`height` on `<img>` is still required defensively for browsers that haven't applied CSS before layout.

### PASSING
- Hero video: `autoplay muted loop playsinline preload="none"` — all correct
- Poster image preloaded with `fetchpriority="high"` on line 29
- Font loading: print-media trick (`media="print" onload`) used correctly — no render blocking
- Cache headers: HTML `max-age=0`, assets `immutable` — correctly configured
- Static HTML: no JavaScript framework dependency for content rendering
- HSTS + Brotli/gzip compression via Netlify — automatic

---

## AI Search Readiness — Score: 72 / 100

### CRITICAL

**GEO-C1: No homepage FAQ section**  
The homepage has no question-format headings and no self-contained answer blocks. Google AI Overviews pull from pages that answer queries directly in the first 60 words of a section. Add a 5-question FAQ section targeting: eggless-ness confirmation, locations, ordering process, flavours, and Jain/halal suitability. Mark with `FAQPage` schema.

### HIGH

**GEO-H1: No YouTube presence**  
The correlation between YouTube presence and ChatGPT citation probability is 0.737 — the highest of any single off-site signal. Even 3–5 short videos (cake decoration time-lapse, store walkthrough, "eggless vs vegan explained") would create the brand mention footprint AI models require. Add the YouTube URL to `llms.txt` and the Organization schema `sameAs` immediately upon creation.

**GEO-H2: No Wikidata entity**  
No Wikipedia or Wikidata record exists. ChatGPT's training draws heavily on Wikidata-linked knowledge. Submit a basic Wikidata entry: `instance of: bakery`, `located in: Harris Park NSW`, `country: Australia`, `founded: 2019`. No Wikipedia article required; Wikidata entries for local businesses are standard.

**GEO-H3: No author bio on blog posts**  
See CONT-H1. Tarun Patel's entity cannot be verified by AI systems without visible, linked author information.

### MEDIUM

**GEO-M1: Add `Halal-friendly` to `servesCuisine` in all BakeryOrCafe schemas**  
The about page, halal blog post, and visible content all confirm halal suitability. The schema `servesCuisine` array currently only has `["Eggless", "Vegetarian", "Jain-friendly"]`. Add `"Halal-friendly"`.

**GEO-M2: llms.txt missing email and pricing**  
Footer shows `info.numnumsbakery@gmail.com` but it's absent from llms.txt. The full price table (6" $39.99 → 16" $134.99) is in the homepage HTML but not in the AI-facing file. Add both.

**GEO-M3: Add Speakable schema to homepage**  
Add `SpeakableSpecification` targeting H1 and a new "direct answer" intro paragraph. Voice search queries ("is there an eggless cake bakery near me?") are common for this business type.

**GEO-M4: llms.txt missing `Last updated` date**  
Add `> Last updated: May 2026` to the description block for AI recency signals.

### PASSING
- robots.txt: all 7 major AI bots explicitly allowed (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, anthropic-ai, CCBot, ChatGPT-User)
- llms.txt: present, well-structured, RSL 1.0 license declared, all 17 blog posts listed
- Blog posts: FAQPage schema with 5 Q&A pairs each — strong AI citability
- Static HTML: all content in raw source — no JavaScript rendering required for AI crawlers
- Business info: phone, addresses, hours consistent and machine-readable across schema, llms.txt, and footer

---

## Local SEO — Score: 63 / 100

### CRITICAL

**LOCAL-C1: Parramatta completely absent from homepage**  
Harris Park is geographically within Parramatta City Council. "Eggless cakes Parramatta" is materially higher search volume than "eggless cakes Harris Park". The homepage H1, meta description, and hero copy contain no mention of Parramatta. Change the hero subheading from "Harris Park & Riverstone" to "Harris Park, Parramatta & Riverstone". Update meta description to include Parramatta.

**LOCAL-C2: `og:site_name` NAP inconsistency**  
"Num Nums Bakery" (no apostrophe) on all 24 pages via OG meta. Every other reference uses "Num Num's Bakery". AI crawlers and social platforms that read OG data may index the wrong name variant.

**LOCAL-C3: Riverstone `aggregateRating` almost certainly inflated**  
Riverstone opened December 2024 — roughly 6 months before this audit. Showing `ratingValue: "4.6" reviewCount: "50"` (identical to Harris Park) signals copied data. If the actual Riverstone GBP count differs, this is a structured data quality violation that can suppress the rich result.

### HIGH

**LOCAL-H1: No dedicated location landing pages for each store**  
`/locations` serves both stores on one page. Separate pages at `/harris-park` and `/riverstone` would allow each store to independently rank in local pack results for suburb-specific queries. Each page should have unique NAP, schema pointing to that URL, an embedded map for that store only, and prose about that specific location (the content already exists on `/locations` and can be adapted).

**LOCAL-H2: No "Read our reviews on Google" link**  
The homepage shows 9 review cards with no link to leave a review or read the full set on Google. Add a "Read all reviews on Google" button linking to each store's GBP listing. This directly feeds review velocity, a top-3 local ranking factor.

**LOCAL-H3: Schema review dates stale — most recent is 2025-03-02**  
The most recent Review in schema is 14+ months old. AI crawlers use `datePublished` on schema reviews as a freshness signal. Add at least one review to each location's schema `review` array from 2025 or 2026.

**LOCAL-H4: Yennora factory address publicly visible on `/locations`**  
The factory at 2/4 Nelson Road, Yennora has a location card with a Google Maps link. Crawlers may index this as a third business location and create a phantom GBP listing. Remove the Google Maps link from the factory card, or remove the card entirely.

### MEDIUM

**LOCAL-M1: Missing `sameAs`, `contactPoint` on BakeryOrCafe location schemas**  
See SCH-H1 and SCH-H2 above.

**LOCAL-M2: Riverstone footer in `about.html` missing phone number**  
The Harris Park footer block includes a `tel:` link; the Riverstone block does not. All footer location entries should carry a phone reference.

**LOCAL-M3: No "Get Directions" anchor text CTA on `/locations`**  
Maps are embedded but there is no explicit "Get Directions to [Store]" text link. Anchor text containing "directions" is a small but consistent local relevance signal.

### PASSING
- NAP fully consistent across all pages (addresses, phone) — no discrepancies between schema, visible text, footer, and llms.txt
- Both stores have embedded Google Maps iframes with correct Place IDs
- Separate schema `@id` per location (`#harris-park`, `#riverstone`)
- Strong location prose on `/locations` differentiating both stores with transit, parking, and suburb coverage info
- AggregateRating schema present on both stores

---

## Sitemap — Corrected and Current

**The sitemap has been corrected by the audit agent.** All 24 lastmod dates now reflect verified git commit dates. The corrected file has been written to `sitemap.xml`.

### Remaining items:
- Remove `/privacy-policy` URL block (page is noindexed and the file is not yet deployed)
- Do not add `changefreq` or `priority` — Google has ignored both since 2023; Bing weights them but the maintenance burden is not worth it for a 24-URL site

---

## Images — Score: 52 / 100

### CRITICAL

**IMG-C1: OG image is 518×388px — too small for social sharing**  
`brand_assets/num_nums_HPphoto.jpeg` is used as `og:image` and `twitter:image` on: `index.html`, `about.html`, `order.html`, `blog/index.html`, and `blog/why-we-chose-100-percent-eggless-bakery.html`. Facebook/LinkedIn minimum is 1200×630px. Images below 600px wide are often ignored entirely. No preview will render when these pages are shared on social media.  
Fix: Create a dedicated 1200×630px landscape OG image for each page type.

**IMG-C2: Wedding cakes blog post uses a kids birthday cake as OG image**  
`blog/eggless-wedding-cakes-sydney.html` uses `Pink_1.webp` (a kids birthday cake) as its OG image. When shared on WhatsApp or Facebook, the preview image directly undermines trust for brides. Change to any of the Wedding Cakes photos.

### HIGH

**IMG-H1: Zero content images inside all 17 blog posts**  
Every blog post contains only the nav logo and footer logo. No article body images. This means: zero Google Image Search indexing for blog content, zero keyword contribution from image alt text in article context, and reduced dwell time. Add at least one relevant cake photo to the body of each post with a descriptive alt tag matching the post's target keyword.

**IMG-H2: 4 homepage gallery images missing `width`/`height` attributes**  
`index.html` lines 975, 997, 1019, 1041 — the four cake category cards. The `cakes.html` gallery correctly sets `width="360" height="480"` on all images. The homepage does not. CLS risk without explicit dimensions.

**IMG-H3: Generic alt text on homepage gallery images**  
- `alt="Wedding Cake"` → should be `"eggless wedding cake Sydney"`
- `alt="Kids Cake"` → should be `"custom eggless kids birthday cake Sydney"`
- `alt="Baby Shower Cake"` → should be `"eggless baby shower cake Sydney"`
- `alt="Pink Cupcake"` → should be `"eggless pink cupcake Num Num's Bakery"`

### MEDIUM

**IMG-M1: Unused + unoptimised PNG cupcake files deployed**  
`Yellow_Cupcake.png` (830KB), `Blue_Cupcake.png` (817KB), `Vanilla_Cupcake.png` (600KB) are deployed but not referenced in any HTML. Delete or convert to WebP.

**IMG-M2: `Logo_wName.png` (1.2MB) deployed but never referenced in HTML**  
Remove or convert to WebP if needed.

**IMG-M3: Baby Shower and Wedding Cake photos have no WebP versions**  
`cakes.html` uses `<picture>` with WebP sources inconsistently. Baby Shower and Wedding sections use bare `<img>` with no `<source type="image/webp">` wrapper.

**IMG-M4: Review avatar photos are unoptimised PNG**  
`Sivasankar_Racing.png` (169KB), `Surbhi_Jungle.png` (60KB), `Naina_Designer.png` (44KB). Convert to WebP for ~70% size reduction.

**IMG-M5: Portrait-only cake photos used as OG images**  
Most OG images are portrait-oriented cake photos cropped to a landscape display area by social platforms. Dedicated 1200×630 landscape OG images are required (see IMG-C1).

### LOW

**IMG-L1: No AVIF format in use**  
20–50% smaller than WebP at equivalent quality. Worth adding `<source type="image/avif">` for product images on cakes.html once WebP is consistent.

**IMG-L2: Directory names with spaces require URL encoding**  
`Kids Cakes`, `Baby Shower`, `Wedding Cakes` directories require `%20` in HTML. Renaming to `kids-cakes`, `baby-shower`, `wedding-cakes` would be cleaner.

### PASSING
- Hero video setup: `autoplay muted loop playsinline preload="none"` — all correct
- Poster image preloaded with `fetchpriority="high"`
- `cakes.html` gallery: correct `width`/`height` on all images, WebP `<picture>` sources on most products
- Descriptive filenames throughout (not generic)
- WebP format adopted for most new cake photos

---

## Appendix: Per-Page Content Scorecard

| Page | Words | E-E-A-T | Key Issue |
|------|-------|---------|-----------|
| index.html | 5,556 | Strong | reviewCount inflation |
| about.html | 2,093 | Strong | No schema, no author photo |
| cakes.html | 5,723 | Good | Gallery lacks descriptive copy |
| locations.html | 2,419 | Good | No dedicated per-location pages |
| order.html | 4,043 | Moderate | Inch/gram sizing conflict |
| eggless-birthday-cakes-sydney.html | 3,246 | Good | Gram/inch conflict, no byline |
| eggless-birthday-cakes-every-age-sydney.html | 3,301 | Good | Cannibalization risk |
| eggless-cupcakes-kids-birthday-party-sydney.html | 3,288 | Good | Overlap with top-7-designs post |
| top-7-custom-eggless-cake-designs-kids-birthdays.html | 2,621 | Moderate | Tailwind CDN, no byline |
| eggless-wedding-cakes-sydney.html | 3,086 | Good | Wrong OG image, no byline |
| eggless-cakes-diwali-indian-festivals-sydney.html | 3,198 | Moderate | Low specificity |
| eggless-cakes-mothers-day-sydney.html | 3,144 | Moderate | No pricing, no lead time callout |
| halal-friendly-cakes-eggless-sydney.html | 3,177 | Moderate | Gelatin/halal gap |
| natural-ingredients-eggless-cakes.html | 3,870 | Good | Strongest technical content |
| vegan-vs-eggless-cakes-difference.html | 2,393 | Weak | Avoids stating cakes are not vegan |
| eggless-cakes-soft-moist-myths-vs-facts.html | 2,524 | Moderate | Claims without baking-science |
| how-to-order-custom-eggless-cake-online.html | 2,445 | Weak | Duplicates order.html |
| why-we-chose-100-percent-eggless-bakery.html | 2,513 | Strong | Best brand story on site |
| eggless-cake-bakery-harris-park-riverstone-sydney.html | 2,807 | Moderate | Local overlap |
| best-dessert-shop-sydney.html | 3,177 | Moderate | Broad intent, low differentiation |
| birthday-cake-near-me-sydney-suburbs.html | 2,981 | Moderate | Suburb overlap |
| cake-shop-near-me-marsden-park-talawong.html | 3,304 | Moderate | Suburb overlap with above |

*No page falls below minimum word count floors.*
