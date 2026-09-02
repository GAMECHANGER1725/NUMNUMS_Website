# GBP Audit — Num Num's Bakery, Riverstone
**Date:** 2026-09-02 · **Auditor:** external-only (no GBP dashboard access)
**Recommendation source:** `SEO and Content Strategy Frameworks for Num Num's Bakery.md` (§3 location architecture, §5 GEO/AI, §6 foundations). Anything not in that report is tagged **Implementation inference**.

> **Verification rule applied:** every row below is either something actually observed on a public page, or marked `NOT EXTERNALLY VERIFIABLE — dashboard required`. Nothing is estimated.

---

## 1. Observed state

### 1a. Site-side source of truth (repo)

| Field | Value | Where seen |
|---|---|---|
| Schema name | `Num Num's Bakery Riverstone` | `locations.html:207`, `index.html:590` |
| og:site_name | `Num Nums Bakery` (no apostrophe) | `locations.html:35` |
| GBP spec legal / DBA name | `Num Nums Bakery` / `Num Num's Bakery` | `GBP/gbp-numnums-riverstone.md` |
| Street address | `Shop 8, Riverstone Shopping Centre` | `locations.html:215`, `index.html:599`, visible card `locations.html:583` |
| Suburb / region / postcode | `Riverstone` / `NSW` / `2765` | `locations.html:216-218` |
| Phone (schema) | `+61425697725` — **same number as Harris Park** | `locations.html:212` |
| Phone (displayed) | `+61 425 697 725` | `locations.html` location card + prose |
| Hours | Mon–Fri `06:00`–`20:00`; Sat–Sun `07:00`–`19:00` | `locations.html:226-238` |
| Coordinates | `-33.6785397, 150.8610698` | `locations.html:221-225` |
| Google Maps / hasMap | `https://www.google.com/maps/place/Num+Nums+Bakery+Riverstone/@-33.6785397,150.8610698` | `locations.html:271`, `llms.txt` |
| Google CID (from embedded map) | ftid `0x6b129ff332f26b8f:0xa801e90a98ce7923` → **cid 12106213505071216931** | map iframe `locations.html:613`; same cid on the Riverstone review button `index.html:1346` |
| Embedded map on location page | Present (Google Maps iframe) | `locations.html:613-616` |
| Location-specific testimonials | Present (3 named reviews in `#riverstone` node) | `locations.html:240-263` |
| Schema `aggregateRating` | `4.6` / `reviewCount 50` — **byte-identical to Harris Park** | `locations.html`, `index.html:624-629` |
| sameAs | Instagram `numnumsbakery`, Facebook `Numnumsbakeryharrispark`, Wikidata `Q140076208` — **all Harris-Park-scoped or shared** | `locations.html:272` |
| Opening date claimed on site | December 2024 (6 files) | `llms.txt`, `locations.html` prose |
| Intended primary category | `Cake shop` (same secondary set as Harris Park, 2 still `[VERIFY IN GBP]`) | `GBP/gbp-numnums-riverstone.md` §2 — **intended, not confirmed live** |
| Contact email published site-wide | `info.numnumsbakery@gmail.com` (18 occurrences, no variants) | `locations.html:726` |

### 1b. Externally observed listings

| Source (URL) | Name string | Address string | Phone | Category | Hours | Rating / reviews |
|---|---|---|---|---|---|---|
| Google Maps (cid 12106213505071216931) | NOT EXTERNALLY VERIFIABLE — Maps renders client-side; fetch returned an empty shell | same | same | same | same | same |
| ubereats.com/au/store/numnums-bakery-riverstone-village-shopping-centre/… | `Numnums Bakery (Riverstone Village Shopping Centre)` — listing title as it appears in search results | implied `Riverstone Village Shopping Centre` | NOT VERIFIED — page returns HTTP 403 to both fetcher and curl | NOT VERIFIED (403) | NOT VERIFIED (403) | NOT VERIFIED (403) |
| menulog.com.au/restaurants-num-nums-bakery-riverstone | `Num Nums Bakery - Riverstone` — listing title as it appears in search results | NOT VERIFIED — HTTP 403 | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| facebook.com/Numnumsbakeryharrispark | `Num Nums Bakery`, `Sydney NSW` — **Harris-Park-named page, no Riverstone-specific page found** | not readable (login wall) | not readable | not readable | not readable | not readable |
| instagram.com/numnumsbakery | `numnumsbakery` — bio: "100% Eggless Cakes & Indian Sweets 🎂 Custom cakes, pastries & festive treats. Sydney's favourite vegetarian bakery". **No Riverstone-specific account** | none shown | none shown | — | — | 263 followers, 67 following |
| RestaurantGuru / magicpin / vegspoons | **No Riverstone entry found** — all three index only the Harris Park store | — | — | — | — | — |
| Yellow Pages AU / TrueLocal / Yelp AU / Zomato / Hotfrog / Localsearch | **No listing found in search for any of these** | — | — | — | — | — |
| Riverstone Village Shopping Centre (venue itself) | Confirmed as a real centre on Riverstone Parade, Riverstone NSW 2765, opposite the train station | — | — | shopping centre | — | — |

---

## 2. NAP consistency matrix

Site value = `Num Num's Bakery` · `Shop 8, Riverstone Shopping Centre, Riverstone NSW 2765` · `+61 425 697 725`

| Listing | Name | Address | Phone | Website |
|---|---|---|---|---|
| Google Business Profile | NOT EXTERNALLY VERIFIABLE | NOT EXTERNALLY VERIFIABLE | NOT EXTERNALLY VERIFIABLE | NOT EXTERNALLY VERIFIABLE |
| Uber Eats | **FAIL** — `Numnums Bakery` (one word, no apostrophe) | **FAIL** — venue named `Riverstone Village Shopping Centre`, site says `Riverstone Shopping Centre` | NOT VERIFIED (403) | NOT VERIFIED (403) |
| Menulog | **FAIL** — `Num Nums Bakery - Riverstone` (hyphenated suburb suffix, no apostrophe) | NOT VERIFIED (403) | NOT VERIFIED (403) | NOT VERIFIED (403) |
| Facebook | **FAIL** — no Riverstone page exists; the shared page is named for Harris Park | n/a — no Riverstone address published anywhere on social | n/a | NOT VERIFIED |
| Instagram | **FAIL** — no Riverstone-specific presence; no address in bio | n/a | n/a | NOT VERIFIED |
| RestaurantGuru / magicpin / vegspoons / YP / TrueLocal / Yelp / Zomato | **FAIL — absent** (no citation at all) | — | — | — |

**Name variants in circulation:** `Num Num's Bakery Riverstone`, `Num Nums Bakery - Riverstone`, `Numnums Bakery`, `Num Nums Bakery`.
**Address variants in circulation:** `Riverstone Shopping Centre` (site, 1034 occurrences) vs `Riverstone Village Shopping Centre` (Uber Eats listing title, and the centre's own public name).
**Phone:** one number shared with Harris Park. The report does not prohibit this; the GBP spec file explicitly accepts it for multi-location businesses. **Implementation inference:** a distinct tracked line per location would make Insights attributable, but the report says nothing about it.

**Internal repo conflict (not GBP, but a NAP source):** factory address is `10-12A Wingate Road, Mulgrave NSW 2756` in `locations.html:658` but `2/4 Nelson Road, Yennora NSW 2161` in `llms.txt`. Two different published addresses.

---

## 3. Externally-verifiable checks

| Check | Result | Evidence |
|---|---|---|
| GBP exists for this location, separate from Harris Park | **PASS** | Distinct Google feature id `0x6b129ff332f26b8f:0xa801e90a98ce7923` / cid `12106213505071216931`, distinct from the Harris Park cid. §3 of the report requires exactly this |
| Categories present on live GBP | NOT EXTERNALLY VERIFIABLE — dashboard required | Intended set in `GBP/gbp-numnums-riverstone.md`; 2 secondaries still `[VERIFY IN GBP]` |
| Hours present and correct | NOT EXTERNALLY VERIFIABLE — dashboard required. **No external source republishes Riverstone hours at all**, so there is nothing to cross-check against | — |
| Photos present on GBP | NOT EXTERNALLY VERIFIABLE — dashboard required | Repo has an unpushed image set at `GBP/Cake_Photos_(GBP)-copy/` |
| Google review count | NOT EXTERNALLY VERIFIABLE — dashboard required. **Zero third-party sources carry a Riverstone rating** (unlike Harris Park, which has three) | — |
| Google average rating | NOT EXTERNALLY VERIFIABLE — dashboard required | — |
| Posts recent (last 30 days) | NOT EXTERNALLY VERIFIABLE — dashboard required. **Repo evidence says no:** last `status: published` entry in `GBP/posts-queue.md` is `2026-06-14` (~11 weeks ago) and the pending post carries `note: "Webhook POST could not be sent from remote environment"` | `GBP/posts-queue.md` |
| Website link on GBP correct | NOT EXTERNALLY VERIFIABLE — dashboard required | — |
| Products / services listed on GBP | NOT EXTERNALLY VERIFIABLE — dashboard required | Intended list in `GBP/gbp-numnums-riverstone.md` §3 |
| Business description present | NOT EXTERNALLY VERIFIABLE — dashboard required | — |
| Location page has embedded map | **PASS** | `locations.html:613` |
| Location page has location-specific testimonials | **PASS** | `locations.html:240-263` |
| LocalBusiness schema with precise NAP + coordinates | **PASS on structure, FAIL on precision** | Full `PostalAddress` + `GeoCoordinates` present, but the venue name in `streetAddress` appears to be wrong (see P1) |
| Citation footprint | **FAIL** | Two food-delivery aggregators and nothing else. Nine months after opening, the location has effectively no owner-maintained citations |
| Distinct social/`sameAs` signals for this location | **FAIL** | `sameAs` points at a Facebook page named `Numnumsbakeryharrispark` and a shared Instagram account |

---

## 4. Dashboard-only checks — owner, ~10 minutes

Answer each yes/no in the GBP dashboard for **Riverstone**. No interpretation needed.

- [ ] Is the business name in GBP exactly `Num Num's Bakery` (with apostrophe, no suburb, no keywords)?
- [ ] Does the address in GBP say `Riverstone Shopping Centre` or `Riverstone Village Shopping Centre`? (record which)
- [ ] Is the shop number `Shop 8` present in the address?
- [ ] Is the listed phone `+61 425 697 725`?
- [ ] Is the website field exactly `https://numnumsbakery.com.au` (not the Harris Park page, not a bare domain variant)?
- [ ] Is the primary category `Cake shop`?
- [ ] Are `Wedding bakery` and `Cupcake shop` available in the category autocomplete, and are they added?
- [ ] Is the profile marked "Verified" with no pending verification or reinstatement banner?
- [ ] Does GBP show any "Your profile is incomplete" or "Add missing info" prompt right now?
- [ ] Is the business description filled in (non-empty), and does it describe Riverstone rather than Harris Park?
- [ ] Are there zero unanswered questions in the Q&A tab?
- [ ] Is the Products section populated with at least one product?
- [ ] Is the Services section populated?
- [ ] Are the attributes set (e.g. Vegetarian options, Takeaway, Wheelchair access, Payment types)?
- [ ] Is messaging turned on or off? (record which)
- [ ] Is there at least one GBP post published in the last 30 days?
- [ ] Are there any owner-uploaded photos added in the last 30 days?
- [ ] Are there any reviews from the last 90 days with no owner reply?
- [ ] Does the "Opening date" field show December 2024?
- [ ] Are the Mon–Fri 6:00am open and Sat–Sun 7:00am open times both set correctly?
- [ ] Is there a duplicate listing suggestion, or any merge prompt linking this profile to Harris Park?
- [ ] Record from Performance (last 28 days): calls, direction requests, website clicks, profile views (searches + views).

---

## 5. Findings, prioritised

### P1 — The venue name in the published address is likely wrong, in 1034 places
**What's wrong:** the site says `Riverstone Shopping Centre` everywhere (1034 occurrences across HTML, plus `llms.txt` and both schema nodes). The Uber Eats listing for this store is titled `Numnums Bakery (Riverstone Village Shopping Centre)`, and the centre on Riverstone Parade is publicly named **Riverstone Village Shopping Centre**.
**Why it matters:** §3 of the report requires each location page to carry "LocalBusiness schema with precise NAP and coordinates", and §6 names NAP consistency across site and citations as foundational. A wrong venue name is a NAP mismatch replicated at scale.
**Exact fix:** confirm the exact centre name on the GBP listing, then, if it is `Riverstone Village Shopping Centre`, run a repo-wide replace of the address string in `locations.html`, `index.html`, `llms.txt` and every blog post that carries the address, and update the GBP address to match. Do not change it before confirming the GBP value — the GBP address is the string everything else must agree with.
**Effort:** 5 min to confirm, ~45 min to propagate.

### P2 — Riverstone has essentially no citations, nine months after opening
**What's wrong:** the only external listings found are Uber Eats and Menulog. No RestaurantGuru, no magicpin, no vegspoons, no Yellow Pages, TrueLocal, Yelp AU, Zomato, Hotfrog or Localsearch entry — while Harris Park appears on five aggregators.
**Why it matters:** §5 states AI systems select sources on "strong local authority signals (GBP completeness, reviews, citations)", and §6 names citations among the foundational levers. Ref 18 (Google's own guidance, cited by the report) puts local ranking on "relevance, distance, and popularity" — Riverstone currently supplies almost no popularity signal outside Google itself.
**Exact fix:** create verified, owner-controlled listings for Riverstone with the exact final NAP from P1 on the major AU directories, then check them against the site quarterly. **Implementation inference:** the report names citations as the lever but does not specify which directories.
**Effort:** 2–3 hours one-off.

### P3 — GBP posting has silently stopped (~11 weeks)
**What's wrong:** last published GBP post logged `2026-06-14`; the next is stuck `pending` with a recorded webhook delivery failure.
**Why it matters:** §6 treats routine GBP posts and review responses as the baseline of "good" ongoing local performance; §5 names GBP completeness as a lever for AI citation.
**Exact fix:** run the stored `curl_command` at the bottom of `GBP/posts-queue.md` to publish the pending post, fix the publisher so the Make webhook is reachable from the environment the routine runs in, and mark the entry `published`.
**Effort:** 15 min to unblock, plus one routine fix.

### P4 — Both locations publish the same fabricated-looking rating (4.6 / 50)
**What's wrong:** the Riverstone `aggregateRating` is byte-identical to Harris Park's. Two separate profiles cannot legitimately have the same rating and the same review count. Every observable third-party scrape of the Harris Park rating says `4.1`; nothing external corroborates `4.6` for either.
**Why it matters:** §6 names "failing to align GBP and website location pages" as a documented pitfall, and correct LocalBusiness schema as foundational.
**Exact fix:** read each location's true rating and review count from its own GBP dashboard and set each node independently. If the real figures cannot be kept current, remove `aggregateRating` rather than publish a stale or shared one. **Implementation inference:** the report does not address self-published rating markup specifically.
**Effort:** 20 min once the dashboard numbers are recorded.

### P5 — Every off-site identity signal for Riverstone points at Harris Park
**What's wrong:** the Riverstone schema node's `sameAs` lists a Facebook page named `Numnumsbakeryharrispark` and a shared Instagram account whose bio carries no address. There is no Riverstone-scoped profile anywhere.
**Why it matters:** §3 calls for each physical location to have its own GBP and its own local signals; §5 ties AI citation to local authority signals that corroborate the profile.
**Exact fix:** at minimum, add the Riverstone address and hours to the shared Facebook page's location/About fields and put a locations link in the Instagram bio, so both profiles corroborate the Riverstone NAP. **Implementation inference:** the report does not require a separate social profile per location.
**Effort:** 20 min.

### P6 — Name string is inconsistent even inside the repo
**What's wrong:** `Num Num's Bakery Riverstone` (schema `name`), `Num Nums Bakery` (`og:site_name`), `Num Num's Bakery` (visible), `Num Nums Bakery` (GBP spec `legal_name`). The aggregators have already diverged into `Numnums Bakery` and `Num Nums Bakery - Riverstone`.
**Why it matters:** foundational NAP consistency (§6).
**Exact fix:** standardise on `Num Num's Bakery` for the public name and the GBP name field; keep the suburb out of the GBP name and distinguish locations by address and schema `@id`.
**Effort:** 15 min.

---

## 6. Baseline metrics to record today

Write these down now so the 4–6 week and 8–12 week checkpoints have a comparison point.

**Externally captured 2026-09-02 (this audit):**

| Metric | Value | Source |
|---|---|---|
| Third-party sources carrying a Riverstone rating | **0** | this audit |
| Distinct external listings found | 2 (Uber Eats, Menulog) + 2 shared social accounts (Facebook, Instagram) | this audit |
| Owner-maintained AU directory listings found | 0 | this audit |
| Riverstone-specific social profiles | 0 | this audit |
| Instagram followers (shared account) | 263 | instagram.com/numnumsbakery |
| Days since last logged GBP post | 80 (2026-06-14 → 2026-09-02) | `GBP/posts-queue.md` |
| Site schema `aggregateRating` as published | 4.6 / 50 (identical to Harris Park) | `locations.html`, `index.html:624-629` |
| Address string published on site | `Shop 8, Riverstone Shopping Centre` × 1034 occurrences | repo grep |

**Dashboard-only — owner must fill in today (all currently `NOT EXTERNALLY VERIFIABLE`):**

| Metric | Value |
|---|---|
| Google review count (Riverstone) | ______ |
| Google average rating (Riverstone) | ______ |
| Total photo count on profile | ______ |
| Owner-uploaded photos in last 30 days | ______ |
| Calls, last 28 days | ______ |
| Direction requests, last 28 days | ______ |
| Website clicks, last 28 days | ______ |
| Profile views / searches, last 28 days | ______ |
| Unanswered Q&A count | ______ |
| Reviews awaiting a reply | ______ |
| Exact venue name as stored in the GBP address | ______ |
