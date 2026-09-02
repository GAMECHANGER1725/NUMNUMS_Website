# Blog Per-Page GSC Performance (90-day pull)

Property: `sc-domain:numnumsbakery.com.au` | Date range: 2026-06-03 to 2026-08-29 (87 days) | Pulled via GSC Search Analytics API (service account), dimensions=page, totals_complete=True.

Credentials: tier 2 (API key + service account + GA4), all services available. GSC pull succeeded with no errors or warnings.

Files on disk: `ls blog/*.html` (excluding `blog/index.html`) = **359 posts**.

## Summary

- **271 of 359** posts have meaningful traffic (>10 impressions over ~90 days), counting impressions on both the canonical clean URL and any `.html`-indexed variant.
- **88 of 359** posts have negligible-to-zero impressions (≤10 over ~90 days) — prune candidates regardless of topical-cluster fit.
  - Of those, **10** had exactly zero impressions on any known URL.
  - Of those, **10** never appear in GSC at all under any URL variant (canonical or `.html`) — likely never indexed/crawled, not just underperforming. See indexing-mismatch section.
- **12 posts are dual-indexed**: both the canonical clean URL (`/blog/<slug>`) AND the legacy `.html` URL are separately indexed and earning impressions in GSC. This is a technical SEO issue independent of content quality — Google is splitting authority/impressions across two URLs for the same page instead of consolidating via the `.html`→clean redirect. Effective impressions below are canon+`.html` summed per post for ranking purposes.
- **4 posts are indexed ONLY under the legacy `.html` URL** — the canonical clean URL has never been seen in GSC for these, meaning the redirect/canonicalization isn't being respected by Google for that URL. Flagged below.

## Indexing mismatches (fix before pruning on these)

### Indexed only under `.html` URL — canonical clean URL never seen in GSC

| Slug | Effective impressions (90d) | Effective clicks |
|---|---:|---:|
| farewell-cake-sydney | 143 | 4 |
| eggless-cakes-berala | 49 | 0 |
| eggless-cakes-telopea | 26 | 0 |
| eggless-cake-customization-sydney | 5 | 0 |

### Dual-indexed — both canonical and `.html` URL appear separately in GSC

| Slug | Effective impressions (90d, canon+.html summed) | Effective clicks |
|---|---:|---:|
| same-day-cake-sydney | 598 | 14 |
| eggless-cake-catering-sydney | 163 | 0 |
| eggless-cakes-dundas-valley | 132 | 0 |
| corporate-cake-sydney | 116 | 1 |
| eggless-cake-for-toddlers-sydney | 116 | 10 |
| eggless-cakes-onam-sydney | 103 | 1 |
| eggless-cakes-south-granville | 46 | 0 |
| eggless-cakes-toongabbie | 28 | 0 |
| cake-gifting-sydney | 22 | 1 |
| eggless-cake-bulk-order-sydney | 9 | 0 |
| eggless-cakes-retirement-sydney | 7 | 0 |
| eggless-cakes-bridal-shower-sydney | 4 | 0 |

### Never appear in GSC under any URL (canonical or `.html`) — 90 days

File exists in `blog/` but the URL has zero rows in GSC at all (not even 0-impression rows are returned by the API for genuinely un-crawled URLs — GSC only returns URLs it has *some* data for, so absence here means Google has not recorded impressions for this URL in the last 90 days under either form).

- `blog/eggless-cake-design-ideas-sydney.html`
- `blog/eggless-cake-recipe-vs-bakery-sydney.html`
- `blog/eggless-cakes-bidwill.html`
- `blog/eggless-cakes-holi-sydney.html`
- `blog/eggless-cakes-janmashtami-sydney.html`
- `blog/eggless-cakes-north-rocks.html`
- `blog/eggless-cakes-vaisakhi-sydney.html`
- `blog/eggless-cakes-wentworthville.html`
- `blog/milestone-birthday-cake-sydney.html`
- `blog/tiered-cakes-sydney.html`

## Full ranked table — all 359 posts by effective impressions (90d)

Effective impressions/clicks = canonical URL + `.html`-indexed variant (if any) summed. Position is impression-weighted average across matched URLs.

| # | Slug | Impressions | Clicks | Avg Position | CTR % | Notes |
|---:|---|---:|---:|---:|---:|---|
| 1 | eggless-cake-bakery-harris-park-riverstone-sydney | 7586 | 107 | 7.8 | 1.41 |  |
| 2 | best-eggless-cake-shops-sydney-2026 | 6232 | 146 | 9.6 | 2.34 |  |
| 3 | photo-cake-sydney | 3705 | 97 | 8.5 | 2.62 |  |
| 4 | eggless-cake-storage-freshness-guide | 3162 | 16 | 7.8 | 0.51 |  |
| 5 | best-dessert-shop-sydney | 2415 | 35 | 9.2 | 1.45 |  |
| 6 | best-cake-sydney | 2053 | 13 | 13.3 | 0.63 |  |
| 7 | eggless-cake-vs-regular-cake | 1316 | 9 | 6.8 | 0.68 |  |
| 8 | cake-serving-size-guide-sydney | 1306 | 14 | 6.6 | 1.07 |  |
| 9 | eggless-cake-egg-substitutes | 1197 | 3 | 9.4 | 0.25 |  |
| 10 | eggless-cakes-dean-park | 985 | 13 | 8.2 | 1.32 |  |
| 11 | vegan-vs-eggless-cakes-difference | 797 | 2 | 8.1 | 0.25 |  |
| 12 | cake-price-guide-sydney | 689 | 14 | 6.1 | 2.03 |  |
| 13 | wedding-cake-sydney-north-west | 668 | 4 | 15.5 | 0.6 |  |
| 14 | eggless-cake-for-vegetarians-sydney | 659 | 5 | 20.1 | 0.76 |  |
| 15 | same-day-cake-sydney | 598 | 14 | 8.5 | 2.34 | dual-indexed |
| 16 | eggless-cake-calories-guide-sydney | 589 | 1 | 7.7 | 0.17 |  |
| 17 | eggless-cakes-schofields | 498 | 16 | 7.0 | 3.21 |  |
| 18 | are-eggless-cakes-healthy | 486 | 7 | 4.9 | 1.44 |  |
| 19 | eggless-cakes-doonside | 396 | 7 | 7.8 | 1.77 |  |
| 20 | halal-friendly-cakes-eggless-sydney | 373 | 3 | 10.9 | 0.8 |  |
| 21 | indian-sweets-harris-park-riverstone-sydney | 353 | 4 | 6.3 | 1.13 |  |
| 22 | eggless-cakes-riverstone | 350 | 2 | 8.6 | 0.57 |  |
| 23 | cake-cutting-ceremony-sydney | 341 | 1 | 12.1 | 0.29 |  |
| 24 | eggless-cakes-soft-moist-myths-vs-facts | 340 | 1 | 7.2 | 0.29 |  |
| 25 | eggless-cake-troubleshooting | 319 | 2 | 8.2 | 0.63 |  |
| 26 | first-birthday-cake-sydney | 308 | 16 | 8.9 | 5.19 |  |
| 27 | eggless-cakes-quakers-hill | 285 | 9 | 7.6 | 3.16 |  |
| 28 | eggless-cakes-fathers-day-sydney | 282 | 0 | 11.1 | 0.0 |  |
| 29 | eggless-cakes-eid-milad-un-nabi-sydney | 262 | 6 | 6.7 | 2.29 |  |
| 30 | cake-shop-near-me-marsden-park-talawong | 253 | 0 | 10.6 | 0.0 |  |
| 31 | unique-birthday-cake-ideas-sydney | 253 | 3 | 10.4 | 1.19 |  |
| 32 | kids-birthday-cake-sydney | 250 | 11 | 9.0 | 4.4 |  |
| 33 | birthday-cake-north-west-sydney | 243 | 2 | 9.9 | 0.82 |  |
| 34 | number-cakes-sydney | 234 | 11 | 6.6 | 4.7 |  |
| 35 | how-to-design-birthday-cake-sydney | 218 | 0 | 13.0 | 0.0 |  |
| 36 | eggless-cakes-minchinbury | 209 | 0 | 6.9 | 0.0 |  |
| 37 | eggless-cakes-northmead | 204 | 2 | 7.4 | 0.98 |  |
| 38 | eggless-cake-ingredients-sydney | 197 | 4 | 9.2 | 2.03 |  |
| 39 | eggless-cakes-lalor-park | 189 | 0 | 15.9 | 0.0 |  |
| 40 | eggless-cake-lactose-intolerance | 184 | 0 | 9.8 | 0.0 |  |
| 41 | eggless-cake-vs-cheesecake-sydney | 184 | 0 | 7.9 | 0.0 |  |
| 42 | eggless-cakes-winston-hills | 180 | 3 | 7.5 | 1.67 |  |
| 43 | eggless-cake-nut-free-sydney | 178 | 3 | 14.1 | 1.69 |  |
| 44 | multicultural-celebration-cake-sydney | 173 | 1 | 7.6 | 0.58 |  |
| 45 | eggless-cakes-villawood | 169 | 2 | 4.9 | 1.18 |  |
| 46 | eggless-cake-catering-sydney | 163 | 0 | 65.2 | 0.0 | dual-indexed |
| 47 | cake-shop-western-sydney | 153 | 1 | 14.1 | 0.65 |  |
| 48 | eggless-cakes-constitution-hill | 150 | 2 | 8.2 | 1.33 |  |
| 49 | eggless-cakes-mount-druitt | 149 | 0 | 7.1 | 0.0 |  |
| 50 | eggless-cake-delivery-sydney | 148 | 2 | 28.4 | 1.35 |  |
| 51 | eggless-cake-reviews-sydney | 148 | 1 | 12.2 | 0.68 |  |
| 52 | cake-toppers-sydney | 145 | 1 | 8.0 | 0.69 |  |
| 53 | eggless-cakes-birrong | 143 | 2 | 6.2 | 1.4 |  |
| 54 | farewell-cake-sydney | 143 | 4 | 5.7 | 2.8 | .html-only indexed |
| 55 | eggless-cake-texture-moist | 137 | 2 | 6.5 | 1.46 |  |
| 56 | eggless-cakes-auburn | 136 | 2 | 9.0 | 1.47 |  |
| 57 | eggless-cakes-newington | 135 | 0 | 7.3 | 0.0 |  |
| 58 | eggless-cakes-dundas-valley | 132 | 0 | 12.9 | 0.0 | dual-indexed |
| 59 | eggless-cake-nutrition-sydney | 128 | 1 | 9.0 | 0.78 |  |
| 60 | naked-cake-sydney | 128 | 0 | 14.1 | 0.0 |  |
| 61 | eggless-cakes-seven-hills | 126 | 0 | 7.2 | 0.0 |  |
| 62 | eggless-cake-types | 125 | 0 | 9.1 | 0.0 |  |
| 63 | eggless-cakes-gender-reveal-sydney | 125 | 5 | 6.8 | 4.0 |  |
| 64 | eggless-cake-for-egg-allergy | 123 | 2 | 9.2 | 1.63 |  |
| 65 | how-eggless-cakes-are-made | 123 | 2 | 8.8 | 1.63 |  |
| 66 | anniversary-cake-sydney | 121 | 0 | 16.1 | 0.0 |  |
| 67 | eggless-cakes-mays-hill | 120 | 1 | 9.8 | 0.83 |  |
| 68 | eggless-cake-for-pregnancy-sydney | 119 | 3 | 13.4 | 2.52 |  |
| 69 | eggless-cakes-northwest-sydney | 119 | 4 | 13.1 | 3.36 |  |
| 70 | corporate-cake-sydney | 116 | 1 | 20.1 | 0.86 | dual-indexed |
| 71 | eggless-cake-for-toddlers-sydney | 116 | 10 | 10.7 | 8.62 | dual-indexed |
| 72 | cake-smash-cakes-sydney | 112 | 9 | 7.2 | 8.04 |  |
| 73 | eggless-cakes-sydney-olympic-park | 106 | 0 | 6.2 | 0.0 |  |
| 74 | eggless-cakes-north-kellyville | 103 | 2 | 6.1 | 1.94 |  |
| 75 | eggless-cakes-onam-sydney | 103 | 1 | 8.1 | 0.97 | dual-indexed |
| 76 | eggless-cakes-prospect | 103 | 0 | 10.4 | 0.0 |  |
| 77 | eggless-cakes-kenthurst | 102 | 0 | 7.3 | 0.0 |  |
| 78 | afternoon-tea-cakes-sydney | 101 | 2 | 20.6 | 1.98 |  |
| 79 | eggless-cakes-old-toongabbie | 101 | 0 | 35.4 | 0.0 |  |
| 80 | eggless-cakes-rooty-hill | 99 | 0 | 11.7 | 0.0 |  |
| 81 | eggless-cakes-shanes-park | 94 | 0 | 4.4 | 0.0 |  |
| 82 | eggless-cakes-merrylands-west | 90 | 1 | 4.8 | 1.11 |  |
| 83 | eggless-cakes-silverwater | 89 | 0 | 9.2 | 0.0 |  |
| 84 | eggless-cakes-dundas | 88 | 0 | 6.9 | 0.0 |  |
| 85 | kids-birthday-cake-north-west-sydney | 88 | 1 | 12.3 | 1.14 |  |
| 86 | eggless-cake-vs-sponge-cake | 87 | 1 | 10.1 | 1.15 |  |
| 87 | birthday-cake-for-men-sydney | 85 | 2 | 9.2 | 2.35 |  |
| 88 | eggless-cakes-vesak-day-sydney | 85 | 1 | 14.3 | 1.18 |  |
| 89 | eggless-cake-flavours | 80 | 2 | 7.7 | 2.5 |  |
| 90 | eggless-cake-indian-flavours | 80 | 3 | 7.7 | 3.75 |  |
| 91 | dairy-free-vs-eggless-cakes | 79 | 1 | 6.5 | 1.27 |  |
| 92 | eggless-cakes-pitt-town | 79 | 1 | 7.7 | 1.27 |  |
| 93 | eggless-cakes-smithfield | 79 | 0 | 11.5 | 0.0 |  |
| 94 | eggless-cakes-west-ryde | 79 | 1 | 7.4 | 1.27 |  |
| 95 | luxury-cake-sydney | 79 | 5 | 12.5 | 6.33 |  |
| 96 | eggless-cakes-durga-puja-sydney | 78 | 1 | 7.1 | 1.28 |  |
| 97 | drip-cake-sydney | 76 | 0 | 6.6 | 0.0 |  |
| 98 | eggless-cakes-hebersham | 76 | 0 | 6.4 | 0.0 |  |
| 99 | eggless-cakes-bossley-park | 75 | 0 | 12.1 | 0.0 |  |
| 100 | eggless-cakes-grantham-farm | 71 | 0 | 22.7 | 0.0 |  |
| 101 | eggless-cakes-bonnyrigg | 70 | 0 | 15.1 | 0.0 |  |
| 102 | eggless-cakes-marsfield | 70 | 0 | 6.6 | 0.0 |  |
| 103 | eggless-cakes-plumpton | 70 | 2 | 7.8 | 2.86 |  |
| 104 | eggless-cakes-epping | 69 | 1 | 12.8 | 1.45 |  |
| 105 | cake-consultation-sydney | 68 | 0 | 4.8 | 0.0 |  |
| 106 | eggless-cake-office-birthday-sydney | 67 | 0 | 19.6 | 0.0 |  |
| 107 | eggless-cakes-cherrybrook | 67 | 0 | 7.2 | 0.0 |  |
| 108 | eggless-cake-for-seniors-sydney | 66 | 0 | 11.1 | 0.0 |  |
| 109 | eggless-cakes-cabramatta | 66 | 0 | 6.5 | 0.0 |  |
| 110 | eggless-cakes-harris-park | 66 | 1 | 5.9 | 1.52 |  |
| 111 | eggless-cakes-hassall-grove | 66 | 2 | 5.2 | 3.03 |  |
| 112 | eggless-cakes-woodcroft | 64 | 0 | 8.0 | 0.0 |  |
| 113 | teej-sydney | 64 | 0 | 6.6 | 0.0 |  |
| 114 | natural-ingredients-eggless-cakes | 63 | 0 | 14.8 | 0.0 |  |
| 115 | celebration-cake-sydney | 62 | 0 | 13.8 | 0.0 |  |
| 116 | eggless-cakes-marayong | 62 | 2 | 18.8 | 3.23 |  |
| 117 | eggless-cakes-first-communion-sydney | 61 | 0 | 10.0 | 0.0 |  |
| 118 | eggless-cakes-homebush | 60 | 1 | 15.0 | 1.67 |  |
| 119 | eggless-cakes-mcgraths-hill | 60 | 0 | 8.5 | 0.0 |  |
| 120 | eggless-cakes-the-ponds | 60 | 3 | 6.1 | 5.0 |  |
| 121 | eggless-cakes-eastwood | 59 | 0 | 12.5 | 0.0 |  |
| 122 | eggless-cakes-raksha-bandhan-sydney | 59 | 2 | 9.6 | 3.39 |  |
| 123 | cake-delivery-sydney | 58 | 1 | 16.6 | 1.72 |  |
| 124 | cake-flavour-guide-sydney | 58 | 1 | 4.5 | 1.72 |  |
| 125 | eggless-cakes-near-me-sydney | 58 | 0 | 18.4 | 0.0 |  |
| 126 | eggless-cakes-maha-shivratri-sydney | 57 | 1 | 16.0 | 1.75 |  |
| 127 | eggless-cakes-ryde | 57 | 1 | 5.5 | 1.75 |  |
| 128 | eggless-cake-vs-ice-cream-cake-sydney | 55 | 0 | 9.1 | 0.0 |  |
| 129 | eggless-cake-low-fodmap-sydney | 54 | 0 | 9.5 | 0.0 |  |
| 130 | eggless-cakes-woodville | 54 | 0 | 30.7 | 0.0 |  |
| 131 | cake-message-ideas-sydney | 53 | 1 | 8.1 | 1.89 |  |
| 132 | eggless-cake-vs-supermarket-cake | 53 | 0 | 7.3 | 0.0 |  |
| 133 | novelty-sculpted-cake-designs-sydney | 53 | 0 | 6.4 | 0.0 |  |
| 134 | sheet-cake-sydney | 53 | 2 | 7.4 | 3.77 |  |
| 135 | eggless-cakes-pennant-hills | 52 | 0 | 6.4 | 0.0 |  |
| 136 | eggless-cakes-lidcombe | 50 | 0 | 12.9 | 0.0 |  |
| 137 | eggless-cakes-berala | 49 | 0 | 14.2 | 0.0 | .html-only indexed |
| 138 | eggless-cakes-yagoona | 49 | 0 | 8.0 | 0.0 |  |
| 139 | eggless-cake-buttercream-vs-fondant | 48 | 0 | 13.1 | 0.0 |  |
| 140 | eggless-cakes-carlingford | 48 | 0 | 20.3 | 0.0 |  |
| 141 | eggless-cakes-westmead | 48 | 0 | 7.0 | 0.0 |  |
| 142 | eggless-cakes-yennora | 48 | 0 | 6.2 | 0.0 |  |
| 143 | eggless-cake-for-birthday | 47 | 1 | 12.7 | 2.13 |  |
| 144 | eggless-cake-vs-mud-cake | 47 | 0 | 7.1 | 0.0 |  |
| 145 | eggless-cakes-castle-hill | 47 | 0 | 9.3 | 0.0 |  |
| 146 | eggless-cakes-south-granville | 46 | 0 | 5.6 | 0.0 | dual-indexed |
| 147 | eggless-cakes-bligh-park | 45 | 0 | 7.6 | 0.0 |  |
| 148 | eggless-cakes-greystanes | 45 | 1 | 9.0 | 2.22 |  |
| 149 | eggless-fruit-cake-sydney | 45 | 0 | 14.2 | 0.0 |  |
| 150 | cake-smash-vs-first-birthday-cake-sydney | 44 | 1 | 9.2 | 2.27 |  |
| 151 | custom-cake-sydney | 44 | 0 | 28.2 | 0.0 |  |
| 152 | eggless-cakes-parklea | 42 | 1 | 7.6 | 2.38 |  |
| 153 | eggless-birthday-cakes-every-age-sydney | 41 | 1 | 20.1 | 2.44 |  |
| 154 | eggless-cake-ordering-mistakes | 41 | 0 | 12.3 | 0.0 |  |
| 155 | eggless-cakes-ermington | 41 | 0 | 43.3 | 0.0 |  |
| 156 | eggless-cakes-glendenning | 41 | 0 | 6.3 | 0.0 |  |
| 157 | eggless-cake-lower-sugar-options-sydney | 40 | 0 | 7.9 | 0.0 |  |
| 158 | eggless-cakes-anniversary-sydney | 40 | 1 | 11.4 | 2.5 |  |
| 159 | eggless-cakes-blacktown | 40 | 2 | 6.1 | 5.0 |  |
| 160 | eggless-birthday-cakes-sydney | 39 | 2 | 10.6 | 5.13 |  |
| 161 | eggless-cake-gifting-guide-sydney | 39 | 0 | 11.0 | 0.0 |  |
| 162 | eggless-cakes-filipino-debut-sydney | 39 | 0 | 8.7 | 0.0 |  |
| 163 | eggless-cakes-kellyville | 39 | 1 | 9.6 | 2.56 |  |
| 164 | eggless-cakes-mid-autumn-festival-sydney | 39 | 3 | 7.4 | 7.69 |  |
| 165 | eggless-cakes-prairiewood | 39 | 0 | 4.8 | 0.0 |  |
| 166 | eggless-cake-ingredient-labels-sydney | 38 | 0 | 7.0 | 0.0 |  |
| 167 | eggless-cakes-sefton | 38 | 0 | 5.9 | 0.0 |  |
| 168 | semi-naked-cake-sydney | 38 | 2 | 8.4 | 5.26 |  |
| 169 | eggless-cakes-kings-park | 37 | 1 | 8.8 | 2.7 |  |
| 170 | eggless-cakes-rouse-hill | 37 | 0 | 17.7 | 0.0 |  |
| 171 | eggless-cakes-sinhala-tamil-new-year-sydney | 37 | 2 | 7.5 | 5.41 |  |
| 172 | eggless-cakes-engagement-sydney | 35 | 0 | 10.7 | 0.0 |  |
| 173 | how-to-order-cake-sydney | 35 | 1 | 40.6 | 2.86 |  |
| 174 | eggless-cake-wholesale-sydney | 34 | 0 | 23.6 | 0.0 |  |
| 175 | eggless-cakes-box-hill-sydney | 34 | 1 | 13.4 | 2.94 |  |
| 176 | eggless-cakes-merrylands | 34 | 0 | 7.7 | 0.0 |  |
| 177 | eggless-cakes-chester-hill | 33 | 0 | 9.1 | 0.0 |  |
| 178 | how-to-choose-cake-sydney | 33 | 1 | 16.2 | 3.03 |  |
| 179 | eggless-cakes-strathfield | 32 | 2 | 7.9 | 6.25 |  |
| 180 | eggless-cakes-thaipusam-sydney | 32 | 0 | 28.1 | 0.0 |  |
| 181 | eggless-cake-small-gatherings-sydney | 30 | 0 | 18.9 | 0.0 |  |
| 182 | eggless-cake-transport-packaging-sydney | 30 | 0 | 11.1 | 0.0 |  |
| 183 | rosh-hashanah-cakes-sydney | 30 | 1 | 8.6 | 3.33 |  |
| 184 | theme-cakes-sydney | 30 | 1 | 9.7 | 3.33 |  |
| 185 | eggless-cakes-guru-nanak-gurpurab-sydney | 29 | 0 | 16.4 | 0.0 |  |
| 186 | eggless-cakes-meadowbank | 29 | 0 | 8.6 | 0.0 |  |
| 187 | eggless-red-velvet-cake-sydney | 29 | 0 | 10.4 | 0.0 |  |
| 188 | eggless-cake-size-guide-sydney | 28 | 0 | 16.8 | 0.0 |  |
| 189 | eggless-cakes-annangrove | 28 | 0 | 8.4 | 0.0 |  |
| 190 | eggless-cakes-baby-shower-sydney | 28 | 0 | 24.3 | 0.0 |  |
| 191 | eggless-cakes-dussehra-sydney | 28 | 1 | 11.1 | 3.57 |  |
| 192 | eggless-cakes-oakhurst | 28 | 0 | 8.5 | 0.0 |  |
| 193 | eggless-cakes-tallawong | 28 | 2 | 14.9 | 7.14 |  |
| 194 | eggless-cakes-toongabbie | 28 | 0 | 12.3 | 0.0 | dual-indexed |
| 195 | eggless-cakes-wentworth-point | 28 | 0 | 11.5 | 0.0 |  |
| 196 | cake-design-trends-sydney-2026 | 27 | 2 | 15.3 | 7.41 |  |
| 197 | eggless-cakes-chhath-puja-sydney | 27 | 0 | 6.3 | 0.0 |  |
| 198 | eggless-cakes-colebee | 27 | 0 | 8.6 | 0.0 |  |
| 199 | eggless-cakes-parramatta | 27 | 1 | 10.9 | 3.7 |  |
| 200 | eggless-cakes-richmond | 27 | 1 | 15.2 | 3.7 |  |
| 201 | eggless-cake-keto-low-carb-sydney | 26 | 0 | 7.7 | 0.0 |  |
| 202 | eggless-cakes-baulkham-hills | 26 | 0 | 9.6 | 0.0 |  |
| 203 | eggless-cakes-beaumont-hills | 26 | 1 | 19.5 | 3.85 |  |
| 204 | eggless-cakes-kellyville-ridge | 26 | 0 | 9.9 | 0.0 |  |
| 205 | eggless-cakes-north-richmond | 26 | 0 | 9.2 | 0.0 |  |
| 206 | eggless-cakes-telopea | 26 | 0 | 9.4 | 0.0 | .html-only indexed |
| 207 | eggless-cakes-wetherill-park | 26 | 0 | 6.9 | 0.0 |  |
| 208 | eggless-chocolate-cake-sydney | 26 | 0 | 6.8 | 0.0 |  |
| 209 | eggless-cakes-pemulwuy | 25 | 0 | 12.8 | 0.0 |  |
| 210 | eggless-cakes-pongal-sydney | 25 | 0 | 10.6 | 0.0 |  |
| 211 | cake-display-ideas-sydney | 24 | 0 | 9.1 | 0.0 |  |
| 212 | eggless-cakes-north-parramatta | 24 | 0 | 15.4 | 0.0 |  |
| 213 | eggless-cakes-whalan | 24 | 0 | 12.8 | 0.0 |  |
| 214 | custom-kids-birthday-cakes-marsden-park-schofields | 23 | 1 | 14.5 | 4.35 |  |
| 215 | eggless-cake-price-sydney | 23 | 0 | 11.3 | 0.0 |  |
| 216 | eggless-cakes-acacia-gardens | 23 | 0 | 7.8 | 0.0 |  |
| 217 | cake-gifting-sydney | 22 | 1 | 18.7 | 4.55 | dual-indexed |
| 218 | cake-vs-dessert-table-sydney | 22 | 0 | 8.9 | 0.0 |  |
| 219 | eggless-cakes-granville | 22 | 0 | 7.9 | 0.0 |  |
| 220 | eggless-cakes-windsor | 22 | 0 | 8.1 | 0.0 |  |
| 221 | birthday-cake-near-me-sydney-suburbs | 21 | 1 | 19.6 | 4.76 |  |
| 222 | eggless-cake-flavour-pairing-guide | 21 | 0 | 12.5 | 0.0 |  |
| 223 | eggless-cake-vs-pavlova | 21 | 0 | 8.7 | 0.0 |  |
| 224 | eggless-cakes-beecroft | 21 | 0 | 6.6 | 0.0 |  |
| 225 | eggless-cakes-girraween | 21 | 1 | 15.8 | 4.76 |  |
| 226 | dashain-tihar-sydney | 20 | 1 | 6.7 | 5.0 |  |
| 227 | eggless-cakes-oatlands | 20 | 0 | 16.6 | 0.0 |  |
| 228 | tet-vietnamese-new-year-sydney | 20 | 0 | 10.8 | 0.0 |  |
| 229 | cake-delivery-areas-sydney | 19 | 1 | 13.8 | 5.26 |  |
| 230 | cake-school-fete-fundraiser-sydney | 19 | 0 | 11.8 | 0.0 |  |
| 231 | eggless-cakes-west-pennant-hills | 19 | 0 | 10.8 | 0.0 |  |
| 232 | eggless-cakes-glenorie | 18 | 2 | 6.1 | 11.11 |  |
| 233 | eggless-cakes-navratri-sydney | 18 | 0 | 13.8 | 0.0 |  |
| 234 | eggless-wedding-cakes-sydney | 18 | 0 | 10.1 | 0.0 |  |
| 235 | christening-naming-day-cakes-sydney | 17 | 0 | 8.1 | 0.0 |  |
| 236 | eggless-cake-fillings-sydney | 17 | 0 | 15.5 | 0.0 |  |
| 237 | eggless-cakes-marsden-park | 17 | 0 | 28.7 | 0.0 |  |
| 238 | eggless-cakes-mehendi-sydney | 17 | 0 | 29.5 | 0.0 |  |
| 239 | eggless-cakes-pendle-hill | 17 | 0 | 16.2 | 0.0 |  |
| 240 | eggless-cake-for-pooja-sydney | 16 | 1 | 24.4 | 6.25 |  |
| 241 | eggless-cakes-maraylya | 16 | 1 | 4.6 | 6.25 |  |
| 242 | eggless-cakes-old-guildford | 16 | 0 | 6.4 | 0.0 |  |
| 243 | hsc-results-day-cake-sydney | 16 | 0 | 9.9 | 0.0 |  |
| 244 | cake-for-work-anniversary-sydney | 15 | 0 | 6.6 | 0.0 |  |
| 245 | cake-order-online-sydney | 15 | 1 | 51.2 | 6.67 |  |
| 246 | eggless-cake-for-diabetics-sydney | 15 | 0 | 11.5 | 0.0 |  |
| 247 | eggless-cake-school-celebration-sydney | 15 | 0 | 4.5 | 0.0 |  |
| 248 | eggless-cakes-melrose-park | 15 | 0 | 13.1 | 0.0 |  |
| 249 | eggless-cakes-norwest | 15 | 0 | 8.0 | 0.0 |  |
| 250 | eggless-cakes-rosehill | 15 | 0 | 30.4 | 0.0 |  |
| 251 | eggless-cakes-south-windsor | 15 | 0 | 9.3 | 0.0 |  |
| 252 | eggless-cakes-stanhope-gardens | 15 | 0 | 10.8 | 0.0 |  |
| 253 | eggless-cake-gluten-free-sydney | 14 | 1 | 20.8 | 7.14 |  |
| 254 | eggless-cakes-teachers-day-sydney | 14 | 0 | 37.1 | 0.0 |  |
| 255 | eggless-cakes-bhai-dooj-sydney | 13 | 0 | 6.7 | 0.0 |  |
| 256 | eggless-cakes-clyde | 13 | 1 | 7.3 | 7.69 |  |
| 257 | eggless-cakes-galston | 13 | 0 | 9.0 | 0.0 |  |
| 258 | eggless-cakes-ganesh-chaturthi-sydney | 13 | 0 | 16.0 | 0.0 |  |
| 259 | eggless-cakes-shalvey | 13 | 0 | 9.7 | 0.0 |  |
| 260 | eggless-cakes-valentines-day-sydney | 13 | 0 | 35.7 | 0.0 |  |
| 261 | eggless-cakes-cattai | 12 | 0 | 5.4 | 0.0 |  |
| 262 | eggless-cakes-karwa-chauth-sydney | 12 | 0 | 13.1 | 0.0 |  |
| 263 | eggless-cakes-regents-park | 12 | 0 | 29.8 | 0.0 |  |
| 264 | eggless-cakes-willmot | 12 | 0 | 8.2 | 0.0 |  |
| 265 | eggless-cupcakes-kids-birthday-party-sydney | 12 | 0 | 23.5 | 0.0 |  |
| 266 | ram-navami-sydney | 12 | 1 | 7.4 | 8.33 |  |
| 267 | eggless-cake-tasting-sydney | 11 | 0 | 39.6 | 0.0 |  |
| 268 | eggless-cake-vs-cupcakes-sydney | 11 | 0 | 15.7 | 0.0 |  |
| 269 | eggless-cakes-emerton | 11 | 0 | 11.1 | 0.0 |  |
| 270 | eggless-cakes-lohri-sydney | 11 | 1 | 8.5 | 9.09 |  |
| 271 | eggless-cakes-sweet-16-sydney | 11 | 0 | 6.4 | 0.0 |  |
| 272 | autumn-cake-sydney | 10 | 0 | 5.8 | 0.0 |  |
| 273 | cakes-near-me-sydney | 10 | 0 | 34.2 | 0.0 |  |
| 274 | eggless-cake-vs-tart-sydney | 10 | 0 | 4.0 | 0.0 |  |
| 275 | eggless-cakes-dural | 10 | 1 | 14.0 | 10.0 |  |
| 276 | eggless-cakes-guildford-west | 10 | 0 | 17.9 | 0.0 |  |
| 277 | grand-final-party-cake-sydney | 10 | 1 | 6.8 | 10.0 |  |
| 278 | summer-cake-sydney | 10 | 0 | 4.6 | 0.0 |  |
| 279 | eggless-cake-bulk-order-sydney | 9 | 0 | 26.9 | 0.0 | dual-indexed |
| 280 | eggless-cakes-denistone | 9 | 0 | 7.1 | 0.0 |  |
| 281 | eggless-cakes-glenhaven | 9 | 0 | 9.8 | 0.0 |  |
| 282 | eggless-cakes-nowruz-sydney | 9 | 0 | 38.6 | 0.0 |  |
| 283 | eggless-cakes-vineyard | 9 | 0 | 8.1 | 0.0 |  |
| 284 | push-present-cake-sydney | 9 | 1 | 12.4 | 11.11 |  |
| 285 | spring-cake-sydney | 9 | 0 | 11.6 | 0.0 |  |
| 286 | top-7-custom-eggless-cake-designs-kids-birthdays | 9 | 0 | 15.7 | 0.0 |  |
| 287 | eggless-cake-vs-brownies | 8 | 0 | 7.4 | 0.0 |  |
| 288 | eggless-cakes-bat-mitzvah-sydney | 8 | 0 | 22.0 | 0.0 |  |
| 289 | eggless-cakes-chuseok-sydney | 8 | 1 | 4.6 | 12.5 |  |
| 290 | eggless-cakes-kings-langley | 8 | 0 | 11.2 | 0.0 |  |
| 291 | eggless-cakes-bella-vista | 7 | 0 | 20.1 | 0.0 |  |
| 292 | eggless-cakes-berkshire-park | 7 | 0 | 4.0 | 0.0 |  |
| 293 | eggless-cakes-diwali-indian-festivals-sydney | 7 | 0 | 25.3 | 0.0 |  |
| 294 | eggless-cakes-mothers-day-sydney | 7 | 0 | 9.6 | 0.0 |  |
| 295 | eggless-cakes-purim-sydney | 7 | 0 | 29.6 | 0.0 |  |
| 296 | eggless-cakes-retirement-sydney | 7 | 0 | 13.6 | 0.0 | dual-indexed |
| 297 | eggless-cakes-rydalmere | 7 | 0 | 13.7 | 0.0 |  |
| 298 | eggless-cupcakes-sydney | 7 | 0 | 10.7 | 0.0 |  |
| 299 | eggless-cake-trends-sydney-2026 | 6 | 0 | 6.2 | 0.0 |  |
| 300 | eggless-cakes-corporate-events-sydney | 6 | 0 | 12.0 | 0.0 |  |
| 301 | eggless-cakes-eid-ul-adha-sydney | 6 | 0 | 28.0 | 0.0 |  |
| 302 | eggless-cakes-fairfield | 6 | 0 | 29.5 | 0.0 |  |
| 303 | eggless-cakes-glenwood | 6 | 0 | 7.3 | 0.0 |  |
| 304 | eggless-cakes-guildford | 6 | 0 | 9.3 | 0.0 |  |
| 305 | eggless-cakes-lunar-new-year-sydney | 6 | 0 | 12.2 | 0.0 |  |
| 306 | eggless-cakes-ramadan-sydney | 6 | 0 | 8.2 | 0.0 |  |
| 307 | reunion-cake-sydney | 6 | 0 | 7.8 | 0.0 |  |
| 308 | assyrian-new-year-kha-b-nisan-sydney | 5 | 0 | 10.8 | 0.0 |  |
| 309 | basant-panchami-saraswati-puja-sydney | 5 | 0 | 9.0 | 0.0 |  |
| 310 | best-eggless-cakes-near-me | 5 | 0 | 24.8 | 0.0 |  |
| 311 | eggless-cake-customization-sydney | 5 | 0 | 26.0 | 0.0 | .html-only indexed |
| 312 | eggless-cake-food-colouring-sydney | 5 | 1 | 14.8 | 20.0 |  |
| 313 | eggless-cake-sydney | 5 | 0 | 9.0 | 0.0 |  |
| 314 | eggless-cakes-easter-sydney | 5 | 0 | 9.4 | 0.0 |  |
| 315 | eggless-cakes-holroyd | 5 | 0 | 7.4 | 0.0 |  |
| 316 | eggless-cakes-lethbridge-park | 5 | 0 | 9.2 | 0.0 |  |
| 317 | eggless-cakes-quinceanera-sydney | 5 | 0 | 7.8 | 0.0 |  |
| 318 | eggless-cakes-tregear | 5 | 0 | 19.2 | 0.0 |  |
| 319 | why-we-chose-100-percent-eggless-bakery | 5 | 0 | 7.2 | 0.0 |  |
| 320 | cake-for-new-job-promotion-sydney | 4 | 0 | 7.2 | 0.0 |  |
| 321 | eggless-cakes-bar-mitzvah-sydney | 4 | 0 | 12.2 | 0.0 |  |
| 322 | eggless-cakes-bridal-shower-sydney | 4 | 0 | 4.5 | 0.0 | dual-indexed |
| 323 | eggless-cakes-eid-sydney | 4 | 0 | 7.5 | 0.0 |  |
| 324 | eggless-cakes-housewarming-sydney | 4 | 0 | 13.8 | 0.0 |  |
| 325 | eggless-cakes-rhodes | 4 | 0 | 10.2 | 0.0 |  |
| 326 | eggless-cakes-ugadi-sydney | 4 | 0 | 4.2 | 0.0 |  |
| 327 | eggless-cakes-wilberforce | 4 | 0 | 8.0 | 0.0 |  |
| 328 | songkran-thai-new-year-sydney | 4 | 0 | 5.0 | 0.0 |  |
| 329 | eggless-cake-online-order | 3 | 0 | 37.0 | 0.0 |  |
| 330 | eggless-cake-seasonal-flavours | 3 | 0 | 9.3 | 0.0 |  |
| 331 | eggless-cakes-camellia | 3 | 0 | 6.7 | 0.0 |  |
| 332 | eggless-cakes-christmas-sydney | 3 | 0 | 15.7 | 0.0 |  |
| 333 | eggless-cakes-graduation-sydney | 3 | 0 | 33.3 | 0.0 |  |
| 334 | eggless-cakes-vishu-sydney | 3 | 0 | 4.7 | 0.0 |  |
| 335 | eggless-cakes-yalda-night-sydney | 3 | 0 | 4.3 | 0.0 |  |
| 336 | eggless-mini-cakes-cupcake-towers-sydney | 3 | 1 | 7.0 | 33.33 |  |
| 337 | halloween-cake-sydney | 3 | 0 | 6.0 | 0.0 |  |
| 338 | orthodox-christmas-cakes-sydney | 3 | 0 | 9.7 | 0.0 |  |
| 339 | passover-cakes-sydney | 3 | 0 | 8.7 | 0.0 |  |
| 340 | sensory-friendly-cake-sydney | 3 | 0 | 6.3 | 0.0 |  |
| 341 | winter-cake-sydney | 3 | 0 | 6.7 | 0.0 |  |
| 342 | eggless-cakes-confirmation-sydney | 2 | 0 | 7.0 | 0.0 |  |
| 343 | eggless-cakes-fairfield-heights | 2 | 0 | 7.0 | 0.0 |  |
| 344 | hanukkah-cakes-sydney | 2 | 0 | 15.0 | 0.0 |  |
| 345 | how-to-order-custom-eggless-cake-online | 2 | 0 | 9.5 | 0.0 |  |
| 346 | cake-for-university-events-sydney | 1 | 0 | 12.0 | 0.0 |  |
| 347 | eggless-cake-cancellation-policy-sydney | 1 | 0 | 6.0 | 0.0 |  |
| 348 | eggless-cakes-nelson-nsw | 1 | 0 | 8.0 | 0.0 |  |
| 349 | eggless-cakes-new-year-sydney | 1 | 0 | 28.0 | 0.0 |  |
| 350 | eggless-cake-design-ideas-sydney | 0 | 0 | - | - |  |
| 351 | eggless-cake-recipe-vs-bakery-sydney | 0 | 0 | - | - |  |
| 352 | eggless-cakes-bidwill | 0 | 0 | - | - |  |
| 353 | eggless-cakes-holi-sydney | 0 | 0 | - | - |  |
| 354 | eggless-cakes-janmashtami-sydney | 0 | 0 | - | - |  |
| 355 | eggless-cakes-north-rocks | 0 | 0 | - | - |  |
| 356 | eggless-cakes-vaisakhi-sydney | 0 | 0 | - | - |  |
| 357 | eggless-cakes-wentworthville | 0 | 0 | - | - |  |
| 358 | milestone-birthday-cake-sydney | 0 | 0 | - | - |  |
| 359 | tiered-cakes-sydney | 0 | 0 | - | - |  |

## Site-level context: top non-blog pages (same 90-day window)

For comparison — how blog traffic stacks up against core site pages.

| # | Page | Impressions | Clicks | Avg Position | CTR % |
|---:|---|---:|---:|---:|---:|
| 1 | https://numnumsbakery.com.au/ | 21466 | 1061 | 13.7 | 4.94 |
| 2 | https://numnumsbakery.com.au/cakes | 4747 | 53 | 14.5 | 1.12 |
| 3 | https://numnumsbakery.com.au/order | 2699 | 27 | 5.3 | 1.0 |
| 4 | https://numnumsbakery.com.au/indian-sweet | 2212 | 20 | 10.8 | 0.9 |
| 5 | https://numnumsbakery.com.au/about | 1378 | 6 | 4.9 | 0.44 |
| 6 | http://www.numnumsbakery.com.au/ | 1240 | 61 | 7.6 | 4.92 |
| 7 | https://numnumsbakery.com.au/blog | 534 | 4 | 14.6 | 0.75 |
| 8 | https://numnumsbakery.com.au/contact/ | 109 | 0 | 14.7 | 0 |
| 9 | https://numnumsbakery.com.au/indian-sweet/ | 18 | 0 | 7.7 | 0 |
| 10 | https://numnumsbakery.com.au/services/ | 16 | 0 | 42.2 | 0 |
| 11 | https://numnumsbakery.com.au/portfolio/vanilla-cake/ | 12 | 0 | 47.5 | 0 |
| 12 | https://numnumsbakery.com.au/services/birthday-cakes/ | 12 | 0 | 59 | 0 |
| 13 | https://numnumsbakery.com.au/pastry/ | 10 | 0 | 6.2 | 0 |
| 14 | https://numnumsbakery.com.au/portfolio/berry-cupcaces/ | 8 | 0 | 46.6 | 0 |
| 15 | https://numnumsbakery.com.au/category/cake/ | 4 | 0 | 3.5 | 0 |
| 16 | https://numnumsbakery.com.au/portfolio/tiramisu-cake/ | 4 | 0 | 59.2 | 0 |
| 17 | https://numnumsbakery.com.au/our-team/ | 3 | 0 | 3.3 | 0 |
| 18 | https://numnumsbakery.com.au/portfolio/brownie-cream-cake/ | 3 | 0 | 5.7 | 0 |
| 19 | https://numnumsbakery.com.au/croissant-tart-section/ | 2 | 0 | 5 | 0 |
| 20 | https://numnumsbakery.com.au/portfolio/baby-shower-cake/ | 1 | 0 | 82 | 0 |

Site-wide totals (all pages, all queries, 90d, `totals_complete=true`): 70293 impressions, 1965 clicks, avg position 11.4, CTR 2.8%.

## Methodology notes / caveats

- Pulled with `dimensions=page`, `limit=25000`, no page-path filter available in `gsc_query.py` — filtered client-side to `/blog/` URLs after the fact. Row count returned (381 total site pages) is well under the 25000 cap, so no truncation.
- `>10 impressions` threshold per task instructions is a rough dead-weight cutoff, not a scientific one. Several posts sit exactly at or near the 10-impression line and are borderline, not automatic prunes — cross-check against the cluster-analysis report before deleting.
- GSC's Search Analytics API only returns rows it has recorded data for; it doesn't return explicit 0-impression rows for unindexed URLs. "Never appears" = absent from the API response entirely, not a returned zero.
- Position/CTR are meaningless at very low impression counts (e.g. 1-3 impressions) — don't read signal into those columns below ~10 impressions.
