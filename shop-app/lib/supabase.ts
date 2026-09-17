import { createClient } from "@supabase/supabase-js";

/**
 * The publishable key is meant to be public — what guards the data is RLS.
 * See ops/db.mjs for the same reasoning on the staff side. Never put a
 * service-role key in this app; server-side writes belong in a Netlify Function.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(url && key);

export const supabase = createClient(url || "http://localhost", key || "missing", {
  auth: {
    // The implicit flow puts the access token in the URL fragment, where it
    // lands in history and any Referer leak. PKCE keeps it out of the URL.
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
