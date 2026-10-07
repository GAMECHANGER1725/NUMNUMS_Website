# Shop Hormozi Conversion Audit — 2026-10

**Date:** 2026-10-06 · **Scope:** `/shop` board, `/shop/cakes/[slug]`, `/shop/cart`,
the Stripe handoff and the `/order` fork · **Source:** `shop-app/` → `shop/`
**Status:** Ship-now items built and pushed (`437d51d8`, `831a675d`), **not
published** (Netlify auto-publish is off). Everything under *Needs Vaidik* is
untouched.

Hormozi decides *what the page must say and do*. Baymard, 21st.dev and the two
chains decide *how it looks and behaves*. Neither overrides the locked rules in
`CLAUDE.md`: no invented claims, no was/now, no coupons, no delivery language,
Base UI only.

This does not re-propose anything in `plans/UI-conversion-audit-2026-09.md` or
`plans/Shop-First Restructure — parked 2026-09-14.md`. Where a finding there is
still open, it is referenced by its F-number.

---

## Vaidik's decisions, 2026-10-06 (round 2, built and pushed)

| Item | Decision | What was built |
|---|---|---|
| Dream outcome | **Rejected "No one will guess it's eggless"**: buyers want eggless for faith or diet, not to disguise it | H1 **"Pick any cake. It's eggless."** under "No asking, no checking." |
| V1 terms | "48 hours" is for custom cakes only | `terms.html`: shop cakes next day, custom two days' notice, 50% deposit, 24h deposit refund (`0c7e556c`) |
| V2 rating | Riverstone is 4.6; don't name the shop | `GOOGLE_RATING` = 4.6, linked to the Riverstone profile, no count shown (none was read) |
| V4 scarcity | "Make it 2 pickups left Saturday"; **then, 2026-10-07: "I don't want a cap"** | A fixed "2 left" was refused as invented scarcity; a live count of a daily cap was built (`04d58321`), then **removed** (it could never show without a cap). No scarcity claim remains on the shop. |
| V5 guarantee | Do it | `terms.html` §8 `#guarantee`: not what you ordered or not fresh, reported at the counter or within 24h with a photo, means remake or refund, your choice. In the board strip, beside Add to order, and on the `/` and `/order` chips. |
| V6 bonuses | Not now | — |
| V7 rows | Yes | Premium → Classics → Specialty |
| V8 pill | Yes | No empty-cart pill on `/shop/cakes/*` |
| V9 copy | No nuts in Butterscotch | "praline" → "crunchy butterscotch crumb" |
| V10 text | Email instead | Thank-you, Stripe after-submit, sign-up, terms §9, privacy policy |
| V3 reviews | Yes | Verbatim quotes on Butterscotch, Cookies & Cream, Mango, Pineapple |
| V11 homepage | Yes | "Just need a cake for tomorrow? Shop our 15 flavours →" under the hero buttons |

Risk flagged once and accepted: the 4.6 is Riverstone's, shown unlabelled
beside a Harris Park pickup option; scrapes put Harris Park at 4.1. The link to
the profile is what keeps it checkable.

---

## The frameworks used, from sources

- **Value Equation** (*$100M Offers*): value = (dream outcome × perceived
  likelihood) ÷ (time delay × effort and sacrifice). Hormozi's point is that the
  best businesses work the *bottom* of the fraction. [SuperSummary §3][ss],
  [Max Mednik's notes][mm]
- **Trim and stack**: list every obstacle, turn each into a solution, and present
  the stack against the price. [mm]
- **Scarcity** (supply, bonus, never-again) and **urgency** (deadlines, seasonal,
  opportunity decay) are both meant to be *real*: "three different types of
  scarcity in every offer without lying". [Shortform][sf]
- **Guarantees**: unconditional, conditional, anti ("all sales final"),
  implied. [mm], [Goodreads notes][gr]
- **MAGIC naming**: Magnet, Avatar, Goal, Interval, Container. [mm], [sf]
- **Core Four** (*$100M Leads*): warm/cold × one-to-one/one-to-many. This page
  is where all four channels end up. It does not generate leads, it converts
  them. [Shortform][sfl]

Benchmarks:
- **Baymard product page**: only 48% of desktop and 38% of mobile sites have
  decent product-page UX. **60% of users look for returns info on the product
  page**, 44% of sites don't show it, and 15% have abandoned a purchase over a
  return policy. 57% don't use buttons for size, and 81% don't show a price per
  unit. [Baymard][bm], [Baymard price-per-unit][bmu]
- **Bannos**: "from" price ranges, a size/servings chart as the second image, a
  delivery schedule with real cut-offs, weekend advance-ordering stated, no star
  ratings on cards, and a category-of-one line ("The only cake maker in Sydney
  that does both"). [bannos.com.au][bn]
- **The Cheesecake Shop**: Click & Collect only offers, and no per-product
  badges (already recorded in `badges.ts`). Their site refused a fetch (header
  overflow), so nothing new was taken from it.
- **ACCC / Bloomex**: a $1m penalty for star ratings that implied genuine
  customer feedback. [ACCC][accc]

21st.dev and Easy UI:
- **21st.dev** has product cards ([shadcnstore listing card][21a],
  [Card Studio][21b]) and a rating group ([anubra266][21c]). The listing card's
  core pattern is a **strikethrough original price**, which is refused here. The
  rating group is built on **Ark UI**, which would be a second primitives
  library, also refused. What was borrowed is the *structure*: price and verb on
  one line, and a facts block beside the CTA.
- **Easy UI** ([easyui.pro][eui]) has **no ecommerce templates** (Designfast,
  Docs, NextUI, Portfolio, Quotes, Retro, Template, Waitlist, Chatbot). Its only
  conversion patterns are a cost-comparison pricing calculator and a rotating
  testimonial carousel. Neither fits: we have no verified testimonials, and a
  carousel hides content on a phone.

---

## How the page scored (before), quoted from the screenshots

| # | Question | Before | What I saw |
|---|---|---|---|
| 1 | Dream outcome in 5s | **Weak** | H1 "Pick your cake", which names the chore. Eggless appears mid-sentence, not as the moat. The homepage's own line ("No one will guess it's eggless") was not used. |
| 2 | Perceived likelihood | **Unsafe** | The only proof was "★★★★★ 4.6 · 50+ Google reviews". It has no source in the repo, the 2026-09-02 GBP audit found Harris Park at **4.1 over 358–609 reviews**, and both stores carry the identical figure. |
| 3 | Time delay | **Vague** | "ready tomorrow" with no date, and the earliest real date shown only in the cart. |
| 4 | Effort | **OK** | 7 taps landing → Pay (card, Add, pill, shop, day, time, Pay), with 8" defaulted. The deposit was stated as "50%", a sum to work out. |
| 5 | Offer structure | **Price list** | The included things (writing piped, eggless, collection) sat in a strip *under* the board or not at all. |
| 6 | Risk reversal | **Hidden** | The 24h deposit refund first appeared in the cart. Nothing on the board or product page. |
| 7 | Price framing | **Bare** | Six chip prices with no per-serve figure. "From $39.99" was hardcoded in "Two ways to order". |
| 8 | CTA clarity | **Good** | One verb per card, a sticky Add bar on phones, a sticky Pay bar in the cart. The header "Order Now" pill on product pages still competes (F64). |
| 9 | Friction / leaks | **Some** | Size chips at 820px spilled "MOST ORDERED" and "$179.99" out of their boxes. "Weekends book out first" (board) and "four in five… book out" (cart) had no source. |
| 10 | Hick's law | **Good** | Three named rows, one default size, at most one badge per card. Chocolate (41%) sits in row 3 (F65). |

---

## Findings, ranked

Impact × effort is H/M/L each. **Evidence tier**: *sourced* means the
behaviour is documented in research; *hypothesis* means the lift is unmeasured.
No lift number below is a forecast.

### Ship now — built and pushed

| # | What I saw | Principle | Fix | Impact × effort | Evidence |
|---|---|---|---|---|---|
| S1 | Refund window invisible until the cart (`product-page.tsx` under-button text: "Pay 50% now… ready tomorrow") | **Risk reversal**: a conditional guarantee that already exists but wasn't presented | A three-line promise list beside Add to order: **Ready {date}** / **Pay $24.99 today, $25.00 when you collect** / **Plans change? Deposit back in full** (cancel 24h+ before). The board strip carries "Refundable deposit · until 24h before pickup". | H × L | **Sourced behaviour** (Baymard: 60% look for returns info on the PDP). Lift is a hypothesis. |
| S2 | H1 "Pick your cake" | **Value Equation, dream outcome** | H1 **"No one will guess it's eggless"**, the homepage hero's line, so the two pages agree | H × L | Hypothesis |
| S3 | "Ready tomorrow" with no date | **Time delay** | The intro names the real date ("Order today, collect **Wednesday 7 October**") from the same `minDueDate()` the cart calendar uses. It renders after mount, so the export never bakes in the build day. | M × L | Hypothesis |
| S4 | Unsourced "4.6 · 50+ reviews" on the board and all 15 PDPs | **Perceived likelihood** must rest on true proof | Removed. `GOOGLE_RATING` in `badges.ts` renders a *linked* rating once Vaidik fills in real figures. | H (risk) × L | **Sourced risk** (ACCC Bloomex $1m; repo GBP audit 4.1) |
| S5 | Included value scattered and below the board | **Trim and stack**, honest version: only what every order already gets | A four-item strip above the cakes: 100% eggless · Your words, piped (no extra charge) · Ready tomorrow · Refundable deposit. The duplicate strip at the bottom was deleted. | M × L | Hypothesis |
| S6 | "50%" as a percentage | **Effort**: make the customer do no maths | Dollars today and dollars at collection, via `depositCents` (floors exactly as the server does) | M × L | Hypothesis |
| S7 | No per-serve maths | **Price-to-value framing**; a bigger cake is cheaper per head, which is an honest upsell | "8″ works out at $3.57–$4.17 a serve", a range because servings are a range | M × L | **Sourced behaviour** (Baymard: 81–86% omit per-unit price, and users abandon over it) |
| S8 | "Weekends book out first" (board) and "four in five… book out first, worth locking in" (cart) | **Scarcity must be real**. Its only source was a code comment. The real figure is 74% Fri–Sat over 19 orders, and no cap is enforced. | Both removed | M (risk) × L | Sourced (repo) |
| S9 | "From $39.99" and "50%" typed into `page.tsx` | Repo rule: prices live only in `ops/catalog.mjs` | Computed from the catalogue and `DEPOSIT_RATE` | L × L | — |
| S10 | Size chips at 820px overflow | **Effort / friction** at the decision | Three across until `lg`, six from 1024px | L × L | Screenshot |

Measured: the board at 390px went from **2,991px to 2,825px** tall, even with
the strip added, because the duplicate bottom strip and the rating line went.

### Needs Vaidik's decision — not built

| # | Decision | Why it's yours | Recommendation |
|---|---|---|---|
| V1 | **`terms.html` contradicts the shop**: §2 "48 hours", §3 "paid in full", §4 "48 hours" refund. The cart says *"Paying confirms you accept our Terms"*, while the cart, Stripe's button and now the PDP say next day, 50% deposit, 24h refund. (F01, still open.) | Legal document | **Fix before live keys.** Change §2–4 to: next day for shop cakes, 2 days for custom; 50% deposit online, balance on collection; cancel more than 24h before collection and the deposit is refunded in full. |
| V2 | **The real Google rating**, per store, from the GBP dashboard, into `GOOGLE_RATING` (and correct `index.html` schema 4.6/50 too) | A product claim only the dashboard can settle | **Do it this week.** Proof is now the weakest term in the value equation on this page. A true 4.1 linked to Google beats an unverifiable 4.6. |
| V3 | **Verbatim reviews on PDPs** (F69): Butterscotch, Mango, Cookies & Cream and Pineapple quotes exist in `index.html` schema | Must be confirmed word for word against Google | Yes, once verified. One quote under the price, first name and initial. |
| V4 | **Real capacity scarcity**: "3 pickup slots left Saturday", computed from `MAX_WEB_ORDERS_PER_DAY` and the live order count | Needs a real daily cap from the kitchen, and scoping the gate to allow one component | **Yes**, this is Hormozi's scarcity done honestly. Set the cap with the chef first, because an invented cap is the same lie with extra steps. |
| V5 | **A written outcome guarantee**, e.g. "If it isn't what you ordered, we remake it or refund it" (conditional) | Cost and legal exposure: a remake is ingredients plus a baker's hour; once written it must be honoured as stated, on top of ACL remedies. The existing "Love it or we'll make it right" chip on `/` and `/order` has no terms behind it (F25). | Only if you name the concrete remedy and put it in `terms.html`. Otherwise drop the existing chip. |
| V6 | **Bonuses** (free candle, knife, upgraded box) | Unit cost and supply unknown | Skip unless under ~$1 a cake with reliable supply. Free piped writing is the honest bonus, and it now leads the stack. |
| V7 | **Classics row above Specialty** (F65): Chocolate is 41% of orders and sits ~1.4 screens down on a phone | Row order decided 2026-09-21 | Yes: Premium → Classics → Specialty. |
| V8 | **Hide the empty-cart "Order Now" pill on `/cakes/*`** (F64): on a PDP it sends the buyer back to the board | Navbar rule, both surfaces | Yes. |
| V9 | **Flavour copy** (F31): "the one people travel for" is still live on Rasmalai; "praline" on Butterscotch implies nuts | Food claims | Remove the unsourced anecdotes and confirm or remove "praline". |
| V10 | **"We text you the moment it's ready"** (F63): on thank-you, Stripe's page and sign-up, with no mechanism in ops | A promise about staff practice | Confirm staff do it every time, or reword to "We'll call or text if anything changes." |
| V11 | **Homepage → `/shop`** (F02): the biggest leak is upstream. Every Core Four channel lands on `/`, which has zero content links to the shop. | Single-fork rule | One text link under the hero CTAs. |

### Rejected, and why (logged so they are not proposed again)

| Idea | Source | Why not |
|---|---|---|
| Was/now strikethrough | 21st.dev shadcnstore listing card | No genuine prior price exists (checked 2026-09-21). ACL reference-pricing risk. |
| Value stack with dollar values beside each item ("writing — a $15 value, free") | Hormozi's stack presentation | The dollar values would be invented reference prices, the same ACL problem as was/now. The strip lists the inclusions without fake values. |
| Countdown to the midnight order deadline | Hormozi's "everyday urgency" | Technically true (`CUTOFF_HOUR = 24`), but the named date already carries the deadline and updates itself. A ticking clock adds anxiety, not information, and needs the urgency gate rescoped for no gain. |
| First-order discount / any code | Hormozi bonuses | Refused 2026-10-06, end to end. |
| Rating stars component | 21st.dev rating group | Ark UI is a second primitives library (Base UI only), and there is no verified rating to show yet. |
| Rotating testimonial carousel | Easy UI | No verified testimonials, and a carousel hides most of its content on a phone. |
| Rename "Signature Cakes" via MAGIC | Hormozi naming | Decided 2026-09-21. It is also the GA4 `item_category` key, so renaming splits the series. The H1 now carries the outcome instead. |
| Sticky CTA or quick-add on the board | Shopify-style sticky bars | A cake needs a size first. Baymard's most common list quick-add error, already recorded. |
| PayPal, delivery fee or delivery copy | — | Locked: unavailable to AU Stripe merchants, and the shop is pickup-only. |

---

## What to measure in GA4

The shop is not live yet (`noindex`, test keys), so **there is no baseline**:
the first live month *is* the baseline, and before/after attribution for these
changes is not possible. Treat these as the funnel to watch from day one, not
proof that the changes worked.

| Ratio | Events | Tests which change |
|---|---|---|
| Board → product | `view_item` sessions ÷ `/shop` page views | S2, S3, S5 (headline, date, strip) |
| Product → cart | `add_to_cart` ÷ `view_item` | S1, S6, S7 (promise list, dollars, per-serve) |
| Size mix | `add_to_cart` by `item_variant` | S7: does per-serve framing move orders up from 8″? |
| Cart → Stripe | `begin_checkout` ÷ sessions with `add_to_cart` | Cart honesty change (S8) and V1 |
| Stripe → paid | `purchase` ÷ `begin_checkout` | Terms consistency (V1) and the deposit |

At this volume (32 orders in the last order-book count) none of these will
reach statistical significance for months. Read them as direction, and
change one thing at a time.

---

## Sources

[ss]: https://www.supersummary.com/100m-offers/section-3-summary/
[mm]: https://www.maxmednik.com/blog/notes-on-100m-offers-by-alex-hormozi
[sf]: https://www.shortform.com/pdf/100m-offers-pdf-alex-hormozi
[gr]: https://www.goodreads.com/notes/58612786-100m-offers/46948487-carlos-ramos/f6d80069-3dc2-46bb-a050-22218a804c92
[sfl]: https://www.shortform.com/pdf/100m-leads-pdf-alex-hormozi
[bm]: https://baymard.com/blog/current-state-ecommerce-product-page-ux
[bmu]: https://baymard.com/blog/price-per-unit
[bn]: https://www.bannos.com.au/
[accc]: https://www.accc.gov.au/business/advertising-and-promotions/online-product-and-service-reviews
[21a]: https://21st.dev/@shadcnstore/components/product-card-1
[21b]: https://21st.dev/@clevision/components/card-studio/product-card
[21c]: https://21st.dev/@anubra266/components/rating-group/product-review-group
[eui]: https://www.easyui.pro/

- $100M Offers summaries: [SuperSummary][ss] · [Max Mednik][mm] · [Shortform][sf] · [Goodreads notes][gr]
- $100M Leads: [Shortform][sfl]
- Baymard: [Product page UX][bm] · [Price per unit][bmu]
- [Bannos](https://www.bannos.com.au/) · [ACCC online reviews][accc] · [ACCC Bloomex](https://www.accc.gov.au/media-release/bloomex-in-court-for-allegedly-misleading-online-advertising)
- 21st.dev: [listing card][21a] · [Card Studio][21b] · [rating group][21c] · [Easy UI][eui]
- Repo: `seo-baseline/2026-09-02/gbp-audit-harris-park.md` P3 · `plans/Five-Year Direction — 2026-2031.md` (74% Fri/Sat) · `shop-app/lib/badges.ts` `ORDER_BOOK`
