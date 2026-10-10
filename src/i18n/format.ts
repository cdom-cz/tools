/** Small helpers for dictionary texts. Pure functions, no React. */
import type { Locale } from "./config";

/** Substitutes `{name}` in a template with values from `vars`; unknown placeholders are left as is. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** Noun forms by `Intl.PluralRules` (Czech: one/few/many/other, English: one/other). */
export type PluralForms = {
  one: string;
  few?: string;
  many?: string;
  other: string;
};

/** Picks the right form for count `n` — e.g. 1 blok, 3 bloky, 5 bloků / 1 block, 2 blocks. */
export function plural(locale: Locale, forms: PluralForms, n: number): string {
  const category = new Intl.PluralRules(locale).select(n);
  return forms[category as keyof PluralForms] ?? forms.other;
}
