"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Ticket, X } from "lucide-react";
import { listMyCoupons, lookUpCoupon, type Coupon } from "@/lib/coupons";
import { cn } from "@/lib/utils";

function expiryText(c: Coupon) {
  if (!c.expires_at) return "No expiry";
  const days = Math.ceil((new Date(c.expires_at).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Expired";
  if (days === 1) return "Last day";
  return `${days} days left`;
}

export type CouponFieldProps = {
  applied: Coupon | null;
  onApply: (c: Coupon | null) => void;
  className?: string;
};

/**
 * Checkout's coupon box: the customer's own codes listed so they never have to
 * go and find one in an email, plus a field for a code they were given.
 *
 * The discount this quotes is indicative. `create-checkout` re-validates and
 * re-prices every line server-side, so a tampered code changes nothing that is
 * charged.
 */
export function CouponField({ applied, onApply, className }: CouponFieldProps) {
  const [mine, setMine] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let live = true;
    listMyCoupons().then((cs) => {
      if (live) setMine(cs);
    });
    return () => {
      live = false;
    };
  }, []);

  async function apply(raw: string) {
    setChecking(true);
    setProblem(null);
    const { coupon, problem: why } = await lookUpCoupon(raw);
    setChecking(false);
    if (why || !coupon) {
      setProblem(why ?? "We don't recognise that code.");
      return;
    }
    setCode("");
    onApply(coupon);
  }

  if (applied) {
    return (
      <div className={cn("rounded-xl border border-[#C85478] bg-[#FDF3F6] p-3.5", className)}>
        <div className="flex items-center gap-2.5">
          <Check className="h-4 w-4 shrink-0 text-[#C85478]" />
          <p className="flex-1 text-[0.84rem] leading-snug">
            <b className="font-semibold">{applied.percent}% off</b> applied —{" "}
            <code className="font-mono tracking-wider">{applied.code}</code>
          </p>
          <button
            type="button"
            onClick={() => onApply(null)}
            aria-label={`Remove coupon ${applied.code}`}
            className="-m-2 inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-secondary/60 p-3.5", className)}>
      <p className="flex items-center gap-2 text-[0.84rem] font-semibold">
        <Ticket className="h-4 w-4 text-[#C85478]" />
        Coupons
      </p>

      {mine.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-2">
          {mine.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => apply(c.code)}
                disabled={checking}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-[#C85478] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478] disabled:opacity-60"
              >
                <span className="font-display text-[1.35rem] font-light leading-none tabular-nums text-[#C85478]">
                  {c.percent}%
                </span>
                <span className="flex-1">
                  <span className="block font-mono text-[0.78rem] font-semibold tracking-wider">
                    {c.code}
                  </span>
                  <span className="block text-[0.72rem] text-muted-foreground">{expiryText(c)}</span>
                </span>
                <span className="text-[0.78rem] font-semibold text-[#C85478]">Use</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!checking) apply(code);
        }}
        className="mt-2.5 flex gap-2"
      >
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setProblem(null); // clear the red the moment they start fixing it
          }}
          placeholder={mine.length ? "Or enter another code" : "Enter a coupon code"}
          autoComplete="off"
          autoCapitalize="characters"
          aria-label="Coupon code"
          aria-invalid={problem != null}
          aria-describedby={problem ? "coupon-problem" : undefined}
          className={cn(
            "field-input flex-1 font-mono uppercase tracking-wider",
            problem && "border-destructive ring-2 ring-destructive/25",
          )}
        />
        <button
          type="submit"
          disabled={checking || !code.trim()}
          className="shrink-0 rounded-full border border-border bg-card px-4 text-[0.82rem] font-semibold transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </button>
      </form>

      {problem && (
        <p id="coupon-problem" role="alert" className="mt-2 text-[0.76rem] font-medium text-destructive">
          {problem}
        </p>
      )}
    </div>
  );
}
