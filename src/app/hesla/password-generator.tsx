"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NumberStepper } from "@/components/number-stepper";
import { cn } from "@/lib/utils";
import {
  clampConfig,
  DEFAULT_CONFIG,
  estimateEntropyBits,
  generate,
  LIMITS,
  parseStoredConfig,
  SEPARATORS,
  strengthLabel,
  type PasswordConfig,
  type StrengthLevel,
} from "@/lib/password-generator";

const STORAGE_KEY = "tools.hesla.config.v1";

const cardClass = "rounded-2xl border border-border bg-card p-4";
const actionBtnClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-all duration-200 touch-manipulation disabled:pointer-events-none disabled:opacity-50";

// Třídy musí být statické řetězce (Tailwind), proto mapa místo skládání.
const STRENGTH_BAR: Record<StrengthLevel, string> = {
  0: "bg-destructive",
  1: "bg-warning",
  2: "bg-success",
  3: "bg-primary",
};
const STRENGTH_WIDTH: Record<StrengthLevel, string> = {
  0: "w-1/4",
  1: "w-2/4",
  2: "w-3/4",
  3: "w-full",
};

const CHARSET_OPTIONS = [
  { key: "lower", label: "Malá písmena (a–z)" },
  { key: "upper", label: "Velká písmena (A–Z)" },
  { key: "digits", label: "Číslice (0–9)" },
  { key: "symbols", label: "Symboly (!@#…)" },
] as const;

const SEPARATOR_LABELS: Record<(typeof SEPARATORS)[number], string> = {
  "-": "pomlčka",
  " ": "mezera",
  ".": "tečka",
  _: "podtržítko",
};

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

export function PasswordGenerator() {
  // SSR-safe konstanta jako initial state (vzor timer-screen.tsx).
  const [config, setConfig] = useState<PasswordConfig>(DEFAULT_CONFIG);
  const [password, setPassword] = useState("");
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

  // Heslo se generuje až v prohlížeči po načtení configu (crypto v SSR → hydration mismatch).
  useEffect(() => {
    if (loaded) setPassword(generate(config));
  }, [config, loaded]);

  function updateConfig(patch: Partial<PasswordConfig>) {
    const next = clampConfig({ ...config, ...patch });
    setConfig(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  const regenerate = useCallback(() => {
    setPassword(generate(config));
    setCopied(false);
  }, [config]);

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const bits = estimateEntropyBits(config);
  const strength = strengthLabel(bits);
  const noCharset = config.mode === "chars" && !password && loaded;

  return (
    <div className="flex flex-col gap-6">
      <section className={cardClass}>
        <div
          className="min-h-20 break-all rounded-xl bg-muted/60 p-4 font-mono text-xl leading-relaxed text-foreground"
          aria-live="polite"
        >
          {noCharset ? (
            <span className="text-sm text-muted-foreground">Vyber aspoň jednu sadu znaků.</span>
          ) : (
            password || " "
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!password}
            className={cn(
              actionBtnClass,
              "flex-1 bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-md",
            )}
          >
            {copied ? "Zkopírováno ✓" : "Kopírovat"}
          </button>
          <button
            type="button"
            onClick={regenerate}
            disabled={noCharset}
            aria-label="Vygenerovat nové"
            className={cn(actionBtnClass, "border border-border bg-card text-foreground hover:bg-muted")}
          >
            ↻ Nové
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{bits > 0 ? strength.label : "—"}</span>
            <span className="text-muted-foreground">≈ {Math.round(bits)} bitů</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className={cn(
                "h-full rounded-full transition-all",
                bits > 0 ? STRENGTH_BAR[strength.level] : "",
                bits > 0 ? STRENGTH_WIDTH[strength.level] : "w-0",
              )}
            />
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <div
          role="tablist"
          aria-label="Režim"
          className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1"
        >
          {(
            [
              ["chars", "Znaky"],
              ["words", "Slova"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={config.mode === mode}
              onClick={() => updateConfig({ mode })}
              className={cn(
                "h-11 rounded-lg text-sm font-semibold transition touch-manipulation",
                config.mode === mode
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {config.mode === "chars" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="pw-length" className="text-sm font-medium text-body">
                  Délka
                </label>
                <span className="font-display text-lg font-semibold tabular-nums text-foreground">
                  {config.length}
                </span>
              </div>
              <input
                id="pw-length"
                type="range"
                min={LIMITS.length.min}
                max={LIMITS.length.max}
                value={config.length}
                onChange={(e) => updateConfig({ length: Number(e.target.value) })}
                className="h-8 w-full accent-primary touch-manipulation"
              />
            </div>

            <fieldset className="grid grid-cols-1 sm:grid-cols-2">
              <legend className="mb-1 text-sm font-semibold text-foreground">Sady znaků</legend>
              {CHARSET_OPTIONS.map(({ key, label }) => (
                <Toggle
                  key={key}
                  label={label}
                  checked={config[key]}
                  onChange={(v) => updateConfig({ [key]: v })}
                />
              ))}
            </fieldset>

            <Toggle
              label="Vynechat podobné znaky (0 O 1 l I |)"
              checked={config.excludeAmbiguous}
              onChange={(v) => updateConfig({ excludeAmbiguous: v })}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <NumberStepper
              label="Počet slov"
              value={config.wordCount}
              onChange={(v) => updateConfig({ wordCount: v })}
              min={LIMITS.wordCount.min}
              max={LIMITS.wordCount.max}
              step={1}
            />

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium text-body">Oddělovač</legend>
              <div className="flex flex-wrap gap-2">
                {SEPARATORS.map((sep) => (
                  <button
                    key={sep}
                    type="button"
                    aria-pressed={config.separator === sep}
                    onClick={() => updateConfig({ separator: sep })}
                    className={cn(
                      "h-11 rounded-full border px-4 text-sm font-medium transition touch-manipulation",
                      config.separator === sep
                        ? "border-primary bg-primary-light text-foreground"
                        : "border-border bg-card text-body hover:bg-muted",
                    )}
                  >
                    {SEPARATOR_LABELS[sep]}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2">
              <Toggle
                label="Velká první písmena"
                checked={config.capitalize}
                onChange={(v) => updateConfig({ capitalize: v })}
              />
              <Toggle
                label="Přidat číslici"
                checked={config.addNumber}
                onChange={(v) => updateConfig({ addNumber: v })}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
