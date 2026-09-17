# Five-Year Direction — 2026–2031

Written 2026-09-11, revised the same day after external research.
**Live strategy doc.** Replaces the retired Q4 2026 plan (removed 2026-09-11;
recoverable from repo git history).

Area: [[Num Nums Bakery]]. Ops: [[Ops App]]. Prices: [[Pricing]].
Channels: [[Marketing History]]. Search: [[SEO & GEO Status]]. Web: [[Website]].

---

## THE DECISION

**Build cart + checkout. Decided 2026-09-11 by Vaidik. Not reopened.**

What the research changes is *how*, and two findings changed it materially:

1. **WhatsApp stays.** Indian merchants push **60–90% of order volume through WhatsApp**, and it is the dominant channel among Indian, Chinese, Lebanese, Vietnamese, Filipino and Pacific Islander Australians. An earlier draft of this plan had "no WhatsApp anywhere in the chain" as the definition of done. That was wrong, and it would have cost orders. WhatsApp becomes the **fallback and the confirmation channel**, not the thing being removed.
2. **The deposit must be a real charge, not a card hold.** Stripe authorisations expire in **7 days**. Your lead times run to **599 hours (25 days)**. A hold-and-capture design silently releases the money before the cake is baked.

**The build is a configurator with three exits, not a catalogue.**

---

## WHAT THE RESEARCH FOUND

### 1. Every Sydney competitor splits the funnel. None of them does it well.

| Competitor | Standard cakes | Custom cakes |
|---|---|---|
| **Cakemania** | External ordering platform (`cakemania.websiteorders.com.au`) | "Get Quote" form |
| **JK Cake Designs** | — (no retail shopfront) | Enquiry only. No prices published. Image upload, budget field, "WE DO NOT OPERATE ON SUNDAYS" |
| **Zest Patisserie** | Cart, products A$4–190, custom "from A$67.50" | "Get in touch with your idea" |

The three-route split is not an invention — **it is what the market already does**.
But all three make custom a dead end: a form, no price signal, no payment, no
date certainty. The customer types their hopes into a box and waits.

**That is the gap.** Not "should we split the funnel" — everyone splits it — but
*what happens on the custom side of the split.* Ours is going to quote a price,
hold a date, and take a deposit while the competitor's is still an unanswered
email.

### 2. The benchmarks say a bakery checkout is a good bet — if it is short

- **Food & beverage converts at 2.6%–6.02%**, among the best of any category. Bakery specifically: **4.5% desktop, 3.2% mobile**.
- **42% of bakery customers repeat within 90 days.** Your own book already hints at this — 3 of the 9 identifiable customers reordered inside five days.
- **Average cart abandonment is 70.22%.** The documented causes are all design choices, not bad luck:

| Cause | Share | What it forces on us |
|---|---:|---|
| Unexpected extra costs at checkout | **39%** | Price visible and updating at **every** configurator step. No surprises at the end |
| Forced account creation | **19%** | **Guest checkout. No accounts in v1.** Not negotiable |
| Checkout too long / complicated | **18%** | Four steps, one page each, phone-first |
| Preferred payment method missing | **10%** | Cards + Apple Pay + Google Pay from day one |

### 3. A 50% deposit is both the industry standard *and* what you already charge

Industry practice: **50% non-refundable at booking is standard** for custom and
wedding cakes, because the date is reserved and other work declined. Smaller
cakes often take a flat A$25–50 booking fee. New businesses are advised to use
30–40% to lower the barrier.

**You are already at 50%.** The seven deposits in the book run 46%, 50%, 50%,
52.6%, 53%, 54.5% and 100% of order value. So the checkout is formalising an
existing habit at an already-correct number — not introducing a new demand and
not guessing at a rate.

**Australian Consumer Law**, the part that matters: a non-refundable deposit is
lawful *if* it is reasonable and **proportionate to actual loss**, and the terms
are **clear, upfront and fair**. An excessive one is an unfair contract term. It
must be disclosed **before** the customer transacts, or it risks being
misleading conduct. Nothing in a policy can override statutory rights when goods
are faulty or not supplied.

→ So: 50% deposit, disclosed on the page before payment, with a written
cancellation scale tied to real cost (ingredients bought, date blocked). **Tarun
reads it before it goes live.**

### 4. Capacity limiting is table stakes, not a clever idea

Every bakery ordering platform ships it — Orderable, BakeSmart, Bakeshop, Vev,
FoodStorm. The standard feature set is: **max orders per day or slot, minimum
lead time, blackout dates, same-day cutoff time, and a cap on how far ahead
customers can book.**

That is the exact list our gate needs. It is what the software category
considers baseline, which means a checkout without it is below market, not
merely risky — and with **74% of your cakes due Friday or Saturday**, it is the
difference between selling capacity and overselling it.

### 5. The configurator pattern is proven for made-to-order

FoodStorm — whose product is literally custom-cake bakery ordering — splits
made-to-order items into **bases, frosting, filling and inscription**, with
**dynamic pricing as the item is built** "providing pricing transparency to
customers."

Configurators are documented to **reduce returns by up to 40%**, raise average
order value through options added during configuration, and create ownership
through the build process. 76% of consumers say they will pay more for a
personalised product.

This is the mechanism that lets us sell the A$102.86 cake instead of the
A$49.99 one — and it is the same mechanism that makes the price feel earned
rather than surprising.

### 6. WhatsApp is the channel, not the legacy

The finding that changed the plan. WhatsApp is **dominant among Indian-Australian
communities**, and Indian merchants run **60–90% of order volume** through it —
in contrast to Western businesses that use it only for support.

Your customer base is Harris Park and Riverstone. **Removing WhatsApp would be
removing the front door your customers actually use.** The checkout has to earn
its share, not be handed it by demolishing the alternative.

### 7. Payments — what Australians actually use

- Cards dominate, then PayPal, Apple Pay, Google Pay, Afterpay. Digital wallets are now default: **500M+ transactions worth A$20bn+ in a single month (2024)**.
- **BNPL: more than 1 in 3 Australians**, 43% growth, A$20bn+/year.
- **Stripe AU: 1.75% + A$0.30** domestic cards, plus GST. Wallets included, **no surcharge to enable**.
- **Afterpay ≈ 6% + A$0.30.** On a A$93 cake that is **A$5.88 versus A$1.93** on card.

→ Cards + Apple Pay + Google Pay at launch. **Afterpay deferred** — the fee is
triple, and on a ~A$46 deposit the customer is not reaching for instalments.
Revisit only if payment-step abandonment shows up in the data.

### 8. Google gives away the distribution

Google Business Profile supports a free **"Order online" button** on Search and
Maps, linking to your own ordering tool. [[Marketing History]] already calls GBP
"the fastest win, treated as more important than the website." This is the
cheapest customer acquisition available and it costs one link.

### 9. The five-year tailwind is demographic, not market

- Australia's cake market: **A$1.43bn (2025) → A$1.93bn (2035)**, CAGR **3.03%**. The tide is slow.
- Indian-born population of Australia: **916,330 (June 2024) → over 1M in 2026 → 1.7M by 2041.** Now the **largest migrant group in Australia**, having overtaken England. Grew ~522,000 since 2015.
- **Parramatta**: Indian-born is the largest overseas-born group at **8.2%**, and **most are aged 20–40** — precisely the birthday, wedding, baby-shower and first-birthday years.

**Read that together: the market grows 3% a year, and the customer base sitting
on top of Harris Park grows several times faster.** Growth comes from owning a
fast-growing niche, not from riding the category. 100% eggless is not a
constraint on the addressable market — for a large and rapidly growing share of
that suburb it is the entry requirement, and it is the reason a national chain
cannot take this customer.

### 10. Midweek pre-orders are a proven fix for exactly your problem

A bakery running pre-order bundles (Flour & Field) lifted **Tuesday–Thursday
daily revenue by 61%**, with 94% sell-through per batch. Your Mon–Thu carries
**3 cakes across four days** against 14 on Fri–Sat. Same problem, documented fix.

---

## WHAT I'VE CHOSEN, AND WHY

**A four-step configurator, three exits, one deposit rule, and a hard capacity gate.**

| Route | Trigger | Payment | Est. share |
|---|---|---|---|
| **Instant** | Normal cake — size, flavour, writing | **Pay in full** | ~21% |
| **Deposit** | Custom — + design level + photo | **50% now**, balance on pickup, price confirmed within 4 hrs | ~60% |
| **Enquiry** | Tiered, sculpted, showpiece, or >A$300 | **Nothing.** Staff quote it | ~19% |

**Why this and not the alternatives:**

- **Not a plain catalogue** — it transacts the A$58.75 product and anchors customers to a A$49.99 list price the shop routinely beats. It would sell your cheapest fifth.
- **Not enquiry-only** (what all three Sydney competitors do) — it leaves money and certainty on the table, and it is precisely where their funnels leak. Being the only one in the suburb that answers with a price and a locked date is the competitive position.
- **Not a third-party platform** (Orderable, BakeSmart, FoodStorm) — every one of them is a monthly fee for a system that would sit *beside* the ops app rather than inside it, duplicating the order table, the print jobs and the invoicing you already own. **The backend is already built.** This is a front door onto it, not a second system.
- **Not delivery, not Afterpay, not accounts in v1** — each adds cost or friction against a documented abandonment cause, and none is load-bearing.

**Why the configurator specifically:** it is the only structure that prices a
bespoke product without a human in the loop, and it does so by making the price
*build visibly* rather than land at the end — which is the single largest
documented cause of abandonment at 39%.

---

## SCOPE

### v1 — ship by 2026-12-20

**1. The configurator** — rebuilds `/order`, currently 8,788 words ending in five `wa.me` links

Four steps, one screen each, **running price visible from step one**:

1. **Size** — from `catalog.mjs` `SIZES`, real prices, one source, build-gated by `verify.mjs`.
2. **Flavour** — the 15 orderable flavours; Rasmalai and Ferrero Rocher carry their existing surcharge.
3. **Design level** — the axis that makes custom sellable:
   - *Simple* — writing, basic decoration. Base price.
   - *Themed* — character or theme, printed topper. Fixed uplift.
   - *Custom* — photo reference, 3D toppers, sculpted. Larger uplift, **price confirmed within 4 hours**.
   - *Tiered / showpiece* — no price, **routes to enquiry**. Reuses `tierText`/`parseTiers` so a quoted tiered cake lands in the same `size` column every screen and the invoice already print.
4. **Date + store** — gated against live capacity.

Plus: **multiple photo upload** writing `photo_paths` as a **list** (`orderPhotos()`, the print board and the invoice already read the list), and **phone required**.

**Guest checkout. No accounts.** 19% of abandonment is forced account creation.

**2. The capacity gate** — the control that makes this safe

Reads remaining slots per store per date and **refuses to sell past the ceiling**.
Minimum lead time, blackout dates, same-day cutoff, and a cap on how far ahead —
the standard feature set every bakery platform ships.

> **Re-read the ceiling at 2026-09-30 on ~14 days before wiring the number in.**
> Best current read is 9 cakes on Saturday 2026-09-12, off five days. Ask the
> chef his own number and **use the lower of the two.**

**3. Payment** — Stripe Checkout, hosted page

- **Cards + Apple Pay + Google Pay.** No Afterpay in v1.
- **The deposit is a charge, not a hold** — authorisations die at 7 days and cakes are booked up to 25 days out.
- **Hosted page only.** Card data never touches our origin; PCI scope stays SAQ-A.
- Order sits at `pending_payment` and becomes `placed` **on the Stripe webhook**, never on the browser redirect — a customer who closes the tab after paying must still get their cake.

**4. The price-confirmation window**

*Custom* level quotes are **subject to confirmation within 4 hours**, disclosed
before payment. Staff confirm in ops, or adjust with the customer's approval, or
refund in full. This is what lets a bespoke product sell through a checkout
without either underquoting the shop or misleading the buyer.

**5. WhatsApp, deliberately kept**

- A **"Prefer WhatsApp?"** link on every configurator step, pre-filled with the configuration so far. It is a completion path, not an escape hatch — and it is measurable.
- **Order confirmation sent over WhatsApp**, not only email.
- Any enquiry can be continued in WhatsApp by staff. The thread is where this customer base is comfortable.

**6. GBP "Order online" button** — free distribution, one link, done at launch.

**7. Ops integration — no new tables**

`orders` gains a source field plus `pending_payment` and `enquiry` statuses.
`order_events` already logs every insert and edit by AFTER trigger, so the web
trail records itself. `print_jobs`, baker queue, invoicing and analytics
unchanged. **`enquiry` and `pending_payment` are filtered out of `listToBake()`,
takings and every `stats.mjs` figure — an unpaid enquiry must never reach the
kitchen.**

### Explicitly out of v1

Delivery. Accounts and saved cards. Afterpay. Sweets checkout (Year 2, gated on
`/indian-sweet` demand — currently 3 clicks from 1,106 impressions). Automated
pricing of tiered work. Multi-item baskets beyond one cake plus add-ons.

---

## TIMELINE

### Pre-work — before checkout code

1. **Phone required** on both ops order forms. An afternoon. Closes the 37% hole.
2. **Re-read the chef ceiling 2026-09-30** on ~14 days.
3. **Confirm `walk_in`** with Tarun — honest flag or untouched checkbox.
4. **COGS into `order_costs`** (0 rows). No margin figure and no midweek pricing without it.
5. **Price the last 20 custom orders against draft design bands.** If the bands do not reproduce what was actually charged, the configurator is mispriced before it ships.

### Build — 2026-09-29 → 2026-12-20

| Weeks | Ships |
|---|---|
| 1–2 | Schema: statuses, source field, RLS, analytics filters |
| 3–5 | Configurator UI, running price, photo upload, phone required, WhatsApp fallback link |
| 6–7 | Capacity gate — slots, lead time, blackout dates, cutoff |
| 8–9 | Stripe hosted Checkout + **webhook** → `placed`. Deposit. CSP entries |
| 10 | Price-confirmation flow in ops. Deposit + cancellation terms, **read by Tarun** |
| 11 | Enquiry route. GBP "Order online" link |
| 12 | Hardening: abandoned carts, refunds, failure paths, **tested on a real phone** |

**Done means:** a customer configures a cake, sees the price build as they go,
pays a deposit, and it lands in the baker's queue with photos attached — and the
checkout refuses to oversell Saturday.

### One year — 2027-09

- Web is a **real share** of orders, WhatsApp still healthy, total orders up. (The target is not "WhatsApp reaches zero".)
- **Mon–Thu pre-order bundles live** — the Flour & Field pattern, +61% midweek is the documented precedent. Only possible once COGS exists.
- Repeat rate measured on ~100% phone coverage against the 42% bakery benchmark; loyalty decision made on real data.
- Harris Park has a named cause and a decision: fix, reposition, or close.

### Five years — 2031

The compounding asset is **the order book plus the operating system around it**.
It is the only genuinely transferable part of this business.

1. **Multi-site on one system (best supported).** 3–5 locations where opening store N is configuration, not a rebuild — everything is already store-scoped by RLS. Sitting on a customer base growing toward **1.7M Indian-born Australians by 2041**, concentrated in exactly these suburbs. **Hard gate: no store 3 until Harris Park is diagnosed and fixed or closed.**
2. **B2B / Mon–Thu as a second line (well supported).** Venues, corporates and caterers sold into the weekday hole. Contract revenue is flatter and more forecastable than weekend retail — which is what makes site 3 financeable.
3. **Licensing the operating system (speculative — flagged as such).** Every eggless bakery in Sydney runs on WhatsApp and a paper diary. A real observation, not a validated business. Spend nothing before end state 1 is proven across three sites.

**"Done" in 2031:** the business can open a location without Vaidik rebuilding
anything, forecasts Mon–Thu revenue from contracts, and knows its margin per cake
to the cent.

---

## RISKS AND CONTROLS

| Risk | Why it bites | Control |
|---|---|---|
| **Overselling the weekend** | 74% of orders land Fri/Sat against an unconfirmed ceiling | **Capacity gate, hard refusal.** Ceiling on 14 days, cross-checked with the chef, lower wins |
| **Deposit released before the bake** | Stripe auth holds expire at **7 days**; bookings run to 25 days | **Charge, never hold.** No manual capture |
| **Paid but no order** | Tab closed after payment loses the order | Status advances on **webhook**, not redirect. Reconciliation for paid-without-order |
| **Surprise price at checkout** | The #1 documented abandonment cause at 39% | Running price from step one. Deposit amount stated before the Stripe redirect |
| **Killing the WhatsApp channel** | 60–90% of order volume in comparable markets runs through it | WhatsApp fallback on every step, WhatsApp confirmations. **Web share is the target, not WhatsApp zero** |
| **Custom price disputes** | A bespoke cake quoted by a form can be wrong either way | 4-hour confirmation window, disclosed pre-payment |
| **ACL / unfair terms** | An excessive or hidden non-refundable deposit is an unfair contract term and possibly misleading conduct | 50% (industry standard, and already your rate), **disclosed before payment**, cancellation scale tied to real cost, **read by Tarun** |
| **PCI scope** | Touching card data pulls the business into PCI-DSS | Stripe hosted Checkout. SAQ-A |
| **Service-role key exposure** | A key bypassing RLS exposes every customer record | Server-side Netlify Function only, own env var. **Never in `ops/`, never client-side** |
| **`order_costs` empty** | No margin, so no basis for midweek pricing | Pre-work. **No midweek discount until COGS exists** |
| **Building instead of selling** | The documented pattern — 138 commits in 30 days against zero closed real-world loops | Pre-work is phone calls and readings, not code, and it gates the build |

---

## SUCCESS METRICS

### 30 days from launch

| Metric | Working | Failing | Benchmark |
|---|---|---|---|
| Checkout completion (started → paid) | ≥40% | <15% | 70.22% abandonment is average |
| Session → order conversion | ≥3% | <1% | Bakery 4.5% desktop / 3.2% mobile |
| **Custom share of web orders** | **≥50%** | <20% | The configurator is failing to reach the real product |
| Web orders / week | ≥10 | <3 | — |
| Phone coverage, all orders | ≥95% | <80% | — |
| Price confirmations needing adjustment | <25% | >50% | Design bands are wrong |

### The 90-day number

**Total orders per week, versus the 3.8/day baseline** — not "web share".
Working: total up **≥20%** with WhatsApp volume intact. Failing: total flat,
web orders merely cannibalising WhatsApp. That second outcome means the checkout
added friction to an existing channel instead of opening a new one — and the
response is to stop extending it and put the hours into **Mon–Thu B2B**, where
the buyer is a venue manager with a purchase order, not a parent with a phone.

### The counter-metric

**Late or missed cakes on Fri/Sat.** Baseline zero (19 orders, 0 cancelled).
Anything but zero at 90 days means the capacity gate failed, and the checkout
gets throttled that day. Growth that produces a late birthday cake costs more
than it earns.

### The one-year number

**Mon–Thu cakes as a share of Fri–Sat.** Today 3 vs 14 = **21%**. Target 40–60%
— the Flour & Field precedent is +61% midweek revenue. This is the number that
says whether the business broke its weekend dependency, and it decides whether a
third location is fundable.

---

## WHAT I COULD NOT VERIFY

| Gap | Why it matters | Cheapest check |
|---|---|---|
| **n=19 over 5 days** | Every internal figure here | Re-read 2026-09-30 |
| **Normal-cake AOV on n=4** | Sizes the instant-checkout segment | Re-read at n≥10 |
| **Design-level bands** | Whether custom can be quoted instantly at all | Price the last 20 custom orders against draft bands **before building** |
| **Chef ceiling — 9 on Saturday** | The gate's actual number | 14 days + the chef's own estimate, lower wins |
| **`walk_in` false on all 19** | Date-picker defaults | Ask Tarun, 5 min |
| **60% gross margin** [UNVERIFIED] | Every contribution figure and midweek pricing | `order_costs` |
| **WhatsApp share for *this* shop** | The 60–90% figure is for Indian SMBs generally, not measured here | Count a week of WhatsApp order messages before launch, so there is a before-picture |
| **Competitor conversion** | Nobody publishes it | Not knowable. Their *funnel design* is observable and that is what was used |

---

## STANDING RULES

- **No store 3** before Harris Park is diagnosed.
- **No third-party delivery** — 25–35% commission on a A$93 order is A$23–33/cake, roughly the whole margin, and decorated cakes travel badly.
- **No loyalty programme** until repeat rate is measured on full phone coverage.
- **No re-litigating `/review` gating.** Decided, owner-carried.
- **No new URLs** before the 2026-10-06 SEO checkpoint.

---

## SOURCES

Competitors: [Cakemania](https://www.cakemania.com.au/) ·
[JK Cake Designs](https://jkcakedesigns.com.au/) ·
[Zest Patisserie](https://www.zestpatisserie.com.au/custom-cake-delivery-sydney)
Benchmarks: [Baymard cart abandonment](https://baymard.com/lists/cart-abandonment-rate) ·
[Ecommerce CR by industry](https://www.skailama.com/blog/ecommerce-conversion-rate-by-industry) ·
[Bakery marketing benchmarks](https://cufinder.io/blog/benchmarks/bakeries/)
Deposits & law: [BakeProfit deposits](https://bakeprofit.com/blog/how-to-take-deposits-for-custom-cake-orders) ·
[Sprintlaw non-refundable deposits](https://sprintlaw.com.au/articles/non-refundable-deposits-are-they-legal-in-australia-business-guide/) ·
[ACCC repair/replace/refund](https://www.accc.gov.au/consumers/problem-with-a-product-or-service-you-bought/repair-replace-refund-cancel)
Platforms: [FoodStorm custom cakes](https://www.foodstorm.com/use-cases/custom-cakes-bakery-ordering) ·
[Orderable](https://orderable.com/online-bakery-ordering-system/) · [BakeSmart](https://bakesmart.com/)
Payments: [Stripe AU payment methods](https://stripe.com/resources/more/payment-methods-in-australia) ·
[Stripe holds expire](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method) ·
[Stripe AU fees](https://wise.com/au/blog/stripe-fees)
Channel: [WhatsApp commerce, Indian SMBs](https://www.zyfoo.tech/whatsapp-commerce-india-smb/) ·
[WhatsApp marketing Australia](https://chatdaddy.tech/blog/whatsapp-marketing-australia)
Distribution: [Order with Google](https://support.google.com/business/answer/10918858?hl=en)
Market: [Indians in Parramatta (.id)](https://www.id.com.au/insights/articles/the-story-of-culturally-diverse-communities-indians-in-parramatta/) ·
[Australia cake market](https://www.expertmarketresearch.com/reports/australia-cake-market)
Midweek: [Made-to-order bakery playbook](https://businessplan-templates.com/blogs/profits/made-to-order-bakery)

---

Related: [[Num Nums Bakery]] · [[Ops App]] · [[Marketing History]] ·
[[SEO & GEO Status]] · [[Website]] · [[Pricing]] · [[Yum Yum Wholesale]] ·
[[Wholesale Outreach — Kids Party Venues]]
