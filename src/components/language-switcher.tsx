import Link from "next/link";
import { LOCALES, pagePath, type Locale, type ToolId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

/**
 * Header language switcher. Links to the equivalent page in the other language
 * (including the translated tool slug). Plain links — works without JS.
 */
export function LanguageSwitcher({
  locale,
  tool,
  common,
}: {
  locale: Locale;
  tool?: ToolId;
  common: Dictionary["common"];
}) {
  return (
    <nav aria-label={common.languageLabel} className="flex items-center rounded-lg border border-border p-0.5 text-xs font-semibold">
      {LOCALES.map((target: Locale) => {
        const active = target === locale;
        return (
          <Link
            key={target}
            href={pagePath(target, tool)}
            hrefLang={target}
            lang={target}
            aria-current={active ? "true" : undefined}
            title={common.languageNames[target]}
            className={cn(
              "rounded-md px-2 py-1 uppercase transition",
              active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {target}
          </Link>
        );
      })}
    </nav>
  );
}
