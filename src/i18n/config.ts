/**
 * Language and URL translation config. Pure module (no React/DOM) — shared by
 * server and client.
 *
 * Czech is the default and lives at the root (`/timer`); other languages sit under a prefix
 * (`/en/timer`). Tool slugs are translated (`/meditace` ↔ `/en/meditation`).
 */
export const LOCALES = ["cs", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "cs";

/** Internal tool ID — independent of language and URL. */
export const TOOL_IDS = ["timer", "meditation", "passwords", "invoice"] as const;
export type ToolId = (typeof TOOL_IDS)[number];

/** The tool's URL segment per language. */
export const TOOL_SLUGS: Record<ToolId, Record<Locale, string>> = {
  timer: { cs: "timer", en: "timer" },
  meditation: { cs: "meditace", en: "meditation" },
  passwords: { cs: "hesla", en: "passwords" },
  invoice: { cs: "faktura", en: "invoice" },
};

/** Path prefix of a language: `""` for the default, otherwise `/en`. */
function prefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

/** Launcher path: `/` or `/en`. */
export function homePath(locale: Locale): string {
  return prefix(locale) || "/";
}

/** Tool path: `/meditace` or `/en/meditation`. */
export function toolPath(locale: Locale, tool: ToolId): string {
  return `${prefix(locale)}/${TOOL_SLUGS[tool][locale]}`;
}

/** Path of the equivalent page (launcher or tool) in the given language. */
export function pagePath(locale: Locale, tool?: ToolId): string {
  return tool ? toolPath(locale, tool) : homePath(locale);
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Absolute site base for canonical/hreflang. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tools.cdom.cz";
