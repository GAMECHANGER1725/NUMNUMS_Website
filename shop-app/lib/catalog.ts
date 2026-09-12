/**
 * The shop's view of the one price list.
 *
 * Imported from `ops/catalog.mjs` rather than copied — that file is gated by
 * both `verify-blog.mjs` and `ops/verify.mjs`, and a second copy here is how a
 * customer ends up charged a price the shop retired.
 *
 * Only the sizes that have a list price are sellable online: a Slice is sold
 * over the counter by the piece and a tiered cake is quoted per build, so both
 * return null and the checkout refuses them.
 */
import { SIZES, FLAVOURS, listPriceCents } from "./catalog.generated.mjs";

export const SELLABLE_SIZES = SIZES.filter((s) => s.price != null);
export const SELLABLE_FLAVOURS = FLAVOURS;
export { listPriceCents };

export const sizeLabel = (code: string) =>
  SIZES.find((s) => s.code === code)?.label ?? code;

export const sizeServes = (code: string) =>
  SIZES.find((s) => s.code === code)?.serves ?? null;
