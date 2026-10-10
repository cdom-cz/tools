/**
 * Pure domain logic of the interval (HIIT) timer. No React, no DOM —
 * kept separate so the runtime layer (use-interval-timer.ts) only deals
 * with time, sound and wake lock.
 *
 * Structure: 1 workout = N series, 1 series = M rounds. The last round of a
 * series has no rest between rounds, the last series has no rest between series.
 */

import { formatHuman, formatMmSs, parseMmSs } from "./time-format";

// Generic time formatters live in time-format.ts (shared with the meditation timer).
export { formatHuman, formatMmSs, parseMmSs };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Interval phase. Values are English, user-facing texts live in the i18n dictionary (timer.phases). */
export type Phase = "prepare" | "work" | "rest" | "seriesRest" | "done";

export type TimerConfig = {
  series: number; // number of series
  rounds: number; // number of rounds in one series
  roundSeconds: number; // duration of a work round
  restBetweenRoundsSeconds: number; // rest between rounds
  restBetweenSeriesSeconds: number; // rest between series
  prepareSeconds: number; // get-ready countdown at the start
};

export type Segment = {
  phase: Exclude<Phase, "done">;
  seconds: number;
  /** 0-based index of the series the segment belongs to. */
  seriesIndex: number;
  /** 0-based index of the round within the series; -1 for "prepare" / "seriesRest". */
  roundIndex: number;
};

/** Derived view of the run for the UI — the single place that computes "what is displayed". */
export type TimerView = {
  phase: Phase;
  segmentSeconds: number;
  remaining: number;
  seriesNumber: number; // 1-based
  seriesTotal: number;
  roundNumber: number; // 1-based; 0 = not applicable (prepare/seriesRest)
  roundsTotal: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG: TimerConfig = {
  series: 3,
  rounds: 8,
  roundSeconds: 30,
  restBetweenRoundsSeconds: 15,
  restBetweenSeriesSeconds: 60,
  prepareSeconds: 10,
};

/**
 * Tailwind classes per phase. Static strings — the Tailwind v4 scanner does not
 * see dynamically composed names (same rule as CATEGORY_DOT_CLASS in tasks.ts).
 * Mapping: prepare gray, work red, rest blue, rest between series green.
 */
export const PHASE_TEXT_CLASS: Record<Phase, string> = {
  prepare: "text-signal-extra",
  work: "text-signal-main",
  rest: "text-signal-medium",
  seriesRest: "text-signal-other",
  done: "text-signal-other",
};

export const PHASE_STROKE_CLASS: Record<Phase, string> = {
  prepare: "stroke-signal-extra",
  work: "stroke-signal-main",
  rest: "stroke-signal-medium",
  seriesRest: "stroke-signal-other",
  done: "stroke-signal-other",
};

export const PHASE_BG_CLASS: Record<Phase, string> = {
  prepare: "bg-signal-extra",
  work: "bg-signal-main",
  rest: "bg-signal-medium",
  seriesRest: "bg-signal-other",
  done: "bg-signal-other",
};

export const PHASE_BORDER_CLASS: Record<Phase, string> = {
  prepare: "border-signal-extra",
  work: "border-signal-main",
  rest: "border-signal-medium",
  seriesRest: "border-signal-other",
  done: "border-signal-other",
};

/** Subtle overlay background tint per phase (opacity variant). */
export const PHASE_GLOW_CLASS: Record<Phase, string> = {
  prepare: "bg-signal-extra/10",
  work: "bg-signal-main/10",
  rest: "bg-signal-medium/10",
  seriesRest: "bg-signal-other/10",
  done: "bg-signal-other/10",
};

// ---------------------------------------------------------------------------
// Limits and validation
// ---------------------------------------------------------------------------

export const LIMITS = {
  series: { min: 1, max: 20 },
  rounds: { min: 1, max: 30 },
  roundSeconds: { min: 1, max: 3600 },
  restBetweenRoundsSeconds: { min: 0, max: 3600 },
  restBetweenSeriesSeconds: { min: 0, max: 3600 },
  prepareSeconds: { min: 0, max: 600 },
} as const;

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * Stepper step for each field. Seconds by 5 (quick thumb tuning),
 * series/rounds by 1. Finer values can be entered by tapping the number.
 */
export const STEPS: Record<keyof TimerConfig, number> = {
  series: 1,
  rounds: 1,
  roundSeconds: 5,
  restBetweenRoundsSeconds: 5,
  restBetweenSeriesSeconds: 5,
  prepareSeconds: 5,
};

/** Clamps any input (even unknown, e.g. from localStorage) to a valid config. */
export function clampConfig(input: unknown): TimerConfig {
  const src = (input && typeof input === "object" ? input : {}) as Partial<TimerConfig>;
  return {
    series: clampInt(src.series, LIMITS.series.min, LIMITS.series.max, DEFAULT_CONFIG.series),
    rounds: clampInt(src.rounds, LIMITS.rounds.min, LIMITS.rounds.max, DEFAULT_CONFIG.rounds),
    roundSeconds: clampInt(
      src.roundSeconds,
      LIMITS.roundSeconds.min,
      LIMITS.roundSeconds.max,
      DEFAULT_CONFIG.roundSeconds,
    ),
    restBetweenRoundsSeconds: clampInt(
      src.restBetweenRoundsSeconds,
      LIMITS.restBetweenRoundsSeconds.min,
      LIMITS.restBetweenRoundsSeconds.max,
      DEFAULT_CONFIG.restBetweenRoundsSeconds,
    ),
    restBetweenSeriesSeconds: clampInt(
      src.restBetweenSeriesSeconds,
      LIMITS.restBetweenSeriesSeconds.min,
      LIMITS.restBetweenSeriesSeconds.max,
      DEFAULT_CONFIG.restBetweenSeriesSeconds,
    ),
    prepareSeconds: clampInt(
      src.prepareSeconds,
      LIMITS.prepareSeconds.min,
      LIMITS.prepareSeconds.max,
      DEFAULT_CONFIG.prepareSeconds,
    ),
  };
}

/** Parses and clamps a config stored in localStorage. Never throws, never returns nonsense. */
export function parseStoredConfig(raw: string | null): TimerConfig | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return clampConfig(parsed);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// buildSegments — the core
// ---------------------------------------------------------------------------

/**
 * Expands the config into a flat list of segments in playback order. A flat
 * list turns the run into a simple cursor (index + remaining time) instead of
 * a nested state machine with two counters — it simplifies pause/resume,
 * skip and catch-up after returning from the background.
 *
 * A `rest` segment carries the roundIndex of the round that has just FINISHED
 * (not the next one) — so during the rest the round indicator highlights the
 * round that just ended, which matches how the user perceives it.
 *
 * Zero-length segments are not inserted at all — so "rest = 0" needs no
 * special handling in the runtime logic.
 */
export function buildSegments(config: TimerConfig): Segment[] {
  const c = clampConfig(config);
  const out: Segment[] = [];

  if (c.prepareSeconds > 0) {
    out.push({ phase: "prepare", seconds: c.prepareSeconds, seriesIndex: 0, roundIndex: -1 });
  }

  for (let s = 0; s < c.series; s++) {
    for (let r = 0; r < c.rounds; r++) {
      out.push({ phase: "work", seconds: c.roundSeconds, seriesIndex: s, roundIndex: r });

      const isLastRound = r === c.rounds - 1;
      if (!isLastRound && c.restBetweenRoundsSeconds > 0) {
        out.push({
          phase: "rest",
          seconds: c.restBetweenRoundsSeconds,
          seriesIndex: s,
          roundIndex: r,
        });
      }
    }

    const isLastSeries = s === c.series - 1;
    if (!isLastSeries && c.restBetweenSeriesSeconds > 0) {
      out.push({
        phase: "seriesRest",
        seconds: c.restBetweenSeriesSeconds,
        seriesIndex: s,
        roundIndex: -1,
      });
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Total workout duration in seconds. */
export function totalDuration(segments: Segment[]): number {
  return segments.reduce((sum, s) => sum + s.seconds, 0);
}

/** Total number of work rounds (series × rounds) — for the summary in setup. */
export function totalWorkRounds(config: TimerConfig): number {
  const c = clampConfig(config);
  return c.series * c.rounds;
}

/**
 * Derives "what is displayed" for the given segment index and the time remaining
 * in it. The single place that computes the displayed series/round number, so the
 * logic is not duplicated in ProgressRing and ProgressDots.
 */
export function viewAt(
  segments: Segment[],
  config: TimerConfig,
  index: number,
  remaining: number,
): TimerView {
  const c = clampConfig(config);
  const seg = segments[index];

  if (!seg) {
    return {
      phase: "done",
      segmentSeconds: 0,
      remaining: 0,
      seriesNumber: c.series,
      seriesTotal: c.series,
      roundNumber: c.rounds,
      roundsTotal: c.rounds,
    };
  }

  return {
    phase: seg.phase,
    segmentSeconds: seg.seconds,
    remaining,
    seriesNumber: seg.seriesIndex + 1,
    seriesTotal: c.series,
    roundNumber: seg.roundIndex + 1,
    roundsTotal: c.rounds,
  };
}
