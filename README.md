# Pomocníčci

<a href="https://www.cdom.cz"><img src="public/cdom-logo.svg" alt="CDOM" height="48"></a>

Veřejná sada malých pomocných nástrojů ([CDOM](https://www.cdom.cz)), URL `tools`. Homepage je rozcestník, každý
nástroj je samostatná stránka. **Žádná databáze, žádné přihlášení** — vše běží
v prohlížeči, případné nastavení se ukládá do `localStorage`.

## Nástroje

| Cesta | Popis |
|---|---|
| `/timer` | Intervalový timer pro HIIT a kruhový trénink |
| `/meditace` | Meditační timer: bloky, jemný gong na konci každého, trojitý na konci meditace |
| `/hesla` | Generátor silných náhodných hesel a zapamatovatelných frází |
| `/faktura` | Jednorázová faktura v CZK jako PDF (QR platba, plátce/neplátce DPH, logo a podpis) |

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

1. Vytvoř složku `src/app/<slug>/` s `page.tsx` (a `layout.tsx` s `<SiteHeader title="…" />`).
2. Přidej záznam do `src/lib/tools.ts` — homepage ho zobrazí automaticky.
3. Logiku drž v čistých funkcích v `src/lib/` (viz `interval-timer.ts`, `invoice.ts`).
4. Nesahej na DB ani session — tools jsou bez backendu.

## Deploy

GitHub Actions workflow `deploy.yml` (po publikaci release nebo ručně) nasadí na
Zerops podle `zerops.yaml`. Vyžaduje secret `ZEROPS_TOKEN` v environmentu
`production` a vyplnění `.zcli.yaml` (`projectId`, `serviceId`) pro nové služby.
