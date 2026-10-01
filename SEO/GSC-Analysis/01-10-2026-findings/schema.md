# Schema / Structured Data Audit - disk state, 2026-10-01

Scope: 241 HTML files (6 root pages + 235 blog/*.html), 245 JSON-LD blocks, 6,715 nodes. Programmatic, local files only.

## Passing checks (counts)
- JSON parse failures: 0 of 245 blocks.
- @context: all "https://schema.org".
- Invalid @type: 0. "BakeryOrCafe" remaining: 0. Types in use: Organization 252, Bakery 357, LocalBusiness 1, PostalAddress 358, GeoCoordinates 332, OpeningHoursSpecification 525, Article 234, WebPage 224, BreadcrumbList 240, FAQPage 236, Person 270, Product 6, Review 15, AggregateRating 4, Service 1, AboutPage 1, WebSite 1, ItemList 2.
- Wikidata Q140076208 present on every sameAs array that exists: 0 arrays lack it.
- Article nodes (234): 0 missing headline/datePublished/dateModified/author/publisher/image/mainEntityOfPage. 0 non-ISO dates.
- FAQPage structure valid (Question.name + acceptedAnswer.text) on all 236 pages.
- BreadcrumbList: 240 of 241 files (only index.html has none, which is correct). Positions sequential, names present, URLs absolute https.
- Harris Park: single coordinate pair (-33.8206078, 151.0089521) on 178 nodes. Riverstone: single pair (-33.6785397, 150.8610698) on 153 nodes. Harris Park hours uniform (daily 11:00-22:00) on 189 nodes. Phone uniform (+61425697725) everywhere.
- Brand scope: no non-eggless product implied in any node. Hits for brownies/ice cream/pavlova/tart/quiche are comparison FAQs on eggless-cake-vs-* posts saying the bakery does not sell them; "Cookies & Cream" is a flavour name. Info only.

## Findings

### 1. CRITICAL - Entity nodes missing the Wikidata sameAs (13 nodes in 11 files)
Rule: every Organization/Bakery/LocalBusiness node must carry sameAs containing https://www.wikidata.org/wiki/Q140076208.
Current value: no sameAs property. Corrected value: `"sameAs": ["https://www.wikidata.org/wiki/Q140076208"]` (or the full node reference below).
- index.html: Bakery `#harrispark` (no sameAs at all; the Riverstone twin has it).
- indian-sweet.html: 6 inline `seller` nodes inside the Product Offers, `{"@type":"Organization","name":"Num Num's Bakery"}`. Fix: replace with `{"@id":"https://numnumsbakery.com.au/#organization"}`.
- Publisher nodes that are bare name/url:
  - blog/eggless-cake-for-pooja-sydney.html: `{"@type":"Organization","name":"Num Num's Bakery","url":"https://numnumsbakery.com.au"}`
  - blog/naked-cake-sydney.html: same
  - blog/why-we-chose-100-percent-eggless-bakery.html: name + logo only
  - Fix for all three: `"publisher":{"@id":"https://numnumsbakery.com.au/#organization"}`. Each page already defines the full node, which does carry the Wikidata link.
- Typed @id-only reference stubs, not real omissions (Low): blog/eggless-cake-for-vegetarians-sydney.html (1 node), blog/luxury-cake-sydney.html (2 nodes). These also cause finding 8.

### 2. HIGH - Riverstone openingHoursSpecification stale on 167 of 168 Riverstone nodes
Current value (167 nodes, including index.html and indian-sweet.html):
`Mon-Fri 06:00-20:00; Sat-Sun 07:00-19:00`.
Corrected value (matches locations.html, the one correct page, and ops/catalog.mjs COLLECTION: Riverstone 9:00am-6:30pm):
`[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],"opens":"09:00","closes":"18:30"}]`
Affected: all blog/*.html carrying a #riverstone node, plus index.html and indian-sweet.html. Count 167; list by script, over 40 files. Only locations.html has 09:00-18:30.
Harris Park 11:00-22:00 is consistent and correct.

### 3. HIGH - Coordinate drift: 1 wrong LocalBusiness node
blog/eggless-cakes-near-me-sydney.html: standalone `LocalBusiness` (no @id, address emitted as a one-element array) at Harris Park with geo (-33.8196, 151.0014).
Corrected: geo (-33.8206078, 151.0089521), and retype to the shared pattern: `{"@type":"Bakery","@id":"https://numnumsbakery.com.au/#harrispark","name":"Num Num's Bakery - Harris Park",...}` (or an @id reference to #harrispark). Without an @id this node is a third, unlinked entity, and it is the only LocalBusiness type on the site.
No other coordinate drift: exactly one pair per physical address otherwise.

### 4. HIGH - Missing geo on 26 Bakery nodes
- #harrispark: 11 nodes; #riverstone: 15 nodes.
- Examples: blog/cake-design-trends-sydney-2026.html, cake-message-ideas-sydney.html, cake-vs-dessert-table-sydney.html, drip-cake-sydney.html, eggless-cake-for-vegetarians-sydney.html, eggless-cake-wholesale-sydney.html (full list by script).
- Add: Harris Park `{"@type":"GeoCoordinates","latitude":-33.8206078,"longitude":151.0089521}`; Riverstone `{"@type":"GeoCoordinates","latitude":-33.6785397,"longitude":150.8610698}`.

### 5. MEDIUM - Missing image and priceRange on most Bakery nodes
- `image` missing: Harris Park 179 of 357 nodes, Riverstone 158 of 168 (Google requires `image` for LocalBusiness rich results).
  - Harris Park value: https://numnumsbakery.com.au/brand_assets/num_nums_HPphoto.jpeg
  - Riverstone value: https://numnumsbakery.com.au/brand_assets/riverstone_store_img.webp
- `priceRange` missing: Harris Park 177, Riverstone 157. Corrected: `"priceRange":"$$"` (the 23 nodes that have it use "$$").
- Only about 17 pages carry a fully complete pair. Recommended fix: a single shared template, or reference the full nodes by @id.

### 6. MEDIUM - Riverstone streetAddress variants (NAP)
- "Shop 8, Riverstone Shopping Centre" (165 nodes) vs "Shop 8, Riverstone Shopping Centre (Riverstone Village)" (3 nodes: index.html, indian-sweet.html, locations.html).
- Corrected: "Shop 8, Riverstone Shopping Centre" everywhere. Harris Park "Shop 1, 96-98 Wigram Street" is consistent on 190 nodes.
- Name drift: 3 Bakery nodes named "Num Num's Bakery" carry the @id #harrispark (blog/custom-cake-sydney.html, eggless-cake-sydney.html, eggless-cakes-eid-sydney.html). Corrected: "Num Num's Bakery - Harris Park" (use the em dash form the other 186 nodes use).
- Org name "Num Nums Bakery" (no apostrophe) in blog/eggless-cake-for-vegetarians-sydney.html. Corrected: "Num Num's Bakery".

### 7. MEDIUM - Dangling @id references (3)
- order.html: Service.provider -> `#riverstone` and `#harrispark` are not defined on that page. Fix: inline the two Bakery nodes, or point provider at `#organization`.
- about.html: AboutPage.isPartOf -> `https://numnumsbakery.com.au/#website`. WebSite is defined only on index.html. Fix: add a WebSite node to about.html, or drop isPartOf.

### 8. LOW - Duplicate @id emissions on one page (2 pages)
- blog/luxury-cake-sydney.html: `#organization` emitted 3 times (1 full, plus author and publisher stubs typed as Organization).
- blog/eggless-cake-for-vegetarians-sydney.html: 2 times (1 full, plus the publisher stub).
- Corrected: reference stubs should be `{"@id":"https://numnumsbakery.com.au/#organization"}` with no @type. Neither of these pages has a name/sameAs conflict. luxury-cake also lacks name and sameAs on one of its nodes.

### 9. MEDIUM - Product/Offer defects on indian-sweet.html
- "Gulab Jamun & Rasgulla": the Offer has no `price`, so it is ineligible for Product rich results. Add a `price`, or remove `offers`.
- The other five Products are priced per kg using a UnitPriceSpecification. Valid.
- No `image`, `aggregateRating` or `review` on any of the six Products.

### 10. MEDIUM - Self-serving AggregateRating
- index.html (2 Bakery nodes) and locations.html (2 Bakery nodes): ratingValue 4.6, reviewCount 50, identical on both stores. Google ignores self-serving LocalBusiness reviews, and the single 50-review figure duplicated on both shops is unlikely to be true per store.
- Value types are inconsistent: index.html uses numbers, locations.html uses strings. Prefer numbers.
- Verify against the real GBP count per store, or remove.

### 11. LOW - Placeholder-looking text
blog/cake-for-work-anniversary-sydney.html: 4 FAQ answers contain `"5 Years of [Name]"` / `"[Name] - 10 Years Strong"`. This is intentional example copy in the answer, not an unfilled template. Info.

### 12. LOW - Organization node inconsistency
- Organization `url`: "https://numnumsbakery.com.au/" on 118 pages vs no trailing slash on 122. Normalise to one form, `https://numnumsbakery.com.au/`.
- Logo: 4 different logo files (Logo_TParent.png, Logo_TParent_56.webp, Logo.png on blog/eggless-cake-delivery-sydney.html, Num_Nums_Logo.png on blog/eggless-cake-for-vegetarians-sydney.html); string and ImageObject shapes are mixed; 85 Organization nodes have no logo. Standardise to the ImageObject for Logo_TParent.png.
- Facebook sameAs variants:
  - `/Numnumsbakeryharrispark/` on 232 nodes
  - `/numnumsbakery` on 21 nodes
  - `/numnum.com.au/` on blog/eggless-cake-delivery-sydney.html
  - `/numnumsbakery/` on blog/eggless-cake-for-vegetarians-sydney.html
  - Pick the real page and normalise all 255 to it.
- sameAs arrays also carry Instagram/Facebook. The rule says "containing" the Wikidata URL, so this passes. 581 sameAs arrays hold extra entries. Info only: if the rule really means "exactly" that URL, all 581 fail.
- Mixed-Organization-type pattern: Organization plus 2 Bakery nodes per page with no `parentOrganization`/`branchOf` link between them. Add `"parentOrganization":{"@id":"https://numnumsbakery.com.au/#organization"}`. The legal entity GNT Ventures Pty Ltd (ABN 39 634 402 412) is not expressed anywhere. Consider `legalName` and `taxID`/`vatID` on the Organization (confirm with Vaidik first).

### 13. INFO - FAQPage on 236 pages (index, indian-sweet, 234 blog posts)
FAQ rich results were retired for all sites on 7 May 2026. There is no Google SERP benefit, and any AI/GEO benefit is unconfirmed. Structure is valid, so it is not an error. Do not add more. Genuine user-Q&A pages would use QAPage. Leave in place or remove in bulk at your discretion; it adds weight to every page.

### 14. INFO - Other
- Review (15) / Rating (15) nodes sit on index/locations; check each is a real, visible customer review.
- WebSite SearchAction exists on index.html only. Verify the target actually exists, otherwise drop it (Google retired the Sitelinks Search Box).
- Missing opportunities: Bakery nodes lack `hasMap`, `areaServed`, `paymentAccepted` and `acceptsReservations`; the Service on order.html has no `offers`; no ImageObject on blog Article nodes was verified for dimensions.

SCHEMA_SCORE: 62/100

Justification: syntax and type hygiene are excellent (0 parse failures, 0 invalid types, 0 BakeryOrCafe, Articles 234/234 complete, breadcrumbs correct, one coordinate pair per store). Points lost for: 13 entity nodes missing the Wikidata sameAs (Critical rule, -12), 167 stale Riverstone opening-hour nodes (-10), one off-pattern LocalBusiness with wrong geo (-4), 26 nodes lacking geo and most lacking image/priceRange (-6), the dangling @ids, the Gulab Jamun offer defect and the self-serving rating (-6).
BASIS: static analysis of 241 local files on disk (python json/regex over every ld+json block); no live fetch, no rendering, no Rich Results Test validation, and the Wikidata Q-id itself was not verified online.
