## What changes

<!-- Brief description of the change and why. Write in English (see CLAUDE.md). -->

## Related to

<!-- E.g. Closes #123 -->

## Checklist

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] User-facing strings exist in both Czech and English (Czech is the source of truth)
- [ ] No DB/auth; settings only in `localStorage` (`tools.<slug>.…`)
- [ ] Domain logic lives in `src/lib/` as pure functions
