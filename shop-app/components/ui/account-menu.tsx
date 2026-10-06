"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { LogOut, User } from "lucide-react";

/**
 * The account menu behind the person icon.
 *
 * Two states and nothing else. Signed out it offers the two doors; signed in
 * it names the address you are signed in as — which is the question the icon
 * is actually being clicked to answer — and offers the way out.
 *
 * It deliberately does **not** offer "My orders". There is no order-history
 * screen, and a menu item that opens nothing is worse than an absent one. Add
 * it the day that page exists, along with the `customer_user_id` column and
 * the RLS policy the plan parks until then.
 */
export function AccountMenu() {
  const [email, setEmail] = useState<string | null>(null);

  // The Supabase client (gotrue + realtime, ~64KB gzipped) is pulled in after
  // hydration rather than with the page, so "Add to order" is not waiting on
  // the account menu's session check.
  useEffect(() => {
    let live = true;
    let unsub = () => {};
    import("@/lib/supabase").then(({ supabase }) => {
      if (!live) return;
      supabase.auth.getUser().then(({ data }) => { if (live) setEmail(data.user?.email ?? null); });
      // Verifying an email signs the customer in from another component, so this
      // has to follow the session rather than read it once.
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (live) setEmail(session?.user?.email ?? null);
      });
      unsub = () => sub.subscription.unsubscribe();
    });
    return () => { live = false; unsub(); };
  }, []);

  return (
    <Popover.Root>
      <Popover.Trigger
        className="nn-icon-btn"
        aria-label={email ? `Account — signed in as ${email}` : "Account"}
      >
        <User className="h-[18px] w-[18px]" />
        {email && <span className="nn-icon-dot" aria-hidden />}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner className="z-50 outline-none" sideOffset={8} align="end" collisionPadding={12}>
          <Popover.Popup className="nd-menu w-[15rem] max-w-[var(--available-width)] p-2">
            <p className="px-2 pb-2 pt-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              My account
            </p>

            {email ? (
              <>
                <p className="truncate border-b border-[rgba(200,84,120,0.15)] px-2 pb-2.5 text-[0.84rem] font-medium">
                  {email}
                </p>
                <button
                  type="button"
                  onClick={() => import("@/lib/supabase").then(({ supabase }) => supabase.auth.signOut())}
                  className="nd-opt w-full"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  <span className="nd-opt-label">Sign out</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 p-1">
                <Link href="/log-in" className="btn-cta w-full py-2.5 text-[0.85rem]">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full rounded-full border border-[#C85478] py-2.5 text-center text-[0.85rem] font-semibold text-[#C85478] transition-colors hover:bg-[#FDF3F6]"
                >
                  Create an account
                </Link>
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
