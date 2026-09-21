"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { slotLabel } from "@/lib/catalog";

/**
 * Collection date AND time, in one field.
 *
 * They were two controls, and the time was 23 chips laid out in the open —
 * six rows on a phone that pushed the order summary and the checkout button
 * below the fold, which are the two things the page exists for. They are also
 * one decision: "when am I picking this up". Splitting a single decision
 * across two fields makes the customer answer half of it, look away, and
 * answer the other half.
 *
 * So: one trigger reading "Sat, 26 Sept · 11:30 AM", opening a popover with
 * the calendar above and the times below. Pick a day, pick a time, it closes.
 *
 * `<input type="date">` and `<select>` are both out — they hand the list to
 * the operating system, which on a phone is a full-screen sheet in somebody
 * else's typeface, and the date picker will happily offer days the shop
 * cannot take. The grid and the chips are hand-written because a month of
 * buttons does not need a library. The *positioning* does: Base UI's
 * Positioner flips the popup above the field when there is no room below and
 * publishes `--available-height` and `--available-width`, which is what keeps
 * it on a 320px screen.
 *
 * Base UI, not Radix — this project has one primitives library, and a second
 * one for the same job means two sets of positioning, portal and focus
 * behaviour to keep in step.
 *
 * Dates are plain `YYYY-MM-DD` strings, Sydney wall-clock, and every
 * comparison is a string compare. Never build a `Date` from one and compare
 * instants: the cart works in Sydney local time and a UTC round trip moves an
 * evening pickup into the wrong day. Times are minutes from midnight, because
 * Riverstone closes at 6:30 and an integer hour cannot say that.
 */
const DAY_NAMES = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Morning / Afternoon / Evening, by Sydney wall clock. */
const BANDS: { key: string; label: string; from: number; to: number }[] = [
  { key: "morning", label: "Morning", from: 0, to: 12 * 60 - 1 },
  { key: "afternoon", label: "Afternoon", from: 12 * 60, to: 17 * 60 - 1 },
  { key: "evening", label: "Evening", from: 17 * 60, to: 24 * 60 },
];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Monday-first offset for the 1st of a month. */
const leadingBlanks = (y: number, m: number) => (new Date(y, m, 1).getDay() + 6) % 7;

export function NnWhenField({
  id,
  date,
  min,
  max,
  time,
  slots,
  onChange,
  emptyHint,
}: {
  id?: string;
  date: string;
  min: string;
  max: string;
  /** Minutes from midnight. 0 = not chosen. */
  time: number;
  /** Bookable slots for the chosen shop, in minutes. */
  slots: number[];
  onChange: (next: { date: string; time: number }) => void;
  /** Shown instead of the times when no shop is picked yet. */
  emptyHint?: string;
}) {
  const monthOf = (d: string) => ({ y: Number(d.slice(0, 4)), m: Number(d.slice(5, 7)) - 1 });
  const [cursor, setCursor] = useState(() => monthOf(date || min));
  const [open, setOpen] = useState(false);

  const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const canGoBack = iso(cursor.y, cursor.m, 1) > min;
  const canGoOn = iso(cursor.y, cursor.m, days) < max;

  const step = (by: number) =>
    setCursor(({ y, m }) => {
      const n = m + by;
      return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 };
    });

  const chosenTime = slots.includes(time) ? time : 0;

  const prettyDate = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-AU", {
        weekday: "short", day: "numeric", month: "short",
      })
    : "";
  const label = date && chosenTime
    ? `${prettyDate} · ${slotLabel(chosenTime)}`
    : date
      ? `${prettyDate} · pick a time`
      : "Pick a date & time";

  const bands = BANDS.map((b) => ({
    ...b,
    times: slots.filter((m) => m >= b.from && m <= b.to),
  })).filter((b) => b.times.length);

  return (
    // The month is chosen when the popover opens, not once on mount. The cart
    // is empty on the first paint (useSyncExternalStore's server snapshot), so
    // a one-time init read no date at all and a customer who had already
    // chosen 3 October reopened on September.
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setCursor(monthOf(date || min));
        setOpen(next);
      }}
    >
      <Popover.Trigger id={id} className="nd-btn" aria-label="Collection date and time">
        <CalendarDays className="h-4 w-4 flex-none text-[#C85478]" aria-hidden />
        <span className={date && chosenTime ? "nd-val" : "nd-val is-empty"}>{label}</span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner className="z-50 outline-none" sideOffset={5} collisionPadding={12}>
          <Popover.Popup className="nd-menu nn-when max-h-[var(--available-height)] max-w-[var(--available-width)] overflow-y-auto p-3">
            {/* ── the day ── */}
            <div className="nn-when-cal">
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
                  const on = day === date;
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={off}
                      aria-pressed={on}
                      aria-label={new Date(`${day}T12:00:00`).toLocaleDateString("en-AU", {
                        weekday: "long", day: "numeric", month: "long",
                      })}
                      // Picking a day does NOT close: the time is still
                      // unanswered, and closing here is what made this two
                      // fields in the first place.
                      onClick={() => onChange({ date: day, time: chosenTime })}
                      className={"nd-cal-day" + (on ? " is-on" : "")}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-[0.7rem] leading-snug text-muted-foreground">
                Greyed days are sooner than we can bake, or too far ahead to book online.
              </p>
            </div>

            {/* ── the time ── */}
            <div className="nn-when-times">
              {!slots.length ? (
                <p className="nn-time-empty">
                  {emptyHint ?? "Pick a shop first — the two keep different hours."}
                </p>
              ) : (
                bands.map((band) => (
                  <div key={band.key} className="nn-time-band">
                    <p className="nn-time-band-label" id={`${id}-${band.key}`}>{band.label}</p>
                    {/* One radio group across all bands, not one per band:
                        the bands are a visual grouping, and splitting the
                        `name` would let someone pick a morning AND an
                        evening time. */}
                    <div className="nn-time-grid" role="group" aria-labelledby={`${id}-${band.key}`}>
                      {band.times.map((m) => {
                        const on = m === chosenTime;
                        return (
                          <label key={m} className={on ? "nn-time-chip is-on" : "nn-time-chip"}>
                            <input
                              type="radio"
                              name={`${id}-time`}
                              value={m}
                              checked={on}
                              // Closing on the time, not the day, is what
                              // makes this one decision: the last thing you
                              // answer is the thing that dismisses it.
                              onChange={() => {
                                onChange({ date, time: m });
                                if (date) setOpen(false);
                              }}
                            />
                            <span>{slotLabel(m)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
