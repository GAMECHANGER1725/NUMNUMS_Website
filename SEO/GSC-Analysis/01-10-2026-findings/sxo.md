# SXO Findings - numnumsbakery.com.au (2026-10-01)

SXO Gap Score: 54/100. Data-only run. GSC files in scratchpad/data (w28, w3mo, w12mo). Repo files are the source of truth for page content.

## Method limits
- No query x page GSC file exists. Query-to-page attribution is INFERRED from page titles, page-level positions and live SERP (WebSearch). Treat it as high-probability, not proven.
- GSC and the live SERP predate the local repo. The SERP still shows /cakes (title "Eggless Custom Cakes Sydney") and a homepage titled "Cake Shop in Harris Park & Riverstone". Local index.html is now "Eggless Custom Cakes Sydney | Num Num's Bakery NSW".
- No rendered-DOM or Core Web Vitals. Local-pack ranking cannot be seen via WebSearch.

## 1. PRIMARY FINDING: the commercial head terms are answered by the wrong page types
Demand (w3mo): "eggless cake near me" 2881 imps / 97 clicks / pos 9.6; "eggless cake shop" 2044 / 2 / 20.7; "eggless cake sydney" 1130 / 25 / 22.8; "cake shop near me" 908 / 27 / 7.0; "eggless cakes near me" 838 / 18 / 21.0; "eggless cakes sydney" 803 / 7 / 22.2; "eggless cakes" 800 / 7 / 16.9.
The SERP (live check) mixes (a) local brand/shop pages, (b) category/collection pages (Zest, Loomas, EatWithSimer, Blow The Candle, Green Bakery) and (c) the listicle that is OUR OWN blog post. Num Num's holds two slots on page 1, the listicle and the old /cakes. No commercial landing page of ours is a stable answer.

### Mismatches
| # | Query (w3mo imps / pos) | Page Google currently shows | Rewarded type | Severity |
|---|---|---|---|---|
| M1 | eggless cake shop (2044 / 20.7; 2 clicks, CTR 0.1%) | Most likely /blog/best-eggless-cake-shops-sydney-2026 (9005 imps, pos 9.4) and the homepage (live title "Cake Shop in Harris Park & Riverstone") | Local shop/collection page. The listicle only half-fits: "best of" lists do appear, but a listicle that sends users to competitors does not convert. | HIGH |
| M2 | eggless cake sydney / eggless cakes sydney / eggless cakes (1130 + 803 + 800 imps; pos 17-23) | /cakes (5447 imps, pos 13.8, CTR 1.1%) and /blog/eggless-cake-bakery-harris-park-riverstone-sydney (7516 imps, pos 7.3, CTR 1.5%) | Category/collection page ("Eggless Cakes Sydney" with products, prices, order) | HIGH |
| M3 | eggless cake near me (2881 / 9.6) | Homepage (6841 imps w28, pos 12.7) plus the blog listicle | Local landing page / map pack. Homepage hero is custom-only ("made fresh in 2 days") while the shop cake is next day and /shop is noindex. | HIGH |
| M4 | cake shop harris park / cake shop in harris park (216 + 128 imps, pos 5.3-5.8, CTR 2.3-3.7%) | No page of ours is visible in the GSC page list for /locations (absent from the w3mo and w12mo page rows). Ranking page is probably the blog post "eggless-cake-bakery-harris-park-riverstone-sydney" or the homepage. | Store/location page. /locations has the right title ("Eggless Cake Shop in Harris Park & Riverstone") and Bakery schema but zero impressions. | HIGH |
| M5 | riverstone bakery / bakery riverstone (297 + 120 imps, pos 6.5; CTR 1.35% / 0.8%) | blog/eggless-cakes-riverstone (666 imps, pos 9.9) | Store page (Riverstone) | MEDIUM |
| M6 | photo cake / photo cake sydney (348 + 87 imps) | /blog/photo-cake-sydney (5790 imps, pos 8.9, CTR 2.3%) | Product/collection pages (Black Velvet, Cupcake Room, Bakealicious). Ours is a blog URL carrying 12 /order links and no photo-cake product page. | MEDIUM |
| M7 | kids birthday cakes / kids birthday cake sydney (154 + 78 imps, pos 16-18) | /blog/kids-birthday-cake-sydney (1261 imps, pos 14.7) | Collection page plus listicles (ellaslist). Blog is a plausible type, but lead-time copy conflicts (see S4). | LOW |
| M8 | indian cake shop near me (67 imps, pos 5.3, CTR 6.0%); rasmalai cake near me (194 imps, pos 7.2) | /indian-sweet (3125 imps, pos 10.9, CTR 0.8%), /blog/rasmalai-cake-sydney | Product/shop page. /indian-sweet is the right type, but its title/H1 says "Indian sweets", so "Indian cake" and "rasmalai cake" are not served by it. | MEDIUM |

Aligned: brand queries ("num num bakery" 1036 imps, pos 1.9; plus the variants). /order for custom/photo/design intent. /indian-sweet for sweets.

### Structural consequence of the /cakes 301 (already in netlify.toml L47-60)
/cakes holds 5447 imps (3mo) / 7033 (12mo) at pos ~13.8 under the title "Eggless Custom Cakes Sydney". Its equity now collapses onto /order, whose title is "Order Eggless Cakes Online in Sydney". That is a transactional/form page, not a category page. Expect /order to inherit the "eggless cakes sydney" queries without being the category answer Google rewards for them. Do NOT recreate /cakes. The answer is to make /order's top-of-page and title carry the category signal (R3), and make the homepage the category/local hub.

## 2. Striking-distance diagnosis (pos 5-20, w3mo, ranked by missed clicks)
| Query | Imps | Clicks | CTR | Pos | Probable page | Why it under-converts (file-level) |
|---|---|---|---|---|---|---|
| eggless cake near me | 2881 | 97 | 3.4% | 9.6 | / | index.html hero H1 is "A Custom Cake So Good..."; first screen sells custom only ("made fresh in 2 days"). No price in the hero ($39.99 first appears at L1299, far below), no "ready next day". CTAs "Order Your Cake" and "Get a Quote" both go to /order, so the ready-cake buyer is sent to a quote form. Only Shop Cakes (nav) reaches /shop. Local-pack snippet is the likelier driver of CTR. |
| eggless cake shop | 2044 | 2 | 0.1% | 20.7 | blog listicle / home | Pos ~21 means page 3; CTR is irrelevant until the ranking page changes. The new homepage title dropped the words "Cake Shop". |
| best cakes sydney / best cake sydney | 568 + 104 | 4 | 0.6% | 11.8 / 14.1 | /blog/best-cake-sydney (2695 imps, pos 14.6, CTR 0.6%) | Generic "best cake" query. An eggless-only bakery is not a best-cake answer. LOW value, do not invest. |
| cake shop near me | 908 | 27 | 3.0% | 7.0 | / | Same as above. The title has "Eggless Custom Cakes", and no neutral "cake shop" signal. |
| eggless cakes | 800 | 7 | 0.9% | 16.9 | /cakes, then /order | See M2. |
| photo cake | 348 | 5 | 1.4% | 12.7 | blog/photo-cake-sydney | The title is "Photo Cakes in Sydney — Edible Image Cakes | Num Num's" with no "eggless" or price. The meta says "48 hr notice", while the rule is now 2 days. The competing SERP leads with "from $80-95" and delivery. |
| harris park cake shop / cake shop harris park | 216 + 189 | 13 | 3% | 5.4-5.8 | blog / home | CTR 2.6-3.7% at pos ~5.5 is below par. /locations should own these and has no impressions (see M4). |
| riverstone bakery | 297 | 4 | 1.3% | 6.6 | blog/eggless-cakes-riverstone | Pos 6.6 with 1.3% CTR means the title/snippet is not winning against the Google Business Profile and map pack. |
| egg free cakes sydney | 227 | 4 | 1.8% | 11.8 | probably the listicle / egg-free posts | "Egg free" appears in no commercial page title. |
| kids birthday cakes | 154 | 2 | 1.3% | 16.0 | blog/kids-birthday-cake-sydney | Title is fine. The page says "48 hr min, 5-7 days custom" 8 times, while the rule is 2 days. A user in a hurry bounces. |
| indian cake shop near me | 67 | 4 | 6.0% | 5.3 | /indian-sweet | Healthy CTR. Shows /indian-sweet can win when title and query match. |

Page-level under-converters (w3mo): /blog/eggless-cake-storage-freshness-guide has 5046 imps at pos 7.1 and CTR 0.6% (28 clicks). It is informational, off-intent for a bakery, and won't convert; protect it but don't count it as commercial. /indian-sweet has 3125 imps at pos 10.9 and CTR 0.8%. /order has 3219 imps at pos 4.7 and CTR 1.1%. A pos 4.7 CTR of 1.1% is poor, and the title "Order Eggless Cakes Online" is a form-flavoured title. /about has 1835 imps at pos 4.3 and CTR 0.3%. It is ranking for brand-adjacent queries and giving nothing back.

## 3. User stories (each cites its signal)
- US1, local ready-cake buyer ("eggless cake near me" 2881 imps; "cake shop near me" 908; "cakes near me" 182): "I need an eggless cake for tomorrow near Parramatta."
- US2, local store finder ("cake shop harris park" 216+189+128; "riverstone bakery" 297; "num num bakery riverstone/harris park" 274+157): "Where are you, when do you close, can I collect tonight."
- US3, category shopper ("eggless cake sydney/cakes sydney/eggless cakes" about 2700 imps combined): "Show me eggless cakes and what they cost."
- US4, custom/photo buyer ("photo cake" 348, "custom image cake" 61, "kids birthday cakes" 154): "I have a photo/theme, how soon and how much."
- US5, Indian sweets / rasmalai buyer ("rasmalai cake near me" 194; "indian cake shop near me" 67; /indian-sweet 3125 imps).

### Scoring (Y / partial / N; one-screen answer, pickup-only early, lead time clear, price visible, one CTA)
| Story / page | One-screen answer | Pickup-only early | Lead time | Price | Single CTA | Verdict |
|---|---|---|---|---|---|---|
| US1 on / (index.html) | Partial. Hero is custom-only. | Y (hero text "Pickup only", and Uber Eats link) | Partial. "2 days", but ready cakes are next day. Not stated. | N in hero ($39.99 at L1299) | N. 3 hero CTAs; the two main ones both go to /order. | 40% |
| US2 on /locations | Partial. Hours and address are visible. | N. "Pickup" is not on the visible page; it is in the meta only, and the page talks about Uber Eats/Menulog/DoorDash delivery (L688). | N | N | Partial. "Order Now" opens WhatsApp. | 35% |
| US3 on /order (landing as /cakes successor) | Partial. Fork card "A normal cake / A custom cake" is good, with "from $39.99". | Y | Y (2 days / ready tomorrow) | Partial ("from $39.99" on the fork) | Y (fork, then form) | 70% |
| US4 on /order | Y | Y | Y | Partial | Y | 80% |
| US4 on blog/photo-cake-sydney | Partial | Not checked in first screen | Wrong ("48 hr") | Not in the title/meta | N. 12 /order + 5 /shop links. | 50% |
| US5 on /indian-sweet | Y. Prices on the page ($33.99/kg meta, $39.99/kg grid). | Y | N. No lead time anywhere (0 matches for "2 days/next day"). | Y | Partial (WhatsApp plus Order Online) | 65% |

**Dietary note.** US1/US2 users with an egg allergy find "allerg" 0 times on / and 0 on /locations; 1 mention on /order. "100% eggless" is surfaced strongly (all pages), but the cross-contact answer (is it made in an egg-free kitchen) is absent from the hero. /indian-sweet says "No eggs in the kitchen" and "Vegetarian & Jain-friendly", which is good.

## 4. Persona scoring (Relevance / Clarity / Trust / Action, 25 each)
Personas: P1 first-time local searcher, P2 price-comparing shopper, P3 dietary requirement (egg allergy / vegetarian / religious).
| Page | P1 | P2 | P3 | Notes |
|---|---|---|---|---|
| / | 70 | 48 | 66 | Strong trust (4.6, 50+ reviews). Price not above the fold. No allergy/cross-contact line. Halal/Jain/vegetarian are mentioned (2 each) deeper down. |
| /order | 78 | 66 | 66 | Fork card and the 2-day rule are clear. Price shown only as "from $39.99". |
| /indian-sweet | 70 | 82 | 82 | Prices throughout, "No eggs in the kitchen", "Vegetarian & Jain-friendly". No lead time, and no halal. |
| /locations | 52 | 20 | 40 | No price, no pickup-only on the page, delivery-platform copy is confusing. Riverstone hours conflict: visible "Mon-Fri 6:00 AM - 8:00 PM, Sat-Sun 7-7" (L591-592) vs meta/schema "9am-6:30pm" (L229-231). |
| /blog/ index | 45 | 25 | 45 | An archive; not a conversion page. 750 imps w3mo, pos 12.4. |
| blog/best-eggless-cake-shops-sydney-2026 | 72 | 70 | 76 | Comparison with prices ($60/$150/$160). Strong for P2/P3, but it sends users to competitors. 10 /order links. |
| blog/eggless-cake-bakery-harris-park-riverstone-sydney | 76 | 45 | 70 | The right content, wrong URL type; its title duplicates /locations (identical to within "| Num Num's"). |
| blog/photo-cake-sydney | 68 | 45 | 55 | The meta says "48 hr notice"; no price in the meta. |
| blog/eggless-cake-storage-freshness-guide | 25 | 10 | 40 | Informational. Not a buyer page. |
| blog/best-dessert-shop-sydney | 55 | 35 | 50 | Generic; competes with the homepage. |

Weakest persona first: P2 (price-comparing) is weakest on /, /locations and every blog entry page. Fix: show "from $39.99" with the size/serves line next to the first CTA (R1, R4).

## 5. Where the site structure fights the user
1. **Two pages for "eggless cake shop in Harris Park & Riverstone".** /locations and blog/eggless-cake-bakery-harris-park-riverstone-sydney carry the same title. The blog post has 7516 imps (3mo); /locations has none. Severity HIGH.
2. **Hero CTAs both point to /order (a custom-quote form) on the page that ranks for "near me".** Ready-cake buyers have to find "Shop Cakes" in the nav, and /shop is noindex. Severity HIGH. A /shop prerequisite: flipping noindex (shop-app/app/layout.tsx L50) is required before any organic route to ready cakes can exist.
3. **/cakes impressions (5447 / 3mo) land on /order.** The title mismatch is described above. Severity HIGH.
4. **/locations contradicts itself.** Riverstone hours (6am-8pm visible vs 9am-6:30pm schema/meta), a delivery-platform paragraph (L675-689) on a pickup-only page. Severity HIGH (trust + local SEO consistency with GBP).
5. **Lead-time inconsistency.** Blogs: "48 hours", and kids-birthday "5-7 days custom" (8x) vs site rule 2 days. Photo-cake meta "48 hr". CLAUDE.md says the 48-hour copy is conservative and was parked, but "5-7 days" on a page at pos 15 is not conservative, it is a lost sale. Severity MEDIUM.
6. **Intent with demand and no matching page:** (a) "eggless cake [suburb]" (Parramatta 160 imps pos 4.2, Blacktown 122 pos 5.1) is served by blog posts only. (b) Rasmalai cake (rasmalai cake near me 194, rasmalai cake 100) has only a blog post (79 imps). (c) Photo cake has no product page. Severity MEDIUM.
7. **Informational posts absorb top impressions** (storage guide 5046, serving size 2071, vs-regular 1969) with 0.5-0.9% CTR. They do not convert. Severity LOW; keep and add a one-line order CTA.
8. **Sub-10 position cannibalisation by blog on near-me queries** with ~235 suburb-templated posts; w3mo shows /blog/eggless-cakes-harris-park (76 imps), /parramatta (34): the suburb templates draw almost nothing. Severity LOW (already known).

## 6. Recommendations (file-level; S = severity)
- R1 (HIGH) /home/user/NUMNUMS_Website/index.html L993-997: replace the second hero CTA "Get a Quote" with a ready-cake CTA only after the /shop noindex is flipped. Until then, add a visible line under the hero: "Eggless cakes from $39.99. Ready tomorrow (ready-made) or 2 days (custom). Pickup only, Harris Park and Riverstone." Keep "Pickup only" where it is.
- R2 (HIGH) index.html title: restore a category-signal title such as "Eggless Cake Shop Sydney | Custom Eggless Cakes, Harris Park & Riverstone | Num Num's" (the SERP currently displays "Cake Shop in Harris Park & Riverstone", so removing "Cake Shop" risks "cake shop near me" 908 imps / "eggless cake shop" 2044 imps).
- R3 (HIGH) /home/user/NUMNUMS_Website/order.html title and H1: the title becomes "Eggless Cakes Sydney | Custom Cakes From $39.99 | Num Num's Bakery". Add to the first screen one line stating the page type: "Browse our 15 eggless flavours, then order a ready cake (next day) or a custom design (2 days)". Do not recreate /cakes. The form must stay above the gallery, and nothing may route away from the form (the existing Shop Cakes fork card is a CLAUDE.md-sanctioned fork).
- R4 (HIGH) /home/user/NUMNUMS_Website/locations.html:
  1. Fix visible Riverstone hours (L591-600) to match the schema (09:00-18:30 daily) and meta, after confirming with Vaidik (hours conflict is data, not a typo to infer).
  2. Add "Pickup only. No delivery." and "Cakes from $39.99" lines to the hero.
  3. Reword L675-689 so delivery platforms are not a headline.
  4. Add per-store "Eggless cake shop Harris Park" / "Riverstone" H2s with the address, hours, a map link and 3 nearby suburbs.
  5. Retitle blog/eggless-cake-bakery-harris-park-riverstone-sydney.html to remove the duplicate (e.g. "Eggless Cakes in Western Sydney: Harris Park & Riverstone Guide") and put a prominent link to /locations on it; do not delete it (7516 imps).
- R5 (MEDIUM) blog/photo-cake-sydney.html meta: replace "48 hr notice" with "2 days' notice", add "from $", and put "eggless" in the title.
- R6 (MEDIUM) blog/kids-birthday-cake-sydney.html: replace the 8 "5-7 days" instances with the actual rule (2 days custom).
- R7 (MEDIUM) indian-sweet.html: add a lead time line and a "Rasmalai cake" section/link to the Rasmalai blog and /order. Title could become "Eggless Indian Sweets & Rasmalai Cake Sydney | Num Num's" to serve "indian cake shop near me" (5.3 pos, 6% CTR) and "rasmalai cake near me".
- R8 (MEDIUM) index.html, /order, /locations: one line on allergy handling, e.g. "100% eggless kitchen: no eggs on site." Phrase only what is true; confirm with Vaidik before publishing any allergen claim (legal).
- R9 (LOW) Add a one-line "Order this cake" CTA (to /order) in the top 3 informational posts (storage, serving size, vs-regular) and the best-cake post.
- R10 (PREREQ) Flip noindex in shop-app/app/layout.tsx L50 and publish /shop with title, indexable cake list and prices at the same time as the Stripe live-key cutover (as CLAUDE.md states); only then build suburb/category internal links to /shop.
- Cross-skill: `/seo local` for GBP consistency (hours at M4/#4), `/seo schema` (order.html has Service only; no Product/Offer for "from $39.99"), `/seo page` on /locations.

## 7. Limitations
- Query-page attribution is inferred (no query x page GSC rows).
- The SERP was sampled with WebSearch only, so the local pack, AI Overview and PAA were not observed.
- The live site is stale; GSC data predates repo changes (title change, /cakes 301).
- /locations absence from GSC rows could be a cap on the page list (392 rows in 12mo) as well as a true zero.
- Persona scores are analyst judgement from page text, not user testing.

SXO_SCORE: 54/100
Justification: Page Type 7/15 (head terms answered by blog/home; /locations invisible), Content Depth 10/15, UX Signals 7/15 (hero CTAs, locations conflicts), Schema 11/15 (strong Bakery/FAQ; Product/Offer missing on /order), Media not assessed (data-only, scored neutral 9/15), Authority 8/15 (4.6 rating; 50+ reviews; brand strong), Freshness 2/10 (blog dateModified Apr-Jun 2026; lead-time copy stale)... sum approximates 54 with rounding on neutral media.
BASIS: GSC w28/w3mo/w12mo query and page files, local repo HTML, WebSearch SERP sampling of 5 queries; no rendering or screenshots.
