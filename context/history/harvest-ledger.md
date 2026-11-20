# Harvest ledger (2026-11-20 restructure)

Every item filed into `00-context.md`, with where it came from. No claude.ai chat history was searchable from Claude Code. The sources are the repo's CLAUDE.md files, Claude Code memory, the AI Brain notes, `plans/`, `docs/`, git log and one Supabase query.

| # | Item | Type | Source | Date | Who said it | Supersedes # | Filed to |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Shop-first build | decision | AI Brain *Num Nums Bakery* | 2026-09-11 | user | — | Decisions |
| 2 | 50% deposit, 24h refund | decision | AI Brain *Shop Checkout Build* | 2026-09-21 | user | — | Decisions |
| 3 | Shop lead time 48h | decision | `shop-app/CLAUDE.md` | before 2026-09-23 | user | — | History line |
| 4 | Shop lead time next day | decision | `shop-app/CLAUDE.md` | 2026-09-23 | user | 3 | History line |
| 5 | Shop lead time 2 days | decision | `shop-app/CLAUDE.md` | 2026-10-11 | user | 4 | Decisions |
| 6 | No discount codes | decision | AI Brain *Shop Checkout Build* | 2026-10-06 | user | — | Decisions |
| 7 | No daily cap / no scarcity line | decision | AI Brain *Shop Checkout Build* | 2026-10-07 | user | — | Decisions |
| 8 | No PayPal | decision | `shop-app/CLAUDE.md` | 2026-09-21 | user | — | Decisions |
| 9 | Jost headings | decision | root `CLAUDE.md` | 2026-09-20 | user | — | History line |
| 10 | Cormorant headings back, ops stays Jost | decision | root `CLAUDE.md` | 2026-10-06 | user | 9 | Decisions |
| 11 | Progress bar stays | rule | memory `feedback_lenis_smooth_scroll` | 2026-09-21 | memory | — | retired (memory corrected) |
| 12 | Progress bar removed | decision | AI Brain *Shop Checkout Build* | 2026-10-06 | user | 11 | Decisions |
| 13 | Web push alerts, not Pushover/ntfy | decision | `ops/CLAUDE.md` | 2026-10-11 | user | — | Decisions |
| 14 | Website orders auto-tagged | decision | `ops/CLAUDE.md` | 2026-10-10 | user | — | Decisions |
| 15 | Phone: ElevenLabs, calls only, two numbers | decision | `phone-agent/CLAUDE.md` | 2026-11-07 | user | — | Decisions |
| 16 | Review split concealed | decision | AI Brain *Website* | 2026-09-03 | user | — | Decisions |
| 17 | SEO hold until 8 Dec | decision | root `CLAUDE.md` | 2026-11-18 | user | — | Decisions |
| 18 | Stripe account approved | ruling | AI Brain *Shop Checkout Build* | 2026-10-06 | other: Vaidik's dad | — | Rulings |
| 19 | Web carts/week baseline | number | Supabase query | 2026-11-20 | file | — | Success criteria |
| 20 | AOV, custom/Fri–Sat shares | number | AI Brain *Num Nums Bakery* | 2026-09-11 | file | — | Numbers ledger |
| 21 | 70% phone sessions | number | `shop-app/CLAUDE.md` (GA4) | 2026-10-08 | file | — | Numbers ledger |
| 22 | ~4.3 orders/day | number | `phone-agent/CLAUDE.md` | 2026-11-07 | file | — | Numbers ledger |
| 23 | Riverstone target $700/day | number | AI Brain *Num Nums Bakery* | undated | memory | — | The project in short (Why) |
| 24 | ~360 blog posts | number | root `CLAUDE.md` | pre-2026-09-01 | file | — | superseded by 25 |
| 25 | 221 posts on disk | number | `ls blog/*.html` | 2026-11-20 | file | 24 | Numbers ledger |
| 26 | Checkout status "next: test-card purchase" | status | memory `project_focus_data_perfection` | 2026-10-06 | memory | — | retired (memory corrected) |
| 27 | Checkout live, RV-1823 | status | AI Brain *Shop Checkout Build* | 2026-10-13 | file | 26 | Status |
| 28 | Leaked live keys need rolling | open item | AI Brain *Shop Checkout Build* | 2026-10-11 | file | — | Status + Open items (confirmed live 2026-11-20) |
| 29 | Festival pre-order email | open item | `shop-app/CLAUDE.md` | 2026-10-08 | file | — | Status: Parked (2026-11-20) |
| 30 | Cake-ready email | open item | AI Brain *Shop Checkout Build* | 2026-10-06 | file | — | Status: Parked (2026-11-20) |
| 31 | VAPID key + bell | open item | AI Brain *Shop Checkout Build* | 2026-10-13 | file | — | Status: Parked (2026-11-20) |
| 32 | Make templates map cake fields | open item | `shop-app/CLAUDE.md` | 2026-10-11 | file | — | Status: Parked (2026-11-20) |
| 33 | Test-key guard | open item | AI Brain *Shop Checkout Build* | 2026-10-11 | Claude-suggested | — | Open items |
| 34 | Drop `coupons` table | open item | `shop-app/CLAUDE.md` | 2026-10-06 | file | — | Open items |
| 35 | Founding year 2017 vs 2019 | open item | AI Brain *Num Nums Bakery* | undated | file | — | Open items |
| 36 | Review count unsourced | open item | root `CLAUDE.md`, `shop-app/CLAUDE.md` | 2026-11-01 | file | — | Open items |
| 37 | Marketing tick opt-in alternatives | open item | AI Brain *Shop Checkout Build* | 2026-10-08 | Claude-suggested | — | Open items |
| 38 | `/cakes` reindex request | open item | root `CLAUDE.md` | 2026-11-12 | file | — | Open items |
| 39 | Public `.md` files (noindex only) | open item | `netlify.toml` comment | 2026-10-01 | file | — | Open items |
| 40 | Unchosen popup concepts, N-left line, next-order perk, bonuses, other voice platforms | idea | `shop-app/CLAUDE.md`, `phone-agent/CLAUDE.md` | 2026-10/11 | user / Claude-suggested | — | Ideas parking lot |
| 41 | Web orders/week as the goal metric | decision | /restructure answer | 2026-11-20 | user | — | Success criteria |
| 42 | Split CLAUDE.md by area | decision | /restructure answer | 2026-11-20 | user | — | Decisions |
