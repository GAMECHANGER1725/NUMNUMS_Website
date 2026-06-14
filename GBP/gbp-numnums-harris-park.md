# GBP Spec — Num Num's Bakery · Harris Park

> Paste each section directly into Google Business Profile. Fields marked `[VERIFY IN GBP]` need to be confirmed via GBP autocomplete before saving.

---

## 1. Identity

```yaml
legal_name: "Num Nums Bakery"
dba_name: "Num Num's Bakery"
year_founded: 2019
founders:
  - "Tarun Patel"
website: "https://numnumsbakery.com.au"
address: "96/96 Wigram Street, Harris Park NSW 2150"
address_visible: true
phone: "+61 425 697 725"
```

**Suspension-proofing check:**
- ✅ Business name contains no keyword stuffing
- ✅ Real physical address (not PO box or virtual office)
- ✅ Verified local phone number
- ✅ Single GBP at this address

---

## 2. Categories

```yaml
primary_category: "Cake shop"

secondary_categories:
  - "Bakery"
  - "Patisserie"
  - "Pastry shop"
  - "Dessert shop"
  - "Dessert restaurant"
  - "Confectionery store"
  - "Sweets and dessert buffet"
  - "[VERIFY IN GBP: Wedding bakery]"
  - "[VERIFY IN GBP: Cupcake shop]"
```

**Notes:**
- Primary `Cake shop` beats the generic `Bakery` used by all 3 competitors — lets Num Nums own a targeted local pack.
- All 3 competitors (Bake N Flake, Blow The Candle, Zest Patisserie) use broad "Bakery" — Num Nums gets the custom-cake search intent by being more specific.
- The last 2 secondary slots need GBP autocomplete confirmation: type "Wedding bakery" and "Cupcake shop" in GBP's category field to check if they appear.
- Review quarterly — Google adds new categories regularly.

---

## 3. Services

> Tag: **predefined** = select via GBP autocomplete · **custom** = type manually

```yaml
services:

  # --- Core Cake Services ---
  - name: "Custom Birthday Cake"
    description: "100% eggless custom birthday cakes in Harris Park, baked fresh to order in 15 flavours. Any design, any size. Order 48 hrs ahead via WhatsApp."
    price_tier: "$$"
    type: "predefined"

  - name: "Custom Wedding Cake"
    description: "Eggless multi-tier wedding cakes in Sydney — vegetarian, Jain, and halal-friendly. Bespoke design from your photos. Order early for weekend dates."
    price_tier: "$$$"
    type: "predefined"

  - name: "Baby Shower Cake"
    description: "Eggless baby shower cakes custom-designed for Harris Park & Western Sydney families. Fresh to order, Jain-friendly options available."
    price_tier: "$$"
    type: "predefined"

  - name: "Kids Birthday Cake"
    description: "Eggless kids character and theme cakes — anime, superheroes, princesses, and more. 100% egg-free, fresh-baked. Order via WhatsApp with a photo reference."
    price_tier: "$$"
    type: "predefined"

  - name: "Anniversary Cake"
    description: "Eggless anniversary cakes crafted to order in Harris Park. Custom message, flavour, and design. Sizes from 6\" to 16\" from $39.99."
    price_tier: "$$"
    type: "custom"

  - name: "Photo Cake"
    description: "Edible photo cakes — bring any image and we print it on your eggless cake. Add-on $19.99. 100% vegetarian and halal-friendly. Pickup at Harris Park."
    price_tier: "$$"
    type: "custom"

  - name: "Engagement Cake"
    description: "Stunning eggless engagement cakes for Sydney couples. Custom floral, metallic, or minimalist designs. Jain and halal-friendly. 48-hr order lead time."
    price_tier: "$$"
    type: "custom"

  - name: "Graduation Cake"
    description: "Celebrate with a 100% eggless graduation cake from Num Num's Bakery, Harris Park. Custom school colours and designs. Order via WhatsApp."
    price_tier: "$$"
    type: "custom"

  # --- Specialty Flavours ---
  - name: "Rasmalai Cake"
    description: "Signature eggless Rasmalai-flavoured cake — a Num Num's original. Inspired by the classic Indian dessert. Only available at our Harris Park & Riverstone locations."
    price_tier: "$$"
    type: "custom"

  - name: "Ferrero Rocher Cake"
    description: "Indulgent eggless Ferrero Rocher cake with chocolate hazelnut layers. 100% egg-free, freshly baked to order. Available from 6\" in Harris Park."
    price_tier: "$$"
    type: "custom"

  - name: "Butterscotch Cake"
    description: "Creamy eggless butterscotch cake, one of our most popular flavours. Baked fresh for every order. Available in 6 sizes from $39.99. Harris Park & Riverstone."
    price_tier: "$"
    type: "custom"

  - name: "Mango Cake"
    description: "Tropical eggless mango cake — seasonal favourite at Num Num's Bakery. 100% vegetarian and halal-friendly. Custom size and design available."
    price_tier: "$"
    type: "custom"

  - name: "Pineapple Cake"
    description: "Light and fresh eggless pineapple cake baked to order in Harris Park. Jain-friendly version available on request. Sizes from 6\" ($39.99)."
    price_tier: "$"
    type: "custom"

  - name: "Cookies and Cream Cake"
    description: "Rich eggless Cookies and Cream cake with Oreo layers — a crowd favourite. Order 48 hrs ahead for pickup at Harris Park or Riverstone."
    price_tier: "$"
    type: "custom"

  # --- Dietary-Specific ---
  - name: "Jain-Friendly Cake"
    description: "Eggless cakes made to Jain dietary requirements — no onion, garlic, or root vegetables in decoration. Harris Park's only dedicated Jain-friendly cake option."
    price_tier: "$$"
    type: "custom"

  - name: "Halal Cake"
    description: "All Num Num's cakes are halal-friendly. 100% eggless, no alcohol. Custom designs for Eid, milestones, and celebrations in Sydney's multicultural communities."
    price_tier: "$$"
    type: "custom"

  - name: "Vegetarian Cake"
    description: "Every cake at Num Num's is fully vegetarian — eggs never used. Trusted by Sydney's vegetarian families for celebrations since 2019."
    price_tier: "$"
    type: "custom"

  # --- Other Baked Goods ---
  - name: "Cupcakes"
    description: "Eggless cupcakes baked fresh at our Harris Park bakery. Perfect for parties and corporate events. Available in all 15 cake flavours. Order in bulk via WhatsApp."
    price_tier: "$"
    type: "predefined"

  - name: "Brownies"
    description: "Fudgy eggless brownies from Num Num's Bakery Harris Park. Made fresh in-house daily. Great as add-ons to cake orders or standalone party gifts."
    price_tier: "$"
    type: "custom"

  - name: "Croissants"
    description: "Freshly baked eggless croissants — buttery, flaky, and 100% vegetarian. Available daily at our Harris Park location from 11am."
    price_tier: "$"
    type: "custom"

  - name: "Pastries"
    description: "Assorted eggless pastries baked in-house at Harris Park. Rotating daily selection. Vegetarian and halal-friendly."
    price_tier: "$"
    type: "custom"

  - name: "Indian Sweets"
    description: "Traditional Indian sweets crafted fresh at Num Num's Harris Park. Perfect for Diwali, Eid, and festive gifting. Jain-friendly options available."
    price_tier: "$"
    type: "custom"

  - name: "CakeShake™"
    description: "The Num Num's signature CakeShake™ — a whole eggless cake slice blended inside a milkshake. Only at Harris Park. A must-try Sydney dessert experience."
    price_tier: "$$"
    type: "custom"

  - name: "Cupcake Party Box"
    description: "Custom eggless cupcake boxes for birthdays, baby showers, and events. Choose flavours, frosting, and toppers. Order 48 hrs ahead via WhatsApp."
    price_tier: "$$"
    type: "custom"
```

---

## 4. Business Description

> **750 characters max. First 100 chars show before "see more" — make them count.**

```
Sydney's 100% eggless custom cake bakery — trusted by vegetarian, Jain & halal families since 2019.

Num Num's Bakery in Harris Park crafts every cake fresh to order — never pre-baked, never frozen. Choose from 15 flavours including Rasmalai, Ferrero Rocher, and Butterscotch. Sizes from 6" ($39.99) to 16" ($134.99). Custom designs from photos, photo cakes, multi-tier wedding cakes, and our signature CakeShake™. Order via WhatsApp for pickup.
```

**Character count:** ~469 / 750 ✅
**First 100 chars:** "Sydney's 100% eggless custom cake bakery — trusted by vegetarian, Jain & halal families since 2019." ✅

---

## 5. Hours

```yaml
hours:
  regular:
    monday:    "11:00 AM – 10:00 PM"
    tuesday:   "11:00 AM – 10:00 PM"
    wednesday: "11:00 AM – 10:00 PM"
    thursday:  "11:00 AM – 10:00 PM"
    friday:    "11:00 AM – 10:00 PM"
    saturday:  "11:00 AM – 10:00 PM"
    sunday:    "11:00 AM – 10:00 PM"
  holiday_hours:
    - "Update for Christmas Day, Boxing Day, Good Friday, New Year's Day"
    - "Diwali and Eid — consider extended hours and note in GBP posts"
  is_24_7: false
  has_answering_service: false
```

**Note on 24/7 ranking:** The Harris Park store runs until 10pm daily — this is a strong late-night signal. Add "Open late" as an attribute if visible in GBP. If you ever add a WhatsApp auto-responder for after-hours orders, that qualifies as an answering service.

---

## 6. Photos Brief

```yaml
photos_brief:
  exterior:
    - "Storefront from across Wigram Street — signage clearly visible"
    - "Window display with cakes in view"
    - "Shopfront at night (neon lit, 10pm ambiance)"
  interior:
    - "Glass display case full of cakes and pastries"
    - "Customer ordering / staff decorating cake"
    - "CakeShake being prepared or served"
  team:
    - "Founder Tarun Patel — professional headshot"
    - "Staff in uniform behind counter (with permission)"
  work_in_progress:
    - "Cake being decorated / iced close-up"
    - "Fresh croissants coming out of the oven"
  products:
    - "Rasmalai cake cross-section showing layers"
    - "Ferrero Rocher cake styled hero shot"
    - "6-tier wedding cake on display"
    - "Photo cake with printed image"
    - "CakeShake™ with cake slice visible through glass"
    - "Cupcake box flat-lay"
  monthly_upload_target: "3–5 new photos / month minimum"
```

**Priority order:** Products → Interior → Team → Exterior
**Why:** GBP rewards recency. Upload 10+ photos on day one, then 3–5 new monthly.

---

## 7. Attributes

```yaml
attributes:
  identity:
    family_owned: true
    indian_owned: true          # BIPOC-owned — creates low-competition local packs
    women_owned: false
    veteran_owned: false
    lgbtq_friendly: true        # Welcoming to all — confirm if comfortable marking this
  dietary:
    vegetarian_options: true
    halal_options: true
    # Note: GBP may not have "Jain-friendly" as a set attribute — mention in description
  accessibility:
    wheelchair_accessible: "[VERIFY on-site]"
    wheelchair_parking: "[VERIFY on-site]"
  payments:
    credit_cards: true
    mobile_payments: true        # Tap-to-pay assumed — verify
    cash: true
  service_options:
    in_store_pickup: true
    in_store_shopping: true
    dine_in: false
    delivery: false              # Set to true if you ever add delivery
  ordering:
    online_appointments: false   # ⚠️ Disable this in GBP — pushes reviews out of view
    onsite_services: false       # ⚠️ Disable this in GBP — pushes reviews out of view
```

**Identity hack:** Marking `indian_owned: true` (under "Asian-owned" in GBP) and `family_owned: true` creates local packs with near-zero competition. A search like "Indian-owned cake shop Sydney" or "family-owned eggless bakery Harris Park" can put you in a 3-pack alone.

---

## 8. Service Area

```yaml
service_area:
  is_sab: false         # Physical storefront — address IS shown
  notes: "Location-based business, not SAB. Primary draw from Harris Park, Parramatta, and surrounding suburbs."
  key_suburbs:
    - Harris Park
    - Parramatta
    - Westmead
    - Merrylands
    - Granville
    - Auburn
    - Lidcombe
    - Rosehill
    - Silverwater
    - Camellia
```

**Note:** Do NOT set a GBP service area for a physical storefront — it can confuse Google and dilute your local ranking. These suburbs are for use in **GBP posts** and **website blog content** only.

---

## 9. Products (Top 10 for GBP Showcase)

```yaml
products:
  - name: "6\" Custom Eggless Cake"
    description: "Our entry-level custom cake serves 6–8 guests. 100% eggless, 15 flavours, custom design. Baked fresh to order in Harris Park."
    price: "$39.99"
    image_brief: "Top-down flat-lay of a decorated 6\" eggless cake with birthday message"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "8\" Custom Eggless Cake"
    description: "Serves 12–14 guests. Custom flavour, colour, and design. 100% eggless and vegetarian. 48-hr order lead time. Pickup at Harris Park."
    price: "$49.99"
    image_brief: "Side-on photo of an 8\" cake with floral decoration and clean white finish"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "10\" Custom Eggless Cake"
    description: "Feeds 20–22 guests. Our most popular party size. 100% eggless, custom design from your photo. Fresh-baked at Harris Park bakery."
    price: "$74.99"
    image_brief: "10\" cake with fondant decorations, styled on marble surface"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "12\" Custom Eggless Cake"
    description: "Serves 25–30 guests. Perfect for large birthdays and corporate events. 100% eggless, 15 flavours, photo or custom design."
    price: "$89.99"
    image_brief: "12\" cake with multi-colour drip finish and tall layers"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "Photo Cake"
    description: "Your photo printed on an eggless cake. Any image — baby photos, graduation portraits, wedding shots. Add-on to any size cake."
    price: "from $59.98 (6\" + add-on)"
    image_brief: "Close-up of edible photo print on cake surface, crisp and vibrant colours"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "Rasmalai Eggless Cake"
    description: "Our signature Indian-inspired Rasmalai cake — saffron cream layers, rose decoration, 100% eggless. A Sydney exclusive only at Num Num's."
    price: "[VERIFY pricing — specialty flavour may be higher]"
    image_brief: "Rasmalai cake with saffron garnish and rose petals, styled on dark background"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "CakeShake™"
    description: "Num Num's original invention — a full eggless cake slice inside a thick milkshake. The only one in Sydney. Walk-in or WhatsApp order."
    price: "[ADD PRICE]"
    image_brief: "CakeShake in branded cup, cake slice visible, whipped cream and drizzle on top"
    linked_service_page: "https://numnumsbakery.com.au/"

  - name: "Eggless Cupcake Box"
    description: "Box of 6 or 12 eggless cupcakes. Custom flavour, frosting, and toppers. Perfect for parties, offices, and gifting. Order 48 hrs ahead."
    price: "[ADD PRICE]"
    image_brief: "Cupcake box opened flat-lay, 12 cupcakes with matching toppers and frosting"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "Wedding Cake (Multi-Tier)"
    description: "Bespoke eggless wedding cakes for Sydney couples. 2, 3, or 4 tiers. Jain, halal, and vegetarian-friendly. Consult via WhatsApp to design your dream cake."
    price: "[PRICE ON REQUEST]"
    image_brief: "3-tier white wedding cake with sugar flowers, elegant styling"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "Indian Sweets Gift Box"
    description: "Handcrafted Indian sweets for Diwali, Eid, weddings, and festive gifting. Jain-friendly options available. Order from Harris Park bakery."
    price: "[ADD PRICE]"
    image_brief: "Gift box of assorted Indian sweets, gold box, festive styling"
    linked_service_page: "https://numnumsbakery.com.au/"
```

---

## 10. Booking / Order Link

```yaml
booking:
  enabled: true
  platform: "WhatsApp (via website order form)"
  booking_url: "https://numnumsbakery.com.au/#order"
  fallback_cta: "Order via WhatsApp"
  notes: "GBP supports a 'Book' or 'Order online' button. Link it to the website order section. If GBP allows WhatsApp deep-link, use: https://wa.me/61425697725"
```

---

## 11. FAQ Seed

> ⚠️ Do NOT post these as GBP Q&As (that feature is being phased out). Add these to a **FAQ section on the website** with FAQ schema markup for AI Overviews and PAA ranking.

```yaml
faq_seed:

  - question: "Are all products at Num Num's Bakery really 100% eggless?"
    answer: "Yes — every single product we make is eggless, including our croissants, pastries, brownies, and CakeShake. Eggs are never used in our kitchen. This isn't a specialty request — it's simply how we bake."

  - question: "Can I order a Jain-friendly cake at Num Num's?"
    answer: "Yes. We cater specifically to Jain dietary requirements. Please mention this when placing your order via WhatsApp, and we'll ensure your cake meets Jain standards. We've been serving Sydney's Jain community since 2019."

  - question: "How far in advance do I need to order?"
    answer: "Standard cakes require 48 hours notice. Custom designs, wedding cakes, or large orders (12\" and above) are best ordered 5–7 days in advance to ensure we can source the right decorations and guarantee freshness."

  - question: "Are your cakes halal?"
    answer: "All Num Num's cakes are halal-friendly — no eggs, no alcohol, and no non-halal ingredients. We serve Sydney's Muslim community for Eid, milad, and everyday celebrations."

  - question: "Do you offer delivery?"
    answer: "Currently our cakes are available for pickup from our Harris Park (daily 11am–10pm) and Riverstone locations. WhatsApp us for the most up-to-date information on any delivery arrangements."

  - question: "Can I bring my own design?"
    answer: "Absolutely. Send us a photo of your dream cake on WhatsApp and we'll recreate it or design something inspired by it. We've replicated photos, cartoon characters, logos, and landscapes — there's very little we can't do."

  - question: "What flavours do you offer?"
    answer: "We offer 15 flavours including Butterscotch, Mango, Pineapple, Cookies and Cream, Rasmalai, Ferrero Rocher, Chocolate, Vanilla, Strawberry, and Black Forest. Specialty flavours like Rasmalai and Ferrero Rocher may have different pricing."

  - question: "What cake sizes do you offer and how many people do they serve?"
    answer: "We have six sizes: 6\" (6–8 guests, $39.99), 8\" (12–14 guests, $49.99), 10\" (20–22 guests, $74.99), 12\" (25–30 guests, $89.99), 14\" (40–45 guests, $114.99), and 16\" (50–55 guests, $134.99). Photo cake add-on is +$19.99."

  - question: "What makes Num Num's different from other Sydney bakeries?"
    answer: "We are 100% eggless — not just in some products, but in everything we make. We started in Harris Park in 2019 specifically to serve vegetarian, Jain, and halal families who couldn't find a celebration cake they could eat without worry. Every cake is baked fresh to order, never frozen."

  - question: "Where are you located?"
    answer: "We have two Sydney locations: Harris Park at 96/96 Wigram Street (daily 11am–10pm) and Riverstone at Shop 8, Riverstone Shopping Centre (Mon–Fri 6am–8pm, Sat–Sun 7am–7pm). Order ahead via WhatsApp for guaranteed pickup."
```

---

## 12. NAP Master Record

> **Copy this EXACTLY across every directory listing. Byte-for-byte consistency is critical.**

```yaml
nap_master:
  name:    "Num Num's Bakery"
  address: "96/96 Wigram Street, Harris Park NSW 2150"
  phone:   "+61 425 697 725"

citation_directories:

  tier_1_universal:
    - "Google Business Profile ← you are here"
    - "Apple Maps Connect — business.apple.com/maps"
    - "Bing Places — bingplaces.com"
    - "Yelp — biz.yelp.com.au"
    - "Facebook Business Page — facebook.com/business"
    - "Foursquare — business.foursquare.com"

  tier_2_authority_australia:
    - "Yellow Pages AU — yellowpages.com.au"
    - "TrueLocal — truelocal.com.au"
    - "AussieWeb — aussieweb.com.au"
    - "Hotfrog AU — hotfrog.com.au"
    - "LocalSearch — localsearch.com.au"
    - "Nextdoor Business — nextdoor.com/business"

  tier_3_food_and_bakery:
    - "Zomato — zomato.com/sydney (high DA food directory)"
    - "TripAdvisor — tripadvisor.com.au (restaurants/cafes section)"
    - "Eatability — eatability.com.au (Sydney-specific food review site)"
```

**NAP rules:**
- Always use `Num Num's Bakery` (with apostrophe) as the brand name in all directories
- Always use `+61 425 697 725` format (international) OR `0425 697 725` (local) — pick ONE and stick to it
- Address must always be `96/96 Wigram Street` — not `96 Wigram St` or any variation

---

## Suspension Risk Checklist

| Risk | Status |
|------|--------|
| Keyword-stuffed business name | ✅ Clean — "Num Num's Bakery" only |
| Virtual office / PO box address | ✅ Real physical address |
| Co-working or shared GBP address | ✅ Not applicable |
| Multiple GBPs at the same address | ✅ Harris Park and Riverstone are separate addresses |
| Home-based address visible | ✅ Commercial storefront |
| Fake listings in non-operating cities | ✅ No fake listings |
| Service area > 2-hour drive | ✅ No SAB set — physical store |

---

## Quick Action Checklist

- [ ] Log into GBP → confirm primary category is **Cake shop** (type it, select from autocomplete)
- [ ] Add all 7 confirmed secondary categories + verify the 2 TBD ones via autocomplete
- [ ] Paste the business description (copy from Section 4 above)
- [ ] Set hours: Daily 11:00 AM – 10:00 PM
- [ ] Add all attributes (identity, dietary, payments)
- [ ] Add the WhatsApp order link as the booking URL
- [ ] Upload minimum 10 photos on day 1 (prioritise products + interior)
- [ ] Add all 10 products with pricing and images
- [ ] Submit to all Tier 1 + Tier 2 directories with exact NAP
- [ ] Add the FAQ content to the website with FAQ schema markup
- [ ] Schedule a post on GBP within 7 days of publishing (signals active listing)

---

*Generated: June 2026 · Review categories quarterly · Update hours for AU public holidays*
