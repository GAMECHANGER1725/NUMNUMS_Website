"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_TILT = 8; // degrees — past ~10 the notches read as a folded ticket

type Sheen = { x: number; y: number; on: boolean };

/**
 * The 10% offer, drawn as an actual voucher rather than a line of copy.
 *
 * Two cursor behaviours, both deliberately borrowed from the site's existing
 * `.cursor-card` on locations.html: a radial sheen that follows the pointer, and
 * a tilt. The sheen there is rose on white; here the card is already rose-to-gold
 * so the sheen is white, or it would be invisible.
 */
export function CouponCard({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [sheen, setSheen] = useState<Sheen>({ x: 50, y: 50, on: false });

  const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Touch has no hover state, so a tilt that never resets would just look broken.
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    frame.current = requestAnimationFrame(() => {
      setTilt({
        rx: (0.5 - py) * 2 * MAX_TILT,
        ry: (px - 0.5) * 2 * MAX_TILT,
      });
      setSheen({ x: px * 100, y: py * 100, on: true });
    });
  }, []);

  const handleLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    setTilt({ rx: 0, ry: 0 });
    setSheen((s) => ({ ...s, on: false }));
  }, []);

  return (
    <div className={cn("[perspective:900px]", className)}>
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className="coupon relative select-none text-white"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div className="relative flex items-stretch gap-3.5 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
          {/* The amount */}
          <div className="flex flex-col justify-center pr-3.5 sm:pr-5">
            <span className="font-display text-[2.9rem] font-light leading-[0.82] tracking-tight sm:text-[3.75rem]">
              10%
            </span>
            <span className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/90">
              off
            </span>
          </div>

          <div className="w-px shrink-0 self-stretch bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.9)_0_6px,transparent_6px_12px)]" />

          {/* What it's for */}
          <div className="flex flex-col justify-center gap-1.5">
            <span className="text-[0.66rem] font-semibold uppercase leading-tight tracking-[0.12em] text-white/90 sm:text-[0.68rem]">
              Your next order
            </span>
            <span className="font-mono text-[0.9rem] font-semibold tracking-[0.16em] text-white sm:text-[1rem] sm:tracking-[0.2em]">
              NN-••••••
            </span>
          </div>
        </div>

        {/* Cursor sheen — the locations.html interaction, recoloured for a rose card */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: sheen.on ? 1 : 0,
            background: `radial-gradient(circle 180px at ${sheen.x}% ${sheen.y}%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 40%, transparent 70%)`,
          }}
        />
      </div>
    </div>
  );
}
