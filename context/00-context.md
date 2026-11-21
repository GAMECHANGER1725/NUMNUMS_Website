Version 3 · Updated 2026-11-21 · Master copy: local folder (this repo, `main`)

# Num Num's Bakery website — context (READ THIS FIRST)

The only place status lives. Rules live in the CLAUDE.md files (root for
site-wide, `ops/`, `shop-app/`, `phone-agent/` per area); business-wide strategy
lives in the AI Brain (`My AI Brain/companies/Num Nums Bakery/`). This file
links to both and copies neither.

## How to use this file
1. It is imported by the root `CLAUDE.md`, so it is already loaded. Read the area CLAUDE.md for what you touch.
2. Before starting, say in one line which decisions below the work depends on.
3. If new work would contradict a decision here, stop and ask Vaidik first. Never quietly change either. When agreed: update the entry, keep a History line, log it.
4. At the end: update Status, Open items and the Change log; bump the version line. Rules go in the owning CLAUDE.md, outcomes in the AI Brain (root `CLAUDE.md` → *Log Everything*).

## The project in short
- **What:** the Num Num's web estate in one repo: public static site (`numnumsbakery.com.au`, 221 blog posts), `/shop` checkout (`shop-app/` → `shop/`, Stripe), `/review`, the staff ops app (`ops.numnumsbakery.com.au`), and a phone assistant (built, not live).
- **Why:** both shops trade below target (Riverstone ~$200–300/day against $700/day — AI Brain *Marketing History*); the site's job is to turn traffic into paid orders, and ops' job is to make every order countable.
- **Mode:** business · **Deadline:** ongoing, rolling horizon to 2027-01-01, next review **2026-12-08** (the SEO read).
- **End product:** live sites on Netlify. Auto-publish is off: Vaidik publishes each build by hand, so pushed ≠ live.
- **Time budget:** [FILL: hours per week Vaidik spends on the website]
- **People:** Vaidik (owns website, marketing, strategy; decides). Tarun Patel (founder; receives order alerts; signs the welcome email). Staff and roles: ops `profiles` table and AI Brain *Staff*.
- **Scope:** this repo only. The claude.ai Project in Claude Desktop handles the non-code side of the business; Yum Yum, cake toppers and the home puffs channel stay out of this file.

## Success criteria
**Goal metric:** paid web orders (live Stripe carts, not cancelled) per week.
- **Target:** [FILL: web orders per week target, and by when]
- **Baseline** (Supabase `orders`, `from_website` + `cs_live_` session, distinct cart, by Sydney week of `created_at`; queried 2026-11-20):

| Week of | 12 Oct | 19 Oct | 26 Oct | 2 Nov | 9 Nov | 16 Nov (partial) |
| --- | --- | --- | --- | --- | --- | --- |
| Web carts | 6 | 1 | 3 | 2 | 1 | 3 |
| All ops orders | 35 | 33 | 31 | 14 | 22 | 33 |

16 web carts in 6 weeks ≈ 2.7/week (inferred from the table). Re-run the same query for every review so the series stays comparable.

**Done means, per piece:** stated in `01-plan.md` beside each piece.

## Numbers ledger
| Figure | Value | Source | Status | Date |
| --- | --- | --- | --- | --- |
| Web carts/week | table above | Supabase query | known | 2026-11-20 |
| Orders/day, all channels | ~4.3 | `phone-agent/CLAUDE.md` (30 days to 2026-11-07) | known | 2026-11-07 |
| AOV | A$93.05 (custom A$102.86, normal A$58.75) | AI Brain *Num Nums Bakery*, 19 orders | known, small sample | 2026-09-11 |
| Custom share / Fri–Sat share | 79% / 74% | same 19 orders | known, small sample | 2026-09-11 |
| Phone share of sessions | 70% (3,264 of 4,671) | GA4, 90 days | known | 2026-10-08 |
| Google rating / reviews | Harris Park 4.2 (666), Riverstone 4.6 (88) | read off both Maps profiles | known | 2026-11-21 |
| AI share of voice | named in 20/20 answers, #1 in 19 (ChatGPT 11, Gemini 9; 7 buying questions) | logged-out test, AI Brain *SEO & GEO Status* | known, partial | 2026-11-21 |
| SEO health | 86/100 | seo-audit routine | known | 2026-09-01 |
| Blog posts on disk | 221 | `ls blog/*.html` | known | 2026-11-20 |
| Prices, sizes, flavours, hours | — | `ops/catalog.mjs` (gated against `verify-blog.mjs` FACTS) | known | live |

Never write a number into a plan or page that is not here or in `ops/catalog.mjs`.

## Status
| Piece | Status | Where | Depends on |
| --- | --- | --- | --- |
| Shop checkout | Done — live since RV-1823 on a `cs_live_` session, 2026-10-13 | `shop-app/CLAUDE.md` | — |
| Roll the leaked live keys | **In progress — blocking** (keys pasted into chat 2026-10-11) | Stripe dashboard + Netlify env | Vaidik |
| Ops app | Done — in daily use since 2026-09-03 | `ops/CLAUDE.md` | — |
| SEO fix plan | On hold until the 2026-12-08 read (core update) | `plans/SEO Fix Plan — 2026-10.md` | 8 Dec read |
| Blog writer routine | Idle — "needs topic" 2026-11-05/12/19 (ledger exhausted, no unowned GSC demand) | `blog/topic-ledger.md` | SEO read |
| GBP posting | Running (automated) | `GBP/` | — |
| Phone assistant | Built, not live — no Twilio number, no voice chosen | `phone-agent/CLAUDE.md` | Vaidik |
| Web push on Tarun's iPhone (VAPID key, bell re-tap) | Parked 2026-11-20 | `ops/CLAUDE.md` | — |
| Make templates showing the cake fields | Parked 2026-11-20 | Make scenario 7790457 | — |
| Festival pre-order email | Parked 2026-11-20 — **the popup still promises it** | `shop-app/CLAUDE.md` (popup) | — |
| "Cake ready" email | Parked 2026-11-20 — the copy promises it | — | — |

## Decisions and why
Project-level calls only. The detailed rule behind each is in the file named on its Rules line.

### Shop-first build (2026-09-11)
- **Decided:** build cart + Stripe checkout as the next major project. **Why:** Vaidik's call, taken against the order-book read that 79% of orders are custom. **Source:** AI Brain *Num Nums Bakery* timeline, 2026-09-11. **Rules:** `shop-app/CLAUDE.md`.

### 50% deposit, refunded in full >24h before collection (2026-09-21)
- **Why:** a made-to-order cake cannot be resold, so a late cancellation is a genuine loss. **Source:** AI Brain *Shop Checkout Build*. **Rules:** `shop-app/CLAUDE.md` → deposit, refund window.

### Shop cakes need 2 days' notice (2026-10-11)
- **Why:** Vaidik: "today I can order a cake for Tuesday and not Monday." **History:** 48h → next day (2026-09-23) → 2 days (2026-10-11). **Source:** `shop-app/CLAUDE.md`.

### No discount codes (2026-10-06)
- **Why:** a first-order code mostly discounts local buyers who would order anyway; one-per-person can only match on email. **Source:** AI Brain *Shop Checkout Build* 2026-10-06. **Rules:** `shop-app/CLAUDE.md` → *No discount codes*.

### No daily cap, so no scarcity claim (2026-10-07)
- **Why:** Vaidik does not want a cap, and without one there is nothing true to count. **Source:** AI Brain *Shop Checkout Build* 2026-10-07.

### No PayPal (2026-09-21)
- **Why:** not available to AU Stripe merchants; it would be a second checkout at 48c more per cake. **Source:** `shop-app/CLAUDE.md`.

### Headings: Cormorant on the customer site, Jost in ops (2026-10-06)
- **History:** Jost headings 2026-09-20 → reversed 2026-10-06 ("on the hero it doesn't look traditional"). **Source:** root `CLAUDE.md` → *Everything is branded*.

### No smooth-scroll library, no reading progress bar
- **History:** Lenis removed 2026-09-21; the pink progress bar removed 2026-10-06. **Source:** `shop-app/CLAUDE.md`, AI Brain *Shop Checkout Build* 2026-10-06.

### Order alerts are web push from ops, free (2026-10-11)
- **Why:** Tarun reads Gmail every 2–3 days; Pushover costs; ntfy routes order details through a public server. **Source:** `ops/CLAUDE.md`.

### Website orders tag themselves; no human step (2026-10-10)
- **Source:** `ops/CLAUDE.md` → `orders.from_website`.

### Phone line: ElevenLabs, calls only, two numbers (2026-11-07)
- **Why:** at ~4.3 orders/day a text sender is not worth running; 0425 697 725 is the transfer target, so it must never forward to the assistant. **Source:** `phone-agent/CLAUDE.md`.

### Review rating split is concealed (2026-09-03)
- **Why:** Vaidik's call. Risk stated once: Google prohibits review gating. **Source:** AI Brain *Website*.

### No structural SEO changes until the 8 Dec read (2026-11-18)
- **Why:** the November core update and the 12 Nov work landed together; more changes would make both unreadable. **Source:** root `CLAUDE.md` → *SEO*.

### CLAUDE.md split by area; this context file added (2026-11-20)
- **Why:** the single file was 146 KB and loaded in full every session. Root is now ~46 KB, and the area files load only where they apply. Moved word for word. **Source:** /restructure, Vaidik 2026-11-20.

## Rulings from other people (dated)
| Date | Who | Ruling | How it reached Vaidik | Replaces |
| --- | --- | --- | --- | --- |
| 2026-10-06 | Vaidik's dad | Approved opening the Stripe account for GNT Ventures | in person (AI Brain *Shop Checkout Build*) | — |

## Consistency map (must match everywhere)
- Prices, sizes, flavours, surcharges, collection hours, ABN/entity: `ops/catalog.mjs` only. `verify-blog.mjs` FACTS gate it.
- Brand colours, fonts, logo, voice: `brand_assets/num_nums_brand_guidelines.html` and the `num-nums-brand` skill. Always "100% eggless"; never "Adult Cakes".
- Nav labels: `Shop Cakes · Indian Sweets · Custom Cakes · Locations · Blog`, identical on static pages and the shop.
- Lead time `LEAD_DAYS`, deposit `DEPOSIT_RATE`: `netlify/lib/shared.mjs`, mirrored for display in `shop-app/lib/cart.ts`.
- Pickup only, everywhere. We do not deliver. We are not halal-certified.
- Rating: 4.6, Riverstone's, always linked to that profile.

## Rules for every piece
- Never invent evidence: numbers, names, reviews, quotes, test results. Use `[FILL: ...]` and list it below.
- Label facts, estimates, inferences and unverified research. Never state an assumption as fact.
- Legal, tax and money questions: give facts and options, look up current rules first, and say Claude is not a lawyer or accountant.
- No money spent, keys changed, messages sent or builds published on Vaidik's behalf without an explicit yes for that action.
- Flag real risk once, briefly; then it is Vaidik's call. Be direct and rate things out of 10.

## Open items only Vaidik (or someone else) can fill
| Item | Who | Needed for | By when |
| --- | --- | --- | --- |
| Roll the `sk_live` and `rk_live` keys pasted into chat on 2026-10-11, and put the new secret in Netlify | Vaidik | security of the live checkout | now |
| [FILL: web orders per week target, and by when] | Vaidik | Success criteria | 2026-12-08 review |
| [FILL: hours per week Vaidik spends on the website] | Vaidik | Plan | 2026-12-08 review |
| The popup promises a festival pre-order email that is parked. Send it, or change the copy in `festPanel`/`done()`. | Vaidik | honest copy | before the next festival pre-order opens |
| Founding year: 2019 on the site and in Wikidata, 2017 elsewhere | Vaidik / Tarun | schema, About | open |
| Should `create-checkout` refuse `sk_test_` keys on the production host? | Vaidik | no free orders on test keys | open |
| Drop the unused `coupons` table and `coupon_person_status()`? | Vaidik | tidy schema | open |
| Sign-up marketing tick: pick one of the compliant opt-in lifts (AI Brain *Shop Checkout Build* 2026-10-08) | Vaidik | marketing list | open |
| Request indexing for `/cakes` in Search Console (the API cannot) | Vaidik | SEO | after 8 Dec |
| `/shop` is still `noindex` (`shop-app/app/layout.tsx`) and missing from the sitemap, though live since 2026-10-13. Flip it + add to sitemap/`llms.txt`? (found 2026-11-21) | Vaidik | SEO, the only page that takes money | after 8 Dec |
| Approve the `orders.heard_from` column (SQL in `shop-app/CLAUDE.md`)? Until then the answer lives in order notes | Vaidik | counting AI referrals | open |
| Re-run the AI test for the failed questions (Indian sweets, wedding, Jain, Diwali, "tell me about Num Num's") + Perplexity, Copilot, AI Overview | Vaidik | complete baseline | 2026-12-08 |
| Every `.md` in the repo root is publicly fetchable (`noindex` only, netlify.toml). Accept, or block internal paths? | Vaidik | privacy of strategy docs | open |

## Ideas parking lot (never in the plan until chosen)
- Popup concepts not chosen 2026-10-08: "spin for a flavour", "how many are you feeding".
- A live "N pickups left" line: only with a real daily cap.
- A next-order perk: only with 4–6 weeks of live order and margin data.
- Bonuses with an order (candle, knife, box): "not now" (2026-10-06).
- Cheaper voice platforms (Vapi, Retell, Bolna, Sarvam): revisit only if the bill hurts.

## Change log
| Date | What changed | Why | Approved by |
| --- | --- | --- | --- |
| 2026-09-03 | Ops app live; `/review` rebuilt | replace WhatsApp relays | from history |
| 2026-09-11 | Shop-first build chosen | Vaidik's call | from history |
| 2026-10-06 | Stripe account; no discount codes; Cormorant headings back | see Decisions | from history |
| 2026-10-11 | Shop lead time 2 days; web push alerts; live webhook | see Decisions | from history |
| 2026-10-13 | First live Stripe order (RV-1823) | checkout live | from history |
| 2026-11-07 | Phone assistant built (not live) | — | from history |
| 2026-11-18 | SEO hold until 8 Dec | core update | from history |
| 2026-11-20 | Restructured from history: CLAUDE.md split by area, context/ workspace added | /restructure | Vaidik |
| 2026-11-21 | AI-visibility baseline; review counts sourced and ratings labelled per shop; WhatsApp review asks per shop in ops; "How did you hear about us?" on cart + `/order` | AI-SEO video, Vaidik: "do all 4" | Vaidik |
| 2026-11-21 | Bing Webmaster Tools set up (Vaidik) | ChatGPT search draws on Bing's index | Vaidik |
