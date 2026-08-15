# Gates — G-F1 through G-F3

Form cannot be fully numeric — no CSS property directly encodes "does this look like a raised
hardware key." These three gates check the measurable MARKERS a real form treatment leaves behind
(a real box-shadow value, a real spec section, a real decision-log entry) — they are proxies for the
actual gate, which is a human looking at a rendered lab grid and picking with their eyes (Part 3 of
the `form-language` order, the multi-candidate lab round). G-F3 exists specifically to make that
eyes-on step unskippable, not to replace it with a checkbox.

## G-F1 — recipe markers

**Check:** a component whose class (per `system/FORM.md`) demands depth (control or input class)
renders `box-shadow: none` on its raised/inset state, or has no measured shadow/inset shift between
resting and pressed/focus states → red.
**Computed by:** read the component's real rendered `getComputedStyle` (or, pre-render, its
`.module.css`) for the state in question; a control-class component's resting state must resolve a
non-`none` `box-shadow` sourced from a `shadow.raised.*` token (or documented as N/A with a named
reason if this system's own FORM.md explicitly exempts it); its pressed state must resolve a
DIFFERENT shadow value (the inset swap), not the same value with only a fill-color change.
**Gate-Proof:** on a real control-class component, remove its raised-state shadow rule (or set it to
`none`); confirm the gate flags it; revert; re-confirm green. Separately: make the pressed state
reuse the resting state's exact shadow value (removing the inset swap) on a real component; confirm
the gate flags the missing state transition; revert; re-confirm green.

## G-F2 — form-goal presence

**Check:** a component spec (the pre-build proposal written in `new-component`'s Propose-API step,
or the shipped `packages/spec/{name}.md` if the docs layer is where this is tracked) has no FORM
GOAL section, or has one that doesn't cite `system/FORM.md`'s class table → red.
**Computed by:** grep the component's spec file for a `FORM GOAL` heading (or equivalent named
section) and confirm its 1-3 sentences are traceable to a real row in FORM.md's per-class table
(same silhouette/depth vocabulary, not a paraphrase invented independently).
**Gate-Proof:** on a real component spec, delete the FORM GOAL section; confirm the gate flags its
absence; restore it; re-confirm green.

## G-F3 — identity-component lock

**Check:** an identity component (Button, Input, Switch, Checkbox, Card, Slider — the components
that carry the system's face, per `SKILL.md`'s own list) is shipped (has passed whatever this
project's own QA gate is and reached whatever this project's own publish/release step is) without a
corresponding decision-log entry that cites a real multi-candidate round (`variant-foundry`'s loop,
≥3 real candidates, a screenshot or archived-candidate path on file) → red.
**Computed by:** for each identity component, search the project's decision log (`system/
DECISIONS.md` in a kiln-conventioned project, an ADR directory, a CHANGELOG entry — whatever this
project actually uses) for an entry whose rationale/impact text references that component's form AND
cites a real screenshot or candidate-archive path; absence of such an entry, regardless of how long
the component has otherwise been shipped, is red.
**Gate-Proof:** on a real identity component that has a valid lock entry, temporarily strip the
screenshot/candidate-path reference from its decision-log entry (simulating a component that
shipped without the eyes-on round); confirm the gate flags it; restore the original entry text
byte-for-byte; re-confirm green.

## Gate-Proof discipline

Same standing rule every gate set in this skill family follows: a gate only counts as proven once a
real violation was planted, confirmed red with the exact failing marker (not "something failed"),
reverted, and re-confirmed green. Record the before/after evidence in whatever report cites the
gate.
