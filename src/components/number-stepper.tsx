"use client";

import { useState } from "react";

const stepBtnClass =
  "flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-xl border border-border bg-card text-xl font-semibold text-foreground transition touch-manipulation active:scale-95 hover:bg-muted disabled:pointer-events-none disabled:opacity-35";

const valueBtnClass =
  "flex h-12 flex-1 items-center justify-center rounded-xl bg-muted/60 font-display text-2xl font-semibold tabular-nums text-foreground transition touch-manipulation hover:bg-muted";

const valueInputClass =
  "h-12 w-full rounded-xl border-2 border-ring bg-card text-center font-display text-2xl font-semibold tabular-nums text-foreground outline-none";

/**
 * −/+ stepper with a tappable value (tap-to-edit) — a mobile replacement for
 * tiny <input type="number">. Buttons are 48px (above the 44px minimum
 * recommended for touch targets), `touch-manipulation` removes the 300ms
 * tap delay on mobile.
 *
 * `format`/`parse` make MM:SS a purely formatting concern — the same
 * component handles counts (series, rounds) and durations (formatMmSs/parseMmSs).
 * Unlike the former DurationInput, the input exists only during editing,
 * so an external value change (loading from localStorage) has nothing to
 * collide with and no synchronizing useEffect is needed.
 */
export function NumberStepper({
  label,
  decreaseLabel,
  increaseLabel,
  value,
  onChange,
  min,
  max,
  step,
  format = String,
  parse = (raw) => {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  },
}: {
  label: string;
  /** aria-label of the −/+ buttons (localized); default "<label> −" / "<label> +". */
  decreaseLabel?: string;
  increaseLabel?: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step: number;
  /** Value display; defaults to String(value), formatMmSs for durations. */
  format?: (v: number) => string;
  /** Counterpart of `format` for tap-to-edit; returns null for invalid input. */
  parse?: (raw: string) => number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function startEditing() {
    setDraft(format(value));
    setEditing(true);
  }

  function commit(raw: string) {
    setEditing(false);
    const parsed = parse(raw.trim());
    if (parsed === null) return; // invalid input — the value stays unchanged
    onChange(Math.max(min, Math.min(max, parsed)));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-body">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          aria-label={decreaseLabel ?? `${label} −`}
          className={stepBtnClass}
        >
          −
        </button>

        {editing ? (
          <input
            type="text"
            inputMode={format === String ? "numeric" : "text"}
            value={draft}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commit(e.currentTarget.value);
              } else if (e.key === "Escape") {
                setEditing(false);
              }
            }}
            aria-label={label}
            className={valueInputClass}
          />
        ) : (
          <button type="button" onClick={startEditing} className={valueBtnClass}>
            {format(value)}
          </button>
        )}

        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          aria-label={increaseLabel ?? `${label} +`}
          className={stepBtnClass}
        >
          +
        </button>
      </div>
    </div>
  );
}
