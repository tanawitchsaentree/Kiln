# kiln — changelog

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
