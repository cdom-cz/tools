# CLAUDE.md

## What this is

**Tools** (česky „Pomocníčci“, URL zůstává `tools`) is a public collection of small standalone helper tools (Next.js 16, App Router, Tailwind v4). The homepage (`src/app/page.tsx`) is a launcher listing every tool from the registry in `src/lib/tools.ts`. UI copy is in **Czech**; keep that convention.

**There is NO database and NO auth.** Do not add DB clients, ORMs, sessions, or a login/proxy layer. Every tool runs client-side; persistent per-user settings go to `localStorage` (keys namespaced `tools.<slug>.…`).

## Commands

```bash
pnpm dev          # dev server (localhost:3000)
pnpm build        # production build
pnpm typecheck    # tsc --noEmit — the only verification gate (no tests, no eslint)
```

## Adding a tool

1. `src/app/<slug>/page.tsx` (+ `layout.tsx` using `<SiteHeader title="…" />` from `@/components/site-header`).
2. Register it in `src/lib/tools.ts` (name, description, tags, icon).
3. Put domain logic in pure functions under `src/lib/` (no React/DOM), runtime hooks next to the page.
4. Keep tools independent of each other; shared bits live in `src/components/` and `src/lib/utils.ts`.

## Conventions

- Path alias `@/*` → `./src/*`.
- Theming: `.dark` class on `<html>`, persisted in `localStorage("theme")`, initialised by an inline script in the root layout. Colors are CSS tokens in `src/app/globals.css` (CDOM orange accent + `--color-signal-*` palette used by the timer phases). Tailwind classes must be static strings.
- Tools should prerender statically (no `force-dynamic`, no cookies/headers).
- PWA: `public/manifest.json` + icons.

## Deploy

Zerops (`zerops.yaml`, Node 24) via `.github/workflows/deploy.yml` on release publish. Build is just `pnpm install` + `pnpm build`; no env vars are required.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
