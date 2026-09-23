"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Lock, Trash2 } from "lucide-react";
import { ShopHeader } from "@/components/ui/shop-header";
import { CheckoutSteps } from "@/components/ui/checkout-steps";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { CouponField } from "@/components/ui/coupon-field";
import { NnSelect } from "@/components/ui/select";
import {
  cartStore, writeCart, cartCount, capLines, minDueDate, maxDueDate,
  money, depositCents, DEPOSIT_RATE, MAX_CAKES, STORES, type Cart,
} from "@/lib/cart";
import {
  listPriceCents, flavourSlug, urlSlug, COLLECTION, collectionSlots, slotLabel,
} from "@/lib/catalog";
import { NnWhenField } from "@/components/ui/when-field";

/** "11:00 AM – 10:00 PM", read straight off the one window definition. */
const storeHours = (code: string) => {
  const w = COLLECTION[code as keyof typeof COLLECTION];
  return w ? `${slotLabel(w.open)} – ${slotLabel(w.close)}` : "";
};
import { cakeFraming } from "@/lib/cake-framing";
import { supabase } from "@/lib/supabase";
import { beginCheckout } from "@/lib/analytics";

/** Typo catcher, not a validator — create-checkout checks it again. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

/**
 * Changing shop can invalidate the time already chosen — Riverstone has no
 * 9pm and Harris Park has no 9am. Left alone the cart would carry a slot the
 * new shop does not offer, `ready` would go false, and the Checkout button
 * would grey out with nothing on screen explaining why.
 */
function pickStore(cart: Cart, store: string): Cart {
  const slots = collectionSlots(store);
  const keep = slots.includes(cart.dueMin) ? cart.dueMin : 0;
  return { ...cart, store, dueMin: keep };
}
const prettyDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });

export default function CartPage() {
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const loaded = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [picked, setPicked] = useState<number[]>([]);
  const [email, setEmail] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // A coupon is bound to the email it was issued to. Signed in, we know it;
    // a guest types it into the coupon box. Everything else — name, mobile,
    // card — is asked for on Stripe's page, which is the next step.
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);
  const couponEmail = email || guestEmail.trim();

  const update = (next: Cart) => writeCart(next);
  const lineUnit = cart.lines.map((l) => listPriceCents(l.size, l.flavour) ?? 0);
  const lineTotal = cart.lines.map((l, i) => l.qty * lineUnit[i]);
  const subtotal = lineTotal.reduce((a, b) => a + b, 0);
  const count = cartCount(cart);
  const discount = cart.coupon ? Math.round((subtotal * cart.coupon.percent) / 100) : 0;
  const total = subtotal - discount;
  const deposit = depositCents(total);

  /**
   * The picker's slot list depends on the SHOP, not on the date already
   * saved. It used to be `availableSlots(store, cart.dueDate)`, which returns
   * [] for a date inside the lead time — so a cart left overnight, whose
   * saved date had since gone stale, showed an empty time list on *every*
   * day you tapped, under a hint saying "pick a shop first" when a shop was
   * already picked. The calendar greys unbookable days itself, so any day
   * reachable in it is a day the whole window is valid for.
   */
  const slots = collectionSlots(cart.store);
  const dateStale = cart.dueDate !== "" && cart.dueDate < minDueDate();
  const ready = count > 0 && cart.store !== "" && cart.dueDate !== ""
    && slots.includes(cart.dueMin) && !dateStale;
  /**
   * Straight to Stripe's hosted page. The email goes along only when we
   * already have it: signed in, or typed for a coupon — Stripe then locks it,
   * so a code bound to one address cannot be carried to another.
   */
  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: cart.coupon ? couponEmail : email,
          coupon: cart.coupon?.code ?? "",
          cart,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not start checkout.");
      // A 200 with no url would navigate to ".../undefined" and strand the
      // customer on a 404 mid-payment.
      if (typeof body?.url !== "string" || !body.url) {
        throw new Error("Could not start checkout. Please try again.");
      }
      // Once a checkout really exists, and before the redirect unloads the page.
      beginCheckout(
        cart.lines.map((l, i) => ({ size: l.size, flavour: l.flavour, qty: l.qty ?? 1, cents: lineUnit[i] })),
        total,
      );
      window.location.assign(body.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  const allPicked = picked.length > 0 && picked.length === cart.lines.length;

  const setQty = (i: number, qty: number) =>
    update({ ...cart, lines: capLines(cart.lines.map((l, j) => (j === i ? { ...l, qty } : l))) });

  const removeAt = (drop: number[]) => {
    update({ ...cart, lines: cart.lines.filter((_, j) => !drop.includes(j)) });
    setPicked([]);
  };

  // Fri–Sun is 81% of every order placed. It is here because it is true; a
  // fabricated "2 slots left" would read the same and be worth less than nothing.
  const busyDay = (() => {
    if (!cart.dueDate) return false;
    const d = new Date(`${cart.dueDate}T12:00:00`).getDay();
    return d === 0 || d === 5 || d === 6;
  })();

  if (loaded && count === 0) {
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
      <main className="mx-auto w-full max-w-[64rem] px-4 pb-20 pt-8 sm:px-6">
        <h1 className="font-display text-center text-[2.4rem] font-light leading-tight tracking-tight">
          Your order
        </h1>
        <CheckoutSteps current={1} />

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
          {/* ── the cakes ─────────────────────────────────────────────── */}
          <section aria-labelledby="items-h">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
              <label className="flex cursor-pointer items-center gap-2.5 text-[0.86rem] font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#C85478]"
                  checked={allPicked}
                  onChange={(e) => setPicked(e.target.checked ? cart.lines.map((_, i) => i) : [])}
                />
                <span id="items-h">
                  Select all
                  <span className="ml-2 font-normal text-muted-foreground">
                    {count} {count === 1 ? "cake" : "cakes"}
                  </span>
                </span>
              </label>
              <button
                type="button"
                disabled={picked.length === 0}
                onClick={() => removeAt(picked)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3 text-[0.8rem] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:text-muted-foreground/50 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove{picked.length ? ` (${picked.length})` : ""}
              </button>
            </div>

            <ul className="mt-3 flex flex-col gap-2">
              {cart.lines.map((l, i) => {
                // What is left of the ten-cake order, plus what this line
                // already holds — the ceiling on this stepper is the order's,
                // not the line's.
                const room = MAX_CAKES - (count - l.qty);
                return (
                  <li key={`${l.size}|${l.flavour}|${l.wording}`} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-[#C85478]"
                        checked={picked.includes(i)}
                        aria-label={`Select the ${l.size} ${l.flavour}`}
                        onChange={(e) =>
                          setPicked((p) => (e.target.checked ? [...p, i] : p.filter((j) => j !== i)))
                        }
                      />
                      <Link href={`/cakes/${urlSlug(l.flavour)}`} className="cake-photo block h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/shop/cakes/${flavourSlug(l.flavour)}.webp`}
                          alt=""
                          className="h-full w-full object-cover"
                          style={{ objectPosition: cakeFraming(flavourSlug(l.flavour)) }}
                        />
                      </Link>

                      {/* min-w-[10rem] keeps the name column from collapsing to
                          one word before the row is ready to wrap. */}
                      <div className="min-w-[10rem] flex-1">
                        <p className="text-[0.95rem] font-medium leading-tight">{l.flavour}</p>
                        <p className="mt-0.5 text-[0.78rem] text-muted-foreground">
                          Size: <span className="text-foreground">{l.size}</span>
                        </p>
                        <p className="truncate text-[0.78rem] text-muted-foreground">
                          Writing: <span className="text-foreground">{l.wording || "none"}</span>
                        </p>
                      </div>

                      <QtyStepper
                        value={l.qty}
                        max={room}
                        label={`${l.size} ${l.flavour}`}
                        onChange={(n) => setQty(i, n)}
                      />

                      <p className="w-[5.5rem] shrink-0 text-right">
                        <span className="block tabular-nums text-[0.98rem] font-semibold">{money(lineTotal[i])}</span>
                        {l.qty > 1 && (
                          <span className="block text-[0.7rem] text-muted-foreground">
                            {money(lineUnit[i])} each
                          </span>
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeAt([i])}
                        aria-label={`Remove the ${l.size} ${l.flavour}`}
                        className="-m-2 inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {room <= l.qty && (
                      <p className="mt-2 text-[0.72rem] text-muted-foreground">
                        {MAX_CAKES} cakes is the most we take in one online order.{" "}
                        <a href="/order" className="font-semibold text-[#C85478]">Ask us about a bigger one</a>.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            <Link href="/" className="mt-3 inline-flex text-[0.84rem] font-semibold text-[#C85478]">
              + Add another cake
            </Link>

            <section className="mt-8" aria-labelledby="collect-h">
              <h2 id="collect-h" className="section-label">When and where</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label htmlFor="c-store" className="field-label">Shop</label>
                  <NnSelect
                    id="c-store"
                    value={cart.store}
                    onChange={(v) => update(pickStore(cart, v))}
                    placeholder="Choose a shop…"
                    ariaLabel="Shop to collect from"
                    // The address only. The hours were appended here too and
                    // the combined string pushed the select's caret off the
                    // right edge of a 320px screen — they already sit beside
                    // the Collection label, which is where they are needed.
                    options={STORES.map((st) => ({
                      value: st.code, label: st.label, note: st.address,
                    }))}
                  />
                </div>
                {/* One control, because it is one decision: when am I picking
                    this up. The calendar is open on the page and the times pop
                    out of the day you tap — two separate fields made the
                    customer answer half of it, look away, and answer the rest. */}
                <div className="sm:col-span-3">
                  <p className="field-label" id="c-when-label">
                    Collection
                    {cart.store && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        ({storeHours(cart.store)})
                      </span>
                    )}
                  </p>
                  {/* min/max are convenience; the server rebuilds and re-checks both. */}
                  <NnWhenField
                    id="c-when"
                    date={cart.dueDate}
                    min={minDueDate()}
                    max={maxDueDate()}
                    time={cart.dueMin}
                    slots={slots}
                    onChange={({ date, time }) =>
                      update({ ...cart, dueDate: date, dueMin: time })}
                    emptyHint={
                      cart.store
                        ? "That date is too soon — pick a later one."
                        : "Pick a shop first. Our two shops keep different hours."
                    }
                  />
                </div>
              </div>
              <p className="mt-2 text-[0.76rem] text-muted-foreground">
                Baked to order, so the earliest we can have it ready is {prettyDate(minDueDate())}.
              </p>
              {busyDay && (
                <p className="mt-2 rounded-lg bg-[#FDF3F6] px-3 py-2 text-[0.78rem] text-[#96355A]">
                  Heads up — four in five of our cakes go out Friday to Sunday. Weekends
                  book out first, so it&rsquo;s worth locking this in.
                </p>
              )}
            </section>
          </section>

          {/* ── the money ─────────────────────────────────────────────── */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-[84px]">
            <CouponField
              applied={cart.coupon}
              email={EMAIL_RE.test(couponEmail) ? couponEmail : ""}
              noEmailNote="Codes are issued to one address, so add the email yours was sent to."
              onApply={(c) =>
                update({ ...cart, coupon: c ? { code: c.code, percent: c.percent } : null })
              }
            >
              {!email && (
                <div className="mt-3">
                  <label htmlFor="c-email" className="field-label">Email your code was sent to</label>
                  <input id="c-email" type="email" autoComplete="email" inputMode="email"
                    placeholder="you@example.com" className="field-input"
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      // The code is bound to the address it was checked
                      // against. Keep it after an edit and the server refuses
                      // it — a total that goes UP on Stripe's page.
                      if (cart.coupon) update({ ...cart, coupon: null });
                    }} />
                </div>
              )}
            </CouponField>

            <section className="rounded-xl border border-border bg-card p-4" aria-labelledby="sum-h">
              <h2 id="sum-h" className="text-[0.95rem] font-semibold">Order summary</h2>
              <dl className="mt-3 flex flex-col gap-2 text-[0.88rem]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Subtotal <span className="text-[0.78rem]">({count} {count === 1 ? "cake" : "cakes"})</span>
                  </dt>
                  <dd className="tabular-nums">{money(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#C85478]">
                    <dt>Coupon {cart.coupon?.code}</dt>
                    <dd className="tabular-nums">−{money(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  {/* Not a delivery fee, because there is no delivery. "Free
                      delivery" for a shop you drive to is the kind of small
                      untruth that costs a five-star review. */}
                  <dt className="text-muted-foreground">Collection</dt>
                  <dd className="text-muted-foreground">Free</dd>
                </div>
                {/* The full price stays, quietly, above. Hiding it and
                    showing only the deposit is how a customer discovers at
                    the counter that they owe another $25 — which is both a
                    bad morning for the shop and a misleading-price problem. */}
                <div className="mt-1 flex items-baseline justify-between border-t border-border pt-3">
                  <dt className="text-[0.88rem] text-muted-foreground">Total</dt>
                  <dd className="tabular-nums text-[0.95rem] text-muted-foreground">
                    {money(total)}
                  </dd>
                </div>
                {/* Below the total and larger than it: the deposit is the
                    number this page is actually asking for. */}
                <div className="flex items-baseline justify-between">
                  <dt className="text-[1rem] font-semibold">Pay today</dt>
                  <dd className="font-display text-[1.9rem] font-light tabular-nums text-[#C85478]">
                    {money(deposit)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Balance on collection</dt>
                  <dd className="tabular-nums text-muted-foreground">{money(total - deposit)}</dd>
                </div>
              </dl>

              <p className="mt-3 rounded-lg bg-[#F5EBE0] px-3 py-2 text-[0.78rem] leading-relaxed text-[#5C3A22]">
                Secure your cake with a {Math.round(DEPOSIT_RATE * 100)}% deposit and pay the rest
                when you pick it up. Cancel more than 24 hours before collection and the deposit is
                refunded in full.
              </p>

              {error && <p role="alert" className="mt-3 text-[0.82rem] font-medium text-destructive">{error}</p>}
              <button type="button" onClick={pay} disabled={!ready || busy} className="btn-cta mt-4 w-full py-3">
                {busy
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Opening secure checkout</>
                  : <><Lock className="h-4 w-4" />Pay deposit {money(deposit)} <ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className="mt-2 text-center text-[0.72rem] leading-relaxed text-muted-foreground">
                Paying confirms you accept our{" "}
                <a href="/terms" target="_blank" rel="noopener" className="font-semibold text-[#C85478] underline-offset-2 hover:underline">
                  Terms &amp; Conditions
                </a>.
              </p>
              {/* Name the thing that is actually missing. "Pick a shop and a
                  collection date" was shown even when both were set and only
                  the time was not, and even when the saved date had gone
                  stale overnight — in which case nothing on the page looked
                  wrong and the button simply would not work. */}
              {!ready && (
                <p className="mt-2 text-center text-[0.76rem] text-muted-foreground">
                  {dateStale
                    ? "That collection date has passed — pick a new one."
                    : !cart.store ? "Pick a shop to collect from."
                      : !cart.dueDate ? "Pick a collection date."
                        : "Pick a collection time."}
                </p>
              )}
            </section>

            {/*
              Where AC Store puts a payment-method picker. We cannot: the card
              is entered on Stripe's page, so a choice offered here would be a
              choice of something that does not exist. What it can honestly do
              is say what is taken and where the details go.
            */}
            <section className="rounded-xl border border-border bg-secondary/50 p-4">
              <h2 className="flex items-center gap-2 text-[0.88rem] font-semibold">
                <Lock className="h-3.5 w-3.5 text-[#C85478]" />
                Paying
              </h2>
              <p className="mt-1.5 text-[0.8rem] leading-relaxed text-muted-foreground">
                Card, Apple Pay or Google Pay, entered on Stripe&rsquo;s secure page.
                Card details never touch this site.
              </p>
            </section>

            {/* The last honest place to leave. Checkout renders no nav on
                purpose — a link out of a payment flow is an exit — so if
                somebody has got this far wanting a cake we design to their
                brief, this is the final screen that can say so. Stated as a
                fact about what is in the cart, not as a warning. */}
            <p className="text-center text-[0.78rem] leading-relaxed text-muted-foreground">
              These are our designs, baked for tomorrow. Want one made to your
              own brief instead?{" "}
              <a href="/order" className="font-semibold text-[#C85478] underline-offset-2 hover:underline">
                Get a custom quote
              </a>
              .
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
