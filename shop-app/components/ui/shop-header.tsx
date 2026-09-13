"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ShoppingBag } from "lucide-react";
import { cartStore } from "@/lib/cart";

/**
 * The one persistent thing across the shop.
 *
 * It exists because browsing and the cart are now separate pages: without a
 * running count, "Add to order" on a product page is a button that appears to
 * do nothing. The count is the receipt for that action.
 */
export function ShopHeader() {
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const n = cart.lines.length;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[72rem] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="-m-2 inline-flex min-h-[32px] items-center p-2 font-display text-[1.25rem] font-light tracking-tight text-[#C85478]"
        >
          Num Num&rsquo;s Bakery
        </Link>

        <Link
          href="/cart"
          className="relative -m-2 inline-flex min-h-[40px] items-center gap-2 rounded-full p-2 px-3 text-[0.84rem] font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Your order</span>
          {n > 0 && (
            <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#C85478] px-1.5 text-[0.7rem] font-semibold tabular-nums text-white">
              {n}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
