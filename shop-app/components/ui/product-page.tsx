"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Star } from "lucide-react";
import { cartStore, writeCart, money, addLine, cartCount, MAX_CAKES } from "@/lib/cart";
import { SELLABLE_SIZES, listPriceCents, flavourSlug, urlSlug } from "@/lib/catalog";
import { copyFor } from "@/lib/flavour-copy";
import { cakeFraming } from "@/lib/cake-framing";
import { badgeFor, ORDER_BOOK } from "@/lib/badges";
import { viewItem, addToCart } from "@/lib/analytics";
import { useSyncExternalStore } from "react";

const DEFAULT_SIZE = "8 inch";   // 47% of orders, and the middle of the ladder

export type ProductPageProps = {
  flavour: string;
  premium: boolean;
  related: string[];
};

export function ProductPage({ flavour, premium, related }: ProductPageProps) {
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [wording, setWording] = useState("");
  const [added, setAdded] = useState(false);

  const copy = copyFor(flavour);
  const badge = badgeFor(flavour);
  const photo = `/shop/cakes/${flavourSlug(flavour)}.webp`;
  const cents = listPriceCents(size, flavour) ?? 0;
  const inCart = cartCount(cart);
  const full = inCart >= MAX_CAKES;

  // One view_item per flavour per visit, not per size tap: changing the size
  // chip is still the same product being considered, and firing again would
  // report six views of a cake nobody looked at twice.
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (seen.current === flavour) return;
    seen.current = flavour;
    viewItem({ size, flavour, cents: listPriceCents(size, flavour) ?? 0 });
    // `size` is deliberately absent from the deps for the reason above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flavour]);

  function add() {
    if (full) return;
    // Same cake, same writing merges into a quantity — see addLine.
    writeCart(addLine(cart, { size, flavour, wording }));
    addToCart({ size, flavour, cents });
    // Writing is cleared every time — one cake's name landing on the next is an
    // error that reaches the kitchen as a fact.
    setWording("");
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  }

  return (
    <main className="mx-auto w-full max-w-[72rem] px-4 pb-20 pt-6 sm:px-6">
      <Link
        href="/"
        className="-m-2 inline-flex min-h-[32px] items-center gap-1 p-2 text-[0.84rem] font-semibold text-[#C85478]"
      >
        <ChevronLeft className="h-4 w-4" /> All cakes
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-12">
        {/* ── The cake, with the writing on it ── */}
        <div>
          <div className="cake-photo overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={`${flavour} eggless cake`}
              className="block aspect-square w-full object-cover"
              style={{ objectPosition: cakeFraming(flavourSlug(flavour)) }}
            />
            <span className="cake-ground" aria-hidden />
            {premium && <span className="badge-premium absolute left-3 top-3">Premium</span>}
            {badge && (
              <span className={`badge-claim badge-claim-${badge.kind} absolute right-3 top-3`}>
                {badge.label}
              </span>
            )}
          </div>

          {/* The writing sits UNDER the cake, not on it.
              Laid over the photo it was a promise we cannot keep: the preview
              picked its own font, size and position, and the real cake is
              piped by hand — so every order arrived looking "wrong" against a
              mockup we drew ourselves. Under the photo, in quotes, it reads as
              what it is: the words being quoted back for checking. */}
          {wording.trim() ? (
            <figure className="cake-plaque mt-3" aria-live="polite">
              <figcaption className="cake-plaque-eyebrow">Piped on the cake</figcaption>
              <blockquote className="cake-plaque-words">
                <span className="cake-plaque-mark" aria-hidden>&ldquo;</span>
                {wording}
                <span className="cake-plaque-mark" aria-hidden>&rdquo;</span>
              </blockquote>
              <p className="cake-plaque-note">Piped by hand on the day — check your spelling.</p>
            </figure>
          ) : (
            <p className="mt-3 text-center text-[0.74rem] text-muted-foreground">
              Add writing below and we&rsquo;ll pipe it on by hand.
            </p>
          )}
        </div>

        {/* ── The decision ── */}
        <div>
          <h1 className="font-display text-[2.4rem] font-light leading-[1.05] tracking-tight sm:text-[3rem]">
            {flavour}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.82rem] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex text-[#E3B664]" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
              </span>
              4.6 · 50+ reviews
            </span>
            <span aria-hidden className="text-border">|</span>
            <span>100% eggless</span>
          </div>

          <p className="mt-4 text-[0.98rem] leading-relaxed">{copy.blurb}</p>
          {copy.note && (
            <p className="mt-2 text-[0.88rem] leading-relaxed text-muted-foreground">{copy.note}</p>
          )}

          <h2 className="section-label mt-7">How big?</h2>
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SELLABLE_SIZES.map((s) => (
              <li key={s.code}>
                <button
                  type="button"
                  aria-pressed={size === s.code}
                  onClick={() => setSize(s.code)}
                  className="size-chip w-full"
                >
                  <span className="block text-[0.95rem] font-semibold">{s.label}</span>
                  <span className="block text-[0.64rem] leading-tight text-muted-foreground">
                    serves {s.serves}
                  </span>
                  <span className="mt-0.5 block text-[0.7rem] font-medium tabular-nums">
                    {money(listPriceCents(s.code, flavour) ?? 0)}
                  </span>
                  {s.code === ORDER_BOOK.topSize && (
                    <span className="mt-1 block text-[0.56rem] font-bold uppercase leading-[1.15] tracking-[0.04em] text-[#C85478]">
                      Most ordered
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <label htmlFor="wording" className="field-label">
              Writing on the cake <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="wording"
              maxLength={60}
              placeholder="Happy Birthday Aarav"
              className="field-input"
              value={wording}
              onChange={(e) => setWording(e.target.value)}
            />
            <p className="mt-1 text-[0.72rem] text-muted-foreground">
              {wording.trim()
                ? `${60 - wording.length} characters left. Check your spelling — we pipe it exactly.`
                : "We pipe it by hand, exactly as you type it."}
            </p>
          </div>

          <button
            type="button"
            onClick={add}
            disabled={full}
            className="btn-cta mt-6 w-full py-3.5 text-[1rem]"
          >
            {added ? <><Check className="h-4 w-4" />Added to your order</> : `Add to order — ${money(cents)}`}
          </button>

          {full ? (
            <p className="mt-2 text-[0.78rem] text-muted-foreground">
              {MAX_CAKES} cakes is the most we take in one online order. For more,{" "}
              <a href="/order" className="font-semibold text-[#C85478]">talk to us directly</a>.
            </p>
          ) : (
            <p className="mt-3 text-center text-[0.78rem] text-muted-foreground">
              Pay online · collect from Harris Park or Riverstone · ready tomorrow
            </p>
          )}

          {inCart > 0 && (
            <Link
              href="/cart"
              className="mt-3 block w-full rounded-full border border-[#C85478] py-2.5 text-center text-[0.88rem] font-semibold text-[#C85478] transition-colors hover:bg-[#FDF3F6]"
            >
              Your order ({inCart}) →
            </Link>
          )}

          <dl className="mt-7 border-t border-border pt-5 text-[0.84rem] leading-relaxed">
            <dt className="font-semibold">Allergens</dt>
            <dd className="mt-1 text-muted-foreground">
              Every cake is 100% eggless. Our kitchen is not allergen-free — see{" "}
              <a href="/terms" target="_blank" rel="noopener" className="font-medium text-[#C85478] underline-offset-2 hover:underline">
                our allergen note
              </a>
              . If someone has a severe allergy, please speak to us before ordering.
            </dd>
            <dt className="mt-3 font-semibold">Keeping it</dt>
            <dd className="mt-1 text-muted-foreground">
              Keep refrigerated, and best eaten within two days of collection.
            </dd>
          </dl>
        </div>
      </div>

      {/* ── Related, so a "no" becomes a different cake rather than an exit ── */}
      <section className="mt-16 border-t border-border pt-8">
        <h2 className="section-label">Also popular</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {related.map((name) => (
            <li key={name}>
              <Link href={`/cakes/${urlSlug(name)}`} className="cake-card block">
                <span className="cake-photo block aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/shop/cakes/${flavourSlug(name)}.webp`}
                    alt={`${name} eggless cake`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: cakeFraming(flavourSlug(name)) }}
                  />
                  <span className="cake-ground" aria-hidden />
                </span>
                <span className="block px-3 py-2.5">
                  <span className="block text-[0.86rem] font-medium leading-tight">{name}</span>
                  <span className="block text-[0.74rem] text-muted-foreground">
                    from {money(listPriceCents("6 inch", name) ?? 0)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
