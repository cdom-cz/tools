/** Pure time formatters and parsers (seconds <-> text). No React, no DOM. */

/** "05:30" / "1:02:30" for >= 1 h. Negative values are clamped to 0. */
export function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Inverse of formatMmSs for manual entry in the stepper (tap-to-edit) —
 * accepts "1:30" as well as bare seconds "90". Returns null for invalid
 * input instead of throwing, so the caller can simply discard it.
 */
export function parseMmSs(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const parts = trimmed.split(":");
  if (parts.length > 3 || parts.some((p) => p === "" || !/^\d+$/.test(p))) return null;

  const nums = parts.map(Number);
  let seconds = 0;
  for (const n of nums) seconds = seconds * 60 + n;
  return seconds;
}

/** Units for formatHuman (language-dependent, default "min" / "s"). */
export type HumanUnits = { min: string; s: string };

/** Human-readable summary, e.g. "18 min 30 s", for the setup form. */
export function formatHuman(
  totalSeconds: number,
  units: HumanUnits = { min: "min", s: "s" },
): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec} ${units.s}`;
  if (sec === 0) return `${m} ${units.min}`;
  return `${m} ${units.min} ${sec} ${units.s}`;
}
