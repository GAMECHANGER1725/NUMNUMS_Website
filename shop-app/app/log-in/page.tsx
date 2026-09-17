"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthCard, InlineLink } from "@/components/ui/auth-card";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function LogInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) return setError("Sign-in isn't connected yet. Try again shortly.");
    setBusy(true);
    setError(null);
    const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (e2) return setError(e2.message);
    router.push("/cart");
  }

  return (
    <AuthCard
      title="Welcome back"
      lede="Sign in to use your coupons and check out faster."
      footer={<>New here? <InlineLink href="/sign-up">Create an account</InlineLink></>}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <div>
          <label htmlFor="li-email" className="field-label">Your email</label>
          <input id="li-email" type="email" autoComplete="email" inputMode="email"
            placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} className="field-input" />
        </div>
        <div>
          <label htmlFor="li-pw" className="field-label">Password</label>
          <input id="li-pw" type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className="field-input" />
        </div>
        {error && <p role="alert" className="text-[0.8rem] font-medium text-destructive">{error}</p>}
        <button type="submit" disabled={busy || !email || !password} className="btn-cta mt-1 w-full py-2.5">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in</> : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-[0.82rem] text-muted-foreground">
        <InlineLink href="/forgot-password">Forgot your password?</InlineLink>
      </p>
    </AuthCard>
  );
}
