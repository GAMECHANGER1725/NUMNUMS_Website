# Sitemap + On-Page SEO findings — numnumsbakery.com.au
Basis: programmatic Python parse of 242 local HTML files (7 root pages, blog/index.html, 234 posts),
sitemap.xml XML parse, llms.txt section parse, netlify.toml redirect rules, plus the live GSC
Sitemaps API for A7. No live crawl, no screenshots. Local disk treated as source of truth.
Transcribed from the seo-sitemap specialist's hand-back (agent declined to write files itself).

## PART A — sitemap / llms.txt / index sync

A0. `node verify-blog.mjs` exits non-zero. Tail verbatim:
    posts 234 | cards 234 | sitemap 234 | llms 234 | redirects 361 (= posts + 1)
    facts: 240 pages / 243 JSON-LD blocks (0 invalid); sizes, prices, NAP, entity @ids, internal links checked
    checkout, coupon, email, auth-email, order.html, controls, shop, overlay, order-form, nav notes all PASS
    FAIL x2:
      - webhook signature tests failed: ERR_MODULE_NOT_FOUND cannot find package 'stripe'
      - function response-shape tests failed: cannot find 'stripe' / '@supabase/supabase-js'
    [Info] Both failures are sandbox-only missing npm deps; every sitemap/llms/index/content invariant PASSED.
    [Medium] The Netlify build command IS `node verify-blog.mjs`; confirm those packages resolve in the
    Netlify build env or the gate blocks deploys there too.

A1. PASS — all 234 posts appear exactly once in sitemap.xml and once in llms.txt `## Blog Posts`.
    0 missing, 0 duplicated, 0 extra. Exactly 1 `/blog/` entry.
A2. PASS — all 240 <loc> resolve to a real file on disk, no duplicates. privacy-policy and terms
    correctly absent (both noindex,follow).
A3. PASS — 234/234 posts have a card in blog/index.html, no duplicates.
A4. PASS with Low notes — well-formed XML, sitemap 0.9 ns, all URLs https/bare-domain/extensionless
    (only `/blog/` carries a slash), 65 distinct lastmod dates 2026-05-20..2026-09-03, none future.
    [Low] og:url on blog/index.html is `/blog` while sitemap+canonical use `/blog/`.
    [Low] lastmod disagrees with page JSON-LD dateModified on 22 of 234 posts.
A5. PASS — ops/ absent from both files (correct); /shop absent (correct, noindex).
    sitemap.xml on disk contains no /cakes. The live 241st URL is /cakes — fixed on disk, awaiting publish.
A6. [Info/Low] 206 of 240 URLs carry priority+changefreq (197 at 0.7, 9 at 0.8, 1 `yearly`);
    34 carry neither (5 main pages, /blog/, 28 posts). Google ignores both. As set, blog posts
    outrank the home and order pages.
A7. GSC Sitemaps API, property sc-domain:numnumsbakery.com.au:
    - /sitemap_index.xml : 241 web URLs submitted, 0 errors, 3 warnings, last submitted 2025-10-10
    - /wp-sitemap.xml    : legacy WordPress, 0 URLs, 1 ERROR, 4 warnings, last submitted 2025-08-20
    [Medium] sitemap.xml itself is NOT submitted; sitemap_index.xml is only a netlify.toml 301 to it.
    [Low] Delete the dead wp-sitemap.xml entry in GSC (human action).

## PART B — on-page, all 242 pages

B8  Titles: 242/242 present, 33-64 chars, median 51. 0 exact duplicates. [Low] 1 over 60 (locations.html, 64).
    [Medium] blog/eggless-cake-types.html and blog/eggless-cakes-valentines-day-sydney.html each repeat
    the whole head block (title, description, canonical, og) twice, ~line 25 and ~line 216.
B9  Descriptions: 242/242 present, 118-160 chars, median 150. 0 duplicates. [Low] 40 are 156-160.
B10 H1: exactly one per page, none duplicated across pages.
    [Low] blog/best-eggless-cake-shops-sydney-2026.html H1 equals its title verbatim.
B11 Headings: none start below H1, no empty headings. [Low] 7 pages skip H2->H4 — footer h4 "Our Cakes"
    on order/locations/privacy-policy/terms/blog-index, in-content h4 on
    blog/eggless-cake-for-pooja-sydney.html and blog/naked-cake-sydney.html.
B12 Canonical: every page self-referencing, absolute, extensionless. Only violations are the duplicate
    (identical) tags on the two doubled-head posts.
B13 OG/Twitter: og:title/description/image/url/type and twitter:card all 242/242.
    twitter:title/description/image 241/242. [Low] blog/luxury-cake-sydney.html has only twitter:card.
    All og:image absolute.
B14 Image alt: 245 repo HTML files scanned (excl. shop/, review/, ops/, node_modules), 1,499 <img>.
    242 are tracking pixels (excluded) -> 1,257 real images: 1,255 non-empty alt, 2 alt="", 0 missing attr.
    [Info] The 2 empty-alt are decorative logos in supabase-email-templates/{confirm-signup,reset-password}.html.
    No public page has a missing or empty alt.
B15 Internal links: 0 broken, 0 links to redirected URLs, 0 links to /cakes on disk, 0 orphans.
    Hubs by inbound: /, /order, /locations, /blog/ = 241 each; /about 238; /indian-sweet 231;
    eggless-cake-sydney 100; cake-delivery-areas-sydney 96; eggless-cakes-near-me-sydney 60.
    [Medium] 50 posts have exactly ONE inbound link, from the blog/index.html card grid only:
      autumn-cake-sydney, best-eggless-cake-shops-sydney-2026, birthday-cake-for-men-sydney,
      cake-cutting-ceremony-sydney, cake-display-ideas-sydney, cake-for-university-events-sydney,
      cake-for-work-anniversary-sydney, cake-smash-vs-first-birthday-cake-sydney, drip-cake-sydney,
      eggless-cake-cancellation-policy-sydney, eggless-cake-food-colouring-sydney,
      eggless-cake-keto-low-carb-sydney, eggless-cake-low-fodmap-sydney, eggless-cake-reviews-sydney,
      eggless-cake-small-gatherings-sydney, eggless-cake-tasting-sydney, eggless-cake-vs-brownies,
      eggless-cake-vs-ice-cream-cake-sydney, eggless-cake-vs-supermarket-cake, eggless-cake-vs-tart-sydney,
      eggless-cake-wholesale-sydney, eggless-cakes-bat-mitzvah-sydney, eggless-cakes-bonnyrigg,
      eggless-cakes-bossley-park, eggless-cakes-fathers-day-sydney, eggless-cakes-hassall-grove,
      eggless-cakes-housewarming-sydney, eggless-cakes-lalor-park, eggless-cakes-mehendi-sydney,
      eggless-cakes-new-year-sydney, eggless-cakes-pennant-hills, eggless-cakes-retirement-sydney,
      eggless-cakes-rhodes, eggless-cakes-sweet-16-sydney, eggless-cakes-valentines-day-sydney,
      eggless-cakes-yalda-night-sydney, eggless-cupcakes-sydney, eggless-fruit-cake-sydney,
      eggless-mini-cakes-cupcake-towers-sydney, eggless-red-velvet-cake-sydney,
      grand-final-party-cake-sydney, halloween-cake-sydney, hsc-results-day-cake-sydney,
      novelty-sculpted-cake-designs-sydney, push-present-cake-sydney, ram-navami-sydney,
      rasmalai-cake-sydney, reunion-cake-sydney, sensory-friendly-cake-sydney,
      tet-vietnamese-new-year-sydney
    [Low] 62 more pages have 2-3 inbound; 112 posts have <=3.
    Inbound distribution: 1=50, 2=37, 3=25, 4=25, 5=17, 6=9, 7=10, 8=6, 9=7, 10+=56.

SITEMAP_SCORE: 92/100
ONPAGE_SCORE: 93/100
BASIS: local file analysis for everything except A7 (live GSC Sitemaps API).
