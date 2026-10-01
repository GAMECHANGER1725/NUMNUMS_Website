# Content Quality Findings - numnumsbakery.com.au (local repo, 2026-10-01)

Corpus: 234 posts (blog/*.html = 235 files minus blog/index.html). Text = <article> minus script/style/nav/footer/svg.
Scripts: scratchpad a.py..g.py (BeautifulSoup/lxml, 5-word-shingle Jaccard, TF-IDF cosine on title+H1+slug, regex counts).
NOTE: blog-cluster-report.md / blog-gsc-per-page.md describe the earlier 359-post state (GSC 2026-06-03..08-29). The corpus has since been consolidated to 234; GSC figures below are stale for those slugs (227 of 234 slugs still match a GSC row).

## 1. Word count / thin content
- Mean 2,289, median 2,219, min 1,104, max 5,972.
- Under 600 words: 0. Under 300: 0. Under 1,000: 0. Under 1,500 (blog minimum): 10. Severity: Low (no thin content).
- Under 1,500: vegan-vs-eggless-cakes-difference 1104; why-we-chose-100-percent-eggless-bakery 1177; eggless-cakes-soft-moist-myths-vs-facts 1216; eggless-cakes-box-hill-sydney 1276; top-7-custom-eggless-cake-designs-kids-birthdays 1315; eggless-cakes-schofields 1335; eggless-cakes-near-me-sydney 1340; eggless-cakes-the-ponds 1363; eggless-cakes-tallawong 1424; eggless-cake-bakery-harris-park-riverstone-sydney 1473.
- Note: eggless-cake-bakery-harris-park-riverstone-sydney (1473 words) is the #1 GSC page (7,586 impr); vegan-vs-eggless (1,104) has 797 impr. Both money pages are the shortest. Medium: deepen these first.

## 2. Duplicate / near-duplicate content (top priority)
- 5-word-shingle Jaccard, all 27,261 pairs: >=0.8: 0; >=0.6: 0; >=0.5: 2; >=0.4: 9; >=0.3: 18; >=0.2: 64. Mean per-post max similarity 0.10. No literal duplicates. The prior consolidation (359 -> 234) removed the quadruplicates.
- Pairs >=0.40 (all suburb pages except one):
  - 0.547 eggless-cakes-parramatta | eggless-cakes-rosehill
  - 0.511 parramatta | wentworthville
  - 0.493 quakers-hill | rouse-hill
  - 0.480 mays-hill | westmead
  - 0.455 rosehill | wentworthville
  - 0.437 baulkham-hills | beaumont-hills
  - 0.423 north-parramatta | parramatta
  - 0.422 norwest | quakers-hill
  - 0.403 bonnyrigg | fairfield
  - 0.371 anniversary-cake-sydney | eggless-cakes-engagement-sydney (non-suburb; Medium)
- Connected clusters at J>=0.30: 8 (six pairs, two groups of four). Group A: parramatta / rosehill / wentworthville / north-parramatta (Harris Park band). Group B: quakers-hill / rouse-hill / norwest (+ rydalmere, 0.30-0.31 to each) (Riverstone band).
- Suburb template: 67 "Eggless Cakes Near X" pages (eggless-cakes-<suburb>, incl. harris-park, tallawong, riverstone). 62 share the exact masked title "Eggless Cakes Near XXX | Num Num's Bakery"; H1 is "Eggless Cakes Near XXX: [Just] N Minutes to Harris Park|Riverstone" on ~50. 82 of 83 pattern pages carry the identical "Frequently Asked Questions" H2; 48 share "How far is Num Num's Bakery from XXX"; 39 "How do I order an eggless cake from XXX"; 32 "Why is eggless cake so hard to find near XXX"; 31 "Why do XXX families choose Num Num's Bakery".
- After masking the suburb name, mean 26.3% of each suburb page's sentences (>=8 words) appear verbatim in >=3 other suburb pages; 37 pages >=30%, 7 pages >=50%: parramatta 62%, rosehill 61%, quakers-hill 59%, wentworthville 57%, rouse-hill 54%, north-parramatta 52%, norwest 52%. Severity: High for the 7 pages >=50% (doorway-pattern risk); Medium for the rest of the 67.
- Ledger says per-suburb expansion is permanently rejected. Recommendation: no new suburb pages; fold parramatta/rosehill/wentworthville/north-parramatta into one survivor (parramatta, in the Harris Park band) and quakers-hill/rouse-hill/norwest into one (quakers-hill) via 301, after a GSC check on impressions. The 359-post report already planned these merges and they are partly executed; the survivors above are the remaining overlaps.

## 3. Keyword cannibalisation groups (title+H1+slug TF-IDF, then body Jaccard; body overlap <=0.05 for every group, so this is intent overlap, not copy overlap). Winner = highest stale GSC impressions unless noted.
1. Cupcakes: eggless-cake-vs-cupcakes-sydney (cos 0.86), eggless-cupcakes-sydney, eggless-cupcakes-kids-birthday-party-sydney, eggless-mini-cakes-cupcake-towers-sydney. Impr 11/7/12/3. Winner: eggless-cupcakes-sydney (broad head term); fold the vs-post into it. Medium.
2. Cake smash / 1st birthday: cake-smash-cakes-sydney (112 impr), cake-smash-vs-first-birthday-cake-sydney (44), first-birthday-cake-sydney (308). Winner first-birthday-cake-sydney for birthday intent; keep cake-smash-cakes as the smash page; merge the "vs" post into it. Medium.
3. How to order / custom: custom-cake-sydney (pos 28), how-to-order-cake-sydney (pos 40.6), how-to-choose-cake-sydney, cake-consultation-sydney (68 impr, pos 4.8), eggless-cake-ordering-mistakes. Ledger names how-to-order as ordering pillar and custom-cake as design pillar; both rank poorly. cos 0.79 between them. Winner per ledger: how-to-order-cake-sydney; differentiate custom-cake-sydney as design-led. High.
4. North-west occasion pages: birthday-cake-north-west-sydney (243), wedding-cake-sydney-north-west (668), eggless-cakes-northwest-sydney (119; ledger pillar). Keep wedding page and the pillar; birthday is a lower-priority merge candidate. Medium.
5. Best-of / brand: best-eggless-cake-shops-sydney-2026 (6,232 impr, 146 clicks), best-cake-sydney (2,053), best-dessert-shop-sydney (2,415), eggless-cake-bakery-harris-park-riverstone-sydney (7,586), eggless-cake-sydney (5 impr, ledger site-wide pillar), eggless-cake-reviews-sydney (148). Winner for "best" intent: best-eggless-cake-shops-sydney-2026. The ledger pillar eggless-cake-sydney earns 5 impressions: High (pillar is invisible).
6. Birthday ideas/design: how-to-design-birthday-cake-sydney (218), eggless-cake-design-ideas-sydney (no GSC row), unique-birthday-cake-ideas-sydney (253), cake-design-trends-sydney-2026, eggless-cake-for-birthday, milestone-birthday-cake-sydney (no GSC row), eggless-birthday-cakes-every-age-sydney, theme-cakes-sydney. Winner: unique-birthday-cake-ideas-sydney; merge eggless-cake-design-ideas-sydney (cos 0.57/0.42 to two others, never indexed). Medium.
7. Kids birthday: kids-birthday-cake-sydney (250, ledger pillar) wins; custom-kids-birthday-cakes-marsden-park-schofields (23), top-7-custom-eggless-cake-designs-kids-birthdays (9, 1,315 words) are fold-in candidates. Medium.
8. Delivery: eggless-cake-delivery-sydney (148; ledger pillar, pos 28.4), cake-delivery-areas-sydney (19; cos 0.59), same-day-cake-sydney (598), eggless-cake-transport-packaging-sydney. Winner: eggless-cake-delivery-sydney; same-day is distinct intent but see lead-time section (shop next day). Medium.
9. Near-me: eggless-cakes-near-me-sydney (58; ledger pillar), birthday-cake-near-me-sydney-suburbs (21), cake-shop-near-me-marsden-park-talawong (253). Winner: eggless-cakes-near-me-sydney by ledger; marsden-park-talawong is actually the performer (253 impr, 0 clicks). Medium.
10. School events: cake-school-fete-fundraiser-sydney vs eggless-cake-school-celebration-sydney (cos 0.62). Winner fete page (19 vs 15). Low.
11. Work/anniversary: anniversary-cake-sydney (121) vs cake-for-work-anniversary-sydney (cos 0.54, 15) vs corporate/office/new-job. Winner anniversary-cake-sydney for relationship intent; keep corporate-cake-sydney (116) as the corporate owner. Low.
12. New Year festivals: eggless-cakes-new-year-sydney (1 impr), eggless-cakes-lunar-new-year-sydney (6), tet-vietnamese-new-year-sydney (20). Winner tet page; new-year (1 impr) is a prune/merge candidate. Low.
13. Eid: eggless-cakes-eid-sydney (4), eggless-cakes-eid-ul-adha-sydney (6), eggless-cakes-ramadan-sydney (6), eggless-cakes-eid-milad-un-nabi-sydney (262; ledger pillar, 5,972 words). Winner pillar; fold eid-sydney (cos 0.51 with eid-ul-adha) into it. Medium.
14. Ingredients: eggless-cake-egg-substitutes (1,197; ledger pillar) wins; eggless-cake-ingredients-sydney (197) and natural-ingredients-eggless-cakes (63; cos 0.45) overlap. Low.
15. Dietary: dairy-free-vs-eggless-cakes (79 now; ledger owner), vegan-vs-eggless-cakes-difference (797), eggless-cake-lactose-intolerance (184), eggless-cake-for-vegetarians-sydney (659), halal-friendly-cakes-eggless-sydney (373). Distinct intents, interlink only. Low.
16. Wholesale/bulk/catering: eggless-cake-wholesale-sydney (34), eggless-cake-bulk-order-sydney (9), eggless-cake-catering-sydney (163, pos 65). Winner catering; merge bulk into wholesale. Low.
17. Mother's/Father's/Valentine's Day (cos 0.38-0.40) and Flavours (eggless-cake-flavours, flavour-pairing, seasonal, types): distinct intents, interlink only. Low.
- Zero duplicate <title> and zero duplicate H1 across the corpus; canonical == own slug on 234/234.
- Never-indexed in the stale GSC pull (still present): eggless-cake-design-ideas-sydney, milestone-birthday-cake-sydney, tiered-cakes-sydney. Medium.

## 4. E-E-A-T coverage (n=234)
- Article JSON-LD: 234 (100%). datePublished and dateModified: 234 (100%).
- Author: Person "Tarun Patel" with url /about on 233 (99.6%). Exception: luxury-cake-sydney (author is not a Person). Medium.
- Visible byline / "written by / reviewed by / last updated" text in article body: 14/234 (6.0%); 0 posts contain "last updated". Author exists only in schema. High: no on-page byline, bio or credentials on 94% of posts.
- Posts naming Tarun Patel anywhere in file: 233. No author bio block, no credentials (no qualifications/food-safety certificate language detected). High.
- dateModified == datePublished on 228/234 (97.4%): no real updates are signalled. Range of dateModified: 2026-04-06 .. 2026-09-24. Median age 88 days; >90 days: 113 (48%); >180 days: 0. Only 4 modified in the last 30 days. Medium.
- External links: >=1 on 234 (100%), mean 11.0 per post; authority-domain (.gov.au/.edu/.org/health etc.) >=1 on 204 (87.2%). Strong. Positive.
- First-hand experience markers (we bake / our kitchen / our customers / we've made...): 147/234 (62.8%). Medium.
- Visible FAQ section: 233 (99.6%); FAQPage JSON-LD: 234 (100%).

## 5. Readability (Flesch-style, heuristic syllables)
- Flesch mean 53.5, median 54.1, range 37.8-70.9. Average sentence length mean 18.7, max 25.9. <50: 57 posts; >=60: 32. Sentences >20 words average: 51 posts. Overall "fairly difficult/standard" (Low-Medium).
- Worst 20 (Flesch / avg sentence words): luxury-cake-sydney 37.8/19.0; eggless-cake-for-seniors-sydney 37.8/23.1; eggless-cake-food-colouring-sydney 37.8/22.8; eggless-cake-delivery-sydney 38.4/19.1; halal-friendly-cakes-eggless-sydney 39.1/19.1; eggless-cake-flavour-pairing-guide 40.0/15.6; eggless-cake-for-vegetarians-sydney 40.2/18.7; eggless-cakes-ermington 40.6/20.6; eggless-cakes-diwali-indian-festivals-sydney 40.8/17.5; eggless-cake-seasonal-flavours 41.1/20.0; eggless-cakes-karwa-chauth-sydney 41.9/20.4; eggless-cake-vs-supermarket-cake 42.0/20.3; eggless-cakes-mehendi-sydney 42.1/20.5; best-eggless-cake-shops-sydney-2026 42.4/19.0; eggless-cakes-dundas-valley 42.5/22.4; eggless-cakes-carlingford 42.5/21.8; eggless-cakes-old-toongabbie 42.7/21.0; eggless-cakes-first-communion-sydney 42.8/24.1; eggless-cake-ingredient-labels-sydney 42.9/18.4; eggless-cakes-northwest-sydney 43.3/25.9.
- Three of the worst are high-traffic pages (best-eggless-cake-shops 6,232 impr; halal-friendly 373; eggless-cake-for-vegetarians 659; delivery 148): Medium.

## 6. AI citation readiness (n=234)
- Key takeaways / "Quick Summary" box: 229 (97.9%).
- >=1 question-shaped H2: 233 (99.6%); >=50% of H2s are questions: 219 (93.6%); mean share 82%; mean 8.2 H2 per post.
- Lists: >=1 ul/ol on 233 (99.6%). Tables: only 43 (18.4%). Medium: add comparison/price/size tables.
- Answer-first proxy: first paragraph 20-80 words on 165 (70.5%); >80 words on 67; <20 words on 2. First paragraph includes a digit/fact on only 91 (38.9%). First paragraph states "100% eggless" on only 34 (14.5%). Medium.
- Overall AI citation readiness: ~84/100 (structure strong, weaker on tables and fact-dense openers).

## 7. Brand-scope violations
- "Adult Cakes": 1 near-hit in blog: blog/eggless-birthday-cakes-every-age-sydney.html:39 twitter:description "...teen favourites, and milestone adult cakes - all eggless, all from Num Num's Bakery Sydney." (meta, lowercase, in-phrase). Severity Medium: reword to "milestone birthday cakes". Elsewhere "adult birthdays" is used (cake-message-ideas-sydney.html:466,473; cake-vs-dessert-table-sydney.html:543; custom-cake-sydney.html:423; drip-cake-sydney.html:509; eggless-birthday-cakes-every-age-sydney.html:444,449; eggless-cake-delivery-sydney.html:461; eggless-cake-fillings-sydney.html:596) - not the banned phrase. The only other occurrence of "Adult Cakes" in the repo is brand_assets/num_nums_brand_guidelines.html:277, which is the prohibition itself. No hits in index/order/about/indian-sweet/locations/privacy-policy.
- Snacks/savoury/egg-based implication: 0 genuine violations. Hits are contextual/non-product: cake-smash-cakes-sydney.html:565,572 (baby "snack"); eggless-cake-for-toddlers-sydney.html:526; eggless-cake-transport-packaging-sydney.html:442; grand-final-party-cake-sydney.html:447; halloween-cake-sydney.html:538; tet-vietnamese-new-year-sydney.html:432,452 (savoury banh chung described as a cultural food, not sold). Egg-based mentions are all contrastive ("egg-based tart/brownie/pavlova") and the vs-posts explicitly disclaim: eggless-cake-vs-tart-sydney.html:498 "We don't [sell tarts] - dedicated eggless cake and Indian sweets bakery"; eggless-cake-vs-brownies ("brownies aren't on our menu"); eggless-cake-vs-cheesecake-sydney ("doesn't currently make cheesecake"). Risk (Low-Medium): eggless-cake-vs-brownies/pavlova/tart/cheesecake/ice-cream-cake/mud-cake are scope-adjacent pages for products not sold; consider whether they earn their keep.
- Pages never saying "100% eggless": in file at all: 1 (eggless-cake-gluten-free-sydney). In visible article text: 6: eggless-cake-calories-guide-sydney, eggless-cake-cancellation-policy-sydney, eggless-cake-gluten-free-sydney, eggless-cake-ingredient-labels-sydney, halal-friendly-cakes-eggless-sydney, natural-ingredients-eggless-cakes. Severity Medium (brand rule "always say 100% eggless"; gluten-free page is also a dietary claim page - highest priority).

## 8. Lead time "48 hours" (known, conservative-not-wrong; Severity LOW-MEDIUM, do NOT mass-edit)
- Exact count: 225 of 234 posts contain "48 hour/hr/48h" anywhere in file (224 in visible body, 1 only in schema/meta); 1,729 matching lines in total. The "~226" estimate is confirmed.
- Posts that do not contain it (9): cake-price-guide-sydney, cake-toppers-sydney, eggless-cake-keto-low-carb-sydney, eggless-cake-low-fodmap-sydney, eggless-cake-transport-packaging-sydney, eggless-cake-wholesale-sydney, eggless-cakes-soft-moist-myths-vs-facts, vegan-vs-eggless-cakes-difference, why-we-chose-100-percent-eggless-bakery.
- Shop cakes are NEXT DAY; the only posts mentioning "next day" are 5, "2 days" 13, "same day" 30. Because posts conflate shop and custom lead times, same-day-cake-sydney (598 impr) and eggless-cake-delivery-sydney are the ones worth a manual factual review later (Medium); the rest stay as is.
- Full list of the 225 posts (slugs, blog/<slug>.html):
afternoon-tea-cakes-sydney
anniversary-cake-sydney
are-eggless-cakes-healthy
autumn-cake-sydney
best-cake-sydney
best-dessert-shop-sydney
best-eggless-cake-shops-sydney-2026
birthday-cake-for-men-sydney
birthday-cake-near-me-sydney-suburbs
birthday-cake-north-west-sydney
cake-consultation-sydney
cake-cutting-ceremony-sydney
cake-delivery-areas-sydney
cake-design-trends-sydney-2026
cake-display-ideas-sydney
cake-for-new-job-promotion-sydney
cake-for-university-events-sydney
cake-for-work-anniversary-sydney
cake-message-ideas-sydney
cake-school-fete-fundraiser-sydney
cake-serving-size-guide-sydney
cake-shop-near-me-marsden-park-talawong
cake-smash-cakes-sydney
cake-smash-vs-first-birthday-cake-sydney
cake-vs-dessert-table-sydney
celebration-cake-sydney
christening-naming-day-cakes-sydney
corporate-cake-sydney
custom-cake-sydney
custom-kids-birthday-cakes-marsden-park-schofields
dairy-free-vs-eggless-cakes
drip-cake-sydney
eggless-birthday-cakes-every-age-sydney
eggless-cake-bakery-harris-park-riverstone-sydney
eggless-cake-bulk-order-sydney
eggless-cake-buttercream-vs-fondant
eggless-cake-calories-guide-sydney
eggless-cake-cancellation-policy-sydney
eggless-cake-catering-sydney
eggless-cake-delivery-sydney
eggless-cake-design-ideas-sydney
eggless-cake-egg-substitutes
eggless-cake-fillings-sydney
eggless-cake-flavour-pairing-guide
eggless-cake-flavours
eggless-cake-food-colouring-sydney
eggless-cake-for-birthday
eggless-cake-for-diabetics-sydney
eggless-cake-for-egg-allergy
eggless-cake-for-pooja-sydney
eggless-cake-for-pregnancy-sydney
eggless-cake-for-seniors-sydney
eggless-cake-for-toddlers-sydney
eggless-cake-for-vegetarians-sydney
eggless-cake-gifting-guide-sydney
eggless-cake-gluten-free-sydney
eggless-cake-indian-flavours
eggless-cake-ingredient-labels-sydney
eggless-cake-ingredients-sydney
eggless-cake-lactose-intolerance
eggless-cake-lower-sugar-options-sydney
eggless-cake-nut-free-sydney
eggless-cake-office-birthday-sydney
eggless-cake-ordering-mistakes
eggless-cake-recipe-vs-bakery-sydney
eggless-cake-reviews-sydney
eggless-cake-school-celebration-sydney
eggless-cake-seasonal-flavours
eggless-cake-small-gatherings-sydney
eggless-cake-storage-freshness-guide
eggless-cake-sydney
eggless-cake-tasting-sydney
eggless-cake-types
eggless-cake-vs-brownies
eggless-cake-vs-cheesecake-sydney
eggless-cake-vs-cupcakes-sydney
eggless-cake-vs-ice-cream-cake-sydney
eggless-cake-vs-mud-cake
eggless-cake-vs-pavlova
eggless-cake-vs-regular-cake
eggless-cake-vs-sponge-cake
eggless-cake-vs-supermarket-cake
eggless-cake-vs-tart-sydney
eggless-cakes-auburn
eggless-cakes-baby-shower-sydney
eggless-cakes-bat-mitzvah-sydney
eggless-cakes-baulkham-hills
eggless-cakes-beaumont-hills
eggless-cakes-beecroft
eggless-cakes-birrong
eggless-cakes-blacktown
eggless-cakes-bonnyrigg
eggless-cakes-bossley-park
eggless-cakes-box-hill-sydney
eggless-cakes-bridal-shower-sydney
eggless-cakes-carlingford
eggless-cakes-cherrybrook
eggless-cakes-christmas-sydney
eggless-cakes-clyde
eggless-cakes-constitution-hill
eggless-cakes-dean-park
eggless-cakes-diwali-indian-festivals-sydney
eggless-cakes-doonside
eggless-cakes-dundas-valley
eggless-cakes-dussehra-sydney
eggless-cakes-easter-sydney
eggless-cakes-eid-milad-un-nabi-sydney
eggless-cakes-eid-sydney
eggless-cakes-eid-ul-adha-sydney
eggless-cakes-engagement-sydney
eggless-cakes-epping
eggless-cakes-ermington
eggless-cakes-fairfield
eggless-cakes-fathers-day-sydney
eggless-cakes-filipino-debut-sydney
eggless-cakes-first-communion-sydney
eggless-cakes-gender-reveal-sydney
eggless-cakes-graduation-sydney
eggless-cakes-harris-park
eggless-cakes-hassall-grove
eggless-cakes-holi-sydney
eggless-cakes-housewarming-sydney
eggless-cakes-karwa-chauth-sydney
eggless-cakes-kenthurst
eggless-cakes-kings-langley
eggless-cakes-lalor-park
eggless-cakes-lidcombe
eggless-cakes-lunar-new-year-sydney
eggless-cakes-marayong
eggless-cakes-marsfield
eggless-cakes-mays-hill
eggless-cakes-mcgraths-hill
eggless-cakes-mehendi-sydney
eggless-cakes-merrylands-west
eggless-cakes-minchinbury
eggless-cakes-mothers-day-sydney
eggless-cakes-mount-druitt
eggless-cakes-navratri-sydney
eggless-cakes-near-me-sydney
eggless-cakes-new-year-sydney
eggless-cakes-newington
eggless-cakes-north-kellyville
eggless-cakes-north-parramatta
eggless-cakes-northmead
eggless-cakes-northwest-sydney
eggless-cakes-norwest
eggless-cakes-old-toongabbie
eggless-cakes-parramatta
eggless-cakes-pendle-hill
eggless-cakes-pennant-hills
eggless-cakes-pitt-town
eggless-cakes-plumpton
eggless-cakes-prospect
eggless-cakes-quakers-hill
eggless-cakes-quinceanera-sydney
eggless-cakes-raksha-bandhan-sydney
eggless-cakes-ramadan-sydney
eggless-cakes-retirement-sydney
eggless-cakes-rhodes
eggless-cakes-richmond
eggless-cakes-riverstone
eggless-cakes-rosehill
eggless-cakes-rouse-hill
eggless-cakes-rydalmere
eggless-cakes-schofields
eggless-cakes-seven-hills
eggless-cakes-silverwater
eggless-cakes-smithfield
eggless-cakes-strathfield
eggless-cakes-sweet-16-sydney
eggless-cakes-tallawong
eggless-cakes-telopea
eggless-cakes-the-ponds
eggless-cakes-valentines-day-sydney
eggless-cakes-villawood
eggless-cakes-wentworth-point
eggless-cakes-wentworthville
eggless-cakes-west-pennant-hills
eggless-cakes-west-ryde
eggless-cakes-westmead
eggless-cakes-winston-hills
eggless-cakes-woodville
eggless-cakes-yalda-night-sydney
eggless-chocolate-cake-sydney
eggless-cupcakes-kids-birthday-party-sydney
eggless-cupcakes-sydney
eggless-fruit-cake-sydney
eggless-mini-cakes-cupcake-towers-sydney
eggless-red-velvet-cake-sydney
eggless-wedding-cakes-sydney
farewell-cake-sydney
first-birthday-cake-sydney
grand-final-party-cake-sydney
halal-friendly-cakes-eggless-sydney
halloween-cake-sydney
hanukkah-cakes-sydney
how-to-choose-cake-sydney
how-to-design-birthday-cake-sydney
how-to-order-cake-sydney
hsc-results-day-cake-sydney
indian-sweets-harris-park-riverstone-sydney
kids-birthday-cake-sydney
luxury-cake-sydney
milestone-birthday-cake-sydney
naked-cake-sydney
natural-ingredients-eggless-cakes
novelty-sculpted-cake-designs-sydney
number-cakes-sydney
photo-cake-sydney
push-present-cake-sydney
ram-navami-sydney
rasmalai-cake-sydney
reunion-cake-sydney
same-day-cake-sydney
sensory-friendly-cake-sydney
sheet-cake-sydney
spring-cake-sydney
summer-cake-sydney
tet-vietnamese-new-year-sydney
theme-cakes-sydney
tiered-cakes-sydney
top-7-custom-eggless-cake-designs-kids-birthdays
unique-birthday-cake-ideas-sydney
wedding-cake-sydney-north-west
winter-cake-sydney

## 9. topic-ledger.md cross-check (read-only)
- "Published history" table contains 1 post (rasmalai-cake-sydney, 2026-09-03). Ledger-backed (explicitly referenced in cluster registry, gaps or history): 26 of 234 posts (11.1%): best-eggless-cake-shops-sydney-2026, cake-delivery-areas-sydney, cake-price-guide-sydney, cake-serving-size-guide-sydney, celebration-cake-sydney, custom-cake-sydney, dairy-free-vs-eggless-cakes, eggless-cake-calories-guide-sydney, eggless-cake-delivery-sydney, eggless-cake-egg-substitutes, eggless-cake-flavours, eggless-cake-for-egg-allergy, eggless-cake-gluten-free-sydney, eggless-cake-nut-free-sydney, eggless-cake-sydney, eggless-cake-vs-regular-cake, eggless-cakes-diwali-indian-festivals-sydney, eggless-cakes-eid-milad-un-nabi-sydney, eggless-cakes-near-me-sydney, eggless-cakes-northwest-sydney, halal-friendly-cakes-eggless-sydney, how-to-order-cake-sydney, indian-sweets-harris-park-riverstone-sydney, kids-birthday-cake-sydney, number-cakes-sydney, rasmalai-cake-sydney.
- Orphaned from the ledger: 208 (88.9%), mostly the legacy calendar-driven suburb/occasion posts predating the ledger; not a defect by itself but they need ledger-style demand validation (GSC) before keeping. blog/NEEDS-TOPIC-2026-09-10.txt shows the writer routine correctly stopped when no validated topic existed.
- Ledger pillars with weak performance: eggless-cake-sydney (5 impr), eggless-cakes-near-me-sydney (58, 0 clicks), how-to-order-cake-sydney (pos 40.6), eggless-cake-delivery-sydney (pos 28.4).
- Not measured: node verify-blog.mjs failed to start (ERR_MODULE_NOT_FOUND, dependency missing in this sandbox); sitemap.xml has 235 "blog/" entries vs 235 blog files (count only, not slug-diffed). Readability uses a heuristic syllable counter.

## Summary of severities
- High: 7 suburb pages with >=50% templated sentences; no visible byline/bio/credentials on 94% of posts; pillar pages not performing (eggless-cake-sydney, how-to-order, custom-cake); how-to-order vs custom-cake intent overlap.
- Medium: cannibalisation groups 1-9, 13; dateModified==datePublished on 97%; 6 pages missing "100% eggless" in visible text; "milestone adult cakes" meta line; 10 posts under 1,500 words incl. top-ranking pages; 3 never-indexed posts; luxury-cake-sydney author type; tables on only 18%.
- Low: 48-hour lead time copy (225 posts); readability mean 53.5; other cannibalisation groups; scope-adjacent vs-posts.
- Positive: 0 thin posts; 0 exact/near-exact duplicates; 100% Article/FAQ schema; 100% external citations (87% authority domains); 98% takeaway boxes; 99.6% question H2s; 0 snack/savoury/egg-based product claims.

CONTENT_SCORE: 74/100

Justification: Depth, structure and citation quality are strong (median 2,219 words, nothing thin, no near-exact duplicates, 100% external sources, 98% takeaway boxes, question H2s). Score is held back by templated suburb cluster (37 pages >=30% shared sentences, 7 >=50%), residual intent cannibalisation among pillars, weak visible E-E-A-T (6% bylines, no bios, 97% no real update dates), pillars underperforming, and a few brand-copy gaps. The 48-hour lead-time copy is a known low-severity drift and only marginally affects the score.

BASIS: Programmatic analysis of 234 local blog/*.html files (article text, 5-word-shingle Jaccard on all pairs, TF-IDF cosine on title/H1/slug, regex counts); GSC figures from stale blog-gsc-per-page.md (to 2026-08-29, pre-consolidation) used only for winner selection; no live fetch, no rendering; verify-blog.mjs could not run.
