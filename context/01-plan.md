Version 1 · Updated 2026-11-20 · Master copy: local folder (this repo, `main`)

# Num Num's Bakery website — plan (rolling horizon to 2027-01-01)

Status does NOT live here. Status is in `00-context.md`. This file holds the dates, the order and the gates.

## Key dates
| Date | What | Source |
| --- | --- | --- |
| now | Roll the leaked live Stripe keys | `00-context.md` Open items |
| 2026-12-01 | SEO routine runs. It reports only and does not restructure. | root `CLAUDE.md` → SEO |
| **2026-12-08** | SEO read after the November core update. Also the review of this plan and the web-orders target. | root `CLAUDE.md` → SEO |
| 2026-12-22 (Tue) | Last order day for Christmas Eve pickup (two days' notice) | root `CLAUDE.md` → Christmas page |
| 2027-01-01 | End of this horizon: write the next plan | — |
| 2027-01-22 | Stripe Radar Standard trial ends and bills itself; switch back to Lite if it appears | `shop-app/CLAUDE.md` → Stripe settings |

## Time budget
- [FILL: hours per week Vaidik spends on the website] × 6 weeks.
- Honest read: the plan below is small on purpose, because the SEO hold freezes structural work until 8 Dec.

## Pieces in order
| # | Piece | Done when (the gate) | Needs from Vaidik | Rough hours |
| --- | --- | --- | --- | --- |
| 1 | Roll the leaked live keys | Old `sk_live`/`rk_live` keys are revoked in Stripe. The new secret is in Netlify Production env. One live checkout succeeds after the next publish. | All of it. Claude cannot write Netlify env vars. | 0.5 |
| 2 | Set the web-orders target | The `[FILL]` in Success criteria holds a number and a date | the number | 0.1 |
| 3 | Weekly web-orders read | The baseline query in `00-context.md` re-run each week and appended to its table | — | 0.2/week |
| 4 | Christmas readiness | The Christmas owner page dates are right for 2026, and the shop calendar offers the days the kitchen can do | the Christmas 25/26 hours | 1 |
| 5 | 8 Dec SEO read | Read written to `seo-baseline/`; the hold lifted or extended, with the reason in root `CLAUDE.md` | sign-off on what to change | 2 |
| 6 | Re-decide the parked items | Each parked row in Status is Live, Parked again with a date, or Dropped. The festival-email promise is either kept or the copy changed. | the calls | 0.5 |

## Real-world evidence schedule
| Evidence | From whom | When | For which piece |
| --- | --- | --- | --- |
| Google review count off the profile | Vaidik | any time | homepage claim (Open items) |
| Christmas-period trading hours | Vaidik / Tarun | before 2026-12-15 | 4 |

## If we run late
Cut in this order: 6 (parked items wait another cycle; cost: the popup keeps an unkept promise), then 4 (the page stays as rewritten on 12 Nov; cost: unconfirmed holiday hours), then 3 (cost: no weekly series). Never cut 1.
