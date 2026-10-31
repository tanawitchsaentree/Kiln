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

<!-- kiln:rules:start (one set of rules: kiln/CLAUDE.md and starter/CLAUDE.md carry this block word for word; tooling/rules-check.mjs) -->
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
   direction, rendered in `apps/lab/anchor/`. The user picks; everything derives from it. At the lock,
   `tooling/kiln/anchor-likeness.mjs --record` measures the picked card so G-AN1 holds the system to it.
10. **Docs are a book** built to `kiln:docs-engine`'s content model at Carbon depth: four tabs per
    component, the U1–U14 usage registry, a generated Style tab, ≥0.5 × Carbon's words, foundations
    with live playgrounds and the reference systems' topics (G-BT1), the twelve patterns, and a
    full token reference. Every sentence passes human-tone (`tone-gate`). The agent scopes and
    writes it; the user never lists what goes in.
    The shell counts too: one chapter is one page that opens at the top with focus on its heading,
    a collapsing Menu and drawer on narrow screens (G-S1 to G-S6 at 375, 768 and 1280px). Human-tone
    runs `tone_rules` before drafting, `sniff_text` on existing prose, `compare_text` after a rewrite.

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

14. **Gates measure; they do not decide the look.** Fix a failed measurement with the lightest change
    that clears it (the material, the ground, the token), never by adding weight the concept does not
    ask for, and show the before and after before calling it done. (Pane, 2026-10-29: a 2px 80% white
    lip passed G-NT2 and the user hated it at first sight.) Every user complaint about geometry or
    state becomes a gate the same day, proven red on the broken build: G-IN1 (text clears its
    control's edge), G-ST1 (no default written into the URL), G-RH1 (separate steps stand 24px
    apart), G-SL1 (a slider keeps its length and size from Home to End), G-GL1 (glow declared and
    measured), G-SV1 (every promised state present, visible and announced, on the state matrix; a
    book with no `/patterns/states` page or an empty matrix fails), G-TX1 (a field holds Thai marks and
    keeps its width while typing), G-NC1 (a shape near a rounded corner nests it: even inset, inner =
    outer − inset), G-NR1, G-EL1,
    G-TS1 (one component imported alone costs only that component), G-GR1 (every glass uses the shared
    recipe: blur, saturate and brightness through tokens; Pane's Navbar blurred only and its text fell to
    3.4:1), G-BR1 (a subject shown as its own surface paints one, and no live text sits on the photo with
    no pane), G-AN1 (the card stays within set deltas of the locked anchor's body and rim; R-032) and
    G-MS1 (a mesh gradient covers at most 10% of its region, never a wallpaper; user rule 2026-10-31).
    Each is proven red on a planted violation (`tooling/kiln/surface-probes.proof.mjs` for the last
    four). When a shared container changes (a stage, a shell), re-check every component that takes its
    size from its container.

15. **The address holds only choices.** The docs app never writes a default into the URL or
    storage, validates every value it reads back, and drops what it no longer knows. Changing a
    default ships with the migration of old links and stored values (G-ST1). (Pane, 2026-10-29:
    ?scene=room, written on every page, kept the old backdrop alive after the default changed.)

16. **Agent hygiene: small output, short checks, a real place to look.**
    - Every shell call caps what it prints (tail, head, grep -c, cut). Long results go to a file
      and only the summary line comes back; never Read a generated JSON (gates.json, ENGINE.json,
      evidence) in full and never echo a diff of one. Twice in one Pane day a flooded context
      killed the session ("Input is too long").
    - Verify only what changed while working: `pnpm run verify:changed`, `gates.mjs --only <ids>` and
      `KILN_ROUTES`, done in minutes. Such a run is a check for you and proves nothing to the user: it
      writes only a partial report (`evidence-partial-<date>.json`), conformance keeps every other
      component's results stamped with when they ran, and the milestone refuses partial or stale results.
    - The full verify (`pnpm run verify`, recorded in `system/reports/verify-latest.json` with a source
      hash) is a milestone step. The user never waits on it, it never runs while machine load is above
      the core count, and nobody edits source while it runs; the run marks itself invalid if you do.
      A gate that cannot pass yet goes in `docs.advisory` with a reason, where the milestone refuses it.
    - Every browser step runs at `nice -n 19` (verify does this). One docs preview server at most,
      started in the background and stopped when the task ends; no orphan processes.
    - When a change is visible, rebuild what the user is actually looking at and say exactly
      which URL serves it. A local build the user cannot see is not a delivered fix.

17. **An install line is a promise.** The book shows `npm install <name>` only for a package that is
    on the registry (listed in kiln.config `published`, which only the user fills, after Phase 8).
    Until then every install line is the tarball or file path that actually works, and Getting
    started says plainly that the package is not on npm yet. Pane, 2026-10-30: another project ran
    the documented `npm install pane-react`, got 404 twice and stalled. G-PUB1 checks every page.

18. **Milestones are checked by the engine.** The current milestone is in kiln.config.json and its
    meaning in skill `kiln:kiln` `references/milestones.md` and kiln's `docs/MILESTONES.md`.
    `pnpm run milestone` decides; a milestone is done only when it prints done, and it ends by printing
    what is still missing against the benchmark for the user to tick. M1 = infrastructure + wave 1 at
    full depth.
<!-- kiln:rules:end -->

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
| `pnpm run verify:changed` | every step, browser steps only on the routes your change reaches (minutes; proves nothing to the milestone) |
| `pnpm run verify` | everything, recorded; a milestone step, never something the user waits on (do not edit while it runs) |
| `pnpm run milestone` | may the current milestone close, then the "still missing" menu for the user to tick |
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
