# GBP Posts · creation rules — HARRIS PARK


> Claude reads this before writing any GBP post for the **Harris Park** location.
> Pairs with `tone.md`, `humour.md`, `vocabulary.md`, `business-context.md`.
> Output queues into `posts-queue.md` AND POSTs to Make.com webhook.


---


## 🚫 Critical failure modes (DO NOT)


These are the most common mistakes that break the Make.com router. **NEVER produce any of these:**


❌ **`type: update`** — wrong field name AND wrong value
❌ **`type: standard`** — `STANDARD` is not a valid Make.com post type
❌ **`type: product`** — not a Make.com post type, use `"Call to action"` instead
❌ **`type: news`** / **`type: announcement`** / **`type: tip`** — none are valid
❌ **`cta: Book`** — wrong field name, use `cta_action: BOOK` + `cta_url: ...`
❌ **Markdown body below the `---`** — body lives INSIDE `summary: |`
❌ **`**bold**` or `[link]()` in summary** — plain text only


✅ **The ONLY valid `post_type` values:**
- `"Call to action"` (with quotes · has a space)
- `"Event"`
- `"Offer"`


✅ **Use `post_type:` as the field name** — NOT `type:`


✅ **Body goes INSIDE `summary: |`** as plain text — not as markdown below the YAML


If you find yourself about to output `type: update` — STOP. The correct output is `post_type: "Call to action"` with the body inside `summary: |`.


---


## Webhook configuration


> Set these once during client onboarding.
> The skill POSTs every generated post to `MAKE_WEBHOOK_URL`.
> Make.com routes it to the right GBP using `GBP_LOCATION_NAME`.


```yaml
MAKE_WEBHOOK_URL: https://hook.eu1.make.com/3lpat91ijfb2zqd27w14adnzjdopiofk
GBP_LOCATION: 96/96 Wigram Street, Harris Park NSW 2150
DEFAULT_CTA_URL: https://numnumsbakery.com.au/#order
MEDIA_ITEMS_MAPPING: "{{24.media_items[1]}}"  # Make.com module reference for this scenario
```


**How to get these:**


1. **MAKE_WEBHOOK_URL** — In Make.com: create a new scenario → add "Webhooks · Custom webhook" trigger → copy the URL it generates
2. **GBP_ACCOUNT_NAME** — In Make.com: add "Google Business Profile · List Accounts" → run once → copy the `name` (format: `accounts/12345678`)
3. **GBP_LOCATION_NAME** — In Make.com: add "Google Business Profile · List Locations" → run once → copy the `name` (format: `locations/87654321`)
4. **DEFAULT_CTA_URL** — The client's main domain · fallback when the post doesn't specify a deeper page


---


## Cadence


- **1-2 posts per week** · weekly is the minimum
- Updates lose prominence after **7 days** · Events + Offers stay visible until end date
- **Don't post daily** — looks spammy, no extra benefit
- **Consistency > volume** — 1/week for 12 weeks beats 12 in 1 week


---


## Length (real-world data)


Real high-performing posts run **shorter than most guides claim**:


| Type | Sweet spot | Max |
|---|---|---|
| **Offer / Flash sale** | 25-50 words | 80 |
| **Event** | 30-60 words | 100 |
| **Update (announcement)** | 30-80 words | 150 |
| **Update (story / case study)** | 100-200 words | 300 |
| **Product spotlight** | 30-60 words | 100 |


**First 100 characters are critical** — that's what shows before "see more."


---


## Structure (every post)


- **Plain text only** — NO markdown (`**bold**`, `[link]()`, etc.) · GBP renders it literally
- **Title** (60-80 chars) — the headline/hook · separate from body
- **Summary / body** (plain text, 25-300 words depending on type)
- **Image required** · 1,200 × 900 px (4:3 ratio)
- **CTA action required** · BOOK / CALL / LEARN_MORE / SIGN_UP / ORDER / SHOP
- **CTA URL** required if action ≠ CALL
- **Local reference** baked in (neighborhood, city, landmark)
- **Justification keyword** included (specific service variant)
- **First 100 chars** = strong hook
- **Emojis OK** · 2-3 max · render fine as Unicode


---


## Images · default = stock


**Default approach: pull a stock image that matches the post topic.** Fastest, easiest, works for 90% of cases.


For each post, Claude outputs an `image_query:` field — a 3-5 word search query the user pastes into Unsplash / Pexels / Pixabay to grab a relevant free image.


Example: `image_query: "plumber fixing water heater"` → user grabs from Unsplash in 10 seconds → done.


**Quality hierarchy** (for clients who want to level up):


1. **Real client photos** — best, but requires onboarding effort
2. **AI-generated** via fal.ai (Nano Banana, Imagen) — great for unique product shots
3. **Stock photos** ← default, easiest
4. ❌ Skip the post entirely if no image — engagement drops ~60% without one


---


## Monthly mix (at 2x/week = 8 posts)


| Type | Count | % | Why |
|---|---|---|---|
| **Offer** | 4 | 50% | Highest converter · yellow "Limited Time" badge in map pack · clearest CTA |
| **Update** | 2-3 | 30% | Seasonal tips, customer stories · freshness signal |
| **Event** | 0-1 | 10% | Only when you actually have one |
| **Product / Service** | 1 | 10% | New launches, bestsellers |


---


## Justification baiting (3 layers per post)


Every post should naturally include all three. This triggers Google's "Their post mentions..." snippets.


1. **Service variant** — specific phrasing
  - ✅ "tankless water heater install" / "drain camera inspection" / "burst pipe repair"
  - ❌ "plumbing services" (too generic)


2. **Neighborhood / area** — explicit local reference
  - ✅ "Riverdale", "East York", "King St W"
  - ❌ "the city" (too vague)


3. **Long-tail problem** — the customer's exact phrase
  - ✅ "basement smells like sewage in winter"
  - ✅ "no hot water on weekends"


---


## ⚠️ Valid `post_type` values (ONLY these 3)


The `post_type` field accepts **exactly one of these three strings** — spelled exactly as Make.com expects. Any other value will break the router.


| Value (exact) | What it is | Required extras |
|---|---|---|
| `"Call to action"` | Post with an action button | `cta_action` + `cta_url` |
| `"Event"` | Post with start + end dates (workshops, open houses, anniversaries) | `start_date` + `end_date` |
| `"Offer"` | Promo with coupon code (yellow badge in map pack) | **ALL REQUIRED:** `coupon_code` + `redeem_online_url` + `start_date` + `end_date` · optional: `terms_conditions` |


---


### 🚨 Offer posts · required field generation rules


Make.com's GBP module marks these as **required** for Offer posts. Claude must ALWAYS generate them — no nulls, no empty strings:


**1. `coupon_code` — always generate a unique short code**


Format: `[KEYWORD][NUMBER]` or `[KEYWORD][CAMPAIGN]` · 6-12 chars · UPPERCASE · no spaces


Examples:
- `TANKLESS50` (tankless install · $50 off)
- `WINTER25` (winter promo · 25% off)
- `FREECONSULT` (free consultation)
- `BROTHER1ST` (Brotherhood first-time client)
- `BURSTFIX` (burst pipe service)


Why: tracks which posts drove redemptions + Make.com requires non-empty.


**2. `redeem_online_url` — always set**


Default: `DEFAULT_CTA_URL` from webhook config (the client's main domain).
Better: a deeper page with the offer pre-applied: `https://client.com/book?promo=TANKLESS50`


**3. `start_date` — always set**


Default: today (the `publish_date`). ISO 8601 format with America/Toronto offset:
`"2026-05-15T00:00:00-04:00"`


**4. `end_date` — always set**


Default: 7 days from `start_date`. ISO 8601 format:
`"2026-05-22T23:59:59-04:00"`


Why 7 days: matches GBP's default offer visibility window. Longer = less urgency. Shorter = misses traffic.


**5. `terms_conditions` — optional but recommended**


Default if missing: `"Cannot be combined with other offers."`


**Every post must be one of these three.** Make.com has no "plain" post type — every post needs at minimum a CTA button.


When formulas below say "Update post" or "Product post" — those are **content categories**, not webhook values. Map them to the right `post_type`:


| Formula category | Maps to `post_type` |
|---|---|
| Offer / Flash sale / Discount | `"Offer"` |
| Update / Announcement / News / Tip / Customer story | `"Call to action"` (with "Learn more") |
| Event / Workshop / Open house | `"Event"` |
| Product / Service spotlight | `"Call to action"` (with "Book" / "Order" / "Shop") |


---


## Winning formulas by post type


### 🟡 OFFER posts — the highest-converting type


**Formula A: Price + Service + Location + Deadline**
```
[$ off] [specific service] in [neighborhood]. [Deadline].
[1-line social proof or detail]
CTA: Book / Get offer
```


**Example:**
> $50 off **tankless water heater install** in **Toronto + GTA**. Ends Sunday.
> 12-year warranty · 4-hr install · same-day quotes.
> [Book →]


**Formula B: Flash sale shorthand**
```
⚡ [TIME-LIMIT] [DEAL TYPE]
[What's included]
[Deadline + urgency hook]
CTA: Get offer
```


**Example:**
> ⚡ 48-HOUR FLASH SALE
> Buy 2, Get 1 FREE on all skincare. No code needed.
> Ends Friday midnight ✨
> [Order online →]


**Formula C: Removing barrier**
```
Free [service] for new [location] clients.
[1-line trust signal]
CTA: Call now / Book
```


**Example:**
> Free dental exam + x-rays for new **Mississauga** patients this month.
> Family-owned · open Saturdays · 4.9★ (180 reviews).
> [Call now →]


---


### 📢 UPDATE posts — freshness + expertise


**Formula A: Seasonal tip with local hook**
```
[Season] is here. [Number] things every [city/neighborhood] [customer-type] should do before [trigger].
[Optional bullets]
CTA: Learn more
```


**Example:**
> **Burst pipe season** is here. 3 things every **Toronto basement** owner should do before -10°C.
> 1. Insulate exposed pipes in your basement
> 2. Open cupboard doors under sinks on cold nights
> 3. Keep a drip going on your coldest faucet
> [Learn more →]


**Formula B: Customer story / case study**
```
[Time] emergency call · [neighborhood] · [problem]
[1-2 sentences: what we found, how we fixed it]
[Outcome for customer]
CTA: Call now
```


**Example:**
> 2am emergency call from a **Riverdale family** — flooded basement, burst pipe in the wall.
> Mike was on-site in 28 minutes. Found the break, isolated the line, patched it before the hardwood swelled.
> They were dry by sunrise. This is why we run 24/7.
> [Call now →]


**Formula C: Counter-intuitive tip**
```
Why your [problem] in [season] — and the [$0 / surprising] fix most [pros] don't share.
[1-2 sentence explanation]
CTA: Learn more
```


**Example:**
> Why your basement **smells like sewage** in winter — and the $0 fix.
> When your P-traps dry out from low humidity, sewer gas seeps up through your floor drain. Pour a cup of water down it once a month.
> [Learn more →]


---


### 📅 EVENT posts — date-anchored urgency


**Formula: Event + Date + Hook + RSVP**
```
[🎉 emoji] [Event name] · [date] · [location]
[1-2 sentence value prop]
[Practical detail: cost, who it's for, spots]
CTA: RSVP / Sign up
```


**Example:**
> 🍳 Learn to Cook Authentic Italian Pasta!
> Saturday Jan 20, 2 PM · our **King St W** kitchen
> Hands-on workshop with Chef Marco. All skill levels welcome. Ingredients + recipes provided.
> $45/person · 12 spots only
> [RSVP →]


---


### 🛠️ PRODUCT / SERVICE posts — feature what's new


**Formula A: Product + speed claim + warranty**
```
[Product/service name]
[Speed/scope claim] · [warranty or trust signal] · [location served]
[Optional pricing tier]
CTA: See specs / Order online
```


**Example:**
> **Tankless water heaters** installed in 4 hours.
> 12-year warranty · same-day quotes across the **GTA** · financing available.
> [See specs →]


**Formula B: Before/after results**
```
[Service] result: [neighborhood] [property type]
[1-line description of work done]
[Result for customer]
CTA: Book
```


**Example:**
> Drain repair · **East York** semi-detached
> Replaced collapsed clay sewer line with PVC. 6-hour job, no driveway dig (we used a pipe-burst method).
> Homeowner saved $4,200 over the dig-and-replace quote.
> [Book →]


---


## CTA button selection


| Goal | CTA button |
|---|---|
| Convert to phone | Call now |
| Convert to booking | Book |
| Drive to website | Learn more |
| Capture lead | Sign up |
| Ecommerce | Buy / Order online |
| Promo redemption | Get offer |


**Never post without a CTA.** A post without a destination is a wasted slot.


---


## What NOT to do


- ❌ **Daily posting** — looks spammy
- ❌ **Generic content** — "Happy Monday from our team!"
- ❌ **Stock photos** without branding overlay
- ❌ **Keyword stuffing** — write naturally
- ❌ **Fake urgency** — "ENDS TONIGHT!" if it doesn't
- ❌ **Blog excerpts that link off-platform** — visitors are in decision mode
- ❌ **Posting without a photo** — drops engagement ~60%
- ❌ **Reusing copy across clients** — Google detects duplication
- ❌ **Invented Offer posts** — NEVER create an `"Offer"` post with a discount, coupon code, or promo unless the user has explicitly told you the offer details (amount, dates, conditions). If no offer has been provided, default to `"Call to action"` or `"Event"` instead. Making up offers that don't exist misleads customers and damages trust.


---


## The 4 mechanisms posts trigger (why we bother)


1. **Engagement signals** — clicks, calls, directions = behavioral ranking signal (~9% weight)
2. **AI Overview citations** — Gemini reads posts to write AI summaries about your business
3. **Profile freshness** — active profiles get small ranking preference · 90+ days quiet = inactive
4. **Offer badge conversion** — yellow "Limited Time Offer" tag visually steals clicks at current rank


---


## Output format → POST to Make.com webhook


Each generated post is **POSTed to a Make.com webhook URL** as plain-text JSON, then logged in `posts-queue.md` for deduping.


⚠️ **CRITICAL: The entire post is INSIDE the YAML frontmatter as fields. There is NO markdown body section below the closing `---`.**


❌ **WRONG (don't do this):**
```
---
type: update
cta: Book
---


# The same fight, every Sunday night


A client in **Toronto** came in...


[Book →]
```


✅ **RIGHT (always do this):**
```yaml
---
title: "The same fight, every Sunday night"
post_type: STANDARD
summary: |
 A client in Toronto came in...
cta_action: BOOK
cta_url: "https://..."
---
```


The body text lives **inside `summary: |`** (the `|` preserves line breaks). No `**bold**`, no `[link]()`, no `# headings`. Plain text only.


## Make.com scenario: Router pattern (required)


⚠️ **The `Post type` field in Make.com's GBP module is STATIC** — it can't be mapped dynamically. Different post types expose different fields. So one webhook → **Router** → 4 separate GBP modules:


```
Webhook (custom)
       ↓
   Router (checks {{1.post_type}})
       ↓
   ┌────────────────┬─────────┬─────────┐
   ↓                ↓         ↓
Call to action    Event     Offer
(Title +         (Title +  (Title +
 Summary +        Summary + Summary +
 Action +         dates)    coupon +
 URL)                       dates)
```


**Router filter rules** (3 branches):


| Branch | Filter | GBP module config |
|---|---|---|
| **1 · Call to action** | `post_type` = `Call to action` | Post type: Call to action · Action type + URL |
| **2 · Event** | `post_type` = `Event` | Post type: Event · Start/End date |
| **3 · Offer** | `post_type` = `Offer` | Post type: Offer · Coupon + Redeem URL + Terms + dates |


---


**Webhook payload structure** — fields vary by `post_type`. Common fields are always present; type-specific fields are conditional:


### Common fields (every post type · always present)


```yaml
# === Common (sent to webhook for ALL post types) ===
account_name: "accounts/12345678"
location_name: "locations/87654321"
post_type: "Call to action"   # OR "Event" OR "Offer"
title: "60-80 char headline · plain text"
summary: |
 Body text · plain text · no markdown · 25-300 words
media_items:
  - "https://images.pexels.com/photos/xxxxx/photo.jpeg?auto=compress&cs=tinysrgb&w=1200"
# ⚠️ media_items is a plain ARRAY OF STRINGS (direct image URLs)
# Make.com maps this as {{24.media_items[1]}} — Harris Park scenario uses module 24
# JSON format: "media_items": ["https://..."]
# Must be a real, publicly accessible image URL (Pexels/Unsplash direct link)
# Minimum 1200×900 px · 4:3 ratio · max 1 MB


# === Internal tracking (NOT sent to webhook) ===
id: post-2026-05-15-001
status: pending
publish_date: 2026-05-15
published_at: null
image_query: "stock image search query"
keywords_baited:
 - service variant
 - neighborhood
 - long-tail problem
```


---


### Type 1 · Call to action (with action button)


Use for: announcements, customer stories, tips, product spotlights, anything that drives action via a button.


```yaml
---
account_name: "accounts/12345678"
location_name: "locations/87654321"
post_type: "Call to action"
title: "The same fight, every Sunday night — until it wasn't"
summary: |
 A client in Toronto came in after the same Sunday-night argument
 with his wife had played out for 3 years straight.


 Six sessions of parts-based therapy later, he could see it:
 the anger wasn't about the dishes. It was a 14-year-old part of
 him bracing for criticism that wasn't actually coming.


 This is what online therapy for men in Ontario looks like when
 it's done right. First consultation is free.
media_items:
 - "https://images.unsplash.com/photo-xxxxx?w=1200"


# CTA-specific fields
cta_action: BOOK                                 # BOOK | ORDER | SHOP | LEARN_MORE | SIGN_UP | CALL
cta_url: "https://yourclient.com/book"           # required unless CALL


# Internal tracking
id: post-2026-05-15-002
status: pending
publish_date: 2026-05-17
published_at: null
image_query: "man on laptop video call home office"
keywords_baited:
 - online therapy for men Ontario
 - parts-based therapy
 - emotional regulation
---
```


---


### Type 2 · Event (date-anchored)


Use for: workshops, open houses, anniversary events, anything with a specific date range.


```yaml
---
account_name: "accounts/12345678"
location_name: "locations/87654321"
post_type: "Event"
title: "Pasta-making workshop with Chef Marco"
summary: |
 Hands-on Italian pasta workshop in our King St W kitchen.
 All skill levels welcome. Ingredients + take-home recipes
 provided. 12 spots only · $45/person.
media_items:
 - "https://images.unsplash.com/photo-xxxxx?w=1200"


# EVENT-specific fields (ISO 8601 with America/Toronto offset)
start_date: "2026-05-20T14:00:00-04:00"
end_date: "2026-05-20T17:00:00-04:00"


# Internal tracking
id: post-2026-05-15-003
status: pending
publish_date: 2026-05-15
published_at: null
image_query: "italian pasta cooking class"
keywords_baited:
 - cooking class Toronto
 - King St W kitchen
 - hands-on pasta workshop
---
```


---


### Type 3 · Offer (the highest converter · yellow badge)


⚠️ **ONLY use this type when the user has explicitly provided the offer details.** Never invent a discount, coupon code, or promo. If the user hasn't given you an offer to run, use `"Call to action"` instead.

Use for: discounts, promos, limited-time deals. Auto-displays with yellow "Limited Time Offer" tag.


```yaml
---
account_name: "accounts/12345678"
location_name: "locations/87654321"
post_type: "Offer"
title: "$50 off tankless water heater install"
summary: |
 $50 off tankless water heater install in Toronto + GTA.
 12-year warranty · 4-hour install · same-day quotes available.
 Mention this post when you book.
media_items:
 - "https://images.unsplash.com/photo-xxxxx?w=1200"


# OFFER-specific fields
coupon_code: "TANKLESS50"                        # optional · leave "" if none
redeem_online_url: "https://yourclient.com/book?promo=TANKLESS50"
terms_conditions: "Valid on new installs only. Cannot combine with other offers."
start_date: "2026-05-15T00:00:00-04:00"
end_date: "2026-05-22T23:59:59-04:00"


# Internal tracking
id: post-2026-05-15-004
status: pending
publish_date: 2026-05-15
published_at: null
image_query: "tankless water heater install"
keywords_baited:
 - tankless water heater install
 - Toronto + GTA
 - 12-year warranty
---
```


---


### Field mapping in each Make.com router branch


| Make.com field | Call to action | Event | Offer |
|---|---|---|---|
| Account name | `{{1.account_name}}` | `{{1.account_name}}` | `{{1.account_name}}` |
| Location name | `{{1.location_name}}` | `{{1.location_name}}` | `{{1.location_name}}` |
| Title | `{{1.title}}` | `{{1.title}}` | `{{1.title}}` |
| Summary | `{{1.summary}}` | `{{1.summary}}` | `{{1.summary}}` |
| Media items | `{{1.media_items[]}}` | `{{1.media_items[]}}` | `{{1.media_items[]}}` |
| Action type | `{{1.cta_action}}` | — | — |
| URL | `{{1.cta_url}}` | — | — |
| Start date | — | `{{1.start_date}}` | `{{1.start_date}}` |
| End date | — | `{{1.end_date}}` | `{{1.end_date}}` |
| Coupon code | — | — | `{{1.coupon_code}}` |
| Redeem Online URL | — | — | `{{1.redeem_online_url}}` |
| Terms & Conditions | — | — | `{{1.terms_conditions}}` |


**The webhook flow:**


```
Claude generates post (plain text, structured)
       ↓
POST https://hook.make.com/[YOUR_WEBHOOK_ID]
       ↓
Make.com receives payload
       ↓
Make.com → Google Business Profile · Create Local Post
       ↓
Post goes live on GBP within minutes
       ↓
Make.com responds with success/error
       ↓
Claude updates posts-queue.md:
 status: published
 published_at: 2026-05-15T09:00:00Z
```


**Make.com scenario setup (one-time):**


1. Create scenario · trigger = **Webhook (custom)**
2. Copy webhook URL
3. Add module: **Google Business Profile → Create Local Post**
4. Map webhook fields → GBP module fields:
  - `title` → Title
  - `summary` → Summary
  - `post_type` → Post type
  - `cta_action` + `cta_url` → CTA
  - `start_date` / `end_date` → Start/End date (for OFFER/EVENT)
  - `media_url` → Media items
  - `location_name` → Location Name
5. Save + activate scenario
6. Paste webhook URL into Claude Code skill config


**Critical: NO markdown in `summary:` or `title:`**
- ❌ `**bold**` → renders as literal asterisks in GBP
- ❌ `[Book →](url)` → renders as literal brackets
- ❌ `# headings` → renders as literal hash signs
- ✅ Plain text with line breaks only
- ✅ Emojis (Unicode) render fine
- ✅ Links go in `cta_url:` field, not in body


---


## The queue file system


`posts-queue.md` lives in the project. Sections:


```markdown
# Posts Queue


## Pending
[posts ready to publish · status: pending]


## Scheduled
[posts queued in Make.com · status: scheduled]


## Published (last 90 days)
[posts already live · status: published]


## Archive
[older than 90 days]
```


**Why this works:**
- Claude reads "Published" before generating to avoid duplicates
- No external dependency (no Sheets, no DB)
- Stays in version control with the skill
- Trackable history per client


---


## Reference data


- Body max: 1,500 characters
- Image: 1,200 × 900 px · 4:3 · max 1 MB
- Updates expire: 7 days
- Offers expire: at end_date
- Events expire: at end_date
- Max images per post: 10
- Max videos per post: 1 (30 sec · 100 MB)



