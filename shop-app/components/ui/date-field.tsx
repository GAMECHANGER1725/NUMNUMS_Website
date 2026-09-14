"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * The collection date, as a calendar we draw ourselves.
 *
 * `<input type="date">` opens the OS picker, which on a phone is a full-screen
 * system sheet in somebody else's typeface — and worse, it will happily offer
 * every date in it. Ours greys what the shop cannot take: anything inside the
 * 48-hour lead time, and anything past the booking horizon. A date you can pick
 * and the server then refuses reads as a broken form rather than as a rule.
 *
 * The grid is hand-written because a calendar is a month of buttons and a
 * library for it would be the heaviest thing on this page. The *positioning*
 * is not — Base UI's Positioner flips it above the field when there is no room
 * below and keeps it inside the viewport, which is the part that actually goes
 * wrong on a short screen.
 *
 * Dates are plain `YYYY-MM-DD` strings, Sydney wall-clock, and every comparison
 * is a string compare. Never build a `Date` from one and compare instants: the
 * whole cart works in Sydney local time and a UTC round trip moves an evening
 * pickup into the wrong day.
 */
const DAY_NAMES = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Monday-first offset for the 1st of a month. */
const leadingBlanks = (y: number, m: number) => (new Date(y, m, 1).getDay() + 6) % 7;

export function NnDateField({
  id, value, min, max, onChange,
}: {
  id?: string;
  value: string;
  min: string;
  max: string;
  onChange: (v: string) => void;
}) {
  const monthOf = (d: string) => ({ y: Number(d.slice(0, 4)), m: Number(d.slice(5, 7)) - 1 });
  const [cursor, setCursor] = useState(() => monthOf(value || min));
  const [open, setOpen] = useState(false);

  const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const firstOfMonth = iso(cursor.y, cursor.m, 1);
  const lastOfMonth = iso(cursor.y, cursor.m, days);
  // A month with nothing bookable in it is a month there is no reason to walk
  // into, so the arrow that leads there is switched off rather than left live.
  const canGoBack = firstOfMonth > min;
  const canGoOn = lastOfMonth < max;

  const step = (by: number) =>
    setCursor(({ y, m }) => {
      const n = m + by;
      return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 };
    });

  const pretty = value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-AU", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
      })
    : "";

  return (
    // The month is picked when the calendar opens, not once on mount. The cart
    // is empty on the first paint (useSyncExternalStore's server snapshot), so
    // a one-time init read no date at all and a customer who had already
    // chosen 3 October reopened on September.
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setCursor(monthOf(value || min));
        setOpen(next);
      }}
    >
      <Popover.Trigger id={id} className="nd-btn" aria-label="Collection date">
        <CalendarDays className="h-4 w-4 flex-none text-[#C85478]" aria-hidden />
        <span className={value ? "nd-val" : "nd-val is-empty"}>
          {pretty || "Pick a date"}
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner className="z-50 outline-none" sideOffset={5} collisionPadding={12}>
          <Popover.Popup className="nd-menu max-h-[var(--available-height)] overflow-y-auto p-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button" className="nd-cal-nav" onClick={() => step(-1)}
                disabled={!canGoBack} aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p aria-live="polite" className="text-[0.86rem] font-semibold">
                {MONTHS[cursor.m]} {cursor.y}
              </p>
              <button
                type="button" className="nd-cal-nav" onClick={() => step(1)}
                disabled={!canGoOn} aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-7 gap-0.5" role="grid">
              {DAY_NAMES.map((d, i) => (
                <span key={i} className="py-1 text-center text-[0.64rem] font-semibold uppercase tracking-wider text-muted-foreground" aria-hidden>
                  {d}
                </span>
              ))}
              {Array.from({ length: leadingBlanks(cursor.y, cursor.m) }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const d = i + 1;
                const day = iso(cursor.y, cursor.m, d);
                const off = day < min || day > max;
                const on = day === value;
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={off}
                    aria-pressed={on}
                    aria-label={new Date(`${day}T12:00:00`).toLocaleDateString("en-AU", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                    onClick={() => { onChange(day); setOpen(false); }}
                    className={"nd-cal-day" + (on ? " is-on" : "")}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            <p className="mt-2 border-t border-[rgba(200,84,120,0.15)] pt-2 text-[0.7rem] leading-snug text-muted-foreground">
              Greyed days are inside our 48 hours&rsquo; notice, or too far ahead to book online.
            </p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
