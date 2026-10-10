/**
 * Registr nástrojů — jediné místo, které rozcestník (homepage) čte.
 *
 * Nový tool: 1) vytvoř složku `src/app/<slug>/` (page.tsx, případně layout.tsx),
 * 2) přidej záznam sem. Žádná DB, žádný backend — každý tool běží v prohlížeči.
 */
export type Tool = {
  /** URL segment, shodný se složkou v `src/app/`. */
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  /** Krátké štítky zobrazené na kartě. */
  readonly tags: readonly string[];
  /** Jednoznakový/emoji symbol na kartě (bez závislosti na icon knihovně). */
  readonly icon: string;
};

export const TOOLS: readonly Tool[] = [
  {
    slug: "timer",
    name: "Timer",
    description: "Intervalový timer pro HIIT a kruhový trénink.",
    tags: ["trénink", "čas"],
    icon: "⏱",
  },
  {
    slug: "hesla",
    name: "Generátor hesel",
    description: "Silná náhodná hesla a snadno zapamatovatelné fráze.",
    tags: ["bezpečnost", "text"],
    icon: "🔑",
  },
  {
    slug: "faktura",
    name: "Generátor faktur",
    description: "Jednorázová faktura v CZK s QR platbou jako PDF.",
    tags: ["finance", "pdf"],
    icon: "🧾",
  },
];
