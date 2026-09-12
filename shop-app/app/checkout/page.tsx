"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { CouponField } from "@/components/ui/coupon-field";
import { cartStore, money, STORES } from "@/lib/cart";
import { listPriceCents } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";
import type { Coupon } from "@/lib/coupons";

const MOBILE_RE = /^(?:\+?61|0)4\d{8}$/;
const normalisePhone = (v: string) => v.replace(/[\s()-]/g, "");

export default function CheckoutPage() {
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const loaded = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
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

  const lineCents = cart.lines.map((l) => listPriceCents(l.size, l.flavour) ?? 0);
  const subtotal = lineCents.reduce((a, b) => a + b, 0);
  // Indicative only: create-checkout re-prices every line and re-validates the
  // coupon server-side, so this number can never decide what is charged.
  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  const phoneValid = phone.trim() === "" || MOBILE_RE.test(normalisePhone(phone));
  const canPay = loaded && cart.lines.length > 0 && name.trim() !== "" && email.includes("@") && phoneValid && !busy;

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, email, phone: phone.trim() ? normalisePhone(phone) : "",
          coupon: coupon?.code ?? "", cart,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not start checkout.");
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  if (loaded && cart.lines.length === 0) {
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
      <Link href="/cart" className="text-[0.82rem] font-semibold text-[#C85478]">&larr; Back to your cakes</Link>
      <h1 className="font-display mt-3 text-4xl font-light tracking-tight">Checkout</h1>

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
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <label htmlFor="k-phone" className="field-label mb-0">Mobile</label>
              <span className="rounded-full bg-[#F8EEE6] px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[#C85478]">
                Recommended
              </span>
            </div>
            <input id="k-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0412 345 678"
              aria-invalid={!phoneValid}
              className={`field-input mt-1.5${phoneValid ? "" : " border-destructive"}`}
              value={phone} onChange={(e) => setPhone(e.target.value)} />
            <p className="mt-1 text-[0.72rem] text-muted-foreground">
              {phoneValid
                ? "We text you the moment your cake is ready to collect."
                : "That doesn't look like an Australian mobile. Leave it blank if you'd rather not."}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="section-label">Your order</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {cart.lines.map((l, i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-[0.92rem]">
                {l.size} {l.flavour}
                {l.wording && <span className="block text-[0.76rem] text-muted-foreground">“{l.wording}”</span>}
              </span>
              <span className="tabular-nums text-[0.92rem] font-semibold">{money(lineCents[i])}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.82rem] text-muted-foreground">
          Collect from <b className="font-semibold text-foreground">{store?.label ?? "—"}</b> on{" "}
          <b className="font-semibold text-foreground">{cart.dueDate}</b>.
        </p>
      </section>

      <section className="mt-7">
        <CouponField applied={coupon} onApply={setCoupon} />
      </section>

      <section className="mt-7 border-t border-border pt-5">
        <dl className="flex flex-col gap-1.5 text-[0.9rem]">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{money(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[#C85478]">
              <dt>Coupon {coupon?.code}</dt>
              <dd className="tabular-nums">−{money(discount)}</dd>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-border pt-2 text-lg font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(subtotal - discount)}</dd>
          </div>
        </dl>

        {error && <p role="alert" className="mt-3 text-[0.82rem] font-medium text-destructive">{error}</p>}

        <button type="button" onClick={pay} disabled={!canPay} className="btn-cta mt-5 w-full py-3">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Opening secure checkout</> : <><Lock className="h-4 w-4" />Pay {money(subtotal - discount)}</>}
        </button>
        <p className="mt-2 text-center text-[0.72rem] text-muted-foreground">
          Card details are entered on Stripe&rsquo;s secure page — they never touch this site.
        </p>
      </section>
    </main>
  );
}
