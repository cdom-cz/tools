# Bezpečnostní politika

## Podporované verze

Podporujeme pouze aktuální verzi na větvi `main` (nasazenou na produkci).

## Nahlášení zranitelnosti

Zranitelnost **nehlaste veřejným issue**. Použijte:

- [soukromé hlášení přes GitHub](../../security/advisories/new), nebo
- e-mail na **petr@cdom.cz**.

Uveďte prosím popis problému, kroky k reprodukci a dopad. Odpovíme co nejdříve
a o postupu opravy vás budeme informovat.

## Rozsah

Nástroje běží výhradně v prohlížeči a neodesílají data na server; projekt
nemá databázi ani přihlášení. Relevantní jsou zejména problémy typu XSS,
únik dat z `localStorage` nebo zranitelné závislosti.
