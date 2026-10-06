"use client";

import { useSyncExternalStore } from "react";
import { minDueDate } from "@/lib/cart";

/**
 * The first day a cake can be collected, named — "Wednesday 7 October" — so
 * "ready tomorrow" becomes a date somebody can check against the party.
 *
 * The export is rendered on the build machine, so the date only appears once
 * the browser has its own today (same reason the cart waits for `loaded`).
 * Until then it reads "tomorrow", which is what LEAD_DAYS = 1 means anyway.
 * Computed from the same `minDueDate` the cart calendar greys days with, so
 * the board can never promise a day the checkout then refuses.
 */
export function EarliestPickup() {
  const loaded = useSyncExternalStore(() => () => {}, () => true, () => false);
  if (!loaded) return <>tomorrow</>;
  return (
    <>
      {new Date(`${minDueDate()}T12:00:00`).toLocaleDateString("en-AU", {
        weekday: "long", day: "numeric", month: "long",
      })}
    </>
  );
}
