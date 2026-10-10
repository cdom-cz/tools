"use client";

import { useMemo } from "react";
import { fmt, plural } from "@/i18n/format";
import { useLocale, useToolMessages } from "@/i18n/provider";
import {
  buildSegments,
  LIMITS,
  STEPS,
  totalDuration,
  type MeditationConfig,
} from "@/lib/meditation-timer";
import { formatHuman, formatMmSs, parseMmSs } from "@/lib/time-format";
import { NumberStepper } from "@/components/number-stepper";

/** Meditation setup form: number of blocks, block duration, settling at the start. */
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
    blocks: config.blocks,
    blockWord: plural(locale, m.blockWord, config.blocks),
    duration: formatHuman(totalDuration(segments)),
  });

  function set<K extends keyof MeditationConfig>(key: K, value: MeditationConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberStepper
            label={t.blocks}
            decreaseLabel={fmt(m.stepper.decrease, { label: t.blocks })}
            increaseLabel={fmt(m.stepper.increase, { label: t.blocks })}
            value={config.blocks}
            onChange={(v) => set("blocks", v)}
            min={LIMITS.blocks.min}
            max={LIMITS.blocks.max}
            step={STEPS.blocks}
          />
          <NumberStepper
            label={t.blockLength}
            decreaseLabel={fmt(m.stepper.decrease, { label: t.blockLength })}
            increaseLabel={fmt(m.stepper.increase, { label: t.blockLength })}
            value={config.blockSeconds}
            onChange={(v) => set("blockSeconds", v)}
            min={LIMITS.blockSeconds.min}
            max={LIMITS.blockSeconds.max}
            step={STEPS.blockSeconds}
            format={formatMmSs}
            parse={parseMmSs}
          />
          <NumberStepper
            label={t.prepare}
            decreaseLabel={fmt(m.stepper.decrease, { label: t.prepare })}
            increaseLabel={fmt(m.stepper.increase, { label: t.prepare })}
            value={config.prepareSeconds}
            onChange={(v) => set("prepareSeconds", v)}
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
