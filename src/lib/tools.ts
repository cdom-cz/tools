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
    description: "Intervalový timer pro HIIT a kruhový trénink. Nastavíš cvičení, odpočinek a počet kol, timer tě provede barevnými fázemi se zvukovým signálem.",
    tags: ["trénink", "čas"],
    icon: "⏱",
  },
  {
    slug: "hesla",
    name: "Generátor hesel",
    description: "Vygeneruje silná náhodná hesla nebo snadno zapamatovatelné fráze. Délku a typ znaků si zvolíš sám, nic se nikam neodesílá.",
    tags: ["bezpečnost", "text"],
    icon: "🔑",
  },
  {
    slug: "faktura",
    name: "Generátor faktur",
    description: "Jednorázová faktura v CZK jako PDF s QR platbou. Pro plátce i neplátce DPH, s logem a podpisem; IBAN se dopočítá z čísla účtu.",
    tags: ["finance", "pdf"],
    icon: "🧾",
  },
];
