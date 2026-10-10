"use client";

import { useMemo } from "react";
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

/** Formulář nastavení intervalu — steppery seskupené podle smyslu (struktura → délky → start). */
export function TimerSetup({
  config,
  onChange,
  onStart,
}: {
  config: TimerConfig;
  onChange: (config: TimerConfig) => void;
  onStart: () => void;
}) {
  const segments = useMemo(() => buildSegments(config), [config]);
  const summary = useMemo(
    () => `${totalWorkRounds(config)} kol · celkem ${formatHuman(totalDuration(segments))}`,
    [config, segments],
  );

  function set<K extends keyof TimerConfig>(key: K, value: TimerConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-card p-4">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-semibold text-foreground">Struktura</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberStepper
              label="Počet sérií"
              value={config.series}
              onChange={(v) => set("series", v)}
              min={LIMITS.series.min}
              max={LIMITS.series.max}
              step={STEPS.series}
            />
            <NumberStepper
              label="Kol v sérii"
              value={config.rounds}
              onChange={(v) => set("rounds", v)}
              min={LIMITS.rounds.min}
              max={LIMITS.rounds.max}
              step={STEPS.rounds}
            />
          </div>
        </fieldset>

        <fieldset className="mt-6 flex flex-col gap-4">
          <legend className="mb-1 text-sm font-semibold text-foreground">Délky</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberStepper
              label="Délka kola"
              value={config.roundSeconds}
              onChange={(v) => set("roundSeconds", v)}
              min={LIMITS.roundSeconds.min}
              max={LIMITS.roundSeconds.max}
              step={STEPS.roundSeconds}
              format={formatMmSs}
              parse={parseMmSs}
            />
            <NumberStepper
              label="Pauza mezi koly"
              value={config.restBetweenRoundsSeconds}
              onChange={(v) => set("restBetweenRoundsSeconds", v)}
              min={LIMITS.restBetweenRoundsSeconds.min}
              max={LIMITS.restBetweenRoundsSeconds.max}
              step={STEPS.restBetweenRoundsSeconds}
              format={formatMmSs}
              parse={parseMmSs}
            />
            <NumberStepper
              label="Pauza mezi sériemi"
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
          <legend className="mb-1 text-sm font-semibold text-foreground">Start</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberStepper
              label="Příprava na začátku"
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
        Lepkavá lišta, ne fixed — zůstává v toku dokumentu, takže nemůže
        zakrýt poslední pole a na vysokém desktopovém viewportu degraduje
        na obyčejnou patičku. -mx-4 ruší px-4 z <main> v layout.tsx, aby
        lišta i její horní linka šly přes celou šířku. Odsazení dole podle
        vzoru spodní lišty v timer-overlay.tsx (env pro home indicator na iOS).
      */}
      <div
        className="sticky bottom-0 -mx-4 border-t border-border bg-card/95 px-4 pt-3 backdrop-blur-md"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <p className="mb-2 text-center text-sm text-muted-foreground">Celkem: {summary}</p>
        <button
          type="button"
          onClick={onStart}
          disabled={segments.length === 0}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground transition-all duration-200 touch-manipulation hover:bg-primary-hover hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
        >
          Spustit
        </button>
      </div>
    </div>
  );
}
