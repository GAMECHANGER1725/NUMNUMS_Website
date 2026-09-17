"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CODE_LEN = 8;
const RESEND_SECONDS = 45;

/**
 * The eight digits from the confirmation email, and then straight in.
 *
 * A code, not a link, for one reason: a link opens a **different tab**, so the
 * tab the customer filled the form in never learns they confirmed and sits
 * there saying "check your email" forever. They come back, find it unchanged,
 * and sign in again — which is the second sign-in this exists to remove.
 * `verifyOtp` returns a session, so entering the code *is* signing in.
 *
 * ⚠️ This needs the Supabase **Confirm signup** email template to contain
 * `{{ .Token }}`. The default template only has `{{ .ConfirmationURL }}`, and
 * with that template the email carries a link and no code — the box below is
 * then unanswerable. There is no way to detect that from here; if customers
 * report "there's no code in the email", that is the cause.
 */
export function VerifyEmail({
  email, onVerified,
}: {
  email: string;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function verify(token: string) {
    setBusy(true);
    setError(null);
    // `type: 'signup'` is the confirmation OTP, not a magic-link login. On
    // success supabase-js stores the session, so the customer is signed in.
    const { error: err } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    setBusy(false);
    if (err) {
      setError(
        /expired/i.test(err.message)
          ? "That code has expired. Send a new one below."
          : "That code doesn't match. Check the email and try again.",
      );
      setCode("");
      inputRef.current?.focus();
      return;
    }
    onVerified();
  }

  async function resend() {
    setError(null);
    setSent(null);
    const { error: err } = await supabase.auth.resend({ type: "signup", email });
    if (err) { setError(err.message); return; }
    setSent("Sent. It can take a minute to arrive.");
    setCooldown(RESEND_SECONDS);
  }

  return (
    <div className="flex flex-col items-start gap-3 py-2">
      <MailCheck className="h-9 w-9 text-[#C85478]" />
      <h3 className="font-display text-3xl font-light tracking-tight">Verify your email</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Enter the {CODE_LEN}-digit code we sent to{" "}
        <span className="font-medium text-foreground">{email}</span>. If it isn&rsquo;t
        in your inbox, check your spam folder.
      </p>

      <form
        className="mt-1 w-full"
        onSubmit={(e) => { e.preventDefault(); if (code.length === CODE_LEN && !busy) verify(code); }}
      >
        <label htmlFor="vf-code" className="field-label">Verification code</label>
        <input
          ref={inputRef}
          id="vf-code"
          // A one-time code, so the OS keyboard shows digits and the browser
          // and iOS offer to fill it straight from the message.
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LEN}
          placeholder="000000"
          value={code}
          aria-invalid={error != null}
          aria-describedby={error ? "vf-error" : undefined}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, CODE_LEN);
            setCode(next);
            setError(null);
            // Six digits is the whole answer — asking them to press a button
            // after the last one is a step that carries no information.
            if (next.length === CODE_LEN) verify(next);
          }}
          className={
            "field-input text-center font-mono text-[1.4rem] tracking-[0.4em]" +
            (error ? " border-destructive ring-2 ring-destructive/25" : "")
          }
        />
        {error && (
          <p id="vf-error" role="alert" className="mt-1.5 text-[0.78rem] font-medium text-destructive">
            {error}
          </p>
        )}

        <button type="submit" disabled={code.length !== CODE_LEN || busy} className="btn-cta mt-3 w-full py-3">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying</> : "Verify email"}
        </button>
      </form>

      <div className="w-full text-center">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="text-[0.82rem] font-semibold text-[#C85478] underline-offset-2 hover:underline disabled:text-muted-foreground disabled:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend the code"}
        </button>
        {sent && <p className="mt-1 text-[0.74rem] text-muted-foreground">{sent}</p>}
      </div>
    </div>
  );
}
