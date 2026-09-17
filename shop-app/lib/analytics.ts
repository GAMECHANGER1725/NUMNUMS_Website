/**
 * The shop's analytics events.
 *
 * Until now this app fired nothing at all — no container, no events — so the
 * entire priced funnel was invisible in GA4 while the static site reported two
 * events of its own. Every change to the shop was therefore unmeasurable, which
 * is the first thing the CRO report said to fix.
 *
 * Two rules hold everywhere in here:
 *
 * 1. **Analytics is never allowed to throw into a conversion path.** A blocked
 *    container, an ad blocker, a private window with storage disabled — each of
 *    those must cost a datapoint, never a cake. Every call is wrapped.
 * 2. **`purchase` fires on a confirmed payment, not on arrival.** The
 *    thank-you page is reachable by anyone who knows the URL, and Stripe can
 *    redirect back before the webhook has written the order, so revenue is
 *    reported only once `order-status` says it was paid.
 *
 * Event names are GA4's own e-commerce vocabulary rather than bespoke ones, so
 * the built-in funnel and monetisation reports work without configuration.
 */

type Item = { size: string; flavour: string; qty?: number; cents: number };

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** GA4 wants dollars, and a cake is never priced in anything but AUD. */
const dollars = (cents: number) => Math.round(cents) / 100;

const toItem = (i: Item) => ({
  item_id: `${i.flavour} ${i.size}`.replace(/\s+/g, "-").toLowerCase(),
  item_name: i.flavour,
  item_variant: i.size,
  item_category: "Signature Cakes",
  price: dollars(i.cents),
  quantity: i.qty ?? 1,
});

function push(event: string, payload: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    // Clearing ecommerce first stops the previous event's items being merged
    // into this one — a GA4 datalayer quirk that silently inflates item counts.
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({ event, ecommerce: payload });
  } catch {
    /* see rule 1 */
  }
}

export function viewItem(i: Item) {
  push("view_item", { currency: "AUD", value: dollars(i.cents), items: [toItem(i)] });
}

export function addToCart(i: Item) {
  push("add_to_cart", { currency: "AUD", value: dollars(i.cents), items: [toItem(i)] });
}

export function beginCheckout(items: Item[], totalCents: number) {
  push("begin_checkout", {
    currency: "AUD",
    value: dollars(totalCents),
    items: items.map(toItem),
  });
}

export function purchase(orderId: string, items: Item[], totalCents: number) {
  push("purchase", {
    transaction_id: orderId,
    currency: "AUD",
    value: dollars(totalCents),
    items: items.map(toItem),
  });
}
