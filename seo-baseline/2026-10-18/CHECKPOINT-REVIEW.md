# SEO Checkpoint — 2026-10-18

Mid-point read between the 2026-10-10 diagnosis and the planned 3 Nov decision. Compares
against `seo-baseline/2026-10-10/CHECKPOINT-REVIEW.md` and `plans/SEO Fix Plan — 2026-10.md`.
Raw pulls in this folder: `pull.py` (GSC daily + page + query), `page_recent.json`
(pages, 21 Sep – 18 Oct), `inspect_all.json` (URL Inspection over every sitemap `<loc>`,
same method as `../2026-10-10/inspect_all.py`).

## Verdict

**Normal. Clicks are back to the pre-dip rate and Google's pruning has stopped.** No action
is needed before 3 Nov. Confidence: moderate — under two weeks of recovery data, and there
is no year-on-year control (GSC starts 2026-05-28).

## 1. Clicks (GSC Search Analytics API, `sc-domain:numnumsbakery.com.au`, dataState `all`)

17 Oct is partial and excluded.

| Week | Clicks | Impr | CTR |
|---|---:|---:|---:|
| 14–20 Sep | 215 | 6,899 | 3.12% |
| 21–27 Sep | 192 | 8,378 | 2.29% |
| 28 Sep – 4 Oct (school holidays) | 138 | 7,174 | 1.92% |
| 5–11 Oct | 180 | 7,053 | 2.55% |
| 12–16 Oct (5 days) | 149 | 5,193 | 2.87% |

- 12–16 Oct is ~30 clicks/day ≈ 209/week, against ~200/week before the dip.
- Daily average position 8.8–10.0 over 12–16 Oct (September: ~10–12). The 8 Oct deploy
  (nav, `/cakes` → `/order` 301, shop, form-first `/order`, retitles, improve jobs) shows no
  harm. The dip itself stays attributed to demand/calendar, per the 10 Oct diagnosis.

## 2. Indexing (URL Inspection API, all 240 sitemap URLs)

| State | 10 Oct | 18 Oct |
|---|---:|---:|
| Submitted and indexed | 200 | 201 |
| Crawled – currently not indexed | 35 | 35 |
| Discovered – currently not indexed | 3 | 3 |
| URL is unknown to Google | 2 | 1 |

- **`/locations` is now indexed** (it was "Discovered – not indexed", never crawled; last
  crawl 10 Oct, the day indexing was requested). GSC pages 21 Sep – 18 Oct: 422 impressions,
  position 5.3, 5 clicks. The 10 Oct request worked.
- **No live page dropped out since 10 Oct.** This is the number the fix plan said tells us
  whether pruning has stopped.
- Same 40 unindexed URLs. Only movement besides `/locations`:
  `/blog/eggless-cakes-wentworthville` unknown → Discovered. `/blog/number-cakes-sydney`
  is still "Crawled – not indexed" despite the 10 Oct request.

## 3. What has and has not shipped

- **Fix Plan Phase 1 is not built.** The only commit is the plan document (`ca68cc83`).
  The 24 suburb and 27 topic pages are still live, in `sitemap.xml` (240 URLs), with no
  merge 301s (the `netlify.toml` entries for them are only the `.html` → clean-URL rule).
  `number-cakes-sydney` is not rewritten; `eggless-cake-delivery-sydney` is not retitled
  (373 impressions, position 4.7, 0 clicks over 21 Sep – 18 Oct).
- **A routine improve job touched a "leave alone" page** (`8eff6048`, 15 Oct):
  `eggless-chocolate-cake-sydney` retitled to "Best Chocolate Cake Sydney? …", new FAQ +
  schema, exact-anchor link from `best-cake-sydney`. The plan listed that page as
  *leave alone, decide at 3 Nov* (unindexed, no owner), and allowed improve jobs only on
  pages that already earn clicks. Its stated demand was 151 impressions, position 23.1,
  0 clicks. Not verified whether that commit is published (auto-publish is off). Treat the
  page as changed: do not read its index state on 3 Nov as untouched.
- `/cakes` 301 → `/order` is live (checked 18 Oct). `/cakes` still shows 31 clicks in the
  window, mostly before the redirect; `/order` shows 8. Whether `/order` absorbs that
  demand is not yet visible — re-check at 3 Nov.

## 4. Not checked

- `sitemap.xml` reading **Success** in GSC (the service account cannot see it reliably).
  `sitemap_index.xml` stays until it does.
- GA4 key events (`order_form_submit`, `enquiry_click`) — whether they were marked.
- Brand vs non-brand split and GBP interactions for October.

## Next

3 Nov decision per the plan: index count stable and clicks ~200/week → **stop, round 2 only
for pages Google drops**. Phase 1 (the 51 merges) is still safe to ship — those pages earn
nothing — but nothing here makes it urgent.
