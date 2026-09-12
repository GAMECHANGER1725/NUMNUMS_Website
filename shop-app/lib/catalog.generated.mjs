// GENERATED from ops/catalog.mjs by scripts/sync-catalog.mjs — do not edit.
// What the shop actually sells. Mirrors the canonical FACTS block in
// verify-blog.mjs (the build gate) — if a price or flavour changes, it changes
// THERE first, then here, then on /cakes and /order.
//
// Kept as data, not hardcoded <option> markup, so the order form, the baker's
// tally and any future report all read the same list.

/** size -> base price and how many it serves. */
export const SIZES = [
  { code: '6 inch',  label: '6"',  serves: '6–8',   price: 39.99 },
  { code: '8 inch',  label: '8"',  serves: '12–14', price: 49.99 },
  { code: '10 inch', label: '10"', serves: '20–22', price: 74.99 },
  { code: '12 inch', label: '12"', serves: '25–30', price: 89.99 },
  { code: '14 inch', label: '14"', serves: '40–45', price: 114.99 },
  { code: '16 inch', label: '16"', serves: '50–55', price: 134.99 },
  // Sold over the counter by the piece, not a whole cake — no serving count
  // and no fixed price, so staff type the amount.
  { code: 'Slice',   label: 'Slice', serves: null,  price: null },
  // A stacked cake is not one of the sizes: it is a list of them, and its price
  // depends on the build. Picking it opens the tier boxes and the size becomes
  // whatever those say.
  { code: 'tiered',  label: 'Tiered / tall', serves: null, price: null },
];

/** The size code that means "the size is the tier list below". */
export const TIERED = 'tiered';

/**
 * Tiers are written the way the shop says them out loud — bottom first, width
 * across then height tall: `Bottom 8"w 6"h · Top 6"w 6"h`.
 *
 * It is stored on the order as that one string rather than as its own columns.
 * A tier list is read far more often than it is queried, the shape varies (two
 * tiers, four, a tall single), and every screen and the invoice already know
 * how to print `size`.
 */
export const tierLabel = (i, n) => {
  if (n <= 1) return 'Single';
  if (i === 0) return 'Bottom';
  if (i === n - 1) return 'Top';
  return n === 3 ? 'Middle' : `Tier ${i + 1}`;
};

export const tierText = (tiers) => tiers
  .filter((t) => t.w && t.h)
  .map((t, i, kept) => `${tierLabel(i, kept.length)} ${t.w}"w ${t.h}"h`)
  .join(' · ');

/** Reads a stored size back into boxes. Anything else gives an empty list. */
export const parseTiers = (size) =>
  [...String(size || '').matchAll(/(\d+(?:\.\d+)?)"w\s*(\d+(?:\.\d+)?)"h/g)]
    .map((m) => ({ w: m[1], h: m[2] }));

export const isTiered = (size) => parseTiers(size).length > 0;

/**
 * The 15 orderable flavours. This list is build-gated: verify-blog.mjs fails
 * the deploy if the site ever mentions a flavour outside it.
 *
 * Rasmalai and Ferrero Rocher carry a size-dependent surcharge (+$10–45 and
 * +$5–35 respectively), so they are flagged premium and the form prompts for
 * the final price rather than guessing a number that could reach a customer.
 */
export const FLAVOURS = [
  { name: 'Vanilla' },
  { name: 'Chocolate' },
  { name: 'Red Velvet' },
  { name: 'Butterscotch' },
  { name: 'Black Forest' },
  { name: 'White Forest' },
  { name: 'Strawberry' },
  { name: 'Mango' },
  { name: 'Cookies & Cream' },
  { name: 'Lychee' },
  { name: 'Pineapple' },
  { name: 'Tiramisu' },
  { name: 'Blueberry' },
  { name: 'Rasmalai',       premium: true },
  { name: 'Ferrero Rocher', premium: true },
];

/**
 * The picture of the cake itself, for a **normal** cake — one we sell off the
 * board, where the flavour is the whole description of what it looks like.
 *
 * Derived from the flavour rather than kept in a lookup, so a new flavour needs
 * nothing but its entry above and a file dropped into `ops/cakes/`; `verify.mjs`
 * fails the deploy if those two ever disagree. Returns null for anything not on
 * the list, including a blank flavour, so the caller falls back to a placeholder
 * rather than a broken image.
 */
export const flavourSlug = (name) => String(name || '')
  .replace(/&/g, 'and').trim().replace(/[^A-Za-z0-9]+/g, '-');

export const cakeImage = (name) =>
  (FLAVOURS.some((f) => f.name === name) ? `./cakes/${flavourSlug(name)}.webp` : null);

export const sizeByCode   = (code) => SIZES.find((s) => s.code === code) || null;
export const isPremium    = (name) => Boolean(FLAVOURS.find((f) => f.name === name)?.premium);
export const basePrice    = (code) => sizeByCode(code)?.price ?? null;

/**
 * A normal cake's price always ends in .99 — psychological pricing, and what
 * every SIZES entry already reads. This is the safety net, not the source: it
 * guards the one moment a normal cake's price is set without a human looking
 * at it (the size autofill), so a future catalogue edit that lands on a round
 * number ($50 instead of $49.99) still shows the shop's actual pricing rather
 * than silently breaking it. Rounds *down* — $50.00 becomes $49.99, never
 * $50.99 — and does nothing to a price that is already .99, or to anything a
 * person typed by hand (custom-cake quotes are real numbers, not this rule).
 */
export const toNinetyNine = (price) => {
  if (price == null) return price;
  const cents = Math.round(price * 100);
  if (cents % 100 === 99) return price;
  // The whole dollar just below, minus a cent — never up. $50.00 -> $49.99,
  // and $50.50 also lands on $49.99: "round down" means the .99 at or below
  // the price, the same rule as tax rounding, not "shift by exactly 1c".
  const dollars = Math.floor(cents / 100);
  return dollars > 0 ? (dollars * 100 - 1) / 100 : price;
};


/**
 * What a premium flavour adds, in **cents**, per size.
 *
 * Until now this lived only in `order.html`'s inline script and was gated by
 * nothing, which meant the one number a customer is charged extra could drift
 * from the one the shop quotes. It is here so the web checkout, the ops form
 * and the public page all read one table; `verify-blog.mjs` FACTS and
 * `ops/verify.mjs` check 7 both diff it.
 *
 * Deliberately a keyed object and NOT an array of `{ name: … }`: check 7 runs
 * `/\{\s*name:\s*'([^']+)'/g` unscoped over this whole file, so an array here
 * would be read as a 16th flavour and fail the build.
 */
export const SURCHARGE = {
  'Rasmalai':       { '6 inch': 1000, '8 inch': 2000, '10 inch': 2500, '12 inch': 3500, '14 inch': 4000, '16 inch': 4500 },
  'Ferrero Rocher': { '6 inch':  500, '8 inch': 1500, '10 inch': 1500, '12 inch': 2500, '14 inch': 3000, '16 inch': 3500 },
};

/**
 * The full list price of one normal cake, in cents.
 *
 * Returns **null**, never NaN, for anything that has no list price — 'Slice' is
 * sold by the piece and 'tiered' is quoted per build. A caller that treats null
 * as 0 would sell a stacked cake for nothing, so the checkout rejects it rather
 * than pricing it.
 */
export const listPriceCents = (code, flavour) => {
  const base = basePrice(code);
  if (base == null) return null;
  return Math.round(base * 100) + (SURCHARGE[flavour]?.[code] ?? 0);
};
