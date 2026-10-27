---
name: new-system
description: Start a new design system as its own repo from kiln's starter (tokens, React components, the docs book, the engine and the gates, all wired). Use when the user says /new-system <name>, wants a new design system, theme family or component library built with kiln, or wants someone else to start one.
---
# New system

One system = one repo. Never build a second system inside an existing system's repo, and never
copy another system's `system/` folder: decisions do not travel between systems.

## 1. Create the repo

```sh
node "${CLAUDE_PLUGIN_ROOT}/bin/create.mjs" <dir> --name <name>
```

`<name>` is lowercase letters, digits and dashes; the packages become `<name>-tokens` and
`<name>-react`. The script refuses a non-empty folder, copies the starter, renames it, runs
`pnpm install`, builds the seed tokens and makes one local git commit. Nothing is pushed.

The new repo builds and renders its book at once, on SEED tokens and TODO placeholders. That is
on purpose: the plumbing is proven before any design decision, and gate G-TODO1 plus
`pnpm run milestone` keep every placeholder visible until a phase replaces it.

## 2. Work inside it

Open Claude Code in the new folder. Its `CLAUDE.md` runs the build:

1. **Intake, once.** Ask every question in `system/INTAKE.md` in one batch (AskUserQuestion, up to
   four at a time), write the answers in, and do not ask again before the milestone review.
2. Concept (`system/CONCEPT.md`), lineage, vector, form language: the agent decides, renders,
   logs in `system/REVIEW.md`.
3. **The anchor pick**: the one visual question, from 3–4 variants in `apps/lab/anchor/`.
4. Tokens with this system's reasons (`tokens.allowSeed: false`), then wave 1 (layout, atoms and
   the docs' own controls), each component derived, picked, checked and documented the same day.
5. `pnpm run verify` (full, recorded), then `pnpm run milestone`. M1 is done when that says so.
6. The milestone review: hand the user REVIEW.md and the book, in their language.

## 3. Keep the engine in kiln

`tooling/kiln/` is a read-only copy of kiln's engine. A fix to a gate goes into kiln
(`tooling/engine/`), then `node tooling/engine/sync.mjs <system repo>`. `sync.mjs --check` in
verify fails on any local edit.
