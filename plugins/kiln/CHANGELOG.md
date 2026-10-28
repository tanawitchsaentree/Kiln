# kiln — changelog

## 2.1.0 — design quality is checked, not hoped for

The user put Pane into a real app and found four components that were the defaults of every UI
kit: an iOS toggle, a dropdown whose highlight did not sit in its flyout, a search field that
vanished on white, and a flat blue button. Each came from a step kiln let through. This release
closes those steps.

- **Every component names its own default.** A family derivation (one form language for eleven
  components) used to be copied into every member, so a member's own habit was never named. The
  rationale check now fails a `default_to_avoid` that does not mention the component or a word
  from its `kind` (for example `"kind": ["toggle"]` for a Switch).
- **G-NT2, control edges at 3:1** (WCAG 1.4.11) for every field, select, checkbox, radio and
  switch on every component page, in every theme. Over glass or a photo the ground is read from
  real pixels (a ring just outside the control against a band just inside it), because a walk over
  background colours cannot see a dimmed photo and falls through to white.
- **G-NR1, nested flyout corners.** Every open listbox and menu: a row's radius equals the sheet
  radius minus the inset, and a radius over half the row height fails as pill rows.
- **No release with underived components.** `release-pack` refuses while
  `rationale.pendingDerivation` is not empty (`--allow-pending` only for a private test pack).
- **Style tab names the right tokens.** spec-capture painted every token into every probe property,
  and a token invalid for a property (a shadow in `color`) read back as the inherited value, so white
  text was named a shadow token. The probe now sits in a wrapper whose inherited values no token has.
  A root that draws nothing (a wrapper around cells) is described by its first part that draws, and a
  part with no text is not given a text colour.
- **G-CL1 exceptions are declared.** A page in `docs.history` (a decision log) and an element marked
  `data-not-token` (another brand's colour, quoted for comparison) are skipped; nothing else is.
- **G-K5** ignores properties left at their defaults (opacity 1, auto, normal, transparent).
- **Pane as the proof.** Button, Switch, Input (and its family) and Select went through a second
  derivation round with three rendered variants each and agent picks logged in `system/REVIEW.md`;
  both new gates failed the shipped forms first and pass on the redraw (188 controls).

## 2.0.0 — a system repo you can start from, and the Pane retro built into it

Pane (glass on a curtain-wall frame) was the first system kiln built to a real milestone. The user
hit 68 problems on the way. This release moves the fixes into what the next system starts from,
so nobody hits them again.

- **Starter + `bin/create.mjs`** — `node bin/create.mjs <dir> --name <name>` makes a working
  monorepo (tokens, React, the docs book, engine, data, hooks) that builds and renders on day one
  with SEED tokens and TODO placeholders, both kept visible by gates until replaced.
- **Agents and workflow skills in the plugin** — interpreter, foundation, token-architect,
  component-engineer, qa-a11y, taste, publisher; `ds-conventions`, `lock-decision`,
  `new-component`, `new-system`, `production-run`.
- **Questions up front** — intake asks once, in one batch; the anchor pick is the only later
  question; agent picks are logged in `system/REVIEW.md` for one milestone review
  (`autonomy.picks: "agent"`, accepted by rationale and the derivation guard).
- **Milestones as code** — `references/milestones.md` and `tooling/kiln/milestone.mjs` (M1:
  infrastructure + wave 1, docs controls included).
- **Honest verify** — `tooling/kiln/verify.mjs` runs every step and every gate, records the run
  with a source hash, refuses a run whose source changed under it, and replaces `--only` lists with
  `docs.advisory` (shown, reasoned, refused at a milestone).
- **New checks** — G-P0 every page renders, G-TODO1 no starter placeholder, G-NAV1 every page in
  the nav, G-SM1 anchors clear the sticky header, G-TT1 44px hit areas, token-contract (every
  `var(--ds-*)` declared), lint for raw opacity and scale, the derivation guard on Bash writes.
- **Engine-owned conformance** — component behaviour checks live in `system/conformance/*.mjs`;
  a component chapter with no checks fails.
- **Proven on a second system** — a lab sample-tracking system (pharmaceutical-label lineage, no
  glass) was built from an empty folder with `bin/create.mjs` to milestone M1: `pnpm run milestone`
  25/25 on a full recorded verify (16/16 steps, docs gates 40/40, tone 83/83 pages). The run found
  and fixed about fifteen faults in kiln itself, among them G-CL1 (stale colour values in prose),
  forced-colours knobs drawn as backgrounds, and verify typechecking before the build on a fresh clone.

## 1.5.0 — Phase 5's checkpoint now shows on the page itself, not just in chat

Triggered by a real run (a school-landing brief, 2026-09-02): Phase 5 built its thin slice (2 of 8
named sections, per the brief's own riskiest-slice call) and asked the required approval question
clearly in chat — but the same message invited opening the rendered page directly
("Open it in a browser if you want to see it live"), and the page itself carried no signal that it
was a deliberate 2-of-8 checkpoint rather than broken or abandoned work. Read cold, a short page with
no visible content past section 2 and no on-page explanation is indistinguishable from a build that
failed partway through.

- **`phases/5-slice.md`** — for any slice that renders as a real page a person can open in a
  browser, a visible on-page banner is now required before showing the slice: what's built, what's
  still pending by name, stated as a checkpoint. Not a replacement for the chat question — a second
  copy of the same fact, placed where someone who skips the text still sees it.
- **`phases/6-expand.md`** — removing that banner is now the first act of Phase 6, before any other
  building starts, so it never survives into the shipped system.

Not code-enforced (unlike the Phase 5 approval gate itself, which `kiln_state.py` blocks
mechanically) — this is a process instruction, the same category as the rest of Phase 5's prose.
Honestly scoped as that, not overstated as a harness guarantee.

## 1.4.0 — G13's "a script cannot do this" claim was false, and it was hiding the wrong gate number too

Triggered by a real user audit against a real build (a Dial-lineage marketing site, 2026-08-24):
five findings that survived a full Phase 7 gate pass — two nested-border collisions (icon box
inside a bordered card; three concentric rings plus the shield's own border and glow, all in one
small area), one three-way icon-container ratio mismatch across three components (2.2 / 2.25 / 2.4
for what reads as one repeated pattern), a progress line pinned to a fixed offset instead of the
step circles' real rendered centers, and a pricing CTA not locked to the same height token as its
hero siblings. The user's own root-cause note named the proximate cause correctly: `spacing-engine`
was never invoked at gate time. Checking why turned up two compounding bugs in the skill itself, not
just a missed step:

- **`references/technique/craft.md` claimed "Gate G13... is the one gate a script cannot do."**
  False. `spacing-engine` exists specifically to disprove that for spacing/clearance defects (see
  that skill's own README, the stats-row defect), and nested-radius math, border-weight derivation,
  ratio-locking, and positional dependency are exactly as measurable. That claim is what kept
  `spacing-engine` parked at Phase 6 (token derivation only) and never re-run against what actually
  got rendered.
- **The same file also claimed its checklist's evidence attaches to "Gate G2 in both [precision and
  coherence] gate sets."** Also false, and worse than the first bug: G2 means a completely
  different thing per set (precision: optical correction; coherence: signature move present and
  load-bearing; restraint: the refusal holds without exception) — only precision's G2 actually
  matches this file's contents. A build routed to the coherence or restraint set (which a
  loud/expressive lineage like this one is, by Phase 7's own routing rule) had nowhere for this
  checklist to report at all. G13 is the one gate number every set actually shares; the checklist
  now reports there, always.

Fixed, not just documented:

- **G13 in all three gate files (`gates-precision.md`, `gates-coherence.md`, `gates-restraint.md`)
  now requires a scripted pass before the human render-and-look pass**: `spacing-engine`'s `spacing
  audit` (G-S1 through the new G-S6) plus the new `scripts/check_ratio_lock.py`, both against the
  actual rendered build. `phases/7-gates.md` states this as a required step, every build, regardless
  of scale or which gate set applies — not an optional Phase-6-only derivation step.
- **New law `spacing-engine`'s L8 / gate G-S6 — positional dependency**: an element whose job is to
  track another element's real position (a connector line through markers, an underline sized to a
  label) is measured against that element's actual rendered geometry, never a fixed offset tuned to
  one specific render. Spec and Gate-Proof protocol written; **not yet Gate-Proofed against a live
  build** — stated honestly as advisory per that skill's own Gate-Proof discipline, not claimed as
  proven.
- **New script `scripts/check_ratio_lock.py` + `check_ratio_lock.selftest.py`** — Gate-Proofed now,
  with the real Dial numbers as the failing fixture (44:20 / 36:16 / 48:20, exit 1, names both
  mismatched ratios and what they should be) and a real passing case (two instances agreeing on
  2.2, exit 0). The selftest's first draft caught a real crash in the script itself (a single-
  instance call divided by a `None` locked-ratio) before this shipped — kept as a live regression
  test, not fixed quietly and forgotten.
- **`references/technique/craft.md`** gained the two missing checklist items these findings
  actually needed (`One frame per boundary`, `Locked ratio, not a per-instance guess`) alongside the
  corrected G13/G2 routing.

**Honestly scoped:** the border-nesting and ratio-lock findings are now checkable
(`check_ratio_lock.py`, Gate-Proofed). The connector-alignment law (G-S6) has a spec and a Gate-Proof
protocol but no live-build run yet — the next build that has a tracking connector element is where
that actually gets proven, not asserted here. Nested-border *detection* (as opposed to ratio-
locking) still has no script — `craft.md`'s new "one frame per boundary" item is a checklist rule
checked by eye at G13's human pass, same as before this fix, until someone writes the DOM-structural
scan for it.

## 1.3.0 — The harness can now actually stop you, not just record what happened

1.2.0's harness could tell you Phase 5 was skipped after the fact, by reading `.kiln/state.json`.
It could not stop the file from being written in the first place — `guard` is a check something
else has to remember to call. This closes that gap with a real blocking mechanism, verified
against Claude Code's own hook exit-code and JSON decision semantics before shipping (not guessed):

- **`hooks/hooks.json` + `hooks/pre-write-guard.sh`** — a `PreToolUse` hook that runs before every
  Edit/Write. Inside a project `.kiln/state.json` is tracking, writing a token/style/component file
  (`.css`, `.scss`, `.ts`, `.tsx`, `.js`, `.jsx`, `.json`) while the state machine is still before
  Phase 5 gets denied outright, via the documented `permissionDecision: "deny"` JSON response, with
  a reason Claude actually sees and can act on. `.kiln/`'s own files are always exempt, so the
  harness can never gate itself into a deadlock, and a corrupt or unreadable `state.json` fails
  open (allows) rather than blocking on a guess.
- **`hooks/pre-write-guard.selftest.py`** — seven real cases via subprocess, feeding the hook real
  JSON on stdin the way Claude Code actually does: no-state-file silence, phase-0 denial, the
  `.kiln/` exemption, non-gated extensions passing through, the gate reopening at phase 5, staying
  open at phase 6, and the corrupt-state fail-open case. Also retroactively closed the same gap in
  design-system-forge's own hook (`post-edit-audit.selftest.py` didn't exist before this pass
  either — proven only by hand in the session that shipped it, now a standing test).

**Honestly scoped:** this only governs the default `build` flow, same as the harness itself. It
also can't distinguish "Phase 5 legitimately writing its own thin slice" from "someone jumped
straight to Phase 5 without doing the earlier work honestly" — the gate is phase-number-based, not
content-aware, and phase 5 onward is deliberately ungated for exactly that reason.

## 1.2.0 — A real execution harness, not just prose shaped like one

Prompted by a direct question: does kiln actually work as graph engineering (node/edge/state/
prompt/harness), or does it just read that way? Checked against the actual code — zero lines
anywhere implement phase sequencing, edge-condition evaluation, or state persistence; `.kiln/
cache.json` and `.kiln/log.json` are cross-session memory, not intra-run state; nothing enforces
the stated Phase 5 stop-for-approval checkpoint. The phases read like nodes, the "carry forward"
lists read like state, but none of it was checked by anything — a context reset was safe only if
the model correctly recalled what to carry forward, and Phase 6 could start the moment the model
decided to, whether or not Phase 5 was actually approved.

That gap is closed here, not papered over with more prose:

- **`scripts/kiln_state.py`** — the harness. `.kiln/state.json` is a real, on-disk state object:
  current phase, the exact carry-forward fields recorded so far, and a full history with
  timestamps. Four commands: `init` (starts a run), `advance` (attempts a phase transition —
  rejected outright if a required field named in `REQUIRED_FIELDS` is missing), `status` (reload
  state after a context reset instead of trusting recall), `guard` (a read-only check — e.g.
  `guard --min-phase 6` — usable by a hook or a human to block risky work before the state machine
  says it's actually allowed).
- **The Phase 5 checkpoint is now enforced by code.** `advance` refuses to move past phase 5
  unless `approved: true` is genuinely present in the call — sending it early "to unblock yourself"
  is now a rejected call, not a private choice nothing checks.
- **The one real branch (Phase 3, only when a reference exists) is now computed by the harness**,
  from `has_reference` recorded at Phase 0 — not re-decided by the model at Phase 2.
- Every phase file (`phases/0` through `phases/8`) now names the exact `advance --data` call and
  field names for that phase's exit, so the prose and the code's `REQUIRED_FIELDS` table say the
  same thing — and if they ever drift, the code is the source of truth, stated explicitly in
  `SKILL.md`.
- **Gate-proofed like everything else in this repo:** `scripts/kiln_state.selftest.py` plants five
  real violations (a missing required field, advancing past phase 5 without approval, re-init over
  a live run, checking both reference-branch directions) against a temp directory via subprocess,
  and asserts each is rejected. Verified end to end with a full, realistic 9-phase run (a
  physiotherapy-clinic-booking brief) through every phase including the reject-then-approve
  sequence at phase 5.

**Scope, stated plainly:** this harness governs the default `build` flow (phases 0-8) only.
`study`/`audit`/`extend`/`component`/`docs` don't use it — they were never phase-sequenced the same
way, and forcing them through this state machine would be solving a problem they don't have.

**Still not a graph engine in the formal sense**, and that's a deliberate scope decision, not an
oversight: there is no expression-based edge evaluator (the one real branch is a single hardcoded
`if`), no typed state schema beyond "these keys must be present," and no persistence backend beyond
a JSON file. What changed is narrower and more honest than that: the specific two failures a real
user hit — an unenforced approval checkpoint, and carry-forward state that only existed in
conversational memory — are now things code checks, not just prose that asks nicely.

## 1.1.0 and earlier

See git history — the audit-fix pass (npx installer, `audit_kit.py` path-resolution fix, the real
G12 baseline measurement, `check_vector.selftest.py`'s restraint-branch coverage) predates this
changelog file.
