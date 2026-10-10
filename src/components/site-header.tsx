import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { homePath, type Locale, type ToolId } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Shared header — the logo links to the launcher; language and theme switchers on the right.
 * `tool` tells the language switcher which page to link to (without it: the launcher).
 */
export function SiteHeader({ locale, tool, title }: { locale: Locale; tool?: ToolId; title?: string }) {
  const { common } = getDictionary(locale);
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={homePath(locale)} className="flex items-center gap-2" aria-label={common.homeAria}>
            <span className="flex items-center gap-1" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="h-2.5 w-2.5 rounded-full bg-signal-medium" />
              <span className="h-2.5 w-2.5 rounded-full bg-signal-other" />
            </span>
            <span className="text-base font-semibold tracking-tight">{common.siteName}</span>
          </Link>
          {title && (
            <>
              <span className="text-muted-foreground" aria-hidden>/</span>
              <span className="truncate text-base font-semibold tracking-tight">{title}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} tool={tool} common={common} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
