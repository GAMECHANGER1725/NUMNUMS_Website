# Five-Year Direction — 2026–2031

Written 2026-09-11. **Live strategy doc.** Replaces the retired Q4 2026 plan
(removed 2026-09-11; recoverable from repo git history if ever needed).

Area: [[Num Nums Bakery]]. Ops: [[Ops App]]. Prices: [[Pricing]].
Channels: [[Marketing History]]. Search: [[SEO & GEO Status]]. Web: [[Website]].

---

## THE DECISION

**Build cart + checkout. Decided 2026-09-11 by Vaidik. Not reopened.**

The order-book analysis in this document recommended a quote-only intake
instead. Vaidik weighed it and chose the checkout. The analysis stands as
**design input, not as a veto** — everything below is now about building a
checkout that reaches the A$102.86 custom order instead of only the A$58.75
list-price one.

**The build is a configurator, not a catalogue.** That single choice is what
makes the data's objection stop mattering.

A catalogue sells the six preset cakes on the list. A configurator sells
*size × flavour × design level × date*, takes a deposit, and hands the order to
the kitchen already structured. The first addresses 21% of the book. The second
addresses close to all of it — because a custom cake is not unpriceable, it is
just priced on more than one axis, and this shop is already pricing it that way
by hand at the counter.

---

## WHY A CONFIGURATOR CLEARS THE OBJECTION

The objection was: 79% of orders are custom at A$102.86, a cart transacts the
A$58.75 list product, so a cart sells the cheapest fifth of the business.

That is true of a catalogue. It is not true of a configurator, because **the
custom price is not random — it is structured, and the structure is visible in
the order book.**

Eight-inch cakes sold at A$55, 65, 70, 75, 75, 130, 140 against a A$49.99 list.
Ten-inch sold at A$74.99, 110, 120, 190 against a A$74.99 list. That is not
noise. That is base size price plus design work, and the spread is wide but
banded. Bands can be quoted. What cannot be quoted instantly is the top of the
range — the tiered showpiece — and that is precisely the segment that should
route to a human anyway.

So the checkout splits three ways:

| Route | What it is | Payment | Est. share of book |
|---|---|---|---|
| **Instant** | Normal cake — size, flavour, writing | Pay in full | ~21% |
| **Instant, price-confirmed** | Custom — size, flavour, design level, photo reference | **50% deposit**, final price confirmed within 4 hours | ~60% |
| **Enquiry** | Tiered, sculpted, showpiece | No payment. Staff quote it | ~19% |

**Middle row is the whole point.** It is the A$102.86 order, and today it
arrives as a WhatsApp message that a staff member re-types into ops. It becomes
a structured, deposit-paid, kitchen-ready record.

---

## THE EVIDENCE BEHIND THE DESIGN

Supabase `stnmoxsojqbbtgjwkzrc`, `orders`, read 2026-09-11.
**Window: 2026-09-07 → 09-11 — five days, n=19.** Above the n=10 bar [[Ops App]]
sets for a gross shape, **below it for any segment split**. The normal-cake AOV
rests on n=4. Re-read at 2026-09-30 before money moves against any of it.

### The mix

| | Orders | Share | AOV |
|---|---:|---:|---:|
| Custom | 15 | 79% | **A$102.86** |
| Normal | 4 | 21% | A$58.75 |
| **All** | **19** | | **A$93.05** |

A$1,674.98 net over five days, ~3.8 orders/day. Do not annualise — five days,
one weekend, cake pre-orders only, excludes counter sales of sweets and slices.
It is a floor on the business, not a measure of it.

### The weekend wall — the most important number for this build

Cakes by day due:

| Sun | Mon | Tue | Wed | Thu | **Fri** | **Sat** |
|---:|---:|---:|---:|---:|---:|---:|
| 2 | 1 | 0 | 1 | 1 | **5** | **9** |

**74% of the book is due Friday or Saturday.** Monday–Thursday carries three
cakes across four days.

This is the reason the **capacity gate is not optional and not v2**. A checkout
that will happily sell a twelfth Saturday cake when the chef tops out at nine
does not create revenue, it creates a late cake on a child's birthday, a refund,
and a one-star review. **The gate is the feature that makes the cart safe.**

It is also the largest asset on the table: Mon–Thu is paid-for idle capacity —
rent, chef and ovens are covered regardless. Anything schedulable into it is
close to pure contribution. The checkout should price that in (see Year 1).

### The rest

- **Every order is a pre-order.** `walk_in` false on all 19; lead time 27h–599h, median ~55h. Customers already book 2–3 days ahead, which is exactly the behaviour a checkout needs. **Confirm with Tarun this flag is genuinely being set** — it may just be an untouched checkbox, and it changes the date-picker defaults.
- **Deposits already happen** — 7 of 19 orders, A$369.99 held. The 50% deposit is formalising an existing habit, not introducing a new demand.
- **37% of orders carry no phone** (7 of 19). Every retention figure ops computes runs on 63% of the book. Meanwhile 3 of the 9 identifiable customers reordered inside five days. **Fix this before the build starts** — it is an afternoon, and the checkout will make phone mandatory anyway, so the two halves should match.
- **Riverstone carries the book**: 15 orders / A$1,254.98 vs Harris Park 4 / A$420.00. HP's AOV is *higher* (A$105.00, n=4) — if that holds, HP's problem is footfall, not basket.
- **Organic is thin**: ~22 clicks/day (GSC, 90d to 2026-09-02). The checkout must not be sized as a traffic-conversion play. **Its job is to convert intent that already arrives by phone, WhatsApp and Google** — including the 14 calls Meta bought at A$6.67 each.
- Zero cancellations. 15 of 19 carry design photos.

---

## SCOPE

### v1 — ship by 2026-12-20

**1. The configurator** (`/order` rebuilt — it is currently 8,788 words ending in five `wa.me` links)

- **Size** — from `catalog.mjs` `SIZES`. Real prices, one source, already build-gated by `verify.mjs`.
- **Flavour** — the 15 orderable flavours. Rasmalai and Ferrero Rocher carry their existing size-dependent surcharge.
- **Design level** — the new axis, and the thing that makes custom sellable:
  - *Simple* — writing and basic decoration. Base price.
  - *Themed* — character or theme, printed topper. Fixed uplift.
  - *Custom* — photo reference, 3D toppers, sculpted detail. Larger uplift, **price confirmed within 4 hours**.
  - *Tiered / showpiece* — **no price, routes to enquiry.** Reuses the existing `tierText`/`parseTiers` format so a quoted tiered cake lands in the same `size` column every screen and the invoice already print.
- **Pickup date + store** — gated against live capacity (below).
- **Photo upload**, multiple, writing `photo_paths` as a **list**. `orderPhotos()`, the print board and the invoice already read the list.
- **Phone required.** Non-negotiable, and matched by the same change in the ops form.

**2. The capacity gate** — the control that makes this safe

Checkout reads remaining slots per store per date against the measured ceiling
and **refuses to sell past it**. Saturday closes at the ceiling. Dates inside
the chef's lead time are unselectable.

> **Re-read the ceiling at 2026-09-30 on ~14 days of data before wiring the number in.**
> Today's best read is 9 cakes on Saturday 2026-09-12, off five days. Ask the
> chef his own number too and **use the lower of the two.**

**3. Payment** — Stripe Checkout, hosted page only

- Normal cake → pay in full. Custom → **50% deposit**.
- **Hosted page only. Card data never touches our origin.** No custom card fields, no stored cards, no saved payment methods. This keeps PCI scope at SAQ-A and it is not a preference.
- Order sits at a new `pending_payment` status and only becomes `placed` on the **Stripe webhook**, never on the browser redirect — a customer closing the tab after paying must still get their cake, and a customer who abandons must not.

**4. The price-confirmation window** — how custom stays honest

For *Custom* level, the quoted price is explicitly **subject to confirmation
within 4 hours**. Staff open it in ops and either confirm (proceeds) or adjust
(customer approves the difference, or is refunded in full). Disclosed before
payment, in the terms, in the confirmation email.

This is the mechanism that lets a bespoke product be sold through a checkout
without either underquoting the shop or misleading the customer.

**5. Ops integration** — no new tables

- `orders` gains a source field and the `pending_payment` / `enquiry` statuses.
- `order_events` already logs every insert and edit by AFTER trigger — the web trail records itself with no new call sites.
- `print_jobs`, baker queue, invoicing, analytics: **unchanged.** Web orders appear as ordinary orders with a source tag.
- `enquiry` and `pending_payment` are filtered out of `listToBake()`, takings and every figure in `stats.mjs`. **An unpaid enquiry must never reach the kitchen.**

### Explicitly out of v1

- Delivery. Pickup only, as today.
- Customer accounts, logins, saved addresses, order history.
- Sweets checkout — separate build, Year 2, gated on `/indian-sweet` demand improving (currently 3 clicks from 1,106 impressions).
- Automated pricing of tiered or sculpted work. A build is quoted by a person.
- Multi-item baskets beyond one cake plus add-ons.

---

## TIMELINE

### Pre-work — before any checkout code (do now)

1. **Phone required** on both ops order forms. An afternoon. Closes the 37% hole.
2. **Re-read the chef ceiling at 2026-09-30** on ~14 days. The gate needs a real number.
3. **Confirm `walk_in`** with Tarun — honest flag or untouched checkbox.
4. **COGS into `order_costs`** (still 0 rows). Without it there is no margin figure and no basis for a Mon–Thu incentive price.

### Build — 2026-09-29 → 2026-12-20

| Weeks | Ships |
|---|---|
| 1–2 | Schema: statuses, source field, RLS, analytics filters. Backend only |
| 3–5 | Configurator UI on `/order`. Size × flavour × design level, photo upload, phone required |
| 6–7 | Capacity gate — slots per store per date, read live, hard refusal past the ceiling |
| 8–9 | Stripe Checkout hosted page + **webhook** → `placed`. Deposit logic. CSP entries |
| 10 | Price-confirmation flow in ops. Terms written and read by Tarun |
| 11 | Enquiry route for tiered/showpiece |
| 12 | Hardening: abandoned carts, refunds, failure paths, phone testing |

**Done means:** a customer configures a cake on the website, pays a deposit, and
it appears in the baker's queue with photos attached — no WhatsApp message
anywhere in the chain, and the checkout refuses to oversell Saturday.

### One year — 2027-09

- Majority of orders originate as structured records. WhatsApp is support, not intake.
- **Mon–Thu incentive live** — the checkout prices midweek pickup below weekend, turning the idle four days into bookable capacity. This is the highest-margin move available and it only becomes possible once COGS exists.
- Repeat rate measured on ~100% phone coverage; loyalty decision made on real data.
- Harris Park has a named cause and a decision: fix, reposition, or close.
- Sweets checkout decided on `/indian-sweet` evidence.

### Five years — 2031

The compounding asset is **the order book plus the operating system around it** —
ops, checkout, quoting, print jobs, invoicing, analytics. It is the only genuinely
transferable part of this business.

1. **Multi-site on one system (best supported).** 3–5 locations where opening store N is configuration, not a rebuild. Everything is already store-scoped by RLS. **Hard gate: no store 3 until Harris Park is diagnosed and fixed or closed.**
2. **B2B / Mon–Thu as a real second line (well supported).** Venues, corporates and caterers on standing orders, sold into the weekday hole. Contract revenue is flatter and more forecastable than weekend retail — which is what makes site 3 financeable.
3. **Licensing the operating system (speculative — flagged as such).** Every eggless bakery in Sydney runs on WhatsApp and a paper diary. A real observation, not a validated business. Spend nothing on it before end state 1 is proven across three sites.

**"Done" in 2031:** the business can open a location without Vaidik rebuilding
anything, can forecast Mon–Thu revenue from contracts, and knows its margin per
cake to the cent.

---

## RISKS AND CONTROLS

| Risk | Why it bites | Control |
|---|---|---|
| **Overselling the weekend** | The top risk of this build. 74% of orders land Fri/Sat against an unconfirmed ceiling. Sells a cake that cannot be baked | **Capacity gate, hard refusal.** Ceiling re-read on 14 days, cross-checked with the chef, lower number wins |
| **PCI scope** | Touching a card number pulls the business into PCI-DSS | **Stripe hosted Checkout only.** SAQ-A. No card fields on our origin, ever |
| **Service-role key exposure** | A key that bypasses RLS would expose every customer record | Server-side Netlify Function only, own env var. **Never in `ops/`, never client-side.** The publishable key stays the only key the browser sees |
| **Paid but no order** | Browser-redirect confirmation loses orders when a tab closes | Status advances on **Stripe webhook**, not redirect. Reconciliation check for paid-without-order |
| **Custom price disputes** | A bespoke cake quoted by a form can be wrong in either direction | 4-hour confirmation window, disclosed pre-payment. Adjust with customer approval, or full refund |
| **Refunds on bespoke goods (ACL)** | A custom cake is not change-of-mind returnable, but a defective one is. Taking money online creates a written contract where none existed | Deposit terms written, shown before payment, **read by Tarun**. Same standard as the tax-invoice work in [[Ops App]] |
| **`order_costs` empty** | No margin figure, so no basis for a Mon–Thu discount | Fix in pre-work. **No midweek incentive pricing until COGS exists** |
| **Building instead of selling** | The documented pattern: 138 commits in 30 days against zero closed real-world loops | Pre-work items are phone calls and readings, not code, and they gate the build |

---

## SUCCESS METRICS

All read from what [[Ops App]] already computes.

### 30 days from launch

| Metric | Working | Failing |
|---|---|---|
| Web orders / week | ≥10 | <3 |
| Checkout completion (started → paid) | ≥40% | <15% |
| Custom share of web orders | **≥50%** | <20% — the configurator is not reaching the real product |
| Phone coverage, all orders | ≥95% | <80% |
| Price confirmations needing adjustment | <25% | >50% — the design bands are wrong |

### The 90-day number

**Share of all orders entering as a structured record rather than a retyped
WhatsApp message.** Working ≥40%. Failing <15% — in which case stop extending
the checkout and put the hours into Mon–Thu B2B, where the buyer is a venue
manager with a purchase order rather than a parent with a phone.

### The counter-metric

**Late or missed cakes on Fri/Sat.** Baseline zero (19 orders, 0 cancelled). If
this is anything but zero at 90 days the capacity gate has failed and the
checkout gets throttled the same day. Growth that produces a late birthday cake
costs more than it earns.

### The one-year number

**Mon–Thu cakes as a share of Fri–Sat cakes.** Today 3 vs 14 = **21%**. Target
40–60%. This is the number that says whether the business broke its weekend
dependency — and it is the number that decides whether a third location is
fundable.

---

## WHAT I COULD NOT VERIFY

| Gap | Why it matters | Cheapest check |
|---|---|---|
| **n=19 over 5 days** | Everything here | Re-read 2026-09-30 |
| **Normal AOV on n=4** | Sizes the instant-checkout segment | Re-read at n≥10 |
| **`walk_in` false on all 19** | Date-picker defaults, and whether this is truly a booking business | Ask Tarun, 5 min |
| **Chef ceiling — 9 on Saturday** | The capacity gate's actual number | 14 days of data + the chef's own estimate, lower wins |
| **60% gross margin** [UNVERIFIED] | Every contribution figure and any midweek discount | `order_costs` |
| **Design-level bands** | Whether custom can be quoted instantly at all | Price the last 20 custom orders against draft bands before building |
| **Customers will use a form at all** | The behavioural bet | The 90-day metric is designed to kill it if wrong |

---

## STANDING RULES

- **No store 3** before Harris Park is diagnosed.
- **No third-party delivery** (UberEats/DoorDash) — 25–35% commission on a A$93 order is A$23–33/cake, roughly the whole margin, and decorated cakes travel badly.
- **No loyalty programme** until repeat rate is measured on full phone coverage.
- **No re-litigating `/review` gating.** Decided, owner-carried.
- **No new URLs** before the 2026-10-06 SEO checkpoint.

---

Related: [[Num Nums Bakery]] · [[Ops App]] · [[Marketing History]] ·
[[SEO & GEO Status]] · [[Website]] · [[Pricing]] · [[Yum Yum Wholesale]] ·
[[Wholesale Outreach — Kids Party Venues]]
