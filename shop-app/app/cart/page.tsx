"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  cartStore, writeCart, minDueDate, maxDueDate, availableHours, money, STORES, MAX_LINES,
  type Cart, type CartLine,
} from "@/lib/cart";
import { SELLABLE_SIZES, SELLABLE_FLAVOURS, listPriceCents, sizeServes } from "@/lib/catalog";

const hourLabel = (h: number) => (h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`);

export default function CartPage() {
  // The cart is an external store (localStorage), so React reads it as one:
  // the server snapshot is empty, which is also what the first client paint
  // shows, so hydration cannot mismatch.
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const loaded = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [draft, setDraft] = useState<CartLine>({ size: "8 inch", flavour: "Vanilla", wording: "" });

  const update = (next: Cart) => writeCart(next);

  const lineCents = cart.lines.map((l) => listPriceCents(l.size, l.flavour) ?? 0);
  const subtotal = lineCents.reduce((a, b) => a + b, 0);
  const draftCents = listPriceCents(draft.size, draft.flavour) ?? 0;
  const full = cart.lines.length >= MAX_LINES;
  // The form never offers a slot the server would refuse: the lead time is 48
  // hours, so the earliest date loses its early-morning slots.
  const hours = availableHours(cart.dueDate);
  const ready = cart.lines.length > 0 && cart.store !== "" && cart.dueDate !== "" && hours.includes(cart.dueHour);

  return (
    <main className="mx-auto w-full max-w-[46rem] px-4 py-10">
      <Link href="/" className="-m-2 inline-flex min-h-[32px] items-center p-2 font-display text-[1.35rem] font-light tracking-tight text-[#C85478]">
        Num Num&rsquo;s Bakery
      </Link>
      <h1 className="font-display mt-4 text-4xl font-light tracking-tight">Your cakes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every cake is 100% eggless. One collection date and shop per order.
      </p>

      {/* ── what's in the cart ── */}
      <section className="mt-7">
        <h2 className="section-label">In your order</h2>
        {!loaded ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : cart.lines.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Nothing yet — add your first cake below.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {cart.lines.map((l, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex-1">
                  <p className="text-[0.92rem] font-medium">
                    {l.size} {l.flavour}
                  </p>
                  <p className="text-[0.76rem] text-muted-foreground">
                    Serves {sizeServes(l.size) ?? "—"}
                    {l.wording ? ` · “${l.wording}”` : ""}
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
        )}
      </section>

      {/* ── add another ── */}
      <section className="mt-7 rounded-xl border border-border bg-secondary/50 p-4">
        <h2 className="section-label">Add a cake</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="c-size" className="field-label">Size</label>
            <select id="c-size" className="field-input" value={draft.size}
              onChange={(e) => setDraft({ ...draft, size: e.target.value })}>
              {SELLABLE_SIZES.map((s) => (
                <option key={s.code} value={s.code}>{s.label} — serves {s.serves}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="c-flavour" className="field-label">Flavour</label>
            <select id="c-flavour" className="field-input" value={draft.flavour}
              onChange={(e) => setDraft({ ...draft, flavour: e.target.value })}>
              {SELLABLE_FLAVOURS.map((f) => (
                <option key={f.name} value={f.name}>{f.name}{f.premium ? " (premium)" : ""}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="c-wording" className="field-label">Writing on the cake (optional)</label>
            <input id="c-wording" maxLength={60} placeholder="Happy Birthday Aarav"
              className="field-input" value={draft.wording}
              onChange={(e) => setDraft({ ...draft, wording: e.target.value })} />
          </div>
        </div>
        <button
          type="button"
          disabled={full}
          onClick={() => {
            update({ ...cart, lines: [...cart.lines, draft] });
            // Size and flavour stay — people often order two similar cakes —
            // but the writing is cleared every time. Carrying one cake's name
            // onto the next is an error that reaches the kitchen as a fact.
            setDraft({ ...draft, wording: "" });
          }}
          className="btn-cta mt-4 w-full py-2.5 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add {draft.size} {draft.flavour} — {money(draftCents)}
        </button>
        {full && (
          <p className="mt-2 text-[0.76rem] text-muted-foreground">
            {MAX_LINES} cakes is the most we take in one online order. For more,{" "}
            <a href="/order" className="font-semibold text-[#C85478]">talk to us directly</a>.
          </p>
        )}
      </section>

      {/* ── when and where ── */}
      <section className="mt-7">
        <h2 className="section-label">Collection</h2>
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
            <label htmlFor="c-date" className="field-label">Date</label>
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
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-[0.95rem]">
          Subtotal <span className="ml-2 tabular-nums text-xl font-semibold">{money(subtotal)}</span>
        </p>
        <Link
          href="/checkout"
          aria-disabled={!ready}
          onClick={(e) => { if (!ready) e.preventDefault(); }}
          className={ready ? "btn-cta py-2.5" : "btn-cta pointer-events-none py-2.5 opacity-50"}
        >
          Continue to checkout
        </Link>
      </div>
      {!ready && cart.lines.length > 0 && (
        <p className="mt-2 text-right text-[0.76rem] text-muted-foreground">
          Pick a shop and a collection date first.
        </p>
      )}
    </main>
  );
}
