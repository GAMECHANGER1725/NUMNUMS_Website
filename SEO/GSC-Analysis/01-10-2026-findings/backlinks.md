# Backlink / Off-Page Authority Audit: numnumsbakery.com.au
Date: 2026-10-01. Data-only run (no browser). Scope: two-shop local bakery (Harris Park, Riverstone).

## 1. Credentials (verbatim `backlinks_auth.py --check`)
```
Backlink Tier: 0 -- Basic (Common Crawl + Verify only)
  [MISSING] Moz Link Explorer API  (No Moz API key found)
  [MISSING] Bing Webmaster Tools API (No Bing Webmaster API key found)
  [OK] Common Crawl Web Graph (Cached domains: 0)
  [OK] Backlink Verification Crawler
```
Tier 0. No DataForSEO. No DA/PA/Spam Score, no referring-domain count, no anchor data, no velocity. None are estimated here.

## 2. Real data obtained
| Source | Result | Confidence |
|---|---|---|
| Common Crawl web graph (cc-main-2026-jan-feb-mar) | `in_crawl: true`, `in_rankings: false`. PageRank, harmonic centrality and both ranks are null. Note: "below ranking threshold (too small/new)". | 0.50, domain-level, quarterly |
| domain_history.py | whois unavailable (no `whois` package / port 43 blocked). Creation date, registrar and risk are unknown. | n/a |
| verify_backlinks.py | Not run. It needs a list of known backlinks to verify and none exists at Tier 0. | n/a |
| validate_backlink_report.py | Not run. There is no link report to validate, only N/A fields. | n/a |
| Referring domains, DA/PA, anchors, toxic ratio, velocity, follow ratio, geo | N/A. No source configured. GSC's API does not expose links. | none |

Reading of CC: the site is crawled but too small to enter the graph rankings. That is consistent with a young, low-link local site. It is not proof of a specific link count.

## 3. Outbound and citation posture (observed in repo, Parsed 0.95)
Scanned all root and blog HTML (about 245 files): 5,574 external `href`s, 309 unique non-boilerplate URLs. Each was checked live.

### sameAs
- 431 JSON-LD blocks list: Instagram `/numnumsbakery/`, Facebook `/Numnumsbakeryharrispark/`, Wikidata Q140076208. This includes `locations.html` for both shops.
- 15 blocks list Wikidata only. 2 list Wikidata plus Instagram.
- Missing from every sameAs: Google Maps/GBP URLs (they appear as plain links), Uber Eats, Apple Business, Bing Places, Yelp, YouTube, Riverstone-specific social profiles.

### Brand profile links found
| Profile | Evidence in site | Live check |
|---|---|---|
| Wikidata Q140076208 | sameAs (all pages) | not requested |
| Instagram numnumsbakery | sameAs and footers | 429 login wall (bot block, inconclusive) |
| Facebook Numnumsbakeryharrispark | sameAs | 200 |
| Google Maps (Harris Park and Riverstone place URLs, 2 CIDs, `g.page/r/...` review link) | links | 200 |
| Uber Eats (`index.html`, `order.html`) | text link | 403 (bot block, inconclusive) |
| YouTube | 4 watch links, off-brand third-party videos likely | 200 |
| TikTok, Yelp, TrueLocal, Yellow Pages, Hotfrog, Apple, Bing | no links in the public site | n/a |

### Off-brand or inconsistent handles (Medium)
- Instagram `numnums.bakery`: blog posts such as `eggless-cakes-west-ryde`, `eggless-cakes-birrong`, `eggless-red-velvet-cake-sydney`, `cake-delivery-areas-sydney` (0.95 that the links exist). It returned 429 and redirected to a login, so it is unverified. It differs from the sameAs handle `numnumsbakery`.
- Instagram `numnums.com.au` and Facebook `numnum.com.au`: only in `blog/eggless-cake-delivery-sydney.html`.
- Facebook `/numnumsbakery` (no suffix): several blog posts, and 200 (it may be a different page from the sameAs one).
- Unconfirmed handle: Mulgrave NSW 2756 appears in `locations.html` and one blog post (a Google Maps search link to 10-12A Wingate Rd). The brief says two shops, so this may be a stale or third-site reference. Verify with the owner.
- Fix: one canonical handle per network, taken from the GBP NAP master (Instagram `numnumsbakery`, Facebook Harris Park page).

### Broken outbound links (live status, Parsed 0.95)
- 33 unique URLs returned 404. 173 of about 245 pages contain at least one 404 outbound link. The largest offender is a single URL:
  - `foodstandards.gov.au/consumer/foodstandards/pages/foodallergens.aspx`: 157 pages. Also dead: 4 other `/consumer/...` FSANZ URLs.
  - `health.nsw.gov.au/foodsafety/Pages/default.aspx`: 14 pages. Also `.../foodsafety` (2), `.../pregnancy.aspx` (4).
  - ABS: 11 dead URLs (cultural-diversity, religion, CPI, hospitality), 3 to 5 pages each. Also NSW Education term-date URLs, a Wikipedia URL with a missing `)` (`Mud_cake_(dessert`), healthdirect pregnancy, a Western Sydney University page.
- This hurts trust and E-E-A-T on the pages citing authorities, and it undercuts the allergy-authority citations.
- 44 URLs returned 403 and 9 errored/reset (id.com.au demographics, some gov and publisher sites). These are bot-blocking from the sandbox and are NOT confirmed broken. Re-check in a normal browser: `profile.id.com.au`, `forecast.id.com.au`, `foodauthority.nsw.gov.au`, `blacktown.nsw.gov.au`.
- 206 URLs returned 200 and 13 returned 202.
- Outbound links to `wa.me` (1,519) and Google Fonts (1,199) are functional, not editorial. All other external links use `rel="noopener"`. None carry `nofollow` (not an issue for authority citations).

## 4. CODE ACTIONS
| # | Severity | Action |
|---|---|---|
| C1 | High | Replace or remove the dead FSANZ allergen URL on 157 pages (one scripted find-and-replace to the current page). Re-check the other 32 dead URLs. Add a link-check step to `verify-blog.mjs`. |
| C2 | Medium | Standardise Instagram/Facebook handles in blog posts to the sameAs set. Resolve the Mulgrave address. |
| C3 | Medium | Expand `sameAs` on the LocalBusiness/Organization nodes: add the per-shop Google Maps/GBP URL, Uber Eats, and new profiles (Apple, Bing, Yelp, etc.) once they exist. Keep Wikidata. Never list a profile that does not exist. |
| C4 | Low | Make the 15 Wikidata-only and 2 two-item `sameAs` blocks match the full 3-item set. |
| C5 | Low | Add visible footer links to the verified social profiles and GBP pages (partly present). |
| C6 | Low | Linkable asset ideas that fit scope: (a) an "egg-free ingredient and allergen guide for Indian sweets and celebration cakes" with a downloadable one-page PDF that cites the FSANZ and Allergy NSW pages (fixed links); (b) a sourced "eggless cake sizes and servings" chart (the catalogue already holds sizes and prices as facts); (c) a Western Sydney festival-calendar page (Diwali, Raksha Bandhan, Eid) with order cut-off dates, linkable by community groups. Do not build fake "stats". |

## 5. NON-CODE ACTIONS (human must register or claim; no code can do these)
### Citation / NAP list (AU)
Master NAP is already defined in `GBP/gbp-numnums-harris-park.md`: "Num Num's Bakery", Shop 1, 96–98 Wigram Street, Harris Park NSW 2150, +61 425 697 725. The checklist exists and is unticked, and nothing in the site shows these profiles exist.

| Directory | Site shows profile exists? | Action |
|---|---|---|
| Google Business Profile (both shops) | Yes, via Maps and review links | Maintain; confirm Riverstone and the Mulgrave question |
| Facebook Page | Yes (sameAs) | Keep NAP identical |
| Instagram | Yes (sameAs) | Link to the site in bio |
| Apple Business Connect | No evidence | Claim both shops (human) |
| Bing Places | No evidence | Claim (can import from GBP) (human) |
| Yelp AU | No evidence | Claim/create (human) |
| TrueLocal | No evidence | Create (human) |
| Yellow Pages AU | No evidence | Create (human) |
| Hotfrog AU | No evidence | Create (human) |
| Localsearch / StartLocal | No evidence | Create (human) |
| Foursquare | No evidence | Claim (human) |
| TripAdvisor | No evidence | Claim (human) |
| Uber Eats | Yes (text link) | Keep as-is |
| Zomato | Not in AU any more (Zomato exited AU in 2015) | Skip |
| ABR/ABN Lookup (GNT Ventures Pty Ltd, ABN 39 634 402 412) | Already public (the ABN is on invoices) | Check the trading name "Num Num's Bakery" is listed; update via ABR if not (human) |

Cap the effort at about 6 core listings; the long tail adds little. Use the exact same NAP everywhere.

### White-hat link opportunities, ranked by effort-to-value
1. **Press and food-blog outreach on the eggless angle** (Western Sydney local outlets, e.g. Parramatta, Blacktown and Hills papers, Indian-Australian community media, Sydney vegetarian blogs). Medium effort, high value: "100% eggless" is a real hook. Offer a story or tasting, never paid links.
2. **Vegetarian/Jain/egg-allergy community resources**: ask for inclusion in "where to find eggless cake in Sydney" lists run by vegetarian societies and parent groups. Low effort, medium to high value.
3. **Council and community listings**: City of Parramatta and Blacktown business directories, chamber of commerce (Parramatta, Blacktown), Harris Park "Little India" precinct and traders' listings. Low effort, medium value.
4. **Indian community organisations and temples**: festival sponsorship or sweet supply (Diwali, Rakhi); sponsor pages and event listings often link. Medium effort, medium value.
5. **Wedding/event supplier directories** (Easy Weddings, which the site already cites, plus Western Sydney event listings). Low-medium effort, medium value. Check fees; paid directory listings should be `nofollow`/sponsored in practice.
6. **School and workplace fundraising partnerships** (P&C cake stalls, charity bake events). Medium effort, low-medium value, but good for local relevance.
7. **Supplier and partner mentions** (venues, florists, party hire that you work with). Low effort, low-medium value.

Avoid: paid link packages, PBNs, mass directory submission, comment/forum spam, and link exchanges. These breach Google's link spam policies.

## 6. Cross-skill
- `/seo content` for E-E-A-T, `/seo technical` for crawlability. Not duplicated here.
- To get real link data cheaply: create a free Moz API key (2,500 rows/month) or verify the site in Bing Webmaster Tools (owner action) and set `MOZ_API_KEY` / `BING_WEBMASTER_API_KEY`. Search Console's Links report in the UI is a manual free source (the API does not expose it).

## 7. Score
BACKLINKS_SCORE: N/A
Reason: Tier 0 gives no referring-domain, quality, anchor, toxicity, velocity or follow-ratio data. The validator rule requires at least 4 factors with data; 0 of the 7 weighted factors have a real source. A numeric score would be a guess.
BASIS: Common Crawl 0.50 (not in rankings), live repo and link-status scan 0.95, no paid/Moz/Bing data. Provisional qualitative read: off-page authority is very low and the citation footprint is thin; the on-site outbound hygiene (dead-link rate) is the most fixable issue.
