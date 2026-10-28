# kiln-ds

A design system built with [kiln](https://github.com/tanawitchsaentree/Kiln): a tokens package, a
React component library and a docs book, every decision traced to a concept and a lineage.

| Package | What it is |
|---|---|
| `kiln-ds-react` | the components; carries the tokens, so it is the only install a React app needs |
| `kiln-ds-tokens` | the design tokens on their own (CSS, JSON, ESM with types, SCSS), three tiers from DTCG |
| `apps/docs` | the docs book |

```bash
npm install kiln-ds-react
```

```tsx
import 'kiln-ds-react/all.css';   // tokens and component styles, once at the root
import { Container, Stack } from 'kiln-ds-react';
```

## Requirements

- Node 22 or newer, and pnpm 9 (`corepack enable`).
- Chromium for Playwright, used by every browser check: `pnpm exec playwright install chromium`.
- The human-tone linter for the tone gate. Point `docs.tone.lint` in `system/kiln.config.json`, or
  the `HUMAN_TONE_LINT` environment variable, at its `lint.py`. Without it the tone step fails on
  purpose, because nothing was checked.

## Work on it

```bash
pnpm install
pnpm run docs:dev        # the book, with hot reload
pnpm run verify:quick    # build, lint, types, token contract, reasons, component checks (minutes)
pnpm run verify          # everything, recorded in system/reports/verify-latest.json (60–90 minutes)
pnpm run milestone       # may the current milestone close
pnpm run release:pack    # one installable tarball in release/
```

Open Claude Code in this folder to build the system. `CLAUDE.md` is the working contract: the
intake questions are asked once (`system/INTAKE.md`), then the agent works to the milestone and
logs every choice it made in `system/REVIEW.md` for one review.

| Path | What it is |
|---|---|
| `system/` | intake, concept, decisions, review log, exceptions, handoff (`NEXT.md`), settings (`kiln.config.json`) |
| `system/conformance/` | each component's behaviour checks, run by `tooling/kiln/conformance.mjs` |
| `packages/tokens/src` | DTCG token sources; every token carries a reason |
| `packages/react/src/components` | one folder per component, with `<Name>.why.json` |
| `apps/lab/` | rendered alternatives for every visual decision |
| `tooling/kiln/` | the kiln engine, a read-only copy; fixes go to kiln and are synced back |
