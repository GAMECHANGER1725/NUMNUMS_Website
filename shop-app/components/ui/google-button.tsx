"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * "Continue with Google", rendered by Google rather than by us.
 *
 * This is Google Identity Services + `signInWithIdToken`, deliberately NOT
 * `signInWithOAuth`. The redirect flow sends the browser to
 * `<project-ref>.supabase.co/auth/v1/callback`, and Google then names that
 * domain on its consent screen — "to continue to stnmoxsojqbbtgjwkzrc.supabase.co",
 * which is indistinguishable from a phishing page to a customer. It cannot be
 * fixed with branding settings, because Google will only show an app name for a
 * redirect URI on a domain you can prove you own, and nobody owns supabase.co
 * but Supabase. Paying for a custom auth domain is the other fix.
 *
 * Here the browser never leaves numnumsbakery.com.au: Google hands back an ID
 * token in the page and Supabase exchanges it. The Google Cloud client needs
 * this origin under **Authorised JavaScript origins** — not a redirect URI.
 */

type Credential = { credential: string };
type GoogleId = {
  initialize: (o: Record<string, unknown>) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const SRC = "https://accounts.google.com/gsi/client";

/** A nonce and its SHA-256, hex-encoded. Google gets the hash, Supabase the original. */
async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

function loadScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
  if (existing) {
    return new Promise((res, rej) => {
      existing.addEventListener("load", () => res());
      existing.addEventListener("error", () => rej(new Error("gsi failed")));
    });
  }
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => res();
    s.onerror = () => rej(new Error("gsi failed"));
    document.head.appendChild(s);
  });
}

export type GoogleButtonProps = {
  /** Called once Supabase has a session. */
  onSignedIn: () => void | Promise<void>;
  onError: (message: string) => void;
};

export function GoogleButton({ onSignedIn, onError }: GoogleButtonProps) {
  const host = useRef<HTMLDivElement>(null);
  // Until Google has actually drawn its button there is nothing to show, and an
  // empty bordered box above an "OR" divider looks broken. So the whole block
  // stays hidden until it renders, and stays hidden forever if it cannot.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!CLIENT_ID) return;

    (async () => {
      try {
        await loadScript();
        const { raw, hashed } = await makeNonce();
        if (cancelled || !host.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashed,
          use_fedcm_for_prompt: true,
          callback: async (res: Credential) => {
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: res.credential,
              nonce: raw,
            });
            if (error) return onError(error.message);
            await onSignedIn();
          },
        });

        const el = host.current;
        window.google.accounts.id.renderButton(el, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          // Stretched to full width, a left-aligned logo strands itself far
          // from the label; centred keeps the mark and the words together.
          logo_alignment: "center",
          width: 320,
        });
        // renderButton returns before it has drawn, and it can draw nothing at
        // all — the script loads from cache while Google's own calls are
        // blocked. So wait for real content rather than trusting the call.
        // Not a height check: the host is inside the hidden wrapper, so it
        // measures 0 until shown, which is the thing this is deciding.
        for (let i = 0; i < 30 && !cancelled; i++) {
          if (el.childElementCount) {
            setReady(true);
            break;
          }
          await new Promise((r) => setTimeout(r, 100));
        }
      } catch {
        // Blocked by an extension, offline, or the origin is not authorised.
        // The email form below is the whole fallback — say nothing.
      }
    })();

    return () => {
      cancelled = true;
    };
    // onSignedIn/onError are stable callers; re-initialising GIS on every render
    // would draw a second button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div hidden={!ready} className="mt-5">
      <div ref={host} className="flex justify-center [&>div]:!w-full" />
      <p className="mt-2 text-center text-[0.7rem] leading-snug text-muted-foreground">
        By continuing with Google you agree to our{" "}
        <a href="/terms" target="_blank" rel="noopener" className="font-medium text-[#C85478] underline-offset-2 hover:underline">
          Terms &amp; Conditions
        </a>{" "}
        and{" "}
        <a href="/privacy-policy" target="_blank" rel="noopener" className="font-medium text-[#C85478] underline-offset-2 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
