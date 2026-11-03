"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NumberStepper } from "@/components/number-stepper";
import { fmt } from "@/i18n/format";
import { useToolMessages } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  clampConfig,
  countWords,
  DEFAULT_CONFIG,
  generate,
  LIMITS,
  parseStoredConfig,
  UNITS,
  type LoremConfig,
} from "@/lib/lorem-ipsum";

const STORAGE_KEY = "tools.lorem-ipsum.config.v1";

const cardClass = "rounded-2xl border border-border bg-card p-4";
const actionBtnClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-all duration-200 touch-manipulation disabled:pointer-events-none disabled:opacity-50";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-body">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-primary"
      />
      {label}
    </label>
  );
}

export function LoremGenerator() {
  const t = useToolMessages("lorem");
  // SSR-safe constant as initial state; random text is generated only after mount.
  const [config, setConfig] = useState<LoremConfig>(DEFAULT_CONFIG);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = parseStoredConfig(localStorage.getItem(STORAGE_KEY));
      if (stored) setConfig(stored);
    } catch {}
    setLoaded(true);
    return () => clearTimeout(copiedTimer.current);
  }, []);

  useEffect(() => {
    if (loaded) setText(generate(config));
  }, [config, loaded]);

  function updateConfig(patch: Partial<LoremConfig>) {
    const next = clampConfig({ ...config, ...patch });
    setConfig(next);
    setCopied(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  const regenerate = useCallback(() => {
    setText(generate(config));
    setCopied(false);
  }, [config]);

  async function copy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const countLabel = t.countLabels[config.unit];

  return (
    <div className="flex flex-col gap-6">
      <section className={cardClass}>
        <div
          className="max-h-96 min-h-24 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-4 text-base leading-relaxed text-foreground"
          aria-live="polite"
        >
          {text || " "}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!text}
            className={cn(
              actionBtnClass,
              "flex-1 bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-md",
            )}
          >
            {copied ? t.copied : t.copy}
          </button>
          <button
            type="button"
            onClick={regenerate}
            aria-label={t.regenerateAria}
            className={cn(actionBtnClass, "border border-border bg-card text-foreground hover:bg-muted")}
          >
            {t.regenerate}
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {fmt(t.stats, { words: countWords(text), chars: text.length })}
        </p>
      </section>

      <section className={cardClass}>
        <div
          role="tablist"
          aria-label={t.unitAria}
          className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1"
        >
          {UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              role="tab"
              aria-selected={config.unit === unit}
              onClick={() => updateConfig({ unit })}
              className={cn(
                "h-11 rounded-lg text-sm font-semibold transition touch-manipulation",
                config.unit === unit
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.units[unit]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <NumberStepper
            label={countLabel}
            decreaseLabel={fmt(t.stepper.decrease, { label: countLabel })}
            increaseLabel={fmt(t.stepper.increase, { label: countLabel })}
            value={config.count}
            onChange={(v) => updateConfig({ count: v })}
            min={LIMITS[config.unit].min}
            max={LIMITS[config.unit].max}
            step={1}
          />

          <div className="grid grid-cols-1">
            <Toggle
              label={t.startWithLorem}
              checked={config.startWithLorem}
              onChange={(v) => updateConfig({ startWithLorem: v })}
            />
            {config.unit === "paragraphs" && (
              <Toggle label={t.html} checked={config.html} onChange={(v) => updateConfig({ html: v })} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
