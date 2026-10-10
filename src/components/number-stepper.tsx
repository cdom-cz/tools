"use client";

import { useState } from "react";

const stepBtnClass =
  "flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-xl border border-border bg-card text-xl font-semibold text-foreground transition touch-manipulation active:scale-95 hover:bg-muted disabled:pointer-events-none disabled:opacity-35";

const valueBtnClass =
  "flex h-12 flex-1 items-center justify-center rounded-xl bg-muted/60 font-display text-2xl font-semibold tabular-nums text-foreground transition touch-manipulation hover:bg-muted";

const valueInputClass =
  "h-12 w-full rounded-xl border-2 border-ring bg-card text-center font-display text-2xl font-semibold tabular-nums text-foreground outline-none";

/**
 * Stepper −/+ s klepnutelnou hodnotou (tap-to-edit) — mobilní náhrada za
 * drobná <input type="number">. Tlačítka 48px (nad 44px minimem podle
 * doporučení pro dotykové ovládání), `touch-manipulation` ruší 300ms
 * prodlevu klepnutí na mobilu.
 *
 * `format`/`parse` dělají z MM:SS čistě formátovací záležitost — stejná
 * komponenta obsluhuje počty (série, kola) i délky (formatMmSs/parseMmSs).
 * Na rozdíl od bývalého DurationInput input existuje jen během editace,
 * takže externí změna hodnoty (načtení z localStorage) nemá s čím kolidovat
 * a není potřeba žádný synchronizační useEffect.
 */
export function NumberStepper({
  label,
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
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step: number;
  /** Zobrazení hodnoty; výchozí String(value), pro délky formatMmSs. */
  format?: (v: number) => string;
  /** Protějšek `format` pro tap-to-edit; vrátí null pro nesmyslný vstup. */
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
    if (parsed === null) return; // neplatný vstup — hodnota se nemění
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
          aria-label={`${label} — snížit`}
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
          aria-label={`${label} — zvýšit`}
          className={stepBtnClass}
        >
          +
        </button>
      </div>
    </div>
  );
}
