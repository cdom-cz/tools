import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "latin-ext"], // Czech diacritics
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: { default: "Tools", template: "%s · Tools" },
  description: "Sada malých pomocných nástrojů — bez přihlášení, bez databáze.",
  applicationName: "Tools",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Tools",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f17" },
  ],
  width: "device-width",
  initialScale: 1,
};

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
