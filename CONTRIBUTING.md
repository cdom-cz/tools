# Jak přispět

Díky za zájem! Projekt je sada malých samostatných nástrojů (Next.js 16,
Tailwind v4). Texty v UI jsou **česky**.

## Postup

1. Vytvořte fork a větev z `main`.
2. Nainstalujte závislosti: `pnpm install` (Node 24, viz `mise.toml`).
3. Spusťte vývojový server: `pnpm dev` (http://localhost:3000).
4. Před odesláním ověřte `pnpm typecheck` a `pnpm build`.
5. Otevřete pull request a vyplňte šablonu.

## Pravidla

- **Žádná databáze ani přihlášení.** Vše běží v prohlížeči; trvalé nastavení
  patří do `localStorage` s klíči `tools.<slug>.…`.
- Doménovou logiku pište jako čisté funkce v `src/lib/` (bez React/DOM).
- Nástroje jsou na sobě nezávislé; sdílené věci patří do `src/components/`
  a `src/lib/utils.ts`.
- Nový nástroj: `src/app/<slug>/page.tsx` (+ `layout.tsx` se `SiteHeader`)
  a registrace v `src/lib/tools.ts`.
- Stránky se musí dát staticky prerenderovat (žádné `force-dynamic`, cookies
  ani headers).
- Tailwind třídy zapisujte jako statické řetězce.

Podrobnosti jsou v [CLAUDE.md](CLAUDE.md) a [README.md](README.md).

## Nahlášení chyby nebo nápadu

Použijte [issues](../../issues/new/choose). Bezpečnostní problémy prosím
nehlaste veřejně, viz [SECURITY.md](SECURITY.md).

Přispíváním souhlasíte s tím, že váš příspěvek bude šířen pod licencí
projektu a že dodržujete [Kodex chování](CODE_OF_CONDUCT.md).
