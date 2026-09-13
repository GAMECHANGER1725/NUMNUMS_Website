"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ShopHeader } from "@/components/ui/shop-header";
import {
  cartStore, writeCart, minDueDate, maxDueDate, availableHours, money, STORES,
  type Cart,
} from "@/lib/cart";
import { listPriceCents, flavourSlug, urlSlug } from "@/lib/catalog";
import { cakeFraming } from "@/lib/cake-framing";

const hourLabel = (h: number) => (h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`);

export default function CartPage() {
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const loaded = useSyncExternalStore(() => () => {}, () => true, () => false);

  const update = (next: Cart) => writeCart(next);
  const lineCents = cart.lines.map((l) => listPriceCents(l.size, l.flavour) ?? 0);
  const subtotal = lineCents.reduce((a, b) => a + b, 0);
  const hours = availableHours(cart.dueDate);
  const ready = cart.lines.length > 0 && cart.store !== "" && cart.dueDate !== "" && hours.includes(cart.dueHour);

  // Fri–Sun is 81% of every order placed. Saying so is true, which is the only
  // reason it is here — a fabricated "2 slots left" would read the same and be
  // worth less than nothing.
  const busyDay = (() => {
    if (!cart.dueDate) return false;
    const d = new Date(`${cart.dueDate}T12:00:00`).getDay();
    return d === 0 || d === 5 || d === 6;
  })();

  if (loaded && cart.lines.length === 0) {
    return (
      <>
        <ShopHeader />
        <main className="mx-auto w-full max-w-[40rem] px-4 py-20 text-center">
          <h1 className="font-display text-4xl font-light tracking-tight">No cakes yet</h1>
          <p className="mt-2 text-[0.95rem] text-muted-foreground">
            Pick a flavour and we&rsquo;ll take it from there.
          </p>
          <Link href="/" className="btn-cta mt-6 inline-flex py-3">Browse the cakes</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <ShopHeader />
      <main className="mx-auto w-full max-w-[46rem] px-4 pb-20 pt-8 sm:px-6">
        <h1 className="font-display text-[2.4rem] font-light leading-tight tracking-tight">Your order</h1>

        <ul className="mt-6 flex flex-col gap-2">
          {cart.lines.map((l, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3">
              <Link href={`/cakes/${urlSlug(l.flavour)}`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/shop/cakes/${flavourSlug(l.flavour)}.webp`}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                  style={{ objectPosition: cakeFraming(flavourSlug(l.flavour)) }}
                />
              </Link>
              <div className="flex-1">
                <p className="text-[0.95rem] font-medium">{l.size} {l.flavour}</p>
                <p className="text-[0.78rem] text-muted-foreground">
                  {l.wording ? `“${l.wording}”` : "No writing"}
                </p>
              </div>
              <span className="tabular-nums text-[0.95rem] font-semibold">{money(lineCents[i])}</span>
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

        <Link href="/" className="mt-3 inline-flex text-[0.84rem] font-semibold text-[#C85478]">
          + Add another cake
        </Link>

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
      </main>
    </>
  );
}
