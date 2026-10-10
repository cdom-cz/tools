# Pomocníčci

🇨🇿 Česky · [🇬🇧 English](README.en.md)

<a href="https://www.cdom.cz"><img src="public/cdom-logo.svg" alt="CDOM" height="48"></a>

Veřejná sada malých pomocných nástrojů ([CDOM](https://www.cdom.cz)), URL `tools`. Homepage je rozcestník, každý
nástroj je samostatná stránka. **Žádná databáze, žádné přihlášení** — vše běží
v prohlížeči, případné nastavení se ukládá do `localStorage`.

## Nástroje

| Cesta (CS) | Cesta (EN) | Popis |
|---|---|---|
| `/timer` | `/en/timer` | Intervalový timer pro HIIT a kruhový trénink |
| `/meditace` | `/en/meditation` | Meditační timer: bloky, jemný gong na konci každého, trojitý na konci meditace |
| `/hesla` | `/en/passwords` | Generátor silných náhodných hesel a zapamatovatelných frází |
| `/faktura` | `/en/invoice` | Jednorázová faktura v CZK jako PDF (QR platba, plátce/neplátce DPH, logo a podpis) |

## Jazyky

Aplikace je ve dvou jazykových verzích: **čeština** (výchozí, v kořeni) a **angličtina** (pod `/en`).
URL nástrojů jsou přeložené (`/meditace` ↔ `/en/meditation`), v hlavičce je přepínač jazyka, který vede
na ekvivalentní stránku v druhém jazyce. Žádná i18n knihovna — slovníky jsou typované TypeScript moduly
v `src/i18n/`. Postup, jak přidat nástroj nebo jazyk, popisuje [docs/i18n.md](docs/i18n.md)
([EN](docs/i18n.en.md)).

### Generátor faktur

PDF vzniká přímo v prohlížeči přes `@react-pdf/renderer` (načítá se až po kliknutí
na „Stáhnout PDF“), nic se neodesílá. QR platba používá formát SPAYD, IBAN a BIC
se dopočítají z českého čísla účtu. Font Roboto (WOFF) je v `public/fonts/` kvůli
české diakritice. Údaje dodavatele, logo a podpis se ukládají do `localStorage`
(`tools.faktura.*`), odběratel a položky ne.

## Tech stack

Stejný systém jako projekt [signal](https://github.com/cdom-cz/signal), jen bez DB a auth:

- **Next.js 16** (App Router, TypeScript)
- **pnpm**, Node 24 pinovaný přes **mise** (`mise.toml`)
- **Tailwind CSS v4** (tmavý režim přes třídu `.dark`, značka CDOM)
- Nasazení na **Zerops** přes GitHub Actions (release → deploy)

## Vývoj

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm typecheck    # jediná verifikační brána (žádné testy ani eslint)
pnpm build && pnpm start
```

## Přidání nového nástroje

1. Kód nástroje dej do `src/tools/<id>/` (klientské komponenty, hooky), logiku do čistých funkcí v `src/lib/` (viz `interval-timer.ts`, `invoice.ts`).
2. Zaregistruj `<id>` a slugy pro každý jazyk v `src/i18n/config.ts` (`TOOL_IDS`, `TOOL_SLUGS`) a ikonu v `src/components/home-page.tsx`.
3. Přidej texty (CS i EN) do `src/i18n/messages/` — karta/úvod do `catalog.*.ts`, UI do `<id>.cs.ts` / `<id>.en.ts`, a zapoj je v `src/i18n/dictionaries.ts`.
4. Vytvoř tenké `page.tsx` pro každý jazyk: `src/app/(cs)/<slug>/page.tsx` a `src/app/(en)/en/<slug>/page.tsx` (viz existující, používají `<ToolPage>`).
5. Nesahej na DB ani session — tools jsou bez backendu.

## Deploy

GitHub Actions workflow `deploy.yml` (po publikaci release nebo ručně) nasadí na
Zerops podle `zerops.yaml`. Vyžaduje secret `ZEROPS_TOKEN` v environmentu
`production` a vyplnění `.zcli.yaml` (`projectId`, `serviceId`) pro nové služby.
