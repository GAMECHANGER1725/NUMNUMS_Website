"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Confetti, fireSideCannons, type ConfettiRef } from "@/components/ui/confetti";
import { CheckoutSteps } from "@/components/ui/checkout-steps";
import { clearCart, money, readCart, STORES } from "@/lib/cart";
import { listPriceCents } from "@/lib/catalog";
import { purchase } from "@/lib/analytics";

type Status = { paid: boolean; order_nos?: string[]; due_at?: string; store?: string; total?: number };

const POLL_MS = 1500;
const GIVE_UP_AFTER = 12_000;
const FIRED_KEY = "nn_order_celebrated";
// Revenue needs a LONGER-lived guard than the confetti. sessionStorage is
// per-tab: reopening the thank-you link in a new tab or a week later is a
// fresh session, and GA4 does not reliably dedupe a repeated
// transaction_id — so the same order would be banked twice. Re-firing the
// cannons in that situation is harmless; re-firing `purchase` is not.
const BANKED_KEY = "nn_order_banked_v1";

export default function ThankYouPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [slow, setSlow] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  useEffect(() => {
    // Read the session from the URL directly rather than via useSearchParams,
    // which would need a Suspense boundary under `output: "export"`.
    const s = new URLSearchParams(window.location.search).get("s");
    let stop = false;
    const started = Date.now();

    async function poll() {
      if (stop) return;
      if (!s) return setSlow(true);
      try {
        const res = await fetch(`/api/order-status?s=${encodeURIComponent(s!)}`);
        const body: Status = await res.json();
        if (body.paid) {
          setStatus(body);
          // Read the cart BEFORE clearing it: order-status returns the total
          // but not the line items, and this is the last moment they exist.
          const bought = readCart().lines.map((l) => ({
            size: l.size,
            flavour: l.flavour,
            qty: l.qty ?? 1,
            cents: listPriceCents(l.size, l.flavour) ?? 0,
          }));
          clearCart();
          // The same guard the cannons use, and for a stronger reason: a
          // refresh that re-fires `purchase` books the same revenue twice.
          // Only ever on a confirmed payment — this page is reachable by
          // anyone with the URL, and Stripe can return before the webhook has
          // written the order.
          // Defaults to NOT banked: if storage is unavailable we cannot dedupe,
          // and losing every private-mode purchase is a worse error than a rare
          // duplicate, which needs the same link reopened in the same private
          // session to happen at all.
          let banked = false;
          try { banked = localStorage.getItem(BANKED_KEY) === s; } catch { /* private mode */ }
          if (!banked) {
            try { localStorage.setItem(BANKED_KEY, s!); } catch { /* private mode */ }
            purchase(
              body.order_nos?.join(", ") ?? s!,
              bought,
              Math.round((body.total ?? 0) * 100),
            );
          }
          if (sessionStorage.getItem(FIRED_KEY) !== s) {
            try { sessionStorage.setItem(FIRED_KEY, s!); } catch { /* private mode */ }
            fireSideCannons(confettiRef.current);
          }
          return;
        }
      } catch { /* keep polling; the webhook may simply not have landed yet */ }
      if (Date.now() - started > GIVE_UP_AFTER) return setSlow(true);
      setTimeout(poll, POLL_MS);
    }
    poll();
    return () => { stop = true; };
  }, []);

  const store = STORES.find((s) => s.code === status?.store);

  return (
    <main className="mx-auto w-full max-w-[38rem] px-4 py-16">
      <Confetti ref={confettiRef} manualstart className="pointer-events-none fixed inset-0 z-[999] h-full w-full" />

      {status?.paid ? (
        <>
          <CheckoutSteps current={3} />
          <p className="section-label mt-8">Paid</p>
          <h1 className="font-display mt-2 text-4xl font-light tracking-tight">Thank you — we&rsquo;re on it</h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
            {status.order_nos?.length === 1 ? "Your order is" : "Your orders are"}{" "}
            <b className="font-semibold text-foreground">{status.order_nos?.join(", ")}</b>.
            We&rsquo;ve emailed your receipt.
          </p>
          <dl className="mt-6 flex flex-col gap-2 rounded-xl border border-border bg-secondary/50 p-4 text-[0.9rem]">
            <div className="flex justify-between"><dt className="text-muted-foreground">Collect from</dt>
              <dd className="text-right">{store?.label ?? status.store}<span className="block text-[0.76rem] text-muted-foreground">{store?.address}</span></dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">When</dt>
              <dd>{status.due_at ? new Date(status.due_at).toLocaleString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "full", timeStyle: "short" }) : "—"}</dd></div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold"><dt>Paid</dt>
              <dd className="tabular-nums">{money(Math.round((status.total ?? 0) * 100))}</dd></div>
          </dl>
          <p className="mt-5 text-[0.82rem] leading-relaxed text-muted-foreground">
            Bring your name to the counter. If anything changes, call the shop and quote your order number.
          </p>
          <Link href="/cart" className="btn-cta mt-6 inline-flex py-2.5">Order another cake</Link>
        </>
      ) : slow ? (
        <>
          <h1 className="font-display text-4xl font-light tracking-tight">Your payment went through</h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
            We&rsquo;re still writing the order up — this occasionally takes a minute.
            Your receipt email is the confirmation, and nothing is lost. If it hasn&rsquo;t
            arrived in ten minutes, call the shop and we&rsquo;ll find it.
          </p>
          <Link href="/" className="btn-cta mt-6 inline-flex py-2.5">Back to the shop</Link>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#C85478]" />
          <p className="text-sm text-muted-foreground">Confirming your payment…</p>
        </div>
      )}
    </main>
  );
}
