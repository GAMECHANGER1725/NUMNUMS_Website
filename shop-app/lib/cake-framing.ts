/**
 * Where each cake sits inside its square tile.
 *
 * The fifteen product shots were taken on two different days at two aspect
 * ratios — nine at 3:4, five at 2:3, one pair at 1200x1600 — and the cake sits
 * at a different height in each frame. Dropped into an `aspect-square` tile
 * with the browser's default centring, the 2:3 photos float: Butterscotch's
 * content centre lands at 44% of its frame against Chocolate's 51%, so it
 * reads as the odd one out in a row of five.
 *
 * These numbers are not eyeballed. Each photo was decoded to a canvas and the
 * bounding box of everything meaningfully off-white was measured; the value
 * below is the `object-position` Y that puts that content's **base** on a
 * common line at 93% of the tile, the way products sit on a shelf:
 *
 *     y = 100 * (contentBottomFraction * (h / w) - 0.93) / ((h / w) - 1)
 *
 * Baselines matter more than centres here because the eye reads a row of
 * cakes as a shelf, and a cake floating half a centimetre high is the thing
 * you notice. The tightest headroom that leaves is 5.4%, so nothing is
 * clipped — but re-run the measurement before adding a photo rather than
 * guessing a number, and re-run it if one is replaced.
 * The script is `tools/measure-cake-framing.mjs`.
 *
 * ⚠️ A shared baseline is not the whole job, and this is the trap: every base
 * can sit on the line while one cake still looks wrong, because a photo
 * framed tighter than its neighbours fills more of the tile and reads as
 * riding up against the top edge. Pineapple did exactly that — base dead on
 * 92.5% with the rest, but filling 90.8% of the tile against ~83% for
 * Chocolate beside it and 1.7% headroom against a ~15% median. Nudging its
 * object-position down would have clipped the plate and broken the baseline.
 * The fix was the PHOTO: padded 9.4% in a 3:4 frame so the cake occupies the
 * same share as its neighbours, then re-measured (62 → 50). If a cake looks
 * misaligned and its base already matches, measure the FILL before touching
 * a number here.
 */
const FRAMING: Record<string, number> = {
  "Black-Forest": 36,
  Blueberry: 24,
  Butterscotch: 26,
  Chocolate: 53,
  "Cookies-and-Cream": 43,
  "Ferrero-Rocher": 35,
  Lychee: 41,
  Mango: 56,
  Pineapple: 50,
  Rasmalai: 28,
  "Red-Velvet": 56,
  Strawberry: 26,
  Tiramisu: 34,
  Vanilla: 56,
  "White-Forest": 37,
};

/**
 * The `object-position` for a flavour's photo. Falls back to plain centring,
 * which is what an unmeasured new photo gets — wrong-looking rather than
 * broken-looking.
 */
export const cakeFraming = (slug: string) => `50% ${FRAMING[slug] ?? 50}%`;
