# Packages

Today kiln ships as one Claude Code plugin (`marketplace/plugins/kiln/`) plus an engine that
`sync.mjs` copies into each system as `tooling/kiln/`. That works for one person building one
system. It does not work for someone who only wants the gates in CI, or only the docs book, or who
wants a fix to the engine without re-cutting their whole repo. This file splits kiln into six
packages that install separately, says what goes in each, and says which ones are ready.

The split follows `docs/DISTRIBUTION.md`. The plugin route stays the main way in, the starter is the
repo template, and the tiers there map onto these packages. The portability rule in
`docs/PORTABILITY.md` holds for all of them. Nothing here holds a design decision of its own, and the
style lives in the system that kiln builds.

Every current skill and agent belongs to exactly one package. The table at the end lists them.

## @kiln/engine

An npm package with the measuring tools a system runs.

It holds everything in `tooling/engine/` today: `gates.mjs`, `gates-run.mjs`, `evidence.mjs`,
`conformance.mjs`, `verify.mjs`, `milestone.mjs`, `tone-gate.mjs`, `sync.mjs`, `config.mjs`,
`rationale.mjs`, `derivation-guard.mjs`, `token-contract.mjs`, `text-contrast.mjs`,
`treeshake-probe.mjs`, `spec-capture.mjs`, `i18n-lint.mjs`, `meta.mjs`, `serve-dist.mjs`, and the
selftest `rationale.selftest.mjs`. The milestone menu data in `tooling/engine/milestone-menu.json`
travels with it.

Every system repo needs it. CI needs it on its own. A team that already has components and only
wants the gates can install this package and nothing else.

It depends on Node 20 or later and Playwright for the browser gates. It reads
`system/kiln.config.json` from the system it runs in and never reaches back into kiln.

Most of it is shippable now. The files run from a system's `tooling/kiln/` without kiln present,
and `tooling/engine-purity.mjs` already checks that no system data leaks into them. Three things
are missing before it goes on npm. It needs a `package.json` with a `bin` entry per tool (for
example `kiln-gates`, `kiln-verify`, `kiln-milestone`). `sync.mjs` has to learn a second mode where
it checks the installed version instead of copying files. And the selftests in `tooling/*.selftest.mjs`
that test engine behaviour have to move in with it, so the package proves its own gates.

## kiln-core (plugin)

The Claude Code plugin that holds the method: concept, lineage, vector, derivation, decisions.

It holds the skills `skills/kiln/`, `skills/new-system/`, `skills/lock-decision/`,
`skills/ds-conventions/`, `skills/new-component/` and `skills/production-run/`. It holds the agents
`agents/interpreter.md`, `agents/foundation.md`, `agents/token-architect.md`, `agents/taste.md`,
`agents/component-engineer.md` and `agents/qa-a11y.md`. It also holds the hooks in `hooks/`
(`hooks.json`, `pre-write-guard.sh` and its selftest). All paths are under
`marketplace/plugins/kiln/`.

Anyone who builds a system with an agent needs it. A person who only runs gates in CI does not.

It expects @kiln/engine in the system it works on, because the derivation guard, rationale and
milestone checks it tells the agent to run live there. It works without the other plugins, at a
lower bar, since the docs book and the craft references are what lift the work to the benchmark.

It is close to shippable. It is already a plugin in `marketplace/.claude-plugin/marketplace.json`.
The work left is to cut the docs and craft skills out of it into their own plugins, and to make
`skills/kiln/scripts/audit_kit.py` run per plugin so each one is checked before it is packed.

## create-kiln-system

The starter repo and the command that copies it.

It holds `marketplace/plugins/kiln/starter/` (the system's own `CLAUDE.md`, `apps/docs`,
`packages/tokens`, `packages/react`, `tooling/`, `system/`) and `marketplace/plugins/kiln/bin/create.mjs`.

Someone starting a new system runs it once, through `npm create kiln-system`. After that day the
system no longer needs it.

It depends on @kiln/engine, which the new repo lists as a dev dependency once that package exists.
Until then `create.mjs` copies `tooling/engine/` in as `tooling/kiln/`, as it does today.

It works now through `create.mjs`. To publish it, it needs its own `package.json` with a `bin`, and
the copy step has to stop depending on the kiln repo layout. It also needs a selftest that cuts a
fresh system and runs `pnpm run milestone` on it to check that no gate skips quietly in a new repo.

## kiln-docs

The docs book: content model, page template and the components that draw it.

It holds the skill `skills/docs-engine/` (references, benchmarks, `scripts/audit.mjs`,
`scripts/benchmark-depth.mjs`) and the agent `agents/publisher.md`. It also holds the docs kit from
the starter, which is the reusable part of `starter/apps/docs/src/`: `book/` (ComponentPage,
playgrounds, router, catalog, grid page), `depth/` (UsageTab, StyleTab, subjects, layout) and the
shell styles in `docs.css`.

A system that wants a published book needs it. So does a team that has a component library and
wants a book at Carbon depth around it.

It depends on kiln-core for the derivation and reason files the book prints, and on @kiln/engine
for the G-S, G-K, G-F and tone gates that check the book.

The skill is shippable. The docs kit needs work, because today it is copied into each system and
edited there, so a fix in one book never reaches another. The kit has to become an npm package that
the system's `apps/docs` imports, and the system-specific parts (`system/backdrops.tsx`,
`system/content.tsx`, `system/patterns.tsx`) have to stay in the system as the only files a book
writes by hand.

## kiln-craft (plugin)

The references that give a system its shape and space.

It holds the skills `skills/form-language/`, `skills/spacing-engine/` and `skills/variant-foundry/`,
plus the style recipes in `docs/style-recipes/` (`braun-flat.md`, `neumorphism.md`, and the glass
recipe when it lands).

A system that wants more than the plain method needs it, for example one with a named material, a
form language or a density system to derive. The method in kiln-core runs without it.

It has no code dependencies. The skills point at kiln-core's derivation reference and the gates in
@kiln/engine by name.

The skills are shippable. The style recipes live under `docs/` today, where the plugin cannot load
them. They need to move into a skill folder (for example `skills/form-language/recipes/`) before
this plugin is packed.

## kiln-ship

Everything that turns a finished system into something other people install.

It holds the starter's release tools (`starter/tooling/release-pack.mjs`, `pack-verify.mjs`,
`smoke-import.mjs`, `bundle-tokens.mjs`), the tree-shake probe that backs G-TS1, and templates for
the consumer-side extras Pane built. Those are the knowledge and llms generator
(`pilot-glass/tooling/pane-knowledge.mjs`), the MCP server (`pilot-glass/packages/react/bin/pane-mcp.mjs`),
the theme CLI with its brand check (`pane-theme.mjs`), and the consumer skill that ships inside the
React package (`pilot-glass/packages/react/skill/SKILL.md`).

A system reaches for it at the ship milestone. Most of it then ships inside the system's own React
package, so the system's users get it without knowing kiln exists.

It depends on @kiln/engine for G-PUB1 and G-TS1.

It needs the most work. The release tools work in the starter today. The tree-shake probe is
already in the engine, so kiln-ship only needs the starter config that feeds it. The knowledge
generator, MCP server, theme CLI and consumer skill exist only as Pane's own files with Pane's
names in them. Each needs a content-free template that reads the system's name and tokens from
`kiln.config.json`. Publishing stays the user's step, as in Phase 8.

## Which package owns what

| Piece | Package |
|---|---|
| skill kiln | kiln-core |
| skill new-system | kiln-core |
| skill lock-decision | kiln-core |
| skill ds-conventions | kiln-core |
| skill new-component | kiln-core |
| skill production-run | kiln-core |
| skill docs-engine | kiln-docs |
| skill form-language | kiln-craft |
| skill spacing-engine | kiln-craft |
| skill variant-foundry | kiln-craft |
| agent interpreter | kiln-core |
| agent foundation | kiln-core |
| agent token-architect | kiln-core |
| agent taste | kiln-core |
| agent component-engineer | kiln-core |
| agent qa-a11y | kiln-core |
| agent publisher | kiln-docs |
| hooks | kiln-core |
| `tooling/engine/*` | @kiln/engine |
| `starter/`, `bin/create.mjs` | create-kiln-system |
| `docs/style-recipes/*` | kiln-craft |
| release, knowledge, MCP and theme templates | kiln-ship |

## Order of work

The engine goes first because every other package points at it. Next comes create-kiln-system,
which then depends on the engine instead of copying it. The docs kit comes after that, since it is
the part most often fixed in one system and lost to the rest. kiln-ship comes last, because it is
only needed once a system is finished.
