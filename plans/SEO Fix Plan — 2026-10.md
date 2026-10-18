# SEO Fix Plan — October 2026

Written 2026-10-10. Evidence: `seo-baseline/2026-10-10/` (GSC API pulls, URL Inspection
of every sitemap URL, `CHECKPOINT-REVIEW.md`). Next decision point: **3 Nov 2026**.

## The problem, in one paragraph

Two things happened at once in late September, and only one of them is ours to fix.
Clicks fell ~17% because **fewer people searched**: brand searches dropped 24% in
the school holidays, while ranking positions held and Business Profile interactions
stayed flat (Sept 976 vs Aug 955). That part recovers by itself. The part that does
not: **Google is pruning the bulk-written blog.** 30 live pages vanished from search
in September, 14 of them on 22–27 Sep, the opening days of the September spam update,
and 40 of the 240 URLs in our sitemap are not indexed. They are mostly
"Eggless Cakes Near [suburb]" pages and one-off occasion posts — the pattern Google's
spam policy calls doorway abuse ("pages targeted at specific regions or cities that
funnel users to one page") and scaled content. Each one earned almost nothing, so the
click cost is small today. The risk is that a site Google reads as scaled content gets
judged as a whole.

| Fact | Number |
|---|---|
| Clicks from the top 15 pages (7 Sep – 7 Oct) | 90% of 775 |
| Pages that earned any click in that month | 53 |
| Blog posts with under 10 impressions in 31 days | 122 of 234 |
| Live suburb pages still indexed | 52, of which 2 get real traffic (Schofields, Dean Park) |
| Pages Google has dropped or stopped showing | 58 + `/locations` |

## What the fix is not

- **Not mass deletion.** Google: "Deleting content is a last resort." Every page we take
  down is *merged* into a page that covers it, with a 301.
- **Not a reaction to the click dip.** No title or content changes to the pages that
  still earn clicks until 3 Nov.
- **Not fast.** Google says it "could take several months for our systems to learn and
  confirm" a change. Judge Phase 1 at 3 Nov, not before.

## Phase 1 — today, shipped in tonight's publish

Only pages Google has **already** dropped. They earn nothing now, so merging them costs
nothing and removes the doorway footprint.

**1. Suburb pages → the location hub (24 pages).**
Target: `/blog/eggless-cake-bakery-harris-park-riverstone-sydney` — indexed, 1,676
impressions and 30 clicks this month, already ranks ~8 for "eggless cake near me".
Not `/locations`: Google has never crawled it, and pointing 24 redirects at an unknown
page is a bet we don't need to make today. Fold each suburb's name and drive time into
the hub's "Suburbs we serve" section so every redirect lands on a page that names it.

> baulkham-hills, beaumont-hills, beecroft, birrong, bonnyrigg, bossley-park,
> carlingford, clyde, dundas-valley, epping, ermington, northmead, parramatta,
> pendle-hill, pennant-hills, quakers-hill, rosehill, rydalmere, seven-hills,
> smithfield, villawood, wentworthville, westmead, winston-hills
> (all `/blog/eggless-cakes-<suburb>`)

**2. Topic pages → their indexed owner (27 pages).**

| Merge | Into |
|---|---|
| eggless-cake-sydney | best-eggless-cake-shops-sydney-2026 |
| indian-sweets-harris-park-riverstone-sydney | /indian-sweet |
| how-to-design-birthday-cake-sydney, eggless-cake-design-ideas-sydney, eggless-birthday-cakes-every-age-sydney | unique-birthday-cake-ideas-sydney |
| theme-cakes-sydney | kids-birthday-cake-sydney |
| eggless-cupcakes-kids-birthday-party-sydney | eggless-cupcakes-sydney |
| eggless-wedding-cakes-sydney, eggless-cakes-engagement-sydney, tiered-cakes-sydney | wedding-cake-sydney-north-west |
| cake-for-work-anniversary-sydney, eggless-cake-bulk-order-sydney, farewell-cake-sydney | corporate-cake-sydney |
| celebration-cake-sydney | best-cake-sydney |
| natural-ingredients-eggless-cakes | eggless-cake-ingredients-sydney |
| eggless-cake-flavours | eggless-cake-flavour-pairing-guide |
| eggless-cake-vs-tart-sydney | eggless-cake-vs-regular-cake |
| eggless-cake-for-seniors-sydney | eggless-cake-lower-sugar-options-sydney |
| eggless-cakes-first-communion-sydney | christening-naming-day-cakes-sydney |
| push-present-cake-sydney | eggless-cakes-baby-shower-sydney |
| milestone-birthday-cake-sydney | number-cakes-sydney (see 3) |
| eggless-cakes-holi-sydney, eggless-cakes-dussehra-sydney, eggless-cakes-raksha-bandhan-sydney | eggless-cakes-diwali-indian-festivals-sydney |
| eggless-cakes-eid-sydney, eggless-cakes-ramadan-sydney | eggless-cakes-eid-ul-adha-sydney |
| eggless-cakes-filipino-debut-sydney | eggless-cakes-eid-milad-un-nabi-sydney (the multicultural pillar) |

Fold any unique fact (a date, a price, a serving size) into the target before
redirecting. A redirect to a page that does not mention the topic is a soft 404.

**3. Keep and rewrite, not merge (1 page).** `number-cakes-sydney` had real demand
("number cake(s) sydney", 281 impressions in 90 days, 12 clicks before it dropped). Cut
it to a tight page with the real sizes and prices, absorb milestone birthdays, and
re-request indexing.

**4. Leave alone this round (6 pages)** — no indexed owner exists, so a redirect would
be a soft 404: eggless-cakes-christmas-sydney, eggless-cakes-mothers-day-sydney,
eggless-cakes-fathers-day-sydney, spring-cake-sydney, how-to-choose-cake-sydney,
eggless-chocolate-cake-sydney (its home is the shop's Chocolate page once `/shop` is
indexable). Decide at 3 Nov.

**5. Mechanics, all of them** (the lessons from the September round):
- 301 both clean and `.html` forms in `netlify.toml`.
- Remove each from `sitemap.xml`, `llms.txt` and the `blog/index.html` cards.
- Repoint internal links to the target — **absolute and relative**. The September audit
  reported clean while 680 relative links still hopped.
- `node verify-blog.mjs` green, then a local redirect check of every pair.

**6. Retitle `eggless-cake-delivery-sydney`** so the snippet says pickup-only. It ranks
3–6 for "pennant hills cake delivery" with 0 clicks: we do not deliver.

**7. After Vaidik publishes:** `node indexnow.mjs` for every retired URL and its target.
In Search Console, request indexing for the hub and `number-cakes-sydney`.

Result: 234 → 183 blog posts (51 merged). Every one removed is a page Google had already set aside.

## Phase 2 — 13 Oct to 3 Nov: measure, change nothing structural

Weekly, from the same scripts (`seo-baseline/2026-10-10/pull.py`, `inspect_all.py`):
- **Index count** in GSC Pages, and whether any more live pages vanish. This is the
  number that tells us if the pruning has stopped.
- `sitemap.xml` reads **Success** in GSC → then remove `sitemap_index.xml`.
- Brand vs non-brand clicks (demand), Business Profile interactions (demand), and GA4
  key events from organic. `order_form_submit` and `enquiry_click` count from
  2026-10-10.
- `/locations` crawled yet?

The only content work allowed: the weekly routine's one improve job, on a page that
already earns clicks.

## Status — 2026-10-18 (checkpoint, before the 3 Nov decision)

Clicks are back (~209/week pace, 12–16 Oct), the index count is stable (201 of 240; no live
page lost since 10 Oct) and `/locations` is indexed — so Phase 3's "index count stable and
clicks back to ~200/week" branch is where this is heading. **Phase 1 has not been built**:
no merges, redirects or sitemap removals exist in the repo. The 15 Oct improve job rewrote
`eggless-chocolate-cake-sydney`, one of the six "leave alone" pages — it is no longer
untouched. Full numbers: `seo-baseline/2026-10-18/CHECKPOINT-REVIEW.md`.

## Phase 3 — 3 Nov decision

| If… | Then… |
|---|---|
| More pages kept vanishing after 13 Oct | Round 2: merge the suburb pages still indexed but earning under ~25 impressions a month (≈45 pages) into the hub. Keep Schofields and Dean Park. |
| Index count stable and clicks back to ~200/week | Stop. Round 2 only for pages Google drops. |
| The six "leave alone" pages are still unindexed | Merge into the nearest seasonal or topical page, or write a real owner. Christmas first, before December. |

Also decide at 3 Nov: should `/locations` (the commercial page) and the blog location
hub become one page? Two location hubs is itself duplication, but the blog hub is
the one that ranks.

## Standing rules (also for the routines)

1. **No new location pages and no new one-occasion posts.** A new URL needs an open
   ledger gap or a cited GSC demand number; a suburb name is neither.
2. A page Google crawled and declined is **merged**, never re-requested until something
   on it has changed.
3. One change per publish where possible. Phase 1 ships together because those pages
   earn nothing; everything after it is attributable.
4. **"Near me" queries are not cannibalisation.** Google shows a different page for each
   searcher's location, so many URLs for "eggless cake near me" is expected. Measure
   cannibalisation on non-local head terms ("eggless cakes sydney": 14 URLs).

## Open questions

- Is the September dip in walk-in trade too? (Only the ops order book was checked: flat.)
- Do we want the shop indexable before Christmas? Flavour posts should redirect to
  product pages at that point, which is Phase 4 rather than this plan.
