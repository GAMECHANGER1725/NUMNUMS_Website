@AGENTS.md

# Shop, checkout and accounts rules (`shop-app/` → `shop/`, plus the checkout functions)

Loaded when working in `shop-app/`, and imported by `netlify/CLAUDE.md` for the
functions. Site-wide rules (brand, email, nav, `/order`, SEO) are in the root
`CLAUDE.md`; status is in `context/00-context.md`. The Next.js note above
applies to `shop-app/` only.

## Accounts — the category name, the mobile, and the second sign-in

- **The online range is named "Signature Cakes"; the nav link to it says
  "Shop Cakes".** Those are two different jobs and they stopped being the same
  word on 2026-09-21. The *name* survives where it is an asset — the `/shop`
  `<title>`, the homepage `section-label`, and `item_category` in
  `analytics.ts` (a data key; changing it splits the GA4 series). The *door*
  is labelled for the action, because "Signature Cakes" named the range and
  not the thing you could do with it: a customer who wanted to order a flavour
  had to already know that was the page for it. `Shop Cakes` pairs against
  `Custom Cakes` on one axis — shop from what we have, or commission
  something — and `verify-blog.mjs` fails the deploy if the `/shop` nav link
  is labelled anything else.
  ⚠️ This **knowingly overrides** the earlier call that replaced a bare "Shop"
  with the range name. That call was right that "Shop" alone said nothing
  about what was behind it; "Shop Cakes" names the product *and* the action,
  so it is neither the placeholder nor the jargon. Do not revert it back to
  "Signature Cakes" on the strength of the older note.
  Internally the DB still says `kind: 'normal'` and that stays — renaming an
  enum across ~15 call sites and the `customers` view buys nothing.
- **The mobile is required, at sign-up and on Stripe's page.**
  It is the only way to reach somebody about their own order by phone, so a
  web order without one is one nobody can chase. (The "your cake is ready"
  message goes by **email**, not text — Vaidik, 2026-10-06. Copy on the
  thank-you page, Stripe's after-submit message, sign-up, terms §9 and the
  privacy policy all say email; do not write "we'll text you" again.)
  Since 2026-09-24 checkout is **Stripe's hosted page, straight from the cart**
  (Vaidik's call — our own `/shop/checkout` details page is deleted; it was
  never published, so no redirect — adding one in `netlify.toml` coincided
  with two deploys failing at upload with an HTTP 500). Stripe collects the mobile (`phone_number_collection`, which
  makes it required), the email, and a required **"Name for the order"**
  custom field — the docket name, not the cardholder's. The webhook reads them
  off the session and rewrites `+61` as `0`. What was lost: nothing can insist
  it is a *mobile* rather than a landline before payment.
- **The code box accepts a paste, separators and all (2026-10-08, Vaidik).** It had
  `maxLength={CODE_LEN}`, which the browser applies to a pasted string *before*
  `onChange` strips non-digits, so `1234 5678` or `123-456-78` was cut to six digits
  and sat there. `maxLength` is gone; `onChange` strips non-digits and slices to 8,
  and the eighth digit auto-submits as before.
- **Marketing tick stays UNTICKED — Vaidik asked for it on by default (2026-10-08) and
  it was not built.** The Spam Act needs express consent (an active step; the sender
  carries the burden of proof, and `subscribe`/sign-up store the consent as a record),
  and law-firm guidance reads a pre-ticked box as not that. A pre-ticked box would
  also write `marketing_email/sms = true` for people who never chose it. Compliant
  ways to lift opt-in are listed in the AI Brain note; ask before revisiting.
- **Sign-up flags a bad email or short password inline, on blur.** The button is
  disabled until every field is valid, and with only the mobile field explaining
  itself a customer with `not-an-email` or a 5-character password saw a dead button
  and no reason (found by the live browser test, 2026-10-08). `/shop/log-in` has its
  own `layout.tsx` for the title because the page is a client component and cannot
  export `metadata`; it had inherited the homepage's title.
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
  the then-longer "Signature Cakes" tipped a 768px tablet into a horizontal
  scroll. The static rule is injected by `promo.js` as a **separate** media
  query — widening the existing one would drag the trust-bar and hero rules
  along with it. The nav is now five labels and the longest lost five
  characters, so the breakpoint *looks* loosenable; it has not been re-measured
  and nothing asked for it, so leave it where it is until something does.

## Product cards — what a claim is allowed to say

- **Every badge is a fact from the order book or an opinion marked as ours.**
  They live in `shop-app/lib/badges.ts` with the sample they came from
  (`ORDER_BOOK`: 32 orders, counted 2026-09-13). "Most ordered" is Chocolate
  because it was 41% of everything sold; "Most ordered" on the 8" size chip is
  47% of orders. `verify-blog.mjs` scans the built `shop/` for urgency language
  a static page cannot know is true — *selling fast*, *only N left*, *ends in*,
  *N people viewing* — and fails the deploy on any of it. **Scarcity and
  urgency are not banned (Vaidik, 2026-10-06: "I don't ban fake scarcity") —
  a claim that is not true is the only thing refused**, and Claude will not
  write or wire one that is made up. Scarcity built from real data is
  welcome and is the Hormozi-compatible route: remaining pickup capacity for
  a day computed from `MAX_WEB_ORDERS_PER_DAY` and the live order count,
  `BLOCKED_DATES`, the real lead-time cut-off, a real one-off batch. Such a
  claim must be rendered at runtime from that data (never typed into a static
  string), and when the first one ships, scope the gate's pattern list to
  allow that component rather than deleting the gate. **One was built on
  2026-10-06 and removed on 2026-10-07**: a live "N online pickups left for
  Saturday" line. Vaidik decided **he does not want a daily cap**, and without
  a cap there is nothing true to count, so it was deleted rather than left
  fetching a function that always answered nothing. **There is currently no
  scarcity claim anywhere on the shop, and none should be added**; the named
  earliest date is the only honest time pressure there is. If he ever wants
  one, it needs a real cap first. That is not caution
  for its own sake: the ACCC fined three retailers in June 2025 over misleading
  sale claims and the ceiling is **$100m** per breach — doubled from $50m by the
  Treasury Laws Amendment (Doubling Penalties for ACCC Enforcement) Act 2026, and
  "fake pricing" is a named ACCC enforcement priority for 2026-27.
- **No was/now strikethrough on any cake. Checked 2026-09-21 and refused.**
  Vaidik asked for "6 inch from $50 to $39.99". The catalogue has been $39.99
  since it was written — `git log -S` over the whole history finds no $50 or
  $65 price for any size, and `toNinetyNine` makes a round-dollar price
  impossible anyway. A reference price is lawful only where the item was
  actually offered at it for a reasonable period, so "was $50" would be
  fabricated. If a genuine price cut ever happens, the "was" figure has to be
  a price that was really charged, for a real period, and that period has to
  be documented somewhere durable before the badge goes up.
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
- **The board is three named rows, not one wall of fifteen** (2026-09-21).
  **Premium** (Rasmalai, Ferrero Rocher) → **Classics** (the rest) →
  **Specialty flavours** (Butterscotch, Cookies & Cream, Tiramisu, Red Velvet,
  Mango, Lychee). Classics moved above Specialty on 2026-10-06 (Vaidik):
  Chocolate, 41% of orders, lives there and sat ~1.4 phone screens down as
  the third row. Rows answer "what kind of cake am I after" before "which flavour",
  which is the order people decide in; one grid made a $49.99 Rasmalai and a
  $39.99 Vanilla look like the same kind of thing. Within a row it is
  popularity order, which below the first position or two decides nothing.
  This replaced the old merchandised `HERO` first row — it existed to drag
  both premiums up out of positions 5 and 15, which a Premium row now does by
  construction.
  - **Membership is derived, not listed twice.** Premium comes from the
    `premium` flag in `ops/catalog.mjs`; Classics is the catch-all, so a NEW
    flavour lands somewhere rather than vanishing. Only `SPECIALTY` is written
    out, and `page.tsx` **throws at build** if it names a flavour that is not
    sellable, or if the three rows do not sum to the catalogue — a renamed
    flavour would otherwise slide silently into Classics.
  - **No Premium chip inside the Premium row.** The heading says it; a badge
    repeating its own section is the clutter the one-badge-per-card rule
    exists to stop. It still shows anywhere else a card appears.
  - The rows are `CakeRow` (`components/ui/cake-row.tsx`) — native
    overflow-scroll with snap, **not** a transform carousel, so a phone gets
    the OS's own inertia and a trackpad works. Arrows are frosted glass, hide
    entirely when the row already fits (Premium on desktop), disable at the
    ends off real scroll position, and honour `prefers-reduced-motion`.
    ⚠️ Declare `backdrop-filter` **unprefixed only**: writing both made
    lightningcss emit the `-webkit-` form and drop the standard one, which is
    backwards for Firefox, where the glass then silently degraded to a flat
    pill.
  - **Premium gets its own shelf** — warm panel, gold hairline, gold eyebrow,
    wider cards. Gold (`#E3B664`), never rose: rose is the action colour and a
    premium row is a place, not a call to action. Its cards are wider because
    two standard tiles left a half-empty shelf that read as a row which had
    failed to load; capped at 33% on desktop, because 46% turned two cakes
    into a full screen and pushed the most-ordered flavour two rows down.
    The heading uses the site's heading face (Cormorant, since 2026-10-06).
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

## Shop (`shop-app/` → `shop/`) — the customer-facing checkout

Normal cakes are bought online and paid for in full; custom cakes are still quoted
by a person through `/order`. `/order` is the **single fork** between the two — do not
add a second entry point to the shop elsewhere, or the two have to be kept in step.
**One sanctioned exception (Vaidik, 2026-10-06):** a text link under the homepage
hero buttons, "Don't need a custom design? Shop our 15 flavours →" (`.hero-shop-link`; it said "a cake for tomorrow" until shop cakes went to 2 days on 2026-10-11)
in `index.html`). Both hero buttons go to the quote form and the homepage had no
content link to the shop at all. It stays a text link, never a third button.

- **`netlify/functions/` holds deployable functions and nothing else.** Netlify bundles
  **every** file in there as a function, so a test file fails the deploy twice over — a v1
  function bundles to CommonJS and cannot do top-level await, and a dot in the filename is
  an illegal function name. Tests live in `tests/`, shared helpers in `netlify/lib/`, and
  `verify-blog.mjs` fails the build if either strays back. Routes are declared in
  `netlify.toml`, never in a `config.path` export as well.
  Reproduce a deploy's bundling locally with
  `npx @netlify/zip-it-and-ship-it netlify/functions /tmp/out` before pushing function changes.
- **The two function generations do not share a return shape, and mixing them is a
  silent 502.** `subscribe`, `create-checkout`, `order-status`, `receipt`, `calendar` and `unsubscribe` are
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
  `netlify/functions/{create-checkout,stripe-webhook,order-status,subscribe}.mjs`,
  sharing `netlify/lib/shared.mjs`.
- **The shop's tab icon is the TP chef, not Next's triangle (2026-10-09, Vaidik).** `shop-app/app/favicon.ico` was Next's placeholder, so every `/shop` page showed a black triangle. The icon is now `shop-app/app/icon.png`, a lossless PNG of `brand_assets/Logo_TParent_56.webp` (112px, the file Vaidik named). `apple-icon.png` is the 180px `icons/apple-touch-icon.png` the rest of the site uses, because the 112px file scaled up to an iPhone home screen goes soft. Next writes the `<link>` tags from these two files, so keep a `favicon.ico` out of `app/`: that file was the triangle. If the logo changes, re-cut `icon.png` from the new file and re-run the build-and-copy above, since `shop/` is what is deployed.
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
  `picked_up` and it would never be baked.
- **A web order is a 50% deposit, not a sale.** `DEPOSIT_RATE` and `depositCents`
  in `netlify/lib/shared.mjs` are the only place the rule is written; the copy in
  `shop-app/lib/cart.ts` is **display only** and must round the same way (floor),
  or the cart quotes a figure Stripe then contradicts — the one number every
  customer checks. Four things follow and each is tested:
  - The deposit is worked on the **cart** total and split back over the lines with
    `splitCents`, never halved line by line: halving three odd-cent lines loses
    cents and `sum(deposit)` stops equalling the charge, which is unrecoverable.
  - It is **floored**, so the balance is always the larger half ($49.99 → $24.99
    now, $25.00 later) and is clamped to `[1, total−1]` — a customer is never
    asked for more up front than they owe at the counter, and never handed a
    "$0.00 on collection" that is a lie.
  - The charged amount rides in the Stripe metadata as `p` and the webhook writes
    **that**, never a recomputed figure. A rounding rule that changed between
    session creation and payment would write a deposit disagreeing with the card.
    `l.p ?? (l.c − l.d)` covers sessions created before deposits existed — those
    were quoted at full price and must be recorded as paid in full.
  - `paidOn()` and `receipt.mjs` **already** handled partial payment: the invoice
    computes `owingC` and stamps **DEPOSIT PAID** with the balance. Nothing in ops
    needed changing — only the one webhook line that used to write the full net.
- **Stripe's page is branded per session** (`branding_settings` in
  `create-checkout`): Vanilla Cream background, Rose Petal pill button, and
  **icon + "Num Num's Bakery", never `logo`** — a logo replaces the name, and
  our square logo rendered as a 28px speck with nothing saying whose page it
  was. The icon is `brand_assets/checkout-icon.png`, a 256px cut (the original
  is 1.6MB). Per-session branding needs API `2025-09-30.clover`, so that one
  call passes `{ apiVersion }`; the SDK's pinned version stays for the rest.
  Each line carries its cake's photo from `/shop/cakes/`, and its description
  leads with the **collection** shop and time, because a phone shows two lines
  before "more". Font and the account's public name are Dashboard-only.
- **Refund window: cancel more than 24h before collection and the deposit is
  returned in full.** Stated in the cart, on Stripe's own submit button and in the
  terms. Non-refundable after that, because a made-to-order cake cannot be resold —
  which is what makes it a genuine pre-estimate of loss rather than a penalty, the
  test a non-refundable deposit has to pass under the ACL. **Refunding is manual in
  Stripe**; ops cannot do it.
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
- **The cart's conversion rules** (2026-09-25, from Baymard's checkout research):
  - **There is no discount-code box.** Web orders carry no discount at all
    since 2026-10-06 (see **No discount codes** below), and an empty code field
    makes 30-60% of Baymard's test users stop and hunt for a code.
  - **The shop is two radio cards, not a dropdown** — a menu hid the only two
    answers there are. Real `<input type="radio">`, `sr-only`, drawn circle.
  - **The pay button is never greyed out for a missing answer.** `go()` scrolls
    to the first thing still to choose and shakes it (`.nn-nudge`, transform
    only); a disabled button explained nothing. It is disabled only while busy.
  - **Phones get a sticky pay bar** whenever the summary's button is off screen
    (IntersectionObserver on `payRef`) — that button sat 1,718px down a 390px
    cart. It slides away when the real one is in view, so there are never two.
  - The select-all/remove bar appears only with two or more cakes.
  - A `preconnect` to `checkout.stripe.com` warms the redirect.
- **The confirmation page offers the pickup to the calendar**:
  `netlify/functions/calendar.mjs` serves an `.ics` built from the order rows
  (never from query text, or the domain would serve events strangers wrote),
  folded at 75 octets, with a 2-hour alarm — checked with Python's `icalendar`.
  Google Calendar gets its own template link, which works before the order
  number lands.
- **The cart says "Collection — Free", never a delivery fee.** There is no
  delivery. Both reference carts we were shown have a delivery line; copying it
  would be the kind of small untruth that costs a five-star review. For the same
  reason the summary rail carries a *Paying* note rather than a payment-method
  picker: the card is entered on Stripe's page, so a choice offered here would
  be a choice of something that does not exist.
- **A cart becomes one `orders` row per cake**, sharing `order_group_id` and
  `stripe_session_id`, differing by `cart_line` — one job per cake is how the kitchen
  works. The deposit is split proportionally with remainder cents on the first
  line, so `sum(deposit)` equals the Stripe charge **exactly**; a naive split
  loses a cent and the books never balance again. `discount` is always 0 on a
  web order; the column exists for discounts staff key in through ops.
- **An order is written from two doors, through one function.** `fulfilSession`
  in `netlify/lib/fulfil.mjs` is called by `stripe-webhook` AND by
  `order-status` — the latter only after fetching the session from Stripe with
  the secret key and seeing `paid`. Stripe recommends both
  (docs.stripe.com/checkout/fulfillment); the webhook covers a closed tab, the
  page covers a late webhook — and a **deploy preview**, whose per-build
  address no webhook can be registered to. Before this, a preview checkout took
  the money and the page waited forever for an order number. The duplicate
  guard returns before any side effect (contact, Make hook), so a race has one winner. A sandbox (`livemode: false`) order is
  written with **TEST ORDER** at the head of its notes, because it lands in the
  same order book the kitchen bakes from.
- **Idempotency is a unique index**, `(stripe_session_id, cart_line)`. A retried webhook
  hits 23505 and returns 200. So a failure can safely return 500 and let Stripe retry for
  three days — every write is idempotent.
- **Verify the webhook signature on raw bytes, handling `isBase64Encoded`**, and answer
  **400** on a bad one. A 200 tells Stripe the forgery was accepted. Never `JSON.parse`
  before verifying. `netlify/functions/webhook.test.mjs` asserts all of that.
- **A shop cake is 2 DAYS, the same as a custom cake** (order today, collect
  the day after tomorrow). Vaidik, 2026-10-11: "today I can order a cake for
  Tuesday and not Monday". It was next day from 2026-09-23 to 2026-10-11, and
  48 hours before that. The two rules now agree but live in different places
  and stay separate products — a change to one is not a change to the other.
  Every "ready tomorrow" / "next day" in the shop, `/order`'s fork and
  comparison, `terms.html` §2, the homepage shop link and the server error was
  rewritten in the same commit; grep for those words before shipping any copy. ~226 blog posts still say "48 hours";
  that copy is conservative, not wrong, and was left for a separate pass. The shop's rule lives in
  `LEAD_DAYS` in `netlify/lib/shared.mjs`, mirrored in `shop-app/lib/cart.ts`.
  `CUTOFF_HOUR` is the Sydney hour at or after which an order rolls to the day
  after; **24 means no cut-off** — an order at 11pm Sunday still offers
  Tuesday. Lower it to 18 the day a late order
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
  - **The newsletter popup** (`promo.js`): the primary action *is* subscribing — the heading,
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
- **No discount codes. Vaidik's call, 2026-10-06.** The 10% welcome code is gone
  end to end: the popup, the coupon email, the `/coupon` copy page,
  `check-coupon`, `couponFor`, the cart's discount box, the next-order code
  minted after each sale, and the terms clause. Do not bring any of it back as a
  "quick conversion win" — a first-order code was researched the same day and
  refused (it mostly discounts high-intent local buyers who would order anyway,
  and Stripe collects the mobile after the code is applied, so one-per-person
  can only match on email). The `coupons` table and `coupon_person_status()`
  are still in Supabase, unused; dropping them is a separate decision.
- **The popup is a newsletter signup and nothing else.** It asks for a first name
  and an email and posts to `/api/subscribe` → `netlify/functions/subscribe.mjs`,
  which upserts `marketing_contacts` with the **service role** (RLS, no write
  policy) and sends the welcome email once (see **Email** in the root `CLAUDE.md`). It deliberately does **not** call
  `MAKE_ORDER_HOOK_URL`: that hook feeds the web-order scenario, which emails the
  shop "New web order" for every payload it receives.
- **The popup's right panel is a festival countdown (2026-10-08).** Vaidik rejected
  the first version, a flavour-photo picker (built earlier the same day, deleted: it
  repeated what the cake photos already said), and chose option A of three concepts
  designed on a canvas (the others, **spin for a flavour** and **how many are you
  feeding** with a size slider, were not chosen and can be built from that canvas).
  Built phone-first: GA4 for the 90 days to 2026-10-08 is **mobile 3,264 of 4,671
  sessions (70%)**, desktop 1,388, tablet 19 (service account; Supermetrics' trial
  expired 2026-07-09). Phone = swipe strip of date tiles above the form; desktop =
  the same buttons as rows.
  - **It rolls on its own.** The headline is the nearest festival and the rows are the
    next four, from the `FESTIVALS` calendar in `promo.js` (20 dates, Karwa Chauth 2026 to
    Christmas 2028). **A festival within `CUTOFF_DAYS = 5` drops off** (headline and rows):
    there is no time left to pre-order, so the panel moves to the next one (Vaidik,
    2026-10-08: "keep regulating once the nearest festival is 5 days or earlier"). Beyond
    `HORIZON_DAYS = 120` nothing headlines, and with nothing in range the old static
    "Sweet news / perks" panel shows. Days are counted from **Sydney's** today (`Intl`,
    never UTC). Checked by faking the date at twelve points from 8 Oct 2026 to Dec 2028.
  - **Date sources, read 2026-10-08**: Raksha Bandhan, Karwa Chauth, Diwali and Bhai Dooj from
    Drik Panchang pages set to **Noble Park, Victoria** (Australian dates, not India's);
    Valentine's, Mother's Day (2nd Sunday of May) and Christmas are fixed rules; Holi from
    the `holidays` Python package (matched web sources for 2027, **2028's 11 Mar is
    package-only and unverified**). Navratri and Dussehra were dropped: no Australian
    source found, and Navratri's start can only be inferred. Lunar dates can sit a day
    either side between communities. **Extend the list before it runs out**:
    `verify-blog.mjs` prints a WARNING note under 150 days of calendar left (it never
    fails the deploy; a stale calendar degrades to the static panel).
  - **Taps are stored.** `marketing_contacts.festival_interests text[]` (migration
    `marketing_contacts_festival_interests`, applied 2026-10-08) takes the ids
    `subscribe.mjs` accepts as slugs (`[a-z0-9-]`, 12 at most, not a fixed list, so adding a festival to the calendar needs no server change); it is a union across signups and a resubmit with nothing
    tapped never clears it. Only the signup sends them.
  - ⚠️ **The panel promises "We'll email you when pre-orders open for each".** That is a
    promise to Vaidik's own marketing, so it has to be kept: when a festival pre-order
    opens, email the contacts whose `festival_interests` contains its id (marketing mail
    needs the signed unsubscribe, see **Email** in the root `CLAUDE.md`). If that is not going to happen, change
    the copy in `festPanel`/`done()` rather than leave it.
  - Phone band is ~220px (the old static one was 164px); the email field still lands on
    the first screen at 390x844 and 320x568.
- **Env vars (public site only, never on the ops site, never in a file)**:
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ONLINE_ORDERS_USER_ID`, `MAKE_ORDER_HOOK_URL`, and the
  optional kill switches `BLOCKED_DATES`, `MAX_WEB_ORDERS_PER_DAY` and
  `STRIPE_ENABLE_PAYTO`.
- **Stripe account settings (opened 2026-10-06, GNT Ventures Pty Ltd, AU).** Every one
  was a deliberate choice, so do not "tidy" them:
  - **Statement descriptor `NUM NUMS BAKERY`, shortened `NUMNUMS`.** Customers must
    recognise the charge or they dispute it; "GNT VENTURES" would be a stranger's
    name. Stripe bans the apostrophe (`< > \ ' " *`), so it is "NUMS", not "NUM'S".
    One descriptor for both shops.
  - **Radar is on Lite, which is free.** Standard is from about A$16/month and Stripe
    rolled existing accounts onto a free Standard trial that **ends 22 January 2027,
    then bills automatically** — switch back to Lite in the dashboard if it appears.
    The shop takes cards only (Apple Pay, Google Pay and Link ride the same rails), so
    Standard's cover for other payment methods buys nothing. Revisit only if fraud or
    disputes actually appear.
  - **Stripe Tax is OFF and must stay off.** Prices are GST-inclusive and `receipt.mjs`
    works GST out as 1/11 itself; automatic tax would add GST on top of prices that
    already contain it. If the onboarding form forces a product tax category, accept
    the pre-filled one and **never add a tax registration**. Indian sweets may fall on
    the other side of the GST line from cakes — confirm with the accountant before
    they are sold online.
  - **The account representative's email is the named person's own,** not the shared
    `info@` inbox: Stripe uses it for identity checks, security alerts and recovery, so
    it must be a mailbox one person controls. `info@` belongs in the public support
    email field instead.
  - **Test and live are separate worlds.** The webhook signing secret differs between
    them, so going live means a **new** webhook in live mode, not editing the test one.
    Test webhook `we_1UNLvVIa9RLenwWC0GmI24Y3`, events `checkout.session.completed` and
    `checkout.session.async_payment_succeeded`, URL
    `https://numnumsbakery.com.au/.netlify/functions/stripe-webhook`. Live keys go
    straight into Netlify and are never pasted into chat or a file.
    Live destination **"Num Nums — web orders (live)"** created 2026-10-11, same two
    events, same URL, API `2026-08-26.dahlia` (every session field `fulfil.mjs` reads
    exists there). `async_payment_failed` is deliberately not subscribed: PayTo is off,
    card failures never reach the webhook, and a failure writes no order to undo.
  - **A published site on test keys takes real orders for free (2026-10-11).** Two
    real customers (HP-1789, HP-1790) checked out on `cs_test_` sessions; a real card
    in Apple/Google Pay *succeeds* in test mode and moves no money. `fulfil.mjs` then
    labelled them "TEST ORDER … Delete once checked" with a deposit recorded, which is
    wrong on both counts for a real customer. Before publishing any build that shows
    the shop, confirm `STRIPE_SECRET_KEY` in Production is `sk_live_`. A guard that
    refuses `sk_test_` on the production host was proposed and is not yet decided.
- **Order emails run through Make (`MAKE_ORDER_HOOK_URL`).** Scenario **7790457**
  ("Num Nums — new web order alert", EU1, team 3066367) is webhook → shop alert → customer
  confirmation, both sent **from and to `info.numnumsbakery@gmail.com`** through a Gmail
  connection. The customer email is branded, has no coupon, says the balance is due on
  collection, and is skipped when no email was given. Three Make operations per order, so
  check the plan's monthly limit. The webhook URL is a bearer credential — anyone holding
  it can send fake alerts — so it lives in Netlify only. **Nothing else may post to that
  hook:** the scenario emails the shop for every payload, which is why `subscribe.mjs`
  does not call it. The `total` in the payload is the **deposit charged**, not the cake's
  full price, which is why the email says "Deposit paid".
  Since 2026-10-11 the payload also carries **what each cake is** (`cakeLines` in
  `fulfil.mjs`): `lines[]` (order_no, flavour, size, wording, ops_url), plus
  ready-to-map `cakes_text`, `cakes_html`, `ops_links_html` and `ops_url`, so a
  Make module maps one field instead of iterating. The wording is escaped in the
  HTML fields because a stranger typed it. Customer email shows `cakes_html`; the
  shop alert shows `cakes_html` and ends with `ops_links_html`. The Make templates
  are edited in Make, not here, so adding a field here does nothing until the
  scenario maps it.
- **Payment rails, and why the array in `create-checkout` is short.** `card` covers
  Visa/Mastercard/Amex/eftpos **and** Apple Pay, Google Pay and Stripe Link — those
  three are dashboard toggles riding the card rails at the same 1.7% + A$0.30, not
  separate integrations and not a subscription. Do not add them to
  `payment_method_types`. **PayTo** (1% + 30c, capped A$3.50 — cheaper than cards on
  anything over ~$200) is gated behind `STRIPE_ENABLE_PAYTO` because naming a method
  the Stripe account is not approved for makes Stripe reject the **whole session**,
  taking the checkout down rather than hiding one button. **PayPal is not available
  to Australian Stripe merchants at all** (EU except Hungary, UK, CH, NO, LI) — so it
  is a second full integration with its own SDK, webhook, payouts and disputes at
  2.9% + 30c, not a line in that array. Checked 2026-09-21.
- **The two shops keep different collection hours, and that is per store, in
  minutes.** Harris Park **11:00am–10:00pm**, Riverstone **9:00am–6:30pm**
  (Vaidik, 2026-09-21). `COLLECTION` in `ops/catalog.mjs` is the only place
  they are written down — it reaches the shop through `catalog.generated.mjs`
  and the functions through `shared.mjs`, so there is no second copy.
  - **Minutes from midnight, never an hour**, because Riverstone's 6:30 close
    cannot be expressed as an integer hour. There is no site-wide
    `OPEN_HOUR`/`CLOSE_HOUR` any more: one pair either offered Riverstone 9pm
    with nobody there, or cost Harris Park the evening that is most of its day.
  - `resolveDueAt(store, dueDate, dueMin)` takes the **store first** and
    validates against that store's slot list, not a range — so a time between
    the half hours is refused rather than silently rounded by whatever reads
    it next.
  - **The cart's `dueHour` became `dueMin` and old carts must be converted.**
    A cart sitting in somebody's localStorage holds `dueHour: 12`; read as
    minutes that is 00:12 — a plausible-looking number that is silently the
    wrong time. `readCart` and `priceCart` both convert. Do not drop those.
  - Changing shop clears a slot the new shop does not offer (`pickStore`),
    or Checkout greys out with nothing on screen saying why.
  - `order.html` (custom cakes) uses the same windows (`WINDOWS` in its
    calendar script) and asks the **shop first**, above a single date+time
    control ported from `NnWhenField`: the month is open on the page, a tapped
    day pops that shop's times under it. Changing shop clears a day now inside
    the lead time or a time the new shop does not trade. The gate fails if the
    location drops below the calendar or a separate time list comes back.
- **The collection time is chips, not a dropdown.** A dropdown hides the shape
  of the day: you cannot see that one shop trades until 10pm without opening it
  and counting. Built on real radio inputs, so arrow keys, Home/End and roving
  focus come from the browser — not an OS control in the sense the repo bans,
  because `appearance: none` leaves nothing of the native widget on screen.
  Focus is drawn by the label via `:has()`, since the focused element is the
  hidden input. `.nn-time-grid` uses a **fixed** column count, not `auto-fill`:
  inside a popup sized to its own content there is no width to fill, the two
  resolve against each other and the grid collapses to one column.
- **PayPal is not being added. Vaidik's call, 2026-09-21**, after seeing that it
  cannot ride the Stripe integration and costs 48c more per cake. Do not propose
  it again as a quick win — it is a second checkout to build and reconcile.
- **The writing preview goes UNDER the cake, never on it.** It was drawn over the
  photo in a script face at a fixed size and position, which is a promise the
  kitchen cannot keep: the cake is piped by hand, so every order would arrive
  "wrong" against a mockup we drew ourselves. `.cake-plaque` quotes the words back
  beneath the photo for checking instead. Keep the quotation marks — they are what
  makes it read as *your words, confirmed* rather than as a picture of the cake.
- **RLS is the only guard** and it is verified by signing up a throwaway customer and
  curling PostgREST with **only** its token — the UI proves nothing. A customer must read
  `[]` from every table, be refused every write, and be refused a `cake-photos` upload
  **with a valid mime type** (an invalid one is rejected by a content-type check in front
  of the policy, which is a false pass). `coupons` (unused since 2026-10-06) is the
  one exception: read-own via `lower(email) = lower(auth.jwt() ->> 'email')`, and
  no write policy at all.

## `/shop` — the offer, said where the choosing happens (Hormozi audit, 2026-10-06)

Full audit, Needs-Vaidik list and rejected ideas:
`plans/Shop Hormozi Conversion Audit — 2026-10.md`.

- **The board leads with the outcome, not the chore.** H1 is **"Pick any cake.
  It's eggless."**, under "No asking, no checking." The people buying want
  eggless because of faith or how their family eats; the dream outcome is not
  having to ask every bakery "does it have egg?". `/shop` is `noindex`, so no
  SEO cost.
  ⚠️ **"No one will guess it's eggless" was tried and rejected the same day
  (Vaidik, 2026-10-06):** nobody here is hiding that the cake is eggless,
  they came for it. Do not use that framing on the shop. (The homepage hero
  still carries it; that was not part of the decision.)
- **The promise strip and the product-page promise list state only what every
  order already gets**: eggless, ready in 2 days, the deposit refunded in full
  if cancelled 24h+ before, and the remake-or-refund guarantee. They mirror
  `DEPOSIT_RATE` and the window the cart and Stripe's button already state.
  **Do not add an item that is not already true of every order**, and never
  put a dollar "value" beside one: an invented reference value is the same ACL
  problem as was/now.
- **The refund window sits beside Add to order** because Baymard finds 60% of
  shoppers look for the returns position on the product page. Before this it
  first appeared one page later. Keep it there.
- **The deposit is shown in dollars** (`depositCents`, which floors exactly as
  the server does), never as "50%" alone.
- **The earliest date is named** ("collect Wednesday 7 October") by
  `EarliestPickup`, from the same `minDueDate()` the cart calendar uses. It
  renders after mount: the export is built on another day, and baking that day
  in would promise a date that has passed.
- **Per-serve price is a range** ("$3.57–$4.17 a serve") because servings are
  a range. Rounding to one flattering figure is not allowed.
- **The star rating is Riverstone's 4.6, always linked to that profile.**
  Vaidik read it on 2026-10-06 and chose not to name the shop on the page.
  The link is the condition for showing it: anyone can check it in one tap.
  It replaced an unsourced "4.6 · 50+" (ACCC/Bloomex: $1m for misleading star
  ratings). Known and accepted: third-party scrapes put Harris Park at 4.1.
  `GOOGLE_RATING.count` is optional and is shown only once it has been read
  off the profile, never estimated. The homepage hero still prints "50+
  Google reviews" with no source for the count.
- **Verbatim Google reviews on four product pages** (Butterscotch, Cookies &
  Cream, Mango, Pineapple), from the Review schema text in `index.html`,
  confirmed by Vaidik. They live in `flavour-copy.ts` as `review`. Never
  paraphrase or trim mid-sentence, and never write one.
- **There is no "N pickups left" line, and no daily cap (Vaidik, 2026-10-07).**
  It was built 2026-10-06 (`capacity.mjs`, `SaturdayLeft`) from a request for
  a fixed "2 pickups left Saturday", which was refused as invented scarcity
  and built as a live count instead. He then said he does not want a cap, so
  it was removed (it could never render without one). `create-checkout`'s older
  `MAX_WEB_ORDERS_PER_DAY` kill switch is untouched and **stays off unless the
  env var is set**; leave it unset. It counts web orders by **pickup day**,
  per shop, and counts cancelled web orders too. `dailyCap`/`webOrdersOn` stay
  in `shared.mjs` for it; any future "N left" display must use that same
  function, never its own count.
- **The remake-or-refund guarantee is written in `terms.html` §8
  (`#guarantee`)**: not what you ordered (flavour, size, writing, or a custom
  cake that does not match the confirmed design) or not fresh, reported at the
  counter or within 24 hours with a photo, means a remake or a refund of what
  was paid, the customer's choice. It sits right after the ACL mandatory text
  (Competition and Consumer Regulations reg 90), because a promise to remake
  or refund defective goods is likely a warranty against defects. The
  homepage and `/order` chips say "Not right? Remade or refunded" and link to
  it. "Love it or we'll make it right" is gone: it promised a remedy written
  nowhere. Any shop surface that mentions the guarantee links to
  `/terms#guarantee`.
- **Butterscotch has no nuts** (Vaidik, 2026-10-06). "Praline" is gone from its
  copy because the word implies nuts. Do not bring it back.
- **"Weekends book out first" and the cart's "four in five… book out" banner
  were removed.** Their only source was a code comment.
- **Size chips are three across until `lg`.** Six across overflowed at 820.
- **`terms.html` matches the shop since 2026-10-06**: standard cakes two days'
  notice (next day until 2026-10-11), custom cakes two days' notice, 50%
  deposit, deposit refunded in full more than 24h before collection. If any
  of those rules change, change the terms in the same commit, because the cart
  says paying accepts them.
- **Rejected 2026-10-06, do not re-propose:** a countdown to the midnight
  cut-off (the named date already carries it); dollar values beside included
  items; the 21st.dev listing card (built on strikethrough pricing); 21st.dev's
  rating group (Ark UI, a second primitives library); Easy UI's testimonial
  carousel (no verified testimonials, and it hides content on phones; Easy UI
  has no ecommerce templates at all); renaming "Signature Cakes" via MAGIC
  (decided 2026-09-21, and it is the GA4 key); a sticky CTA or quick-add on
  the board; a hardcoded "2 pickups left" (built live, then removed with the cap); "No one will
  guess it's eggless" as the shop H1. **Bonuses (candle, knife, box): not
  now** (Vaidik, 2026-10-06); revisit only when he raises it.
