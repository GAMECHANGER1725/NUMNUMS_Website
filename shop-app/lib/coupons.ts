import { supabase } from "@/lib/supabase";

export type Coupon = {
  code: string;
  percent: number;
  expires_at: string | null;
  redeemed_at: string | null;
};

/**
 * The signed-in customer's own coupons, newest usable first.
 *
 * RLS scopes this to their email — see
 * `ops/supabase/2026-09-13-coupons.sql`. An empty array is the honest answer
 * for a guest, so callers never need to special-case signed-out.
 */
export async function listMyCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("code,percent,expires_at,redeemed_at")
    .is("redeemed_at", null)
    .order("expires_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as Coupon[];
}

/**
 * Look a typed code up through `/api/check-coupon`.
 *
 * It cannot be done from here. The `coupons` read policy is
 * `lower(email) = lower(auth.jwt() ->> 'email')`, so a customer who took the
 * 10% code from the newsletter popup and never made an account reads nothing
 * and is told their own code is not recognised.
 *
 * Coupons are bound to the email they were issued to, which is why the address
 * typed at checkout goes with the code.
 *
 * Advisory only: `create-checkout` re-validates through the same server-side
 * rules and the webhook claims it again. Never price off this result.
 */
export async function lookUpCoupon(
  raw: string,
  email: string,
): Promise<{ coupon?: Coupon; problem: string | null }> {
  const code = raw.trim().toUpperCase();
  if (!code) return { problem: "Enter a code first." };
  try {
    const res = await fetch("/api/check-coupon", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, email }),
    });
    const body = (await res.json()) as { coupon?: Coupon | null; problem?: string | null };
    if (!res.ok) return { problem: body?.problem ?? "We couldn't check that code just then." };
    return { coupon: body.coupon ?? undefined, problem: body.problem ?? null };
  } catch {
    return { problem: "We couldn't check that code just then." };
  }
}
