import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { LOCALES, SITE_URL, homePath, toolPath, type Locale, type ToolId } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";

/** Tool page metadata: title, description and hreflang links to every language. */
export function toolMetadata(locale: Locale, tool: ToolId): Metadata {
  const entry = getDictionary(locale).catalog[tool];
  return {
    title: entry.name,
    description: entry.description,
    alternates: {
      canonical: `${SITE_URL}${toolPath(locale, tool)}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}${toolPath(l, tool)}`])),
    },
  };
}

/**
 * Tool page frame: header, heading, intro and client content. Only this tool's
 * messages (plus the common ones) are sent to the client. Pages prerender statically.
 */
export function ToolPage({
  locale,
  tool,
  children,
}: {
  locale: Locale;
  tool: ToolId;
  children: React.ReactNode;
}) {
  const dict = getDictionary(locale);
  const entry = dict.catalog[tool];
  return (
    <div className="min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: entry.name,
          description: entry.description,
          url: `${SITE_URL}${toolPath(locale, tool)}`,
          inLanguage: locale,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "CZK" },
          isPartOf: { "@type": "WebSite", name: dict.common.siteName, url: `${SITE_URL}${homePath(locale)}` },
          publisher: { "@type": "Organization", name: "CDOM", url: "https://www.cdom.cz" },
        }}
      />
      <SiteHeader locale={locale} tool={tool} title={entry.name} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{entry.name}</h1>
            <p className="text-sm text-muted-foreground">{entry.intro}</p>
          </div>
          <I18nProvider locale={locale} messages={{ common: dict.common, [tool]: dict[tool] }}>
            {children}
          </I18nProvider>
        </div>
      </main>
    </div>
  );
}
