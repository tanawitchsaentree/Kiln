# Phase 8 — Stamp

Write the stamp, write the log entry, confirm the break clause and extension protocol are actually
stated, not just implied.

## The stamp

A comment at the top of the primary token file, in plain text, stating the lineage, the vector, and
the loud axis with what paid for it:

```
/* kiln 2.0.0 · lineage: nautical-chart · vector: C4 T3 G5 S2 M1 D8
 * loud: density (8), paid by chroma (4→ ok, not extreme) — restated: loud axis needs 8+ to require
 * payment; if D8 is the only axis at 8+, confirm two axes sit at 2 or below covering it.
 */
```

Under a fixed brand constraint, mark the given axes with an asterisk and name the identity source,
per `references/constraint.md`'s stamp format. For a two-lineage hybrid, use that file's hybrid
stamp format with both lineages and both vectors named, and state which surfaces each governs.

## The log

Write or append to `.kiln/log.json`: this run's lineage and vector, so the next run in this project
can rotate against it per `references/intensity.md` and `scripts/check_vector.py --log`. One entry
per system, most recent first — `check_vector.py` reads `log[0]` as the previous run.

## Confirm the break clause and extension protocol are real, not assumed

Contract parts 6 and 7 — re-read what Phase 6 wrote for both and confirm they're specific enough to
act on. "Exceptions may be made as needed" is not a break clause. A vague sentence pointing at
`verbs/component.md` without naming what a new component's author actually checks against is not an
extension protocol. Fix either now, at the last point before this system is considered finished,
rather than leaving it to be discovered wrong when component forty-one actually gets built.

## Report back

Per `ORDER.md`'s report-back section: the declared lineage and why it fits the brief's problem, not
its mood. The vector, the named loud axis, and what was paid to afford it. Gate results with
evidence, and the acceptance criteria separately — a system can pass every craft gate and fail what
it was built for, and both results need to be visible, not just the stronger one. What was not
checked and why. Anything the system cannot express that the brief needed, named plainly rather than
bent to fit.

## What ends here

This is the last phase. Nothing carries forward from here except the stamp and the log, which now
live in the project rather than in context — a future session (a fresh build, an extension, an
audit) reads them from disk rather than needing this conversation's memory to still exist.

No `advance` call here — phase 8 is terminal, `scripts/kiln_state.py` has nothing to move to.
`.kiln/state.json` now holds a complete, real history of every phase this run actually passed
through and what each one carried forward — a genuine audit trail, not a summary reconstructed
from memory after the fact. Worth pointing the user at it if they ask how the build actually went,
separately from the report above.
