# CLAUDE.md

## What this is

**Tools** (česky „Pomocníčci“, URL zůstává `tools`) is a public collection of small standalone helper tools (Next.js 16, App Router, Tailwind v4). The homepage is a launcher listing every tool (`src/components/home-page.tsx`, tool IDs/slugs in `src/i18n/config.ts`). The app is **bilingual**: Czech (default, at the root) and English (under `/en`, translated slugs, e.g. `/meditace` ↔ `/en/meditation`). Czech is the source-of-truth copy; every user-facing string must exist in both languages. Details: `docs/i18n.md` (CS) / `docs/i18n.en.md` (EN); the English README is `README.en.md`.

**There is NO database and NO auth.** Do not add DB clients, ORMs, sessions, or a login/proxy layer. Every tool runs client-side; persistent per-user settings go to `localStorage` (keys namespaced `tools.<slug>.…`).

## Commands

```bash
pnpm dev          # dev server (localhost:3000)
pnpm build        # production build
pnpm typecheck    # tsc --noEmit — the only verification gate (no tests, no eslint)
```

## Adding a tool

1. Tool code in `src/tools/<id>/` (client components + hooks); domain logic in pure functions under `src/lib/` (no React/DOM, **no user-facing strings**).
2. Register `<id>` and a slug per language in `src/i18n/config.ts` (`TOOL_IDS`, `TOOL_SLUGS`), the icon in `home-page.tsx`.
3. Texts in `src/i18n/messages/` (`catalog.*.ts` for card/intro, `<id>.cs.ts` + `<id>.en.ts` for UI), wired in `src/i18n/dictionaries.ts`. EN is typed as `typeof` the CS object; dictionaries must be serializable (no functions; use `fmt`/`plural` from `src/i18n/format.ts`).
4. Thin `page.tsx` per language: `src/app/(cs)/<slug>/page.tsx` and `src/app/(en)/en/<slug>/page.tsx`, wrapping the component in `<ToolPage>`.
5. Keep tools independent of each other; shared bits live in `src/components/` and `src/lib/utils.ts`.

## Conventions

- Path alias `@/*` → `./src/*`.
- i18n: no library, no proxy. Two route groups with their own root layouts: `src/app/(cs)/…` and `src/app/(en)/en/…`. Build links only with `toolPath` / `homePath` / `pagePath` from `@/i18n/config`. Client components read texts via `useToolMessages("<id>")` / `useCommon()`. `localStorage` keys stay language-independent (`tools.<slug>.…` with the original Czech slug).
- Theming: `.dark` class on `<html>`, persisted in `localStorage("theme")`, initialised by an inline script in the root layout. Colors are CSS tokens in `src/app/globals.css` (CDOM orange accent + `--color-signal-*` palette used by the timer phases). Tailwind classes must be static strings.
- Tools should prerender statically (no `force-dynamic`, no cookies/headers).
- PWA: `public/manifest.json` (cs) and `public/manifest.en.json` + icons.

## Deploy

Zerops (`zerops.yaml`, Node 24) via `.github/workflows/deploy.yml` on release publish. Build is just `pnpm install` + `pnpm build`; no env vars are required.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
