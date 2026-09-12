"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, PartyPopper, X } from "lucide-react";
import { CouponCard } from "@/components/ui/coupon-card";
import { Confetti, fireSideCannons, type ConfettiRef } from "@/components/ui/confetti";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-[18px] w-[18px]" aria-hidden>
      <g transform="translate(3, 2)" fillRule="nonzero">
        <path fill="#4285F4" d="M57.81,30.15c0-2.43-.2-4.19-.62-6.03H29.5v10.95h16.26c-.33,2.72-2.1,6.82-6.03,9.57l-.06.37,8.76,6.78.6.06c5.57-5.15,8.78-12.72,8.78-21.7" />
        <path fill="#34A853" d="M29.5,58.99c7.96,0,14.65-2.62,19.53-7.14l-9.31-7.21c-2.49,1.74-5.83,2.95-10.22,2.95-7.8,0-14.42-5.15-16.78-12.26l-.35.03-9.1,7.05-.12.33c4.85,9.64,14.81,16.26,26.35,16.26" />
        <path fill="#FBBC05" d="M12.72,35.33c-.62-1.84-.98-3.8-.98-5.83s.36-4,.95-5.84l-.02-.39L3.45,16.11l-.3.14C1.15,20.25,0,24.74,0,29.5s1.15,9.24,3.15,13.24l9.57-7.41" />
        <path fill="#EB4335" d="M29.5,11.41c5.54,0,9.27,2.39,11.4,4.39l8.32-8.13C44.11,2.92,37.46,0,29.5,0,17.96,0,8,6.62,3.15,16.26l9.54,7.41c2.39-7.11,9.01-12.26,16.81-12.26" />
      </g>
    </svg>
  );
}

export type SignUpPanelProps = {
  /** "dialog" shows the close button and tightens the padding. */
  variant?: "dialog" | "page";
  onClose?: () => void;
  className?: string;
};

export function SignUpPanel({ variant = "page", onClose, className }: SignUpPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const confettiRef = useRef<ConfettiRef>(null);

  const emailValid = EMAIL_RE.test(email);
  const passwordValid = password.length >= MIN_PASSWORD;
  const canSubmit = emailValid && passwordValid && status === "idle";

  useEffect(() => {
    if (status === "done") fireSideCannons(confettiRef.current);
  }, [status]);

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
      options: {
        // Consent is captured here and is the record of what was agreed and when.
        data: {
          marketing_email: emailOptIn,
          marketing_sms: smsOptIn,
          consent_at: new Date().toISOString(),
          consent_source: variant === "dialog" ? "promo-dialog" : "sign-up-page",
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setStatus("idle");
      return;
    }
    setStatus("done");
  }

  async function handleGoogle() {
    setError(null);
    if (!supabaseConfigured) {
      setError("Sign-up isn't connected yet. Try again shortly.");
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/shop/sign-up` },
    });
    if (oauthError) setError(oauthError.message);
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
          {status === "done" ? (
            <div className="flex flex-col items-start gap-3 py-6">
              <PartyPopper className="h-9 w-9 text-[#C85478]" />
              <h3 className="font-display text-3xl font-light tracking-tight">
                Account created
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Check <span className="font-medium text-foreground">{email}</span> to
                confirm your address. Your 10% code lands in the same inbox.
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

              <button
                type="button"
                onClick={handleGoogle}
                className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

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

                {/* Separate, unticked, and not bundled — Spam Act 2003. */}
                <fieldset className="mt-1 flex flex-col gap-2">
                  <legend className="sr-only">Marketing preferences</legend>
                  <label className="flex cursor-pointer items-start gap-2.5 text-[0.8rem] leading-snug text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={emailOptIn}
                      onChange={(e) => setEmailOptIn(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#C85478]"
                    />
                    Email me cake offers and seasonal specials
                  </label>
                  <label className="flex cursor-pointer items-start gap-2.5 text-[0.8rem] leading-snug text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={smsOptIn}
                      onChange={(e) => setSmsOptIn(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#C85478]"
                    />
                    Text me cake offers and seasonal specials
                  </label>
                </fieldset>

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
