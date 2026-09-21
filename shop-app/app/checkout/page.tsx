"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { CouponField } from "@/components/ui/coupon-field";
import { cartStore, writeCart, cartCount, money, depositCents, minDueDate, STORES } from "@/lib/cart";
import { CheckoutSteps } from "@/components/ui/checkout-steps";
import { listPriceCents, slotLabel } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";
import { beginCheckout } from "@/lib/analytics";

const MOBILE_RE = /^(?:\+?61|0)4\d{8}$/;
const normalisePhone = (v: string) => v.replace(/[\s()-]/g, "");
/**
 * Deliberately loose — this is a typo catcher, not an RFC 5322 parser, and
 * the only authority on whether an address works is whether mail arrives.
 * But `email.includes("@")` was the whole check, so **"a@" passed**: the
 * button enabled, Stripe took an unreachable `customer_email`, and the
 * receipt and the coupon binding both went nowhere.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

/** Sydney wall-clock date string to words. Never `new Date(d)` — that parses
 *  as UTC and shows the previous day for anyone east of Greenwich. */
const prettyDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long",
  });

export default function CheckoutPage() {
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const loaded = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prefill from the session so a signed-in customer retypes nothing.
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail((v) => v || (u.email ?? ""));
      setPhone((v) => v || String(u.user_metadata?.phone ?? ""));
    });
  }, []);

  const lineCents = cart.lines.map((l) => l.qty * (listPriceCents(l.size, l.flavour) ?? 0));
  const subtotal = lineCents.reduce((a, b) => a + b, 0);
  const count = cartCount(cart);
  // The cart is where an applied coupon lives, so it survives Back and a
  // reload and there is never a second copy to keep in step.
  const coupon = cart.coupon;
  // Indicative only: create-checkout re-prices every line and re-validates the
  // coupon server-side, so this number can never decide what is charged.
  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  const total = subtotal - discount;
  // Indicative too, and rounded the same way as depositCents on the server —
  // a cart that quotes $25.00 and a Stripe page that charges $24.99 is the
  // one discrepancy every customer notices.
  const deposit = depositCents(total);
  // Required, same as the sign-up form and same as create-checkout. It is how
  // the shop says a cake is ready, and the only way to reach somebody about
  // their own order.
  const phoneValid = MOBILE_RE.test(normalisePhone(phone));
  const phoneShown = phone.trim() === "" || phoneValid;
  const emailValid = EMAIL_RE.test(email.trim());

  /**
   * The collection details are part of "can this be paid for", and they were
   * missing from this check entirely.
   *
   * A cart carries the shop, the date and the time, and /checkout is a real
   * URL — a customer can arrive with any of them unset (a deep link, a cart
   * written before they picked a shop, a date that has since gone stale).
   * The button was enabled anyway, the summary read "Collect from — on ."
   * and pressing Pay bounced a raw server error back on the final step.
   *
   * `minDueDate()` is re-evaluated on render, so a cart left overnight whose
   * date is now inside the lead time is caught here rather than by Stripe.
   */
  const dateStale = cart.dueDate !== "" && cart.dueDate < minDueDate();
  const whenOk = cart.store !== "" && cart.dueDate !== "" && cart.dueMin > 0 && !dateStale;
  const canPay = loaded && count > 0 && name.trim() !== "" && emailValid
    && phoneValid && whenOk && !busy;

  // Said once, in order, so the customer is told the first thing to fix
  // rather than left guessing at a greyed-out button.
  const blocker = !loaded ? null
    : !whenOk ? (dateStale
        ? "That collection date has passed. Go back and pick a new one."
        : "Go back and choose a shop, a date and a collection time.")
      : !name.trim() ? "Add the name for the order."
        : !emailValid ? "Add a valid email address."
          : !phoneValid ? "Add an Australian mobile number."
            : null;

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, email, phone: normalisePhone(phone),
          coupon: coupon?.code ?? "", cart,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not start checkout.");
      // A 200 with no url would otherwise navigate to ".../undefined" and
      // lose the cart behind a 404, which is the worst possible place to
      // strand somebody who is trying to pay.
      if (typeof body?.url !== "string" || !body.url) {
        throw new Error("Could not start checkout. Please try again.");
      }
      // Fired here, once we know a checkout actually exists, and before the
      // redirect — after `window.location` changes this page is gone and a
      // queued event may never be sent. It used to fire at the top of pay(),
      // so every failed attempt and every server refusal counted as a
      // begin_checkout and the funnel overstated itself.
      beginCheckout(
        cart.lines.map((l) => ({
          size: l.size,
          flavour: l.flavour,
          qty: l.qty ?? 1,
          cents: listPriceCents(l.size, l.flavour) ?? 0,
        })),
        total,
      );
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  if (loaded && count === 0) {
    return (
      <main className="mx-auto w-full max-w-[46rem] px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-light tracking-tight">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pick a cake and we&rsquo;ll take it from there.</p>
        <Link href="/cart" className="btn-cta mt-6 inline-flex py-2.5">Choose a cake</Link>
      </main>
    );
  }

  const store = STORES.find((s) => s.code === cart.store);

  return (
    <main className="mx-auto w-full max-w-[46rem] px-4 py-10">
      <Link href="/cart" className="-m-2 inline-flex min-h-[32px] items-center p-2 text-[0.82rem] font-semibold text-[#C85478]">&larr; Back to your cakes</Link>
      <h1 className="font-display mt-3 text-center text-4xl font-light tracking-tight">Your details</h1>
      <CheckoutSteps current={2} />

      <section className="mt-7">
        <h2 className="section-label">Your details</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="k-name" className="field-label">Name for the order</label>
            <input id="k-name" autoComplete="name" maxLength={80} className="field-input"
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="k-email" className="field-label">Email</label>
            <input id="k-email" type="email" autoComplete="email" inputMode="email"
              placeholder="you@example.com" className="field-input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // A coupon is bound to one address, so changing it invalidates
                // the applied one. Leaving it shows a discount the server will
                // refuse — a total that goes UP on Stripe's page.
                if (cart.coupon) writeCart({ ...cart, coupon: null });
              }} />
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <label htmlFor="k-phone" className="field-label mb-0">Mobile</label>
            </div>
            <input id="k-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0412 345 678"
              aria-invalid={!phoneShown}
              aria-required="true"
              className={`field-input mt-1.5${phoneShown ? "" : " border-destructive"}`}
              value={phone} onChange={(e) => setPhone(e.target.value)} />
            <p className="mt-1 text-[0.72rem] text-muted-foreground">
              {phoneShown
                ? "We text you the moment your cake is ready to collect."
                : "That doesn't look like an Australian mobile."}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="section-label">Your order</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {/* Keyed by what the cake IS, not by index — the cart folds
              duplicates on the same three fields, so this is unique, and an
              index key re-uses a row's DOM when the list changes. */}
          {cart.lines.map((l, i) => (
            <li key={`${l.size}|${l.flavour}|${l.wording}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-[0.92rem]">
                {l.qty > 1 && <span className="font-semibold tabular-nums">{l.qty} × </span>}
                {l.size} {l.flavour}
                {l.wording && <span className="block text-[0.76rem] text-muted-foreground">“{l.wording}”</span>}
              </span>
              <span className="tabular-nums text-[0.92rem] font-semibold">{money(lineCents[i])}</span>
            </li>
          ))}
        </ul>
        {/* Either the whole collection detail or an instruction to go and set
            it — never the half-built sentence "Collect from — on ." that an
            unset cart used to print, and never the raw `2026-09-26`. */}
        {whenOk ? (
          <p className="mt-3 text-[0.82rem] text-muted-foreground">
            Collect from <b className="font-semibold text-foreground">{store?.label}</b> on{" "}
            <b className="font-semibold text-foreground">{prettyDate(cart.dueDate)}</b> at{" "}
            <b className="font-semibold text-foreground">{slotLabel(cart.dueMin)}</b>.
          </p>
        ) : (
          <p className="mt-3 rounded-lg bg-[#FDF3F6] px-3 py-2 text-[0.82rem] text-[#96355A]">
            {dateStale
              ? "That collection date has passed."
              : "No collection details yet."}{" "}
            <Link href="/cart" className="font-semibold underline underline-offset-2">
              Go back and choose
            </Link>{" "}
            a shop, a date and a time.
          </p>
        )}
      </section>

      <section className="mt-7">
        <CouponField
          applied={coupon}
          email={email}
          onApply={(c) =>
            writeCart({ ...cart, coupon: c ? { code: c.code, percent: c.percent } : null })
          }
        />
      </section>

      <section className="mt-7 border-t border-border pt-5">
        <dl className="flex flex-col gap-1.5 text-[0.9rem]">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Subtotal <span className="text-[0.78rem]">({count} {count === 1 ? "cake" : "cakes"})</span>
            </dt>
            <dd className="tabular-nums">{money(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[#C85478]">
              <dt>Coupon {coupon?.code}</dt>
              <dd className="tabular-nums">−{money(discount)}</dd>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-border pt-2">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="tabular-nums text-muted-foreground">{money(total)}</dd>
          </div>
          {/* Below the total, and larger: this is the figure the button
              charges, so it is the figure that has to be unmissable. */}
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

        {error && <p role="alert" className="mt-3 text-[0.82rem] font-medium text-destructive">{error}</p>}

        <button type="button" onClick={pay} disabled={!canPay} className="btn-cta mt-5 w-full py-3">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Opening secure checkout</> : <><Lock className="h-4 w-4" />Pay deposit {money(deposit)}</>}
        </button>
        {/* A disabled button with no reason is a dead end. Say the first
            thing to fix. */}
        {blocker && !busy && (
          <p className="mt-2 text-center text-[0.76rem] font-medium text-[#96355A]">{blocker}</p>
        )}
        <p className="mt-2 text-center text-[0.72rem] leading-relaxed text-muted-foreground">
          Card details are entered on Stripe&rsquo;s secure page — they never touch this site.
          <br />
          {/* This said "the 48-hour change-of-mind window" while the cart
              promised a refund up to 24 hours before collection. Two
              different cancellation rules on the same purchase, and the one
              here was the one nobody had agreed to. */}
          Paying confirms you accept our{" "}
          <a href="/terms" target="_blank" rel="noopener" className="font-semibold text-[#C85478] underline-offset-2 hover:underline">
            Terms &amp; Conditions
          </a>
          . Cancel more than 24 hours before collection and your deposit is refunded in full.
        </p>
      </section>
    </main>
  );
}
