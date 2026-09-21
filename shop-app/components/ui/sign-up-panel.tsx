"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, PartyPopper } from "lucide-react";
import { GoogleButton } from "@/components/ui/google-button";
import { Confetti, fireSideCannons, type ConfettiRef } from "@/components/ui/confetti";
import { VerifyEmail } from "@/components/ui/verify-email";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { type SignUpPrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Australian mobile, however it was typed: 0412 345 678, +61 412 345 678, 61412345678.
const MOBILE_RE = /^(?:\+?61|0)4\d{8}$/;
const normalisePhone = (v: string) => v.replace(/[\s()-]/g, "");

export function SignUpPanel({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [terms, setTerms] = useState(false);
  // "done" splits three ways. A Google sign-in is already verified, so sending
  // that customer off to confirm an email that will never arrive is a dead end;
  // an email sign-up goes through "verify" and comes out the other side already
  // signed in, so it never asks anyone to sign in twice.
  const [status, setStatus] =
    useState<"idle" | "submitting" | "verify" | "done" | "done-google">("idle");
  const [error, setError] = useState<string | null>(null);
  const confettiRef = useRef<ConfettiRef>(null);

  const emailValid = EMAIL_RE.test(email);
  const passwordValid = password.length >= MIN_PASSWORD;
  // Required. The shop texts when a cake is ready and it is the only way to
  // reach somebody about their own order, so a blank one is not an account we
  // can serve. `create-checkout` enforces the same rule server-side.
  const phoneValid = MOBILE_RE.test(normalisePhone(phone));
  const phoneShown = phone.trim() === "" || phoneValid;
  const canSubmit = emailValid && passwordValid && phoneValid && terms && status === "idle";

  useEffect(() => {
    if (status === "done" || status === "done-google") fireSideCannons(confettiRef.current);
  }, [status]);

  function prefs(): SignUpPrefs {
    return {
      phone: normalisePhone(phone),
      // One tick, two channels — but kept as two fields so a later
      // "stop texting me" does not silently also stop the emails.
      marketing_email: marketing,
      marketing_sms: marketing,
      consent_at: new Date().toISOString(),
      consent_source: "sign-up-page",
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
    setStatus("verify");
  }

  return (
    <div
      className={cn(
        "w-full max-w-[26rem] rounded-[1.25rem] bg-card p-7 shadow-[0_20px_50px_-16px_rgba(44,26,14,0.26),0_2px_8px_rgba(44,26,14,0.06)] sm:p-8",
        className,
      )}
    >
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[999] h-full w-full"
      />

      {status === "verify" ? (
        <VerifyEmail email={email} onVerified={() => setStatus("done")} />
      ) : status === "done" || status === "done-google" ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <PartyPopper className="h-9 w-9 text-[#C85478]" />
          <h1 className="font-display text-3xl font-light tracking-tight">You&rsquo;re in</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {/* Verified means signed in — verifyOtp returns a session — so
                this never tells anybody to go and sign in again. */}
            Your 10% code is on its way to{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </p>
          {/* The page has no close button to fall back on, so the success
              screen has to carry the way onward itself. */}
          <a href="/shop" className="btn-cta mt-2 w-full py-2.5">
            Browse cakes
          </a>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className="flex size-[68px] shrink-0 items-center justify-center rounded-full border border-border bg-secondary/60"
              aria-hidden="true"
            >
              <picture>
                <source srcSet="/brand_assets/Logo_TParent_56.webp" type="image/webp" />
                <img
                  src="/brand_assets/Logo_TParent.png"
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              </picture>
            </div>
            <div>
              <h1 className="font-display text-[1.75rem] font-light leading-tight tracking-tight">
                Create your account
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Get 10% off your next order.
              </p>
            </div>
            {/* Cormorant is ornament only: one line, never a heading. */}
            <p className="font-ornament text-[0.95rem] italic text-muted-foreground/80">
              100% eggless. Made fresh daily.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-3.5">
            <div>
              <label htmlFor="su-email" className="field-label">
                Email
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
                Password
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
              <label htmlFor="su-phone" className="field-label">
                Mobile
              </label>
              <input
                id="su-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="0412 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-describedby="su-phone-help"
                aria-invalid={!phoneShown}
                aria-required="true"
                className={cn("field-input", !phoneShown && "border-destructive")}
              />
              <p
                id="su-phone-help"
                className="mt-1 text-[0.72rem] leading-snug text-muted-foreground"
              >
                {phoneShown
                  ? "We'll text you when your cake's ready."
                  : "That doesn't look like an Australian mobile."}
              </p>
            </div>

            {/*
              Unticked, and it stays that way: ACMA prohibits pre-checked
              consent boxes outright, and consent cannot be inferred from a
              purchase or from a phone number handed over for a receipt.
              What lifts opt-in legitimately is first-person affirmative
              phrasing and a named benefit, never a default — "Email and
              text me" reads as an admin setting, "Yes, save me a slice"
              reads as something you want. Trimmed to one line, but the
              channels (email & text) and the benefit (new flavours &
              offers) still have to be named — that's the legal floor.
            */}
            <label className="flex min-h-[32px] cursor-pointer items-start gap-2.5 rounded-lg bg-secondary/60 px-3 py-2.5 text-[0.78rem] leading-snug text-muted-foreground">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#C85478]"
              />
              <span>
                <b className="font-semibold text-foreground">Yes, save me a slice</b> —
                new flavours &amp; offers by email &amp; text. Unsubscribe any time.
              </span>
            </label>

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

          {/* Carries its own "or" divider, so a Google button that never draws
              takes the divider down with it instead of stranding one. */}
          <GoogleButton
            onSignedIn={async () => {
              // No redirect happens in this flow, so consent is written
              // straight onto the user rather than parked for the trip back.
              await supabase.auth.updateUser({ data: prefs() });
              setStatus("done-google");
            }}
            onError={setError}
          />

          <p className="mt-5 text-center text-[0.8rem] text-muted-foreground">
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
  );
}
