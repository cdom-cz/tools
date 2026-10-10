/**
 * Password generator — pure logic (no React/DOM). Randomness comes exclusively
 * from `crypto.getRandomValues`, never `Math.random`.
 */
import type { Locale } from "@/i18n/config";
import { WORDS } from "./czech-words";
import { WORDS_EN } from "./english-words";

/** Passphrase word list by UI language. */
export const WORDS_BY_LOCALE: Record<Locale, readonly string[]> = {
  cs: WORDS,
  en: WORDS_EN,
};

export type Mode = "chars" | "words";

export const SEPARATORS = ["-", " ", ".", "_"] as const;
export type Separator = (typeof SEPARATORS)[number];

export type PasswordConfig = {
  mode: Mode;
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  wordCount: number;
  separator: Separator;
  capitalize: boolean;
  addNumber: boolean;
};

export const DEFAULT_CONFIG: PasswordConfig = {
  mode: "chars",
  length: 20,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
  wordCount: 5,
  separator: "-",
  capitalize: false,
  addNumber: false,
};

export const LIMITS = {
  length: { min: 8, max: 128 },
  wordCount: { min: 3, max: 10 },
} as const;

// ---------------------------------------------------------------------------
// Character sets
// ---------------------------------------------------------------------------

const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
} as const;

/** Visually ambiguous characters (0/O, 1/l/I, |). */
const AMBIGUOUS = new Set("0Oo1lI|");

type CharsetKey = keyof typeof CHARSETS;
const CHARSET_KEYS: readonly CharsetKey[] = ["lower", "upper", "digits", "symbols"];

/** Active sets (after dropping ambiguous characters); empty sets are discarded. */
function activeCharsets(config: PasswordConfig): string[] {
  return CHARSET_KEYS.filter((k) => config[k])
    .map((k) =>
      config.excludeAmbiguous
        ? Array.from(CHARSETS[k])
            .filter((c) => !AMBIGUOUS.has(c))
            .join("")
        : CHARSETS[k],
    )
    .filter((s) => s.length > 0);
}

// ---------------------------------------------------------------------------
// Randomness
// ---------------------------------------------------------------------------

export type Rng = (buf: Uint32Array) => void;

const defaultRng: Rng = (buf) => {
  crypto.getRandomValues(buf);
};

/** Uniform integer from [0, max) — rejection sampling, no modulo bias. */
export function randomInt(max: number, rng: Rng = defaultRng): number {
  if (!Number.isInteger(max) || max <= 0 || max > 0x100000000) {
    throw new RangeError("max must be an integer between 1 and 2^32");
  }
  const buf = new Uint32Array(1);
  const limit = 0x100000000 - (0x100000000 % max);
  do {
    rng(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function pick<T>(items: ArrayLike<T>, rng: Rng): T {
  return items[randomInt(items.length, rng)];
}

/** Fisher–Yates shuffle on a copy of the array. */
function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Config validation (pattern from interval-timer.ts)
// ---------------------------------------------------------------------------

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Clamps arbitrary (even unknown, e.g. from localStorage) input to a valid config. */
export function clampConfig(input: unknown): PasswordConfig {
  const src = (input && typeof input === "object" ? input : {}) as Partial<
    Record<keyof PasswordConfig, unknown>
  >;
  const d = DEFAULT_CONFIG;
  return {
    mode: src.mode === "words" || src.mode === "chars" ? src.mode : d.mode,
    length: clampInt(src.length, LIMITS.length.min, LIMITS.length.max, d.length),
    lower: bool(src.lower, d.lower),
    upper: bool(src.upper, d.upper),
    digits: bool(src.digits, d.digits),
    symbols: bool(src.symbols, d.symbols),
    excludeAmbiguous: bool(src.excludeAmbiguous, d.excludeAmbiguous),
    wordCount: clampInt(src.wordCount, LIMITS.wordCount.min, LIMITS.wordCount.max, d.wordCount),
    separator: SEPARATORS.find((s) => s === src.separator) ?? d.separator,
    capitalize: bool(src.capitalize, d.capitalize),
    addNumber: bool(src.addNumber, d.addNumber),
  };
}

/** Parses and clamps a config stored in localStorage. Never throws. */
export function parseStoredConfig(raw: string | null): PasswordConfig | null {
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
// Generation
// ---------------------------------------------------------------------------

/** Character password; guarantees at least one character from each selected set. Returns "" with no set. */
export function generatePassword(config: PasswordConfig, rng: Rng = defaultRng): string {
  const sets = activeCharsets(config);
  if (sets.length === 0) return "";
  const length = Math.max(config.length, sets.length);
  const pool = sets.join("");

  const chars = sets.map((s) => pick(s, rng));
  while (chars.length < length) chars.push(pick(pool, rng));
  return shuffle(chars, rng).join("");
}

/** Passphrase from the word list; optionally capitalized, with a digit appended to a random word. */
export function generatePassphrase(
  config: PasswordConfig,
  rng: Rng = defaultRng,
  locale: Locale = "cs",
): string {
  const dictionary = WORDS_BY_LOCALE[locale];
  const words = Array.from({ length: config.wordCount }, () => {
    const w = pick(dictionary, rng);
    return config.capitalize ? w.charAt(0).toUpperCase() + w.slice(1) : w;
  });
  if (config.addNumber) {
    const i = randomInt(words.length, rng);
    words[i] += String(randomInt(10, rng));
  }
  return words.join(config.separator);
}

export function generate(
  config: PasswordConfig,
  rng: Rng = defaultRng,
  locale: Locale = "cs",
): string {
  return config.mode === "words"
    ? generatePassphrase(config, rng, locale)
    : generatePassword(config, rng);
}

// ---------------------------------------------------------------------------
// Strength
// ---------------------------------------------------------------------------

/** Entropy estimate in bits based on the configuration (not on a concrete result). */
export function estimateEntropyBits(config: PasswordConfig, locale: Locale = "cs"): number {
  if (config.mode === "words") {
    const perWord = Math.log2(WORDS_BY_LOCALE[locale].length);
    // digit: word choice (log2 n) + digit choice (log2 10)
    const extra = config.addNumber ? Math.log2(config.wordCount * 10) : 0;
    return config.wordCount * perWord + extra;
  }
  const sets = activeCharsets(config);
  if (sets.length === 0) return 0;
  const poolSize = new Set(sets.join("")).size;
  return Math.max(config.length, sets.length) * Math.log2(poolSize);
}

export type StrengthLevel = 0 | 1 | 2 | 3;

/** Strength level by entropy; the label comes from the dictionary (`strength[level]`). */
export function strengthLabel(bits: number): { level: StrengthLevel } {
  if (bits < 40) return { level: 0 };
  if (bits < 60) return { level: 1 };
  if (bits < 80) return { level: 2 };
  return { level: 3 };
}
