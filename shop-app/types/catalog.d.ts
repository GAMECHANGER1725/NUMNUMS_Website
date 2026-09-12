// ops/catalog.mjs is plain JS shared with the ops app and the Netlify
// functions. It is imported, never copied: one price list is the whole rule.
declare module "*/ops/catalog.mjs" {
  export const SIZES: { code: string; label: string; serves: string | null; price: number | null }[];
  export const FLAVOURS: { name: string; premium?: boolean }[];
  export const SURCHARGE: Record<string, Record<string, number>>;
  export const TIERED: string;
  export function listPriceCents(code: string, flavour: string): number | null;
  export function basePrice(code: string): number | null;
  export function isPremium(name: string): boolean;
  export function sizeByCode(code: string): { code: string; label: string; serves: string | null; price: number | null } | null;
  export function cakeImage(name: string): string | null;
}
