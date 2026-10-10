import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { SITE_URL, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import "@/app/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "latin-ext"], // Czech diacritics
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f17" },
  ],
  width: "device-width",
  initialScale: 1,
};

/** Root layout metadata for a language (each language has its own root layout). */
export function rootMetadata(locale: Locale): Metadata {
  const { common } = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: common.siteName, template: `%s · ${common.siteName}` },
    description: common.metaDescription,
    applicationName: common.siteName,
    manifest: locale === "cs" ? "/manifest.json" : `/manifest.${locale}.json`,
    appleWebApp: { capable: true, title: common.siteName, statusBarStyle: "default" },
    icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  };
}

// Applied before paint to avoid a flash of the wrong theme.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var wantsDark = stored ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (wantsDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

/** <html>/<body> skeleton shared by the root layouts of all languages. */
export function RootShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const { common } = getDictionary(locale);
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${inter.variable}`}>
        <I18nProvider locale={locale} messages={{ common }}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
