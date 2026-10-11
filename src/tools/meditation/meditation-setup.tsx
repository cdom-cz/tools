"use client";

import { useMemo } from "react";
import { fmt, plural } from "@/i18n/format";
import { useLocale, useToolMessages } from "@/i18n/provider";
import {
  addBlock,
  buildSegments,
  LIMITS,
  removeBlock,
  STEPS,
  totalDuration,
  type MeditationConfig,
} from "@/lib/meditation-timer";
import { formatHuman, formatMmSs, parseMmSs } from "@/lib/time-format";
import { NumberStepper } from "@/components/number-stepper";

/** Meditation setup form: a list of blocks (each with its own duration), settling at the start. */
export function MeditationSetup({
  config,
  onChange,
  onStart,
}: {
  config: MeditationConfig;
  onChange: (config: MeditationConfig) => void;
  onStart: () => void;
}) {
  const m = useToolMessages("meditation");
  const t = m.setup;
  const locale = useLocale();
  const segments = useMemo(() => buildSegments(config), [config]);
  const summary = fmt(t.summary, {
    blocks: config.blockSeconds.length,
    blockWord: plural(locale, m.blockWord, config.blockSeconds.length),
    duration: formatHuman(totalDuration(segments)),
  });

  function setBlock(index: number, value: number) {
    onChange({ ...config, blockSeconds: config.blockSeconds.map((v, i) => (i === index ? value : v)) });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4">
          {config.blockSeconds.map((seconds, i) => {
            const label = fmt(t.blockLabel, { n: i + 1 });
            return (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <NumberStepper
                    label={label}
                    decreaseLabel={fmt(m.stepper.decrease, { label })}
                    increaseLabel={fmt(m.stepper.increase, { label })}
                    value={seconds}
                    onChange={(v) => setBlock(i, v)}
                    min={LIMITS.blockSeconds.min}
                    max={LIMITS.blockSeconds.max}
                    step={STEPS.blockSeconds}
                    format={formatMmSs}
                    parse={parseMmSs}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange(removeBlock(config, i))}
                  disabled={config.blockSeconds.length <= LIMITS.blocks.min}
                  aria-label={fmt(t.removeBlock, { n: i + 1 })}
                  title={fmt(t.removeBlock, { n: i + 1 })}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-xl text-foreground transition touch-manipulation hover:bg-muted active:scale-95 disabled:pointer-events-none disabled:opacity-35"
                >
                  ×
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => onChange(addBlock(config))}
            disabled={config.blockSeconds.length >= LIMITS.blocks.max}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-dashed border-border text-sm font-semibold text-foreground transition touch-manipulation hover:bg-muted disabled:pointer-events-none disabled:opacity-35"
          >
            + {t.addBlock}
          </button>
          <NumberStepper
            label={t.prepare}
            decreaseLabel={fmt(m.stepper.decrease, { label: t.prepare })}
            increaseLabel={fmt(m.stepper.increase, { label: t.prepare })}
            value={config.prepareSeconds}
            onChange={(v) => onChange({ ...config, prepareSeconds: v })}
            min={LIMITS.prepareSeconds.min}
            max={LIMITS.prepareSeconds.max}
            step={STEPS.prepareSeconds}
            format={formatMmSs}
            parse={parseMmSs}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {t.note}
        </p>
      </section>

      {/* Sticky bar as in timer-setup.tsx (-mx-4 cancels the px-4 of <main>). */}
      <div
        className="sticky bottom-0 -mx-4 border-t border-border bg-card/95 px-4 pt-3 backdrop-blur-md"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <p className="mb-2 text-center text-sm text-muted-foreground">{fmt(t.total, { summary })}</p>
        <button
          type="button"
          onClick={onStart}
          disabled={segments.length === 0}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground transition-all duration-200 touch-manipulation hover:bg-primary-hover hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
        >
          {t.startButton}
        </button>
      </div>
    </div>
  );
}
