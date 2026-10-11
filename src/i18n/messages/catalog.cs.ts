/** Karty na rozcestníku + hlavička/metadata stránky každého nástroje. */
export type CatalogEntry = {
  name: string;
  /** Popis na kartě rozcestníku a v <meta description>. */
  description: string;
  /** Krátké štítky na kartě. */
  tags: string[];
  /** Úvodní odstavec pod nadpisem na stránce nástroje. */
  intro: string;
};

export const catalogCs: Record<
  "timer" | "meditation" | "passwords" | "invoice" | "compound",
  CatalogEntry
> = {
  timer: {
    name: "Timer",
    description:
      "Intervalový timer pro HIIT a kruhový trénink. Nastavíš cvičení, odpočinek a počet kol, timer tě provede barevnými fázemi se zvukovým signálem.",
    tags: ["trénink", "čas"],
    intro: "Intervalový timer pro HIIT a kruhový trénink. Nastavení se ukládá v tomto prohlížeči.",
  },
  meditation: {
    name: "Meditace",
    description:
      "Meditační timer s bloky. Každému bloku nastavíš vlastní délku, na konci každého zazní jemný gong, na konci celé meditace gong třikrát.",
    tags: ["mysl", "čas"],
    intro: "Přidej libovolný počet bloků a každému nastav vlastní délku; na konci každého zazní jemný gong. Nastavení se ukládá v tomto prohlížeči.",
  },
  passwords: {
    name: "Generátor hesel",
    description:
      "Vygeneruje silná náhodná hesla nebo snadno zapamatovatelné fráze. Délku a typ znaků si zvolíš sám, nic se nikam neodesílá.",
    tags: ["bezpečnost", "text"],
    intro: "Hesla vznikají přímo v prohlížeči a nikam se neodesílají. Nastavení se ukládá v tomto prohlížeči.",
  },
  invoice: {
    name: "Generátor faktur",
    description:
      "Jednorázová faktura v CZK jako PDF s QR platbou. Pro plátce i neplátce DPH, s logem a podpisem; IBAN se dopočítá z čísla účtu.",
    tags: ["finance", "pdf"],
    intro:
      "Faktura v CZK se stáhne jako PDF přímo z prohlížeče, nic se neodesílá. Údaje dodavatele, logo a podpis se pamatují jen v tomto prohlížeči.",
  },
  compound: {
    name: "Složené úročení",
    description:
      "Kalkulačka složeného úročení s grafem. Počáteční vklad, pravidelné spoření, sazba a doba; úrok se připisuje měsíčně nebo ročně.",
    tags: ["finance", "spoření"],
    intro:
      "Spočítá, jak naroste vklad při složeném úročení. Vše se počítá v prohlížeči, nastavení se ukládá jen tady.",
  },
};
