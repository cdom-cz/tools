# Tools

Veřejná sada malých pomocných nástrojů (CDOM). Homepage je rozcestník, každý
nástroj je samostatná stránka. **Žádná databáze, žádné přihlášení** — vše běží
v prohlížeči, případné nastavení se ukládá do `localStorage`.

## Nástroje

| Cesta | Popis |
|---|---|
| `/timer` | Intervalový timer pro HIIT a kruhový trénink |

## Tech stack

Stejný systém jako projekt [signal](https://github.com/cdom-cz/signal), jen bez DB a auth:

- **Next.js 16** (App Router, TypeScript)
- **pnpm**, Node 24 pinovaný přes **Volta**
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
3. Logiku drž v čistých funkcích v `src/lib/` (viz `interval-timer.ts`).
4. Nesahej na DB ani session — tools jsou bez backendu.

## Deploy

GitHub Actions workflow `deploy.yml` (po publikaci release nebo ručně) nasadí na
Zerops podle `zerops.yaml`. Vyžaduje secret `ZEROPS_TOKEN` v environmentu
`production` a vyplnění `.zcli.yaml` (`projectId`, `serviceId`) pro nové služby.
