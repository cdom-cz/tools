/**
 * Generátor hesel — čistá logika (bez React/DOM). Náhoda výhradně z
 * `crypto.getRandomValues`, nikdy `Math.random`.
 */
import { WORDS } from "./czech-words";

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
// Sady znaků
// ---------------------------------------------------------------------------

const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
} as const;

/** Vizuálně zaměnitelné znaky (0/O, 1/l/I, |). */
const AMBIGUOUS = new Set("0Oo1lI|");

type CharsetKey = keyof typeof CHARSETS;
const CHARSET_KEYS: readonly CharsetKey[] = ["lower", "upper", "digits", "symbols"];

/** Aktivní sady (po vynechání zaměnitelných znaků); prázdné sady se zahodí. */
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
// Náhoda
// ---------------------------------------------------------------------------

export type Rng = (buf: Uint32Array) => void;

const defaultRng: Rng = (buf) => {
  crypto.getRandomValues(buf);
};

/** Rovnoměrné celé číslo z [0, max) — rejection sampling, bez modulo biasu. */
export function randomInt(max: number, rng: Rng = defaultRng): number {
  if (!Number.isInteger(max) || max <= 0 || max > 0x100000000) {
    throw new RangeError("max musí být celé číslo v rozsahu 1 až 2^32");
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

/** Fisher–Yates na kopii pole. */
function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Validace configu (vzor interval-timer.ts)
// ---------------------------------------------------------------------------

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Ořízne libovolný (i neznámý, např. z localStorage) vstup na platný config. */
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

/** Parsuje a ořízne config uložený v localStorage. Nikdy nevyhodí. */
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
// Generování
// ---------------------------------------------------------------------------

/** Heslo ze znaků; zaručí aspoň jeden znak z každé zvolené sady. Bez sady vrací "". */
export function generatePassword(config: PasswordConfig, rng: Rng = defaultRng): string {
  const sets = activeCharsets(config);
  if (sets.length === 0) return "";
  const length = Math.max(config.length, sets.length);
  const pool = sets.join("");

  const chars = sets.map((s) => pick(s, rng));
  while (chars.length < length) chars.push(pick(pool, rng));
  return shuffle(chars, rng).join("");
}

/** Slovní fráze ze slovníku; volitelně velká písmena a číslice na konci náhodného slova. */
export function generatePassphrase(config: PasswordConfig, rng: Rng = defaultRng): string {
  const words = Array.from({ length: config.wordCount }, () => {
    const w = pick(WORDS, rng);
    return config.capitalize ? w.charAt(0).toUpperCase() + w.slice(1) : w;
  });
  if (config.addNumber) {
    const i = randomInt(words.length, rng);
    words[i] += String(randomInt(10, rng));
  }
  return words.join(config.separator);
}

export function generate(config: PasswordConfig, rng: Rng = defaultRng): string {
  return config.mode === "words" ? generatePassphrase(config, rng) : generatePassword(config, rng);
}

// ---------------------------------------------------------------------------
// Síla
// ---------------------------------------------------------------------------

/** Odhad entropie v bitech podle konfigurace (ne podle konkrétního výsledku). */
export function estimateEntropyBits(config: PasswordConfig): number {
  if (config.mode === "words") {
    const perWord = Math.log2(WORDS.length);
    // číslice: volba slova (log2 n) + volba číslice (log2 10)
    const extra = config.addNumber ? Math.log2(config.wordCount * 10) : 0;
    return config.wordCount * perWord + extra;
  }
  const sets = activeCharsets(config);
  if (sets.length === 0) return 0;
  const poolSize = new Set(sets.join("")).size;
  return Math.max(config.length, sets.length) * Math.log2(poolSize);
}

export type StrengthLevel = 0 | 1 | 2 | 3;

export function strengthLabel(bits: number): { label: string; level: StrengthLevel } {
  if (bits < 40) return { label: "Slabé", level: 0 };
  if (bits < 60) return { label: "Průměrné", level: 1 };
  if (bits < 80) return { label: "Silné", level: 2 };
  return { label: "Velmi silné", level: 3 };
}
