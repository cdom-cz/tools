import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

/** Shared footer — "Made by" with the CDOM logo linking to cdom.cz. */
export function SiteFooter({ locale }: { locale: Locale }) {
  const { common } = getDictionary(locale);
  return (
    <footer className="mt-12 flex items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
      <span>{common.madeBy}</span>
      <a
        href="https://www.cdom.cz"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="CDOM — cdom.cz"
        className="transition hover:opacity-80"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cdom-logo.svg" alt="CDOM" className="h-8 w-auto" />
      </a>
    </footer>
  );
}
