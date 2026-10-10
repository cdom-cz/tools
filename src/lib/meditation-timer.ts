/**
 * Pure domain logic of the meditation timer. No React, no DOM — the runtime
 * layer (tools/meditation/use-meditation-timer.ts) only deals with time, sound
 * and wake lock.
 *
 * Structure: optional silent settling + N blocks of equal length. A gong
 * sounds at the end of each segment; the end of the last block is a triple gong.
 */

export type MeditationPhase = "prepare" | "block" | "done";

export type MeditationConfig = {
  blocks: number; // number of blocks
  blockSeconds: number; // duration of one block
  prepareSeconds: number; // silent settling at the start (0 = off)
};

export type MeditationSegment = {
  phase: Exclude<MeditationPhase, "done">;
  seconds: number;
  /** 0-based block index; -1 for "prepare". */
  blockIndex: number;
};

export const DEFAULT_CONFIG: MeditationConfig = {
  blocks: 3,
  blockSeconds: 600,
  prepareSeconds: 10,
};

/** Static Tailwind classes (the scanner does not see dynamically composed names). */
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

/** Clamps any input (even unknown, e.g. from localStorage) to a valid config. */
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

/** Parses and clamps a config stored in localStorage. Never throws. */
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

/** Expands the config into a flat list of segments in playback order. */
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

/** Derived view of the run for the UI. */
export type MeditationView = {
  phase: MeditationPhase;
  segmentSeconds: number;
  remaining: number;
  blockNumber: number; // 1-based; 0 during settling
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
      segmentSeconds: 0,
      remaining: 0,
      blockNumber: c.blocks,
      blocksTotal: c.blocks,
    };
  }
  return {
    phase: seg.phase,
    segmentSeconds: seg.seconds,
    remaining,
    blockNumber: seg.blockIndex + 1,
    blocksTotal: c.blocks,
  };
}
