"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, PartyPopper, X } from "lucide-react";
import { GoogleButton } from "@/components/ui/google-button";
import { CouponCard } from "@/components/ui/coupon-card";
import { Confetti, fireSideCannons, type ConfettiRef } from "@/components/ui/confetti";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { type SignUpPrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Australian mobile, however it was typed: 0412 345 678, +61 412 345 678, 61412345678.
const MOBILE_RE = /^(?:\+?61|0)4\d{8}$/;
const normalisePhone = (v: string) => v.replace(/[\s()-]/g, "");

export type SignUpPanelProps = {
  /** "dialog" shows the close button and tightens the padding. */
  variant?: "dialog" | "page";
  onClose?: () => void;
  className?: string;
};

export function SignUpPanel({ variant = "page", onClose, className }: SignUpPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [terms, setTerms] = useState(false);
  // "done" splits: a Google sign-in is already verified, so sending that
  // customer off to confirm an email that will never arrive is a dead end.
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "done-google">("idle");
  const [error, setError] = useState<string | null>(null);
  const confettiRef = useRef<ConfettiRef>(null);

  const emailValid = EMAIL_RE.test(email);
  const passwordValid = password.length >= MIN_PASSWORD;
  // Optional, so blank passes; typed-but-wrong does not.
  const phoneValid = phone.trim() === "" || MOBILE_RE.test(normalisePhone(phone));
  const canSubmit = emailValid && passwordValid && phoneValid && terms && status === "idle";

  useEffect(() => {
    if (status === "done" || status === "done-google") fireSideCannons(confettiRef.current);
  }, [status]);

  function prefs(): SignUpPrefs {
    return {
      phone: phone.trim() ? normalisePhone(phone) : "",
      // One tick, two channels — but kept as two fields so a later
      // "stop texting me" does not silently also stop the emails.
      marketing_email: marketing,
      marketing_sms: marketing,
      consent_at: new Date().toISOString(),
      consent_source: variant === "dialog" ? "promo-dialog" : "sign-up-page",
      terms_accepted_at: new Date().toISOString(),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setStatus("submitting");

    if (!supabaseConfigured) {
      setError("Sign-up isn't connected yet. Try again shortly.");
      setStatus("idle");
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      // Consent is captured here and is the record of what was agreed and when.
      options: { data: prefs() },
    });

    if (signUpError) {
      setError(signUpError.message);
      setStatus("idle");
      return;
    }
    setStatus("done");
  }

  return (
    <div
      className={cn(
        "relative w-full max-w-[940px] overflow-hidden rounded-[1.5rem] bg-card shadow-[0_24px_60px_-12px_rgba(44,26,14,0.30),0_4px_12px_rgba(44,26,14,0.08)]",
        className,
      )}
    >
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[999] h-full w-full"
      />

      {variant === "dialog" && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:text-white/70"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="grid md:grid-cols-[1.02fr_1fr]">
        {/* Left — the offer */}
        <div className="panel-dark flex flex-col justify-center gap-5 px-6 py-8 md:px-9 md:py-11">
          <div className="relative z-10">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#E8A4B5]">
              Members save
            </span>
            <h2 className="font-display mt-2 max-w-[15ch] text-balance text-[2rem] font-light leading-[1.06] tracking-tight text-white md:text-[2.6rem]">
              Get 10% off your next order
            </h2>
            <p className="mt-2 max-w-[34ch] text-sm font-light leading-relaxed text-white/70">
              Create an account and we&rsquo;ll email you a code to use on your
              next cake.
            </p>
          </div>

          <CouponCard className="relative z-10 max-w-[344px]" />

          <p className="relative z-10 text-[0.72rem] font-light text-white/55">
            100% eggless · Collect from Harris Park or Riverstone
          </p>
        </div>

        {/* Right — the form */}
        <div className="flex flex-col justify-center px-6 py-8 md:px-9 md:py-11">
          {status === "done" || status === "done-google" ? (
            <div className="flex flex-col items-start gap-3 py-6">
              <PartyPopper className="h-9 w-9 text-[#C85478]" />
              <h3 className="font-display text-3xl font-light tracking-tight">
                {status === "done-google" ? "You\u2019re in" : "Account created"}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {status === "done-google" ? (
                  <>Your 10% code is on its way to your inbox.</>
                ) : (
                  <>
                    Check <span className="font-medium text-foreground">{email}</span> to
                    confirm your address. Your 10% code lands in the same inbox.
                  </>
                )}
              </p>
              {onClose && (
                <button type="button" onClick={onClose} className="btn-cta mt-3">
                  Start browsing cakes
                </button>
              )}
            </div>
          ) : (
            <>
              <h3 className="font-display text-3xl font-light tracking-tight md:text-[2.1rem]">
                Create your account
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Order online and collect in store.
              </p>

              <GoogleButton
                onSignedIn={async () => {
                  // No redirect happens in this flow, so consent is written
                  // straight onto the user rather than parked for the trip back.
                  await supabase.auth.updateUser({ data: prefs() });
                  setStatus("done-google");
                }}
                onError={setError}
              />

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
                <div>
                  <label htmlFor="su-email" className="field-label">
                    Your email
                  </label>
                  <input
                    id="su-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                  />
                </div>

                <div>
                  <label htmlFor="su-password" className="field-label">
                    Create a password
                  </label>
                  <div className="relative">
                    <input
                      id="su-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={`At least ${MIN_PASSWORD} characters`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field-input pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="su-phone" className="field-label mb-0">
                      Mobile
                    </label>
                    <span className="rounded-full bg-[#F8EEE6] px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[#C85478]">
                      Recommended
                    </span>
                  </div>
                  <input
                    id="su-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="0412 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    aria-describedby="su-phone-help"
                    aria-invalid={!phoneValid}
                    className={cn("field-input mt-1.5", !phoneValid && "border-destructive")}
                  />
                  <p id="su-phone-help" className="mt-1 text-[0.72rem] leading-snug text-muted-foreground">
                    {phoneValid
                      ? "We text you the moment your cake is ready to collect — no ringing the shop."
                      : "That doesn't look like an Australian mobile. Leave it blank if you'd rather not."}
                  </p>
                </div>

                {/*
                  Unticked, and it stays that way: ACMA prohibits pre-checked
                  consent boxes outright, and consent cannot be inferred from a
                  purchase or from a phone number handed over for a receipt.
                  What lifts opt-in legitimately is first-person affirmative
                  phrasing and a named benefit, never a default — "Email and
                  text me" reads as an admin setting, "Yes, keep me in the loop"
                  reads as something you want.
                */}
                <div className="mt-1 rounded-xl border border-border bg-secondary/70 p-3.5">
                  <p className="text-[0.84rem] font-semibold leading-snug text-foreground">
                    Don&rsquo;t miss the good stuff
                  </p>
                  <p className="mt-1 text-[0.76rem] leading-snug text-muted-foreground">
                    Festival pre-orders fill fast — Diwali, Christmas, Eid. Ours go
                    out before the shop floor knows.
                  </p>
                  <label className="mt-3 flex min-h-[32px] cursor-pointer items-start gap-2.5 py-1 text-[0.78rem] leading-snug text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#C85478]"
                    />
                    <span>
                      <b className="font-semibold text-foreground">Yes, keep me in the loop</b> —
                      first pick of new flavours, seasonal specials and festival pre-orders.
                    </span>
                  </label>
                  <p className="mt-3 text-[0.7rem] leading-snug text-muted-foreground/80">
                    By email and text. Unsubscribe any time.
                  </p>
                </div>

                <label className="flex min-h-[32px] cursor-pointer items-start gap-2.5 py-1 text-[0.78rem] leading-snug text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#C85478]"
                  />
                  <span>
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener"
                      className="font-semibold text-[#C85478] underline-offset-2 hover:underline"
                    >
                      Terms &amp; Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener"
                      className="font-semibold text-[#C85478] underline-offset-2 hover:underline"
                    >
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>

                {error && (
                  <p role="alert" className="text-[0.8rem] font-medium text-destructive">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={!canSubmit} className="btn-cta mt-1 w-full py-2.5">
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-[0.8rem] text-muted-foreground">
                Already have an account?{" "}
                <a
                  href="/shop/log-in"
                  className="-m-2 inline-flex min-h-[32px] items-center p-2 font-semibold text-[#C85478] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
                >
                  Log in
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
