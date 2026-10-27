# Milestones

A milestone is the point where the user looks at the work. Between milestones the agent works
without asking; at a milestone it hands over the book, `system/REVIEW.md` and an honest verify. So a
milestone has to mean the same thing every time, and that meaning is code:
`tooling/kiln/milestone.mjs` reads what the runs recorded and says done or not done. The agent's own
account ("all green", "M1 complete") counts for nothing next to it.

This file says what each milestone holds and why. The definitions live in the engine, and a system
can widen them in `system/kiln.config.json` → `milestone.definitions`, never narrow them.

## M1 · infrastructure + wave 1

The first milestone is the one Pane took longest to reach and the one every later milestone stands
on. It is done when all of this is true at once.

| Area | Done means | Checked by |
|---|---|---|
| Brief | `system/INTAKE.md` answered (defaults marked "(default, agent)") | milestone: no TODO( |
| Concept | `system/CONCEPT.md` with ≥3 principles, each with a Therefore for every axis | rationale |
| Anchor | the user picked one of 3–4 anchor variants | DECISIONS, lab |
| Tokens | three tiers, every theme, every token with this system's own reason, `allowSeed: false` | rationale, milestone |
| Wave 1 | layout primitives and Tier 1 atoms, at least 12 components, **including the controls the docs book itself uses** (a Select and a Slider at least) | milestone, G-N1 |
| Each component | derived (why.json), picked (user or agent, logged in REVIEW.md), conformance checks in `system/conformance/`, 4 tabs at Carbon depth | rationale, conformance, G-K1–G-K8 |
| Book | every foundation with a playground and the reference systems' topics, the twelve patterns, guides, reference; no TODO( left | G-F1, G-BT1, G-IA1, G-TODO1 |
| Install | one tarball, one import (`<name>-react/all.css`), typechecked in an empty project | smoke-import |
| Verify | `pnpm run verify` full, every step green, no gate advisory, recorded on the source that is on disk | verify, milestone |
| Handoff | `system/STATE.md` and `system/NEXT.md` written | milestone |

### Why the docs' controls are in wave 1

Pane built its book with native `<select>` and `<input type="range">` because the Select and Slider
came two waves later. The playgrounds looked like a browser, not like the system, and G-N1 had to be
excused for weeks. The book is the system's first consumer; whatever it needs, wave 1 builds.

### Why "on the source that is on disk"

Pane's full verify takes the better part of an hour. Twice, source was edited while it ran, and the
green it printed described code that no longer existed. The run now stores a hash of the source and
the milestone compares it with the files on disk.

### Why no advisory gates at a milestone

`docs.advisory` exists so a gate that cannot pass yet is visible (`!`) without forcing verify into
`--only` lists. Pane's verify ran `gates --only <the ones that passed>`, which hid every new red.
Advisory is honest only if it is temporary, so a milestone refuses to close while any is red.

## Later milestones

M2 and later are one wave each (molecules, then organisms), with the same per-component bar and the
same verify rule. A system defines them in `milestone.definitions` with `minComponents`, `requires`
and `controls`; the engine's M1 is the floor for all of them.

## The review

At a milestone the agent hands over, in the user's language:

1. what `pnpm run milestone` printed,
2. `system/REVIEW.md`: every pick the agent made, with the alternatives' lab paths and the reason,
3. the book (`pnpm run docs:preview`), and what to look at first,
4. the reds that are left in BACKLOG.md, if the milestone is not done.

Anything the user sends back becomes a `system/RETRO.md` entry (the complaint, the step that made
it, what changed in that step) and a new round for that component.
