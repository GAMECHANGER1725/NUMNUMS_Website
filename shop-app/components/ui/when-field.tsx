"use client";

import { useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { slotLabel } from "@/lib/catalog";

/**
 * Collection date and time: the calendar is open on the page, and tapping a
 * day pops the times out beside that day.
 *
 * It is one decision — *when am I collecting this* — so it is one control.
 * Two separate fields made the customer answer half of it, look away, and
 * answer the rest; and a flat list of 23 times hid the fact that one shop
 * trades until 10pm while the other stops at 6:30.
 *
 * The month is a grid of buttons we draw ourselves. `<input type="date">`
 * hands the list to the operating system — a full-screen sheet in somebody
 * else's typeface — and will happily offer days the shop cannot take. Ours
 * greys what is inside the lead time or past the booking horizon, because a
 * date you can pick and the server then refuses reads as a broken form
 * rather than as a rule.
 *
 * **One popover, moved, not one per day.** `Positioner` takes an `anchor`, so
 * the same popup is re-anchored to whichever day was tapped. Thirty mounted
 * popovers to show one at a time is thirty sets of portal, focus and
 * positioning state.
 *
 * Base UI, not Radix: `Positioner` publishes `--available-height` and
 * `--available-width` and flips the popup to the other side of the day when
 * there is no room, which is the whole problem on a phone. A second
 * primitives library would mean solving it twice.
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

const longDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long",
  });

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
  // The day whose popover is open, and the button it hangs off.
  const [openDay, setOpenDay] = useState<string | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const canGoBack = iso(cursor.y, cursor.m, 1) > min;
  const canGoOn = iso(cursor.y, cursor.m, days) < max;

  const step = (by: number) =>
    setCursor(({ y, m }) => {
      const n = m + by;
      return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 };
    });

  const chosenTime = slots.includes(time) ? time : 0;

  const bands = BANDS.map((b) => ({
    ...b,
    times: slots.filter((m) => m >= b.from && m <= b.to),
  })).filter((b) => b.times.length);

  // There is no Popover.Trigger — the anchor is whichever day was tapped — so
  // focus return is ours to do. Without this, closing the popup drops focus to
  // <body> and a keyboard user is back at the top of the page.
  const close = () => {
    const el = anchorRef.current;
    setOpenDay(null);
    requestAnimationFrame(() => el?.focus());
  };

  return (
    <div className="nn-when-card">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button" className="nd-cal-nav" onClick={() => step(-1)}
          disabled={!canGoBack} aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p aria-live="polite" className="text-[0.92rem] font-semibold">
          {MONTHS[cursor.m]} {cursor.y}
        </p>
        <button
          type="button" className="nd-cal-nav" onClick={() => step(1)}
          disabled={!canGoOn} aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1" role="grid">
        {DAY_NAMES.map((d, i) => (
          <span
            key={i}
            className="py-1 text-center text-[0.64rem] font-semibold uppercase tracking-wider text-muted-foreground"
            aria-hidden
          >
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
              aria-haspopup="dialog"
              aria-expanded={openDay === day}
              aria-label={longDate(day)}
              ref={openDay === day ? anchorRef : undefined}
              onClick={(e) => {
                anchorRef.current = e.currentTarget;
                // Commit the day IMMEDIATELY, clearing the time if it is a
                // different day. Deferring it until a time was picked meant
                // tapping a second date left the calendar highlighting the
                // old one while the popover was headed with the new one and
                // the summary line said a third thing — three answers to
                // "when" on screen at once, which is what read as the
                // selector glitching. `ready` still requires a time, so a
                // date on its own can never reach the checkout.
                if (day !== date) onChange({ date: day, time: 0 });
                setOpenDay(day);
              }}
              className={"nd-cal-day" + (on ? " is-on" : "")}
            >
              {d}
              {/* The day already chosen carries a dot, so a glance at the
                  month says which one is booked without reading the summary
                  underneath. */}
              {on && chosenTime > 0 && <span className="nn-day-dot" aria-hidden />}
            </button>
          );
        })}
      </div>

      {/* What was actually chosen, in words, under the calendar. The grid can
          only show WHICH day; the time has nowhere to live in a 2-digit cell. */}
      <p className="nn-when-summary">
        {date && chosenTime ? (
          <>Collecting <b>{longDate(date)}</b> at <b>{slotLabel(chosenTime)}</b></>
        ) : date ? (
          <>Pick a time for <b>{longDate(date)}</b></>
        ) : (
          <>Greyed days are sooner than we can bake, or too far ahead to book online.</>
        )}
      </p>

      <Popover.Root
        open={openDay !== null}
        onOpenChange={(next) => { if (!next) close(); }}
      >
        <Popover.Portal>
          <Popover.Positioner
            className="z-50 outline-none"
            anchor={anchorRef}
            // Below the day, not beside it. Beside looks better on a wide
            // canvas and is wrong everywhere else: on a phone there is no
            // room either side of a 40px cell, so it flipped left into a
            // sliver and the chip grid was clipped. Below, the popup gets
            // the full width the viewport can give it, and Base UI flips it
            // above for days in the last row.
            side="bottom"
            align="center"
            sideOffset={8}
            collisionPadding={12}
          >
            <Popover.Popup className="nd-menu nn-when-pop max-h-[var(--available-height)] max-w-[var(--available-width)] overflow-y-auto p-3">
              <p className="nn-when-pop-head">{openDay ? longDate(openDay) : ""}</p>

              {!slots.length ? (
                <p className="nn-time-empty">
                  {emptyHint ?? "Pick a shop first — the two keep different hours."}
                </p>
              ) : (
                // A scrolling box, not a wall of chips. 23 half-hour slots as
                // a grid of buttons is a card the size of the calendar it
                // hangs off; as a list it is one compact control you run your
                // eye down, and the band headings stay stuck to the top so
                // you always know whether you are in the morning or the
                // evening. One radio group, so the browser gives arrow keys,
                // Home/End and roving focus.
                <div
                  className="nn-time-list"
                  role="radiogroup"
                  aria-label={`Collection time on ${openDay ? longDate(openDay) : ""}`}
                >
                  {bands.map((band) => (
                    <div key={band.key}>
                      <p className="nn-time-list-head">{band.label}</p>
                      {band.times.map((m) => {
                        const on = openDay === date && m === chosenTime;
                        return (
                          <label key={m} className={on ? "nn-time-row is-on" : "nn-time-row"}>
                            <input
                              type="radio"
                              name={`${id}-time`}
                              value={m}
                              checked={on}
                              // Scroll the chosen time into view when the box
                              // opens on an already-booked day, or a 9pm
                              // pickup is off-screen and looks unset.
                              ref={on ? (el) => el?.scrollIntoView({ block: "center" }) : undefined}
                              onChange={() => {
                                if (openDay) onChange({ date: openDay, time: m });
                                close();
                              }}
                            />
                            <span>{slotLabel(m)}</span>
                            {on && <Check className="h-3.5 w-3.5 flex-none" aria-hidden />}
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
