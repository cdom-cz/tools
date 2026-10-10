/**
 * Čistá doménová logika meditačního timeru. Bez Reactu a bez DOM — běhová
 * vrstva (app/meditace/use-meditation-timer.ts) řeší jen čas, zvuk a wake lock.
 *
 * Struktura: volitelné tiché usazení + N bloků stejné délky. Gong zní na
 * konci každého segmentu; konec posledního bloku je trojitý gong.
 */

export type MeditationPhase = "prepare" | "block" | "done";

export type MeditationConfig = {
  blocks: number; // počet bloků
  blockSeconds: number; // délka jednoho bloku
  prepareSeconds: number; // tiché usazení na začátku (0 = vypnuto)
};

export type MeditationSegment = {
  phase: Exclude<MeditationPhase, "done">;
  seconds: number;
  /** 0-based index bloku; -1 pro "prepare". */
  blockIndex: number;
};

export const DEFAULT_CONFIG: MeditationConfig = {
  blocks: 3,
  blockSeconds: 600,
  prepareSeconds: 10,
};

export const PHASE_LABELS: Record<MeditationPhase, string> = {
  prepare: "Usazení",
  block: "Meditace",
  done: "Hotovo",
};

/** Statické Tailwind třídy (scanner nevidí dynamicky skládané názvy). */
export const PHASE_STROKE_CLASS: Record<MeditationPhase, string> = {
  prepare: "stroke-signal-extra",
  block: "stroke-signal-medium",
  done: "stroke-signal-other",
};

export const PHASE_TEXT_CLASS: Record<MeditationPhase, string> = {
  prepare: "text-signal-extra",
  block: "text-signal-medium",
  done: "text-signal-other",
};

export const PHASE_GLOW_CLASS: Record<MeditationPhase, string> = {
  prepare: "bg-signal-extra/10",
  block: "bg-signal-medium/10",
  done: "bg-signal-other/10",
};

export const LIMITS = {
  blocks: { min: 1, max: 20 },
  blockSeconds: { min: 10, max: 7200 },
  prepareSeconds: { min: 0, max: 600 },
} as const;

export const STEPS: Record<keyof MeditationConfig, number> = {
  blocks: 1,
  blockSeconds: 60,
  prepareSeconds: 5,
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Ořízne libovolný (i neznámý, např. z localStorage) vstup na platný config. */
export function clampConfig(input: unknown): MeditationConfig {
  const src = (input && typeof input === "object" ? input : {}) as Partial<MeditationConfig>;
  return {
    blocks: clampInt(src.blocks, LIMITS.blocks.min, LIMITS.blocks.max, DEFAULT_CONFIG.blocks),
    blockSeconds: clampInt(
      src.blockSeconds,
      LIMITS.blockSeconds.min,
      LIMITS.blockSeconds.max,
      DEFAULT_CONFIG.blockSeconds,
    ),
    prepareSeconds: clampInt(
      src.prepareSeconds,
      LIMITS.prepareSeconds.min,
      LIMITS.prepareSeconds.max,
      DEFAULT_CONFIG.prepareSeconds,
    ),
  };
}

/** Parsuje a ořízne config uložený v localStorage. Nikdy nevyhodí. */
export function parseStoredConfig(raw: string | null): MeditationConfig | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return clampConfig(parsed);
  } catch {
    return null;
  }
}

/** Rozvine config do plochého seznamu segmentů v pořadí přehrávání. */
export function buildSegments(config: MeditationConfig): MeditationSegment[] {
  const c = clampConfig(config);
  const out: MeditationSegment[] = [];
  if (c.prepareSeconds > 0) {
    out.push({ phase: "prepare", seconds: c.prepareSeconds, blockIndex: -1 });
  }
  for (let b = 0; b < c.blocks; b++) {
    out.push({ phase: "block", seconds: c.blockSeconds, blockIndex: b });
  }
  return out;
}

export function totalDuration(segments: MeditationSegment[]): number {
  return segments.reduce((sum, s) => sum + s.seconds, 0);
}

/** Odvozený pohled na běh pro UI. */
export type MeditationView = {
  phase: MeditationPhase;
  phaseLabel: string;
  segmentSeconds: number;
  remaining: number;
  blockNumber: number; // 1-based; 0 během usazení
  blocksTotal: number;
};

export function viewAt(
  segments: MeditationSegment[],
  config: MeditationConfig,
  index: number,
  remaining: number,
): MeditationView {
  const c = clampConfig(config);
  const seg = segments[index];
  if (!seg) {
    return {
      phase: "done",
      phaseLabel: PHASE_LABELS.done,
      segmentSeconds: 0,
      remaining: 0,
      blockNumber: c.blocks,
      blocksTotal: c.blocks,
    };
  }
  return {
    phase: seg.phase,
    phaseLabel: PHASE_LABELS[seg.phase],
    segmentSeconds: seg.seconds,
    remaining,
    blockNumber: seg.blockIndex + 1,
    blocksTotal: c.blocks,
  };
}

/** Správný tvar podstatného jména: 1 blok, 2–4 bloky, 5+ bloků. */
export function blocksLabel(n: number): string {
  if (n === 1) return "blok";
  if (n >= 2 && n <= 4) return "bloky";
  return "bloků";
}
