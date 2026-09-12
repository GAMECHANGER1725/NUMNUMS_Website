/**
 * Consent and phone survive the Google OAuth round trip.
 *
 * `signInWithOAuth` redirects away, so there is no `options.data` to attach the
 * way `signUp` has — the tick a customer made before pressing "Continue with
 * Google" would simply be lost, and a marketing consent we cannot evidence is
 * the same as no consent at all (Spam Act 2003). So it is parked here and
 * written to the user record once they land back with a session.
 */
import { supabase } from "@/lib/supabase";

const KEY = "nn_signup_prefs_v1";

export type SignUpPrefs = {
  phone: string;
  marketing_email: boolean;
  marketing_sms: boolean;
  consent_at: string;
  consent_source: string;
  terms_accepted_at: string;
};

export function stashPrefs(prefs: SignUpPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* private mode throws; the signup itself still works */
  }
}

/** Call on any page an OAuth redirect can land on. No-op when nothing is parked. */
export async function applyStashedPrefs() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
    if (raw) localStorage.removeItem(KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let prefs: SignUpPrefs;
  try {
    prefs = JSON.parse(raw);
  } catch {
    return; // a stale key from an older shape must not crash the page
  }

  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  await supabase.auth.updateUser({ data: prefs });
}
