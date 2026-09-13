/**
 * The two claims a product card is allowed to make.
 *
 * Every badge here is either a fact from the order book or an opinion clearly
 * marked as ours. That is not squeamishness — the ACCC fined three retailers
 * in June 2025 over misleading sale claims, urgency representations have to be
 * accurate at the moment a customer sees them, and the penalty ceiling is $50m
 * per breach. A "Selling fast!" on a cake nobody has ordered is the exact
 * thing being enforced against.
 *
 * The second reason is that they stop working. Neither The Cheesecake Shop nor
 * Bannos badges individual products on their collection pages at all — both
 * put the claim in a section heading ("Shop Our Customer Favourites", "Sponge
 * Cakes Popular Picks") instead. Baymard's list-item research is blunt about
 * why: a list item has room for a handful of attributes before it stops being
 * scannable. Badge everything and you have labelled nothing.
 *
 * So: at most one conversion badge per card, and on 2 of 15 cards.
 */

/** What the order book said on 2026-09-13, across 32 orders. */
export const ORDER_BOOK = {
  countedOn: "2026-09-13",
  orders: 32,
  /** Chocolate was 41% of every cake sold — the clear top, not a rounding win. */
  topFlavour: "Chocolate",
  /** 8" was 47% of orders, and it is the middle of the size ladder. */
  topSize: "8 inch",
} as const;

export type Badge = { label: string; kind: "fact" | "ours" };

/**
 * ⚠️ NEEDS VAIDIK'S REVIEW — "Our pick" is the bakery's own recommendation, so
 * it is your call and not the data's. Move the name, or set it to null to drop
 * the badge.
 *
 * Lychee by default for two reasons. It is the kind of flavour nobody picks
 * without a reason to — the popular ones do not need the help, and a
 * recommendation spent on Chocolate says nothing. And it is not a Premium
 * flavour: Rasmalai was the first choice, being the cake the chain two suburbs
 * away cannot sell, but its card then carried a gold Premium chip AND this
 * one, which is two claims on a tile that has room for about one.
 */
const OUR_PICK: string | null = "Lychee";

/**
 * Fails the build rather than shipping a two-chip card. A card can carry
 * Premium (why it costs more) or a claim (why you'd choose it), never both —
 * and the mistake is invisible in code, since the two badges live in
 * different files.
 */
export function assertPickIsNotPremium(premiumFlavours: readonly string[]) {
  if (OUR_PICK && premiumFlavours.includes(OUR_PICK)) {
    throw new Error(
      `badges.ts: "Our pick" is ${OUR_PICK}, which is a Premium flavour — its card ` +
      `would carry two chips. Pick a non-premium flavour, or drop the Premium badge first.`,
    );
  }
}

export function badgeFor(flavour: string): Badge | null {
  // Most ordered wins when a flavour would carry both. A fact about what other
  // customers did outranks our opinion, and two chips on one card is clutter.
  if (flavour === ORDER_BOOK.topFlavour) return { label: "Most ordered", kind: "fact" };
  if (flavour === OUR_PICK) return { label: "Our pick", kind: "ours" };
  return null;
}
