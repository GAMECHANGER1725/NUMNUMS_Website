"use client";

import { slotLabel } from "@/lib/catalog";

/**
 * Collection time, as chips grouped by part of day.
 *
 * NOT a dropdown. The two shops keep very different hours — Harris Park runs
 * to 10pm, Riverstone stops at 6:30 — and a dropdown hides that behind a tap:
 * you cannot see that one shop does evenings until you open it and count. Laid
 * out, the shape of the day is the first thing you read.
 *
 * Built on real radio inputs rather than a listbox. A native radio group
 * already answers arrow keys, Home/End, roving focus and form semantics, and
 * it is styled entirely by us — so this is not an OS control in the sense the
 * repo bans (a `<select>` hands its list to the operating system; a radio
 * draws nothing of its own once `appearance: none` is set).
 *
 * `slots` is minutes from midnight. 0 means nothing chosen — no shop opens at
 * midnight, so it is unambiguous as an empty value.
 */

/** Morning / Afternoon / Evening, by Sydney wall clock. */
const BANDS: { key: string; label: string; from: number; to: number }[] = [
  { key: "morning", label: "Morning", from: 0, to: 12 * 60 - 1 },
  { key: "afternoon", label: "Afternoon", from: 12 * 60, to: 17 * 60 - 1 },
  { key: "evening", label: "Evening", from: 17 * 60, to: 24 * 60 },
];

export function NnTimePicker({
  id,
  slots,
  value,
  onChange,
  disabledHint,
}: {
  id: string;
  slots: number[];
  value: number;
  onChange: (min: number) => void;
  disabledHint?: string;
}) {
  if (!slots.length) {
    return (
      <p id={id} className="nn-time-empty">
        {disabledHint ?? "Pick a shop first — the two keep different hours."}
      </p>
    );
  }

  // Only bands that actually have slots, so Riverstone shows no empty
  // "Evening" heading and Harris Park shows no empty "Morning" one.
  const bands = BANDS.map((b) => ({
    ...b,
    times: slots.filter((m) => m >= b.from && m <= b.to),
  })).filter((b) => b.times.length);

  return (
    <div id={id} className="nn-time">
      {bands.map((band) => (
        <div key={band.key} className="nn-time-band">
          <p className="nn-time-band-label" id={`${id}-${band.key}`}>{band.label}</p>
          {/* One radio group across the whole control, not one per band: the
              bands are a visual grouping, and splitting the `name` would let a
              customer select a morning AND an evening time. */}
          <div className="nn-time-grid" role="group" aria-labelledby={`${id}-${band.key}`}>
            {band.times.map((m) => {
              const on = m === value;
              return (
                <label key={m} className={on ? "nn-time-chip is-on" : "nn-time-chip"}>
                  <input
                    type="radio"
                    name={id}
                    value={m}
                    checked={on}
                    onChange={() => onChange(m)}
                  />
                  <span>{slotLabel(m)}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
