/**
 * Lorem ipsum generator — pure logic (no React/DOM, no user-facing strings).
 * The text is Latin placeholder copy, so it is the same for every UI language.
 */

export const UNITS = ["paragraphs", "sentences", "words"] as const;
export type Unit = (typeof UNITS)[number];

export type LoremConfig = {
  unit: Unit;
  count: number;
  /** Begin with the classic "Lorem ipsum dolor sit amet, …". */
  startWithLorem: boolean;
  /** Wrap each paragraph in <p> tags (paragraphs only). */
  html: boolean;
};

export const LIMITS: Record<Unit, { min: number; max: number }> = {
  paragraphs: { min: 1, max: 50 },
  sentences: { min: 1, max: 200 },
  words: { min: 1, max: 2000 },
};

export const DEFAULT_CONFIG: LoremConfig = {
  unit: "paragraphs",
  count: 3,
  startWithLorem: true,
  html: false,
};

const CLASSIC_START = [
  "lorem", "ipsum", "dolor", "sit", "amet,", "consectetur", "adipiscing", "elit",
] as const;

const VOCABULARY = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
  "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim",
  "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi",
  "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit",
  "voluptate", "velit", "esse", "cillum", "eu", "fugiat", "nulla", "pariatur", "excepteur",
  "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "perspiciatis", "unde", "omnis", "iste",
  "natus", "error", "voluptatem", "accusantium", "doloremque", "laudantium", "totam", "rem",
  "aperiam", "eaque", "ipsa", "quae", "ab", "illo", "inventore", "veritatis", "quasi",
  "architecto", "beatae", "vitae", "dicta", "explicabo", "nemo", "ipsam", "quia", "voluptas",
  "aspernatur", "aut", "odit", "fugit", "consequuntur", "magni", "dolores", "eos", "ratione",
  "sequi", "nesciunt", "neque", "porro", "quisquam", "numquam", "eius", "modi", "tempora",
  "incidunt", "magnam", "quaerat", "nam", "libero", "tempore", "cum", "soluta", "nobis",
  "eligendi", "optio", "cumque", "nihil", "impedit", "quo", "minus", "quod", "maxime", "placeat",
  "facere", "possimus", "assumenda", "repellendus", "temporibus", "autem", "quibusdam",
  "officiis", "debitis", "rerum", "necessitatibus", "saepe", "eveniet", "voluptates",
  "repudiandae", "recusandae", "itaque", "earum", "hic", "tenetur", "sapiente", "delectus",
  "reiciendis", "voluptatibus", "maiores", "alias", "perferendis", "doloribus", "asperiores",
  "repellat",
] as const;

type Rng = () => number;

function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

function between(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Random words, never repeating the previous one back to back. */
function randomWords(count: number, rng: Rng, prefix: readonly string[] = []): string[] {
  const words = prefix.slice(0, count);
  while (words.length < count) {
    let word = pick(VOCABULARY, rng);
    if (word === words[words.length - 1]) word = pick(VOCABULARY, rng);
    words.push(word);
  }
  return words;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** One sentence of 4–16 words with occasional commas. `prefix` forces the opening words. */
function sentence(rng: Rng, prefix: readonly string[] = []): string {
  const length = Math.max(between(4, 16, rng), prefix.length);
  const words = randomWords(length, rng, prefix);
  // Commas only inside longer sentences, never after the last word.
  if (length >= 8) {
    const commas = between(0, 2, rng);
    for (let i = 0; i < commas; i++) {
      const at = between(prefix.length > 0 ? prefix.length : 2, length - 3, rng);
      if (at >= 0 && at < length - 1 && !words[at].endsWith(",")) words[at] += ",";
    }
  }
  return capitalize(words.join(" ")) + ".";
}

function paragraph(rng: Rng, opening: boolean): string {
  const count = between(3, 7, rng);
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    sentences.push(sentence(rng, opening && i === 0 ? CLASSIC_START : []));
  }
  return sentences.join(" ");
}

export function generate(config: LoremConfig, rng: Rng = Math.random): string {
  const { unit, count, startWithLorem, html } = config;

  if (unit === "words") {
    return randomWords(count, rng, startWithLorem ? CLASSIC_START : [])
      .join(" ")
      .replace(/,$/, "");
  }

  if (unit === "sentences") {
    return Array.from({ length: count }, (_, i) =>
      sentence(rng, startWithLorem && i === 0 ? CLASSIC_START : []),
    ).join(" ");
  }

  const paragraphs = Array.from({ length: count }, (_, i) => paragraph(rng, startWithLorem && i === 0));
  return html ? paragraphs.map((p) => `<p>${p}</p>`).join("\n") : paragraphs.join("\n\n");
}

export function countWords(text: string): number {
  const stripped = text.replace(/<[^>]+>/g, " ").trim();
  return stripped ? stripped.split(/\s+/).length : 0;
}

export function clampConfig(config: LoremConfig): LoremConfig {
  const unit = UNITS.includes(config.unit) ? config.unit : DEFAULT_CONFIG.unit;
  const { min, max } = LIMITS[unit];
  const count = Number.isFinite(config.count) ? Math.round(config.count) : DEFAULT_CONFIG.count;
  return {
    unit,
    count: Math.min(max, Math.max(min, count)),
    startWithLorem: Boolean(config.startWithLorem),
    html: Boolean(config.html),
  };
}

export function parseStoredConfig(raw: string | null): LoremConfig | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    return clampConfig({ ...DEFAULT_CONFIG, ...(data as Partial<LoremConfig>) });
  } catch {
    return null;
  }
}
