# GBP Spec — Num Num's Bakery · Riverstone

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
address: "Shop 8, Riverstone Shopping Centre, Riverstone NSW 2765"
address_visible: true
phone: "+61 425 697 725"
```

**Suspension-proofing check:**
- ✅ Business name contains no keyword stuffing
- ✅ Real physical address inside Riverstone Shopping Centre
- ✅ Same phone as Harris Park is fine for multi-location businesses
- ✅ Separate GBP from Harris Park — different address

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
- Keep categories identical to Harris Park — consistent brand signal to Google.
- Riverstone's location within a shopping centre means Google will auto-detect a high foot-traffic zone — categories help it rank for "near me" searches in the North West Sydney corridor.
- Serves the Marsden Park, Tallawong, Box Hill, and Schofields growth corridor — one of Sydney's fastest-growing suburban belts.
- Review quarterly — Google adds new categories regularly.

---

## 3. Services

> Tag: **predefined** = select via GBP autocomplete · **custom** = type manually

```yaml
services:

  # --- Core Cake Services ---
  - name: "Custom Birthday Cake"
    description: "100% eggless custom birthday cakes in Riverstone, baked fresh to order in 15 flavours. Any design, any size. Order 48 hrs ahead via WhatsApp."
    price_tier: "$$"
    type: "predefined"

  - name: "Custom Wedding Cake"
    description: "Eggless multi-tier wedding cakes for North West Sydney families — vegetarian, Jain, and halal-friendly. Custom design from photos. Early booking recommended."
    price_tier: "$$$"
    type: "predefined"

  - name: "Baby Shower Cake"
    description: "Eggless baby shower cakes custom-designed for Riverstone and North West Sydney. Fresh to order, Jain-friendly options available."
    price_tier: "$$"
    type: "predefined"

  - name: "Kids Birthday Cake"
    description: "Eggless kids character and theme cakes — anime, superheroes, princesses, and more. 100% egg-free, fresh-baked to order. Send a photo reference via WhatsApp."
    price_tier: "$$"
    type: "predefined"

  - name: "Anniversary Cake"
    description: "Eggless anniversary cakes crafted to order at our Riverstone location. Custom message, flavour, and design. Sizes from 6\" to 16\" from $39.99."
    price_tier: "$$"
    type: "custom"

  - name: "Photo Cake"
    description: "Edible photo cakes — bring any image and we print it on your eggless cake. Add-on $19.99. 100% vegetarian and halal-friendly. Pickup at Riverstone Shopping Centre."
    price_tier: "$$"
    type: "custom"

  - name: "Engagement Cake"
    description: "Elegant eggless engagement cakes for North West Sydney couples. Custom floral, metallic, or minimalist designs. Jain and halal-friendly. 48-hr order lead time."
    price_tier: "$$"
    type: "custom"

  - name: "Graduation Cake"
    description: "Celebrate with a 100% eggless graduation cake from Num Num's Bakery, Riverstone. Custom school colours and designs. Order via WhatsApp."
    price_tier: "$$"
    type: "custom"

  # --- Specialty Flavours ---
  - name: "Rasmalai Cake"
    description: "Signature eggless Rasmalai-flavoured cake — a Num Num's original. Inspired by the classic Indian dessert. Only at Harris Park & Riverstone locations in Sydney."
    price_tier: "$$"
    type: "custom"

  - name: "Ferrero Rocher Cake"
    description: "Indulgent eggless Ferrero Rocher cake with chocolate hazelnut layers. 100% egg-free, freshly baked to order. Available from 6\" at Riverstone bakery."
    price_tier: "$$"
    type: "custom"

  - name: "Butterscotch Cake"
    description: "Creamy eggless butterscotch cake — one of Num Num's most popular flavours. Fresh baked to order. Available in 6 sizes from $39.99. Harris Park & Riverstone."
    price_tier: "$"
    type: "custom"

  - name: "Mango Cake"
    description: "Tropical eggless mango cake — seasonal favourite at Num Num's Bakery. 100% vegetarian and halal-friendly. Custom size and design available in Riverstone."
    price_tier: "$"
    type: "custom"

  - name: "Pineapple Cake"
    description: "Light and fresh eggless pineapple cake baked to order at our Riverstone bakery. Jain-friendly version available on request. Sizes from 6\" ($39.99)."
    price_tier: "$"
    type: "custom"

  - name: "Cookies and Cream Cake"
    description: "Rich eggless Cookies and Cream cake with Oreo layers — a crowd favourite. Order 48 hrs ahead for pickup at Riverstone Shopping Centre."
    price_tier: "$"
    type: "custom"

  # --- Dietary-Specific ---
  - name: "Jain-Friendly Cake"
    description: "Eggless cakes made to Jain dietary requirements — no onion, garlic, or root vegetables in decoration. Serving Riverstone's growing Jain community."
    price_tier: "$$"
    type: "custom"

  - name: "Halal Cake"
    description: "All Num Num's cakes are halal-friendly. 100% eggless, no alcohol. Custom designs for Eid, milestones, and celebrations across North West Sydney."
    price_tier: "$$"
    type: "custom"

  - name: "Vegetarian Cake"
    description: "Every cake at Num Num's is fully vegetarian — eggs never used. Trusted by Sydney's vegetarian families for celebrations since 2019."
    price_tier: "$"
    type: "custom"

  # --- Other Baked Goods ---
  - name: "Croissants"
    description: "Freshly baked eggless croissants — available from opening at our Riverstone location. Perfect for morning pickup before work or school."
    price_tier: "$"
    type: "custom"

  - name: "Pastries"
    description: "Assorted eggless pastries baked in-house at Riverstone. Rotating daily selection. Vegetarian and halal-friendly."
    price_tier: "$"
    type: "custom"

  - name: "Cupcakes"
    description: "Eggless cupcakes baked fresh at our Riverstone bakery. Perfect for school events, offices, and parties. Available in all 15 flavours."
    price_tier: "$"
    type: "predefined"

  - name: "Brownies"
    description: "Fudgy eggless brownies made fresh in-house daily at Riverstone. Great add-on to cake orders or standalone party gifts."
    price_tier: "$"
    type: "custom"

  - name: "Indian Sweets"
    description: "Traditional Indian sweets crafted fresh at our Riverstone bakery. Perfect for Diwali, Eid, and festive gifting. Jain-friendly options available."
    price_tier: "$"
    type: "custom"

  - name: "CakeShake™"
    description: "Num Num's signature CakeShake™ — a whole eggless cake slice blended inside a milkshake. A Sydney-original dessert experience. Available at Riverstone."
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
North West Sydney's 100% eggless custom cake bakery — trusted by vegetarian, Jain & halal families.

Num Num's Bakery at Riverstone Shopping Centre crafts every cake fresh to order — never pre-baked, never frozen. Choose from 15 flavours including Rasmalai, Ferrero Rocher, and Butterscotch. Sizes from 6" ($39.99) to 16" ($134.99). Custom designs from photos, photo cakes, multi-tier wedding cakes, and our signature CakeShake™. Order via WhatsApp for pickup at Riverstone.
```

**Character count:** ~481 / 750 ✅
**First 100 chars:** "North West Sydney's 100% eggless custom cake bakery — trusted by vegetarian, Jain & halal families." ✅
**Geo-signal:** "North West Sydney" and "Riverstone" appear naturally — targets the Marsden Park / Tallawong / Schofields growth corridor.

---

## 5. Hours

```yaml
hours:
  regular:
    monday:    "6:00 AM – 8:00 PM"
    tuesday:   "6:00 AM – 8:00 PM"
    wednesday: "6:00 AM – 8:00 PM"
    thursday:  "6:00 AM – 8:00 PM"
    friday:    "6:00 AM – 8:00 PM"
    saturday:  "7:00 AM – 7:00 PM"
    sunday:    "7:00 AM – 7:00 PM"
  holiday_hours:
    - "Update for Christmas Day, Boxing Day, Good Friday, New Year's Day"
    - "Check Riverstone Shopping Centre holiday trading hours — match centre hours"
    - "Diwali and Eid — note extended hours in GBP posts if applicable"
  is_24_7: false
  has_answering_service: false
```

**Note:** Riverstone opens at 6am on weekdays — this is a major competitive advantage for "early morning pickup" searches. Make sure GBP hours are set precisely to 6am so "open now" filters trigger for early shoppers.

---

## 6. Photos Brief

```yaml
photos_brief:
  exterior:
    - "Shopfront inside Riverstone Shopping Centre — 'Shop 8' signage visible"
    - "Entrance at 6am with lights on (early opening differentiator)"
    - "Centre directory / wayfinding map showing Num Num's location"
  interior:
    - "Glass display case with morning pastries and croissants"
    - "Staff preparing morning bake / decorating cakes"
    - "CakeShake being prepared"
  team:
    - "Founder Tarun Patel at the Riverstone counter"
    - "Staff team photo at Riverstone (morning)"
  work_in_progress:
    - "Fresh croissants coming out of the oven (morning bake)"
    - "Cake being decorated for a pickup order"
  products:
    - "Rasmalai cake hero shot with Indian styling"
    - "Morning pastry selection tray"
    - "Photo cake with printed image — close-up of print quality"
    - "6-tier wedding cake on display stand"
    - "Cupcake party box opened flat-lay"
  monthly_upload_target: "3–5 new photos / month minimum"
```

**Priority order:** Products → Interior (morning bake) → Exterior → Team
**Note:** The Riverstone store's 6am opening is a unique story — show it visually.

---

## 7. Attributes

```yaml
attributes:
  identity:
    family_owned: true
    indian_owned: true          # BIPOC-owned — creates low-competition packs
    women_owned: false
    veteran_owned: false
    lgbtq_friendly: true        # Welcoming to all — confirm if comfortable marking
  dietary:
    vegetarian_options: true
    halal_options: true
  accessibility:
    wheelchair_accessible: "[VERIFY — shopping centre likely has ramps]"
    wheelchair_parking: "[VERIFY — shopping centre parking]"
  payments:
    credit_cards: true
    mobile_payments: true
    cash: true
  service_options:
    in_store_pickup: true
    in_store_shopping: true
    dine_in: false
    delivery: false
  ordering:
    online_appointments: false   # ⚠️ Disable — pushes reviews out of view
    onsite_services: false       # ⚠️ Disable — pushes reviews out of view
```

**Shopping centre note:** Riverstone Shopping Centre likely provides wheelchair access — verify and mark `wheelchair_accessible: true`. This creates a new local pack for accessibility-filtered searches.

---

## 8. Service Area

```yaml
service_area:
  is_sab: false         # Physical storefront — address IS shown
  notes: "Location-based business in Riverstone Shopping Centre. Serves the North West Sydney growth corridor."
  key_suburbs:
    - Riverstone
    - Marsden Park
    - Tallawong
    - Box Hill
    - Schofields
    - Vineyard
    - Rouse Hill
    - Kellyville
    - Stanhope Gardens
    - Quakers Hill
    - Windsor
```

**Note:** These suburbs are for use in **GBP posts** and **website blog content** only — do not set a GBP service area for a physical storefront.

---

## 9. Products (Top 10 for GBP Showcase)

```yaml
products:
  - name: "6\" Custom Eggless Cake"
    description: "Our entry-level custom cake serves 6–8 guests. 100% eggless, 15 flavours, custom design. Baked fresh to order at Riverstone."
    price: "$39.99"
    image_brief: "Top-down flat-lay of a decorated 6\" eggless cake with colourful toppers"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "8\" Custom Eggless Cake"
    description: "Serves 12–14 guests. Custom flavour, colour, and design. 100% eggless and vegetarian. 48-hr order lead time. Pickup at Riverstone."
    price: "$49.99"
    image_brief: "Side-on photo of an 8\" cake with butter-cream swirls and floral decoration"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "10\" Custom Eggless Cake"
    description: "Feeds 20–22 guests. Most popular party size. 100% eggless, custom design from your photo. Fresh-baked at Riverstone bakery."
    price: "$74.99"
    image_brief: "10\" cake with fondant character decoration, bright colours"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "12\" Custom Eggless Cake"
    description: "Serves 25–30 guests. Perfect for large birthdays and corporate events. 100% eggless, 15 flavours, photo or custom design."
    price: "$89.99"
    image_brief: "12\" cake with drip finish and gold leaf decoration"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "Photo Cake"
    description: "Your photo printed on an eggless cake. Any image — family photos, baby shots, graduation portraits. Add-on to any size."
    price: "from $59.98 (6\" + add-on)"
    image_brief: "Close-up of edible photo print on cake surface — crisp, vibrant image quality"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "Rasmalai Eggless Cake"
    description: "Signature Indian-inspired Rasmalai cake — saffron cream layers, rose decoration, 100% eggless. A Sydney exclusive only at Num Num's."
    price: "[VERIFY pricing — specialty flavour may be higher]"
    image_brief: "Rasmalai cake with rose petals and saffron strands, elegant dark background"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "CakeShake™"
    description: "Num Num's original — a full eggless cake slice inside a thick milkshake. Only in Sydney. Walk-in or WhatsApp order at Riverstone."
    price: "[ADD PRICE]"
    image_brief: "CakeShake in branded cup, cake slice visible inside, cream and drizzle on top"
    linked_service_page: "https://numnumsbakery.com.au/"

  - name: "Fresh Eggless Croissants"
    description: "Buttery, flaky eggless croissants baked fresh daily from 6am at Riverstone. 100% vegetarian. Perfect for breakfast pick-up."
    price: "[ADD PRICE]"
    image_brief: "Croissants in a basket, golden brown, morning light, steam visible"
    linked_service_page: "https://numnumsbakery.com.au/"

  - name: "Wedding Cake (Multi-Tier)"
    description: "Bespoke eggless wedding cakes for North West Sydney couples. 2–4 tiers. Jain, halal, and vegetarian-friendly. Design via WhatsApp."
    price: "[PRICE ON REQUEST]"
    image_brief: "3-tier white wedding cake with sugar flowers, elegant table setting"
    linked_service_page: "https://numnumsbakery.com.au/#order"

  - name: "Indian Sweets Gift Box"
    description: "Handcrafted Indian sweets for Diwali, Eid, weddings, and festive gifting. Jain-friendly options available. Order from Riverstone bakery."
    price: "[ADD PRICE]"
    image_brief: "Gold gift box of assorted Indian sweets, festive ribbon, Diwali styling"
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
  notes: "GBP supports a 'Book' or 'Order online' button. Link to the website order section. WhatsApp deep-link: https://wa.me/61425697725"
```

---

## 11. FAQ Seed

> ⚠️ Do NOT post these as GBP Q&As (that feature is being phased out). Add to the **website FAQ section** with FAQ schema markup for AI Overviews and PAA ranking.

```yaml
faq_seed:

  - question: "Are all products at Num Num's Bakery really 100% eggless?"
    answer: "Yes — every single product we make is eggless, including our croissants, pastries, brownies, and CakeShake. Eggs are never used in our kitchen. This isn't a specialty request — it's simply how we bake."

  - question: "Can I order a Jain-friendly cake at Num Num's?"
    answer: "Yes. We cater specifically to Jain dietary requirements. Please mention this when placing your order via WhatsApp, and we'll ensure your cake meets Jain standards. We've been serving Sydney's Jain community since 2019."

  - question: "How far in advance do I need to order?"
    answer: "Standard cakes require 48 hours notice. Custom designs, wedding cakes, or large orders (12\" and above) are best ordered 5–7 days in advance to ensure we can source the right decorations and guarantee freshness."

  - question: "Are your cakes halal?"
    answer: "All Num Num's cakes are halal-friendly — no eggs, no alcohol, and no non-halal ingredients. We serve North West Sydney's Muslim community for Eid, milad, and everyday celebrations."

  - question: "Do you offer delivery?"
    answer: "Currently cakes are available for pickup from our Riverstone Shopping Centre location (Mon–Fri 6am–8pm, Sat–Sun 7am–7pm) and Harris Park (daily 11am–10pm). WhatsApp us for the latest delivery arrangements."

  - question: "Can I bring my own design?"
    answer: "Absolutely. Send us a photo of your dream cake on WhatsApp and we'll recreate it or design something inspired by it. We've replicated cartoon characters, logos, landscapes, and more."

  - question: "What flavours do you offer?"
    answer: "We offer 15 flavours including Butterscotch, Mango, Pineapple, Cookies and Cream, Rasmalai, Ferrero Rocher, Chocolate, Vanilla, Strawberry, and Black Forest. Specialty flavours like Rasmalai and Ferrero Rocher may have different pricing."

  - question: "What cake sizes do you offer and how many people do they serve?"
    answer: "We have six sizes: 6\" (6–8 guests, $39.99), 8\" (12–14 guests, $49.99), 10\" (20–22 guests, $74.99), 12\" (25–30 guests, $89.99), 14\" (40–45 guests, $114.99), and 16\" (50–55 guests, $134.99). Photo cake add-on is +$19.99."

  - question: "What makes Num Num's different from other bakeries in Riverstone and North West Sydney?"
    answer: "We are 100% eggless in everything we make — not just some products. Founded in 2019 by Tarun Patel to serve vegetarian, Jain, and halal families who couldn't find a celebration cake they could eat without worry. Every cake is baked fresh to order, never frozen."

  - question: "Where is the Riverstone bakery located?"
    answer: "We're at Shop 8, Riverstone Shopping Centre, Riverstone NSW 2765. Hours: Monday–Friday 6am–8pm, Saturday–Sunday 7am–7pm. We're also at 96/96 Wigram Street, Harris Park (daily 11am–10pm)."
```

---

## 12. NAP Master Record

> **Copy this EXACTLY across every directory listing. Byte-for-byte consistency is critical.**

```yaml
nap_master:
  name:    "Num Num's Bakery"
  address: "Shop 8, Riverstone Shopping Centre, Riverstone NSW 2765"
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
    - "Zomato — zomato.com/sydney"
    - "TripAdvisor — tripadvisor.com.au"
    - "Eatability — eatability.com.au"
```

**NAP rules:**
- Always use `Num Num's Bakery` (with apostrophe) as brand name in all directories
- Always use `+61 425 697 725` format — keep identical across both location listings
- Address must always be `Shop 8, Riverstone Shopping Centre` — not shortened or varied

---

## Suspension Risk Checklist

| Risk | Status |
|------|--------|
| Keyword-stuffed business name | ✅ Clean — "Num Num's Bakery" only |
| Virtual office / PO box address | ✅ Real physical location inside shopping centre |
| Co-working or shared GBP address | ✅ Dedicated shop tenancy |
| Multiple GBPs at the same address | ✅ Harris Park and Riverstone are separate addresses |
| Home-based address visible | ✅ Commercial shopfront |
| Fake listings in non-operating cities | ✅ No fake listings |
| Service area > 2-hour drive | ✅ No SAB set — physical store |

---

## Quick Action Checklist

- [ ] Log into GBP → create a **second, separate listing** for Riverstone (don't add as a location to Harris Park)
- [ ] Confirm primary category is **Cake shop** (type in GBP autocomplete)
- [ ] Add all 7 confirmed secondary categories + verify the 2 TBD ones
- [ ] Paste the business description (copy from Section 4 above)
- [ ] Set hours: Mon–Fri 6:00 AM – 8:00 PM · Sat–Sun 7:00 AM – 7:00 PM
- [ ] Add all attributes (identity, dietary, payments, accessibility)
- [ ] Add WhatsApp order link as the booking URL
- [ ] Upload minimum 10 photos on day 1 (prioritise morning bake, croissants, products)
- [ ] Add all 10 products with pricing and images
- [ ] Submit to all Tier 1 + Tier 2 directories with RIVERSTONE NAP (not Harris Park)
- [ ] Add FAQ content to website with FAQ schema markup (shared with Harris Park)
- [ ] Schedule a GBP post within 7 days of publishing

---

*Generated: June 2026 · Review categories quarterly · Sync holiday hours with Riverstone Shopping Centre trading hours*
