# Helpers (Pomocníčci)

[🇨🇿 Česky](README.md) · 🇬🇧 English

<a href="https://www.cdom.cz"><img src="public/cdom-logo.svg" alt="CDOM" height="48"></a>

A public collection of small helper tools by [CDOM](https://www.cdom.cz), served at `tools`. The homepage is a
launcher; every tool is a standalone page. **No database, no sign-in** — everything runs in the browser and any
settings are kept in `localStorage`.

## Tools

| Path (EN) | Path (CS) | Description |
|---|---|---|
| `/en/timer` | `/timer` | Interval timer for HIIT and circuit training |
| `/en/meditation` | `/meditace` | Meditation timer: blocks, a soft gong after each one, a triple gong at the end |
| `/en/passwords` | `/hesla` | Generator of strong random passwords and memorable passphrases |
| `/en/invoice` | `/faktura` | One-off CZK invoice as a PDF (QR payment, VAT payer / non-payer, logo and signature) |

### Invoice generator

The PDF is built in the browser with `@react-pdf/renderer` (loaded only after clicking “Download PDF”); nothing is
sent anywhere. The QR payment uses the SPAYD format, and IBAN and BIC are derived from a Czech account number. The
Roboto font (WOFF) lives in `public/fonts/` for Czech diacritics. Supplier details, logo and signature are stored in
`localStorage` (`tools.faktura.*`); the customer and line items are not. The invoice is always in CZK; only its
labels follow the language of the page you generate it from.

## Languages

The app comes in two languages: **Czech** (default, at the root) and **English** (under `/en`). Tool URLs are
translated (`/meditace` ↔ `/en/meditation`), and the header has a language switcher that links to the equivalent
page in the other language. No i18n library — dictionaries are typed TypeScript modules in `src/i18n/`. See
[docs/i18n.en.md](docs/i18n.en.md) ([CS](docs/i18n.md)) for how to add a tool or a language.

Settings in `localStorage` are shared between languages (same keys), so switching language keeps your configuration.

## Tech stack

The same stack as the [signal](https://github.com/cdom-cz/signal) project, minus DB and auth:

- **Next.js 16** (App Router, TypeScript)
- **pnpm**, Node 24 pinned via **mise** (`mise.toml`)
- **Tailwind CSS v4** (dark mode via the `.dark` class, CDOM branding)
- Deployed to **Zerops** through GitHub Actions (release → deploy)

## Development

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm typecheck    # the only verification gate (no tests, no eslint)
pnpm build && pnpm start
```

## Adding a new tool

1. Put the tool's code in `src/tools/<id>/` (client components, hooks) and its logic in pure functions in `src/lib/` (see `interval-timer.ts`, `invoice.ts`).
2. Register `<id>` and a slug per language in `src/i18n/config.ts` (`TOOL_IDS`, `TOOL_SLUGS`) and its icon in `src/components/home-page.tsx`.
3. Add the texts (CS and EN) under `src/i18n/messages/` — card/intro in `catalog.*.ts`, UI in `<id>.cs.ts` / `<id>.en.ts` — and wire them up in `src/i18n/dictionaries.ts`.
4. Create a thin `page.tsx` for each language: `src/app/(cs)/<slug>/page.tsx` and `src/app/(en)/en/<slug>/page.tsx` (copy an existing one; they use `<ToolPage>`).
5. Don't touch DB or sessions — tools have no backend.

## Deploy

The GitHub Actions workflow `deploy.yml` (on release publish or manually) deploys to Zerops according to
`zerops.yaml`. It needs the `ZEROPS_TOKEN` secret in the `production` environment and a filled-in `.zcli.yaml`
(`projectId`, `serviceId`) for new services.
