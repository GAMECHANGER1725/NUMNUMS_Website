# Technical SEO findings: numnumsbakery.com.au (2026-10-01)

Method: all 242 on-disk HTML pages parsed (canonical, meta robots, viewport, lang, hreflang, links). 241 live sitemap URLs plus 22 extra URLs fetched with redirects NOT followed (status, Location, headers, canonical). netlify.toml parsed (540 redirect rules, headers). Every live finding was checked against disk. `sitemap_discovery.py` returned "Request failed" for every URL in this sandbox because it does not use the egress proxy. The sitemap was therefore validated by hand: GET https://numnumsbakery.com.au/sitemap.xml returned 200 with 241 `<loc>` entries live and 240 on disk. robots.txt as served is byte-identical to the file on disk, and its `Sitemap:` line points at that URL.

## Category status
| Category | Status |
|---|---|
| Crawlability | PASS with 1 High (repo internals publicly served) |
| Indexability (canonicals/robots) | PASS (disk and live) |
| Security headers | PASS, CSP caveat (Medium); live CSP stale |
| URL structure / redirects | PASS on disk; 2 minor Low items |
| Mobile viewport | PASS (242/242 have `width=device-width, initial-scale=1.0`) |
| hreflang / lang | PASS with 2 small issues |
| Orphans | PASS (0 orphans) |

## ALREADY FIXED ON DISK, AWAITING NETLIFY PUBLISH
Do not action these in the repo. Publish the current main build.
1. Live sitemap.xml lists `https://numnumsbakery.com.au/cakes` (live 241 URLs vs 240 on disk). Live `/cakes` returns 200 with a self-canonical. On disk, `/cakes` is a 301 to `/order` (netlify.toml, force=true) and `cakes.html` is deleted. Live `/cakes.html` returns 301 to `/cakes`, so a 2-hop chain until publish.
2. Live pages carry many `/cakes` links: homepage 9, `/about` 7, `/order` 7, `/locations` 6, `/blog/` 6, and roughly 235 blog posts with 3 to 8 each. On disk there are 0 `<a href>` links to `/cakes`, `/cakes/` or `/cakes.html` in any of the 242 pages.
3. Live `/terms` returns 404. Live pages carry `href="/terms"` in 0 cases, but on disk 232 pages link `/terms` and `terms.html` exists (committed). It resolves once published.
4. Live `/shop` and `/shop/` return 404. On disk `shop/index.html` is committed and netlify.toml has a `/shop` to `/shop/index.html` 200 rewrite. The `/shop/*` header sets `X-Robots-Tag: noindex, nofollow` and `no-store`.
5. Live CSP lacks `https://accounts.google.com` (script/connect/frame) and `https://stnmoxsojqbbtgjwkzrc.supabase.co` (connect). The disk netlify.toml has both. This affects Google sign-in and Supabase calls only, not crawling.
6. Live nav lacks "Shop Cakes" (0 matches live vs 3 in disk index.html).

## Findings still present in the repo (actionable)

### HIGH
**H1. Internal repo files are publicly served from the site root because `publish = "."`.** netlify.toml line 17 sets `publish = "."` and there is no `X-Robots-Tag` or redirect rule excluding these paths. robots.txt has no Disallow rules. Live fetch returned 200 for:
- `/CLAUDE.md` (text/markdown), which contains business rules, Supabase project ref and architecture
- `/blog-gsc-per-page.md` and `/blog-cluster-report.md`
- `/GBP/image-bank.md` and `/GBP/posts-queue.md`
- `/plans/Five-Year Direction — 2026-2031.md` (business strategy)
- `/skills/seo-audit/SKILL.md` and `/skills/seo-audit/VENDORED.md`
- `/package.json`, `/verify-blog.mjs`, `/serve.mjs`
- `/ops/app.mjs`, `/ops/db.mjs`, `/ops/index.html` and `/ops/netlify.toml` (see M1)

Directory paths such as `/plans/`, `/docs/` and `/netlify/functions/*` return 404, so only exact file URLs are reachable. Some paths 404 live but are likely just newer than the live deploy, so re-test after publish (for example `/seo-baseline/...csv`). Impact: SEO and index pollution risk (md/mjs/json URLs crawlable, and `Allow: /` invites it), plus competitive-intelligence leakage (strategy plans, GSC data). Fix: add a `[[headers]]` block with `X-Robots-Tag = "noindex, nofollow"`, or better, 404 these paths with force-redirect rules (`/*.md`, `/GBP/*`, `/plans/*`, `/skills/*`, `/seo-baseline/*`, `/SEO/*`, `/docs/*`, `/package*.json`, `/*.mjs`), or set a build step that copies only public files to a `dist/` publish dir. Add matching `Disallow:` lines to robots.txt only as a secondary measure.

### MEDIUM
**M1. The internal ops app is reachable on the public domain.** `https://numnumsbakery.com.au/ops/` returns 200 (meta `robots: noindex, nofollow` is present in `ops/index.html:6`, no X-Robots-Tag header). CLAUDE.md says ops is a separate Netlify site at ops.numnumsbakery.com.au. Because the main site publishes the repo root, the app is also served on the marketing domain under the main-site CSP, not the ops CSP. Meta noindex is the only guard. Fix: redirect or 404 `/ops/*` on the main site (`from="/ops/*" to="/404" status=404 force=true`) or add `X-Robots-Tag: noindex` for `/ops/*`.

**M2. CSP uses `script-src 'unsafe-inline'`** (netlify.toml line 3321) plus broad script hosts (`unpkg.com`, `cdn.jsdelivr.net`, `cdn.tailwindcss.com`, `storage.googleapis.com`). It is a weak XSS control. The site is static with inline scripts and the Tailwind CDN, so the fix (nonces or hashes) is non-trivial. Other headers are good on disk and live: HSTS `max-age=31536000; includeSubDomains; preload`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. There is no `frame-ancestors` or `object-src` in the CSP (`default-src 'self'` covers object-src).

**M3. Production Tailwind via CDN (`cdn.tailwindcss.com`)** is a render-blocking runtime compiler and an LCP/CLS risk. This was not measured here (data-only run). Pages that use compiled `/style.css` avoid it.

### LOW
**L1. `/blog/` hreflang points at a redirecting URL.** `blog/index.html` has canonical `https://numnumsbakery.com.au/blog/` (lines 27-29), but hreflang en-AU and x-default point at `https://numnumsbakery.com.au/blog`, which 301s to `/blog/` live. This is the only page whose hreflang differs from its canonical. Fix: use the trailing-slash URL in hreflang.

**L2. 3 posts lack hreflang tags** (the other 239 have self-referencing en-AU + x-default): `blog/luxury-cake-sydney.html`, `blog/naked-cake-sydney.html`, `blog/eggless-cake-for-pooja-sydney.html`. Add the standard pair for consistency.

**L3. `llms.txt` lists `https://numnumsbakery.com.au/blog` (no trailing slash)**, which 301s to `/blog/`. The sitemap uses `/blog/`. Make them match. llms.txt also lists `/privacy-policy` and `/terms`, which are noindex.

**L4. Plain-text `numnumsbakery.com.au/cakes` mentions in 3 posts** (not links, but the FAQ JSON-LD text is user-visible in rich results):
- `blog/eggless-cake-school-celebration-sydney.html` lines 141 and 589
- `blog/unique-birthday-cake-ideas-sydney.html` line 198
- `blog/eggless-cakes-eid-ul-adha-sydney.html` line 149

Change to `numnumsbakery.com.au/order`.

**L5. Duplicate `<link rel="canonical">` tags** (same value, so harmless) in `blog/eggless-cake-types.html` and `blog/eggless-cakes-valentines-day-sydney.html`. Remove the duplicate; Google may ignore conflicting canonicals if a later edit makes them differ.

**L6. http://www is a 2-hop chain live:** `http://www.numnumsbakery.com.au/` returns 301 to `https://www.numnumsbakery.com.au/`, which returns 301 to `https://numnumsbakery.com.au/`. The `http://www/*` force rule is in netlify.toml but Netlify's HTTPS upgrade fires first. `http://numnumsbakery.com.au/` (1 hop) and `https://www.` (1 hop) are fine. Low impact because nothing internal links to http://www. Verify Netlify domain settings (primary = non-www).

**L7. Sitemap lastmod values are stale and bucketed.** The newest is 2026-09-03 and most are May to June 2026, yet pages were edited on 2026-09-29 (git: index.html 29 Sep, blog posts 29 Sep). Google ignores lastmod it finds unreliable. Regenerate from git mtime. No `<priority>`/`<changefreq>` issues were checked.

**L8. No custom `404.html`.** Netlify serves its default 404 (confirmed live: `/this-does-not-exist` returns 404, correct status code, no soft-404). Consider a branded 404 with links to /order, /indian-sweet and /blog/.

### INFO (verified passes)
- **Canonical convention is extensionless.** All 242 pages have a self-referencing canonical equal to the clean URL (`/about`, `/blog/slug`, `/` and `/blog/`). 0 mismatches on disk. Live: 241/241 sitemap URLs return a canonical equal to the URL, with no stray noindex.
- **Status codes live:** 241/241 sitemap URLs return 200 with no redirects. Old `.html` URLs 301 in one hop (`/order.html`, `/about.html`, `/blog/eggless-cake-types.html`, `/blog/index.html`). `/indian-sweet/`, `/order/`, `/blog`, `/review` and `/sitemap_index.xml` each 301 in one hop. `/llms.txt` and `/favicon.ico` return 200. No 404 for any sitemap URL.
- **netlify.toml redirects:** 540 rules, 0 duplicate sources, 0 301 chains, 0 targets that do not exist on disk.
- **Internal links on disk:** 0 links to `.html`, 0 to `/cakes`, 0 to non-existent targets (except `/shop`, which is a deliberate rewrite to the noindex shop), 2 absolute self-links (`terms.html`, `privacy-policy.html`, root URL only). Trailing-slash use is consistent: only `/blog/` has one.
- **Orphans:** 0. Every on-disk page has at least one inbound link from another page. Sitemap vs disk: 240 URLs and 240 matching files, 0 sitemap URLs missing on disk, 0 duplicates.
- **noindex use is deliberate:** `terms.html` and `privacy-policy.html` are `noindex, follow` and excluded from the sitemap. These are legal pages, acceptable. `/shop/*` is `X-Robots-Tag: noindex, nofollow` (intended, per project rules). `brand_assets/*` is noindex.
- **lang / mobile:** `<html lang="en-AU">` on 242/242. Viewport meta on 242/242. Every page has exactly one `<title>`, a meta description, OG tags and JSON-LD. 1 `<h1>` on every page (0 pages with 0 or multiple H1).
- **hreflang:** all 239 present are self-referencing en-AU + x-default and match the canonical (exception L1). No cross-language alternates; a single-language site, so this is fine.
- **robots.txt:** `User-agent: *` Allow /, with explicit allows for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, anthropic-ai, CCBot and ChatGPT-User, plus the `License: https://rsl.ai/1.0/allow-search-only` line and `Sitemap:` declaration. Note: Google-Extended and Applebot-Extended are not listed (they fall under `*` Allow).
- **IndexNow:** key file `/8a811016cc8e6931dbe358599d9112e9.txt` returns 200. `indexnow.mjs` exists.
- **Not checked** (data-only run, no browser): Core Web Vitals field data, JS rendering (static HTML, so CSR risk is nil for the main pages), structured data validation depth, and image weights.

## Prioritised action list
1. Publish the current main build in the Netlify UI. It clears all six "already fixed" items, including the stale `/cakes` sitemap entry and `/terms` 404.
2. H1: stop serving repo internals (CLAUDE.md, plans, GBP, skills, ops, md/mjs/json). Re-test after publish.
3. M1: block `/ops/*` on the public domain.
4. L1-L5: small markup fixes (blog hreflang, three hreflang-less posts, llms.txt `/blog/`, text `/cakes` mentions, duplicate canonicals).
5. L7: regenerate sitemap lastmod from git.

TECHNICAL_SCORE: 80/100

Justification: the on-disk site is very clean: every page has a correct self-referencing extensionless canonical, a viewport, `lang="en-AU"`, one H1 and a valid sitemap entry. There are no orphans, no internal redirect hops and no redirect chains in netlify.toml, and the security headers are strong apart from `unsafe-inline`. 241 of 241 live sitemap URLs return 200 with correct canonicals. Points are lost chiefly for the High finding that the repo root is the publish directory, which exposes strategy and ops files with `Allow: /` robots (-10), for `/ops/` on the public domain and the weak CSP (-5), and for a handful of Low hygiene items (-5). The stale live deploy (the `/cakes` sitemap entry and links, the `/terms` and `/shop` 404s, the older CSP) is NOT penalised, since it is already fixed in the repo and only needs the Netlify publish.

BASIS: Canonicals, robots meta, viewport, lang, hreflang, internal links, orphans, redirect-rule integrity and headers config were judged from local files (242 HTML pages, netlify.toml, sitemap.xml, llms.txt). Status codes, redirect hops, live canonicals, live headers and live exposure of internal files were judged from a live HTTP crawl of 241 sitemap URLs plus 22 extra URLs on 2026-10-01 (redirects not followed). The stale-deploy items are live-only observations cross-checked against disk. `sitemap_discovery.py` failed in the sandbox (proxy), so sitemap validity was confirmed by direct GET.
