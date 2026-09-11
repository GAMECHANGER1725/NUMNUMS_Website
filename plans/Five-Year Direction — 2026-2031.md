# Five-Year Direction — 2026–2031

Written 2026-09-11. **Sits above [[Next Big Project — 2026 Q4]], does not replace it.**
The Q4 plan governs 2026-09-07 → 2026-12-05 and remains in force; this document
answers the longer question it deliberately did not ask — what is being built
over five years, and what the next major build should be once the Q4 measurement
work closes out.

Area overview: [[Num Nums Bakery]]. Ops: [[Ops App]]. Prices: [[Pricing]].
Channels: [[Marketing History]]. Search: [[SEO & GEO Status]]. Web: [[Website]].

---

## THE RECOMMENDATION

**Do not build a cart-and-checkout store. Build the custom-cake quote pipeline:
a structured design intake on the website that produces a priced quote and takes
a deposit, writing straight into the `orders` table the ops app already runs on.**

The order book opened on 2026-09-07 and has 19 orders in it as at 2026-09-11.
It says the thing a cart is designed to sell is the *cheapest and rarest* thing
this bakery sells:

| | Orders | Share | AOV |
|---|---:|---:|---:|
| **Custom** (design, consultation, photo brief) | 15 | **79%** | **A$102.86** |
| **Normal** (pick a flavour and a size off the list) | 4 | 21% | A$58.75 |

A cart with instant checkout serves the bottom row. It addresses 21% of orders at
57% of the average value — and it does so by competing with a A$49.99 list price
that the shop already routinely beats. Eight-inch cakes in the book sold at
A$55, A$65, A$70, A$75, A$75, A$130 and A$140 against a A$49.99 list price. **The
list price is not what this business charges. Design work is.** A checkout that
transacts the list price is a checkout that sells the least profitable version of
the product, and anchors the customer to it on the way in.

The A$102.86 order does not need a cart. It needs the thing that currently happens
over WhatsApp — what are you after, what date, send me a photo, here's the price,
pay a deposit — turned into a structured form that arrives in the ops app already
typed. `order.html` today is 8,788 words that terminate in **five `wa.me` links**.
The ops app removed WhatsApp from the *inside* of this business and left it
standing as the entire front door.

**One line: ops digitised the kitchen; the next build digitises the counter
conversation — and the counter conversation is worth A$102.86, not A$49.99.**

---

## WHY — the evidence, and what it cost to get

All order figures: Supabase `stnmoxsojqbbtgjwkzrc`, `orders` table, read
2026-09-11. **Window is 2026-09-07 → 2026-09-11 — five days, n=19.** That is
above the n=10 threshold [[Ops App]] sets for a gross shape and **below it for
any segment split**; the normal-cake AOV rests on n=4 and is marked accordingly.
Every figure here should be re-read at 2026-09-30 before money moves against it.

### 1. The order book exists now, and it moved three of the Q4 plan's guesses

[[Next Big Project — 2026 Q4]] listed its own biggest unknowns. Two are now answered:

| Q4 plan's guess | Actual | Effect |
|---|---|---|
| AOV **A$60–75** [INFERRED from list prices] | **A$93.05** | Every revenue estimate in the Q4 candidate table is **24–55% low** |
| Chef ceiling **unmeasured** | **9 cakes due Sat 2026-09-12**, 5 due Fri | First real read on the constraint |
| Order volume "may not accumulate" | **3.8 orders/day, 5 days straight** | Logging is real. The passive-watch bet paid |

Run rate: **A$335/day net across both stores**, A$1,674.98 over five days. Do not
annualise it — five days, spanning one weekend, on cake pre-orders only. It does
not include counter sales of sweets or slices, so it is a floor on the business,
not a measure of it.

### 2. Monday to Thursday is empty, and that is the largest asset on the table

Cakes by the day they are due:

| Sun | Mon | Tue | Wed | Thu | **Fri** | **Sat** |
|---:|---:|---:|---:|---:|---:|---:|
| 2 | 1 | 0 | 1 | 1 | **5** | **9** |

**74% of the book (14 of 19) is due Friday or Saturday.** Monday through Thursday
carries three cakes across four days.

This is the single most actionable number in the dataset, and it cuts two ways.
It means the chef's ceiling is a *weekend* ceiling — the business is not
capacity-limited across the week, it is capacity-limited for roughly 36 hours of
it. And it means there is a standing, evidenced, four-day-a-week hole that any
demand which can be *scheduled into it* is close to pure contribution, because
the rent, the chef and the ovens are paid for regardless.

That is the party-venue B2B case, and the Q4 plan already gated it on exactly
this evidence: *"two consecutive weeks where the baker's queue shows Mon–Thu
spare capacity."* **Week one of that gate is now on the board.** One more week
and the gate opens on its own terms.

### 3. Every order is already a pre-order

`walk_in` is **false on all 19 rows**. Lead time from order to pickup runs 27
hours to 599 hours, median ~55 hours — customers are booking two to three days
out, and one booked 25 days out.

Two readings, and the difference matters:
- **If the flag is being set honestly**, this business has no impulse-purchase
  problem to solve online. It has a *booking* problem, and booking is precisely
  what a structured intake form does well and a cart does badly.
- **If staff are simply not ticking the box**, the flag is worthless and should
  be either enforced or deleted.

Resolve this before the build starts. It is a five-minute question to Tarun and
it changes the shape of the intake form.

### 4. The customer record has a 37% hole in it

**7 of 19 orders carry no `phone_key`.** Name is present on all 19; the phone is
not. Everything [[Ops App]] built on top of customer identity — the directory,
the leaderboard, repeat rate, the "gone quiet" board — is computing over 63% of
the book and silently presenting it as all of it.

And the thing it is hiding is good news: **of the 9 customers who can be
identified, 3 have already ordered twice — inside five days.** On n=9 that is not
a repeat rate, it is a hint. But it is the hint that decides whether a loyalty
programme is ever worth building, and the data needed to confirm it is being
thrown away one order in three, right now, for free.

**Fix this before anything else in this document.** It is a required-field change
in the order form — an afternoon — and every month it runs unfixed is a month of
retention data that cannot be reconstructed.

### 5. Riverstone is carrying the book

15 of 19 orders (A$1,254.98 net, AOV A$89.64) against Harris Park's 4
(A$420.00 net, AOV A$105.00). Harris Park is 21% of the volume on higher rent,
with a slowdown undiagnosed since 2022 and ~A$3,901.86 of arrears last read in
March 2026.

Harris Park's AOV is the *higher* of the two. On n=4 that is noise, but it is
noise pointing somewhere specific: if it holds, Harris Park's problem is footfall,
not basket — which is a marketing problem, not a product one. The Q4 plan's
diagnosis project (5.2) now has an order book to run against and a 2026-11-03
deadline to produce a cause or close the question.

### 6. The organic channel cannot yet feed a store

2,010 clicks per 90 days is **~22 clicks/day** (GSC, 90 days to 2026-09-02).
At a generous 2% checkout conversion that is 0.44 orders/day. The Q4 plan sized
this at A$10.6k/year against 30–40 build hours and rejected it; the AOV correction
lifts that to roughly **A$15k**, which is better and still not close to the best
available use of the same hours.

A quote intake does not have this problem, because it does not need to convert
cold traffic. It converts the traffic that is *already* arriving by phone and
WhatsApp with purchase intent — the 14 calls Meta bought at A$6.67 each, the
customers who already know what they want. **The intake form's job is to capture
demand that already exists, not to create new demand.** That is why it works at
22 clicks/day and a cart does not.

---

## THE ALTERNATIVES, WEIGHED

Sized on the measured AOV of **A$93.05** (custom A$102.86), not the A$60–75 the
Q4 plan had to assume. Contribution assumes ~60% gross margin — **[UNVERIFIED],
`order_costs` still has 0 rows; this is the largest remaining hole in every
figure below.**

| Option | 5-yr revenue case | Margin quality | Verdict |
|---|---|---|---|
| **Quote pipeline + deposits** (recommended) | Converts existing intent; removes re-typing; deposits cut no-shows; every order becomes a customer record | **Highest** — sells the A$102.86 product, no commission, no discount anchor | **BUILD** |
| **Mon–Thu B2B / party venues** | 4 venues × 2 cakes/wk × A$35 × 52 = **A$14.6k/yr** (range A$7–29k) | Good — fills paid-for idle capacity; standardised and batched | **BUILD SECOND** — gate already 1 of 2 weeks met |
| **Cart + instant checkout** | 22 clicks/day × 2% × A$93 = **~A$15k/yr** | **Poor** — sells the 21% segment at 57% of AOV, anchors to list price | **REJECT** |
| **Third-party delivery** (UberEats / DoorDash) | Real volume, fast | **Worst available** — 25–35% commission on a A$93 order is A$23–33/cake, roughly the entire margin; decorated cakes travel badly and a damaged custom cake is a refund *and* a 1-star review | **REJECT** |
| **Loyalty / subscription** | Unknown | Unknown | **DEFER** — 3 of 9 repeat is a hint, not a rate. Fix the 37% phone gap, re-read at 90 days |
| **Third location** | ~A$164k/yr at the Riverstone target | **Reckless today** | **REJECT** — store #2 is underperforming and undiagnosed with arrears outstanding. Opening #3 before diagnosing #2 multiplies an unknown by three |

### On the cart specifically

It is worth being precise about why this is a rejection and not a deferral, since
the shop has been "deferred 2–3 months" since 2026-08-26 and that framing implies
it eventually just happens.

A cart is the right build for a business whose product is **standard, in stock,
and priced on a list**. Five days of the order book say this business is the
opposite of all three: 79% bespoke, made to order, priced per job at 1.3–2.8×
list. The cart is not early — **it is aimed at the wrong 21% of the business.**

What *does* eventually deserve a checkout is the Indian sweets line: standard,
boxed, stock-priced, genuinely cart-shaped. That page currently earns 3 clicks
from 1,106 impressions and is 528 words. Fix the page first (Q4 project 1.3),
prove there is demand, and revisit a sweets-only checkout in Year 2 as a narrow,
well-aimed build — not as a general store bolted onto a custom-cake bakery.

---

## SCOPE — what ships, what does not

### v1 — the quote pipeline (target: ship by 2026-12-20)

**In:**

1. **Structured design intake** replacing the `wa.me` links on `order.html`.
   Fields mirror the ops order form exactly: store, occasion, date needed,
   size, flavour, wording, design notes, **photo upload (multiple)**, name,
   **phone (required)**, email. It must write the same shape the ops app reads —
   `photo_paths` as a list, not a single cover.
2. **Writes into `orders` as a new status, `enquiry`**, ahead of `placed`. This
   is the critical design decision: an enquiry is **not** a confirmed order, must
   not appear in the baker's queue, must not count in takings, and must not be
   handed to the chef until a human has priced it and the customer has paid.
   `listToBake()` and every figure in `stats.mjs` filter it out.
3. **Staff quote action in ops** — open the enquiry, set a price, send it.
   Moving an enquiry to `placed` is a deliberate human act by someone who has
   read the brief. No auto-pricing on a custom cake, ever.
4. **Deposit link on the quote.** Stripe Checkout hosted page, one payment, no
   stored cards, no saved payment methods. Deposit lands on the existing
   `deposit` column — which is already populated on 7 of 19 orders, so the
   deposit habit exists and this formalises it rather than introducing it.
5. **Date-availability guard.** The intake refuses dates inside the chef's
   lead time and shows remaining weekend slots against the measured ceiling
   (currently 9/Saturday — **re-read this number at 2026-09-30 before wiring it in**).
6. **Phone required everywhere** — the intake *and* the ops order form. Closes
   the 37% hole.

**Explicitly out of v1:**

- Instant checkout on custom cakes. A price is quoted by a person.
- Any cart, basket or multi-item purchase.
- Accounts, logins, saved addresses, order history for customers.
- Delivery. Pickup only — same as today.
- Sweets checkout. Separate decision, Year 2, gated on `/indian-sweet` demand.
- Automated pricing of design work. The premium *is* the human judgement.

### How it plugs into what exists

The whole point is that **the backend is already built.** The intake is a new
front door onto the schema ops already runs on:

- `orders` — one new status value (`enquiry`) and one new source field. No new table.
- `order_events` — the AFTER trigger already logs every insert and field edit, so
  the enquiry→quote→placed trail records itself with no new call sites.
- `print_jobs` — untouched. Jobs are created after an order is `placed`, exactly as now.
- `photo_paths` — the intake writes the list; `orderPhotos()`, the print board and
  the invoice already read it. Storage RLS must grant read on the **list**, not
  just the cover — [[Ops App]] documents that exact bug and it will recur here.
- `catalog.mjs` — the single source of sizes, flavours and list prices. The intake
  imports it. **No second copy of the price list.** `verify.mjs` already gates this.
- Analytics — enquiries get their own conversion figure (enquiry→placed). Takings,
  margin and the customer directory keep reading `placed` and beyond, unchanged.

---

## TIMELINE

### Now → 2026-12-05 — the Q4 plan runs as written

No change. It is five days old and its critical path just cleared its first gate.
Three amendments only, all of them reads rather than new work:

1. **Re-read the chef ceiling at 2026-09-30** against ~14 days rather than 5.
   Saturday-9 is the number to confirm or correct.
2. **Fix the phone-required field now.** An afternoon. It is the only pre-work
   this document asks for inside Q4, and it is losing data every day.
3. **Update the AOV everywhere** from A$60–75 to A$93.05. Goal 1's kill criteria
   are calibrated on the low figure and are therefore too harsh: Meta at A$15.08
   a call and 25% conversion is A$60/call-value against A$93 AOV, which is
   **profitable**, not marginal. That changes a decision the Q4 plan was about to
   make against itself.

### First 90 days of the build — 2026-12-08 → 2027-03-06

| Weeks | Ships |
|---|---|
| 1–2 | `enquiry` status, RLS, the analytics filter. Backend only, nothing customer-facing |
| 3–5 | Intake form on `order.html`. Photo upload. Phone required. Replaces the `wa.me` links |
| 6–7 | Quote action in ops. Staff price it and send it |
| 8–9 | Stripe Checkout deposit. **Hosted page only** — see PCI below |
| 10–11 | Date-availability guard against the measured ceiling |
| 12 | Mon–Thu B2B sheet goes out on the back of it, using the same intake |

**90-day definition of done:** a customer completes a design brief on the website,
a staff member prices it in ops without re-typing anything, the customer pays a
deposit, and the cake appears in the baker's queue — with no WhatsApp message
anywhere in the chain.

### One year — 2027-09

- Every order originates as a structured record. WhatsApp is a support channel, not an intake.
- Mon–Thu runs at 40–60% of Saturday's volume on B2B and scheduled work.
- Repeat rate is a measured number on ~100% phone coverage, and a loyalty decision is made on it.
- `order_costs` populated; margin per size and per flavour is real, and `pricingGaps` has something to say.
- Harris Park has a named cause and a decision: fix, reposition, or close.

### Five years — 2031

The asset being compounded is not the website. It is **the order book plus the
operating system around it** — ops, intake, quoting, print jobs, invoicing,
analytics — which is now the only part of this business that is genuinely
transferable.

Three end states, honestly ranked by what today's evidence supports:

1. **Multi-site on one system (most supported).** 3–5 locations where opening
   store N is a configuration change, not a rebuild. Everything is already
   store-scoped by RLS. **Hard gate: do not open store 3 until Harris Park is
   diagnosed and either fixed or closed.**
2. **B2B as a real second revenue line (well supported).** Mon–Thu capacity sold
   to venues, corporates and caterers on standing orders. Evidenced by the
   weekday hole, and it compounds: contract revenue is flatter and more
   forecastable than weekend retail, which is what makes site 3 financeable.
3. **Licensing the operating system (speculative — flagged as such).** Every
   eggless-cake bakery in Sydney runs on WhatsApp and a paper diary. This is a
   real observation and **not** a validated business. Do not spend a dollar on it
   before end state 1 is proven across three sites. Noted so it is not forgotten,
   not so it is pursued.

**What "done" means in 2031:** the business can open a location without Vaidik
rebuilding anything, can forecast Mon–Thu revenue from contracts, and knows its
margin per cake to the cent. That is a sellable, financeable business. Two shops
run off a phone is neither.

---

## RISKS AND DEPENDENCIES

| Risk | Why it bites | Control |
|---|---|---|
| **Payment / PCI** | Handling a card number puts the business in PCI-DSS scope | **Stripe Checkout hosted page only.** Card data never touches our origin; scope stays SAQ-A. No custom card fields, no stored cards, no saved payment methods. Non-negotiable |
| **Refunds on a bespoke item** | ACL: a custom cake is not "change of mind" returnable, but a *defective* one is. A deposit taken online creates a written contract where none existed | Deposit terms written and shown before payment: what is refundable, by when, and what happens if the shop cannot deliver. **Have Tarun read them.** The tax-invoice work in [[Ops App]] already set the standard here |
| **Demand above the chef's ceiling** | The failure mode the Q4 plan correctly feared — orders taken that cannot be baked become late cakes and 1-star reviews. Now sharper: the ceiling is a *weekend* ceiling, and the intake will push more volume at exactly that peak | The date-availability guard is **not optional and not v2.** Saturday closes at the measured ceiling. This is the single control that makes the whole build chef-safe |
| **Deposit taken, cake not delivered** | Worse than a lost order — it is a chargeback and a public review | Enquiry never reaches the baker's queue until it is `placed`. Deposits only on quotes a human has priced and confirmed |
| **Staffing** | If Mon–Thu fills, one chef across both stores stops being enough | The weekday hole is the *reason* this is survivable — B2B is batched and scheduled, not reactive. Second pair of hands is triggered by two consecutive weeks of Mon–Thu above 60% of Saturday, not by a feeling |
| **`order_costs` still empty** | Every margin number in this document, including the 60% assumption, is unverified | Q4 project 5.3. **If COGS is not captured, the B2B price list is guesswork** and the wholesale lane should not open |
| **Building instead of selling** | [[Next Big Project — 2026 Q4]] names this exactly: 138 commits in 30 days against zero closed real-world loops | This build is gated behind Q4 completing. **If Q4's non-code items are still open on 2026-12-05, this slips.** Shipping code is not permission to skip the phone calls |

---

## SUCCESS METRICS

All read from what [[Ops App]] already computes — no new instrumentation.

### Leading — 30 days from launch

| Metric | Source | Working | Failing |
|---|---|---|---|
| Enquiries via the form | `orders` where source = web | ≥15/week | <5/week |
| Enquiry → placed conversion | `order_events` trail | ≥50% | <25% |
| Phone coverage | `phone_key is not null` | **≥95%** | <80% |
| Deposit take-up on quotes | `deposit > 0` | ≥60% | <30% |

### The 90-day number

**Share of orders that enter the business as a structured record rather than a
retyped WhatsApp message.**

- **Working: ≥60%.** The front door has moved.
- **Failing: <30%.** Customers prefer WhatsApp and were never going to fill in a
  form. In that case the correct response is not a better form — it is to
  **stop building and put the hours into Mon–Thu B2B**, where the customer is a
  venue manager with a purchase order, not a parent with a phone.

### The counter-metric — watched to make sure the build is not doing harm

**Saturday late-or-missed cakes.** Baseline is currently zero (19 orders, 0
cancelled). If this is anything other than zero at 90 days, the availability
guard has failed and the intake should be throttled the same day. Growth that
produces a late cake on a child's birthday costs more than it earns.

### The one-year number

**Mon–Thu cakes as a share of Fri–Sat cakes.** Today: 3 vs 14 = **21%**. One-year
target 40–60%. This is the number that says whether the business broke its
weekend dependency, and it is the number that decides whether a third location is
fundable.

---

## WHAT I COULD NOT VERIFY

| Gap | Why it matters | Cheapest check |
|---|---|---|
| **n=19 over 5 days** | Everything here. The weekday shape, the ceiling and the custom/normal split all rest on one weekend | Re-read at 2026-09-30. Free, already scheduled |
| **Normal-cake AOV rests on n=4** | It carries the central argument against the cart. Directionally safe (list prices are public and low), statistically thin | Re-read at n≥10 normal orders |
| **`walk_in` false on all 19** | Decides whether this is genuinely a booking business or a flag nobody ticks | Ask Tarun. 5 minutes |
| **60% gross margin** [UNVERIFIED] | Every contribution figure, and the entire B2B price list | Q4 project 5.3 — `order_costs` |
| **Customers will fill in a form at all** | The core behavioural bet. WhatsApp is frictionless and familiar; a form is neither | The 90-day metric is designed to kill this build if it is wrong |
| **Whether the 9 Sat cakes was the ceiling or just the demand** | A full Saturday and a busy Saturday look identical from the order book | Ask the chef what his own number is, and use the lower — Q4 project 2.2 |
| **Harris Park's higher AOV** (n=4) | If it holds, HP's problem is footfall not basket, which changes the whole diagnosis | Q4 project 5.2, deadline 2026-11-03 |

---

## WHAT THIS DOCUMENT DOES NOT CHANGE

- **The Q4 plan stands.** Measurement, ads, GBP and compliance run to 2026-12-05 as written.
- **No new ops features** before 2026-12-05, beyond the phone-required field.
- **No Stripe before the ceiling is confirmed** at ~14 days.
- **No third location** before Harris Park is diagnosed.
- **No re-litigating `/review` gating.** Decided, owner-carried.

---

Related: [[Next Big Project — 2026 Q4]] · [[Num Nums Bakery]] · [[Ops App]] ·
[[Marketing History]] · [[SEO & GEO Status]] · [[Website]] · [[Pricing]] ·
[[Yum Yum Wholesale]] · [[Wholesale Outreach — Kids Party Venues]]
