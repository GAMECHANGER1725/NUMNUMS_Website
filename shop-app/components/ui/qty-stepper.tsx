"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_QTY } from "@/lib/cart";

/**
 * How many of this cake.
 *
 * A stepper rather than a number field: the range is 1–10, a keyboard is the
 * wrong tool for it on a phone, and a free text box invites "1o" and an empty
 * string. The count is a live region so a screen reader hears the new number
 * rather than nothing at all — the visible change is the whole feedback.
 *
 * `max` is passed in rather than read from MAX_QTY directly, because the real
 * ceiling is what is left of the ten-cake order, not this line's own limit.
 */
export function QtyStepper({
  value, onChange, max = MAX_QTY, label,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  label: string;
}) {
  const btn =
    "inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground " +
    "transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground/45 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]";

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
      <button
        type="button" className={btn} disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        aria-label={`One fewer ${label}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span aria-live="polite" className="min-w-[2ch] text-center text-[0.9rem] font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button" className={btn} disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={`One more ${label}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
