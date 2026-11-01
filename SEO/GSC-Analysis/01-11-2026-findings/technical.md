# Technical SEO - 2026-11-01
Score 91/100. All 240 sitemap URLs 200 with 0 redirects, canonicals/viewport/hreflang clean on all 242 pages, no single-quoted attrs; docked for 1,185 links to a redirecting /shop, unrunnable verify-blog, and minor header/CSP items.
1. Medium | 1,185 internal hrefs to /shop (e.g. indian-sweet.html; sitewide nav) 301 to /shop/ live (netlify.toml:86-89 200 rewrite to /shop/index.html is shadowed by the shop/ folder) | Link to /shop/ in the nav/promo.js/pages, or fix the rule. Saves a hop per click and on crawl.
2. Medium | /shop/ is sent X-Robots-Tag noindex, nofollow (netlify.toml ~3260-3295) and has meta noindex,follow; the nav, hero and 1,185 links push users and PageRank into it | Intentional until cutover per CLAUDE.md. Confirm the Stripe live-key state and flip noindex at launch. Meanwhile consider rel=nofollow-free and a decision date.
3. Low | /terms.html returns 200 (not 301 to /terms like /about.html); it is noindex and canonical /terms, so no index harm | Add a 301 for /terms.html for consistency.
4. Low | privacy-policy and terms are noindex,follow and absent from sitemap (240 URLs = 238 blog+index/main pages) | Fine if intended. Legal pages need no index; ok.
5. Low | node verify-blog.mjs cannot run here: ERR_MODULE_NOT_FOUND 'stripe' (netlify/functions/stripe-webhook.mjs). Not installed, not run | Run it in CI/dev with deps. Blog invariants were checked by my scripts instead (sitemap vs disk match exactly).
6. Low | Live CSP (main site) includes script-src 'unsafe-inline' and unpinned CDNs (cdn.tailwindcss.com, unpkg, jsdelivr) | Acceptable for inline-script static site; long-term move to compiled Tailwind and nonces/hashes.
7. Low | No Cross-Origin-Opener-Policy header; Cache-Control is max-age=0,must-revalidate on HTML (fine) | Optional hardening.
8. Low | sitemap lastmod present on 240 URLs, but changefreq/priority are ignored by Google | Optional: drop them.
## What works
- Live robots.txt identical to disk; allows all, declares sitemap; AI crawlers allowed.
- 240/240 sitemap URLs 200, 0 redirects, no duplicates; every page on disk (except noindex legal pages) is in the sitemap.
- Canonical: exactly one on all 242 pages, matches clean-URL convention (no .html, trailing slash only on /blog/).
- Viewport, title and meta description present everywhere; hreflang en-AU + x-default self-referencing on all 242.
- Zero single-quoted style=/on*= attributes in the served HTML.
- No internal links to nonexistent files, /cakes, or .html URLs. Only the /shop hop remains.
- Redirects live correct: www->apex 301, http->https, /cakes->/order, /about.html->/about, /blog->/blog/, true 404 for junk.
- Headers: HSTS preload, nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy, CSP present.
