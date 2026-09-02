# GBP Audit — Num Num's Bakery, Harris Park
**Date:** 2026-09-02 · **Auditor:** external-only (no GBP dashboard access)
**Recommendation source:** `SEO and Content Strategy Frameworks for Num Num's Bakery.md` (§3 location architecture, §5 GEO/AI, §6 foundations). Anything not in that report is tagged **Implementation inference**.

> **Verification rule applied:** every row below is either something actually observed on a public page, or marked `NOT EXTERNALLY VERIFIABLE — dashboard required`. Nothing is estimated.

---

## 1. Observed state

### 1a. Site-side source of truth (repo)

| Field | Value | Where seen |
|---|---|---|
| Schema name | `Num Num's Bakery Harris Park` | `locations.html:143`, `index.html:550` |
| og:site_name | `Num Nums Bakery` (no apostrophe) | `locations.html:35` |
| Visible name (header/footer) | `Num Num's Bakery` | `locations.html:478,708` |
| GBP spec legal / DBA name | `Num Nums Bakery` / `Num Num's Bakery` | `GBP/gbp-numnums-harris-park.md` |
| Street address | `96/96 Wigram Street` | `locations.html:152`, `index.html:559`, visible card `locations.html:527` |
| Suburb / region / postcode | `Harris Park` / `NSW` / `2150` | `locations.html:153-155` |
| Phone (schema) | `+61425697725` | `locations.html:149` |
| Phone (displayed) | `+61 425 697 725` | `locations.html` location card + prose |
| Hours | Mon–Sun `11:00`–`22:00` | `locations.html:163-169` |
| Coordinates | `-33.8206078, 151.0089521` | `locations.html:158-162` |
| Google Maps / hasMap | `https://www.google.com/maps/place/Num+Nums+Bakery/@-33.8206078,151.0089521` | `locations.html:201`, `llms.txt` |
| Google CID (from embedded map) | ftid `0x6b12a3bea913be43:0x866003779905e03b` → **cid 9682743011049857083** | map iframe `locations.html:566`; same cid used on review buttons in `index.html` |
| Embedded map on location page | Present (Google Maps iframe) | `locations.html:566-569` |
| Location-specific testimonials | Present (3 named reviews in `#harris-park` node) | `locations.html:176-200` |
| Schema `aggregateRating` | `4.6` / `reviewCount 50` | `locations.html:171-177`, `index.html:578-583` |
| sameAs | Instagram `numnumsbakery`, Facebook `Numnumsbakeryharrispark`, Wikidata `Q140076208` | `locations.html:202` |
| Website URL for GBP | `https://numnumsbakery.com.au` | `GBP/gbp-numnums-harris-park.md` |
| Intended primary category | `Cake shop` (secondaries: Bakery, Patisserie, Pastry shop, Dessert shop, Dessert restaurant, Confectionery store, Sweets and dessert buffet) | `GBP/gbp-numnums-harris-park.md` §2 — **intended, not confirmed live** |

### 1b. Externally observed listings

| Source (URL) | Name string | Address string | Phone | Category | Hours | Rating / reviews |
|---|---|---|---|---|---|---|
| Google Maps (cid 9682743011049857083) | NOT EXTERNALLY VERIFIABLE — Maps renders client-side; fetch returned an empty shell | same | same | same | same | same |
| restaurantguru.com/Num-Nums-Bakery-Harris-Park | `Num Nums Bakery` | `96/96 Wigram St, Harris Park, New South Wales, Australia` | `+61 425 697 725` | `Bakery/Dessert Restaurant` | Sun–Sat 11AM–10PM | `4.1/5` labelled "(Google)", `603 votes` — third-party scrape, freshness unknown |
| magicpin.com/…/Num-Nums-Bakery/store/27a6a4c | `Num Nums Bakery` | `96/96 Wigram St, Harris Park NSW 2150, Australia` | `61425697725` | `Restaurant/Bakery` | not listed | `4.1`, `358 reviews` |
| vegspoons.com/…/num-num-bakery-harris-park | `Num Num Bakery Harris Park` | `96/96 Wigram St, Harris Park NSW 2150, Australia` | not listed | `Bakery, Pure Vegetarian` | 11:00 AM–10:00 PM daily | `4.1`, stated as `609 Google Reviews` |
| atparramatta.com/…/num-nums-bakery | `Num Nums bakery` | `Shop 2 96-98 Wigram Street, Harris Park NSW 2150` | `02 9891 4957` | `Indian, Bakery/Patisserie` | not listed | none shown. Website listed as `https://numnums.com.au/`. Described as serving chicken tikka rolls, samosa, poori, chaat |
| doordash.com/en-AU/store/num-nums--bakery-harris-park-1417123 | `Num Nums Bakery` (page title in SERP) | `96/98 Wigram Street Harris Park` (page title in SERP) | NOT VERIFIED — page returns HTTP 403 to both fetcher and curl | — | — | NOT VERIFIED (403) |
| ubereats.com/au/store/numnums-bakery/… | `Numnums Bakery` (SERP title only) | NOT VERIFIED — HTTP 403 | — | — | — | NOT VERIFIED |
| facebook.com/Numnumsbakeryharrispark | `Num Nums Bakery`, `Sydney NSW` | not readable (login wall) | not readable | not readable | not readable | not readable |
| instagram.com/numnumsbakery | `numnumsbakery` — bio: "100% Eggless Cakes & Indian Sweets 🎂 Custom cakes, pastries & festive treats. Sydney's favourite vegetarian bakery" | none shown | none shown | — | — | 263 followers, 67 following. **One shared account for both stores** |
| bakesy.shop/b/num-nums-bakery-1/reviews | `Num Nums Bakery` | none shown | none shown | — | — | `2 ratings` — location unspecified, ownership unconfirmed |
| Yellow Pages AU / TrueLocal / Yelp AU / Zomato / Hotfrog / Localsearch | **No listing found in search for any of these** | — | — | — | — | — |

---

## 2. NAP consistency matrix

Site value = `Num Num's Bakery` · `96/96 Wigram Street, Harris Park NSW 2150` · `+61 425 697 725`

| Listing | Name | Address | Phone | Website |
|---|---|---|---|---|
| Google Business Profile | NOT EXTERNALLY VERIFIABLE | NOT EXTERNALLY VERIFIABLE | NOT EXTERNALLY VERIFIABLE | NOT EXTERNALLY VERIFIABLE |
| RestaurantGuru | **PASS** (`Num Nums Bakery`, apostrophe dropped — cosmetic) | **PASS** (`St` vs `Street` abbrev only) | **PASS** | **PASS** |
| magicpin | **PASS** (apostrophe dropped) | **PASS** (`St` abbrev) | **PASS** (unformatted digits) | **PASS** |
| vegspoons | **FAIL** — `Num Num Bakery Harris Park` (singular "Num Num", suburb appended) | **PASS** | n/a — no phone published | **FAIL** — no site link, page self-references |
| atParramatta | **FAIL** — `Num Nums bakery` (lowercase b) | **FAIL** — `Shop 2 96-98 Wigram Street` ≠ `96/96 Wigram Street` | **FAIL** — `02 9891 4957` ≠ `+61 425 697 725` | **FAIL** — `numnums.com.au` ≠ `numnumsbakery.com.au` |
| DoorDash | **FAIL** — `Num Nums Bakery` with address `96/98 Wigram Street` in listing title | **FAIL** — `96/98` ≠ `96/96` | NOT VERIFIED (403) | NOT VERIFIED (403) |
| Uber Eats | **FAIL** — `Numnums Bakery` (one word) | NOT VERIFIED (403) | NOT VERIFIED (403) | NOT VERIFIED (403) |
| Facebook | **PASS** on name (`Num Nums Bakery`) | NOT VERIFIED (login wall) | NOT VERIFIED | NOT VERIFIED |
| Instagram | **PASS** on handle | n/a — none published | n/a | NOT VERIFIED (link-in-bio not visible) |

**Name variants in circulation:** `Num Num's Bakery`, `Num Nums Bakery`, `Numnums Bakery`, `Num Nums bakery`, `Num Num Bakery Harris Park`, `Num Num's Bakery Harris Park`.
**Address variants in circulation:** `96/96 Wigram Street`, `96/98 Wigram Street`, `Shop 1/96/98 Wigram Street` (SERP snippet only, unverified), `Shop 2 96-98 Wigram Street`.
**Phone variants in circulation:** `+61 425 697 725`, `02 9891 4957`.

**Internal repo conflict (not GBP, but a NAP source):** the factory address is `10-12A Wingate Road, Mulgrave NSW 2756` in `locations.html:658` but `2/4 Nelson Road, Yennora NSW 2161` in `llms.txt`. Two different sites, both published. Fix before either is picked up as a citation.

---

## 3. Externally-verifiable checks

| Check | Result | Evidence |
|---|---|---|
| GBP exists for this location (separate from Riverstone) | **PASS** | Distinct Google feature id `0x6b12a3bea913be43:0x866003779905e03b` / cid `9682743011049857083`, distinct from the Riverstone cid, in the map embed and site review buttons |
| Categories present on live GBP | NOT EXTERNALLY VERIFIABLE — dashboard required | Intended set exists in `GBP/gbp-numnums-harris-park.md`; 2 secondaries are still `[VERIFY IN GBP]` |
| Hours present and correct | **PASS (indirect)** — Daily 11:00–22:00 matches on RestaurantGuru and vegspoons, both of which mirror Google | Live GBP hours themselves: dashboard required |
| Photos present on GBP | NOT EXTERNALLY VERIFIABLE — dashboard required | Repo has an unpushed image set at `GBP/Cake_Photos_(GBP)-copy/` |
| Google review count | NOT EXTERNALLY VERIFIABLE — dashboard required. Third-party scrapes disagree: 603 (RestaurantGuru), 609 (vegspoons), 358 (magicpin) | see §1b |
| Google average rating | NOT EXTERNALLY VERIFIABLE — dashboard required. Three independent scrapes all report **4.1** | see §1b |
| Posts recent (last 30 days) | NOT EXTERNALLY VERIFIABLE — dashboard required. **Repo evidence says no:** last `status: published` entry in `GBP/posts-queue.md` is `2026-06-14` (~11 weeks ago), and the one pending post carries `note: "Webhook POST could not be sent from remote environment"` — i.e. the publisher silently failed | `GBP/posts-queue.md` |
| Website link on GBP correct | NOT EXTERNALLY VERIFIABLE — dashboard required. Two third-party listings already point at `numnumsbakery.com.au` (correct); atParramatta points at `numnums.com.au` (wrong) | see §1b |
| Products / services listed on GBP | NOT EXTERNALLY VERIFIABLE — dashboard required | Intended list in `GBP/gbp-numnums-harris-park.md` §3 |
| Business description present | NOT EXTERNALLY VERIFIABLE — dashboard required | — |
| Location page has embedded map | **PASS** | `locations.html:566` |
| Location page has location-specific testimonials | **PASS** | `locations.html:176-200` |
| LocalBusiness schema with precise NAP + coordinates | **PASS** | `BakeryOrCafe` node `#harris-park`, full `PostalAddress` + `GeoCoordinates` |
| Product scope represented accurately off-site | **FAIL** | RestaurantGuru describes "chicken dishes and sandwiches"; atParramatta describes chicken tikka rolls / poori / chaat. Business is 100% eggless cakes + Indian sweets, no savoury |

---

## 4. Dashboard-only checks — owner, ~10 minutes

Answer each yes/no in the GBP dashboard for **Harris Park**. No interpretation needed.

- [ ] Is the business name in GBP exactly `Num Num's Bakery` (with apostrophe, no suburb, no keywords)?
- [ ] Is the address exactly `96/96 Wigram Street, Harris Park NSW 2150`?
- [ ] Is the listed phone `+61 425 697 725` (and is `02 9891 4957` absent from every phone field)?
- [ ] Is the website field exactly `https://numnumsbakery.com.au`?
- [ ] Is the primary category `Cake shop`?
- [ ] Are `Wedding bakery` and `Cupcake shop` available in the category autocomplete, and are they added?
- [ ] Is the profile marked "Verified" with no pending verification or reinstatement banner?
- [ ] Does GBP show any "Your profile is incomplete" or "Add missing info" prompt right now?
- [ ] Is the business description filled in (non-empty)?
- [ ] Are there zero unanswered questions in the Q&A tab?
- [ ] Is the Products section populated with at least one product?
- [ ] Is the Services section populated?
- [ ] Are the attributes set (e.g. Vegetarian options, Takeaway, Wheelchair access, Payment types)?
- [ ] Is messaging turned on or off? (record which)
- [ ] Is there at least one GBP post published in the last 30 days?
- [ ] Are there any owner-uploaded photos added in the last 30 days?
- [ ] Are there any reviews from the last 90 days with no owner reply?
- [ ] Does the "Opening date" field show 2019?
- [ ] Is there a duplicate/suspended listing suggestion shown for this address?
- [ ] Record from Performance (last 28 days): calls, direction requests, website clicks, profile views (searches + views).

---

## 5. Findings, prioritised

### P1 — Conflicting NAP on a public Parramatta-council-adjacent directory
**What's wrong:** atParramatta.com publishes `Num Nums bakery`, `Shop 2 96-98 Wigram Street`, phone `02 9891 4957`, website `numnums.com.au`, with a savoury Indian menu description. Every field conflicts with the site.
**Why it matters:** the report names "ensuring NAP consistency across the site and citations" as a foundational step (§6) and lists "failing to align GBP and website location pages" as a documented pitfall; §5 states AI systems select sources on "strong local authority signals (GBP completeness, reviews, citations)". A high-authority local directory publishing a different phone and a different domain actively degrades that signal.
**Exact fix:** submit a listing correction to atParramatta with the four correct fields. Also confirm in GBP that no secondary phone `02 9891 4957` exists on the profile. If the entry actually belongs to a *different* business trading under a similar name at 96-98 Wigram Street, note that in the ledger and instead ensure the bakery has its own correct atParramatta entry.
**Effort:** 30 min.

### P2 — GBP posting has silently stopped (~11 weeks)
**What's wrong:** last published GBP post logged `2026-06-14`; the next one is stuck `pending` with a recorded webhook delivery failure.
**Why it matters:** the report states "one substantial new or updated page per month, plus routine GBP posts and review responses, is widely regarded as 'good' performance that compounds over time" (§6), and names GBP completeness among the strongest levers for both local pack and AI citation (§5).
**Exact fix:** run the `curl_command` already stored at the bottom of `GBP/posts-queue.md` to publish the pending post, then fix the publisher path so the Make webhook is reachable from wherever the routine runs; mark the entry `published`.
**Effort:** 15 min to unblock, plus one routine fix.

### P3 — Schema `aggregateRating` (4.6 / 50) does not match any observed rating (4.1)
**What's wrong:** both location nodes publish an identical `4.6` / `reviewCount 50`. Three independent third-party scrapes of the Google rating report `4.1`, with review counts of 358–609. The two locations also share one identical figure despite being separate profiles.
**Why it matters:** §6 lists NAP consistency and correct LocalBusiness schema as foundational, and names GBP/website misalignment as a pitfall. A rating on the site that contradicts the rating in the local pack is exactly that misalignment.
**Exact fix:** read the real rating and review count per location from the GBP dashboard and set each node's `aggregateRating` to its own true values; give Harris Park and Riverstone different numbers. If the true count cannot be maintained, remove `aggregateRating` rather than publish a stale one. **Implementation inference:** the report does not address self-published rating markup specifically.
**Effort:** 20 min once the dashboard numbers are recorded.

### P4 — Third-party listings misdescribe the product scope
**What's wrong:** RestaurantGuru ("chicken dishes and sandwiches") and atParramatta (chicken tikka rolls, samosa, poori) describe savoury Indian food. The business is 100% eggless cakes + Indian sweets only.
**Why it matters:** §5 advises checking which sources AI systems cite and "improving the business's presence across those sources via updated listings, reviews, and content"; these are precisely the aggregator pages an AI summary would draw a description from.
**Exact fix:** claim the RestaurantGuru listing and correct the category and description; correct atParramatta as in P1.
**Effort:** 45 min.

### P5 — Thin citation footprint outside food-delivery aggregators
**What's wrong:** no listing found for Yellow Pages AU, TrueLocal, Yelp AU, Zomato, Hotfrog or Localsearch. The observable footprint is DoorDash / Uber Eats / RestaurantGuru / magicpin / vegspoons — mostly scraped, none owner-maintained.
**Why it matters:** the report names citations, alongside GBP completeness and reviews, as a lever for both local pack visibility and AI Overview citation (§5, §6).
**Exact fix:** create and verify owner-controlled listings with the exact site NAP on the major AU directories. **Implementation inference:** the report does not name specific directories.
**Effort:** 2–3 hours one-off.

### P6 — Name string is inconsistent even inside the repo
**What's wrong:** `Num Num's Bakery` (visible), `Num Nums Bakery` (`og:site_name`), `Num Num's Bakery Harris Park` (schema `name`), `Num Nums Bakery` (GBP spec `legal_name`).
**Why it matters:** foundational NAP consistency (§6). The schema `name` appending the suburb is also what seeds the "Num Num Bakery Harris Park" variant now live on vegspoons.
**Exact fix:** pick one public-facing string — `Num Num's Bakery` — and use it in `og:site_name` and in GBP. Keep the suburb out of the GBP name field; distinguish locations by `@id` and address, not by name.
**Effort:** 15 min.

### P7 — Riverstone and Harris Park share one Facebook page and one Instagram account
**What's wrong:** both schema nodes `sameAs` the same Harris-Park-named Facebook page; Instagram is a single account with no address.
**Why it matters:** §3 requires each physical location to have its own GBP and its own precise local signals.
**Exact fix:** at minimum, put the correct location address in each social profile's About/contact fields so they corroborate the GBP NAP. **Implementation inference:** the report does not require one social profile per location; a separate page is optional.
**Effort:** 20 min.

---

## 6. Baseline metrics to record today

Write these down now so the 4–6 week and 8–12 week checkpoints have a comparison point.

**Externally captured 2026-09-02 (this audit):**

| Metric | Value | Source |
|---|---|---|
| RestaurantGuru rating / votes | 4.1 / 603 | restaurantguru.com |
| magicpin rating / reviews | 4.1 / 358 | magicpin.com |
| vegspoons stated Google rating / reviews | 4.1 / 609 | vegspoons.com |
| Instagram followers (shared account) | 263 | instagram.com/numnumsbakery |
| Distinct external listings found | 8 (RestaurantGuru, magicpin, vegspoons, atParramatta, DoorDash, Uber Eats, Facebook, Instagram) + 1 unconfirmed (bakesy.shop) | this audit |
| Owner-maintained AU directory listings found | 0 | this audit |
| Days since last logged GBP post | 80 (2026-06-14 → 2026-09-02) | `GBP/posts-queue.md` |
| Site schema `aggregateRating` as published | 4.6 / 50 | `locations.html:171-177` |

**Dashboard-only — owner must fill in today (all currently `NOT EXTERNALLY VERIFIABLE`):**

| Metric | Value |
|---|---|
| Google review count (Harris Park) | ______ |
| Google average rating (Harris Park) | ______ |
| Total photo count on profile | ______ |
| Owner-uploaded photos in last 30 days | ______ |
| Calls, last 28 days | ______ |
| Direction requests, last 28 days | ______ |
| Website clicks, last 28 days | ______ |
| Profile views / searches, last 28 days | ______ |
| Unanswered Q&A count | ______ |
| Reviews awaiting a reply | ______ |
