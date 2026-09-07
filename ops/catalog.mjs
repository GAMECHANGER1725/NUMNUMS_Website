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

export const sizeByCode   = (code) => SIZES.find((s) => s.code === code) || null;
export const isPremium    = (name) => Boolean(FLAVOURS.find((f) => f.name === name)?.premium);
export const basePrice    = (code) => sizeByCode(code)?.price ?? null;
