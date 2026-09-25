"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, Phone, Mail } from "lucide-react";
import { Confetti, fireSideCannons, type ConfettiRef } from "@/components/ui/confetti";
import { CheckoutSteps } from "@/components/ui/checkout-steps";
import { ShopHeader } from "@/components/ui/shop-header";
import { clearCart, money, readCart, STORES, SHOP_PHONE, SHOP_EMAIL } from "@/lib/cart";
import { COLLECTION, listPriceCents, slotLabel } from "@/lib/catalog";
import { purchase } from "@/lib/analytics";

type Cake = { size: string; flavour: string; wording: string | null };
type Status = {
  paid: boolean;
  order_nos?: string[];
  due_at?: string;
  store?: string;
  name?: string | null;
  cakes?: Cake[];
  total?: number;
  deposit?: number;
};

const POLL_MS = 1500;
const GIVE_UP_AFTER = 12_000;
const FIRED_KEY = "nn_order_celebrated";
// Revenue needs a LONGER-lived guard than the confetti. sessionStorage is
// per-tab: reopening the thank-you link in a new tab or a week later is a
// fresh session, and GA4 does not reliably dedupe a repeated
// transaction_id — so the same order would be banked twice. Re-firing the
// cannons in that situation is harmless; re-firing `purchase` is not.
const BANKED_KEY = "nn_order_banked_v1";

const cents = (dollars?: number) => Math.round((dollars ?? 0) * 100);
const sydney = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Sydney", ...opts });

/** How to reach us — said on every state of this page, including the ones where something is slow. */
function Contact() {
  return (
    <section aria-labelledby="help-h" className="mt-8 rounded-2xl bg-[#F5EBE0] p-5">
      <h2 id="help-h" className="text-[0.95rem] font-medium text-[#2C1A0E]">Need to change something?</h2>
      <p className="mt-1 text-[0.84rem] leading-relaxed text-[#5C3A22]">
        Call or email us with your order number. Cancel more than 24 hours before
        collection and your deposit is refunded in full.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a href={`tel:${SHOP_PHONE.tel}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-[0.88rem] font-medium text-[#2C1A0E] shadow-[0_1px_2px_rgba(74,37,24,0.06),0_4px_14px_rgba(74,37,24,0.06)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478] active:scale-[0.98]">
          <Phone className="h-4 w-4 text-[#C85478]" aria-hidden />{SHOP_PHONE.display}
        </a>
        <a href={`mailto:${SHOP_EMAIL}`}
          className="inline-flex min-h-[44px] min-w-0 items-center gap-2 rounded-full bg-white px-4 text-[0.88rem] font-medium text-[#2C1A0E] shadow-[0_1px_2px_rgba(74,37,24,0.06),0_4px_14px_rgba(74,37,24,0.06)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478] active:scale-[0.98]">
          <Mail className="h-4 w-4 shrink-0 text-[#C85478]" aria-hidden /><span className="truncate">{SHOP_EMAIL}</span>
        </a>
      </div>
    </section>
  );
}

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
          // Read the cart BEFORE clearing it: it is the last place the list
          // prices live, and analytics wants them per line.
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
            purchase(body.order_nos?.join(", ") ?? s!, bought, cents(body.total));
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
  const hours = status?.store ? COLLECTION[status.store as keyof typeof COLLECTION] : undefined;
  const total = cents(status?.total);
  const deposit = cents(status?.deposit);
  const balance = total - deposit;
  const orders = status?.order_nos ?? [];

  return (
    <>
      <ShopHeader />
      <main className="mx-auto w-full max-w-[40rem] px-4 pb-20 pt-10">
        <Confetti ref={confettiRef} manualstart className="pointer-events-none fixed inset-0 z-[999] h-full w-full" />

        {status?.paid ? (
          <>
            <CheckoutSteps current={3} />
            <p className="section-label mt-8">Order confirmed</p>
            <h1 className="font-display mt-2 text-[2.4rem] leading-[1.1] text-[#2C1A0E] sm:text-5xl">
              {status.name ? `Thanks, ${status.name}.` : "Thank you."}{" "}
              <span className="text-[#C85478]">Your cake is booked.</span>
            </h1>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-[#5C3A22]">
              We&rsquo;ll bake it fresh and text you the moment it&rsquo;s ready.
              Your payment receipt is on its way to your email.
            </p>

            {/* The collection ticket: what you show at the counter. Where and
                when sit above the tear, because that is what gets read on the
                day; what was bought and what is owed sit below it. */}
            <article aria-label="Collection ticket"
              className="mt-8 overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(74,37,24,0.05),0_12px_40px_-12px_rgba(200,84,120,0.25)]">
              <div className="px-6 pb-6 pt-6 sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#C85478]">Collect on</p>
                    {status.due_at && (
                      <>
                        <p className="font-display mt-1 text-[1.9rem] leading-tight text-[#2C1A0E]">
                          {sydney(status.due_at, { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        <p className="text-[1.05rem] text-[#5C3A22]">
                          from {sydney(status.due_at, { hour: "numeric", minute: "2-digit" }).toLowerCase()}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#5C3A22]/70">
                      {orders.length === 1 ? "Order" : "Orders"}
                    </p>
                    {orders.map((n) => (
                      <p key={n} className="font-mono text-[1.05rem] font-medium tabular-nums text-[#2C1A0E]">{n}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3 rounded-2xl bg-[#FFF8F2] p-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#C85478]" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-medium text-[#2C1A0E]">Num Num&rsquo;s {store?.label ?? status.store}</p>
                    {store && (
                      <p className="text-[0.86rem] leading-relaxed text-[#5C3A22]">
                        {store.address}, {store.locality}
                      </p>
                    )}
                    {hours && (
                      <p className="text-[0.8rem] text-[#5C3A22]/80">
                        Open for collection {slotLabel(hours.open)} – {slotLabel(hours.close)}
                      </p>
                    )}
                    {store && (
                      <a href={store.maps} target="_blank" rel="noopener"
                        className="mt-1.5 inline-flex min-h-[32px] items-center text-[0.84rem] font-medium text-[#C85478] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]">
                        Open in Google Maps &rarr;
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* The tear. Two notches cut from the page colour, joined by a
                  dashed rule — the one decorative thing on the page. */}
              <div aria-hidden className="relative h-6">
                <span className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-background" />
                <span className="absolute -right-3 top-0 h-6 w-6 rounded-full bg-background" />
                <span className="absolute left-5 right-5 top-1/2 border-t-2 border-dashed border-[#EBD3DA]" />
              </div>

              <div className="px-6 pb-6 pt-4 sm:px-8">
                <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#5C3A22]/70">
                  {status.cakes?.length === 1 ? "Your cake" : `Your cakes (${status.cakes?.length ?? 0})`}
                </h2>
                <ul className="mt-2 flex flex-col divide-y divide-[#F5EBE0]">
                  {status.cakes?.map((c, i) => (
                    <li key={i} className="py-2.5">
                      <p className="text-[0.95rem] text-[#2C1A0E]">{c.size} {c.flavour}</p>
                      {c.wording && (
                        <p className="text-[0.84rem] text-[#5C3A22]">Writing: &ldquo;{c.wording}&rdquo;</p>
                      )}
                    </li>
                  ))}
                </ul>

                <dl className="mt-3 flex flex-col gap-1.5 border-t border-[#F5EBE0] pt-3 text-[0.9rem]">
                  <div className="flex justify-between text-[#5C3A22]">
                    <dt>Order total</dt><dd className="tabular-nums">{money(total)}</dd>
                  </div>
                  <div className="flex justify-between text-[#5C3A22]">
                    <dt>Deposit paid</dt><dd className="tabular-nums">&minus;{money(deposit)}</dd>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <dt className="font-medium text-[#2C1A0E]">Pay at collection</dt>
                    <dd className="font-display text-[1.7rem] tabular-nums text-[#C85478]">{money(balance)}</dd>
                  </div>
                </dl>
              </div>
            </article>

            <section aria-labelledby="bring-h" className="mt-8">
              <h2 id="bring-h" className="text-[0.95rem] font-medium text-[#2C1A0E]">When you come in</h2>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[0.9rem] leading-relaxed text-[#5C3A22] marker:text-[#C85478]">
                <li>Give your name or order number at the counter.</li>
                <li>Pay the {money(balance)} balance when you collect.</li>
              </ul>
            </section>

            <Contact />

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/" className="btn-cta py-3">Order another cake</Link>
              {/* The main site's home, outside this app's /shop basePath — a
                  <Link> would resolve to /shop. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="text-[0.88rem] font-medium text-[#C85478] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]">
                Back to Num Num&rsquo;s
              </a>
            </div>
          </>
        ) : slow ? (
          <>
            <p className="section-label">Payment received</p>
            <h1 className="font-display mt-2 text-4xl text-[#2C1A0E]">Your payment went through</h1>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-[#5C3A22]">
              We&rsquo;re still writing up your order, which occasionally takes a minute.
              Nothing is lost: your email receipt is your confirmation. Refresh this
              page shortly to see your collection details, or contact us and we&rsquo;ll
              find it.
            </p>
            <Contact />
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#C85478]" />
            <p className="text-sm text-[#5C3A22]">Confirming your payment…</p>
          </div>
        )}
      </main>
    </>
  );
}
