/** Čisté formátovače a parsery času (sekundy ↔ text). Bez Reactu a DOM. */

/** "05:30" / "1:02:30" pro >= 1 h. Záporné hodnoty klampuje na 0. */
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
 * Opak formatMmSs pro ruční zadání ve stepperu (tap-to-edit) — přijme
 * "1:30" i holé sekundy "90". Vrátí null pro nesmyslný vstup místo
 * vyhození výjimky, ať volající může vstup jednoduše zahodit.
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

/** Lidsky čitelný souhrn, např. "18 min 30 s", pro setup formulář. */
export function formatHuman(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec} s`;
  if (sec === 0) return `${m} min`;
  return `${m} min ${sec} s`;
}
