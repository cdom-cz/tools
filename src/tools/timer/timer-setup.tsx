"use client";

import { useMemo } from "react";
import { fmt, plural } from "@/i18n/format";
import { useLocale, useToolMessages } from "@/i18n/provider";
import {
  buildSegments,
  formatHuman,
  formatMmSs,
  LIMITS,
  parseMmSs,
  STEPS,
  totalDuration,
  totalWorkRounds,
  type TimerConfig,
} from "@/lib/interval-timer";
import { NumberStepper } from "@/components/number-stepper";

/** Interval setup form — steppers grouped by meaning (structure → durations → start). */
export function TimerSetup({
  config,
  onChange,
  onStart,
}: {
  config: TimerConfig;
  onChange: (config: TimerConfig) => void;
  onStart: () => void;
}) {
  const m = useToolMessages("timer");
  const t = m.setup;
  const locale = useLocale();
  const segments = useMemo(() => buildSegments(config), [config]);
  const summary = useMemo(
    () =>
      fmt(t.summary, {
        rounds: totalWorkRounds(config),
        roundsWord: plural(locale, m.roundsWord, totalWorkRounds(config)),
        duration: formatHuman(totalDuration(segments)),
      }),
    [config, segments, t, m.roundsWord, locale],
  );

  function set<K extends keyof TimerConfig>(key: K, value: TimerConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-card p-4">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-semibold text-foreground">{t.structure}</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberStepper
              label={t.seriesCount}
              decreaseLabel={fmt(m.stepper.decrease, { label: t.seriesCount })}
              increaseLabel={fmt(m.stepper.increase, { label: t.seriesCount })}
              value={config.series}
              onChange={(v) => set("series", v)}
              min={LIMITS.series.min}
              max={LIMITS.series.max}
              step={STEPS.series}
            />
            <NumberStepper
              label={t.roundsPerSeries}
              decreaseLabel={fmt(m.stepper.decrease, { label: t.roundsPerSeries })}
              increaseLabel={fmt(m.stepper.increase, { label: t.roundsPerSeries })}
              value={config.rounds}
              onChange={(v) => set("rounds", v)}
              min={LIMITS.rounds.min}
              max={LIMITS.rounds.max}
              step={STEPS.rounds}
            />
          </div>
        </fieldset>

        <fieldset className="mt-6 flex flex-col gap-4">
          <legend className="mb-1 text-sm font-semibold text-foreground">{t.lengths}</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberStepper
              label={t.roundLength}
              decreaseLabel={fmt(m.stepper.decrease, { label: t.roundLength })}
              increaseLabel={fmt(m.stepper.increase, { label: t.roundLength })}
              value={config.roundSeconds}
              onChange={(v) => set("roundSeconds", v)}
              min={LIMITS.roundSeconds.min}
              max={LIMITS.roundSeconds.max}
              step={STEPS.roundSeconds}
              format={formatMmSs}
              parse={parseMmSs}
            />
            <NumberStepper
              label={t.restBetweenRounds}
              decreaseLabel={fmt(m.stepper.decrease, { label: t.restBetweenRounds })}
              increaseLabel={fmt(m.stepper.increase, { label: t.restBetweenRounds })}
              value={config.restBetweenRoundsSeconds}
              onChange={(v) => set("restBetweenRoundsSeconds", v)}
              min={LIMITS.restBetweenRoundsSeconds.min}
              max={LIMITS.restBetweenRoundsSeconds.max}
              step={STEPS.restBetweenRoundsSeconds}
              format={formatMmSs}
              parse={parseMmSs}
            />
            <NumberStepper
              label={t.restBetweenSeries}
              decreaseLabel={fmt(m.stepper.decrease, { label: t.restBetweenSeries })}
              increaseLabel={fmt(m.stepper.increase, { label: t.restBetweenSeries })}
              value={config.restBetweenSeriesSeconds}
              onChange={(v) => set("restBetweenSeriesSeconds", v)}
              min={LIMITS.restBetweenSeriesSeconds.min}
              max={LIMITS.restBetweenSeriesSeconds.max}
              step={STEPS.restBetweenSeriesSeconds}
              format={formatMmSs}
              parse={parseMmSs}
            />
          </div>
        </fieldset>

        <fieldset className="mt-6 flex flex-col gap-4">
          <legend className="mb-1 text-sm font-semibold text-foreground">{t.start}</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </fieldset>
      </section>

      {/*
        Sticky bar, not fixed — stays in the document flow, so it cannot
        cover the last field and degrades to a plain footer on a tall
        desktop viewport. -mx-4 cancels the px-4 of <main> in layout.tsx so
        the bar and its top border span the full width. Bottom padding follows
        the bottom bar in timer-overlay.tsx (env for the iOS home indicator).
      */}
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
