# Verb — docs

`kiln docs`. The documentation content model: page types beyond the default, and the token
contract the chrome consumes. No chrome-building stages remain — the Docs Final Pass order's
standing decision 1 assigns frame, responsive collapse, theme-toggle placement, search shortcut,
and nav-tree behaviour to the docs framework (Fumadocs, per that order's standing decision 2), not
to this verb. Stop after each stage below to confirm before the next.

**This verb's own 3 stages build the minimum content model. For a full Bootstrap/MUI-grade docs
site** — dense per-component pages with a measured density floor, a template-catalog of full-page
examples, an editorial-grade landing page/navbar, and the G-D1 through G-D8 gate set — invoke the
bundled `docs-engine` skill instead once this verb's Stage 1 (token adapter) is done; `docs-engine`
picks up from there and supersedes Stages 2-3 with its own, larger content model. Use this verb
alone only for a Spec-scale build that genuinely needs nothing more than one working page.

## Load

`references/docs-shell.md` in full. It specifies page types and the token contract; this file
specifies the order to build them in. The component page template itself lives in
`docs/DOCS-IA.md`, not in either of these two files — read that file for the template, not this one.

## Before stage 1 — check for an existing shell

Grep the project's docs app for the marker line `kiln docs-shell 1.0.0` (written into the token
adapter file on a completed run — see the marker comment's own text for the exact format). Found
it → a shell already exists: re-verify the framework version, the adapter's mapping, and
`docs/DOCS-IA.md`'s presence rather than regenerating from scratch, and state what you're about to
change before touching any file (per `references/safety.md`). Not found → proceed to stage 1.

## Stage 1 — the token adapter

One file mapping kiln's tier-2 semantic tokens onto the docs framework's own CSS variable names,
per `docs-shell.md`'s token contract. Read the framework's actual variable names from its installed
package on disk before writing the mapping — never from memory. Kiln's semantic name wins on any
collision; the framework's variable is the alias. Stop here and confirm before stage 2.

## Stage 2 — fill in one real page

Not a placeholder, not a lorem-ipsum stand-in. One actual component, documented against
`docs/DOCS-IA.md`'s template, with the live example block actually working end to end. If this
stage reveals the template assumed content this component doesn't have, fix `docs/DOCS-IA.md` now
— it's cheaper to fix before a second page exists than after.

## Stage 3 — migrate two existing pages

Take two existing component pages, if any exist from prior work, and migrate them into
`docs/DOCS-IA.md`'s template. This specifically tests whether the template overfit to the first
component it was built with — a component with no meaningful "when not to use" case, or with only
one variant, still has to fit the same structure. If the template breaks on this migration, revise
`docs/DOCS-IA.md` before calling this stage done.

## What ends here

An adapter file and real pages built against the one surviving template. Report which stage reached
completion and what — if anything — the migration in stage 3 changed about the template's
assumptions.
