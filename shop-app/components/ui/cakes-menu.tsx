"use client";

import Link from "next/link";
import { NavigationMenu } from "@base-ui/react/navigation-menu";
import { ChevronDown, ArrowRight } from "lucide-react";

/**
 * "Our Cakes" in the shop's nav, with the two ranges behind it.
 *
 * The static site's copy of this is injected by `mountCakesMenu` in promo.js —
 * the only script on all ~243 hand-written pages. This is the React twin, and
 * the two have to say the same thing in the same order: crossing from a blog
 * post into the shop should not rearrange the nav under you. The item copy is
 * duplicated on purpose, the same trade the popup markup makes; sharing 20
 * lines of text between a static site and a Next app costs more than it saves.
 *
 * Base UI's NavigationMenu rather than Menu: it is the one that opens on hover
 * with a close delay, so the pointer can cross the gap to the first item
 * without the panel shutting underneath it. Menu has no `openOnHover` in 1.8.
 */
const ITEMS = [
  {
    href: "/",
    label: "Signature Flavours",
    desc: "15 cakes, priced online. Ready tomorrow.",
    internal: true,
  },
  {
    href: "/build-your-cake",
    label: "Build Your Cake",
    desc: "Design your own, step by step. 48 hours.",
    internal: false,
  },
  {
    href: "/order",
    label: "Custom Cakes",
    desc: "Weddings, kids, baby showers \u2014 see our work.",
    internal: false,
  },
] as const;

export function CakesMenu() {
  // Inside this app every route is a Signature page, so the parent is current
  // whenever we are here at all. /order is a static page outside the app and
  // can never be the pathname.
  const currentHref = "/";

  return (
    <NavigationMenu.Root delay={80} closeDelay={140} className="nn-cakes-root">
      <NavigationMenu.List className="flex items-center">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="nn-nav-link nn-nav-active group inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent">
            Our Cakes
            <ChevronDown
              className="h-[11px] w-[11px] transition-transform duration-200 ease-out group-data-[popup-open]:rotate-180"
              strokeWidth={3}
              aria-hidden
            />
          </NavigationMenu.Trigger>

          <NavigationMenu.Content className="w-[17.5rem] p-1.5">
            {ITEMS.map((it) => {
              const inner = (
                <>
                  <span className="flex items-center gap-1.5 text-[0.9rem] font-semibold leading-[1.25] text-[#2C1A0E] group-hover:text-[#C85478]">
                    {it.label}
                    <ArrowRight
                      className="h-3 w-3 -translate-x-1 text-[#C85478] opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                      strokeWidth={3}
                      aria-hidden
                    />
                  </span>
                  <span className="mt-[3px] block text-[0.76rem] leading-[1.4] text-[rgba(92,58,34,0.62)]">
                    {it.desc}
                  </span>
                </>
              );
              const cls =
                "group block rounded-lg px-[13px] py-2.5 no-underline transition-colors hover:bg-[rgba(200,84,120,0.08)] focus-visible:bg-[rgba(200,84,120,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C85478]";
              return (
                <NavigationMenu.Link
                  key={it.href}
                  aria-current={it.href === currentHref ? "page" : undefined}
                  // A route inside this app is a client navigation; /order is a
                  // static page and a <Link> to it has nowhere to land.
                  render={
                    it.internal ? <Link href={it.href} className={cls} /> : <a href={it.href} className={cls} />
                  }
                >
                  {inner}
                </NavigationMenu.Link>
              );
            })}
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          sideOffset={9}
          align="center"
          collisionPadding={12}
          className="z-[120] outline-none"
        >
          <NavigationMenu.Popup className="nn-cakes-popup">
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}
