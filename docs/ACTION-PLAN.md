# SEO Action Plan — Num Num's Bakery

**Generated:** 2026-06-05 · **Health Score:** 88/100 (Strong) · supersedes 2026-05-30 plan (was 76/100)
Companion to **FULL-AUDIT-REPORT.md**. Ordered by priority.

> Test everything on localhost (`node serve.mjs`). Do not push to GitHub until you say so.

---

## 🔴 CRITICAL
_None. No issues block indexing or risk outright penalties._

---

## 🟠 HIGH (fix within 1 week)

### 1. De-duplicate the 23 suburb pages (`blog/eggless-cakes-<suburb>.html`)
**Problem:** ~81% identical body content; only the suburb name changes (measured: Parramatta vs Westmead share 1,230/1,510 tokens). Doorway-page / near-duplicate risk under Google's helpful-content & spam policies.
**Fix (choose one):**
- **Differentiate:** add 150–250 words of genuinely local content per page — drive time to the nearest store (Harris Park vs Riverstone), pickup/delivery notes, named local landmarks/schools/stations, a suburb-specific testimonial or popular flavour.
- **Consolidate:** merge the weakest-traffic suburbs into regional hubs ("Eggless Cakes in North-West Sydney", "...Parramatta Region") with anchored per-suburb sections; 301 the removed pages to the hub.
**Verify:** re-run vocabulary diff; aim for <60% overlap between any two suburb pages.

### 2. Remove browser-side Babel/JSX transpilation (homepage + interactive sections)
**Problem:** Production ships `@babel/standalone` and transpiles JSX in the browser before the hero paints → inflated LCP + main-thread work (INP risk). React/ReactDOM/Babel/Lenis all load from unpkg.
**Fix:** Pre-compile JSX at build time (output plain JS), or rewrite the few interactive widgets in vanilla JS. Goal: **zero Babel shipped to the browser** and the hero present in server HTML.
**Verify:** `curl -s https://numnumsbakery.com.au/ | grep -c 'text/babel'` returns 0; hero H1 text present in raw HTML; PageSpeed mobile LCP improves.

---

## 🟡 MEDIUM (fix within 1 month)

### 3. Add structured data to `indian-sweet.html`
Only main page with 0 JSON-LD (confirmed live). Add `BakeryOrCafe` (or `Product`/`ItemList` for the sweets range) — copy the pattern from `index.html`. **Verify:** Rich Results Test passes.

### 4. Convert `.html` URLs to 301 redirects
`/about.html` etc. return 200 (duplicate of `/about`). Add 301 `*.html → clean URL` in `netlify.toml` / `_redirects`. Canonicals already point to clean URLs, so this is cleanup. **Verify:** `curl -sI .../about.html` shows `301`.

### 5. Trim long title tags to ≤60 chars
~28 titles exceed 60 (longest 83). Start with the 8 worst (listed in FULL-AUDIT-REPORT.md → On-Page SEO). Front-load the keyword; shorten/drop the "| Num Num's Bakery" suffix on long titles.

### 6. Server-render homepage content for AI crawlers
GPTBot/ClaudeBot/PerplexityBot don't run JS — they currently miss the JS-rendered hero/reviews. Resolved automatically by fixing #2 (server-render the hero). **Verify:** value props + reviews present in raw `curl` of `/`.

---

## 🟢 LOW (backlog)

### 7. Use trailing-slash blog URLs in sitemap + llms.txt
`/blog` 301s to `/blog/`. Reference `/blog/` directly to drop the redirect hop. Files: `sitemap.xml`, `llms.txt`.

### 8. Expand `llms.txt` blog list
Lists ~17 of 79 posts. Add the rest so AI crawlers discover the long-tail suburb/occasion content.

### 9. Image format + CLS hardening
Confirm WebP/AVIF, explicit `width`/`height`, and `loading="lazy"` below the fold. (Alt text already 100%.)

### 10. Sitemap priority/changefreq consistency
Only 50/85 URLs carry `<priority>`/`<changefreq>` (Google ignores these anyway — cosmetic). Either apply consistently or remove.

---

## Already Excellent — Do Not Break
- 100% per-page: 1×H1, title, meta description, canonical, OG. **Maintain on every new page.**
- 100% image alt-text coverage.
- Security headers (HSTS preload, CSP w/ unpkg+GTM, XFO, nosniff, Referrer-Policy, Permissions-Policy).
- HTTP→HTTPS and www→non-www 301s; proper 404 status.
- Rich, valid homepage LocalBusiness/Review/Organization/WebSite schema.
- Sitemap ↔ disk fully consistent; all blog posts ≥600 words; blog posts are static HTML.
- robots.txt + llms.txt welcoming AI crawlers.
