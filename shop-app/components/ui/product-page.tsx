"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Check, ChevronLeft, RotateCcw, ShieldCheck, Star, Wallet } from "lucide-react";
import { cartStore, writeCart, money, addLine, cartCount, MAX_CAKES, depositCents } from "@/lib/cart";
import { EarliestPickup } from "@/components/ui/earliest-pickup";
import { SaturdayLeft } from "@/components/ui/saturday-left";
import { SELLABLE_SIZES, listPriceCents, flavourSlug, urlSlug, sizeLabel, sizeServes } from "@/lib/catalog";
import { copyFor } from "@/lib/flavour-copy";
import { cakeFraming } from "@/lib/cake-framing";
import { badgeFor, ORDER_BOOK, GOOGLE_RATING } from "@/lib/badges";
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
  // The real button; when it is off screen on a phone, the bar carries it.
  // On a 390 phone it sat 1.46 screens down, under the photo and the chips —
  // the first screen showed no price and nothing to press.
  const addRef = useRef<HTMLButtonElement>(null);
  const [addVisible, setAddVisible] = useState(true);
  useEffect(() => {
    const el = addRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setAddVisible(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const copy = copyFor(flavour);
  const badge = badgeFor(flavour);
  const photo = `/shop/cakes/${flavourSlug(flavour)}.webp`;
  const cents = listPriceCents(size, flavour) ?? 0;
  const inCart = cartCount(cart);
  const full = inCart >= MAX_CAKES;
  // "12–14" → "$3.57–$4.17". Null if a size ever has no serving count.
  const perServe = (() => {
    const [lo, hi] = String(sizeServes(size) ?? "").split("–").map(Number);
    if (!lo || !cents) return null;
    return `${money(Math.round(cents / (hi || lo)))}–${money(Math.round(cents / lo))}`;
  })();

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
    <main className="mx-auto w-full max-w-[72rem] px-4 pb-32 pt-6 sm:px-6 lg:pb-20">
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
            {/* Only a rating somebody read off the real profile, linked to it
                — see GOOGLE_RATING. */}
            {GOOGLE_RATING && (
              <>
                <a href={GOOGLE_RATING.url} target="_blank" rel="noopener"
                  className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
                  <span className="inline-flex text-[#E3B664]" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </span>
                  {GOOGLE_RATING.rating}
                  {GOOGLE_RATING.count ? ` · ${GOOGLE_RATING.count} Google reviews` : " on Google"} ↗
                </a>
                <span aria-hidden className="text-border">|</span>
              </>
            )}
            <span>100% eggless</span>
          </div>

          <p className="mt-4 text-[0.98rem] leading-relaxed">{copy.blurb}</p>
          {copy.note && (
            <p className="mt-2 text-[0.88rem] leading-relaxed text-muted-foreground">{copy.note}</p>
          )}
          {/* A real customer on this exact flavour, word for word from their
              Google review (the text in index.html's Review schema). Proof
              that is about THIS cake beats a generic star line — and only the
              flavours someone has actually written about get one. */}
          {copy.review && (
            <figure className="cake-review mt-4">
              <blockquote>&ldquo;{copy.review.quote}&rdquo;</blockquote>
              <figcaption>{copy.review.name} · Google review</figcaption>
            </figure>
          )}

          <h2 className="section-label mt-7">How big?</h2>
          <ul className="mt-2 grid grid-cols-3 gap-2 lg:grid-cols-6">
            {SELLABLE_SIZES.map((s) => (
              <li key={s.code}>
                <button
                  type="button"
                  aria-pressed={size === s.code}
                  onClick={() => setSize(s.code)}
                  className="size-chip w-full"
                >
                  <span className="block text-[0.95rem] font-semibold">{s.label}</span>
                  {/* Larger only where the chips are three to a row; six to
                      a row has no room for it. */}
                  <span className="block text-[0.72rem] leading-tight text-muted-foreground lg:text-[0.64rem]">
                    serves {s.serves}
                  </span>
                  <span className="mt-0.5 block text-[0.7rem] font-medium tabular-nums">
                    {money(listPriceCents(s.code, flavour) ?? 0)}
                  </span>
                  {s.code === ORDER_BOOK.topSize && (
                    <span className="mt-1 block text-[0.62rem] font-bold uppercase leading-[1.15] tracking-[0.04em] text-[#A03D5E] lg:text-[0.56rem]">
                      Most ordered
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {/* Price per serve, as a range because the serving count is one.
              The question behind "how big?" is "is it enough, and is it worth
              it" — this answers the second half in the unit a party is
              planned in, and shows honestly that a bigger cake costs less a
              head (Baymard: most sites omit per-unit price, and users abandon
              suitable items over it). */}
          {perServe && (
            <p className="mt-2 text-[0.78rem] text-muted-foreground">
              {sizeLabel(size)} works out at{" "}
              <span className="font-medium tabular-nums text-foreground">{perServe}</span> a serve.
            </p>
          )}

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
            {/* The one free-text box in the whole shop, so it is where a
                custom order gets silently turned into a normal one: somebody
                wanting a themed two-tier cake types the brief here, pays
                $39.99, and the kitchen receives a plain cake with a sentence
                piped on it. Saying what the field is NOT is worth more than
                any banner, because this is the moment the mistake is made. */}
            <p className="mt-1 text-[0.72rem] text-muted-foreground">
              Words only — for a theme, a photo or tiers,{" "}
              <a href="/order" className="font-semibold text-[#C85478] underline-offset-2 hover:underline">
                that&rsquo;s a custom cake
              </a>
              .
            </p>
          </div>

          <button
            ref={addRef}
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
            <>
            <SaturdayLeft className="mt-3 justify-center" />
            {/* The three things a buyer hesitates over, answered beside the
               button rather than first in the cart: when (a real date, not
               "soon"), how much today (in dollars — "50%" made people do sums),
               and what if plans change. Baymard: 60% of shoppers look for the
               returns position on the product page; this cake's equivalent is
               the deposit refund window, which until now first appeared one
               page later. Same amounts the cart and Stripe will show —
               depositCents floors exactly as the server does. */}
            <ul className="promise-list mt-4" aria-label="Before you order">
              <li><CalendarCheck aria-hidden /><span><b>Ready <EarliestPickup /></b>Collect from Harris Park or Riverstone</span></li>
              <li><Wallet aria-hidden /><span><b>Pay {money(depositCents(cents))} today</b>{money(cents - depositCents(cents))} when you collect it</span></li>
              <li><ShieldCheck aria-hidden /><span><b>Plans change? Deposit back in full</b>Cancel more than 24 hours before collection</span></li>
              {/* The written guarantee (terms.html §8), linked so the conditions
                  are one tap away rather than implied. */}
              <li><RotateCcw aria-hidden /><span><b>Not what you ordered? Remade or refunded</b>
                <a href="/terms#guarantee" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-[#C85478]">Our guarantee</a></span></li>
            </ul>
            </>
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
              <a href="/terms#allergens" target="_blank" rel="noopener" className="font-medium text-[#C85478] underline-offset-2 hover:underline">
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

      {/* Phones: the same button, same size and writing, whenever the real one
          is off screen — the pattern the cart uses, and never two at once. */}
      <div aria-hidden={addVisible}
        className={`fixed inset-x-0 bottom-0 z-40 nn-frost border-t border-white/60 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(44,26,14,0.18)] transition-[transform,opacity] duration-[375ms] ease-[cubic-bezier(0.34,1.2,0.64,1)] motion-reduce:transition-none lg:hidden ${
          addVisible ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}>
        <div className="mx-auto flex max-w-[40rem] items-center gap-3">
          <div className="min-w-0 leading-tight">
            <p className="text-[0.72rem] text-muted-foreground">
              {sizeLabel(size)} · serves {sizeServes(size)}
            </p>
            <p className="font-display text-[1.35rem] tabular-nums text-[#C85478]">{money(cents)}</p>
          </div>
          <button type="button" onClick={add} disabled={full} tabIndex={addVisible ? -1 : 0}
            className="btn-cta ml-auto flex-1 py-3">
            {added ? <><Check className="h-4 w-4" />Added</> : "Add to order"}
          </button>
        </div>
      </div>
    </main>
  );
}
