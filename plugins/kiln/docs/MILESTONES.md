# Milestones, step by step

Most people cannot ask for a whole design system in one message. They do not know yet what a
benchmark system holds, and they find out by looking at what comes back. Pane showed the cost of
that. The user asked for one thing, saw the result, and then had to ask for the next thing the
system should already have had, over and over (`pilot-glass/system/RETRO.md`).

So kiln walks a fixed path of six milestones. At each one it asks only what that step needs, builds
and measures without stopping, and hands over a short menu of what is still missing against the
benchmark. The user ticks what they want next. Nothing on the menu is a question the agent should
have answered itself; every item is a scope choice that only the user can make.

`pnpm run milestone` prints the menu for the current milestone from
`tooling/kiln/milestone-menu.json`. The menu in this file and the JSON hold the same items.

## How this maps to the engine's milestones

`skills/kiln/references/milestones.md` defines what `milestone.mjs` checks, and that stays the
rule. This file is the user's view of the same path.

| This path | Engine check | Note |
|---|---|---|
| M0 | part of engine M1 (brief, concept, anchor rows) | no separate check; M1 refuses to close without it |
| M1 | engine M1 | the full M1 table, unchanged |
| M2 | engine M2 in `milestone.definitions` | one wave of molecules |
| M3 | engine M3 in `milestone.definitions` | one wave of organisms |
| M4 | engine M4 in `milestone.definitions` | book depth past the M1 floor |
| M5 | Phase 8 and release checks | the user publishes |

Engine M1 already asks for the foundations and the twelve patterns at the content-model floor.
Here the path's M1 names what the user sees for the first time, and M4 takes the same chapters to
Carbon depth.

## M0 · questions once, then the anchor

kiln asks every question in `system/INTAKE.md` in one batch. That covers the product, the audience,
the references, the language of the book, the platforms and who picks the variants. After that it
asks one visual question, which anchor to build from.

It renders the relationship card, the lineage and three or four anchor variants in
`apps/lab/anchor/`, all on the same backdrops.

It measures the vector with `check_vector.py`, the concept with `rationale.mjs`, and contrast on
each anchor variant in light and dark.

It hands over `system/INTAKE.md` with every default marked "(default, agent)", `system/CONCEPT.md`
and the anchor lab page.

Still missing against the benchmark:

- [ ] A second reference system to measure against
- [ ] A named material or style recipe for the anchor
- [ ] A second language for the book
- [ ] A brand colour other than the default
- [ ] Platforms past the web (iOS, Android, Figma)
- [ ] The user picks variants instead of the agent

## M1 · tokens, wave 1, the book shell, the states page

kiln asks nothing new. The anchor pick from M0 is enough.

It renders tokens in three tiers for every theme, the layout primitives and Tier 1 atoms (at least
twelve, including the Select and Slider the book itself uses), the book shell, and the states
page at `/patterns/states`, which shows every promised state of every component.

It measures with rationale, token-contract, conformance, the shell gates G-S1 to G-S6, G-N1,
G-SV1, G-ST1, G-IN1, G-NC1, G-PUB1, the tone gate and smoke-import, then runs a full verify.

It hands over the book on a URL the user can open, `system/REVIEW.md` with every pick the agent made,
and one installable tarball.

Still missing against the benchmark:

- [ ] Form controls past Select and Slider (checkbox, radio, switch, text field)
- [ ] A second backdrop scene for the book
- [ ] Motion tokens shown in a playground
- [ ] Dense and comfortable density modes
- [ ] Right-to-left layout checked in the book
- [ ] Icons drawn for this system

## M2 · forms and molecules

kiln asks which form controls the product needs first, as one checklist, with the benchmark's set
already ticked.

It renders Tier 2 molecules, which are the field family, menus, tabs, popovers, tooltips and
toasts. Each one is derived, picked from three variants and given its four tabs.

It measures with G-IN1, G-TX1 (Thai marks and width while typing), G-RH1, G-NC1, G-EL1, G-K1 to
G-K8 and conformance for keyboard and focus, the same as M1 for everything else.

It hands over the forms pattern page with a working validation example, and the updated REVIEW.md.

Still missing against the benchmark:

- [ ] Date and time pickers
- [ ] A combobox with search
- [ ] File upload
- [ ] Form validation copy in the book's language
- [ ] A command menu
- [ ] Toasts placed and stacked across the app

## M3 · organisms and data

kiln asks which data views the product shows, such as tables, charts, lists or dashboards.

It renders Tier 3 organisms, which are the navbar, sidebar, dialog, data table, empty states and
chart frames, each on bright and dark backdrops.

It measures with G-MT1 (one material per screen), G-GR1 (the shared glass recipe), G-BR1 (a surface
that claims its own ground paints one), G-MS1 (a mesh covers at most a tenth of its region), G-GL1,
G-OV1, and contrast on every backdrop scene.

It hands over the data pattern pages and the dashboard template in the book.

Still missing against the benchmark:

- [ ] Charts with the dataviz palette
- [ ] Virtualised long lists
- [ ] A full page template (settings, dashboard, sign-in)
- [ ] Chat or agent views
- [ ] Print styles for data views
- [ ] Empty, loading and error states for every data view

## M4 · the book at depth

kiln asks nothing, unless the user ticked materials or brands on an earlier menu.

It renders every component page at Carbon depth (four tabs, the usage registry and a generated
Style tab), the twelve patterns written out in full, a materials chapter when the system has more
than one material, a brands chapter with the theme builder, and the full token reference.

It measures with G-BT1, G-IA1, G-F1, G-W1, G-TODO1, G-AN1 (each surface still looks like the locked
anchor), the depth benchmark (`benchmark-depth.mjs`) and the tone gate on every page.

It hands over the whole book and a word-count table against Carbon.

Still missing against the benchmark:

- [ ] A brand theme builder in the book
- [ ] A second material
- [ ] Figma variables exported from the tokens
- [ ] A migration guide between versions
- [ ] An accessibility statement with the evidence
- [ ] Contribution guidelines

## M5 · ship

kiln asks for the package names and where the book should live. It never asks for credentials.

It renders the release tarball, the consumer skill, the llms and knowledge files, the MCP server
and the theme CLI from the kiln-ship templates (see `docs/PACKAGES.md`).

It measures with pack-verify, smoke-import in an empty project, G-TS1 (tree-shaking), G-PUB1
(every install line works) and a full verify on the source that is on disk.

It hands over the release folder and a short list of the commands only the user runs (npm publish,
git push).

Still missing against the benchmark:

- [ ] A public docs host
- [ ] Versioned changelogs per package
- [ ] A Vue or Web Components adapter
- [ ] A visual regression run in CI
- [ ] Usage analytics opt-in for the MCP server
- [ ] A licence key flow for paid parts
