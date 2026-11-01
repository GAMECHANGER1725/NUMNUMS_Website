# Cluster / internal-link audit 2026-11-01 (local data only, no SERP calls)
Health score: 52/100
Method: 234 posts + top-level pages parsed; nav/footer/header stripped; blog/index.html counts as a source (it is a card grid, not editorial).

## Findings
- HIGH | /blog/best-eggless-cake-shops-sydney-2026 (1,929 impr, 22 clicks, pos 9.1) has only 1 inbound link, from /blog index. grep finds no post linking to it. Unchanged from last month. | Add 6+ editorial links (matrix 1-8).
- HIGH | /blog/rasmalai-cake-sydney: only the /blog index links to it, though ~12+ posts mention rasmalai. Unchanged. | Matrix 9-12.
- HIGH | Cannibalisation on head terms: "eggless cake near me" (1,401 impr) is split across best-eggless-cake-shops (339, pos 7.7, 0 clicks), dean-park (262), bakery-harris-park-riverstone (245) and schofields (186). "eggless cakes sydney" (551): /cakes 203 / best-shops 98 / home 82 / nut-free 46. "eggless cake sydney" (507): /cakes 139 / best-shops 129 / home 54 / lower-sugar 34. "eggless cakes near me" (412): best-shops 196 / home 79 / harris-park-riverstone 48 / dean-park 38. | Pick best-eggless-cake-shops as the sole listicle target, make bakery-harris-park-riverstone the "near me" location hub, and link the suburb posts up to it with "eggless cake near me" anchors. Do not write new posts.
- HIGH | /cakes still earns 2,011 impr (32 clicks) in w28 though netlify.toml 301s it to /order and cakes.html is gone. The page is still in the index, and /cakes competes with the home page for "eggless cakes sydney". | Not a link fix. Check that GSC drops it, and check that /order has the title/H1 for these queries. Don't re-create /cakes (CLAUDE.md).
- MED | Brand queries ("num num bakery", "num nums bakery", "numnum bakery", "num num harris park", "num num riverstone") spread impressions across /, /about, /cakes, /order, /locations. About has 759 impr and 0 clicks at pos 3.4. This is brand noise, not true cannibalisation. | Leave it. Keep the home page as the canonical brand target (it holds most clicks).
- MED | "cake shop near me" (324): home 295 / cakes 22 / dessert-shop and dean-park 3 each. Not actionable.
- MED | 51 of 234 posts have <=1 inbound link (the one link is the blog index). 24 of them earn impressions, e.g. eggless-cake-vs-ice-cream-cake-sydney (131), eggless-cake-reviews-sydney (91), birthday-cake-for-men-sydney (69), eggless-cake-low-fodmap-sydney (43), drip-cake-sydney (27), eggless-cakes-valentines-day-sydney (24), autumn-cake-sydney (21). The rest are suburb/occasion posts with <10 impr, which are better consolidated than boosted. | Matrix 13-22 for the earning ones.
- MED | Money-page spokes: /order has 234 inbound (all-template). /shop has 5 inbound, all from top-level pages, and no body link from any post. /indian-sweet has 29 inbound. No post names the 15 shop flavours as links to /shop. Status: not improved from last month. | Matrix 23-25.
- MED | Under-linked earners: same-day-cake-sydney (3 inbound, 399 impr, pos 8.7), eggless-cake-nut-free-sydney (4, 559 impr), eggless-cake-lower-sugar-options-sydney (4, 418 impr, 12 clicks), are-eggless-cakes-healthy (4, 349 impr, pos 5.3), cake-delivery-sydney (0 body inbound, 157 impr), eggless-cakes-telopea (2). | Matrix 3, 13-14.
- LOW | eggless-cake-storage-freshness-guide (2,965 impr, pos 6.0, 23 clicks, the top blog earner) has 9 inbound. The cluster is OK but could take 2 links to /order. | Optional.
- Positive | The top 5 pages' impressions have healthy inbound counts (home 11, soft-moist-myths 26, serving-size-guide 22, locations 219, about 23).

## Link matrix (source file | target URL | anchor | where to insert)
Highest value first. All sources and targets exist. Context is a suggestion, so confirm the paragraph exists before inserting.
1 | blog/eggless-cake-bakery-harris-park-riverstone-sydney.html | /blog/best-eggless-cake-shops-sydney-2026 | best eggless cake shops in Sydney | paragraph comparing options or "why choose us"
2 | blog/best-cake-sydney.html | /blog/best-eggless-cake-shops-sydney-2026 | our guide to the best eggless cake shops in Sydney | intro or conclusion
3 | blog/best-dessert-shop-sydney.html | /blog/best-eggless-cake-shops-sydney-2026 | best eggless cake shops | near the cake-shop mention
4 | blog/eggless-cakes-dean-park.html | /blog/best-eggless-cake-shops-sydney-2026 | best eggless cake shops across Sydney | "near me" paragraph
5 | blog/eggless-cakes-schofields.html | /blog/best-eggless-cake-shops-sydney-2026 | best eggless cake shops in Sydney | closing paragraph
6 | blog/eggless-cake-vs-regular-cake.html | /blog/best-eggless-cake-shops-sydney-2026 | where to buy eggless cake in Sydney | final section
7 | blog/cake-price-guide-sydney.html | /blog/best-eggless-cake-shops-sydney-2026 | compare eggless cake shops in Sydney | pricing comparison
8 | blog/halal-friendly-cakes-eggless-sydney.html | /blog/best-eggless-cake-shops-sydney-2026 | best eggless cake shops in Sydney | where-to-buy sentence
9 | blog/eggless-cake-indian-flavours.html | /blog/rasmalai-cake-sydney | our rasmalai cake | rasmalai mention
10 | blog/indian-sweets-harris-park-riverstone-sydney.html | /blog/rasmalai-cake-sydney | rasmalai cake | rasmalai mention
11 | blog/birthday-cake-north-west-sydney.html | /blog/rasmalai-cake-sydney | rasmalai cake | flavour list
12 | blog/anniversary-cake-sydney.html | /blog/rasmalai-cake-sydney | eggless rasmalai cake | flavour suggestion
13 | blog/eggless-cake-vs-regular-cake.html | /blog/eggless-cake-vs-ice-cream-cake-sydney | eggless cake vs ice cream cake | comparison paragraph
14 | blog/same-day-cake-sydney.html | /blog/eggless-cake-reviews-sydney | what customers say about our eggless cakes | trust sentence
15 | blog/eggless-cake-bakery-harris-park-riverstone-sydney.html | /blog/eggless-cake-reviews-sydney | Google reviews of our eggless cakes | social-proof section
16 | blog/corporate-cake-sydney.html | /blog/cake-delivery-sydney | cake delivery in Sydney | logistics paragraph
17 | blog/eggless-cake-nut-free-sydney.html | /blog/eggless-cake-low-fodmap-sydney | low FODMAP eggless cake | dietary-options sentence
18 | blog/are-eggless-cakes-healthy.html | /blog/eggless-cake-low-fodmap-sydney | low FODMAP eggless cake | dietary note
19 | blog/kids-birthday-cake-sydney.html | /blog/birthday-cake-for-men-sydney | birthday cakes for men | cross-audience line
20 | blog/number-cakes-sydney.html | /blog/drip-cake-sydney | drip cake | design-alternatives sentence
21 | blog/eggless-cake-flavours.html | /blog/eggless-red-velvet-cake-sydney | eggless red velvet cake | red velvet mention
22 | blog/eggless-cakes-riverstone.html | /blog/eggless-cake-bakery-harris-park-riverstone-sydney | eggless cake near me | location intro (consolidates the near-me head term)
23 | blog/eggless-cake-flavours.html | /shop | shop our 15 eggless flavours | end of flavour list (shop is noindex, so this is conversion, not SEO)
24 | blog/same-day-cake-sydney.html | /shop | ready-made flavours you can order online | order-timing paragraph
25 | blog/eggless-cakes-soft-moist-myths-vs-facts.html | /shop | pick a flavour and order online | CTA at the end
