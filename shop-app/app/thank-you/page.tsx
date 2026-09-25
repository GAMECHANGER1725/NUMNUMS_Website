"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, Phone, Mail, FileText } from "lucide-react";
import { Confetti, fireSideCannons, type ConfettiRef } from "@/components/ui/confetti";
import { CheckoutSteps } from "@/components/ui/checkout-steps";
import { ShopHeader } from "@/components/ui/shop-header";
import { AnimatedTicket } from "@/components/ui/ticket-confirmation-card";
import DownloadButton from "@/components/ui/button-download";
import { clearCart, money, readCart, STORES, SHOP_PHONE, SHOP_EMAIL } from "@/lib/cart";
import { COLLECTION, flavourSlug, listPriceCents, slotLabel } from "@/lib/catalog";
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
  /** Paid according to Stripe, but the webhook has not written the order yet. */
  pending?: boolean;
  card?: { brand: string; last4: string | null; wallet: string | null } | null;
};

/** "Visa •••• 4242 via Apple Pay" — what Stripe said, in the words on the card. */
function cardLabel(c: NonNullable<Status["card"]>) {
  const brand = c.brand === "amex" ? "Amex" : c.brand.charAt(0).toUpperCase() + c.brand.slice(1);
  const wallet = c.wallet === "apple_pay" ? " via Apple Pay" : c.wallet === "google_pay" ? " via Google Pay" : "";
  return c.last4 ? `${brand} •••• ${c.last4}${wallet}` : brand;
}

/** The receipt function, straight — not through /api, so it needs no redirect rule. */
const receiptHref = (s: string, no: string, download = false) =>
  `/.netlify/functions/receipt?s=${encodeURIComponent(s)}&o=${encodeURIComponent(no)}${download ? "&download=1" : ""}`;

const POLL_MS = 1500;
const GIVE_UP_AFTER = 12_000;
// Once Stripe says paid, the page is confirmed; only the order number is
// outstanding. Ask for it more slowly, for longer, then stop asking.
const NUMBER_POLL_MS = 3000;
const NUMBER_WAIT = 3 * 60_000;
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
  const [session, setSession] = useState("");
  const confettiRef = useRef<ConfettiRef>(null);

  useEffect(() => {
    // Read the session from the URL directly rather than via useSearchParams,
    // which would need a Suspense boundary under `output: "export"`.
    const s = new URLSearchParams(window.location.search).get("s");
    let stop = false;
    const started = Date.now();

    // Captured on the first paid answer: the cart is cleared then, but
    // `purchase` must wait for real order numbers to use as the transaction id.
    let bought: { size: string; flavour: string; qty: number; cents: number }[] | null = null;

    async function poll() {
      if (stop) return;
      if (!s) return setSlow(true);
      try {
        const res = await fetch(`/api/order-status?s=${encodeURIComponent(s!)}`);
        const body: Status = await res.json();
        if (body.paid) {
          setSession(s!);
          setStatus(body);
          if (!bought) {
            // Read the cart BEFORE clearing it: it is the last place the list
            // prices live, and analytics wants them per line.
            bought = readCart().lines.map((l) => ({
              size: l.size,
              flavour: l.flavour,
              qty: l.qty ?? 1,
              cents: listPriceCents(l.size, l.flavour) ?? 0,
            }));
            clearCart();
            if (sessionStorage.getItem(FIRED_KEY) !== s) {
              try { sessionStorage.setItem(FIRED_KEY, s!); } catch { /* private mode */ }
              fireSideCannons(confettiRef.current);
            }
          }
          if (body.pending) {
            // Paid, and said so. Only the order number is still to come.
            if (Date.now() - started < NUMBER_WAIT) setTimeout(poll, NUMBER_POLL_MS);
            return;
          }
          // The same guard the cannons use, and for a stronger reason: a
          // refresh that re-fires `purchase` books the same revenue twice.
          // Only once the order exists, so the transaction id is the real
          // order number and not a placeholder GA4 would then keep.
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

            <AnimatedTicket
              className="mx-auto mt-8 max-w-md"
              orderNos={orders}
              amountCents={deposit}
              title={status.name ? `Thanks, ${status.name}!` : "Thank you!"}
              subtitle="Your cake is booked."
              card={status.card ? { label: cardLabel(status.card) } : null}
            >
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[#C85478]">Collect on</p>
                {status.due_at && (
                  <p className="font-medium">
                    {sydney(status.due_at, { weekday: "long", day: "numeric", month: "long" })}
                    <span className="text-[#5C3A22]"> · from {sydney(status.due_at, { hour: "numeric", minute: "2-digit" }).toLowerCase()}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#C85478]" aria-hidden />
                <div className="min-w-0 text-[0.88rem] leading-relaxed">
                  <p className="font-medium">Num Num&rsquo;s {store?.label ?? status.store}</p>
                  {store && <p className="text-[#5C3A22]">{store.address}, {store.locality}</p>}
                  {hours && <p className="text-[0.8rem] text-[#5C3A22]/80">Collection {slotLabel(hours.open)} – {slotLabel(hours.close)}</p>}
                  {store && (
                    <a href={store.maps} target="_blank" rel="noopener"
                      className="inline-flex min-h-[32px] items-center font-medium text-[#C85478] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]">
                      Open in Google Maps &rarr;
                    </a>
                  )}
                </div>
              </div>
            </AnimatedTicket>

            <p className="mx-auto mt-6 max-w-md text-center text-[0.9rem] leading-relaxed text-[#5C3A22]">
              We&rsquo;ll bake it fresh and text you the moment it&rsquo;s ready.
            </p>
            {status.pending && (
              <p role="status" className="mx-auto mt-2 flex max-w-md items-center justify-center gap-2 text-center text-[0.82rem] text-[#5C3A22]/80">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C85478] motion-reduce:animate-none" aria-hidden />
                Your order number and receipt will appear here in a moment.
              </p>
            )}

            <section aria-labelledby="cakes-h" className="mt-10">
              <h2 id="cakes-h" className="section-label">{status.cakes?.length === 1 ? "Your cake" : "Your cakes"}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {status.cakes?.map((c, i) => (
                  <li key={i} className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgba(74,37,24,0.05),0_6px_20px_-10px_rgba(74,37,24,0.12)]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimiser */}
                    <img src={`/shop/cakes/${flavourSlug(c.flavour)}.webp`} alt={`${c.flavour} cake`}
                      width={80} height={80} loading="lazy"
                      className="h-20 w-20 shrink-0 rounded-xl bg-[#FFF8F2] object-cover" />
                    <div className="min-w-0">
                      <p className="text-[0.98rem] text-[#2C1A0E]">{c.size} {c.flavour}</p>
                      {c.wording && <p className="text-[0.84rem] text-[#5C3A22]">Writing: &ldquo;{c.wording}&rdquo;</p>}
                      <p className="text-[0.76rem] text-[#5C3A22]/80">100% eggless</p>
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 flex flex-col gap-1.5 rounded-2xl bg-white p-4 text-[0.9rem] shadow-[0_1px_2px_rgba(74,37,24,0.05)]">
                <div className="flex justify-between text-[#5C3A22]"><dt>Order total</dt><dd className="tabular-nums">{money(total)}</dd></div>
                <div className="flex justify-between text-[#5C3A22]"><dt>Deposit paid</dt><dd className="tabular-nums">&minus;{money(deposit)}</dd></div>
                <div className="mt-1 flex items-baseline justify-between border-t border-[#F5EBE0] pt-2">
                  <dt className="font-medium text-[#2C1A0E]">Pay at collection</dt>
                  <dd className="font-display text-[1.7rem] tabular-nums text-[#C85478]">{money(balance)}</dd>
                </div>
              </dl>
            </section>

            {session && orders.length > 0 && (
              <section aria-labelledby="receipt-h" className="mt-10">
                <h2 id="receipt-h" className="section-label">Your receipt</h2>
                <p className="mt-2 text-[0.86rem] leading-relaxed text-[#5C3A22]">
                  A tax invoice for {orders.length === 1 ? "your order" : "each cake"}, showing the deposit paid and the balance due.
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {orders.map((no) => (
                    <li key={no} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(74,37,24,0.05)]">
                      <FileText className="h-5 w-5 shrink-0 text-[#C85478]" aria-hidden />
                      <p className="mr-auto font-medium text-[#2C1A0E]">Tax invoice {no}</p>
                      <div className="flex w-full gap-2 sm:w-auto">
                      <a href={receiptHref(session, no)} target="_blank" rel="noopener"
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full sm:flex-none border border-[#EBD3DA] px-5 text-[0.88rem] font-medium text-[#C85478] transition-colors hover:bg-[#FDF3F6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478] active:scale-[0.97]">
                        View
                      </a>
                      <DownloadButton href={receiptHref(session, no, true)} className="min-w-0 flex-1 sm:flex-none sm:min-w-40" />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="bring-h" className="mt-10">
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
