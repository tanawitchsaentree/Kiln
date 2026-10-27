# Design system — kiln build (kiln DS v2)

This repo is one design system built with **kiln** (Claude Code plugin `kiln`, skills `kiln:*`). It
produces a tokens package, a React component library and a docs book, every decision traced to a
**concept**, a **lineage** (one named tradition from outside web UI) and an **intensity vector**, so the
result does not collapse toward the statistical middle. kiln's skills are the source of truth for
lineage, vector, derivation and gate mechanics; this file routes to them and sets the working rules.

The starter you are reading was cut from Pane, the first system built to the end with kiln. Every
rule below that cites a date comes from something that went wrong there and cost the user time.

## Memory protocol (every session, no exception)

1. Read `system/NEXT.md` (the handoff), then `system/STATE.md` (phase, wave, counts).
2. Read `system/DECISIONS.md`. **Never contradict a locked decision.**
3. Read `system/INTAKE.md`. It holds the user's answers; do not ask them again.
4. At the end of every real task, update `system/STATE.md`; at the end of every session and before
   any run longer than ten minutes, rewrite `system/NEXT.md` from its template headings.
5. Every structural decision goes through skill `kiln:lock-decision`, same format every time.
6. One backlog, root `BACKLOG.md`. Anything found but not decided goes there once.

## Talking to the user

- **Reply in the user's language** (the language of their messages: for a Thai speaker, Thai), every
  message, including long reports. Code, paths and identifiers stay as they are. The book itself
  is written in the language set in INTAKE. (2026-10-27: replies drifted to English for a whole
  session after the user had asked for Thai.)
- **Questions are asked once, at the start.** Phase 0 asks everything in `system/INTAKE.md` in one
  batch (up to four questions at a time). After that the user answers one visual question, the
  anchor pick, and then nothing until the milestone review. Decide sub-choices yourself, render
  the alternatives, record the reason, keep working. Never end a message with "shall I continue?"
  or "want me to…?" when the next step is already clear. (2026-10-27: the user said
  "ระหว่างที่เริ่มทำจะไม่ถามคำถาม แต่จะถามคำถามตอนแรกเท่านั้น".)
- **Report what is true.** Red checks are reported with their first failing line. A claim about
  the code (a size, a key, a token value) is checked against the code or the measurement before it
  goes into the book or a report. (Pane: seven facts in the docs were wrong, from 44px buttons that
  were 36px to a hover rule that did not exist.)

## Iron rules (a violation is a bug)

1. **Three-tier tokens.** Primitive → semantic → component. Component tokens never point at a
   primitive; component CSS never holds a raw value (the lint hook catches hex, px, opacity and
   scale numbers). `token-contract` fails on any `var(--ds-*)` no token declares.
2. **Render before deciding.** Every visual decision renders candidates in `apps/lab/` first. With
   `autonomy.picks: "agent"` (kiln.config.json) the agent picks, writes `variants.by: "agent"` and
   `variants.reason` in the component's why.json and adds a row to `system/REVIEW.md`. With `"user"`
   the user picks. Never pick the anchor for the user.
3. **Intake once.** Phase 0 is `system/INTAKE.md`, asked in one batch. Missing answers get a
   sensible default the agent writes into INTAKE with "(default, agent)", and the work goes on.
4. **Dependency order.** Layout primitives → Tier 1 atoms → Tier 2 molecules → Tier 3 organisms.
   Wave 1 includes **every control the docs book itself uses** (a Select and a Slider at least), so
   the playgrounds and the backdrop picker are the system's own components. `system/controls.tsx`
   is native on purpose until then, and G-N1 stays red until it is replaced. (Pane: the docs ran on
   browser selects and range inputs for two waves.)
5. **Definition of Done** for a component = the Anatomy Contract's 9 points + docs point 10 +
   conformance point 11 (skill `kiln:ds-conventions`), plus a check file in `system/conformance/`
   that names it. The engine fails any chapter with no behaviour checks.
6. **The QA gate is sacred.** A component that fails `qa-a11y` never enters the book as done.
7. **Rigor tiers scale the rigor, not the standard.**
8. **Docs are written the moment a component passes QA**, never batched to the end.
9. **Anchor round before any build.** One concept-dense component (several overlapping layers:
   image, avatar over cover, stats, tabs, a nested card, actions), 3–4 variants inside the refs'
   direction, rendered in `apps/lab/anchor/`. The user picks; everything derives from it.
10. **Docs are a book** built to `kiln:docs-engine`'s content model at Carbon depth: four tabs per
    component, the U1–U14 usage registry, a generated Style tab, ≥0.5 × Carbon's words, foundations
    with live playgrounds and the reference systems' topics (G-BT1), the twelve patterns, and a
    full token reference. Every sentence passes human-tone (`tone-gate`). The agent scopes and
    writes it; the user never lists what goes in.
11. **The user's standards are the Definition of Done.** `docs/USER-STANDARDS.md` lists what users
    have already had to ask for once. Check every row before calling anything done.
12. **Concept before design, reasons for everything.** `system/CONCEPT.md` first; every token
    carries `kiln.why`, every component a `<Name>.why.json` covering each part, state and motion.
    The starter's `SEED` reasons are allowed only while `tokens.allowSeed` is true; Phase 2 replaces
    every one and sets it to false.
13. **Derive every component; fix the step that made the mistake.** Name the default it must not
    become, cite the lineage, quote the principles, render three variants, pick. The derivation
    guard blocks CSS/TSX before that, **including through Bash**: never write a component's CSS or
    TSX with `cat >`, `sed -i` or a script to get around the guard. When the user criticises a
    result, write `system/RETRO.md` (complaint, the step that produced it, what changed in it).
14. **Milestones are checked, not declared.** The current milestone is in kiln.config.json and its
    meaning in skill `kiln:kiln` `references/milestones.md`. `pnpm run milestone` decides; a
    milestone is done only when it prints done. M1 = infrastructure + wave 1 at full depth.
15. **Verify honestly.** `pnpm run verify` runs every step and every gate and records the run in
    `system/reports/verify-latest.json` with a hash of the source. Never run gates with `--only` as
    proof of anything. A gate that cannot pass yet goes in `docs.advisory` with a reason, where the
    milestone check will refuse it. **Do not edit source while a full verify runs**; the run marks
    itself invalid if you do, and a green from before an edit says nothing about the code after it.
16. **Keep the machine usable.** Every browser step runs at `nice -n 19` (verify does this). Run
    one docs preview server at most, started in the background and stopped when the task ends.
    Never leave orphan background processes. Use `verify:quick` while working; the full verify
    (the better part of an hour) runs before a commit that changes how things look.

## Phase order

| # | Phase | Owner | Output | User touch |
|---|---|---|---|---|
| 0 | Intake | `interpreter` | `system/INTAKE.md` answered, relationship card, lineage | one batch of questions |
| 1 | Concept + vector | `foundation` | `system/CONCEPT.md` principles, six-axis vector, form language | none (agent picks, logged) |
| — | Anchor | `foundation` | 3–4 anchor variants in `apps/lab/anchor/` | **the anchor pick** |
| 2 | Foundations | `token-architect` | tokens with this system's reasons in every theme, `allowSeed: false` | none |
| 3–5 | Wave 1 | skill `kiln:production-run` | layout + atoms + the docs' controls, each with its docs pages | none (agent picks, logged) |
| 6 | Book | `publisher` | foundations, patterns, guides, reference, all at depth | none |
| 7 | Taste + verify | `taste` | gates, `pnpm run verify` full, `pnpm run milestone` | **milestone review**: REVIEW.md + the book |
| 8 | Release | user | npm publish, git push | the user's own hands only |

## Commands

| Command | What it does |
|---|---|
| `pnpm run docs:dev` | the book with hot reload |
| `pnpm run verify:quick` | build, lint, types, token contract, reasons, conformance (minutes) |
| `pnpm run verify` | everything, recorded (60–90 minutes; do not edit while it runs) |
| `pnpm run milestone` | may the current milestone close |
| `pnpm run release:pack` | one installable tarball in `release/` (the React package carries the tokens) |
| `node tooling/kiln/sync.mjs --check` | the engine copy matches kiln; engine fixes go to kiln, never here |

## Stack

pnpm + Turborepo · tokens = DTCG JSON in three tiers, built by `packages/tokens/build.mjs` · React +
CSS Modules + CSS variables · behaviour borrowed from Radix or React Aria and wrapped in tokens ·
docs = the kiln book in `apps/docs` · RTL-ready: logical properties only. One install for
consumers: `npm i <name>-react`, `import '<name>-react/all.css'`.

## Credentials and publishing

Never run `npm publish`, `npm login`, `git push`, or anything that submits, deploys or transmits the
work outside the project. Never read, request or handle a credential, token or secret, however
directly the moment seems to call for it. Phase 8 is the user's own hands, always.
