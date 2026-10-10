/**
 * Čistá doménová logika intervalového (HIIT) timeru. Bez Reactu a bez DOM —
 * drženo odděleně, aby běhová vrstva (use-interval-timer.ts) řešila jen
 * čas, zvuk a wake lock.
 *
 * Struktura: 1 trénink = N sérií, 1 série = M kol. Poslední kolo série nemá
 * pauzu mezi koly, poslední série nemá pauzu mezi sériemi.
 */

import { formatHuman, formatMmSs, parseMmSs } from "./time-format";

// Generické formátovače času žijí v time-format.ts (sdílí je i meditační timer).
export { formatHuman, formatMmSs, parseMmSs };

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

/** Fáze intervalu. Hodnoty anglicky, uživatelské texty přes PHASE_LABELS. */
export type Phase = "prepare" | "work" | "rest" | "seriesRest" | "done";

export type TimerConfig = {
  series: number; // počet sérií
  rounds: number; // počet kol v jedné sérii
  roundSeconds: number; // délka pracovního kola
  restBetweenRoundsSeconds: number; // pauza mezi koly
  restBetweenSeriesSeconds: number; // pauza mezi sériemi
  prepareSeconds: number; // přípravný odpočet na začátku
};

export type Segment = {
  phase: Exclude<Phase, "done">;
  seconds: number;
  /** 0-based index série, do které segment patří. */
  seriesIndex: number;
  /** 0-based index kola uvnitř série; -1 pro "prepare" / "seriesRest". */
  roundIndex: number;
};

/** Odvozený pohled na běh pro UI — jedno místo, kde se počítá "co se zobrazí". */
export type TimerView = {
  phase: Phase;
  phaseLabel: string;
  segmentSeconds: number;
  remaining: number;
  seriesNumber: number; // 1-based
  seriesTotal: number;
  roundNumber: number; // 1-based; 0 = neaplikovatelné (prepare/seriesRest)
  roundsTotal: number;
};

// ---------------------------------------------------------------------------
// Konstanty a labely
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG: TimerConfig = {
  series: 3,
  rounds: 8,
  roundSeconds: 30,
  restBetweenRoundsSeconds: 15,
  restBetweenSeriesSeconds: 60,
  prepareSeconds: 10,
};

export const PHASE_LABELS: Record<Phase, string> = {
  prepare: "Příprava",
  work: "Práce",
  rest: "Pauza",
  seriesRest: "Pauza mezi sériemi",
  done: "Hotovo",
};

/**
 * Tailwind třídy podle fáze. Statické stringy — Tailwind v4 scanner nevidí
 * dynamicky skládané názvy (stejná zásada jako CATEGORY_DOT_CLASS v tasks.ts).
 * Mapování: příprava šedá, práce červená, pauza modrá, pauza mezi sériemi zelená.
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

/** Jemné tónování pozadí overlaye podle fáze (opacity varianta). */
export const PHASE_GLOW_CLASS: Record<Phase, string> = {
  prepare: "bg-signal-extra/10",
  work: "bg-signal-main/10",
  rest: "bg-signal-medium/10",
  seriesRest: "bg-signal-other/10",
  done: "bg-signal-other/10",
};

// ---------------------------------------------------------------------------
// Limity a validace
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
 * Krok stepperu pro každé pole. Sekundy po 5 (rychlé doladění palcem),
 * série/kola po 1. Jemnější hodnoty jdou zadat klepnutím na číslo.
 */
export const STEPS: Record<keyof TimerConfig, number> = {
  series: 1,
  rounds: 1,
  roundSeconds: 5,
  restBetweenRoundsSeconds: 5,
  restBetweenSeriesSeconds: 5,
  prepareSeconds: 5,
};

/** Ořízne libovolný (i neznámý, např. z localStorage) vstup na platný config. */
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

/** Parsuje a ořízne config uložený v localStorage. Nikdy nevyhodí, nikdy nevrátí nesmysl. */
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
// buildSegments — jádro
// ---------------------------------------------------------------------------

/**
 * Rozvine config do plochého seznamu segmentů v pořadí přehrávání. Plochý
 * seznam převede běh na jednoduchý kurzor (index + zbývající čas) místo
 * vnořeného stavového automatu se dvěma čítači — zjednodušuje pause/resume,
 * skip i dopočet po návratu z pozadí.
 *
 * `rest` segment nese roundIndex právě DOKONČENÉHO kola (ne následujícího) —
 * indikátor kol tak během pauzy zvýrazní kolo, které právě skončilo, což
 * odpovídá tomu, jak to uživatel vnímá.
 *
 * Segmenty s nulovou délkou se do seznamu vůbec nevkládají — díky tomu
 * "pauza = 0" nevyžaduje žádné zvláštní ošetření v běhové logice.
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
// Helpery
// ---------------------------------------------------------------------------

/** Celková délka tréninku v sekundách. */
export function totalDuration(segments: Segment[]): number {
  return segments.reduce((sum, s) => sum + s.seconds, 0);
}

/** Počet pracovních kol celkem (série × kola) — pro souhrn v setupu. */
export function totalWorkRounds(config: TimerConfig): number {
  const c = clampConfig(config);
  return c.series * c.rounds;
}

/**
 * Odvodí "co se zobrazí" pro daný index segmentu a zbývající čas v něm.
 * Jedno místo, kde se počítá zobrazované číslo série/kola, aby se logika
 * neduplikovala v ProgressRing a ProgressDots.
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
      phaseLabel: PHASE_LABELS.done,
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
    phaseLabel: PHASE_LABELS[seg.phase],
    segmentSeconds: seg.seconds,
    remaining,
    seriesNumber: seg.seriesIndex + 1,
    seriesTotal: c.series,
    roundNumber: seg.roundIndex + 1,
    roundsTotal: c.rounds,
  };
}
