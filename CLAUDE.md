# CLAUDE.md — Frontend Website Rules

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Before Editing
- **Pull from GitHub first.** At the start of any message that asks you to change something in the
  website's files, run `git pull` before making edits, so you're working from the latest commit —
  other sessions/routines push directly to `main`. Skip this for read-only questions that involve
  no file changes.

## Verify Before Deciding
- **Every big decision, plan, or action gets verified with deep contextual online research first** —
  not answered from memory or training-data assumptions. "Big" means anything that changes strategy,
  spends money, ships to production, or would be expensive to reverse (pricing changes, new tech/vendor
  choices, SEO/marketing strategy shifts, architecture decisions, legal/compliance claims). Search for
  current, specific, sourced information relevant to the actual decision — not a generic search, one
  that would change the recommendation if it turned up something contrary.
- Routine code edits, small bug fixes, and content that follows an existing pattern in this repo don't
  need this — use judgement, and when unsure, research.

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
- Google sign-in check: `node check-google-signin.mjs [url]` — loads the sign-up page and
  fails if Google refuses the origin. The button renders whether or not it works, so this
  is the only honest signal.
- IndexNow ping (after a prod deploy is live): `node indexnow.mjs [url ...]` or `--dry` to preview.
- Tailwind rebuild — only needed for the handful of pages that link `/style.css` (compiled from
  `src/input.css`; most pages use the Tailwind CDN script instead): `npx tailwindcss -i src/input.css -o style.css`.
  No `package.json` script wraps this — run the CLI directly.
- `reviews-app/`: `cd reviews-app && npm run dev|build|lint` (own `package.json`, own Next.js toolchain).
- Ops app checks: **`node ops/verify.mjs`** — the ops site's Netlify build command, so a failure
  blocks that deploy the way `verify-blog.mjs` blocks the public one. Runs `ops/stats.test.mjs`
  (aggregation + Sydney date logic) plus static checks: every module parses, no inline `<script>`
  (the ops CSP forbids it), every id `$()` reaches for exists, **every helper `app.mjs`
  calls is actually imported**, every guided-tour target still exists, and `catalog.mjs` still
  matches `verify-blog.mjs`'s `FACTS`. Local URL is `http://localhost:4000/ops/` — **the trailing slash
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
- **`plans/`**: business/strategy plans (quarterly plans, roadmaps, decision docs — not code plans
  or PR descriptions). See **Business plans** under Deployment Workflow below for where these live
  and how they're kept in sync.

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
  `FACTS`), `ops/help.mjs` (help page content + the guided tour),
  `ops/supabase/functions/purge-photos/` (photo retention job).
- **Print jobs** (`print_jobs` table, "Prints" tab): a cake needing 3D toppers or a photo print
  gets a job pointing at its **order id** — never a re-typed brief or a second photo upload.
  **The kitchen ticks a job off; the counter reads the board.** The baker and an admin may both
  mark any job printed — the split that gave the baker photo prints and withheld 3D toppers only
  meant a finished topper sat unticked until someone asked Vaidik to tap it, and both machines
  are in the same room. What the baker still cannot touch is the **brief**: the what, the notes
  and the order a job points at stay admin-only, because those are the record of what the
  customer asked for, not of what has been done. Enforced by `guard_print_job_updates()`, not by
  the UI; `canPrintStatus()` matches it exactly. A cake needing
  both gets **two rows**, one per kind (they finish at different times and belong to different
  people) — the form just creates both in one pass. Marking an order **baked** or **picked up**
  interrupts with a reminder listing its prints; that interrupt is the whole point of the feature,
  so do not "streamline" it away.
- **The app teaches itself, because nobody sits a new hire down with it.** `help.mjs` holds
  both halves: a **Help page** behind the `?` in the top bar, and **twelve walkthroughs** that
  cover every job a role can do — logging an order box by box, adding a print job, handing a
  cake over, the baking queue, the analytics caveats, the export. A walkthrough spotlights
  **live elements**, not screenshots, so it cannot go stale the way a picture of the app does.
  - **Navigation is part of the walk, not done behind the reader's back.** A step carries
    `do:` — `view:<v>` (or `view:home`), `drawer`, `new-order`, `new-print`, `first-order`,
    `first-print` — performed by `tourAct` in `app.mjs` as the reader advances *onto* it, so
    the step before it spotlights the button they would have pressed and says "tap Next and it
    will open it". Logging an order starts on the **New** tab; the directory walks More →
    Customers → Directory one tap at a time. Being teleported into the order form teaches
    nothing about how to get there, which is what the first version did.
  - `tourAct` returns a **sentence instead of `true`** when it cannot — an empty order book has
    nothing to open — and the walk stops there saying why.
  - **What it opens matters.** `richestOrder()` prefers a cake that has photos *and* an
    outstanding print, because a step whose target is missing is skipped — open a bare normal
    cake and the walk loses its photo step and its print warning, the two things hardest to
    explain in words. `teachablePrint()` picks a job the role may actually tick off.
  - `reveal` clicks the controls that unhide the rest of a form (the order form is hidden until
    a kind is picked; a drawer group must be expanded), and it **skips anything already
    `aria-pressed` or `aria-expanded`** — these are toggles, and clicking the print kind the
    board was already showing turned it *off* and hid both briefs.
  - **Never print a step count.** A step whose target is not on this screen is skipped as the
    walk reaches it, so any total is wrong on a quiet day — the Help page once said "11 steps"
    and gave the baker five. The card counts up (`Step 3`) and the last button says Done.
  - The spotlight is **clamped inside the viewport**. A target taller or wider than the phone —
    the customer list, a full-width drawer row — otherwise drew a ring with one edge off the
    display, which reads as a broken box rather than a highlight.
  - Steps carry their own optional `roles`, so one list covers everyone. Target elements must
    be **rendered synchronously**: `#edit-trail` and `#status-actions` fill after a fetch, so a
    step pointed at an id that is still an empty div is skipped. Point at the block, not the
    thing that arrives later.
  - Seen-state is keyed by **user id**, not by phone: the counter tablet is shared and the
    second person to sign in on it needs the intro as much as the first.
  - Every help section and tour declares `roles`, and those lists have to track `TABS`/`MENU`
    and the RLS behind them — showing a baker the invoice button teaches them a thing the
    database will refuse, which is worse than showing nothing.
  - `verify.mjs` fails the build if a step points at an id that no longer exists, if a section's
    `tour:` names a walkthrough that is not there, if a `do:` is one `tourAct` cannot perform,
    or if a walkthrough never navigates at all. Every one of those fails *silently* at runtime:
    the step is skipped, the button never renders, the walk opens nothing.
  - Help is a **view, not a sheet** — it is read while you try the thing it describes — and the
    `?` toggles back to where you were.
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
  working view; the per-store tabs are for loading a van or checking one shop's book. It carries
  the **same date filter as the order log** — "what have we got on for the long weekend" is the
  same question in the kitchen — driven by the one `#range-cal` panel, which reads `rangeOf()` /
  `setRange()` for whichever of `RANGE_VIEWS` is on screen. The two ranges are held separately:
  checking Saturday's baking must not silently narrow the order log you left behind. The counts
  on the store tabs follow the filter, because tabs reading the untouched total beside a list
  showing four cakes is worse than no count at all.
- **Marking a cake baked is not a one-way door.** `listToBake()` returns everything still to make
  *plus* anything baked in the last day, and `bakerSections` files those under one trailing **Just
  baked** heading with the most recent first. Before this the cake left the queue on the tap, and
  the baker has no order log to go and find it in — a mistap needed an admin. Postgres always
  allowed the baker `placed`; only the query stopped them. Two things follow: the label carries no
  date (it spans a day of bakes, like Overdue), and `rank()` still reads a number out of a day
  label, so a non-day label must never reach it — `stats.test.mjs` covers a queue of nothing but
  baked cakes for exactly that.
- **A status stamp is cleared when the status moves back past it.** `stamp_order_status()` used to
  write `baked_at` and never clear it, so a cake put back to *placed* kept a Baked row on its
  timeline, and a second bake kept the first one's time (the `is null` guard) — which would have
  dropped it out of the undo window a day after a bake that never happened. It now clears
  **only going backwards**: `baked_at` when a cake returns to placed, never when it moves on to
  arrived, because the stamps are a history and a collected cake must keep the time it was baked.
  `cancelled_at` is the exception — cancelled is not a stage on the way anywhere, so un-cancelling
  clears it. `log_order_event` skips these columns, so clearing one writes no spurious edit row.
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
- **The invoice downloads from its own URL, because a phone will not save a blob.**
  A programmatic click on a blob the page built is a **silent no-op** on iPhone in
  Safari and Chrome both — the button highlights and nothing happens, which shipped
  twice before the cause was found; the share sheet was the second attempt and staff
  could not find *Save to Files* in it. So `invoiceUrl` uploads the PDF to the private
  **`invoices`** bucket and hands back a signed URL carrying `download=`, which answers
  `Content-Disposition: attachment`. Every browser saves that, and the page does not
  navigate. One object per order, overwritten on reissue; admin-only, because the file
  has the customer's name and phone on it. Do not "simplify" this back to a local blob
  — it works on the laptop you test it on and nowhere the shop actually uses.
- **A tiered cake's size is its tier list.** `Bottom 8"w 6"h · Top 6"w 6"h`, written
  into the same `size` column as `8 inch`, because every screen, the export and the
  invoice already print that field and a stacked cake has no single number to put in
  it. `catalog.mjs` owns the format (`tierText`/`parseTiers`, and `TIERED` as the
  dropdown code that reveals the boxes); the round trip is what lets the edit panel put
  a saved order back into the boxes. There is deliberately **no price** on it — a build
  is quoted, so `basePrice` returns null, nothing autofills, and `pricingGaps` skips it
  rather than reporting every tiered cake as underpriced. On the invoice a size over 14
  characters drops to its own line under the description, or it runs under the QTY
  column.
- **The counter can see the print board; only the kitchen changes it.** `print_jobs`
  read now also passes for anyone who can see the order it points at — the `EXISTS`
  runs under the caller's own policy on `orders`, so a one-store staff member gets one
  store's jobs with no second scoping rule to keep in step. Writes stay admin/baker,
  and `canPrintStatus` matches that exactly: offering staff a button the database will
  refuse is worse than not offering it.
- **Removing a photo deletes the file first, then the row.** The purge job finds files
  *through* the row, so a row that has already forgotten a photo leaves it in storage
  for good. Done in this order a half-failure leaves a listed photo that will not load —
  visible, and fixed by removing it again. Deleting is two taps like deleting a print
  job, because the button sits on top of a picture someone is trying to look at.
- **Storage read is granted by the order, and the order has more than one photo.**
  `cake_photos_read` matched `orders.photo_path` — the cover — so every *other* photo
  was readable only by `owner = auth.uid()`, the person who uploaded it. It therefore
  worked perfectly for whoever added the photo and was broken for everyone else: Vaidik
  saw two pictures, Tarun saw one and a placeholder, and the invoice Tarun generated had
  one picture on it. The policy now also matches `= any(o.photo_paths)`. Any new rule
  over that bucket must read the **list**, and any check of it has to be run as a second
  user — as the uploader, a broken policy looks fine.
- **A photo is raced, never awaited.** `photoForPdf` gives each one ten seconds and then
  gives up on it. Safari under memory pressure does not fail `toBlob`, it simply never
  calls the callback, and the invoice button sat disabled on "Building the invoice…"
  forever with no error to report. An invoice with no pictures beats a button that does
  nothing.
- **A normal cake shows the cake, not a grey disc.** Only a custom order has a design
  photo, so every normal one used to sit behind the ◍ placeholder — on a board where the
  picture is how staff find a docket at a glance. `thumbHtml` falls back to the flavour's
  own product shot in **`ops/cakes/`**, and `cakeImage` in `catalog.mjs` derives the
  filename from the flavour rather than keeping a second list to drift; `verify.mjs` fails
  the deploy if a flavour has no file. It is deliberately **never** used for a custom
  cake — a stock Vanilla standing in for a design someone drew looks like an answer and is
  not one — and it carries no `data-photo`, so the signing pass ignores it and it can never
  reach `orderPhotos` or an invoice. The files are the website's product images resized to
  480px (824KB of originals down to 304KB); re-cut them the same way, since the biggest use
  on screen is a 52px thumbnail.
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
- **Deleting an order is not cancelling it.** Cancel is a thing that happened to a real
  order and it belongs in the cancellation rate; an order that should never have existed —
  a double entry, a test, the wrong shop — is a data-entry mistake, and leaving it as a
  cancellation quietly tells the shop customers are backing out. `deleteOrder` is admin
  only (`orders_admin_delete`, which is `is_admin()` in Postgres — verified by deleting as
  staff and as the baker and watching the row survive), two taps in the UI, and takes the
  costs, prints and the order's whole event trail with it by cascade. It removes the photos
  **first**, because storage is only reachable through the row. A `before delete` trigger
  keeps the whole row as jsonb in **`deleted_orders`** with who did it — nothing in the app
  reads that table except the **Deleted orders** panel on the Data page, which lists what
  went, who took it off and when — verified end to end: a $499.99 order deleted through the
  app dropped the takings tile by exactly $499.99, the order count by one, and vanished from
  the customer directory, because every figure is computed from the live `orders` table and
  `deleteOrder` bumps `writeStamp`, which expires all four caches.
- **The takings panel draws one metric at a time, on purpose.** Takings, orders, average
  order and discounts are three different units, and putting two of them on one chart means
  two y-scales, which is the single worst thing a chart can do. So the four figures sit in
  tiles across the top with their change against the previous thirty days, and the tapped
  one is the line underneath — which is why the panel fetches **sixty** days for a
  thirty-day chart. Colour therefore encodes nothing about identity (the tile says what is
  drawn), so it is used for kind instead: rose for money, gold for a count. `change` is
  **null**, not zero, when the previous period was empty — "up 100%" from nothing is not a
  fact. The lift under the line is a gradient fill plus a fat soft stroke rather than an
  `feDropShadow`, because a filter re-rasterises the whole path on every redraw and this
  one redraws on a tap, on a phone.
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

## Accounts — the category name, the mobile, and the second sign-in

- **The online range is "Signature Cakes".** Internally the DB still says
  `kind: 'normal'` and that stays — renaming an enum across ~15 call sites and
  the `customers` view buys nothing. The customer-facing name pairs against
  **Custom Cakes**: Signature is ours to design, Custom is yours. "Shop" was a
  placeholder that said nothing about what was behind it, and `verify-blog.mjs`
  now fails the deploy if it comes back.
- **The mobile is required, at sign-up and at checkout, and on the server.**
  It is how the shop says a cake is ready and the only way to reach somebody
  about their own order, so a web order without one is one nobody can chase.
  `create-checkout` re-checks it — the browser's `MOBILE_RE` is a courtesy.
- **Verification is an eight-digit code, not a link, and it signs them in.** A
  link opens a *different tab*, so the tab they filled the form in never learns
  they confirmed and sits on "check your email" forever; they come back, find
  it unchanged, and sign in again. `verifyOtp({ type: 'signup' })` returns a
  session, so entering the code **is** signing in, and nobody is ever asked to
  sign in twice. ⚠️ **This needs the Supabase "Confirm signup" email template
  to contain `{{ .Token }}`** — the default only has `{{ .ConfirmationURL }}`,
  and with that template the email carries a link and no code, which makes the
  box unanswerable. There is no way to detect it from the client. Done
  2026-09-15: the template now carries the code and **no link at all**, because
  a link left in beside it reintroduces the very stuck-tab bug the code exists
  to avoid.
- **Editing that template at all requires custom SMTP.** Since 3 June 2026 a
  free-tier project on Supabase's built-in email provider cannot edit its auth
  email templates — the Source button and Save are simply disabled, and the
  default link-only template is what sends. So the code flow was unreachable
  until SMTP existed; it was never a setting someone forgot to change. Mail now
  goes through **Resend** (free tier, 3,000/month and 100/day) as
  `orders@numnumsbakery.com.au`, DKIM/SPF/DMARC on Netlify DNS, SMTP host
  `smtp.resend.com:465`, username `resend`, password a **sending-only** API key.
  Turning custom SMTP on also lifted the auth email rate limit from **2/hour to
  30/hour** — the built-in provider's 2/hour is not a shop, it is a demo.
- **"Email OTP length" in Supabase and `CODE_LEN` in
  `shop-app/components/ui/verify-email.tsx` must always agree — both are 8.**
  The project's OTP length was already 8 when this was first wired up, but the
  box was hard-coded `CODE_LEN = 6`, with `maxLength`, a `.slice(0, CODE_LEN)`
  on input, and an auto-submit the moment six digits are typed. A customer read
  `18924560` off the email, the field silently kept `189245`, submitted it
  itself, and answered *"That code doesn't match"* — forever, with nothing in
  the UI naming the cause. Fixed by raising `CODE_LEN` to 8 to match Supabase
  (not by lowering Supabase to 6) on 2026-09-15. Verified end to end: signup →
  delivered → eight-digit code → `verifyOtp` → session with
  `email_confirmed_at` stamped, no second sign-in. **Changing either number
  without the other breaks the box**, and it breaks silently in exactly this
  way — grep both sides before touching either.
- **The account menu is two states and no dead ends.** Signed out it offers
  sign in / create an account; signed in it names the address and offers the
  way out. It deliberately has **no "My orders"** — there is no order-history
  page, and a menu item that opens nothing is worse than an absent one. Add it
  the day that page exists, with `customer_user_id` and its RLS policy.
  The static version is injected by `promo.js` (same reason as the cart badge:
  it is the only script on all 243 pages) and reads the session by matching
  `sb-*-auth-token`, including the newer `base64-` prefixed shape.
- **The nav collapses to the hamburger at 1024px, not 640px.** Six labels plus
  the cart pill need ~950px; the old 640px breakpoint was already tight and
  "Signature Cakes" tipped a 768px tablet into a horizontal scroll. The static
  rule is injected by `promo.js` as a **separate** media query — widening the
  existing one would drag the trust-bar and hero rules along with it.

## No OS controls, anywhere

A native `<select>` or `<input type="date">` hands its list to the operating
system — a grey iOS wheel, an Android system sheet, in somebody else's
typeface. On a site this deliberately styled it is the one control that looks
like another app. `order.html` replaced its own long ago; the shop now does too.

- **`verify-blog.mjs` fails the deploy** on a native `<select>`, `type="date"`
  or `type="time"` in `shop-app/**/*.tsx`, on a static page with a `<select>`
  and no `.nd-*` enhancer, and on an enhancer with no `fit()`. All three are
  two-line mistakes that are invisible until somebody taps the control.
- **The shop uses `NnSelect` and `NnDateField`** (`shop-app/components/ui/`),
  built on **Base UI** — already a dependency, so no new one. A listbox has to
  answer type-ahead, Home/End, PageUp/Down, Escape, focus return and
  `aria-activedescendant`; hand-rolling that is how a keyboard user ends up
  unable to buy a cake. The calendar grid *is* hand-written, because a month of
  buttons does not need a library — only its positioning does.
- **A popup must fit the screen, and that is two properties, not one.** Base UI
  publishes `--available-height` *and* `--available-width`; reading only the
  height is how the calendar came to hang 12px off the right edge of a 320px
  phone while passing every height check. `.nd-menu` sets `max-width`, the lists
  set `max-height`, and `.nd-cal-day` carries **no** `min-width` — seven cells
  have to divide whatever the narrowest phone gives them.
- **The static enhancer measures before it opens.** `fit()` in `order.html`
  compares the room above and below the field, flips to `.nd-up` when below is
  smaller, and caps the height to what is actually there. Before it, the menu
  was a fixed 264px pinned under the trigger and opened straight off the bottom
  of the page. It re-fits on resize and scroll.
- **The calendar picks its month when it opens, not on mount.** The cart is
  empty on the first paint (`useSyncExternalStore`'s server snapshot), so a
  one-time `useState` init read no date at all and a customer who had chosen
  3 October reopened on September.
- **Greyed days are the rule made visible**: inside the 48-hour lead time, or
  past the 120-day horizon. A date you can pick and the server then refuses
  reads as a broken form rather than as a rule.
- Audited open at 320×568, 430×740, 900×420 and 1440×900, on the store list,
  the ten-entry time list and the calendar: all inside the viewport, scrolling
  inside themselves, no tap target under 32px. Re-run that sweep after touching
  either component.

## Product cards — what a claim is allowed to say

- **Every badge is a fact from the order book or an opinion marked as ours.**
  They live in `shop-app/lib/badges.ts` with the sample they came from
  (`ORDER_BOOK`: 32 orders, counted 2026-09-13). "Most ordered" is Chocolate
  because it was 41% of everything sold; "Most ordered" on the 8" size chip is
  47% of orders. `verify-blog.mjs` scans the built `shop/` for urgency language
  a static page cannot know is true — *selling fast*, *only N left*, *ends in*,
  *N people viewing* — and fails the deploy on any of it. That is not caution
  for its own sake: the ACCC fined three retailers in June 2025 over misleading
  sale claims and the ceiling is $50m per breach.
- **At most one claim badge per card, and at most three on the board.** Neither
  The Cheesecake Shop nor Bannos badges individual products on a collection page
  at all — both put the claim in a section heading instead. Baymard's list-item
  research is why: a list item holds a few attributes before it stops being
  scannable. The gate enforces the cap.
- **Premium and a claim never share a card.** Premium says why it costs more, a
  claim says why you'd choose it, and two chips on one tile is clutter — so
  `assertPickIsNotPremium` throws during `next build` if "Our pick" is moved
  onto a premium flavour. The two badges live in different files, so the
  mistake is otherwise invisible.
- **The board's first row is merchandised, not sorted.** It holds the three
  most-ordered flavours **and both premiums** — Rasmalai and Ferrero Rocher are
  the highest-value cakes and the two a chain bakery cannot sell, and Ferrero
  was sitting at position 15 where nobody scrolls. The flavour carrying "Our
  pick" follows them, because a recommendation nobody sees recommends nothing.
  Everything after is popularity order, where it decides nothing. `HERO` in
  `shop-app/app/page.tsx`.
- **The cakes are cut-outs on white and need a shadow we add ourselves.**
  `.cake-ground` is an ellipse that deliberately **overlaps** the plate rather
  than sitting under it: six of the fifteen stand on a white board whose lower
  half is white-on-white, so a shadow placed neatly below the measured edge
  floats free of anything the eye can see and reads as a smudge. That was the
  first attempt and it looked worse than none. Photos also carry a light
  `contrast(1.04) saturate(1.06)` — deliberately small, because a product
  image that flatters beyond the real cake is its own ACL problem.
- **Where a cake sits in its tile is measured, not eyeballed.** The fifteen
  product shots were taken at two aspect ratios and the cake sits at a different
  height in each, so the 2:3 ones floated in an `aspect-square` tile.
  `shop-app/lib/cake-framing.ts` holds an `object-position` per flavour that
  puts every cake's **base** on a common line at 93% of the tile. Re-derive it
  with `node shop-app/tools/measure-cake-framing.mjs` (dev server up) after
  adding or replacing a photo — the script prints the tightest headroom, and a
  negative one means a photo is being clipped.

## Site structure — a shop with marketing around it

Modelled on how The Cheesecake Shop and Bannos actually lay their sites out:
**product entries first in the nav, story and policy in the footer, blog last.**
Both put every marketing page (our story, awards, franchising, store locator)
in the footer only, and lead the homepage with products before any story.

- **The nav is `Shop · Our Cakes · Indian Sweets · Custom Cakes · Locations ·
  Blog`, plus the cart pill.** It is identical on all ~243 static pages and is
  re-created in React by `shop-app/components/ui/shop-header.tsx`, so the shop
  is not a second-looking website. `verify-blog.mjs` fails the deploy if a page
  drifts out of that shape — the markup has a dozen whitespace variants across
  those files, so a page that misses an edit looks completely normal and just
  quietly keeps sending people to the old door.
- **`/shop` and `/cakes` are different intents, not two doors.** `/shop` is the
  transaction — 15 product pages, a cart, a card. `/cakes` is inspiration:
  weddings, kids, baby showers, the flavour FAQ, the serving calculator. Its
  URL, and every internal link to it, is untouched deliberately: it is an old
  indexed page and this site has already paid once for cannibalising itself.
  Do not merge them and do not point both at the same queries.
- **`About` left the nav and lives in the footer**; the footer also leads with
  **Shop Cakes**. Nothing was deleted — an orphaned page loses the internal
  links it ranks on.
- **`/order` is labelled "Custom Cakes", because that is what it is.** It is the
  quote form for a cake somebody draws, not the shop. The old label "Order
  Online" promised the shop and delivered a form, which is the single most
  expensive wrong word on the site.
- **The success page is `/shop/thank-you`, not `/shop/order`** — that collided
  with `/order` in every conversation about this site. It is Stripe's
  `success_url`; renaming it means changing `create-checkout.mjs` too.
- **The cart follows you off `/shop`.** `paintCart` in `promo.js` paints the
  header pill on every static page from the same `nn_cart_v1` key the Next app
  writes (same origin). It lives in `promo.js` because that is the only script
  already on all ~243 pages, and it runs **above** the popup's suppression
  guards — those stop the popup, not the cart. Empty it reads "Order Now" and
  opens `/shop`; with cakes in it, "Your order (2)" opening `/shop/cart`. The
  static nav hides that pill entirely under 640px, which is right for a CTA and
  wrong for a cart, so a non-empty one comes back as a filled chip via CSS
  `paintCart` injects once.
- **`/shop` is `noindex` while the checkout is unfinished** (`shop-app/app/
  layout.tsx`), which is why it is not in `sitemap.xml` or `llms.txt`. It has to
  be flipped at cutover, or the shop-first structure points at a page Google
  cannot see. That is the same switch as the Stripe live keys.
- Checkout deliberately renders **no nav** — nav in a payment flow is an exit,
  and neither chain puts one there either.

## Shop (`shop-app/` → `shop/`) — the customer-facing checkout

Normal cakes are bought online and paid for in full; custom cakes are still quoted
by a person through `/order`. `/order` is the **single fork** between the two — do not
add a second entry point to the shop elsewhere, or the two have to be kept in step.

- **`netlify/functions/` holds deployable functions and nothing else.** Netlify bundles
  **every** file in there as a function, so a test file fails the deploy twice over — a v1
  function bundles to CommonJS and cannot do top-level await, and a dot in the filename is
  an illegal function name. Tests live in `tests/`, shared helpers in `netlify/lib/`, and
  `verify-blog.mjs` fails the build if either strays back. Routes are declared in
  `netlify.toml`, never in a `config.path` export as well.
  Reproduce a deploy's bundling locally with
  `npx @netlify/zip-it-and-ship-it netlify/functions /tmp/out` before pushing function changes.
- **The two function generations do not share a return shape, and mixing them is a
  silent 502.** `subscribe`, `check-coupon`, `create-checkout` and `order-status` are
  **v2** (`export default async (req)`) and must return a **`Response`** or `undefined`;
  `stripe-webhook.mjs` and `submit-review.js` are **v1**
  (`export const handler = async (event)`) and must return `{ statusCode, body }`.
  Hand v2 the v1 object and Netlify answers **502 "Function returned an unsupported
  value"** *before the handler's own code runs* — so the failure looks like whatever the
  caller does with an unparseable error, not like a bug in the function. `json()` in
  `netlify/lib/shared.mjs` shipped returning the v1 shape and every one of the four money
  functions was dead in production while all tests were green: `checkout.test.mjs` imports
  pure helpers and never invokes a handler, `webhook.test.mjs` covers the one function
  that is legitimately v1, and the popup only ever showed its own generic "try again"
  because a 502 body carries no `error` field. `tests/response-shape.test.mjs` now calls
  every v2 handler and asserts it returns a `Response`; `verify-blog.mjs` gates on it.
  **Adding a function means picking a generation and matching its shape** — do not
  "tidy" the two styles into one.
- **Files**: `shop-app/` is a Next.js app (`output: "export"`, `basePath: "/shop"`) whose
  export is committed as `shop/`. Rebuild it with `cd shop-app && npm run build`, then
  `rm -rf shop && cp -R shop-app/out shop`. The Netlify Functions are
  `netlify/functions/{create-checkout,check-coupon,stripe-webhook,order-status,subscribe}.mjs`,
  sharing `netlify/lib/shared.mjs`.
- **`ops/catalog.mjs` is the only place a price is written down**, now including
  `SURCHARGE` (premium flavour → size → **cents**) and `listPriceCents`. It used to live
  only in `order.html`'s inline script, gated by nothing, and the checkout charges off it.
  **Both** build gates diff it against `verify-blog.mjs`'s `FACTS` — the two sites deploy
  independently, so one gate is not enough. `SURCHARGE` must stay a **keyed object**:
  `ops/verify.mjs` runs `/\{\s*name:\s*'([^']+)'/g` unscoped over the whole file and
  would read an array as a 16th flavour.
- **shop-app cannot import across its Turbopack root** (two lockfiles exist; the root is
  pinned deliberately), so it carries `lib/catalog.generated.mjs`, a byte-for-byte copy
  written by `scripts/sync-catalog.mjs` on every `dev` and `build`. `verify-blog.mjs`
  fails the deploy if it drifts. Never edit the copy.
- **No order row exists until Stripe confirms payment.** There is no payment state in
  `order_status` and adding one is a ~15-call-site diff plus the `customers` view, so the
  pending cart lives in the Stripe session's metadata. An abandoned checkout leaves
  nothing to clean up and no unpaid cake can reach the baker's queue.
- **The browser sends a cart, never a price.** Every line is re-validated against the
  catalogue and re-priced in `create-checkout`. `'Slice'` and `'tiered'` have no list
  price and are **refused**, not sold for $0.
- **`walk_in` is never true on a web order** — `set_order_defaults()` would force it to
  `picked_up` and it would never be baked. `deposit = price − discount` is what makes
  `paidOn()` report it fully paid, so ops stamps **PAID IN FULL** with no ops changes.
- **A quantity is expanded once, server-side, in `priceCart`.** A line of three
  becomes three priced lines at the door, so the discount split, the Stripe line
  items, the metadata keys, the webhook's rows and `cart_line` all keep working
  on a flat list and cannot disagree with the kitchen about how many cakes were
  bought. The cap is on **cakes**, not rows: ten, because every cake costs a
  metadata key and Stripe allows fifty.
- **Adding the same cake twice is a quantity, not a second row** (`addLine`) —
  same size, same flavour, same writing. Different writing is a different cake
  and keeps its own row, because the writing is what gets piped on it.
  `readCart` also folds duplicates it finds, since carts written before
  quantities existed hold one row per cake and two identical rows would
  otherwise collide as React keys — silently, not as a warning anyone sees.
- **The applied coupon lives in the cart, not in a component.** It survives
  Back and a reload, and there is never a second copy to keep in step; the
  checkout page reads it from there. Display only — `create-checkout`
  re-validates the code and re-prices every line.
- **The cart says "Collection — Free", never a delivery fee.** There is no
  delivery. Both reference carts we were shown have a delivery line; copying it
  would be the kind of small untruth that costs a five-star review. For the same
  reason the summary rail carries a *Paying* note rather than a payment-method
  picker: the card is entered on Stripe's page, so a choice offered here would
  be a choice of something that does not exist.
- **A cart becomes one `orders` row per cake**, sharing `order_group_id` and
  `stripe_session_id`, differing by `cart_line` — one job per cake is how the kitchen
  works. The coupon discount is split proportionally with remainder cents on the first
  line, so `sum(price − discount)` equals the Stripe charge **exactly**; a naive split
  loses a cent and the books never balance again.
- **Idempotency is a unique index**, `(stripe_session_id, cart_line)`. A retried webhook
  hits 23505 and returns 200. So a failure can safely return 500 and let Stripe retry for
  three days — every write is idempotent.
- **Verify the webhook signature on raw bytes, handling `isBase64Encoded`**, and answer
  **400** on a bad one. A 200 tells Stripe the forgery was accepted. Never `JSON.parse`
  before verifying. `netlify/functions/webhook.test.mjs` asserts all of that.
- **A shop cake is NEXT DAY; a custom cake still needs 48 hours.** They are
  different products and the numbers are not interchangeable — the 48 hours
  quoted on `/order`, `index.html` and `cakes.html` is about a cake somebody
  draws, and must not be "tidied" to match the shop. The shop's rule lives in
  `LEAD_DAYS` in `netlify/lib/shared.mjs`, mirrored in `shop-app/lib/cart.ts`.
  `CUTOFF_HOUR` is the Sydney hour at or after which an order rolls to the day
  after; **24 means no cut-off**, which is what "we do next day" says — an
  order at 11pm still offers tomorrow. Lower it to 18 the day a late order
  arrives that the kitchen could not make.
- **It is a calendar rule, so compare day strings, never instants.** Adding
  86_400_000ms to a `Date` lands on the wrong day on the two nights a year
  Sydney shifts DST, which books a cake for the wrong date; `earliestDueDay`
  builds the date from Sydney wall-clock parts instead. `checkout.test.mjs`
  pins both DST nights, plus month and year rollover. The old 48-hour rule made
  the first bookable date a *partial* day whose early slots had to be filtered
  off — truncating 09:30 to 9 once offered a 47.5-hour slot the server refused.
  A day boundary removes that whole class of bug; do not reintroduce an hours
  offset without reintroducing the rounding care too.
- **Cancelling a web order in ops does NOT refund the card.** The status sheet warns and
  names Stripe when `stripe_session_id` is set. Keep that warning.
- **Marketing consent takes two different shapes, and the difference is the primary action.**
  ACMA prohibits a **pre-ticked box sitting beside some other primary action** — consent
  cannot be inferred from an order, or from a phone number given for a receipt.
  - **Account sign-up** (`/shop/sign-up`): the primary action is creating an account, so
    marketing is secondary and needs its own **unticked** box naming the channels and the
    benefit. The Privacy Policy tick is separate and required.
  - **The offer popup** (`promo.js`): the primary action *is* subscribing — the heading,
    the button and the notice all say so — which makes submitting the form **express
    consent**, no tickbox needed. This is the same pattern the big AU chains use. It is
    not a loophole and it is not a licence to drop the box on the sign-up form.
  Both channels are stored as two fields so a later "stop texting me" does not also stop
  the emails. `subscribe.mjs` stores the exact consent wording shown, so there is a record
  of what was agreed — keep that when the copy changes.
- **Google sign-in is Google Identity Services, NOT `signInWithOAuth`.** The redirect
  flow sends the browser to `<project-ref>.supabase.co/auth/v1/callback`, and Google then
  names *that* domain on its consent screen — indistinguishable from a phishing page to a
  customer. It cannot be fixed with branding settings: Google only shows an app name for a
  redirect URI on a domain you can prove you own, and only Supabase owns `supabase.co`.
  (The paid custom-domain add-on is the other fix; it needs Pro, so ~$35/mo.) With GIS the
  browser never leaves our origin. Consequences to keep:
  - Google Cloud needs **`https://numnumsbakery.com.au` as an Authorised JavaScript origin**,
    not a redirect URI. **A wrong origin is invisible**: GIS draws a perfect, clickable
    button either way and only refuses on click, logging it to a console no customer
    reads — so a broken sign-in and a working one are pixel-identical. Never judge it by
    looking. `node check-google-signin.mjs [url]` reads the console and exits non-zero;
    run it after any Google Cloud change and after the first production deploy, since an
    origin that passes on localhost says nothing about the live domain.
    **A Netlify deploy preview can never pass**: its URL carries a per-deploy hash
    (`https://<hash>--numnumstest.netlify.app`) that changes every build, so it cannot be
    registered and Google answers `Error 400: origin_mismatch`. Correct behaviour, not a
    bug — test on localhost or the published domain, never on a preview link.
  - `accounts.google.com` is in `script-src`, `frame-src` **and** `connect-src`. Miss one
    and it breaks in production only.
  - The nonce is sent to Google **hashed** (SHA-256 hex) and to Supabase **raw**. Swapping
    them fails the token exchange.
  - Reveal the button only once the host actually has a child. `renderButton` returns
    before it draws and can draw nothing at all, and an empty bordered box above an OR
    divider reads as broken. Do **not** gate on height — the host sits inside the hidden
    wrapper, so it measures 0 until shown, which is the thing being decided.
  - Nothing navigates away, so consent is written straight onto the user with
    `updateUser`; there is no redirect to park values across any more.
  - A Google sign-in is already verified, so its success screen must not tell the customer
    to go and confirm an email that will never arrive.
- **Lenis must not touch the popup.** `promo.js`'s card carries `data-lenis-prevent`;
  without it Lenis preventDefaults the wheel and the dialog cannot scroll to its own
  submit button. Any new overlay on the static site needs the same attribute.
- **A coupon is validated server-side, never through RLS.** `coupons` is
  read-own-by-email (`auth.jwt() ->> 'email'`), so a popup subscriber — who by
  design has no account — reads nothing and is told their own code is not
  recognised. The rules live once, in `couponFor` in `netlify/lib/shared.mjs`:
  `check-coupon` shows the customer the reason, `create-checkout` reads the
  coupon and **ignores** the reason (a mistyped code must not block buying a
  cake), and the webhook claims it a third time. A code bound to somebody
  else's email answers *"we don't recognise that code"*, the same as one that
  does not exist, so it is not an oracle. Checkout **clears an applied coupon
  when the email changes** — the binding is to one address, and a stale
  discount is a total that goes UP on Stripe's page.
- **The popup is a newsletter signup, not a sign-in.** It asks for a first name and an
  email and mints a 10% coupon through `/api/subscribe` → `netlify/functions/subscribe.mjs`.
  It writes `marketing_contacts` and `coupons` with the **service role**, because both are
  RLS with no write policy at all — nothing holding the publishable key gets to mint a
  discount. It returns one live coupon per email rather than minting on every submit, or
  clearing a cookie and resubmitting is an unlimited discount printer.
- **Env vars (public site only, never on the ops site, never in a file)**:
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ONLINE_ORDERS_USER_ID`, `MAKE_ORDER_HOOK_URL`, and the
  optional kill switches `BLOCKED_DATES` and `MAX_WEB_ORDERS_PER_DAY`.
- **RLS is the only guard** and it is verified by signing up a throwaway customer and
  curling PostgREST with **only** its token — the UI proves nothing. A customer must read
  `[]` from every table, be refused every write, and be refused a `cake-photos` upload
  **with a valid mime type** (an invalid one is rejected by a content-type check in front
  of the policy, which is a false pass). `coupons` is the one exception: read-own via
  `lower(email) = lower(auth.jwt() ->> 'email')`, and no write policy at all.

## Conversion work — what is measured, and what must not come back

Acting on a Perplexity CRO evidence report (2026-09-15) plus two things it
could not see from outside the repo. The research and the parked items are in
`plans/Shop-First Restructure — parked 2026-09-14.md`.

- **Nothing may gate on `window.load` again.** The full-screen skeleton used to
  clear on it, and `load` fires at **22-31 seconds** on this site because it
  waits for the hero video, GTM and the Meta pixel — so the 3000ms fallback was
  doing 100% of the work and every visitor waited 3s to see a page that had
  already painted at 240-1168ms. Now it clears at DOM readiness plus a frame,
  with a 1200ms cap as a safety net rather than the normal path. Measured
  after: `/order` 3475ms → 754ms on fast 4G, `/` 4369ms → 2126ms on slow 4G.
  `verify-blog.mjs` fails the deploy on any page that reintroduces it.
- **The shop fires the GA4 funnel now.** It fired *nothing* before — no
  container, no events — so the only part of the site that can take money was
  the only part reporting nothing. `shop-app/lib/analytics.ts` owns
  `view_item` / `add_to_cart` / `begin_checkout` / `purchase`. Two rules in
  there: analytics is never allowed to throw into a conversion path, and
  `purchase` fires only once `order-status` confirms payment, guarded by
  **localStorage** — `sessionStorage` would let a reopened thank-you link bank
  the same order twice, and GA4 does not reliably dedupe a repeated
  `transaction_id`. It defaults to NOT-banked when storage throws: losing every
  private-mode purchase is worse than a rare duplicate.
- **`ONLINE_ORDERS_USER_ID` is not optional.** `orders.created_by` is
  `uuid NOT NULL DEFAULT auth.uid()` and the webhook writes with the SERVICE
  ROLE, where `auth.uid()` is null — verified against the live schema. Unset, it
  does not degrade: every paid order fails its insert, Stripe retries for three
  days, and a customer has paid for a cake the kitchen never sees. `requireEnv`
  in `netlify/lib/shared.mjs` now stops both money functions at the door;
  the webhook answers **500, not 200**, so Stripe keeps the events queued to
  replay once the variable is set.
- **RLS is verified by `ops/supabase/verify-rls.sql`, not by looking.** Run it
  after any policy change. It carries the two false passes that were hit
  writing it: a type or NOT NULL error in FRONT of the policy looks exactly
  like a refusal (two `orders` inserts were rejected by an enum and a missing
  column before either reached RLS), and a storage policy matching
  `owner = auth.uid()` looks perfect to whoever uploaded the file — section 4
  must be run as a second user, with a **valid** mime type.
- **`public.customers` must stay `security_invoker`.** It reads `orders`. A
  view that is not an invoker view runs as its owner and bypasses RLS, handing
  the whole customer directory to anyone signed in.

### `/order` — the form is the page

- **The form sits above the gallery, and that is load-bearing.** It used to
  start at **8,426px** on a 390px phone — ten screens, behind twelve gallery
  photos and a pricing widget — and **no link anywhere on the site pointed at
  `#custom-form`**: all ~1,000 `/order` links across 240 pages landed on the top
  of the page. Moving the form up is what makes every one of those links work,
  with no edits to those files. It now starts at 781px. The gate fails the
  deploy if the gallery goes back above it.
- **The 48-hour rule is enforced in ONE place: which days the calendar offers.**
  `minDate` used to truncate `now + 48h` to midnight, so it enabled a day whose
  early times were still inside the lead time — at 5:04pm Monday it offered
  Wed 16 Sep, and the default 10:00 AM was 7.1 hours short, so pressing Send on
  the first available date was rejected. The person it refused was always the
  one in a hurry. The earliest day is now the first whose FIRST offered pickup
  time (`FIRST_PICKUP_HOUR`, 9am) is a clear 48 hours out, and the instant
  re-check at submit is **deleted**, not adjusted — a rule enforced twice is a
  rule that can disagree with itself. Proven across all 24 order hours.
- **Pickup time is one list.** Hour + minute + AM/PM was six taps and it is what
  made the rule contradict itself. Occasion is gone entirely (6 required fields
  → 5). The name is remembered in `localStorage`. Fields flag on blur, not only
  after Send.
- **The progress bar reads its required fields defensively.** Removing a field
  from the markup otherwise takes the whole function down with a TypeError on a
  null `.value`, and that function's failure takes the submit listener with it.
- **Nothing on `/order` may route away from its own form.** Six links did: the
  nav pill's "Order Now" (to the Signature shop), its mobile twin, three gallery
  CTAs that reloaded the page to the top, and the pricing widget's green
  "WhatsApp to Order". The nav pill needs fixing in **`promo.js`** as well as
  the markup — `paintCart` overwrites that href on every load.
- **The offer popup does not open on `/order`.** It locks body scroll and fires
  at 50% scroll depth, which a half-filled form reaches easily, so it was
  covering somebody mid-order to sell them a discount on a later one.

### Pickup-only, and the marketplace link

- **Pickup-only is stated in the hero on `/` and `/order`**, as a qualifier and
  not a warning — the site's own `.hero-proof` surface on `/order`, the
  homepage's own trust-row voice on `/`. It filters a delivery-only visitor in
  ten seconds instead of after four minutes of built intent.
- **Uber Eats is a text link, never a button.** It is a 25-35% commission
  channel and does not get a filled CTA on our own page; it exists to catch the
  visitor pickup-only just filtered out. It fires its own `marketplace_click`
  event because the report rated it the **thinnest-evidence** item of the seven
  — no isolated link-vs-no-link study exists for local food sites — so it gets
  judged on incremental gross profit, not on clicks.

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

### Business plans
Every strategy/roadmap/decision-plan markdown file (e.g. quarterly plans like
`Next Big Project — 2026 Q4.md`) gets saved to **both**:
1. `My AI Brain/projects/` (the source of truth — where it's read and updated from), and
2. `plans/` in this repo (so it travels with the codebase and cloud routines can read it).

When a plan is exported to PDF, save the PDF alongside the `.md` in **both** locations
too. When a plan is revised, update both copies in the same pass — don't let one drift
stale. This falls under the "docs-only" exception above: don't auto-push a plans/ change
by itself, but do still `git add`/commit it locally so it's captured.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
