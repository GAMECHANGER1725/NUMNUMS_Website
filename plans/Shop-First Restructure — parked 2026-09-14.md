# Shop-First Restructure — parked 2026-09-14

**Status: PARKED.** Vaidik stopped this to refocus on finishing the sign-in and
checkout system. Nothing here has been built. This file exists so the research
does not have to be redone.

---

## Why this came up

Asked to judge the site as a 38-year-old parent with an egg-allergic kid,
buying a cake for next Saturday, on a phone at 9:40pm. The verdict was **no,
they would not buy on a first visit** — and the reasons were measured, not
guessed.

### What was measured (2026-09-14, mobile 390×844)

| Thing | Number | How |
|---|---|---|
| First Contentful Paint, slow 4G | **656ms** | Chrome DevTools protocol, Lighthouse's default throttle (70ms RTT, 1.6Mbps, 4× CPU) |
| Time the page is actually a blank cream box | **2,540ms fast 4G / 3,875ms slow 4G** | rAF loop inside the page watching `#sk-overlay` opacity |
| `load` event | 12,741ms slow 4G | Navigation Timing |
| First price on the homepage | **y = 5,953px** (~7 phone screens) | DOM scan for `$\d` |
| Homepage height, mobile | **16,460px** (~19 screens) | `document.body.scrollHeight` |
| Homepage content links to `/order` vs `/shop` | **16 vs 5** — and all 5 of the `/shop` links are nav, cart pill, mobile menu, footer. **Zero in content.** | href census |
| Page weight / requests | 730KB / 19 | Resource Timing |
| Heaviest blocking resources | 3 review photos at **271KB, 170KB, 160KB** | Resource Timing, sorted by duration |

**The core finding:** the skeleton overlay (`#sk-overlay`) is gated on
`window.load`, which waits for the hero video, GTM, the Meta pixel and those
three review photos. It therefore *hides a page that had already painted at
656ms* for 2.5–3.9 seconds. A 3-second fallback timer is the only thing
stopping it being worse. This is self-inflicted and is the cheapest fix on the
site.

### The argument, in short

1. **Blank for 2.5–4s** — the skeleton covers content that was ready.
2. **Price is 7 screens down** — a parent's first question, answered last.
3. **Both hero CTAs go to the quote form**, one labelled "Get a Quote" with a
   WhatsApp icon. Nothing on the homepage lets anyone buy.
4. **The flow ends in WhatsApp** with no price, no confirmation, no payment —
   at 9:40pm nobody replies, and by Monday they have bought elsewhere.
5. **Pickup only**, said once, on `/locations`. A competitor in the same niche
   ([Zest Patisserie](https://www.zestpatisserie.com.au/eggless-cakes/))
   delivers Sydney-wide. There is also an **Uber Eats storefront the website
   never links to**.

### What is genuinely strong (do not break these)

- The positioning: *"A Custom Cake So Good, No One Will Guess It's Eggless"* —
  names the objection and kills it. 100% eggless with no egg on the premises is
  a claim almost nobody in Sydney can make, and for an allergy parent it is the
  entire decision.
- The above-the-fold trust row: eggless · 48 hours · we match your photo · love
  it or we'll make it right.
- The proof: 4.6 / 50+ reviews, named quotes, real photos of real cakes.

The tension is that all three are above the fold and the thing they earn is
5,953px away.

---

## The parked plan: `/` becomes the shop

Vaidik's framing: *"a shop with marketing, not a marketing site with the
ability to buy."*

### Proposed IA (URLs deliberately unchanged except one)

```
/                      THE SHOP — 15 cakes, prices, straight to buy
                       Marketing below: eggless promise, reviews, custom band, locations
/shop                  301 → /            (the board moves home; one board, not two)
/shop/cakes/<slug>     product pages — unchanged, flip off noindex
/shop/cart|checkout|thank-you|sign-up|log-in   unchanged
/order                 Custom cakes — unchanged URL, keeps its equity
/indian-sweet /locations /about /blog/         unchanged
```

Nav drops to **Custom Cakes · Indian Sweets · Locations · Blog** + cart. No
"Shop" entry and no dropdown: the logo goes home, and home is the shop.

### How to avoid a second price list

The board's 15 cards would be static HTML on `/`, which duplicates
`shop-app/lib/cake-framing.ts`, `lib/badges.ts` and the catalogue. **Do not
hand-maintain it.** Follow the pattern that already exists:
`shop-app/scripts/sync-catalog.mjs` writes `lib/catalog.generated.mjs` and
`verify-blog.mjs:452` fails the deploy if the copy drifts. Generate the card
block between markers in `index.html` the same way and gate it.

CSS to port from `shop-app/app/globals.css`: `.cake-card` (247), `.cake-photo`
(279), `.cake-ground` (287), `.badge-premium` (306), `.badge-claim` (323).

### Targets

- Board starts above 800px (from 5,953px)
- Homepage under ~8,000px mobile (from 16,460px)
- Nothing blank after FCP (~650ms)

### Hard dependency — do not skip

`/shop` is `noindex` (`shop-app/app/layout.tsx:36`) because the checkout is not
finished. **Making the homepage a shop before it can take money is worse than
today.** This whole restructure sits behind the same switch as the Stripe live
keys. Outstanding per `CLAUDE.md`: Netlify env vars, the "Online Orders"
Supabase user, the Stripe production webhook, the Make.com scenario, and one
real $39.99 order + refund.

---

## Page inventory (so it does not need re-deriving)

**`index.html`** (2,098 lines) — nav 898; video hero 944–999 (100dvh); trust bar
1002; problem/mechanism 1058; `#our-cakes` 4 occasion cards 1095–1208; Why Num
Num's + stat cards 1211–1285 (**$39.99** at 1271); pricing slider 1288–1331
(holds the full 6-row price table in a tooltip); **Wall of Love reviews
1334–1519 — the single biggest block at 186 lines**; FAQ 1522–1569 + FAQPage
schema 1570–1607; How to Order 1610–1652; footer 1655.
Schema: Organization, WebSite/SearchAction, 2× Bakery, 9× Review (513–736), FAQPage.

**`order.html`** (2,400) — hero 548; filter tabs 580; **gallery 605–813 (209
lines, 12 photos)**; duplicate pricing slider 816–885; **`#custom-form`
888–1134 (247 lines, the 11-field form)**; **flavours 1142–1347 (206 lines, 15
cards)**; why eggless 1350; ready-made 1406; footer 1436.

**`indian-sweet.html`** (1,861) — richest commerce schema on the static site
(Product ×6, Offer ×6, UnitPriceSpecification ×5, FAQPage with 9 Q&A). Six
priced category sections. Prices are real ($33.99–$39.99/kg) but every CTA is
WhatsApp — nothing is sellable.

**`locations.html`** (987) — two store cards with hours and Google Maps
iframes, factory card, contact strip. No price, no form, no FAQ.

**`about.html`** (852) — story, what 100% eggless means, values, 6-milestone
timeline. All CTAs → `/order`.

**`blog/index.html`** (6,628) — 88% of the file is ~230 post cards plus a
sidebar search and 12 tag filters. No Blog/CollectionPage schema.

### Reusable site-wide tokens in `index.html`

`.font-display` (61), `.reveal` + delays (64–73), `#navbar` (76), `.nav-link`
(86–103), `.btn-hover-interactive` (110), **`.btn-cta` (129–153)**,
`.grain-bg::before` (261), `.section-label` (309–329), `.ham-bar` (338),
`#mobile-menu > a` (360–393), `.footer-nav-link` (438), `.cursor-card` /
`.cc-glow` (509).

### Reusable scripts in `index.html`

Navbar scroll 1713; `.reveal` observer 1720; tubelight nav 1731; photo lightbox
1903 (delegated, works anywhere); mobile menu 1953; Lenis 2000; `.cursor-card`
glow 2046; enquiry tracking 2068. **Tied to markup and not reusable:** skeleton
loader 822/866, pricing slider 1760, tooltip portal 1835, hero rotating quote
1877, hero viewport pin 1933.

### Dead code found

`.nav-wordmark` (119–127) — styled, no markup. `@keyframes testimonialScroll` /
`.t-track` / `.t-col*` (295–300) — the carousel was replaced by the static wall.

---

## The one change worth doing regardless of the restructure

Ungate `#sk-overlay` from `window.load` and lazy-load the three review photos.
It buys back 2–3 seconds on every page view, costs nothing, and has no
defensible downside. It is independent of the shop work.

---

## Where the parked work lives

| Branch | Commit | What |
|---|---|---|
| `build-your-cake` | `4fc6fdc` | The six-step custom-cake builder page, its gates and its browser test |
| `site-structure-experiments` | `af998a0` | The "Our Cakes" nav dropdown (`00acabe`) and the gallery "Start my order" CTA (`3a47815`) |

Recover either with `git cherry-pick <sha>`.
