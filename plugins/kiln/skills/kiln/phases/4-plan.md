# Phase 4 — Plan and attack

A plan, an out-of-scope list, and acceptance criteria, written before anything gets built. The
critique pass happens in thinking; only the revised plan is shown.

## Plan in thinking, show the revision

Draft a plan, then critique it in thinking before it's shown to anyone — what's the riskiest
assumption in it, what would a reviewer reject first, what's being deferred that shouldn't be. Show
only the revised plan. A rejected plan shown to the user gets re-sent on every later turn and changes
no decision; showing the critique step wastes the user's attention on a draft that's already been
superseded by the time they read it.

## Out-of-scope list

Write what the brief could plausibly have asked for that this build deliberately does not cover.
Written now, before building, this is a commitment. Written after, it's a description of what got
skipped, which is a different and less useful document — it rationalises gaps instead of bounding
the work. This list becomes contract part 8 at Phase 6.

## Acceptance criteria

Three to five brief-specific yes-or-no checks, written before anything exists. Not craft gates —
those are Phase 7's job and apply to every system regardless of brief. These are specific to what
this brief actually needed: if the brief was a monitoring dashboard, a criterion might be "an
operator can identify the one out-of-range reading among twenty without searching," checkable
against the built artefact later, not restated afterward to match whatever got built.

Gate G14 in both `references/gates-precision.md` and `references/gates-coherence.md` runs these
criteria as their own pass at Phase 7, separately from the craft gates — because a system can pass
every craft gate and still fail the actual problem it was built for.

## The riskiest slice, named now

Identify which single screen or component in the plan is the riskiest to get right — not the most
demonstrable, not the simplest. Phase 5 builds this one first. Naming it now, before Phase 5 starts,
keeps the choice honest; picking it in the moment tends to drift toward whatever's easiest to show.

## What to carry forward

Call `python3 scripts/kiln_state.py advance --data '{"plan": "...", "out_of_scope": "...",
"acceptance_criteria": ["...", "..."], "riskiest_slice": "..."}'` before Phase 5 starts.

The revised plan, the out-of-scope list, the acceptance criteria, and the named riskiest slice.
Discard the intake discussion and the rejected draft plan — this is the first of the two hard
context resets `SKILL.md` names, and it happens after Phase 5's slice is approved, not here, but
this phase is where the carry-forward list gets decided.
