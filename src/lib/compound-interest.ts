/**
 * Compound interest — pure logic (no React/DOM, no user-facing strings).
 * The rate is always annual (p.a.); `compounding` decides how often interest is credited.
 */
export const COMPOUNDING = ["monthly", "yearly"] as const;
export type Compounding = (typeof COMPOUNDING)[number];

export type CompoundConfig = {
  /** Initial deposit. */
  principal: number;
  /** Regular deposit at the end of every month. */
  monthly: number;
  /** Annual rate in percent. */
  ratePct: number;
  years: number;
  compounding: Compounding;
};

export const DEFAULT_CONFIG: CompoundConfig = {
  principal: 100_000,
  monthly: 2_000,
  ratePct: 5,
  years: 20,
  compounding: "monthly",
};

export const LIMITS = {
  principal: { min: 0, max: 100_000_000 },
  monthly: { min: 0, max: 1_000_000 },
  ratePct: { min: 0, max: 50 },
  years: { min: 1, max: 60 },
} as const;

/** Cumulative state at the end of a year (year 0 = the starting state). */
export type YearRow = {
  year: number;
  contributed: number;
  interest: number;
  balance: number;
};

/**
 * Month-by-month simulation, deposits at the end of the month.
 * - monthly: interest of r/12 is added to the balance every month.
 * - yearly: interest accrues monthly (r/12 of the current balance) but is credited only
 *   at the end of the 12th month, so it does not earn interest during the year.
 */
export function simulate(config: CompoundConfig): YearRow[] {
  const r = config.ratePct / 100 / 12;
  const rows: YearRow[] = [
    { year: 0, contributed: config.principal, interest: 0, balance: config.principal },
  ];
  let balance = config.principal;
  let accrued = 0;
  for (let year = 1; year <= config.years; year++) {
    for (let month = 1; month <= 12; month++) {
      const gain = balance * r;
      if (config.compounding === "monthly") balance += gain;
      else accrued += gain;
      balance += config.monthly;
    }
    if (config.compounding === "yearly") {
      balance += accrued;
      accrued = 0;
    }
    const contributed = config.principal + config.monthly * 12 * year;
    rows.push({ year, contributed, interest: balance - contributed, balance });
  }
  return rows;
}

export function summary(rows: YearRow[]): { balance: number; contributed: number; interest: number } {
  const last = rows[rows.length - 1];
  return { balance: last.balance, contributed: last.contributed, interest: last.interest };
}

/** Effective annual rate in percent for the given nominal rate and compounding. */
export function effectiveRatePct(ratePct: number, compounding: Compounding): number {
  if (compounding === "yearly") return ratePct;
  return ((1 + ratePct / 100 / 12) ** 12 - 1) * 100;
}

function num(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Clamps arbitrary (even unknown, e.g. from localStorage) input to a valid config. */
export function clampConfig(input: unknown): CompoundConfig {
  const src = (input && typeof input === "object" ? input : {}) as Partial<
    Record<keyof CompoundConfig, unknown>
  >;
  const d = DEFAULT_CONFIG;
  return {
    principal: Math.round(num(src.principal, LIMITS.principal.min, LIMITS.principal.max, d.principal)),
    monthly: Math.round(num(src.monthly, LIMITS.monthly.min, LIMITS.monthly.max, d.monthly)),
    ratePct: Math.round(num(src.ratePct, LIMITS.ratePct.min, LIMITS.ratePct.max, d.ratePct) * 100) / 100,
    years: Math.round(num(src.years, LIMITS.years.min, LIMITS.years.max, d.years)),
    compounding: COMPOUNDING.find((c) => c === src.compounding) ?? d.compounding,
  };
}

/** Parses and clamps a config stored in localStorage. Never throws. */
export function parseStoredConfig(raw: string | null): CompoundConfig | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return clampConfig(parsed);
  } catch {
    return null;
  }
}
