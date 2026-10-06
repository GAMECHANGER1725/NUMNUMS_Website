"use client";

import { useEffect, useState } from "react";

/**
 * "2 online pickups left for Saturday 10 October" — or nothing.
 *
 * The number comes from netlify/functions/capacity, which counts with the same
 * `webOrdersOn` that makes the checkout refuse a full day, so it is true at
 * the moment it is read and stays true as orders land. It is never typed in:
 * a fixed "2 left" would be the invented scarcity the repo refuses (ACL), and
 * `verify-blog.mjs` scans the built pages for exactly that.
 *
 * Silent when no cap is set, when the count fails, under `serve.mjs` (no
 * functions locally), and while plenty is left — "9 pickups left" reads as
 * noise, not news.
 */
const SHOW_AT_OR_BELOW = 3;

export function SaturdayLeft({ className = "" }: { className?: string }) {
  const [state, setState] = useState<{ day: string; left: number } | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/.netlify/functions/capacity")
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (live && b?.day && Number.isInteger(b.left)) setState({ day: b.day, left: b.left });
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  if (!state || state.left > SHOW_AT_OR_BELOW) return null;
  const day = new Date(`${state.day}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long",
  });
  return (
    <p className={`saturday-left ${className}`} role="status">
      <span aria-hidden className="saturday-left-dot" />
      {/* One text child, so the flex gap sits between the dot and the
          sentence — not inside the sentence. */}
      <span>
        {state.left === 0
          ? <>{day} is fully booked online</>
          : <><b>{state.left} online {state.left === 1 ? "pickup" : "pickups"} left</b> for {day}</>}
      </span>
    </p>
  );
}
