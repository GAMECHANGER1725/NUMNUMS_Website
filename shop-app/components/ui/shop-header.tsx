"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { cartStore, cartCount } from "@/lib/cart";
import { AccountMenu } from "@/components/ui/account-menu";

/**
 * The site's header, rendered inside the shop.
 *
 * It is a deliberate copy of the static site's navbar — same logo, same Jost
 * links, same rose pill, same 68px bar — because crossing from a blog post
 * into the shop should not feel like crossing into a different company. The
 * static markup lives in `index.html`; the shared tokens are in `globals.css`
 * under `.nn-*`, so the two can be compared side by side.
 *
 * Everything except the shop's own routes is a plain `<a>`: those pages are
 * static HTML outside this Next app, and a `<Link>` to them would try a
 * client-side navigation that has nowhere to land.
 *
 * Payment happens on Stripe's page, which carries no nav of ours. Nav in a payment flow is an exit, which is why
 * neither of the two chains we looked at puts it there either.
 */
const NAV = [
  { href: "/shop", label: "Shop Cakes", internal: true },
  { href: "/indian-sweet", label: "Indian Sweets" },
  { href: "/order", label: "Custom Cakes" },
  { href: "/locations", label: "Locations" },
  { href: "/blog/", label: "Blog" },
];

export function ShopHeader() {
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const n = cartCount(cart);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  /*
   * The sliding highlight, matching the static pages'. It rests behind the
   * current page's link and follows the pointer, returning on mouse-out.
   *
   * Measured from live geometry rather than an index, because the labels are
   * different widths and the pill's own padding moves with the breakpoint —
   * a computed guess is wrong at exactly the widths nobody tests. Below
   * 1024px the links are `display: none`, so `offsetWidth` is 0 and the
   * indicator correctly collapses to nothing.
   */
  const pill = useRef<HTMLDivElement | null>(null);
  const indicator = useRef<HTMLSpanElement | null>(null);

  const placeIndicator = useCallback((el: HTMLElement | null) => {
    const bar = indicator.current;
    if (!bar || !el || !pill.current) return;
    bar.style.left = `${el.offsetLeft}px`;
    bar.style.width = `${el.offsetWidth}px`;
  }, []);

  const restIndicator = useCallback(() => {
    placeIndicator(pill.current?.querySelector<HTMLElement>(".nn-nav-active") ?? null);
  }, [placeIndicator]);

  const moveIndicator = (e: React.MouseEvent<HTMLElement>) => placeIndicator(e.currentTarget);

  useEffect(() => {
    restIndicator();
    // Fonts landing after first paint change every label's width, and a
    // resize crosses the breakpoint where the links disappear entirely.
    const ro = new ResizeObserver(restIndicator);
    if (pill.current) ro.observe(pill.current);
    return () => ro.disconnect();
  }, [restIndicator]);

  // Same two states as the static pill (see paintCart in promo.js): an empty
  // cart is still a door into the shop, never a dead button.
  const cartLabel = n ? `Your order (${n})` : "Order Now";
  const cartHref = n ? "/cart" : "/";
  // On the board itself with nothing chosen, "Order Now" would point at the
  // page you are already reading. Nothing is better than a button that does
  // nothing; the moment a cake goes in, the cart takes its place.
  const showCart = n > 0 || path !== "/";

  return (
    <>
      <nav className="nn-nav">
        <div className="nn-nav-inner">
          {/*
            The logo goes to the SITE root, not the shop root — the same place
            it goes from every other page. eslint reads a bare "/" as this
            app's own home page; it is not, because of basePath: "/shop".
            A <Link> here would land on /shop/ and quietly strand anyone
            trying to leave the shop.
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="nn-logo" aria-label="Num Num's Bakery home">
            <picture>
              <source srcSet="/brand_assets/Logo_TParent_56.webp" type="image/webp" />
              <img src="/brand_assets/Logo_TParent.png" alt="Num Num's Bakery" width={56} height={56} />
            </picture>
          </a>

          <div className="nn-pill" ref={pill} onMouseLeave={restIndicator}>
            <span className="nn-indicator" ref={indicator} aria-hidden />
            {NAV.map((item) =>
              item.internal ? (
                <Link
                  key={item.href} href="/" className="nn-nav-link nn-nav-active"
                  onMouseEnter={moveIndicator}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href} href={item.href} className="nn-nav-link"
                  onMouseEnter={moveIndicator}
                >
                  {item.label}
                </a>
              ),
            )}

            {showCart && (
            <Link href={cartHref} className={n ? "nn-cta nn-cta-full" : "nn-cta"}>
              {cartLabel}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            )}

            <AccountMenu />

            <button
              type="button"
              className={open ? "nn-ham open" : "nn-ham"}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div id="nn-mobile-menu" hidden={!open}>
        {NAV.map((item) =>
          item.internal ? (
            <Link key={item.href} href="/" onClick={() => setOpen(false)}>{item.label}</Link>
          ) : (
            <a key={item.href} href={item.href}>{item.label}</a>
          ),
        )}
        {showCart && (
          <div>
            <Link href={cartHref} onClick={() => setOpen(false)}>{cartLabel}</Link>
          </div>
        )}
      </div>
    </>
  );
}
