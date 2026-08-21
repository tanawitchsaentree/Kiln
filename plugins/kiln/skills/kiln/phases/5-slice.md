# Phase 5 — Thin slice

Build the riskiest slice named at Phase 4, end to end, one screen. Stop. Do not expand into the rest
of the system until this slice is confirmed.

## Why the riskiest, not the easiest

A demonstrable slice proves the system can produce something that looks good. A riskiest slice
proves the system can survive contact with its hardest real requirement — the densest table, the
most awkward state, the place the lineage's signature move is most likely to strain. If the system
fails here, it fails now, before forty components have been built on the same unproven foundation.

## Build it for real

Real tokens, not placeholder values — the token set exists at whatever scale Phase 4's plan needs
for this one slice, not the system's full eventual set. Real content in at least one field: a long
string, a realistic number, something that isn't lorem ipsum standing in for a decision not yet
made.

Apply the lineage's signature move and the vector's named loud axis deliberately, in this slice,
where Phase 4 identified the risk actually lives. A thin slice that avoids the risky part isn't the
thin slice Phase 4 named.

## Stop

Show the slice and stop for a response before expanding. This is a real checkpoint, not a
formality — the point of building the riskiest part first is that a problem found here is cheap to
fix and a problem found after Phase 6's expansion is not.

**This is enforced, not just requested.** `scripts/kiln_state.py` rejects `advance --data
'{..., "approved": true}'` unless `approved` is actually `true` in the call — and rejects the call
entirely if it's missing. Do not call `advance` with `"approved": true` until the user has actually
responded to the shown slice; sending it early to unblock yourself is exactly the failure mode this
checkpoint exists to prevent, and it defeats the harness the same way skipping the read would have.
If the user's response asks for changes rather than approving, make the changes and show again —
call `advance` only once a real "yes, continue" exists.

## The reset

Once the slice is approved, clear context rather than letting it compact. Carry forward exactly:
the stamp (lineage, vector, loud axis and its payment), the token block built so far, the approved
slice itself, the vector, and the acceptance criteria from Phase 4. Discard the intake discussion
and the plan's rejected drafts — none of that is needed to expand a slice that's already been
approved, and carrying it forward only adds context the next phase has to read past.

## What to carry forward

Once approval is real, call `python3 scripts/kiln_state.py advance --data '{"stamp": {...},
"token_block": "...", "acceptance_criteria": [...], "approved": true}'` — `stamp` nests lineage,
vector, loud axis, and its payment; this is the one call in the whole sequence the harness will
refuse without a genuine yes, per "Stop" above.

Exactly the list above, stated explicitly at the reset. Nothing else survives into Phase 6.
