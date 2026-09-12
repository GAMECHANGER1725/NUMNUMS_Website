"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Confetti, fireSideCannons, type ConfettiRef } from "@/components/ui/confetti";
import { clearCart, money, STORES } from "@/lib/cart";

type Status = { paid: boolean; order_nos?: string[]; due_at?: string; store?: string; total?: number };

const POLL_MS = 1500;
const GIVE_UP_AFTER = 12_000;
const FIRED_KEY = "nn_order_celebrated";

export default function OrderPage() {
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
          clearCart();
          // Guarded so a refresh does not re-fire the cannons.
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
          <p className="section-label">Paid</p>
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
