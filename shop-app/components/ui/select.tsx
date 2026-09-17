"use client";

import { Select as Base } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

/**
 * A dropdown that belongs to this bakery.
 *
 * A native `<select>` hands its list to the OS — a grey iOS wheel, an Android
 * system sheet — so on a page this deliberately styled it is the one control
 * that looks like somebody else's app. `order.html` replaced its own selects
 * for exactly that reason; this is the same grammar (`.nd-*` in globals.css,
 * copied from there) so the shop and the custom-cake form are visibly one site.
 *
 * Built on Base UI, which is already a dependency, rather than hand-rolled:
 * a listbox has to answer type-ahead, Home/End, PageUp/Down, Escape, focus
 * return and `aria-activedescendant`, and getting that wrong is invisible until
 * somebody using a keyboard or a screen reader cannot buy a cake.
 *
 * **It must fit on the screen.** `Positioner` flips the popup above the trigger
 * when there is no room below and publishes `--available-height`; the list is
 * capped to that and scrolls inside itself. Without those two lines a long list
 * near the bottom of a phone runs off the viewport, which is the failure this
 * component exists to stop — so do not remove them.
 */
export type NnOption = { value: string; label: string; note?: string; tag?: string };

export function NnSelect({
  id, value, onChange, options, placeholder = "Choose…", ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: NnOption[];
  placeholder?: string;
  ariaLabel?: string;
}) {
  const chosen = options.find((o) => o.value === value);

  return (
    <Base.Root
      value={value}
      onValueChange={(v) => onChange(String(v ?? ""))}
      items={options.map((o) => ({ label: o.label, value: o.value }))}
    >
      <Base.Trigger id={id} aria-label={ariaLabel} className="nd-btn">
        <span className={chosen ? "nd-val" : "nd-val is-empty"}>
          {chosen?.label ?? placeholder}
        </span>
        {chosen?.note && <span className="nd-opt-note">{chosen.note}</span>}
        <Base.Icon className="flex-none">
          <ChevronDown className="nd-caret" />
        </Base.Icon>
      </Base.Trigger>

      <Base.Portal>
        <Base.Positioner
          className="z-50 outline-none"
          sideOffset={5}
          alignItemWithTrigger={false}
          collisionPadding={12}
        >
          <Base.Popup className="nd-menu">
            {/* Capped to what the viewport actually has, and scrolls inside
                itself — see the note above. */}
            <Base.List className="max-h-[min(var(--available-height),17rem)] overflow-y-auto overscroll-contain">
              {options.map((o) => (
                <Base.Item key={o.value} value={o.value} className="nd-opt">
                  <Base.ItemText className="nd-opt-label">{o.label}</Base.ItemText>
                  {o.note && <span className="nd-opt-note">{o.note}</span>}
                  {o.tag && <span className="nd-opt-tag">{o.tag}</span>}
                  <Base.ItemIndicator className="flex-none text-[#C85478]">
                    <Check className="h-3.5 w-3.5" />
                  </Base.ItemIndicator>
                </Base.Item>
              ))}
            </Base.List>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
