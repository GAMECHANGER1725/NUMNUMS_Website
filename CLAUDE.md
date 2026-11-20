# CLAUDE.md — Frontend Website Rules

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Load order — and where the rules live (restructured 2026-11-20)
1. **`context/00-context.md`** — status, project-level decisions and why, numbers,
   open items. Imported below, so it is always loaded. It is the **only** place
   status lives; update it (and its version line) at the end of any session that
   changes status, a decision or an open item.
2. **This file** — rules that apply site-wide.
3. **The area file for what you touch.** Claude Code loads a folder's CLAUDE.md
   on its own when it reads a file there. If you edit by shell, or the change
   crosses folders, read the area file yourself **before** editing:

| Touching | Read first |
| --- | --- |
| `ops/` · `netlify/lib/push.mjs` · `netlify/functions/push-test.mjs` | `ops/CLAUDE.md` |
| `shop-app/` · `shop/` · checkout/webhook/order-status/receipt/calendar/subscribe/unsubscribe functions · `netlify/lib/{shared,fulfil}.mjs` · the popup, cart pill and account menu in `promo.js` · `terms.html` · prices, `SURCHARGE`, `COLLECTION` in `ops/catalog.mjs` | `shop-app/CLAUDE.md` (also loaded from `netlify/`) |
| `phone-agent/` · `netlify/functions/phone-agent.mjs` · `netlify/lib/phone.mjs` · the phone sections of `privacy-policy.html` | `phone-agent/CLAUDE.md` |
| `reviews-app/` | `reviews-app/AGENTS.md` |

A new rule goes in the file that owns its area, never in two places. The
original single-file CLAUDE.md is in git history at the commit before
2026-11-20's restructure; nothing was reworded when it was split.

@context/00-context.md

## Before Editing
- **Pull from GitHub first.** At the start of any message that asks you to change something in the
  website's files, run `git pull` before making edits, so you're working from the latest commit —
  other sessions/routines push directly to `main`. Skip this for read-only questions that involve
  no file changes.

## Log Everything — CLAUDE.md and the AI Brain
**Every fix, decision and brainstorm gets written down in two places, in the same
response it happens** (Vaidik, 2026-10-06):
1. **The CLAUDE.md that owns the area** (see the table above) — the rule or the reason, in the section it belongs to, so the
   next session and the claude routines cannot undo it.
2. **The AI Brain** (`/Users/vaidikpatel/Downloads/Home/My AI Brain/`) — the
   outcome, in the note that owns it: shop/checkout work goes in
   `projects/Shop Checkout Build.md` (checklist + dated timeline), business-wide
   calls in `companies/Num Nums Bakery/`. Follow that vault's own house rules
   (outcomes not activity, every number sourced, undecided things under
   "Open questions").
A brainstorm that was rejected is still logged, with why — that is what stops it
being proposed again. The AI Brain is outside this repo, so claude routines
cannot reach it; they log to the CLAUDE.md files only.

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
`ops/` is also independent: the internal staff app on its own Netlify site and subdomain (see `ops/CLAUDE.md`).

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
  matters**, see `ops/CLAUDE.md`.
- There is no test suite or lint config for the main static site. `verify-blog.mjs` is the closest
  thing to a test for blog content; there is nothing equivalent for the other static pages.

## Architecture
- **netlify.toml** is the source of truth for redirects, rewrites, and CSP headers — check it before
  assuming a route exists or a third-party script/fetch will work in production (CSP is stricter than
  localhost, see the CSP memory notes below).
- **Blog** (`blog/*.html`, 221 posts on disk 2026-11-20): each post is a standalone file. `blog/index.html` holds the
  card grid with topic filters. A new post must land in three places — `blog/index.html`, `sitemap.xml`,
  `llms.txt` — or `verify-blog.mjs` fails.
- **GBP automation** (`GBP/`): per-location posting rules (`gbp-posts-harris-park.md`,
  `gbp-posts-riverstone.md`), `image-bank.md`, and a `posts-queue.md`/`used-images.txt` dedup ledger.
  `.github/workflows/gbp-post.yml` watches `GBP/outbox/*.json` on push and relays queued posts to a
  Make.com webhook.
- **Reviews**: `netlify/functions/submit-review.js` (Netlify Function) forwards review submissions to
  a Make.com webhook. `reviews-app/` is the Next.js review form; its static export is the `review/` dir.
- **Ops app** (`ops/`): internal order log / baker queue / analytics for staff, backed by Supabase.
  Its own Netlify site, its own `ops/netlify.toml`, its own CSP. Rules: `ops/CLAUDE.md`.
- **Skills**: project-local skills live in `skills/<name>/`, symlinked into `.claude/skills/<name>/`
  for auto-discovery — see "Skill Resolution" below before editing any skill.
- Content workflows (blog, GBP, SEO audit) are largely claude-routine-driven — the rest of this file
  is their non-negotiable rule set.
- **`plans/`**: business/strategy plans (quarterly plans, roadmaps, decision docs — not code plans
  or PR descriptions). See **Business plans** under Deployment Workflow below for where these live
  and how they're kept in sync.

## Everything is branded. No exceptions.

**Whatever we make, it must be branded for Num Num's Bakery** — every email,
every page, every landing page, every PDF, every internal tool screen. There is
no such thing as a "quick unstyled version": the plain four-`<p>` coupon email
shipped that way and read like a generic store. `brand_assets/num_nums_brand_guidelines.html`
is the binding source — read it before designing anything.

- **Rose Petal `#C85478`** (primary/CTA), **Dark Espresso `#2C1A0E`** (text),
  **Warm Chestnut `#5C3A22`** (body), **Vanilla Cream `#FFF8F2`** (background),
  **Soft Dough `#F5EBE0`** (sections), **Bitter Cocoa `#4A2518`**.
- **Riverstone Teal `#4EC4D8` is Riverstone-only.** Never in global material —
  not on the main site, not in an email, not on Harris Park content.
- **Customer-facing headings are Cormorant Garamond; body text and UI are Jost.**
  ⚠️ **Vaidik reversed the Jost-headings call on 2026-10-06** ("on the hero it
  doesn't look traditional") and restored the font the live site always had.
  This is the brand guide's own rule again. Do **not** re-apply Jost to headings
  on the public site, the shop, the popup or the review form on the strength of
  the 2026-09-20 / 2026-09-29 commits (`4de1ca12`, `44ce036c`, `09b857bd`,
  `bed270d2`) — they were undone on purpose.
  - Static pages: `.font-display` = Cormorant, hero `<h1>` included
    (Cormorant 600, `-0.03em`). Shop: `--font-display` is Cormorant again.
  - **`ops/` is the exception and stays Jost** (Vaidik: "leave OPS") — staff
    app headings are Jost 300, `-0.02em`. Emails were not part of the reversal
    and still use the Jost/ornament split in `email-shell.mjs`; ask before
    touching them.
  - Jost stays the body/UI face and **is never set above weight 500**.
  - `.font-ornament` in the shop is still Cormorant; it now matches `.font-display`.
- **Prioritise `brand_assets/Logo_TParent.png` whenever you need the logo.** It
  has real alpha, so it sits on any background with no white plate to hide and
  no badge to wrap it in. `Logo_wName.png` is RGB with a baked-in near-white
  plate and is 1.27MB — only reach for it on a white surface, and resize it.
  `brand_assets/email-logo.png` is the 13KB email-sized cut of TParent; it
  carries no wordmark, so set the name beside it as **live text**.
- Voice: warm not gushing, premium not pretentious, confident not pushy. Always
  say **100% eggless**. Never "Adult Cakes".

### Email
They all share **one** shell — `netlify/lib/email-shell.mjs`. Restyle there,
never in one message. Today there are three (the coupon email was deleted with
the 10% offer on 2026-10-06; any future newsletter is built from the same shell
and must carry its `unsubscribe` slot):
1. **Newsletter welcome** — `netlify/lib/welcome-email.mjs`, sent once by
   `subscribe.mjs` via Resend to a *new* subscriber only (not a resubmit). It is
   a note **from Tarun Patel, founder**, so every fact in it must already be on
   `about.html` — no new claims under a real person's name. From
   `orders@numnumsbakery.com.au` as "Tarun at Num Num's Bakery", **reply-to
   info.numnumsbakery@gmail.com**. A failed send never fails the signup.
2. **Confirm signup** and 3. **Reset password** — Supabase templates, which are
   *not* sent by our code. Generate them with `node scripts/build-auth-emails.mjs`
   into `supabase-email-templates/`, then **paste each into the Supabase
   dashboard** (Authentication → Emails). `verify-blog.mjs` fails the build if
   the checked-in files drift from the generator, but nothing can detect that
   the dashboard is stale — re-paste after any change.

Email is not the web, and these differences are load-bearing:
- **Tables, never flex/grid** (Outlook renders through Word).
- **Inline styles.** The `<style>` block may only carry media queries and dark
  mode; the mail must still be correct with the whole block dropped.
- **Anything that must be read is live text, never an image** — most inboxes
  block images by default, so a code baked into a picture is a dead end.
- **Always send a plain-text part** alongside the HTML.
- **An email cannot run JavaScript.** Every client strips `<script>`, so a
  "copy to clipboard" button has to be a link to a page that can.
- **Never hardcode the production host.** Links go through `siteFor(req)`, which
  allowlists the request origin, so a preview send is actually testable. A raw
  `Host` echoed into a link is a phishing vector.
- **Marketing mail needs a working unsubscribe** (Spam Act 2003) — `/unsubscribe`,
  signed. Transactional mail must **not** have one.

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.
- **Invoke the `blog-write` skill** before writing any blog post, every session, no exceptions — including scheduled/claude routine runs. Never hand-write a post by copying an existing one from `blog/`.
- **Invoke the GBP rules file** before writing any Google Business Profile post: read `GBP/gbp-posts-harris-park.md` or `GBP/gbp-posts-riverstone.md` and complete its **Anti-repetition check** before drafting.

## Skill Resolution — read this before writing content
Project skills live as real, git-tracked files under **`skills/<name>/`**. Each is symlinked from
`.claude/skills/<name>` so it is auto-discovered and invocable by name. **Both the real file and
the symlink are tracked**, so claude routines get the skill too.

`.gitignore` ignores `.claude/*` but negates `!.claude/skills/`. It must be `.claude/*`, not
`.claude/` — git will not descend into an excluded directory, so a negation under it never fires.
Do not "simplify" that back to `.claude/`; it silently un-tracks every project skill.

- ✅ Edit `skills/<name>/SKILL.md` (or via the symlink — same file).
- ❌ Never edit `~/.claude/plugins/cache/…` — version-pinned, wiped on plugin update, absent in the claude.
- ⚠️ Symlinking a skill under `.claude/skills/` is now **correct and required**. (Older guidance here
  forbade it because `.claude/` was fully ignored. That is fixed — see the negation above.)

### `blog-write`
Source of truth: `skills/blog-write/SKILL.md`. The claude routine reads it and appends new checklist
patterns after every post. If the loaded skill does **not** contain a section titled *"Num Nums
Bakery HTML Project — Non-negotiable Pre-publish Checklist"*, you have the generic plugin version.
**Stop and read `skills/blog-write/SKILL.md` directly before writing.**

### `seo-audit`
Source of truth: `skills/seo-audit/`. A **verbatim, byte-for-byte vendored copy** of the `claude-seo`
plugin v2.0.0 (`agricidaniel-claude-seo`), used by the NumNums-SEO-Weekly routine because plugins
are not installed in the claude sandbox. See `skills/seo-audit/VENDORED.md`.

- ❌ **Never edit anything under `skills/seo-audit/`.** It must stay identical to upstream so the
  0–100 health score is comparable week over week and against upstream.
- Project-specific rules (eggless-only scope, Wikidata `sameAs`, sitemap/`llms.txt` as Critical)
  belong in the **routine prompt**, which passes them to the skill as input — never baked into the
  skill.
- Requires `pip install requests beautifulsoup4 lxml`. It is not stdlib-only; `scripts/fetch_page.py`
  exits immediately without them.


## No OS controls, anywhere

A native `<select>` or `<input type="date">` hands its list to the operating
system — a grey iOS wheel, an Android system sheet, in somebody else's
typeface. On a site this deliberately styled it is the one control that looks
like another app. `order.html` replaced its own long ago; the shop now does too.

- **`verify-blog.mjs` fails the deploy** on a native `<select>`, `type="date"`
  or `type="time"` in `shop-app/**/*.tsx`, on a static page with a `<select>`
  and no `.nd-*` enhancer, and on an enhancer with no `fit()`. All three are
  two-line mistakes that are invisible until somebody taps the control.
- **The shop uses `NnSelect` and `NnWhenField`** (`shop-app/components/ui/`),
  built on **Base UI** — already a dependency, so no new one. A listbox has to
  answer type-ahead, Home/End, PageUp/Down, Escape, focus return and
  `aria-activedescendant`; hand-rolling that is how a keyboard user ends up
  unable to buy a cake. The calendar grid *is* hand-written, because a month of
  buttons does not need a library — only its positioning does.
  ⚠️ **Base UI is the one primitives library. Do not add Radix or a shadcn
  block that pulls it in** — `@radix-ui/react-popover`, `-select`, `-slot` all
  do the same jobs as things already here, and a second set means two lots of
  positioning, portal and focus behaviour to keep in step. The project *is*
  shadcn-shaped (`components.json`, `components/ui/`, Tailwind 4, TS 5), so a
  pasted shadcn component looks like it will drop straight in; it will bring
  Radix with it. Port the markup, keep Base UI.
- **Date and time are ONE control** (`NnWhenField`), not two. They are one
  decision — *when am I collecting this* — and splitting it made the customer
  answer half, look away, and answer the rest. The **calendar sits open on the
  page** and tapping a day pops the times out of that day. It replaced
  `date-field.tsx` and a standalone `time-picker.tsx`; both are deleted, do
  not resurrect them. Four things in it are load-bearing:
  - **One popover, re-anchored** — `Positioner` takes an `anchor`, so the same
    popup moves to whichever day was tapped. Thirty mounted popovers to show
    one is thirty sets of portal, focus and positioning state.
  - **`side="bottom"`, not `"right"`.** Beside the day looks better on a wide
    canvas and is wrong everywhere else: there is no room either side of a
    40px cell on a phone, so it flipped into a sliver and clipped the chips.
  - **The popup needs a DEFINITE width** (`width: min(var(--available-width),
    20rem)`), and only then can `.nn-time-grid` use `auto-fit`. Sized
    `max-content`, the popup measured the grid's minimum while the grid tried
    to fill a width that did not exist yet; they resolved against each other,
    the grid overflowed and `overflow-y-auto` **clipped it horizontally** —
    23 chips rendered, 17 visible, six collection times silently gone on a
    phone. Count *visible* chips when testing this, not rendered ones.
  - **Focus return is manual.** There is no `Popover.Trigger` — the anchor is
    a day button — so closing must refocus it, or a keyboard user lands back
    on `<body>` at the top of the page.
  - **Tapping a day commits it immediately**, clearing the time if the day
    changed. Deferring the date until a time was picked left the calendar
    highlighting the old day, the popover headed with the new one and the
    summary saying a third thing — three answers to "when" on screen at once,
    which is what read as the picker glitching. A date with no time cannot
    reach checkout because `ready` requires both.
  - **The times are a scrolling list in a box, not a grid of chips.** 23
    half-hour slots as buttons was a panel the size of the calendar it hangs
    off. Band headings are `position: sticky`. Focus must not look like
    selection: the chosen row is filled rose with a tick, focus is an inset
    outline, and nothing else may imitate the filled state.
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
- **Greyed days are the rule made visible**: inside the lead time, or
  past the 120-day horizon. A date you can pick and the server then refuses
  reads as a broken form rather than as a rule.
- Audited open at 320×568, 430×740, 900×420 and 1440×900, on the store list,
  the ten-entry time list and the calendar: all inside the viewport, scrolling
  inside themselves, no tap target under 32px. Re-run that sweep after touching
  either component.

## No smooth-scroll library, no reading progress bar (site-wide)

- **There is no smooth-scroll library. Removed site-wide 2026-09-21 (Vaidik).**
  Lenis is gone from all 240 static pages and from `promo.js`. Scrolling is the
  browser's, and anchor links smooth-scroll through the `scroll-smooth` class —
  the old `html { scroll-behavior: auto !important }` override existed only so
  the library could own scrolling, and went with it.
  The **pink reading progress bar was removed too** (Vaidik, 2026-10-06) — the
  3px `#C85478` fixed bar at the top of every static page and blog post. Do not
  add it back, and do not copy it from an old post into a new one. (The `/order`
  form's own completion bar is a different thing and stays.)
  ⚠️ Do not reintroduce a scroll library. It brought a CSP entry, a CDN
  request, and a class of bug where an overlay could not scroll unless it
  carried `data-lenis-prevent` — the popup needed exactly that hack, and it is
  no longer necessary. Earlier notes in this file and in memory required Lenis
  on every blog post; that requirement is withdrawn.

## Site structure — a shop with marketing around it

Modelled on how The Cheesecake Shop and Bannos actually lay their sites out:
**product entries first in the nav, story and policy in the footer, blog last.**
Both put every marketing page (our story, awards, franchising, store locator)
in the footer only, and lead the homepage with products before any story.

- **The nav is `Shop Cakes · Indian Sweets · Custom Cakes · Locations · Blog`,
  plus the cart pill.** It is identical on all ~242 static pages and is
  re-created in React by `shop-app/components/ui/shop-header.tsx`, so the shop
  is not a second-looking website. `verify-blog.mjs` fails the deploy if a page
  drifts out of that shape — the markup has a dozen whitespace variants across
  those files, so a page that misses an edit looks completely normal and just
  quietly keeps sending people to the old door.
  ⚠️ **Two lists, so compare them.** The static side is 242 hand-written files
  and the shop side is one array, so they never drift in the same commit. The
  shop kept an `Our Cakes → /cakes` entry for a week after the static pages
  dropped it, shipping a dead nav item on every `/shop` page, because the gate
  that bans `/cakes` links walked static pages only. It now walks the built
  `shop/` too, and a parity check asserts `shop-header.tsx`'s `NAV` equals the
  canonical list in order. **Any new nav check must cover both surfaces**, or
  it is measuring half the site.
- 🔒 **THE NAVBAR IS ONE NAVBAR. Vaidik's standing rule, 2026-09-22.**
  Font, size, spacing, buttons, hover and active state are **identical on
  every page** — the static pages, the shop, and anything added later. It is
  the one component a visitor sees on all 243 pages, so a difference reads as
  two different websites.
  **Every navbar edit gets made on BOTH surfaces in the same commit** —
  `index.html`-style static markup plus `promo.js`, *and*
  `shop-app/components/ui/shop-header.tsx` plus `globals.css` — and is
  verified by measuring computed styles on a static page and a shop page side
  by side, not by looking at one.
  What had drifted, found 2026-09-22 and fixed:
  - **The cart pill was two different buttons.** The shop filled solid rose
    the moment the cart had something in it; the static pages kept an outline
    with a small rose dot, because their filled state was scoped to a
    `max-width:1024px` media query. On a laptop the same cart was filled on
    `/shop` and outlined everywhere else. `#nav-cart` now opts out of the
    `.btn-hover-interactive` slide-swap and matches `.nn-cta` exactly — label
    plus arrow at rest, solid when holding something, at every width. The
    override is injected once by `promo.js` and **scoped to the id**, so other
    `.btn-hover-interactive` buttons keep their animation.
  - Fill colour was `#fff` on static and `#FFF8F2` on the shop. "Almost the
    same white" is still a difference.
  - The `.nn-pill` container had drifted to a cream tint with no blur against
    the static's rose tint and `blur(14px)`.
  - The shop had **no sliding indicator** — the static pages' chip that rests
    behind the current page and follows the pointer. Ported as `.nn-indicator`,
    measured from live geometry (`offsetLeft`/`offsetWidth`) rather than an
    index, because the labels are different widths.
  Known and accepted: the static chip sits ~3px left and 2px taller than the
  shop's, from its own `- 4` offset arithmetic. Invisible at 8% opacity, and
  correcting it means editing 242 inline scripts.
  The one deliberate difference: `/shop` hides the pill entirely when the cart
  is empty, because "Order Now" on the shop's own landing page points at the
  page you are standing on — and since 2026-10-06 (Vaidik) so does every
  `/shop/cakes/*` page, where the empty pill was the loudest button on screen
  and led away from the cake being looked at (`showCart = n > 0 || (path !==
  "/" && !path.startsWith("/cakes/"))`). Static pages have no product pages,
  so `promo.js` has no matching rule; add one the day they do.
- **`/cakes` no longer exists — it is a 301 to `/order`.** Its H1 was
  "100% Eggless Custom Cakes in Sydney", competing with `/order` for the same
  queries on a site that has already paid once for cannibalising itself, so
  its galleries, flavours and eggless section were folded into `/order` and
  the page deleted. The redirect stays, because old inbound links still land
  on it. **Do not put a page back at that URL** — a chooser page there was
  considered on 2026-09-21 and refused for exactly the original reason. An
  internal link to `/cakes` costs a redirect hop and fails the build.
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
  It is the **order confirmation**: a collection ticket (day, time, shop,
  address, map link, order numbers) above a torn edge, the cakes and the
  money below it — total, deposit paid, **balance at collection** — then the
  shop phone and email (`SHOP_PHONE`/`SHOP_EMAIL` in `cart.ts`). It reads all
  of that from `order-status`, which returns a **first name only**: a
  confirmation link is one forward away from a stranger. `success_url` and
  `cancel_url` go through `siteFor(req)`, so a deploy preview returns to
  itself — hardcoded production sent every preview test to a 404.
  The page is a **ticket** (`components/ui/ticket-confirmation-card.tsx`, a
  ported shadcn block): its barcode is **real Code 39** of the order number —
  decoded back to `RV-1731` by zxing when it was built — not the block's
  hash-seeded bars, and its card row is the card Stripe says was used
  (`order-status` asks once the order exists, and may fail silently).
- **The customer's receipt is the ops tax invoice**, served by
  `netlify/functions/receipt.mjs` from `receiptSource` — one document, so the
  counter's copy and the customer's cannot disagree. It is a URL keyed by the
  Stripe session id + order number: inline to view, `&download=1` for an
  attachment, because a blob download is a silent no-op on iPhone. The photo
  is the flavour's JPEG cut in `/shop/cakes/*.jpg` (a PDF image must be JPEG;
  the site's are webp), fetched from the same site and skipped on any failure,
  headed **YOUR CAKE** via `ctx.photoLabel`. It is called at
  `/.netlify/functions/receipt` directly — no `netlify.toml` redirect, since
  adding one coincided with the failed deploys. `button-download.tsx` fetches
  the file first (real byte progress, and a failure shows on the button) and
  then opens the URL; it does **not** use shadcn's `Button`, which brings Radix.
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
- Payment is Stripe's hosted page, which carries **no nav** of ours — nav in a
  payment flow is an exit, and neither chain puts one there either.

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
- **The homepage hero's poster is the video's own first frame (2026-10-08).**
  `brand_assets/hero-poster.webp` (1920px, 47KB) is frame 0 of
  `Hero_Section_compressed.mp4`. It used to be `num_nums_HPphoto.jpeg`, a blurry
  518×388 photo of the **shopfront**, so every visitor saw the shopfront for
  200–500ms (the video is `preload="none"`) and then the hero **jumped to a
  cake** — Vaidik's report, present on the live site and the new build alike.
  A poster must show what the video will show first, or the swap reads as a
  glitch. If `Hero_Section*` is ever re-cut, re-extract it:
  `ffmpeg -i Hero_Section_compressed.mp4 -vf "select=eq(n\,0),scale=1920:-1"
  -frames:v 1 poster.png && cwebp -q 78 poster.png -o brand_assets/hero-poster.webp`
  (this ffmpeg has no WebP encoder; `cwebp` is on the machine). The shopfront
  photo stays in use on `about.html`, schema and blog cards; only the hero poster
  and its preload `<link>` in `index.html` changed.
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
- **The 2-day rule is enforced in ONE place: which days the calendar offers.**
  It is **calendar days from Sydney's today** (`LEAD_DAYS = 2`, built from
  `Intl` wall-clock parts), so any time on that day is bookable and a phone in
  another zone sees the same first day. History, from the 48-hour version:
  `minDate` used to truncate `now + 48h` to midnight, so it enabled a day whose
  early times were still inside the lead time — at 5:04pm Monday it offered
  Wed 16 Sep, and the default 10:00 AM was 7.1 hours short, so pressing Send on
  the first available date was rejected. The person it refused was always the
  one in a hurry. The earliest day is now the first whose FIRST offered pickup
  time was a clear 48 hours out, and the instant
  re-check at submit is **deleted**, not adjusted — a rule enforced twice is a
  rule that can disagree with itself. Proven across all 24 order hours.
- **Pickup date and time are one control, after the shop.** Hour + minute +
  AM/PM was six taps and it is what made the rule contradict itself; a separate
  date popover and time list made the customer answer half and come back.
  Occasion is gone entirely. The name is **first name only**, remembered in
  `localStorage`. Fields flag on blur, not only
  after Send.
- **The progress bar reads its required fields defensively.** Removing a field
  from the markup otherwise takes the whole function down with a TypeError on a
  null `.value`, and that function's failure takes the submit listener with it.
- **Nothing on `/order` may route away from its own form.** Six links did: the
  nav pill's "Order Now" (to the Signature shop), its mobile twin, three gallery
  CTAs that reloaded the page to the top, and the pricing widget's green
  "WhatsApp to Order". The nav pill needs fixing in **`promo.js`** as well as
  the markup — `paintCart` overwrites that href on every load.
- **The newsletter popup does not open on `/order`.** It locks body scroll and fires
  at 50% scroll depth, which a half-filled form reaches easily, so it was
  covering somebody mid-order to sell them a newsletter.

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
- **No page may say we deliver (SEO routine, 2026-11-01).** `blog/eggless-cake-delivery-sydney`
  described a delivery service that never existed: delivery windows, a driver
  ETA, $15-$25 fees, "two dispatch points", 0.5-2 kg sizes. `cake-delivery-areas-sydney`
  said delivery "can be arranged". Both now say pickup only and keep their URLs
  (the delivery query still deserves a truthful answer). Before writing about
  delivery, grep for `we deliver|delivery window|delivery fee|dispatch`.
- **We are not a halal-certified kitchen.** A post said "halal-certified
  ingredients are used as standard" while another says the opposite; the claim
  is gone (2026-11-01). Say "halal-friendly, ask about ingredients" unless Vaidik
  confirms a certification.
- **AggregateRating sits on the Riverstone Bakery node only.** 4.6 is
  Riverstone's Google rating; it was also on the Harris Park node (2026-11-01).
  The `reviewCount: 50` is unsourced: replace it with the number read off the
  profile, never an estimate.
- **Logos shown at 56px or less use `Logo_TParent_56.webp` (4KB), not
  `Logo_TParent.png` (1.6MB).** Same artwork. Every page loaded the 1.6MB file
  twice for a 48px circle until 2026-11-01. Keep the PNG for JSON-LD `logo` and large uses.

### SEO — merges, the Christmas page, and `/cakes` (2026-11-12)

Fix plan: `plans/SEO Fix Plan — 2026-10.md`. Evidence: `seo-baseline/2026-11-07/`.
- **A page Google drops gets merged, never re-requested.** Round 2 (2026-11-12)
  merged the 14 pages that fell out of the index between 10 Oct and 7 Nov, by
  `seo-baseline/2026-11-07/merge_round2.py` (the mapping is in there; reuse it for
  round 3). Suburb pages → the location hub; anniversary/graduation/housewarming/
  Father's Day → `best-cake-sydney` (which gained an occasions card naming them);
  `wedding-cake-sydney-north-west` → `tiered-cakes-sydney`; vegan-vs-eggless,
  recipe-vs-bakery and why-we-chose-eggless → `eggless-cake-vs-regular-cake`.
  Retired pages are deleted, 301'd in both forms, and every older redirect that
  pointed at them was repointed to the final survivor: **no redirect chains**.
  Check with the netlify.toml resolver in that folder's notes. `serve.mjs` does
  **not** read netlify.toml rules, so a local curl 404 on a merged URL proves nothing.
- **A merge target must be a blog post.** `verify-blog.mjs` only accepts
  `/blog/<slug>` survivors; a redirect to `/about` reads as an orphan.
- **The nav-count gate follows the post count** (`posts + 1`), not a fixed 230.
  The fixed floor failed the build the day posts were merged away.
- **`eggless-cakes-christmas-sydney` is the Christmas owner page**, rewritten
  2026-11-12: order-by dates for 2026 (two days' notice, so Tue 22 Dec for
  Christmas Eve), the size/serves/price table from `ops/catalog.mjs`, shop and
  custom paths, our own product photos. It says Christmas-period hours may differ
  and to confirm them, because nobody has told us the 25th/26th hours. **Update the
  dates each November**, and never put invented "December order data" back.
- **No structural SEO changes until the 8 Dec 2026 read** (decided 2026-11-18). Google's
  November 2026 core update (10 Nov, ~2 weeks) moved our desktop head terms while nothing
  of ours was live, and the 12 Nov work went live 18 Nov in the middle of it. Merges,
  retitles of earning pages, or new pages before 8 Dec make both effects unreadable.
  The 1 Dec SEO routine reports; it does not restructure. Factual fixes are still fine.
- **Google still has the old `/cakes` page indexed** (last crawl 19 Sep, before the
  301 went live on 8 Oct), so it keeps the brand searches and `/order` looks
  weaker than it is. The fix is a recrawl: Search Console URL Inspection →
  Request indexing on `/cakes`. The API cannot request indexing for this.

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
- **Check what was *published* before blaming a commit for a GSC move.** Auto-publish is
  off, so `main` and production can be weeks apart: nothing was published 14 Sep – 7 Oct
  2026, and the late-September click dip happened with none of that period's commits live
  (`seo-baseline/2026-10-10/CHECKPOINT-REVIEW.md`). Read publish times with
  `netlify api listSiteDeploys` (site `7874621e-…`, page through, `published_at`).
  Publishing one change at a time is what makes an SEO effect attributable.
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
2. `plans/` in this repo (so it travels with the codebase and claude routines can read it).

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
