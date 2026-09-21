"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * One horizontally-scrolling row of cake cards.
 *
 * The board used to be a single 15-card grid, which said nothing about how the
 * range is actually organised — a $49.99 Rasmalai sat in the same undifferentiated
 * wall as a $39.99 Vanilla. Three named rows answer "what kind of cake am I
 * after" before "which flavour".
 *
 * The cards are rendered by the server component and handed in as children, so
 * the images and prices stay server-rendered; only the scrolling is client-side.
 *
 * Four things here are deliberate:
 *
 * - **Native scroll, not a transform carousel.** The row is an overflow-x
 *   container with scroll-snap, so a phone swipes it with the OS's own inertia
 *   and a trackpad works without us reimplementing momentum. The arrows just
 *   call scrollBy. A JS-driven track would have to re-solve flick velocity,
 *   rubber-banding and mid-swipe interruption, badly.
 * - **The arrows disable at the ends**, computed from real scroll position
 *   rather than assumed. A button that looks live and does nothing reads as
 *   broken.
 * - **They are hidden entirely when the row already fits**, which is what
 *   happens to Premium's two cards on a wide screen. Two arrows either side of
 *   a row that cannot scroll is furniture.
 * - **Reduced motion is honoured** — smooth scrolling is the thing that rule is
 *   most often about, and an arrow press is exactly the kind of large sudden
 *   movement it exists to suppress.
 */
export function CakeRow({
  id,
  title,
  blurb,
  eyebrow,
  premium = false,
  children,
}: {
  id: string;
  title: string;
  blurb: string;
  /** Small gold line above the heading. Premium rows only. */
  eyebrow?: string;
  /**
   * The premium shelf: its own warm panel, gold rule and wider cards. The
   * width is not decoration — two standard tiles left a half-empty shelf that
   * read as a row which had failed to load.
   */
  premium?: boolean;
  children: React.ReactNode;
}) {
  const rail = useRef<HTMLUListElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [scrollable, setScrollable] = useState(false);

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    // 2px of slack: sub-pixel layout means scrollLeft rarely lands exactly on
    // the maximum, so an exact comparison leaves the right arrow live forever.
    const max = el.scrollWidth - el.clientWidth;
    setScrollable(max > 2);
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max - 2);
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    // Fonts and lazy images change the row's width after first paint, and a
    // rotation changes it again — re-measure rather than trusting mount.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", measure); ro.disconnect(); };
  }, [measure]);

  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A bit less than a full viewport of the rail, so a card stays on screen as
    // an anchor and nothing is skipped over between presses.
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section aria-labelledby={id} className={premium ? "premium-shelf mt-8" : "mt-10 first:mt-8"}>
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="premium-eyebrow">{eyebrow}</p>}
          <h2
            id={id}
            className={
              premium
                ? "font-display text-[1.9rem] font-light leading-tight tracking-[-0.02em] sm:text-[2.3rem]"
                : "font-display text-[1.5rem] font-light leading-tight tracking-[-0.02em] sm:text-[1.75rem]"
            }
          >
            {title}
          </h2>
          {premium && <span className="premium-rule" aria-hidden />}
          <p className="mt-1.5 text-[0.84rem] leading-relaxed text-muted-foreground">{blurb}</p>
        </div>
        {scrollable && (
          <div className="hidden flex-none gap-2 sm:flex">
            <button
              type="button" onClick={() => nudge(-1)} disabled={atStart}
              className="rail-arrow" aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button" onClick={() => nudge(1)} disabled={atEnd}
              className="rail-arrow" aria-label={`Scroll ${title} right`}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
      </div>

      {/* tabIndex makes the rail reachable by keyboard, so arrow keys scroll it
          — without it a keyboard user can only move card to card by tabbing
          through every link. */}
      <ul ref={rail} className={`cake-rail mt-3${premium ? " cake-rail--lead" : ""}`} tabIndex={0}>
        {children}
      </ul>
    </section>
  );
}
