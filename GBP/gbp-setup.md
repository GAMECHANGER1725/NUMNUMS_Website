# GBP Setup · the all-in-one spec


> Drop this file into Claude Code. Claude reads it, asks for inputs, researches competitors, and outputs a complete `gbp-{business-slug}.md` ready to paste into Google Business Profile.


---


## How this works


1. **User runs:** `/gbp-setup` or pastes "set up my GBP using gbp-setup.md"
2. **Claude asks the questions below** (collect business basics first)
3. **Claude WebFetches the website** to fill in gaps
4. **Claude researches top 3 competitors** via Google Maps + WebFetch
5. **Claude outputs `gbp-{business-slug}.md`** with every field filled in
6. **User copies sections into GBP** → done in 30 minutes


---


## Step 1 · Ask the user for inputs


Ask these one batch at a time (don't overwhelm). If `business-context.md` exists, read it first and skip questions already answered.


### Required (block until provided)
- **Legal business name** (the exact registered name)
- **DBA / brand name** (if different from legal)
- **Website URL** (Claude will WebFetch this)
- **Primary city** (e.g. "Toronto")
- **Service area** (single city · multi-city · service-area business)
- **Phone number** (with area code)
- **Physical address** (or "service area · hidden")


### Strongly recommended
- **Year founded**
- **Founder name(s)**
- **Industry / niche** (one sentence)
- **Average ticket / price tier** ($ · $$ · $$$ · $$$$)
- **Hours** (regular · holiday · 24/7?)
- **Insurance / licenses** (if applicable)


### Nice to have (skip if unknown)
- Identity attributes (women-owned · veteran-owned · LGBTQ+ friendly · etc.)
- Current offers / promotions
- Booking platform (Square · Acuity · Mindbody · etc.)
- Photo library URL (Drive folder)
- Top competitors (or Claude finds them)


---


## Step 2 · Deep research phase


⚠️ **This is not a guessing game.** Claude must do real research before generating the spec. Run these tasks **in parallel** where possible, then output a research summary the user reviews before final generation.


### Research checklist (Claude does ALL of these)


**1. Business website**
- WebFetch homepage + about + services + pricing pages
- Extract: services list · pricing · team · year founded · differentiators · testimonials · phone · address
- Note any existing schema markup


**2. Competitor analysis (top 3 in the local pack)**
- Search `[primary category] in [primary city]` in Google Maps
- WebFetch the top 3 competitors' websites
- Find their GBP profiles (if accessible) — note categories, services, attributes
- Extract: pricing tiers · differentiators they use · keywords they target · service descriptions


**3. Live GBP categories**
- WebFetch the Pleper list (URL above)
- Pick optimal primary by matching the business model
- Pick 9 secondary categories that overlap competitor strategy + cover niche variations
- Flag if competitors use a different primary — Claude recommends mirror strategy


**4. Nearby cities (for service area)**
- If business is service-area-based (plumber, HVAC, mobile services):
 - Identify all cities within 60-min drive of the verified address
 - Cross-reference population (bigger metros = more demand)
 - Cap at 20 cities (Google soft limit · 2-hr drive limit)
- If business is location-based (restaurant, retail, clinic):
 - Only list the primary city
 - Note neighborhoods for use in location pages later


**5. Services extraction (target 30-50 services, minimum 30)**
- Pull every service from the business website
- Cross-reference top 3 competitor service menus to find gaps
- Match against Google's pre-defined service list (extra ranking weight)
- **Run local keyword research for each service:**
 - WebSearch / SEMRush / Google Keyword Planner for `[service] [primary city]` monthly volume
 - For close variants, pick the higher-volume name (e.g. "couples therapy toronto" 1,300/mo > "couples counselling toronto" 590/mo)
 - Use BOTH when close — one as service name, one in the description
 - Group services into buckets: core therapies · modalities · issues addressed · demographics · format/delivery · packages
- Generate keyword-rich descriptions for each (≤300 chars)
- Each service description should include: <b>service name + primary city + 1 differentiator + soft CTA</b>


**6. Products / featured items**
- Top 10 products / services to feature on GBP
- Use existing website pricing where available
- Flag missing prices for the user to fill in


**7. Citation directory list**
- WebFetch Whitespark citation guide for the industry
- Build a 3-tier citation list:
 - Tier 1: Universal (Google, Apple Maps, Yelp, BBB, Facebook · 7-10 sites)
 - Tier 2: High-authority general (BBB, Chamber of Commerce, Nextdoor · 5-8 sites)
 - Tier 3: Industry-specific (Avvo for lawyers · Houzz for contractors · Healthgrades for medical · 3-5 sites)


**8. Attribute discovery**
- WebFetch the live attributes URL for the chosen primary category
- List ALL available attributes for that category type
- Prompt user for identity attributes (women-owned, veteran-owned, etc.)
- Default safe attributes (free wifi, parking, payments) based on business model


**9. Keyword gap analysis**
- Identify long-tail keywords competitors use that this business should target
- Group by post type:
 - "[Service variant] [neighborhood]" — for posts
 - "[Service] cost [city]" — for blog posts
 - "[Best X] [city]" — for blog posts


### Research summary output


Before generating the final spec, Claude outputs:


```markdown
## Research summary


**Business:** [name]
**Website analyzed:** [URL] · [pages fetched]
**Competitors analyzed:**
1. [Competitor 1] · Primary category: [X] · Reviews: [N]
2. [Competitor 2] · Primary category: [X] · Reviews: [N]
3. [Competitor 3] · Primary category: [X] · Reviews: [N]


**Recommended primary category:** [X]
 Reasoning: [why this beats competitor categories]


**Service area (if SAB):** [N cities] within [N min] drive
**Services extracted:** [N services from website + N suggested additions]
**Citation directories identified:** [N total · breakdown by tier]
**Identity attributes recommended:** [list]
**Suspension risk flags:** [none / list any]


Confirm before I generate the full spec? [yes / changes]
```


User confirms or requests changes. Then Claude proceeds to Step 3.


### 🔗 Reference sources


⚠️ **Google doesn't publish a public categories list.** Categories, attributes, and citation directories are all moving targets — Claude must verify live, not from training data.


**How Claude verifies in real time:**


| What | How |
|---|---|
| **Categories** | (1) WebSearch `"google business profile categories [niche]"` → find current third-party lists · (2) Check top 3 competitors' actual primary on Google Maps · (3) Ask user to confirm via GBP autocomplete · **never invent** |
| **Attributes** | WebSearch for current attributes available to the chosen primary category · ask user to verify in GBP |
| **Citation directories** | WebSearch `"best citation directories [industry] 2026"` · pick top 7-10 universal + 3-5 industry-specific |
| **Service area rules** | Ask user to confirm via GBP — service area policy changes too often to hardcode |
| **Suspension triggers** | Built into Step 4 below · official Google guidance updated regularly |


**Verified working references for categories (use these):**


| Resource | URL | Notes |
|---|---|---|
| **Dalton Luka · GBP categories list** | https://daltonluka.com/blog/google-my-business-categories | Searchable list · regularly updated |
| **Local Dominator · GBP categories list** | https://localdominator.co/google-business-profile-categories/ | Comprehensive list · 2026 |
| **Pleper categories tool (direct URL)** | https://pleper.com/index.php?do=tools&sdo=gmb_categories&go=1&lang=en&country=190&show_table=1 | Shows live data but **paginated** — Claude can't navigate between pages, ask user to scroll/export if needed |


**Rule:** Claude WebFetches one of the above to verify current options. If the niche isn't found cleanly, fall back to WebSearch + competitor analysis. **Never invent a category that doesn't exist.**


---


## Step 3 · Generate the spec


Output `gbp-{business-slug}.md` with these sections, in this order. Each section has strict rules below.


---


### 1. Identity


```yaml
legal_name: ""              # exact registered name
dba_name: ""                # what shows on GBP (often same as legal)
year_founded: ""            # YYYY
founders: []                # list names
website: ""                 # primary domain
address: ""                 # street, city, postal/zip
address_visible: true       # false = Service Area Business
phone: ""                   # local area code preferred
```


**Rules:**
- ❌ Never add keywords to the name ("Acme Plumbing · Best Toronto Plumber" = suspension)
- ✅ Use the oldest legitimate founding date
- ✅ Phone must have local area code


---


### 2. Categories


```yaml
primary_category: ""        # the single #1 factor
secondary_categories:       # fill all 9 slots
 - ""
 - ""
 # ... 9 total
```


**Rules:**
- **Primary category is the #1 ranking factor** — get it exactly right
- **Verify via 3 sources:** (1) WebSearch current GBP categories for the niche · (2) Check top 3 competitors' actual primary on Google Maps · (3) Ask user to confirm via GBP autocomplete
- Watch for mismatches (e.g. "Plumber" vs "Plumbing Contractor" — these compete in different packs)
- **Fill all 9 secondary slots** (most businesses use 1-2 · waste)
- Recommend reviewing quarterly (Google adds new categories regularly)
- ❌ Never invent categories — must exist in Google's live list


**Example output:**
```yaml
primary_category: "Plumber"
secondary_categories:
 - "Drainage service"
 - "Hot water system supplier"
 - "Emergency plumber"
 - "Septic system service"
 - "Bathroom remodeler"
 - "Gas installation service"
 - "Pump supplier"
 - "Water filter supplier"
 - "Sewage system service"
```


---


### 3. Services


```yaml
services:
 - name: ""               # max 120 chars
   description: ""        # max 300 chars · keyword-rich
   price_tier: ""         # optional · $ / $$ / $$$
   type: ""               # "predefined" or "custom"
```


**Rules:**
- **Auto-extract 10-30 services** from the website
- Each description: keyword-rich · ≤300 chars
- **Mix Google pre-defined + custom services** (pre-defined ones get extra ranking weight)
- Include price tier where it's a competitive advantage
- Use specific phrasing ("tankless water heater install" not "plumbing services")
- Each service = a structured keyword Google treats with high trust


**Data sources (services are part open-list, part Google-curated):**


| Type | Source | How Claude finds them |
|---|---|---|
| **Google pre-defined services** | Google's category-specific list (not publicly published) | (1) WebSearch `"GBP pre-defined services [primary category]"` · (2) Check top 3 competitors' service lists on their GBP listings · (3) Ask user to verify in GBP autocomplete |
| **Custom services** | The business's own website | WebFetch services / pricing / shop pages |
| **Gap services** | Competitor websites | WebFetch top 3 competitor service pages — find what they offer that this business should match |


**Rule:** Tag each output service as `type: "predefined"` or `type: "custom"`. User picks pre-defined in GBP autocomplete; custom services are typed manually.


---


### 4. Description (750 chars max)


```yaml
description: |
 [First 100 chars: hook with primary keyword + city]
 [Middle: services + differentiators + years in business]
 [End: trust signal · call to action]
```


**Rules:**
- **First 100 chars are critical** — that's what shows before "see more"
- **Primary keyword + city** naturally placed in first sentence
- Include differentiators (24/7, family-owned, certifications, years)
- ❌ NO keyword stuffing — Google penalizes
- ❌ NO URLs (they get stripped)
- ✅ Natural, readable language


**Example:**
```
Acme Plumbing serves Toronto + GTA homeowners with 24/7 emergency plumbing
since 2014. Family-owned, fully licensed, 12-year warranty on installs.
Tankless water heaters, burst pipe repair, drain cleaning. Same-day quotes
available — call anytime.
```


---


### 5. Hours


```yaml
hours:
 regular:
   monday: "7am-7pm"
   tuesday: "7am-7pm"
   # ... full week
 holiday_hours: []         # list closures + adjusted hours
 is_24_7: false            # set true ONLY if real 24/7 line exists
 has_answering_service: false
```


**Rules:**
- **24/7 listing = top-5 ranking factor** ("open at time of search" filter)
- Set `is_24_7: true` ONLY if a real human answering service exists
- **If user wants 24/7 but doesn't have staff:**
 - **Recommend an AI receptionist:** Bland.ai · Synthflow · Retell · ElevenLabs
 - $50-200/mo · production-ready · handles inbound 24/7
 - Unlocks the ranking factor without hiring
- Update holiday hours quarterly (Christmas, New Year's, etc.)
- Never leave hours "unconfirmed" — kills visibility


---


### 6. Photos brief


```yaml
photos_brief:
 exterior:
   - "Storefront from across the street (logo visible)"
   - "Vehicle with logo (if branded)"
   - "Signage close-up"
 interior:
   - "Reception / waiting area"
   - "Work area"
 team:
   - "Owner headshot"
   - "Group team photo"
 work_in_progress:
   - "Real job site photos (client permission)"
 products:
   - "Top 5 products / services"
 monthly_upload_target: "3-5 new photos / month"
```


**Rules:**
- **100+ photos = 520% more phone calls** (BrightLocal study)
- **Recency matters** — Google rewards uploads within 30 days
- Real client photos > AI generated > branded stock > naked stock
- Photo categories matter (Google segments interior/exterior/team)
- Default fallback: AI generation via fal.ai for product/concept shots


---


### 7. Attributes (the identity hack)


```yaml
attributes:
 identity:               # CREATES NEW LOCAL PACKS · zero competition
   - women_owned: true/false
   - veteran_owned: true/false
   - lgbtq_friendly: true/false
   - black_owned: true/false
   - family_owned: true/false
   - indigenous_owned: true/false
 accessibility:
   - wheelchair_accessible: true/false
   - wheelchair_parking: true/false
 payments:
   - credit_cards: true
   - mobile_payments: true
   - financing: true/false
 amenities:
   - free_wifi: true/false
   - free_parking: true/false
```


**Rules:**
- **Identity attributes are the underrated hack** — creates packs that didn't exist
- **WebFetch the live attributes list** by category → https://support.google.com/business/answer/9049526
- "Women-owned plumber Toronto" can put you in a 3-pack with no competition
- 30 seconds to add · meaningful ranking lift for matching searches
- Counter-intuitive: REMOVE "onsite services" and "online appointment" attributes — they push reviews out of view on the profile


---


### 8. Service area (for SAB profiles)


```yaml
service_area:
 is_sab: false             # Service Area Business (address hidden)
 cities: []                # up to 20 cities
 max_drive_time: "2 hours" # don't exceed · suspension risk
```


**Rules:**
- Up to 20 cities — pick by demand + proximity
- ❌ Drive distance > 2 hours triggers automated review
- ✅ Pair with location landing pages on the website
- If `is_sab: true`, address is hidden but you still need a verified location


---


### 9. Products


```yaml
products:
 - name: ""
   description: ""
   price: ""               # optional but recommended
   image_brief: ""         # what photo to shoot
   linked_service_page: "" # URL on website
```


**Rules:**
- Top 10 products / services with images
- Display pricing where competitive
- Link each to a service page on the website
- Update quarterly


**Data sources (no external URL needed):**
- **Primary:** WebFetch the business's website (services, shop, pricing pages)
- **Secondary:** WebFetch top 3 competitors' product pages to find gaps
- **Tertiary:** Ask the user to confirm/edit before locking in


Products are open-ended — Google doesn't restrict the list. The constraint is what the business actually sells. Pull from the source of truth (their site).


---


### 10. Booking link


```yaml
booking:
 enabled: false/true
 platform: ""              # "Square" · "Acuity" · "Mindbody" · etc.
 booking_url: ""
 fallback_cta: "Call now"  # if no booking platform
```


**Rules:**
- Businesses with booking integration see **+25% more leads from GBP**
- Auto-syncs to Google Calendar (no double-booking)
- Compatible verticals: dining · beauty · fitness · activities · services
- If no booking platform, default CTA = "Call now"


---


### 11. FAQ seed (move to website)


```yaml
faq_seed:
 - question: ""
   answer: ""               # 2-4 sentences
 # 8-12 total
```


**Rules:**
- ⚠️ **Q&A section on GBP is being phased out** — don't post Q&As to GBP
- ✅ Add the Q&As to your **website FAQ section** (AI Overviews pull from there)
- Pull questions from "People Also Ask" + actual customer questions
- Include FAQ schema on the website page


---


### 12. NAP citations (master record)


```yaml
nap_master:
 name: ""                  # exact spelling · use EVERYWHERE
 address: ""               # exact format · "St" or "Street" - pick one
 phone: ""                 # exact format · "(416) 555-0142"


citation_directories:
 tier_1_universal:         # stable · hardcode · ALL businesses
   - "Google Business Profile"
   - "Apple Maps Connect"
   - "Bing Places"
   - "Yelp"
   - "Facebook Business Page"
   - "Foursquare"
   - "Yellow Pages"
 tier_2_authority:         # stable · hardcode · most businesses
   - "Better Business Bureau"
   - "Chamber of Commerce (local chapter)"
   - "Nextdoor Business"
   - "MapQuest"
 tier_3_industry:          # CLAUDE RESEARCHES this per niche
   - "Industry-specific · researched live"
```


**Rules:**
- NAP must be **byte-identical** across all directories
- Same abbreviation style (St. vs Street — pick one)
- Same phone format ((555) 555-5555 vs 555-555-5555 — pick one)
- 30-50 consistent citations > 300 messy ones
- **Recommend SEMRush Listing Management** for bulk submission (one form, 70+ directories)


**Data sources for citations:**


| Tier | How Claude builds the list |
|---|---|
| **Tier 1** (universal) | Hardcoded above — stable across all industries · don't research |
| **Tier 2** (authority) | Hardcoded above — applies to most businesses · don't research |
| **Tier 3** (industry-specific) | **WebSearch `"top citation directories [industry] 2026"`** · pick 3-5 niche directories · examples: |


**Industry-specific directory examples (Claude verifies live):**


- **Healthcare:** Healthgrades · Vitals · Zocdoc · RateMDs
- **Legal:** Avvo · FindLaw · Justia · LawInfo
- **Home services:** Angi · Houzz · Thumbtack · HomeAdvisor
- **Restaurants:** TripAdvisor · OpenTable · Zomato · Grubhub
- **Real estate:** Zillow · Realtor.com · Trulia
- **Weddings:** WeddingWire · The Knot
- **Beauty:** StyleSeat · Booksy
- **Financial:** NerdWallet · feeonly.com


**Rule:** Don't WebSearch Tier 1 or Tier 2 (they're stable). Only WebSearch Tier 3 for the specific industry. List top 3-5 in priority order based on Domain Authority + relevance.


---


## Step 4 · Suspension-proofing checklist


Claude must verify NONE of these are true before finalizing the spec:


- ❌ Keyword-stuffed business name
- ❌ Virtual office / PO box / UPS box address
- ❌ Co-working / shared address with other GBPs
- ❌ Multiple GBPs at the same address
- ❌ Home-based business with visible address (must use SAB mode)
- ❌ Fake listings in cities the business doesn't operate in
- ❌ Service area > 2 hour drive from verified address


If any of these are flagged → warn the user before generating the final file.


---


## Step 5 · Final output


Claude generates `gbp-{slug}.md` containing all 12 sections above, ready for the user to:


1. **Paste sections into GBP** (categories, services, description, hours, attributes)
2. **Upload photos** matching the photos brief
3. **Connect booking platform** if applicable
4. **Add FAQ content to website**
5. **Submit citations** (manual or via SEMRush Listing Management)


Estimated time: **30 minutes start to finish** for a typical small business.


---


## Reference data


- Max categories: 1 primary + 9 secondary
- Max services: ~30 (Google soft cap)
- Description max: 750 chars
- First-100-char rule: visible before "see more"
- Max service area cities: 20
- Photo max size: 5 MB
- Photo dimensions: 720 × 720 minimum, 1,200 × 900 recommended



