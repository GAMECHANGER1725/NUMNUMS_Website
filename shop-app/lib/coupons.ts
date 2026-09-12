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

/** Why a code cannot be used, or null if it can. Advisory only — see below. */
export function couponProblem(c: Coupon | undefined): string | null {
  if (!c) return "We don't recognise that code.";
  if (c.redeemed_at) return "That code has already been used.";
  if (c.expires_at && new Date(c.expires_at) < new Date()) return "That code has expired.";
  return null;
}

/**
 * Look a typed code up against this customer's coupons.
 *
 * This is convenience, not enforcement: a coupon bound to someone else's email
 * is invisible to RLS and so reads as "not recognised", which is the right
 * message anyway. The binding check that decides what is actually charged
 * happens server-side in `create-checkout`, and the claim happens again in the
 * Stripe webhook. Never price off this result.
 */
export async function lookUpCoupon(raw: string): Promise<{ coupon?: Coupon; problem: string | null }> {
  const code = raw.trim().toUpperCase();
  if (!code) return { problem: "Enter a code first." };
  const { data } = await supabase
    .from("coupons")
    .select("code,percent,expires_at,redeemed_at")
    .eq("code", code)
    .maybeSingle();
  const coupon = (data ?? undefined) as Coupon | undefined;
  return { coupon, problem: couponProblem(coupon) };
}
