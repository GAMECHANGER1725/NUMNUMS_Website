"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthCard, InlineLink } from "@/components/ui/auth-card";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The link in the email carries a recovery code that the client exchanges for
  // a session. Without one there is nothing to update, and saying so beats a
  // form that silently fails on submit.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setReady(Boolean(session)));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) return setError("Not connected yet. Try again shortly.");
    setBusy(true);
    setError(null);
    const { error: e2 } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (e2) return setError(e2.message);
    router.push("/cart");
  }

  return (
    <AuthCard
      title="Choose a new password"
      lede={`At least ${MIN_PASSWORD} characters.`}
      footer={<InlineLink href="/log-in">Back to sign in</InlineLink>}
    >
      {ready === false ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          This reset link has expired or has already been used.{" "}
          <InlineLink href="/forgot-password">Ask for a new one</InlineLink>.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="rp-pw" className="field-label">New password</label>
            <input id="rp-pw" type="password" autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD} characters`} value={password}
              onChange={(e) => setPassword(e.target.value)} className="field-input" />
          </div>
          {error && <p role="alert" className="text-[0.8rem] font-medium text-destructive">{error}</p>}
          <button type="submit" disabled={busy || password.length < MIN_PASSWORD}
            className="btn-cta mt-1 w-full py-2.5">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Saving</> : "Save password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
