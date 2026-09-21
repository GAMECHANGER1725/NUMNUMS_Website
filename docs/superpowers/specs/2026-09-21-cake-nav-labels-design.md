# Two cake doors, labelled so a customer can tell them apart

Date: 2026-09-21
Status: approved, not yet implemented

## The problem

The site sells cakes down two paths, and the navigation does not make clear
which is which.

- `/shop` — labelled **Signature Cakes**. Pick a listed cake, pay a 50%
  deposit, collect next day.
- `/order` — labelled **Custom Cakes**. Describe a cake you want made, get a
  quote, 48 hours' notice.

A customer who wants to buy a chocolate cake has to already know that
"Signature Cakes" is the range they can purchase. Nothing in the word says so.

On top of that, the shop's own navigation carries a **third** cake entry that
goes nowhere.

### The dead entry

`shop-app/components/ui/shop-header.tsx:28` holds
`{ href: "/cakes", label: "Our Cakes" }`.

`/cakes` was folded into `/order` in commit `9fc95f0`, which deleted
`cakes.html`. The static site's navigation lost the entry at that point. The
shop app keeps its own copy of the navigation — deliberately, so the shop does
not look like a second website — and that copy was never edited. The result:

| Surface | Navigation |
|---|---|
| 242 static pages | Signature Cakes · Indian Sweets · Custom Cakes · Locations · Blog |
| `/shop` pages | Signature Cakes · **Our Cakes** · Indian Sweets · Custom Cakes · Locations · Blog |

`netlify.toml` 301s `/cakes` to `/order`, so in production this is a redirect
hop rather than a hard 404. `serve.mjs` does not apply that redirect, so
locally it returns a genuine 404 — which is how it was reported.

`verify-blog.mjs` already fails the build on any internal link to `/cakes`,
but the check only walks static pages. `shop/` was never in its file list, so
the shop navigation rotted silently for a week while the gate stayed green.

## Decisions

Two decisions were taken before this design, and both close off alternatives
that were considered and rejected:

1. **Two clearly-labelled doors**, not one front door. No navigation dropdown
   grouping the ranges, and no chooser page at `/cakes`.
2. **The label pair is `Shop Cakes` / `Custom Cakes`.**

### Why not the dropdown

Commit `00acabe` (2026-09-14) built exactly that: a hover menu holding both
ranges, each with a line describing who designs the cake and how long it
takes, no page behind the trigger. It was reverted the same day at 16:57, in a
batch with two other rollbacks. The code is recoverable from git if this is
ever revisited.

### Why not a chooser page at `/cakes`

`/cakes` was deleted because its H1 — "100% Eggless Custom Cakes in Sydney" —
competed with `/order` for the same queries. This site has already paid once
for cannibalising itself. Putting a new page back at that URL reopens the
risk for a gain that better labels deliver without it.

### Why `Shop Cakes`

The two labels end in the same word and differ on one, and that one word is
the decision the customer is actually making: shop from what we have, or
commission something. It is also shorter than "Signature Cakes" (10 characters
against 15), which eases the six-label squeeze that forced the navigation's
hamburger breakpoint up to 1024px.

**This knowingly overrides a previous decision.** `CLAUDE.md` records that a
bare "Shop" was a placeholder that "said nothing about what was behind it",
replaced by the real category name "Signature Cakes"; `verify-blog.mjs` fails
the deploy if the navigation says just `Shop`. "Shop Cakes" is not that bare
label — it names the product and the action — but it moves back toward the
verb, and that was argued out once. The override is deliberate and is recorded
in `CLAUDE.md` as part of this work.

## Changes

### 1. Remove the dead entry

Delete the `/cakes` item from the `NAV` array in
`shop-app/components/ui/shop-header.tsx`.

The `/cakes` → `/order` 301 in `netlify.toml` **stays**. External links and
old inbound search results still land on it.

### 2. Rename the door

Replace the navigation label `Signature Cakes` with `Shop Cakes` on the
`/shop` link.

Measured scope: **242 static HTML files** (235 in `blog/`, 7 in the root),
carrying **712 occurrences** — three on most pages, being the desktop
navigation, the mobile menu and the footer, and two on a handful that lack one
of those. Every occurrence is inside a `class="nav-link"` or footer anchor;
**no blog post uses the phrase in prose**, which makes this a safe targeted
string replacement rather than a content edit.

Also update the label in `shop-app/components/ui/shop-header.tsx`, then
rebuild the export, which regenerates the 35 occurrences across 17 files under
`shop/`. Those files are build output and must not be hand-edited.

Resulting navigation, identical on both surfaces:

```
Shop Cakes · Indian Sweets · Custom Cakes · Locations · Blog   [Your order (2)]
```

### 3. Gates, so it cannot drift again

- Extend the existing `/cakes` link scan in `verify-blog.mjs` to cover the
  built `shop/` pages, not only static pages.
- Add a **navigation parity gate**: read the `NAV` array out of
  `shop-header.tsx` and assert its `href`/`label` pairs, in order, equal the
  single canonical list that `verify-blog.mjs` also checks the static pages
  against. Today the static expectations are written as separate inline
  regexes with no shared list, so the canonical list has to be introduced as
  part of this gate. The two navigations are required to be identical and
  nothing currently checks that — this is the root cause of the dead entry,
  not the dead entry itself.
- Update the existing label gate, which currently enforces "Signature Cakes"
  on the `/shop` link.

### 4. Record the decision

Add to `CLAUDE.md`: the label pair, the reason, and an explicit note that it
overrides the earlier "Shop was a placeholder" decision.

## Deliberately unchanged

These carry the range's *name* rather than acting as a door label, and each
has a cost to changing that this work does not buy back:

| Item | Where | Why it stays |
|---|---|---|
| `<title>` "Signature Cakes — order eggless cakes online" | `shop-app/app/page.tsx` | Retitling is an SEO decision and needs its own research pass |
| `section-label` "Signature Cakes" | `shop-app/app/page.tsx` | Still the range's name on the page |
| `item_category: "Signature Cakes"` | `shop-app/lib/analytics.ts` | A data key; changing it splits the GA4 series |
| `kind: 'normal'` | database | Existing rule — renaming the enum across ~15 call sites and the `customers` view buys nothing |

The `/shop` H1 is already "Pick your cake", so a customer arriving from
"Shop Cakes" lands on a page that reads as a continuation rather than a
different thing.

## Verification

- `node verify-blog.mjs`, `node ops/verify.mjs`, `node tests/checkout.test.mjs`
  and `node tests/webhook.test.mjs` all green.
- Every navigation target returns 200 over `node serve.mjs`.
- Both navigations screenshotted at 320, 768, 1024 and 1440 to confirm five
  labels plus the cart pill still fit above the hamburger breakpoint, with no
  horizontal scroll.
- Confirm no `href="/cakes"` remains anywhere, including `shop/`.
- Confirm both new gates fail when deliberately broken — a gate that cannot
  fail is not a gate.

## Out of scope

- The navigation dropdown.
- Any page at `/cakes`.
- Homepage CTA / intent-routing rework.
- The 1024px hamburger breakpoint.
- Making `serve.mjs` honour non-clean-URL redirects. Worth doing — it is why
  this looked like a 404 rather than a redirect hop — but it is a dev-server
  fidelity issue, not part of this change.
