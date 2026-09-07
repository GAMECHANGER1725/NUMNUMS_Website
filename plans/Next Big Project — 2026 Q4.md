# Next Big Project — 2026 Q4

Decided 2026-09-06, covering 2026-09-07 → 2026-12-05. Supersedes nothing; it is the
first plan written after [[Ops App]] went feature-complete. Area overview:
[[Num Nums Bakery]]. Channel history: [[Marketing History]]. Search state:
[[SEO & GEO Status]]. Web estate: [[Website]]. Prices: [[Pricing]].

---

## THE PICK

**Read the order book the moment it's real, and get the chef's actual daily
ceiling as a number by 2026-09-30.**

**Correction, 2026-09-07 (Vaidik):** logging is a given — staff will put every
order into [[Ops App]] as a matter of course, no mandate or install campaign
required. That removes the adoption-forcing half of this pick (no Tarun rule,
no phone-install project, no daily compliance check) — **but not the reason it
was picked.** The ops app has **1 order in it** as of 2026-09-06 (Supabase
`stnmoxsojqbbtgjwkzrc`: `orders`=1, `order_costs`=0, `print_jobs`=0), and the
single stated constraint on the whole business — one chef across both stores —
has never been measured. Riverstone sits at $200–300/day against a $700/day
target ([[Marketing History]]), which is 30–43% of target; a business at 35% of
target is not chef-limited, it is demand-limited. But nobody can prove where the
chef saturates, so every demand decision this quarter — how much Meta spend,
whether to take on party venues, whether Harris Park's slowdown is traffic or
basket size — is being made blind against a constraint whose location is
unknown. The work left under this pick is now small: watch the count, and read
the chef's ceiling the day there's enough data to read it. Nothing else on the
list should be sized before that reading exists.

### The case against my own pick
1. It earns **A$0** of new revenue directly. A quarter spent on measurement while Riverstone runs a ~$450/day gap is a quarter of bookkeeping.
2. Even passively, it's a wait — the ceiling isn't known until ~14 days of real orders accumulate, and every project gated on it (party venues, Meta spend past A$30/day, Harris Park) sits idle until then.
3. If logging turns out to be less complete in practice than assumed here, nothing in this plan catches it early — there's no adoption counter watching for that anymore.

### Why it still wins
Because the alternative is spending real money into an unmeasured constraint.
Restarting Meta at A$30/day for a quarter is **A$2,700** to discover either that
calls convert at 40% and it was the best money the business ever spent, or that
the chef could not bake the orders. The order book is the only thing that tells
those apart, and it also settles Harris Park, the wholesale price list, the
photo-purge rule, and the margin question at the same time. And now it costs
almost nothing to wait for — it does not compete with the other four goals for
hours, it just unblocks them on its own timeline.

### Runners-up and their promotion triggers
| Runner-up | Trigger that promotes it |
|---|---|
| **Restart paid acquisition on the A$6.67 creative** | Already promoted to a week-1 task at capped spend — the ad set is a 5-minute date edit, not a project. Promotes to *the* headline project the day the order book logs 7 consecutive days at ≥90% of till count, because conversion becomes measurable that day. |
| **Party-venue B2B (17–19 venues, both email drafts already written)** | Two consecutive weeks where the baker's queue shows Mon–Thu spare capacity, **and** Tarun has supplied a wholesale price list. Both conditions, not either — this channel is only chef-safe if the cakes are standardised and batched away from the weekend. |

---

## Operating picture as at 2026-09-06

1. **The order book is empty, for now.** `orders`=1 (created 2026-09-05), `order_costs`=0, `print_jobs`=0, `order_events`=6, `profiles`=7 (2 admin / 4 staff / 1 baker). 6 distinct users have signed in; 5 within the last 3 days. Login split: admin 170, baker 13, staff 5. Source: Supabase `stnmoxsojqbbtgjwkzrc`, 2026-09-06. Per Vaidik (2026-09-07), staff logging every order is a given going forward — no adoption push needed — so this is expected to fill in on its own; treat the open question in [[Ops App]] as resolving passively, not as a live risk to chase.
2. **Paid acquisition is at A$0/day, and the best asset in the account's history is idle.** Campaign `Rakhi | Calls | Rasmalai-20pct | 2026-08` reads ACTIVE, but its only ad set (`Rakhi | Calls | HarrisPark+Riverstone 15km`) carries `end_time 2026-08-28`. It ran 3 days, spent **A$93.34**, 10,545 impressions, **14 calls at A$6.67**. Zero spend since 2026-08-27. The two paused Leads campaigns: A$723.88 → 48 calls @ **A$15.08**, and A$179.29 → 9 calls @ **A$19.92**. Source: Meta Ads MCP, account `912674345993959`, 2026-09-06. **This resolves the "is Meta Leads live?" open question in [[Num Nums Bakery]]: no. Remove it from the owner queue.**
3. **Contradiction — [[Pricing]] vs the ad account.** [[Pricing]] records the 20% rasmalai sale as "not confirmed as run", and [[Marketing History]] lists percentage discounts under *Rejected on purpose*. The ad account shows a campaign literally named `Rasmalai-20pct` that spent money and produced the cheapest calls ever recorded. **Trusting the ad account** — it is a system of record; the note is a recollection. Someone ran a percentage promo. Whether that was authorised is an owner question, not a data question.
4. **Contradiction — the Babel/JSX problem is already fixed.** [[SEO & GEO Status]], [[Website]] and [[Num Nums Bakery]] all still call in-browser JSX transpilation "the single biggest unresolved lever" on speed and AI-crawler visibility. `index.html` now has **0** matches for react/babel/jsx; its only external scripts are gtag and Lenis (`index.html:13,1999`). Fixed on or before 2026-09-03 (commit `5ea3ae9`). **Trusting the repo.** Three brain notes are stale and should be corrected.
5. **The site publishes a rating it cannot substantiate, and a different company's confidential address.** `aggregateRating` `4.6 / 50` appears byte-identical at `index.html:580,631` and `locations.html:171,241` — two different shops, same rating, same review count. Every third-party scrape of Harris Park says 4.1 (603 / 358 / 609 reviews). Separately, `llms.txt:34` publishes `Address: 2/4 Nelson Road, Yennora NSW 2161` — that is **[[Yum Yum Wholesale]]'s factory**, which its own note says "must never appear on public-facing pages" — while `locations.html:651,658,754` publishes the correct Mulgrave address. Both live, in the file written for AI crawlers.
6. **GBP has been dark 84 days.** Last `status: published` in `GBP/posts-queue.md` is 2026-06-14; the pending entry carries `note: "Webhook POST could not be sent from remote environment"`. `GBP/outbox/` is empty. [[Marketing History]] calls GBP "the fastest win, treated as more important than the website."
7. **Search is a brand business with a non-brand ceiling.** 90 days to 2026-09-02: 2,010 clicks / 89,578 impressions / CTR 2.24% / avg position 10.7. But `num num bakery` = 204 clicks at position 2.0 and 21% CTR, while `eggless cake shop` = 1,919 impressions and **1 click** at position 20.2. Blog: 361 URLs → 777 clicks (1.41%). Commercial: 20 URLs → 1,233 clicks (3.57%). Source: `seo-baseline/2026-09-02/BASELINE-SNAPSHOT.md`, 4 days old.
8. **The Indian sweets line is one page and it converts nothing.** `/indian-sweet`: 1,106 impressions, **3 clicks**, position 7.9 on `barfi near me` (677 impressions, 0 clicks). 528 words, no FAQ, no FAQPage schema. Source: `blog/topic-ledger.md` Tier 2.
9. **Build capacity is abundant; non-code execution is the bottleneck.** 138 commits in 30 days, 21 on 2026-09-05 alone. Against that: 6 owner-input items blocking SEO (all non-code), two party-venue outreach drafts unsent since 2026-07-12, Instagram at 263 followers after ~5 months dead, GBP dark, ads dark, order book empty. **Every stalled item is a non-code item. That is the pattern this quarter has to break.**
10. **The money, and the asymmetry nobody is looking at.** Riverstone ~$200–300/day vs a $700/day target (~$450/day, ~A$164k/yr). Harris Park similar, on higher rent, slowing since 2022, undiagnosed, with ~$3,901.86 arrears recorded in March 2026 — **6 months stale**. Both stores together are roughly A$4k/week. [[Yum Yum Wholesale]] booked **A$46,226 in week 16 of April 2026** across 19 accounts, with 3 accounts carrying $900–1,900/day each — roughly **10× the revenue**, on a separate entity, a separate factory, and a chef the Num Nums constraint does not touch. That figure is 5 months stale. It gets a fraction of the attention.

---

## Candidate scoring

Revenue is a range with the arithmetic shown. AOV assumed **A$60–75** [INFERRED
from [[Pricing]]: 8" $49.99 is the mid, premium flavours $64.99–$99.99].
Call→order conversion assumed **25–40%** [UNVERIFIED — no source anywhere; this
is the single biggest guess in the document and Goal 1 exists partly to kill it].

| # | Candidate | Revenue impact A$/yr (arithmetic) | Time to first $ | My hrs/wk | Chef-safe? | Needs unverified data? | Reversible? |
|---|---|---|---|---|---|---|---|
| **A** | **Read the order book / chef ceiling** | **A$0 direct** — precondition on every figure below | n/a | 0.5 | Yes — measures it | No, it *creates* the data | Fully |
| B | Restart Meta on the A$6.67 creative | 4.7 calls/day × 30% × A$65 = A$91/day rev on A$30/day spend → **A$10–33k rev, A$11k spend, net A$0–22k** | 3 days | 1 | Only at capped spend | **Yes** — conversion is a guess | Fully (pause) |
| C | GBP revival + review engine | **NO BASELINE** — no GBP metrics have ever been recorded | 2 weeks | 1 | Yes | Yes | Fully |
| D | Party-venue B2B (17–19 venues) | 4 venues × 2 cakes/wk × A$35 × 52 = **A$14.6k** (range A$7–29k at 2–8 venues) | 6–10 weeks | 2 | **Only if standardised + batched Mon–Thu** | Yes — no price list exists | Mostly (contracts) |
| E | Yum Yum Delight site conversion fix | 2 mid accounts × A$500/day × 5 days = **A$260k** [INFERRED from W16 A$46,226/19 accounts] | 4–8 weeks | 2 | **N/A — different entity, different factory** | Yes — figures 5 months stale | Fully |
| F | Stripe checkout for preset cakes | 22 organic clicks/day × 2% × A$65 = A$29/day → **A$10.6k**, against 30–40 build hrs | 8+ weeks | 6+ | **No — adds unpredictable demand** | Yes | Poorly |
| G | `/indian-sweet` + commercial CTR rebuild | 1,106 impr → 3% CTR = 33 clicks/90d × 20% × A$20 = **~A$0.5k** | 4 weeks | 0.5 | Yes | No | Fully |
| H | YouTube + Reddit brand signals | **Unquantifiable.** YouTube correlates 0.737 with AI citation ([[SEO & GEO Status]]) but converts nothing directly | 6+ months | 4+ | Yes | Yes | Fully |
| I | Harris Park slowdown diagnosis | **NO BASELINE** — the whole point is that the magnitude is unknown | 4 weeks | 1 | Yes | Depends on A | Fully |
| J | Cost & margin capture (`order_costs` is empty) | 5% mispricing on ~A$200k retail turnover = **~A$10k** [INFERRED, rough] | 6 weeks | 1 | Yes | Depends on A | Fully |
| K | Mulgrave factory → customer logistics | **Unknown** — cannot size until the order book shows how many orders originate there | 8+ weeks | 2 | Yes | Depends on A | Mostly |

### Theory of constraints, stated explicitly
The chef is the *stated* constraint. The data says the chef is **not the current
binding constraint**: a shop at 30–43% of its own revenue target is not turning
work away, it is short of work. The binding constraint today is demand — but the
chef becomes binding somewhere between A$300/day and A$700/day, and **nobody
knows where.** That makes candidates B, D, F and K all potentially
value-destroying, not because demand is bad but because demand bought above the
chef's ceiling converts into late cakes, cancelled orders and 1-star reviews —
which is the most expensive form of growth available. Candidate F (Stripe) is
the worst of them: it adds *unpredictable* demand with a payment already taken.
**Rejected for this quarter.** Candidate A is the only one that locates the
ceiling, which is why it is the pick.

---

## THE 5 GOALS

### Goal 1 — Demand: buy calls at a price we can prove, not a price we hope for

- **Outcome statement.** By **2026-12-05**, paid acquisition moves from **A$0/day spend and 0 calls since 2026-08-27** to **≥90 calls in the quarter at ≤A$12/call, with a measured call→order conversion rate** (baseline: A$6.67/call over 3 days, A$15.08/call over the 2026-07 campaign — Meta Ads account `912674345993959`, 2026-09-06).
- **Why now.** The cheapest calls this business has ever bought were bought 11 days ago and the ad set expired on a date nobody was watching. Every other demand lever costs weeks; this one costs a date edit.
- **Metric, and where it is read.** Meta Ads MCP, account `912674345993959`, `level: campaign`, `results: click_to_call_native_call_placed` + `cost_per_result`. Conversion denominator comes from the `orders` table — **which means this goal's conversion half cannot be read until Goal 2 lands.** Cost-per-call can be read today.

| Project 1.1 | Restart the proven ad set at capped spend |
|---|---|
| What ships | Ad set `Rakhi \| Calls \| HarrisPark+Riverstone 15km` (`120257464860480339`) relaunched with no end date, A$30/day cap, same creative, same 15km radius. |
| First 3 tasks | (1) Confirm with Tarun that the 20%-rasmalai offer in the creative can re-run, or swap to a non-discount hook. (2) Remove the `end_time`, set daily budget A$30. (3) Write the call log: a paper sheet at each counter, date + "did they order". |
| Owner | Me (ads), Tarun (offer sign-off), staff (call log) |
| My weekly hours | 1 |
| Cost | A$30/day capped = **A$2,700/quarter** |
| Depends on | Owner-queue item 7. **Nothing else** — this does not wait for the order book. |
| Done looks like | 7 consecutive days of delivery at ≤A$12/call with a call log showing ≥25% of calls became orders. |
| Kill criteria | Cost-per-call >A$18 for 7 consecutive days, **or** A$500 cumulative spend with <20% call→order conversion. Pause, do not "optimise". |

| Project 1.2 | Party-venue B2B — send the emails that were written in July |
|---|---|
| What ships | A one-page wholesale sheet (3 standardised themed cakes, fixed sizes, fixed 3D topper, fixed price, Mon–Thu delivery only) + the v2 Dale Carnegie email actually sent to tier 1. |
| First 3 tasks | (1) Get the wholesale price list from Tarun (owner-queue 5). (2) Cut the 17-venue list to the 6 that are inside 15km of a store and do not ban outside food. (3) Confirm-call reception at those 6 to get a name for the `[Manager]` placeholder. |
| Owner | Me (drafting, sending), Tarun (pricing), chef (batch feasibility) |
| My weekly hours | 2, weeks 7–12 only |
| Cost | A$0 + ~A$50 of sample cakes |
| Depends on | **Hard gate: the baker's queue must show two consecutive weeks of Mon–Thu spare capacity.** Plus owner-queue 5. Drafts already exist (`Wholesale Outreach — Kids Party Venues`). |
| Done looks like | 6 emails sent, ≥2 replies, ≥1 sample cake delivered. |
| Kill criteria | 6 sent + 2 follow-ups with 0 replies by 2026-11-21 → the channel is dead, fall back to the referral model already decided in [[Marketing History]]. |

| Project 1.3 | Fix the two commercial pages that rank and don't convert |
|---|---|
| What ships | `/indian-sweet` rewritten (528 → ~1,200 words, FAQ + FAQPage schema, title/meta rewritten for the click); the 5 Tier-1 dietary owner pages in `blog/topic-ledger.md` strengthened. **No new URLs.** |
| First 3 tasks | (1) Rewrite `/indian-sweet` title + meta against `barfi near me`. (2) Add FAQ + FAQPage schema. (3) Point internal links at the 5 dietary owner pages with exact anchors. |
| Owner | Me |
| My weekly hours | 0.5 |
| Cost | A$0 |
| Depends on | Nothing. Must not add URLs before the 2026-10-06 checkpoint. |
| Done looks like | `/indian-sweet` CTR >2% at the 2026-11-03 checkpoint (baseline 0.27%). |
| Kill criteria | No CTR movement by 2026-11-03 → the query is informational, not commercial. Stop. |

- **Structure.** Extend the existing **cloud-routine pattern** (`NumNums-SEO-Monthly`, trigger `trig_01FaPY1jW9kSZx1yfnqXsA2k`) with a sibling **`NumNums-Demand-Weekly`**: every Monday it pulls Meta cost-per-call and the week's `orders` count, appends one row to a new `marketing/acquisition-ledger.md` — same append-only ledger shape as `blog/topic-ledger.md` and `GBP/posts-queue.md`. One row per week. Vaidik reads it Monday; Tarun sees it monthly.
- **What could make this the wrong goal.** If the A$6.67 was a Rakhi-festival artefact, the durable price is A$15.08 and at 25% conversion this channel roughly breaks even on revenue and loses money on gross margin — in which case the right answer is A$0 paid and everything into GBP.

---

### Goal 2 — Internal organisation & process: read the order book the moment it's real

- **Outcome statement.** By **2026-09-30**, the chef's maximum cakes-per-day is a recorded number rather than a phrase, read off ~14 days of orders that Vaidik does not need to chase — **per Vaidik (2026-09-07), staff logging every order is a given, not a project.**
- **Why now.** The app is feature-complete as of 2026-09-06 and holds one row today. Every analytics feature built over four days — margin coverage, cancellation confidence, pricing gaps, the customer leaderboard — is currently reporting on a single order, and stays that way until real volume lands.
- **Metric, and where it is read.** `bakerSections`/`byWeekday` in `ops/stats.mjs` over the `orders` table, once enough days exist to read a shape rather than noise.

| Project 2.1 | Watch the count fill in |
|---|---|
| What ships | A one-line check — `select count(*), store from orders where created_at::date = <day> group by store` — folded into the existing **`ai-brain-nightly`** Morning Digest, so the order count shows up passively instead of needing Vaidik to open the app and look. |
| First 3 tasks | (1) Add the one-line query to the nightly digest. (2) Nothing else — no drawer leaf, no till-count field, no install campaign; those are dropped per the 2026-09-07 correction. (3) Check back in ~2 weeks. |
| Owner | Me |
| My weekly hours | 0.25 |
| Cost | A$0 |
| Depends on | Nothing. |
| Done looks like | The Morning Digest shows a rising daily order count without anyone opening the ops app to check. |
| Kill criteria | None — this is a cheap watch, not a project. |

| Project 2.2 | Find the chef's ceiling |
|---|---|
| What ships | A single recorded number: max cakes/day the one chef clears, plus the weekday shape, read off `bakerSections`/`byWeekday` once ~14 days of real orders exist. Written into [[Num Nums Bakery]] as a fact. |
| First 3 tasks | (1) Wait for the count in 2.1 to show ~14 days of real volume — do not estimate it early. (2) Ask the chef directly what his own number is, and record it separately as a second data point. (3) Compare, and use the lower. |
| Owner | Me (reading), chef (his own estimate) |
| My weekly hours | 0.5, whenever the data is ready |
| Cost | A$0 |
| Depends on | Order volume accumulating naturally — no other dependency. |
| Done looks like | A number in [[Num Nums Bakery]], with its coverage stated (how many days it was computed from). |
| Kill criteria | If real volume hasn't shown up by 2026-09-30, ask the chef for his own estimate, mark it **[UNVERIFIED]**, and gate every demand project on it anyway rather than waiting indefinitely. |

- **Structure.** Extend the **`ai-brain-nightly`** routine, which already writes a Morning Digest into `inbox/`, with one more line. State lives in the `orders` table itself, no new mechanism needed. Reviewed by me whenever the digest shows the count has moved.
- **What could make this the wrong goal.** If order volume takes materially longer than 14 days to accumulate at real levels, every project gated on the chef's ceiling (party venues, Meta spend past A$30/day, the Harris Park diagnosis) sits idle for longer than this plan assumes — worth a check-in at 2026-09-30 regardless of how full the book is by then.

---

### Goal 3 — Customer satisfaction & retention: stop being invisible between purchases

- **Outcome statement.** By **2026-12-05**, GBP posting moves from **0 posts in 84 days** (last `status: published` 2026-06-14, `GBP/posts-queue.md`) to **≥1 post/week per location for 8 consecutive weeks**, and the repeat-customer rate is a known number rather than an unmeasured one (`NO BASELINE — first job is to measure it`, via the `customers` view once Goal 2 lands).
- **Why now.** [[Marketing History]] calls GBP "the fastest win, treated as more important than the website" — and it has been dark for 84 days because a webhook could not be reached from the routine's environment. The automation exists; it is one broken link away from working.
- **Metric, and where it is read.** Posts: `grep -c "status: published" GBP/posts-queue.md`, baseline **1**. Reviews: Google review count per location — **NO BASELINE, GBP dashboard required** (owner-queue 2). Repeat rate: `repeatCustomers()` in `ops/stats.mjs` reading the `customers` view — **NO BASELINE until Goal 2**.

| Project 3.1 | Repair the GBP publisher |
|---|---|
| What ships | `.github/workflows/gbp-post.yml` publishing again — the pending 2026-06-14 post out the door, the retired-URL CTA repointed, and a failure that is visible instead of silent. |
| First 3 tasks | (1) Run the stored `curl_command` at the bottom of `GBP/posts-queue.md` by hand and see the actual error. (2) Fix the CTA, which points at a URL retired in the 2026-09-01 consolidation. (3) Make a failed webhook POST fail the workflow, not log a note — the failure mode that cost 84 days was a silent one. |
| Owner | Me |
| My weekly hours | 1, weeks 1–2 |
| Cost | A$0 |
| Depends on | Make.com webhook reachable. |
| Done looks like | A post visible on both live profiles, and a deliberately broken webhook turns the Action red. |
| Kill criteria | If the webhook cannot be fixed by 2026-09-19, abandon the automation and post manually — 2 posts/week by hand is 10 minutes and beats 84 days of elegant silence. |

| Project 3.2 | Replace the fabricated rating with the real one |
|---|---|
| What ships | Real per-location `ratingValue`/`reviewCount` at `index.html:578,629` and `locations.html:171,241` — or the markup deleted. Plus a `verify-blog.mjs` assertion that fails the build if a rating is published without a verification date under 90 days old. |
| First 3 tasks | (1) Get both real figures from Tarun (owner-queue 2). (2) Set each node independently. (3) Add the gate to `verify-blog.mjs` FACTS. |
| Owner | Tarun (figures), me (code) |
| My weekly hours | 0.5 |
| Cost | A$0 |
| Depends on | **Owner-queue 2.** If it does not arrive by 2026-09-19, delete the markup — publishing a stale shared rating is worse than publishing none. |
| Done looks like | Two different ratings, both traceable to a dashboard reading with a date. |
| Kill criteria | n/a — this ships either as real figures or as a deletion. |

| Project 3.3 | Make the review flow capture what it currently throws away |
|---|---|
| What ships | 4–5 star feedback text posted to the Make webhook alongside the Google redirect. **Today it is written to the clipboard and nowhere else — if the customer does not paste, it is gone** ([[Website]], Still open). |
| First 3 tasks | (1) Post every rating to the webhook, not just 1–3. (2) Add a `rating` field so the Make scenario can branch. (3) Confirm with Tarun what should happen to the new 4–5 star payloads. |
| Owner | Me, Tarun (Make scenario) |
| My weekly hours | 0.5 |
| Cost | A$0 |
| Depends on | Tarun's Make scenario tolerating the new payload shape. |
| Done looks like | A 5-star submission appears in Make with its text. |
| Kill criteria | None — this is strictly additive. |

- **Structure.** Extend the **GBP GitHub Action** (`.github/workflows/gbp-post.yml` → Make webhook) that already exists and is idle, with `GBP/posts-queue.md` + `used-images.txt` as its state and the anti-repetition check in the location rules files as its quality gate. Weekly cadence. Read by me; the post itself is read by customers.
- **What could make this the wrong goal.** If the review-gating on `/review` gets the profile penalised (a decided, owner-carried risk), GBP standing collapses and every hour spent on posting cadence is spent on an asset that is about to be devalued. Cost of that scenario: this entire goal.

---

### Goal 4 — Legal, compliance & risk: publish nothing the business cannot substantiate

- **Outcome statement.** By **2026-10-17**, unsubstantiated or contradictory published claims move from **6 open classes** to **0**, with each one gated in `verify-blog.mjs` so it cannot return.
- **Why now.** Two of the six are live right now and neither is cosmetic: a fabricated `aggregateRating` identical across two shops is a structured-data manual-action risk, and `llms.txt:34` publishes **[[Yum Yum Wholesale]]'s factory address** — a different company's, explicitly designated internal-only — on the Num Nums public site.
- **Metric, and where it is read.** `node verify-blog.mjs` exit code, plus a count of the six classes. Baseline as at 2026-09-06:

| # | Claim | Where | Status |
|---|---|---|---|
| 1 | `aggregateRating 4.6 / 50`, byte-identical across two shops | `index.html:580,631`, `locations.html:171,241` | **live, not gated** |
| 2 | Yum Yum's Yennora factory address on the Num Nums site | `llms.txt:34` | **live, not gated** |
| 3 | Factory address contradicts itself (Mulgrave vs Yennora) | `locations.html:651,658,754` vs `llms.txt:34` | **live, not gated** |
| 4 | 62 off-menu flavour mentions | `seo-baseline/2026-09-02/off-menu-flavours.csv` | gated by FACTS, unresolved |
| 5 | Wrong atParramatta.com listing (suite, phone, domain, savoury menu) | external | open, needs Tarun |
| 6 | Founding year 2017 vs 2019 vs "9 years" | Wikidata `Q140076208`, site, ad copy | open, needs Tarun |

| Project 4.1 | Delete or substantiate, then gate |
|---|---|
| What ships | Classes 1–3 resolved in code, plus three new `verify-blog.mjs` FACTS assertions: no `aggregateRating` without a <90-day verification date; exactly one factory address site-wide; `Yennora` never appears as an address on any Num Nums page. |
| First 3 tasks | (1) Delete `llms.txt:34`'s Yennora address today — one line, no owner input needed, and it is another company's confidential data. (2) Set the Mulgrave address as canonical in FACTS. (3) Add the three assertions. |
| Owner | Me (1–3), Tarun (the rating figures) |
| My weekly hours | 1, week 1 |
| Cost | A$0 |
| Depends on | Owner-queue 2 and 3 for the substantiation half; the deletion half depends on nothing. |
| Done looks like | `node verify-blog.mjs` fails if any of the three is reintroduced. |
| Kill criteria | n/a — compliance work does not get killed, it gets descoped to deletion. |

| Project 4.2 | Close the 62 off-menu flavours and the founding year |
|---|---|
| What ships | `seo-baseline/2026-09-02/off-menu-flavours.csv` marked orderable / not-orderable by Tarun, then either added to `catalog.mjs` + FACTS or rewritten out of the blog. One founding year everywhere including Wikidata `Q140076208`. |
| First 3 tasks | (1) Print the CSV, hand it to Tarun with a pen. (2) Apply his answers to FACTS and `ops/catalog.mjs` in one pass. (3) Fix the founding year in schema, ad copy and Wikidata together. |
| Owner | Tarun (decisions), me (application) |
| My weekly hours | 1, weeks 3–4 |
| Cost | A$0 |
| Depends on | **Owner-queue 4 and 6.** |
| Done looks like | Build green with FACTS extended; one founding year in three places. |
| Kill criteria | If Tarun has not marked the CSV by 2026-10-17, rewrite all 62 mentions out. Advertising a flavour customers cannot buy is worse than omitting it. |

| Project 4.3 | The food-safety position, written down once |
|---|---|
| What ships | A one-page note in the vault: current licences per premises, last inspection date per premises, and the [[Home Puffs Operation]] exposure stated plainly (GNT's licences cover Harris Park and Riverstone, not a residential address in Blacktown LGA). |
| First 3 tasks | (1) Ask Tarun for the licence + last-inspection date for each of the three sites. (2) Record them. (3) Diary the next renewal. |
| Owner | Tarun (facts), me (the note) |
| My weekly hours | 0.5, week 2 |
| Cost | A$0 |
| Depends on | Tarun. |
| Done looks like | Three sites, three dates, one renewal reminder. |
| Kill criteria | None. |
| Why it is here | `knowledge/Bakery Industry Watch/2026-09-04.md`: **L'Oven Bakery Supplies, South Granville — A$84,000 and 18 convictions**, seven of them for missing date-marking labels, on a site 5km from Harris Park. Repeat offender, previously A$75,000. Date-marking is a paperwork offence and it is the cheapest one to be caught by. |

- **Structure.** Extend **`verify-blog.mjs`**, which is already the Netlify build command for the public site — a failing check already blocks the deploy. Every claim resolved here becomes a FACTS assertion, so the mechanism is the build itself, not a habit. Read by whoever next pushes.
- **What could make this the wrong goal.** None of it earns a dollar, and a manual action may never come. But the downside is asymmetric — a structured-data penalty or a food-safety notice takes out a store, not a metric — and the whole goal is under 4 hours.

---

### Goal 5 — Data & decision quality: allocate attention to where the money actually is

- **Outcome statement.** By **2026-11-03**, revenue-per-hour-of-Vaidik's-attention by venture moves from **unknown** (`NO BASELINE — first job is to measure it`) to a monthly figure, and the Harris Park slowdown moves from **undiagnosed since 2022** to a named cause or a stated "no cause found, stop looking".
- **Why now.** Num Nums retail is roughly **A$4k/week** across both stores and gets essentially 100% of the attention. [[Yum Yum Wholesale]] booked **A$46,226 in week 16, April 2026** across 19 accounts and gets almost none — while its own site has documented, unfixed conversion defects (no prices behind "Get Pricing" CTAs, no phone number, 17 of 51 products on placeholder grey boxes, a 7-field cold-lead form). That is a ~10× revenue asymmetry against the attention split, and the Yum Yum figure is 5 months stale, which is itself the finding.
- **Metric, and where it is read.** Num Nums: `summarise()`/`storeBreakdown()` in `ops/stats.mjs` over the `orders` table — **requires Goal 2**. Yum Yum: the daily order-data spreadsheet, last read April 2026. Hours: a one-line-per-day tally, nowhere today.

| Project 5.1 | Re-read Yum Yum's numbers and fix the site's four conversion defects |
|---|---|
| What ships | A current revenue + account-concentration read (the April figure is 5 months old), and the four documented defects fixed: indicative pricing published or the CTA renamed, a phone number added, the 17 placeholder images replaced or their products hidden, the lead form cut from 7 fields to 3. |
| First 3 tasks | (1) Pull the current month's order data and compare against W16 April. (2) Get Tarun's call on publish-prices vs rename-the-CTA (owner-queue 12). (3) Cut the form to name / business / phone. |
| Owner | Me (build), Tarun (pricing decision) |
| My weekly hours | 2, weeks 3–6 |
| Cost | A$0 |
| Depends on | Owner-queue 12. **Note: the last "fixes are done" claim was checked and the live site was byte-for-byte unchanged — the deploy had not happened. Verify live, not pushed.** |
| Done looks like | Live site shows a price or an honest CTA, a phone number, no grey boxes, 3-field form — **confirmed on the live URL**. |
| Kill criteria | No new wholesale inquiry by 2026-12-05 → the site is not the constraint on that business; stop touching it. |

| Project 5.2 | Diagnose Harris Park, or close the question |
|---|---|
| What ships | A written answer to "why did Harris Park slow after 2022" — traffic, basket size, mix, or unknown — using the order book, GBP insights and Tarun's memory of what changed. |
| First 3 tasks | (1) Ask Tarun three questions: what changed in the street, in the staff, and in the neighbours around 2022. (2) Pull GBP Insights for both stores (needs owner-queue 2 access anyway). (3) Once 14 days of orders exist, compare HP vs RIV on basket size and mix, not just totals. |
| Owner | Tarun (memory), me (analysis) |
| My weekly hours | 1, weeks 5–8 |
| Cost | A$0 |
| Depends on | Goal 2, owner-queue 9. |
| Done looks like | A named cause in [[Num Nums Bakery]], **or** an explicit "no cause found" that releases the marketing-spend freeze. |
| Kill criteria | 2026-11-03 with no cause → write "no cause found", lift the freeze, and treat Harris Park as a normal store. An indefinite freeze on an undiagnosed cause is itself a decision, and it has been running since March. |

| Project 5.3 | Capture cost so margin stops being uncomputable |
|---|---|
| What ships | Cake COGS per size in `order_costs`, entered once per size rather than per order, so `storeBreakdown`/`productMix` return a `marginTrusted` that is actually true. **`order_costs` has 0 rows today.** |
| First 3 tasks | (1) Get COGS per size from the chef/Tarun (owner-queue 8). (2) Backfill costs for logged orders. (3) Check `pricingGaps` — it has never had anything to read. |
| Owner | Tarun/chef (numbers), me (entry) |
| My weekly hours | 1, weeks 7–10 |
| Cost | A$0 |
| Depends on | Goal 2, owner-queue 8. |
| Done looks like | `marginTrusted` true — i.e. >50% of orders costed — on the Finance page. |
| Kill criteria | If COGS cannot be obtained by 2026-11-21, delete the margin panels rather than show a figure from 2 of 20 orders. [[Ops App]] already sets that rule. |

- **Structure.** Extend the **`ai-brain-nightly` routine** with a monthly rollup written to `My AI Brain/projects/` — one note per month, four numbers: Num Nums revenue, Yum Yum revenue, hours spent on each, revenue per hour. Reviewed by me monthly and shown to Tarun quarterly. This is the mechanism that stops a 10× asymmetry from going unnoticed for another five months.
- **What could make this the wrong goal.** Yum Yum may be Tarun's business in a way Num Nums is not — if Vaidik has no mandate there, measuring the asymmetry is interesting and unactionable, and the honest move is to say so and drop 5.1.

---

## SEQUENCING — 90 days, 2026-09-07 → 2026-12-05

### Weeks 1–2 (2026-09-07 → 09-19) — unblock everything cheap, in parallel
| Runs in parallel | Serial dependency |
|---|---|
| Restart the ad set (1.1) — **day 1** | — |
| Delete `llms.txt:34`, gate the factory address (4.1) — **day 1** | — |
| Fold the order count into the Morning Digest (2.1) | — |
| Repair the GBP publisher (3.1) | — |
| Rewrite `/indian-sweet` (1.3) | — |
| Fire the whole owner-input queue at once | Blocks 4.2, 3.2, 5.1, 5.3 |

### Weeks 3–6 (2026-09-22 → 10-17) — orders accumulate on their own, read what's ready
- Order volume builds passively (no active project — logging is a given per Vaidik, 2026-09-07).
- Chef ceiling recorded (2.2) — read the moment ~14 days of real orders exist.
- Off-menu flavours + founding year closed (4.2) — parallel, owner-gated.
- Yum Yum site fixes (5.1) — parallel, independent of everything Num Nums.
- Rating markup resolved or deleted (3.2) — hard deadline 2026-09-19.
- **2026-10-06: SEO checkpoint.** Read position/CTR, not impressions. No new URLs and no merges before this date.

### Weeks 7–12 (2026-10-20 → 12-05) — spend against a known ceiling
- Party venues (1.2) — **serial**, gated on 2.2 plus the price list.
- Harris Park diagnosis (5.2) — needs 6+ weeks of order data.
- Cost capture (5.3) — needs the order book populated.
- GBP weekly cadence running unattended (3.1's structure).
- **2026-11-03: second SEO checkpoint.** **2026-12-05: quarter review.**

### The critical path
**Orders accumulate naturally → ~14 days of data → the chef's ceiling is a number (2.2) → party venues can be sized (1.2) and Meta spend can be justified past A$30/day (1.1) → Harris Park is diagnosable (5.2) → COGS and margin become real (5.3).**

Every link is downstream of order volume showing up, which is no longer a task
on Vaidik's list — just a date to check back on (2026-09-30). **Goals 3 and 4
are deliberately off this path entirely** — they run on their own schedule
regardless of how the order book fills in.

---

## THE OWNER-INPUT QUEUE

Cheapest progress available. Total owner time: **~1.5 hours across two people.**
Fire the whole list in week 1 — do not drip it out as each project reaches it.

| # | Question | Who | What it unblocks | Their time |
|---|---|---|---|---|
| ~~1~~ | ~~Will you tell both stores that a cake order not in the app didn't happen?~~ | — | **RESOLVED 2026-09-07 (Vaidik) — not needed. Staff logging every order is a given, no mandate required. Remove from the queue.** | — |
| 2 | Real Google rating + review count, per location, read off the dashboard today | Tarun | Goal 4 class 1 (a live manual-action risk), Goal 3's baseline, GBP Insights access | 10 min |
| 3 | Is 10-12A Wingate Road, Mulgrave the current factory? | Tarun | Site-wide NAP fix + the FACTS gate (Goal 4) | 5 min |
| 4 | Which of these 62 flavours can a customer actually order? (hand him the CSV and a pen) | Tarun + chef | Goal 4.2, `catalog.mjs`, 62 blog corrections | 20 min |
| 5 | Wholesale price for a standardised themed cake, delivered Mon–Thu | Tarun | **The whole B2B lane** (1.2). Retail prices anchor wrong in a B2B pitch. | 30 min |
| 6 | Founded 2017 or 2019? | Tarun | Wikidata `Q140076208`, site schema, ad copy | 1 min |
| 7 | Was the 20%-rasmalai promo authorised, and can it re-run? | Tarun | Project 1.1 — the creative that produced A$6.67 calls | 5 min |
| 8 | COGS per cake size | Tarun + chef | Goal 5.3, every margin figure in [[Ops App]] | 30 min |
| 9 | What changed at Harris Park around 2022 — street, staff, neighbours? | Tarun | Goal 5.2, and the marketing-spend freeze | 20 min |
| 10 | Will you email atParramatta.com to correct the listing? | Tarun | Goal 4 class 5 | 10 min |
| 11 | Current Harris Park arrears position (the A$3,901.86 figure is from March, 6 months stale) | Tarun | Sizes the cash constraint on every budget in this plan | 5 min |
| 12 | Yum Yum: publish indicative prices, or rename the CTA to "Request an Account"? | Tarun | Goal 5.1 | 10 min |
| ~~13~~ | ~~Get all 5 staff/baker phones in one place, so I can install the app myself~~ | — | **RESOLVED 2026-09-07 — no install campaign needed. Remove from the queue.** | — |
| ~~14~~ | ~~Check the adoption counter daily for 14 days~~ | — | **RESOLVED 2026-09-07 — no counter to check; logging is a given. Remove from the queue.** | — |
| ~~15~~ | ~~Is Meta Leads live?~~ | — | **RESOLVED 2026-09-06 by direct query — no. One campaign reads ACTIVE; its only ad set expired 2026-08-28 and it has spent A$0 since 2026-08-27. Remove from the queue.** | — |

---

## WHAT WE DELIBERATELY DO NOT DO

- **No new ops app features.** It is feature-complete and has one row in it. Building more is the most comfortable available form of avoidance and it is the exact pattern this vault documents — 138 commits in 30 days against zero closed real-world loops. The only ops-adjacent code permitted this quarter is the one-line order count added to the Morning Digest (2.1).
- **No Stripe checkout.** It adds *unpredictable* demand with payment already taken, against a chef ceiling nobody has measured; 22 organic clicks/day cannot support a checkout; and it competes directly with Goal 2 for build hours. Revisit when the ceiling is known and there is slack under it. (Consistent with the existing decision to defer the shop by 2–3 months from 2026-08-26.)
- **No YouTube channel and no Reddit.** [[SEO & GEO Status]] is right that these are the ceiling on AI citation (YouTube correlates 0.737). They are also the worst hours-per-outcome available to one 14-year-old with 6 hours a week, and they pay off in quarters, not weeks. Revisit when there is a second pair of hands.
- **No new blog posts** beyond the Tier 1/2 *improvements* already in `blog/topic-ledger.md`. Every new URL confounds the 2026-10-06 checkpoint that the entire 2026-09-01 consolidation exists to read.
- **No blog merges before 2026-10-06** — existing standing rule, still correct.
- **No Meta spend above A$30/day, and none on any creative except the one that hit A$6.67**, until call→order conversion is a measured number. The A$723.88 campaign at A$15.08/call was plausibly unprofitable at a A$65 AOV and 25% conversion; spending more before knowing is how the ad account loses A$2,700 politely.
- **No Harris Park marketing spend** until 5.2 produces a cause or an explicit "none found" — existing rule, but now with a **deadline of 2026-11-03**, because an indefinite freeze pending a diagnosis nobody is running is not caution, it is drift.
- **No re-litigating the `/review` gating.** Decided, owner-carried. Costed once in Goal 3's risk line and not raised again.

---

## WHAT I COULD NOT VERIFY

| Guess | Why it matters | Cheapest check |
|---|---|---|
| **Call→order conversion of 25–40%** [UNVERIFIED — no source in any file] | It is the difference between Meta being the best money the business spends and a A$2,700 donation. It moves Goal 1's whole case. | A paper sheet at each counter for 14 days: date, "did they order". A$0, starts Monday. |
| **AOV A$60–75** [INFERRED from [[Pricing]] list prices] | Multiplies every revenue estimate in the candidate table. | `select avg(price - discount) from orders` — free, the moment Goal 2 lands. |
| **Whether A$6.67/call survives outside Rakhi + a 20% offer** [UNVERIFIED — 3 days of data, festival week, discount attached] | If it does not, the durable number is A$15.08 and Goal 1 may not be worth running. | Run the same creative for 7 non-festival days at A$30/day. ~A$210. |
| **Whether Yum Yum's April 2026 figures still hold** [5 months stale] | Goal 5's entire premise is a 10× asymmetry computed off one stale week. | Open the current month's order spreadsheet. 10 minutes. |
| **Harris Park arrears position** [March 2026, 6 months stale] | Determines whether A$2,700 of quarterly ad spend is prudent or reckless. | Owner-queue 11. 5 minutes. |
| **Whether party venues would buy at any price** [both email drafts unsent since 2026-07-12; zero replies because zero were sent] | The A$14.6k estimate rests on 4 of 17 converting, which is an assumption with no evidence behind it. | Send 6 emails. Free. But gated on the chef ceiling first, deliberately. |
| **How fast order volume actually accumulates** [Vaidik says logging is a given (2026-09-07), but the book held 1 order as of 2026-09-06 and no one is watching the count against a deadline anymore] | Every project on the critical path — chef ceiling, party venues, Meta spend past A$30/day, Harris Park diagnosis — is gated on ~14 days of real volume showing up. If it doesn't, the whole quarter's back half slips silently. | The Morning Digest line (Goal 2, project 2.1) — check it at 2026-09-30 regardless of whether anything prompts a look. |
| **The chef's actual ceiling** [the constraint the whole business is organised around, never measured] | It gates Goals 1.2, 5.2 and every future demand decision. | Ask him. Then check it against ~14 days of data and use the lower. |

---

Related: [[Num Nums Bakery]] · [[Ops App]] · [[Marketing History]] · [[SEO & GEO Status]] · [[Website]] · [[Pricing]] · [[Yum Yum Wholesale]] · [[Wholesale Outreach — Kids Party Venues]] · [[Home Puffs Operation]] · [[Cake Toppers/Cake Toppers|Cake Toppers]] · [[Brand Voice & Tone]]
