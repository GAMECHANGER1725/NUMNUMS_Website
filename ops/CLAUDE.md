# Ops app rules (`ops/`)

Loaded when working in `ops/`. Site-wide rules are in the root `CLAUDE.md`;
status and open items are in `context/00-context.md`. Prices, `SURCHARGE` and
`COLLECTION` in `catalog.mjs` also feed the public checkout, so read
`shop-app/CLAUDE.md` before changing them.

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
- **Adding a person takes three things**: an auth user `<name>@ops.numnumsbakery.com.au`
  (created in the Supabase dashboard; Claude is not allowed to set passwords over SQL), a `profiles`
  row (name, role, stores), and an entry in `PEOPLE` in `db.mjs`, since the sign-in dropdown is
  built before anyone is signed in. **Arpita is temporary staff** (added 2026-10-21, for 1–2 months):
  when she leaves, block her sign-in in the dashboard rather than deleting the user (orders she
  logged point at her id), and take her out of `PEOPLE`.
- **The staff page is read-only.** Roles and store scoping are what RLS enforces; they get changed
  in Supabase so the change is deliberate, not by an admin mis-tapping their own row.
- **A website order tags itself: `orders.from_website`** (Vaidik, 2026-10-10: "when orders
  from the site come, it should be automatically tagged in the OPS"). `set_order_defaults()`
  sets it on insert whenever `stripe_session_id` is present, so it holds for whichever build
  of the public site is live and no person ever types it. The card shows an outline
  **Website** tag (`.tag-web` — an outline because every fill colour already means a
  state), the order shows "Came from", the export has a Website column, and the baker guard
  refuses changes to it. **No human step, on purpose:** a staff Yes/No toggle was built and
  rejected the same day ("no human required"), and an automatic match of `/order` WhatsApp
  enquiries (a `web_enquiries` table fed by the form) was proposed and declined. Custom-cake
  enquiries are therefore untagged; do not bring either back without asking.
- **Paid web orders buzz the phone: web push from ops, free** (Vaidik, 2026-10-11 —
  Tarun reads Gmail every 2-3 days, so an emailed order could sit until pickup;
  Pushover was refused because it costs, ntfy because order details would cross a
  public server). The pieces, and why each is there:
  - **The bell** (`#bell-btn`, top bar) turns it on for *this phone* — iOS only asks
    permission from a tap, so there is no prompt on load. It writes a
    `push_subscriptions` row (user_id, endpoint, keys; RLS: own rows only). Off and
    sign-out delete only **that person's row**, never the browser subscription: on
    the shared tablet somebody else may still be using it.
  - **iOS needs the Home Screen.** `manifest.webmanifest` (standalone) + `sw.js` are
    what make ops installable and able to receive a push; Safari in a tab never gets
    one. The bell says so when tapped outside the installed app.
  - **`sw.js` handles push and notificationclick only — no fetch handler, no cache.**
    A caching worker is how an app gets stuck on last week's code. Do not add one.
    The ops CSP allows it with `worker-src 'self'` (it was `'none'`).
  - **The sender is `netlify/lib/push.mjs`, on the public site**, called from
    `fulfilSession` after the Make hook, so it fires once per paid order (the
    duplicate guard returns before side effects). It notifies every subscribed phone
    whose owner is **an admin or the baker** (`NOTIFY_ROLES`; Vaidik, 2026-10-11:
    not counter staff, whose bell is hidden) and whose `profiles.stores` contains
    the order's store, deduped by endpoint,
    drops 404/410 endpoints, and never fails the order. **`VAPID_PRIVATE_KEY`** is a
    public-site Netlify env var; unset, nothing is sent and nothing breaks. The
    public half is `PUSH_PUBLIC_KEY` in `ops/catalog.mjs` — **replacing the pair
    orphans every phone**, each has to tap the bell again.
  - **The lock screen shows first name and cakes only** (`newOrderMessage`), never
    the phone number: a lock screen is readable by anyone at the counter.
  - Only website orders notify. Orders typed into ops do not (whoever typed it knows).
  - **Turning the bell on sends a real test push and shows the answer** (2026-10-13).
    The first live order (RV-1823) buzzed Vaidik's Android and not Tarun's iPhone,
    which *was* subscribed, and the only record of what Apple said was a
    `console.error` nobody reads. Now `notifyStaff` writes `last_status` /
    `last_error` / `last_sent_at` onto every `push_subscriptions` row (201 =
    accepted), and the bell calls **`netlify/functions/push-test.mjs`** (public
    site, v2, CORS for the ops origin, caller's Supabase token, sends only to the
    caller's own rows). A non-201 gets one fresh subscription and a retry, then a
    toast with the status. **Diagnose with SQL first**: `select last_status,
    last_error from push_subscriptions` tells FCM/Apple refusing apart from a
    phone that accepted it and stayed quiet (Focus, Sounds off). The ops CSP's
    `connect-src` carries `https://numnumsbakery.com.au` for this call only.
- **Every order has Copy for WhatsApp / Send on WhatsApp** (2026-10-11): the order as
  one message for the shop groups, the way it used to be typed by hand
  (`whatsappText` in `app.mjs`, WhatsApp `*bold*`). Money lines follow the sheet's
  rule, so the baker's copy has none. Send uses `wa.me/?text=`, which opens WhatsApp
  with the text filled in and lets them pick the group.
- **`#order=<id>&store=<code>` opens one order** (2026-10-11). It is the link in the
  new-order email and the phone notification. `start()` reads it, switches to that
  store first (the log only holds the active store's orders), opens the order and
  clears the hash; the hash survives the sign-in screen because sign-in is the same
  page. An order the reader cannot see says so in a toast rather than opening nothing.
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
- **Every cake is collected once its pickup TIME passes, automatically** (Vaidik, 2026-09-28).
  Overdue was never a worklist, just cakes that had gone out and needed tapping *picked up*.
  The pg_cron job **`collect-past-orders`** runs **hourly at :05, and Vaidik refused
  every-minute**. It moves any placed/baked/arrived order with `due_at < now()` to
  `picked_up` (with `picked_up_at = due_at`) and closes its
  print jobs, so every figure agrees with no display rule to keep in step. It is inline SQL,
  not a function, because a security-definer function in `public` is callable over PostgREST.
  Its events have a null actor and show as **Automatic** on the Edits page. The Data page's
  "past pickup and still open" panel is its only watchdog. Do not bring an Overdue section back.
- **More › Customers › Reviews (admin only)** lists collected cakes with a phone and a null
  `orders.review_asked_at`, one row per phone (`reviewAsks`). Copy sends the numbers to the
  clipboard, and **Mark as sent** (two taps) stamps them. `review_asked_at` is in
  `log_order_event`'s skip list, so a batch writes no Edits rows. Everything collected before
  2026-09-28 was backfilled as asked, because the old routine had already covered it.
  **Each row has Ask on WhatsApp (2026-11-21)**: `wa.me/61…` with `reviewMessage` filled in
  and **that shop's** Google review link (`STORES[].review` in `catalog.mjs`), and the tap
  stamps that row. Harris Park customers must land on Harris Park: it is 4.2★ on 666 reviews
  against Riverstone's 4.6 on 88, and AI assistants quote the Harris Park figure in every
  answer (AI-visibility baseline, 2026-11-21). The links are the profile CIDs encoded
  (`0x09` + CID little-endian + `0x10 0x13`, base64url) and were followed to the right
  profile. **The ask goes straight to Google for everyone** — no rating question first, no
  reward — because Google removes gated or incentivised reviews. `waNumber` returns null for
  anything that is not nine digits after the 0/+61, and that row says to copy it instead.
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
  registered for GST. The seller's identity and ABN live on `BUSINESS` in `catalog.mjs`
  (re-exported by `db.mjs`, so the public receipt function prints the same one); only the
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
