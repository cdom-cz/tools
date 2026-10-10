import type { Locale } from "./config";
import { catalogCs } from "./messages/catalog.cs";
import { catalogEn } from "./messages/catalog.en";
import { commonCs } from "./messages/common.cs";
import { commonEn } from "./messages/common.en";
import { invoiceCs } from "./messages/invoice.cs";
import { invoiceEn } from "./messages/invoice.en";
import { meditationCs } from "./messages/meditation.cs";
import { meditationEn } from "./messages/meditation.en";
import { passwordsCs } from "./messages/passwords.cs";
import { passwordsEn } from "./messages/passwords.en";
import { timerCs } from "./messages/timer.cs";
import { timerEn } from "./messages/timer.en";

/**
 * Dictionaries — the type is derived from Czech (source of truth); English is typed against it,
 * so a missing key is caught by `pnpm typecheck`. No JSON, no runtime library.
 */
const cs = {
  common: commonCs,
  catalog: catalogCs,
  timer: timerCs,
  meditation: meditationCs,
  passwords: passwordsCs,
  invoice: invoiceCs,
};

export type Dictionary = typeof cs;

const en: Dictionary = {
  common: commonEn,
  catalog: catalogEn,
  timer: timerEn,
  meditation: meditationEn,
  passwords: passwordsEn,
  invoice: invoiceEn,
};

const DICTIONARIES: Record<Locale, Dictionary> = { cs, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
