import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { LOCALES, SITE_URL, TOOL_IDS, homePath, toolPath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function homeMetadata(locale: Locale): Metadata {
  return {
    alternates: {
      canonical: `${SITE_URL}${homePath(locale)}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}${homePath(l)}`])),
    },
  };
}

/** Launcher — lists the tools from the registry, texts from the language's dictionary. */
export function HomePage({ locale }: { locale: Locale }) {
  const { common, catalog } = getDictionary(locale);
  return (
    <div className="min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: common.siteName,
          description: common.tagline,
          url: `${SITE_URL}${homePath(locale)}`,
          inLanguage: locale,
          publisher: { "@type": "Organization", name: "CDOM", url: "https://www.cdom.cz" },
          hasPart: TOOL_IDS.map((id) => ({
            "@type": "WebApplication",
            name: catalog[id].name,
            description: catalog[id].description,
            url: `${SITE_URL}${toolPath(locale, id)}`,
          })),
        }}
      />
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">{common.siteName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{common.tagline}</p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {TOOL_IDS.map((id) => {
            const tool = catalog[id];
            return (
              <li key={id}>
                <Link
                  href={toolPath(locale, id)}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-card-foreground transition hover:border-primary hover:shadow-md"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-xl"
                    aria-hidden
                  >
                    {TOOL_ICONS[id]}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight group-hover:text-primary">
                      {tool.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {tool.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

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
      </main>
    </div>
  );
}

const TOOL_ICONS = {
  timer: "⏱",
  meditation: "🔔",
  passwords: "🔑",
  invoice: "🧾",
  compound: "📈",
} as const;
