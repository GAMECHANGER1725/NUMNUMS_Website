# CLAUDE.md — Frontend Website Rules

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Before Editing
- **Pull from GitHub first.** At the start of any message that asks you to change something in the
  website's files, run `git pull` before making edits, so you're working from the latest commit —
  other sessions/routines push directly to `main`. Skip this for read-only questions that involve
  no file changes.

## Project Overview
Static multi-page HTML site for Num Nums Bakery (100% eggless cakes + Indian sweets, Sydney).
No bundler/framework for the main site — `index.html`, `cakes.html`, `order.html`, `about.html`,
`indian-sweet.html`, `locations.html`, `privacy-policy.html`, and every `blog/*.html` post are
single self-contained files (inline Tailwind + a vanilla-JS `<script>` block, no build step).
`reviews-app/` is a separate Next.js project — see its own `AGENTS.md` — whose static export is
deployed as the `review/` directory; treat it as an independent subproject, not part of the static site.
`ops/` is also independent: the internal staff app on its own Netlify site and subdomain (see **Ops app** below).

## Commands
- Dev server: `node serve.mjs` → `http://localhost:4000`. Mirrors `netlify.toml`'s clean-URL
  redirects (`.html` → extensionless), so local testing hits the same paths Google/Netlify see.
- Screenshot: `node screenshot.mjs http://localhost:4000[/path] [label]` → saves to `temporary screenshots/`.
- Blog integrity check: `node verify-blog.mjs` — validates blog invariants (index cards, sitemap.xml,
  llms.txt, no duplicate slugs/images) against what's on disk. Run after any blog batch or merge.
- IndexNow ping (after a prod deploy is live): `node indexnow.mjs [url ...]` or `--dry` to preview.
- Tailwind rebuild — only needed for the handful of pages that link `/style.css` (compiled from
  `src/input.css`; most pages use the Tailwind CDN script instead): `npx tailwindcss -i src/input.css -o style.css`.
  No `package.json` script wraps this — run the CLI directly.
- `reviews-app/`: `cd reviews-app && npm run dev|build|lint` (own `package.json`, own Next.js toolchain).
- Ops app checks: **`node ops/verify.mjs`** — the ops site's Netlify build command, so a failure
  blocks that deploy the way `verify-blog.mjs` blocks the public one. Runs `ops/stats.test.mjs`
  (aggregation + Sydney date logic) plus static checks: every module parses, no inline `<script>`
  (the ops CSP forbids it), every id `$()` reaches for exists, **every helper `app.mjs`
  calls is actually imported**, and `catalog.mjs` still matches `verify-blog.mjs`'s `FACTS`. Local URL is `http://localhost:4000/ops/` — **the trailing slash
  matters**, see **Ops app** below.
- There is no test suite or lint config for the main static site. `verify-blog.mjs` is the closest
  thing to a test for blog content; there is nothing equivalent for the other static pages.

## Architecture
- **netlify.toml** is the source of truth for redirects, rewrites, and CSP headers — check it before
  assuming a route exists or a third-party script/fetch will work in production (CSP is stricter than
  localhost, see the CSP memory notes below).
- **Blog** (`blog/*.html`, ~360 posts): each post is a standalone file. `blog/index.html` holds the
  card grid with topic filters. A new post must land in three places — `blog/index.html`, `sitemap.xml`,
  `llms.txt` — or `verify-blog.mjs` fails.
- **GBP automation** (`GBP/`): per-location posting rules (`gbp-posts-harris-park.md`,
  `gbp-posts-riverstone.md`), `image-bank.md`, and a `posts-queue.md`/`used-images.txt` dedup ledger.
  `.github/workflows/gbp-post.yml` watches `GBP/outbox/*.json` on push and relays queued posts to a
  Make.com webhook.
- **Reviews**: `netlify/functions/submit-review.js` (Netlify Function) forwards review submissions to
  a Make.com webhook. `reviews-app/` is the Next.js review form; its static export is the `review/` dir.
- **Ops app** (`ops/`): internal order log / baker queue / analytics for staff, backed by Supabase.
  Its own Netlify site, its own `ops/netlify.toml`, its own CSP. See the dedicated section below.
- **Skills**: project-local skills live in `skills/<name>/`, symlinked into `.claude/skills/<name>/`
  for auto-discovery — see "Skill Resolution" below before editing any skill.
- Content workflows (blog, GBP, SEO audit) are largely cloud-routine-driven — the rest of this file
  is their non-negotiable rule set.

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.
- **Invoke the `blog-write` skill** before writing any blog post, every session, no exceptions — including scheduled/cloud routine runs. Never hand-write a post by copying an existing one from `blog/`.
- **Invoke the GBP rules file** before writing any Google Business Profile post: read `GBP/gbp-posts-harris-park.md` or `GBP/gbp-posts-riverstone.md` and complete its **Anti-repetition check** before drafting.

## Skill Resolution — read this before writing content
Project skills live as real, git-tracked files under **`skills/<name>/`**. Each is symlinked from
`.claude/skills/<name>` so it is auto-discovered and invocable by name. **Both the real file and
the symlink are tracked**, so cloud routines get the skill too.

`.gitignore` ignores `.claude/*` but negates `!.claude/skills/`. It must be `.claude/*`, not
`.claude/` — git will not descend into an excluded directory, so a negation under it never fires.
Do not "simplify" that back to `.claude/`; it silently un-tracks every project skill.

- ✅ Edit `skills/<name>/SKILL.md` (or via the symlink — same file).
- ❌ Never edit `~/.claude/plugins/cache/…` — version-pinned, wiped on plugin update, absent in the cloud.
- ⚠️ Symlinking a skill under `.claude/skills/` is now **correct and required**. (Older guidance here
  forbade it because `.claude/` was fully ignored. That is fixed — see the negation above.)

### `blog-write`
Source of truth: `skills/blog-write/SKILL.md`. The cloud routine reads it and appends new checklist
patterns after every post. If the loaded skill does **not** contain a section titled *"Num Nums
Bakery HTML Project — Non-negotiable Pre-publish Checklist"*, you have the generic plugin version.
**Stop and read `skills/blog-write/SKILL.md` directly before writing.**

### `seo-audit`
Source of truth: `skills/seo-audit/`. A **verbatim, byte-for-byte vendored copy** of the `claude-seo`
plugin v2.0.0 (`agricidaniel-claude-seo`), used by the NumNums-SEO-Weekly routine because plugins
are not installed in the cloud sandbox. See `skills/seo-audit/VENDORED.md`.

- ❌ **Never edit anything under `skills/seo-audit/`.** It must stay identical to upstream so the
  0–100 health score is comparable week over week and against upstream.
- Project-specific rules (eggless-only scope, Wikidata `sameAs`, sitemap/`llms.txt` as Critical)
  belong in the **routine prompt**, which passes them to the skill as input — never baked into the
  skill.
- Requires `pip install requests beautifulsoup4 lxml`. It is not stdlib-only; `scripts/fetch_page.py`
  exits immediately without them.

## Ops app (`ops/`) — internal, not part of the public site

Staff-facing order system at **ops.numnumsbakery.com.au**. Replaces cake orders being relayed
through the two WhatsApp groups, and gives Vaidik and Tarun real numbers instead of estimates.

**It is a separate Netlify site off this same repo**, with base directory `ops`, so Netlify reads
`ops/netlify.toml` and **never** the root one. Do not add ops routes, headers or CSP entries to the
root `netlify.toml` — that file is the public marketing site only. Auto-publish is off, same as the
main site.

- **Files**: `ops/index.html` (markup + all CSS), `ops/app.mjs` (views, rendering, forms),
  `ops/db.mjs` (every Supabase call), `ops/stats.mjs` (pure date + money logic),
  `ops/stats.test.mjs`, `ops/catalog.mjs` (canonical sizes/flavours, mirrors `verify-blog.mjs`'s
  `FACTS`), `ops/supabase/functions/purge-photos/` (photo retention job).
- **Print jobs** (`print_jobs` table, "Prints" tab): a cake needing 3D toppers or a photo print
  gets a job pointing at its **order id** — never a re-typed brief or a second photo upload. Admin
  and baker only; staff cannot read the table at all. The baker may change the status of a `photo`
  job and nothing else — enforced by `guard_print_job_updates()`, not by the UI. A cake needing
  both gets **two rows**, one per kind (they finish at different times and belong to different
  people) — the form just creates both in one pass. Marking an order **baked** or **picked up**
  interrupts with a reminder listing its prints; that interrupt is the whole point of the feature,
  so do not "streamline" it away.
- **Navigation**: the tab bar holds Orders, New, To bake, Prints and **More**, which opens the
  drawer. More is a tab like the rest — same `.tab` class, so it inherits the bar's font, colours
  and active pill — and it hides itself when a role has no groups (the baker sees four). It reads
  as current whenever a drawer view is on screen. Everything read at the end of a day lives behind
  it as drawer groups — Analytics (Finance / Customers / Data, all from one 63-day fetch), Customers
  (Directory), Staff, Export. Each group declares its own `roles`, and the button hides itself when
  a role has no groups. Add new reporting as another leaf, not a fifth tab.
- **Export** writes CSV in the browser via `toCsv`/`csvCell` in `stats.mjs`. Both hazards it closes
  are tested: a comma or quote in a cake's wording would shift every later column, and a value
  starting `= + - @` is executed as a formula by Excel and Sheets. Do not "simplify" that escaping.
- **The staff page is read-only.** Roles and store scoping are what RLS enforces; they get changed
  in Supabase so the change is deliberate, not by an admin mis-tapping their own row.
- **Every card shows Custom or Normal beside its pickup time** (`kindTag` in `app.mjs`, used by
  the order log, the baker's queue and the print board). A normal cake carrying no tag meant a
  blank had to be read as "normal", which is what an unloaded card also looks like.
- **The baker's queue defaults to both stores.** Baking is central, so the combined list is the
  working view; the per-store tabs are for loading a van or checking one shop's book.
- **Design photos are a list, not a photo.** `photo_paths` holds every reference
  picture the customer sent; `photo_path` is the cover, and it is what the dockets,
  the print board and the retention rule read — none of them need to know there are
  others behind it. Read them with `orderPhotos(o)`, which falls back to `photo_path`
  for rows written before the column existed. `photos_to_purge()` returns one row per
  *file*, so a multi-photo order hands storage every key.
- **The order-time calendar greys the future; the pickup calendar greys the past.**
  Same `mountDuePicker`, opposite `back` flag. An order can only have been placed
  before now and a cake can only be collected after it, so one direction is wrong on
  each field — greying yesterday on Order time was telling staff the opposite of the truth.
- **The receipt is a compliant tax invoice, not a thank-you note.** Two obligations land
  on that one page and `receipt.mjs` carries both. A **tax invoice** (GST Act s29-70) must
  show the words *tax invoice*, the seller's identity **and ABN**, the issue date, a
  description with quantity and price, the GST amount, and the extent to which the sale is
  taxable — and at **$1,000 and over** the buyer's identity too, which is why the customer's
  name prints on every one of them. A **proof of transaction** (ACL sch 2 s100), compulsory
  at $75 and up, additionally wants the *date of supply* — the pickup, not the day it was
  typed — so both dates are printed. Cakes and confectionery are taxable food, prices are
  entered GST-inclusive, so GST is 1/11 of the total worked in whole cents.
- **One company, two shops.** Both trade as **GNT Ventures Pty Ltd, ABN 39 634 402 412**,
  registered for GST. The seller's identity and ABN live on `BUSINESS` in `db.mjs`; only the
  address comes from the store. An earlier version put a second entity on Harris Park,
  matched off the ABN register by trading name and postcode — it looked convincing and it
  was wrong, and a wrong ABN makes the document useless for the customer's own GST claim.
  **Never infer these two fields; confirm them with Vaidik.** If the business ever stops
  being GST-registered, `gstRegistered: false` drops the heading to *Invoice* and removes
  every GST line, because a document headed *tax invoice* showing GST that was never
  collected is a different kind of problem from a typo.
- **The design photos ride on the invoice.** They settle "this is not what I asked for" at
  the counter, which a written description never wins. They are re-encoded through an RGB
  canvas at 720px before embedding (`photoForPdf`) for two reasons: the stored file is a few
  hundred KB and three of those make an invoice nobody wants to receive, and a canvas
  guarantees three channels, which is what lets the PDF declare `/DeviceRGB` — a greyscale
  original embedded raw comes out wrong. A photo that fails to load is skipped, never
  fatal: a purged photo must not cost the customer their invoice. Six is the cap and the
  rest are counted on the page; the layout stops before the footer because a receipt is one
  page.
- **The invoice is shared as a file, never downloaded and then shared.** Sharing it out of
  a phone's PDF viewer puts a `blob:https://…` URL in the message beside the attachment —
  a link that 404s on every device except the one that made it, and it was going to
  customers. `sendReceipt` hands `navigator.share({ files })` the File and nothing else:
  no `text`, no `url`, or the link comes straight back. Desktop has no file share and
  still saves it, which is why the button reads its label off `SHARE_FILES` rather than
  guessing from the user agent. The share sheet only opens while the tap is still fresh,
  so the design photos are fetched and shrunk **when the sheet opens**, not when the
  button is pressed — an `await` of a two-second fetch in between spends the gesture and
  iOS refuses. Keep that prefetch wherever the button lives.
- **Every reference photo shows at once; none of them swipe.** The detail and print sheets
  were a full-width scroll-snap carousel, which on a phone shows one picture and hides the
  rest behind a horizontal gesture inside a vertically scrolling sheet — a four-photo order
  read as a one-photo order, on the screen the baker works from. It is a grid, and each
  photo opens full size in a tab (`hydrateThumbs` fills the wrapping `a[data-full]` with the
  same signed URL). On the invoice a single row of photos takes all the height the page has
  left rather than a fixed 132pt: it was printing 35mm thumbnails into 90mm of white space.

- **Binary in a PDF whose xref is counted in characters is the quiet failure.** Every offset
  in `toPdfSource` counts characters, and the file is written Latin-1, one byte per
  character — so a JPEG must go in via `bytesToLatin1`, never through `TextEncoder`. Get it
  wrong and the file opens in one reader and is rejected by the next. The test walks **every**
  xref entry and asserts it lands on its `N 0 obj`; the first entry alone does not catch it,
  because the offsets that drift are the ones after the binary.
- **The PDF is written by hand** (`receipt.mjs`) — no print dialog and no library. A popup could not print itself (the CSP has no inline script) and a PDF
  library off the CDN is ~350KB on a page staff open over shop wifi, the same reason the
  charts are hand-rolled SVG. Two things in there will break silently if touched: every
  xref offset counts **characters**, because the file is written out as Latin-1 one byte
  per character — counting UTF-8 bytes puts the table three bytes out for every em dash
  and produces a file some readers open and others reject; and non-ASCII text goes
  through the WinAnsi map, so a character with no entry is dropped rather than emitted
  as a broken glyph. `stats.test.mjs` renders a $49.99 / $25.00 order and asserts
  **$49.99, $25.00 and $24.99** all reach the page, plus that the xref lands on `1 0 obj`.
- **Order numbers start at 1725, not 1.** `HP-0003` on a receipt tells a customer how new
  the software is, not how long the shop has been trading. The two sequences were set
  forward; nothing else knows or cares what the number is.
- **Nothing about an order is ever lost.** `order_events` records every insert, status
  change and field edit — old value, new value, who, when — written by an AFTER trigger
  so it cannot be forgotten at a call site, and readable by admins only. `cancelled_at`
  exists for the same reason: cancelling used to be the one status change that left no
  time behind. The 90-day log window is only what a phone downloads; Supabase keeps
  everything, and search and date ranges reach the whole book server-side.
- **PostgREST stops at 1000 rows and does not raise.** A query past the cap returns a short array
  with the truth only in `Content-Range`, so a list silently loses rows. Two ways out, and the
  choice matters: bound the query, or page it with `pageAll()`. Results that must be complete —
  the bookkeeper export, the analytics figures (`listOrders({ complete: true })`), print jobs —
  are paged. Results that only need to be current are bounded: the order log is 90 days plus every
  still-open order (`includeOpen`) and is itself paged, with search and date ranges server-side
  (`searchOrdersRemote`, `ordersDueBetween`) so a lookup still reaches the whole book. Anything
  left unbounded goes through `capped()`, which warns.
- **An `.in()` filter puts every id in the URL.** A thousand uuids is a ~37KB query string; the
  request fails and every cost comes back missing, which the page renders as "no costs recorded"
  rather than as an error. `attachCosts` chunks at 200. Chunk any new `.in()` over a growing list.
- **Overlays own the back button.** Opening a sheet or the drawer pushes a history entry so
  Android's back gesture closes it instead of walking out of the app mid-order; closing any other
  way pops that entry so history never fills with dead steps. `popstate` is a no-op when nothing is
  open — that is what makes our own `history.back()` safe. Any new overlay must go through
  `pushOverlay` and take a `{ fromHistory }` argument, or back will leave the app again.
- **`catalog.mjs` is the only place a price is written down.** `pricingGaps` takes the lookup as
  an argument rather than importing it, so `stats.mjs` stays pure and there is never a second copy
  of the price list to drift. Only shortfalls are flagged — a premium flavour can only push a
  price up, so flagging "above list" would report every Rasmalai as an error.
- **Say when a number is too small to act on.** `cancellationStats` returns `confident`, false
  until both compared groups have ten orders behind them, and the panel prints a caveat instead of
  a recommendation. Any future panel that invites a decision — a policy, a price, dropping a
  flavour — owes the reader the same guard; a two-cake difference on a handful of orders looks
  exactly like a pattern.
- **The photo purge has no other watchdog.** `photosToPurge` in `stats.mjs` mirrors
  `photos_to_purge()` in Postgres exactly, and the Data page shows anything overdue. The cron
  reports success as soon as `pg_net` dispatches the call, so a job that fires nightly and deletes
  nothing is indistinguishable from a healthy one — a photo still present past its date is the only
  honest signal. If you change the retention rule, change it in both places and re-check they agree.
- **Phone first, but not phone only.** Card lists (`.docket-grid`, `#cust-list`) go two-up from
  720px for the counter tablet and Vaidik's laptop; below that nothing changes. Audited at 320 /
  375 / 430 / 820 / 1440 for horizontal scroll, overflow and sub-32px tap targets — re-run that
  sweep after any layout change rather than eyeballing one width.
- **Sign photo URLs in a batch** (`photoUrls`), never one per thumbnail. A docket list is the
  common case and a call per cake made eighteen round trips before the first picture appeared.
  Storage answers per path, so a deleted photo returns its own error and the rest still resolve.
- **A missed import is invisible until the right card renders.** It is not a parse error
  and not a missing id — it is a ReferenceError thrown the first time the line runs.
  `netPrice` shipped that way: the order log was fine on a store with no orders and blew up
  the moment a real one appeared, so it read as bad data rather than bad code. `verify.mjs`
  now cross-checks every name the helper modules export against what `app.mjs` imports and
  calls. When editing that check, do **not** try to strip quoted strings out of `app.mjs`
  first — an apostrophe in `Num Num's` inside a template literal opens a string that never
  closes, swallows whole functions, and turns the check green while the bug is still there.
  Strip comments only.
- **A lapsed sign-in is not a dead connection.** Both arrive as a rejected promise and
  they need opposite advice: "the shop internet may be down" sends staff to reboot a router
  that is fine, and Try-again reruns the same dead token forever. `isAuthError` in `db.mjs`
  tells them apart (401/403, `PGRST301`, or a gotrue refresh failure); `orFallback` spends
  one silent `refreshSession()` on it — the phone-slept-through-the-expiry case — and only
  if that fails paints **Signed out** with a sign-in button. It deliberately does *not*
  fall back to the held copy for an auth failure: that would leave someone reading
  yesterday's queue behind a banner blaming the wifi, with every write silently failing.
- **The error screen prints the reason.** It used to go only to `console.warn`, which
  nobody on a phone will ever open, so every report arrived as "it says nothing loaded" and
  could not be told from any other cause. `errorDetail` puts the code, HTTP status and
  message under the retry button. Keep it: it is the only diagnostic that reaches the
  person who saw the failure.
- **Shop wifi drops; the app must not.** `render()` catches every view failure and paints a retry
  state — without it a rejected fetch left the view on "Loading…" for the rest of the shift. A
  failed refresh falls back to the held copy (`orFallback`) with a banner saying so, because the
  baker mid-shift still needs the queue from two minutes ago. `expireCaches()` marks copies stale
  with a flag and never discards them, or the fallback has nothing to fall back to.
- **Filtering never refetches.** The order log (per store), the baker's queue and the analytics
  payload are each cached in `app.mjs` and invalidated by `writeStamp`. Search, date ranges and
  the bake store tabs filter what is already in memory — typing a four-letter name used to cost
  sixteen round trips. Only a store the cache has not seen, a write, or a stale copy hits the
  network. Show "Loading…" only on a real fetch, or the list strobes on every keystroke.
- **The three analytics pages share one fetch**, cached in `app.mjs` and invalidated by
  `writeStamp` in `db.mjs`, which every mutating query bumps. Add the bump to any new writer —
  a cache each caller has to remember to clear is one the next caller forgets. The pages carry a
  visible "Updated …/Refresh" row because a cache the reader cannot see is one they cannot trust.
- **Charts** are hand-rolled inline SVG in `app.mjs` (`takingsChart`, `weeklyStoreChart`) — no
  charting library: the CSP allows one CDN and a bundle would be the heaviest thing on a page
  staff open over shop wifi. The two series colours (`#A03D5E`, `#C08A2E`) were picked by running
  candidates through a colour-blindness check; the obvious rose/sage pairing failed at ΔE 5.7
  under deuteranopia. Re-run that check before changing them. Every chart ships a `chartTable`
  under it — the numbers are the accessible record.
- **A warning panel must be actionable.** Every data-gap row (`fixRow`) is a button carrying an
  order id, wired by the same `wireDockets` the log uses, so tapping it opens the order to fix.
  Naming a problem and leaving the reader to search the log for it is not a warning, it is a note.
- **Margin figures always carry their coverage.** `storeBreakdown` and `productMix` compute margin
  from only the orders with a cost recorded and return `costedCount` / `marginTrusted` beside it;
  the UI mutes the number and says so when under half the orders are costed. Never surface a
  margin without that caveat — a rate from two of twenty cakes reads as fact and is not one.
- **Leaderboards and repeat-customer rate read the `customers` view, not the 63-day analytics
  fetch.** A "gone quiet" board computed off that window is permanently empty by definition.
- **`ordered_at` vs `created_at`.** `ordered_at` is when the customer placed the order;
  `created_at` is when someone typed it in, shown as **Log time**. They differ whenever an order
  is relayed off WhatsApp later. Read it as `orderedAt(o)` (`ordered_at ?? created_at`) — null
  means nobody recorded it, which is true of rows from before the column existed. **Analytics
  still buckets sales on `created_at`**; switching them to the order time is a separate decision
  because it moves every historical figure.
- **The discount can be typed in dollars or percent; only dollars are stored.**
  `linkDiscount` in `app.mjs` ties the two boxes together and is used by both the logging
  form and the edit panel. A percentage of a price that later changes is not a fact about
  the sale, so the receipt states money and nothing else — a customer cannot check "16.7%
  off" against what they handed over. Which box was last touched decides what happens when
  the **price** changes: someone who typed "10%" means ten percent, so the dollars move;
  someone who typed "$10" means ten dollars, so the percentage moves. Two rules that look
  redundant and are not — guessing one way is wrong half the time. The box being typed in
  is never rewritten (rounding $8.999 to $9.00 and feeding it back rewrites "10" as
  "10.001" under the cursor), and out-of-range values are clamped on blur rather than
  mid-keystroke. `linkDiscount` also paints **quietly** on construction: firing its
  `onChange` there reached `payMode` before its `let` ran and took the whole form down
  with a ReferenceError.
- **`price` is the list price; `discount` is what came off it.** What the shop earned is
  the difference, and every revenue figure in `stats.mjs` goes through **`netPrice(o)`** to
  get it — one definition, so the two can only disagree in one place. Folding the discount
  into the price instead would make it unmeasurable the moment it was entered, which is the
  entire point of the column. Three things follow and each is tested: `paidOn` treats a
  collected cake as having paid the *discounted* amount; GST on the invoice is 1/11 of what
  was actually charged, never of the list price (charging tax on money nobody paid
  overstates the liability and hands the customer a credit they are not owed); and
  `pricingGaps` deliberately keeps reading the **list** price, because a logged discount is
  a decision and flagging it would bury the shortfalls nobody logged. The `customers` view
  sums net into `spend` and gives `discount_given` alongside.
- **Money is never rounded.** One `money` formatter, cents always shown. A whole-dollar variant
  turned a $130.50 cake into "$131" and quietly skewed every total; do not reintroduce one.
- **Local testing**: `node serve.mjs`, then `http://localhost:4000/ops/` **with the trailing slash**.
  Without it the browser resolves `./app.mjs` against `/` and the modules 404. In production the app
  sits at the subdomain root, which is why every internal reference is relative and the page links
  no `/style.css` — it is fully self-contained.
- **No inline `<script>`.** The ops CSP has no `'unsafe-inline'` in `script-src`, so page logic must
  stay in `app.mjs`. Inlining it breaks in production only, never on localhost.
- **Supabase project** `stnmoxsojqbbtgjwkzrc` (Sydney). The key in `db.mjs` is the *publishable* key
  and is meant to be public; what guards the data is RLS plus signups being disabled. Never put a
  service-role key in `ops/` — the purge function gets one from its own environment.
- **Roles are enforced in Postgres, not the UI**: staff are scoped to their own store(s), the baker
  can only change status, and `cost` lives in a separate admin-only `order_costs` table because all
  users share one Postgres role and per-column grants cannot separate them. Hiding a field in the UI
  proves nothing — anyone with the publishable key can call the REST API directly.
- **Times are Sydney-local everywhere** via `stats.mjs`. Never bucket dates in UTC: it moves evening
  pickups into the wrong day and week. `node ops/stats.test.mjs` guards this.
- `verify-blog.mjs` does not cover `ops/`, and `ops/` never belongs in `sitemap.xml` or `llms.txt`.

## Anti-Repetition (blog + GBP)
Repetition is the #1 recurring failure on this project. Before writing anything:
- **Blog:** `ls blog/` first. Never write a post for a suburb that already has one. Read `blog/topic-ledger.md` before picking a topic — it replaces the old "check the last 10 posts" grep as of 2026-09-01, after the prior calendar-driven process produced 359 posts with no demand validation and real cannibalization (see `blog-cluster-report.md` / `blog-gsc-per-page.md` in the repo root). Topic selection rules live in `skills/blog-write/SKILL.md`'s "Topic selection" checklist item — a topic must come from an open ledger gap or a GSC-validated query, never a fixed calendar.
- **GBP:** follow the Anti-repetition check in the location's rules file — last 6 suburbs, last 6 angles, and a random unused image from `GBP/image-bank.md`.
- **Images:** run the image-reuse grep in the blog-write checklist. A stock ID reused across posts is a failure, not a shortcut.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:4000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/nateh/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:4000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:4000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Deployment Workflow
- GitHub → Netlify sync is automatic (Netlify builds on push), but **Netlify auto-publish is OFF** —
  the user publishes each build manually via the Netlify UI, so a push does not go live by itself.
- **Auto-push every code edit.** At the end of any response where you edited code (not docs-only
  changes like this file, memory, or planning notes), `git add` the edited files, commit, and
  `git push` to the current branch — no need to ask first. Use a concise commit message describing
  the change; do not batch unrelated edits from earlier in the conversation into one commit unless
  they're part of the same change.
- Still confirm before anything destructive or history-rewriting (force-push, `reset --hard`,
  amending a pushed commit) — auto-push covers ordinary forward commits only.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
