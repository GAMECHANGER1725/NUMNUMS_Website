"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Star, Trash2 } from "lucide-react";
import {
  cartStore, writeCart, minDueDate, maxDueDate, availableHours, money, STORES, MAX_LINES,
  type Cart,
} from "@/lib/cart";
import { SELLABLE_SIZES, SELLABLE_FLAVOURS, listPriceCents, flavourSlug } from "@/lib/catalog";

const hourLabel = (h: number) => (h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`);

/**
 * Display order, taken from the order book on 2026-09-13 (32 orders).
 * Chocolate was 41% of everything sold; the old form defaulted to Vanilla, which
 * was 9%. This only decides what people see first — every flavour is on the
 * board, and a wrong guess here costs nothing but a scroll.
 */
const BY_POPULARITY = [
  "Chocolate", "Butterscotch", "Pineapple", "Vanilla", "Rasmalai", "Black Forest",
  "Cookies & Cream", "White Forest", "Mango", "Strawberry",
  "Red Velvet", "Lychee", "Tiramisu", "Blueberry", "Ferrero Rocher",
];
const flavours = [...SELLABLE_FLAVOURS].sort(
  (a, b) => BY_POPULARITY.indexOf(a.name) - BY_POPULARITY.indexOf(b.name),
);

const DEFAULT_SIZE = "8 inch";   // 47% of orders, and the middle of the ladder
const cakePhoto = (name: string) => `/shop/cakes/${flavourSlug(name)}.webp`;

export default function ShopPage() {
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const loaded = useSyncExternalStore(() => () => {}, () => true, () => false);

  const configRef = useRef<HTMLElement>(null);
  const [flavour, setFlavour] = useState<string | null>(null);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [wording, setWording] = useState("");

  const update = (next: Cart) => writeCart(next);

  const lineCents = cart.lines.map((l) => listPriceCents(l.size, l.flavour) ?? 0);
  const subtotal = lineCents.reduce((a, b) => a + b, 0);
  const full = cart.lines.length >= MAX_LINES;
  const hours = availableHours(cart.dueDate);
  const ready = cart.lines.length > 0 && cart.store !== "" && cart.dueDate !== "" && hours.includes(cart.dueHour);

  // Sat/Sun is 81% of every order placed. Saying so is true, which is the only
  // reason it is here — a fabricated "2 slots left" would read the same and be
  // worth less than nothing.
  const busyDay = (() => {
    if (!cart.dueDate) return false;
    const d = new Date(`${cart.dueDate}T12:00:00`).getDay();
    return d === 0 || d === 6 || d === 5;
  })();

  function addCake() {
    if (!flavour || full) return;
    update({ ...cart, lines: [...cart.lines, { size, flavour, wording }] });
    // Writing is cleared every time — one cake's name landing on the next is an
    // error that reaches the kitchen as a fact. Flavour stays, people order two.
    setWording("");
  }

  const selectedCents = flavour ? listPriceCents(size, flavour) ?? 0 : 0;

  return (
    <main className="mx-auto w-full max-w-[60rem] px-4 pb-16 pt-8 sm:px-6">
      <Link
        href="/"
        className="-m-2 inline-flex min-h-[32px] items-center p-2 font-display text-[1.3rem] font-light tracking-tight text-[#C85478]"
      >
        Num Num&rsquo;s Bakery
      </Link>

      {/* ── The thesis: every cake here is eggless, and it is ready in two days ── */}
      <header className="mt-5">
        <p className="section-label">100% eggless · ready in 48 hours</p>
        <h1 className="font-display mt-2 text-[2.6rem] font-light leading-[1.05] tracking-tight sm:text-[3.4rem]">
          Pick your cake
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.84rem] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex text-[#E3B664]" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
            </span>
            <b className="font-semibold text-foreground">4.6</b> · 50+ Google reviews
          </span>
          <span aria-hidden className="hidden text-border sm:inline">|</span>
          <span>Collect from Harris Park or Riverstone</span>
        </div>
      </header>

      {/* ── The board ── */}
      <section className="mt-8" aria-labelledby="flavours-h">
        <h2 id="flavours-h" className="section-label">Choose a flavour</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {flavours.map((f) => {
            const chosen = flavour === f.name;
            return (
              <li key={f.name}>
                <button
                  type="button"
                  aria-pressed={chosen}
                  onClick={() => {
                    setFlavour(f.name);
                    setSize(DEFAULT_SIZE);
                    requestAnimationFrame(() => configRef.current?.scrollIntoView({
                      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                        ? "auto" : "smooth",
                      block: "start",
                    }));
                  }}
                  className="cake-card w-full"
                >
                  <span className="relative block aspect-square overflow-hidden bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cakePhoto(f.name)}
                      alt={`${f.name} eggless cake`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {f.premium && (
                      <span className="badge-premium absolute left-2 top-2">Premium</span>
                    )}
                    {chosen && (
                      <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#C85478] text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </span>
                  <span className="block px-3 py-2.5">
                    <span className="block text-[0.86rem] font-medium leading-tight">{f.name}</span>
                    <span className="block text-[0.74rem] text-muted-foreground">
                      from {money(listPriceCents("6 inch", f.name) ?? 0)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Size it and write on it. Only appears once there is a cake to size. ── */}
      {flavour && (
        <section ref={configRef} className="mt-8 scroll-mt-4 rounded-2xl border border-border bg-secondary/50 p-4 sm:p-6" aria-labelledby="config-h">
          <h2 id="config-h" className="font-display text-[1.75rem] font-light tracking-tight">
            {flavour}
          </h2>

          <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,15rem)_1fr]">
            {/* The signature: what the writing will actually look like, piped. */}
            <div className="relative mx-auto w-full max-w-[15rem] overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cakePhoto(flavour)}
                alt={`${flavour} eggless cake`}
                className="block aspect-square w-full object-cover"
              />
              {wording.trim() && (
                <span
                  aria-hidden
                  className="icing pointer-events-none absolute left-1/2 top-[31%] w-[74%] -translate-x-1/2 -translate-y-1/2 text-center text-[1.2rem] sm:text-[1.4rem]"
                >
                  {wording}
                </span>
              )}
            </div>

            <div>
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
                  ? `Piped just like that — ${60 - wording.length} characters left.`
                  : "We pipe it by hand. Check your spelling before you pay."}
              </p>

              <h3 className="section-label mt-5">How big?</h3>
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
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={addCake}
                disabled={full}
                className="btn-cta mt-5 w-full py-3 sm:w-auto"
              >
                Add to order — {money(selectedCents)}
              </button>
              {full && (
                <p className="mt-2 text-[0.76rem] text-muted-foreground">
                  {MAX_LINES} cakes is the most we take in one online order. For more,{" "}
                  <a href="/order" className="font-semibold text-[#C85478]">talk to us directly</a>.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Everything below only exists once there is something to collect. ── */}
      {loaded && cart.lines.length > 0 && (
        <>
          <section className="mt-10" aria-labelledby="order-h">
            <h2 id="order-h" className="section-label">Your order</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {cart.lines.map((l, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cakePhoto(l.flavour)}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-[0.92rem] font-medium">{l.size} {l.flavour}</p>
                    <p className="text-[0.76rem] text-muted-foreground">
                      {l.wording ? `“${l.wording}”` : "No writing"}
                    </p>
                  </div>
                  <span className="tabular-nums text-[0.92rem] font-semibold">{money(lineCents[i])}</span>
                  <button
                    type="button"
                    onClick={() => update({ ...cart, lines: cart.lines.filter((_, j) => j !== i) })}
                    aria-label={`Remove the ${l.size} ${l.flavour}`}
                    className="-m-2 inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8" aria-labelledby="collect-h">
            <h2 id="collect-h" className="section-label">When and where</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label htmlFor="c-store" className="field-label">Shop</label>
                <select id="c-store" className="field-input" value={cart.store}
                  onChange={(e) => update({ ...cart, store: e.target.value })}>
                  <option value="">Choose a shop…</option>
                  {STORES.map((s) => (
                    <option key={s.code} value={s.code}>{s.label} — {s.address}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-date" className="field-label">Collection date</label>
                {/* min/max are convenience; the server rebuilds and re-checks both. */}
                <input id="c-date" type="date" className="field-input" value={cart.dueDate}
                  min={minDueDate()} max={maxDueDate()}
                  onChange={(e) => update({ ...cart, dueDate: e.target.value })} />
              </div>
              <div>
                <label htmlFor="c-hour" className="field-label">Time</label>
                <select id="c-hour" className="field-input" value={cart.dueHour}
                  onChange={(e) => update({ ...cart, dueHour: Number(e.target.value) })}>
                  {hours.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                </select>
              </div>
            </div>
            <p className="mt-2 text-[0.76rem] text-muted-foreground">
              We need 48 hours&rsquo; notice, so the earliest is {minDueDate()}
              {hours.length > 0 && hours[0] > 9 ? ` from ${hourLabel(hours[0])}` : ""}.
            </p>
            {busyDay && (
              <p className="mt-2 rounded-lg bg-[#FDF3F6] px-3 py-2 text-[0.78rem] text-[#96355A]">
                Heads up — four in five of our cakes go out Friday to Sunday. Weekends
                book out first, so it&rsquo;s worth locking this in.
              </p>
            )}
          </section>

          <section className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <p className="text-[0.95rem]">
              {cart.lines.length} {cart.lines.length === 1 ? "cake" : "cakes"}
              <span className="ml-3 tabular-nums text-2xl font-semibold">{money(subtotal)}</span>
            </p>
            <Link
              href="/checkout"
              aria-disabled={!ready}
              onClick={(e) => { if (!ready) e.preventDefault(); }}
              className={ready ? "btn-cta py-3" : "btn-cta pointer-events-none py-3 opacity-50"}
            >
              Continue to checkout
            </Link>
          </section>
          {!ready && (
            <p className="mt-2 text-right text-[0.76rem] text-muted-foreground">
              Pick a shop and a collection date first.
            </p>
          )}
        </>
      )}
    </main>
  );
}
