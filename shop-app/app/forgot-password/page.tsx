"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { AuthCard, InlineLink } from "@/components/ui/auth-card";
import { supabase, supabaseConfigured } from "@/lib/supabase";

/**
 * Mandatory the moment we chose passwords: without it the first customer who
 * forgets one is a support call with no resolution.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) return setError("Not connected yet. Try again shortly.");
    setBusy(true);
    setError(null);
    const { error: e2 } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/shop/reset-password`,
    });
    setBusy(false);
    if (e2) return setError(e2.message);
    // Shown whether or not the address exists: saying "no such account" turns
    // this form into a way to test which emails are customers.
    setSent(true);
  }

  return (
    <AuthCard
      title="Reset your password"
      lede="We'll email you a link to set a new one."
      footer={<InlineLink href="/log-in">Back to sign in</InlineLink>}
    >
      {sent ? (
        <div className="flex flex-col items-start gap-3">
          <MailCheck className="h-8 w-8 text-[#C85478]" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            If <span className="font-medium text-foreground">{email}</span> has an account,
            a reset link is on its way. It expires in an hour.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="fp-email" className="field-label">Your email</label>
            <input id="fp-email" type="email" autoComplete="email" inputMode="email"
              placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} className="field-input" />
          </div>
          {error && <p role="alert" className="text-[0.8rem] font-medium text-destructive">{error}</p>}
          <button type="submit" disabled={busy || !email.includes("@")} className="btn-cta mt-1 w-full py-2.5">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Sending</> : "Email me a link"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
