# Technique index

Load this index, then at most two axis files. Never the folder, never more than two, and never
before the vector is set — technique sets the ceiling on how far the loud end of a vector can go,
and a model reaches only for a technique it has been reminded exists. Reading a technique file for
an axis that isn't loud is reading something nobody asked for.

## Why this exists

A vector says an axis is loud. It does not say what to actually do at the keyboard to make it loud.
Without a concrete vocabulary, "chroma at 8" tends to resolve to the same one or two moves every
time — usually a single saturated accent against a neutral field, because that is the easiest way
to spend eight points on colour and the most common result is indistinguishable from the baseline
this whole skill exists to avoid.

Each file below is a vocabulary of concrete moves for one axis, pulled from outside the default web
palette of techniques. Pick from the file for whichever axis is loud in the current vector. An axis
sitting quiet (below 7) does not need its technique file — the quiet axes are quiet by doing less,
which is the point, and needs no vocabulary to execute.

## The five axis files, plus one gate-time file

| File | Axis | Load when |
|---|---|---|
| `t-type.md` | Type violence (T) | T is 7 or above, at Phase 6 |
| `cs-colour-surface.md` | Chroma and surface (C, S) | C or S is 7 or above, at Phase 6 |
| `g-layout.md` | Grid unconventionality (G) | G is 7 or above, at Phase 6 |
| `m-motion.md` | Motion presence (M) | M is 7 or above, at Phase 6 |
| `d-density.md` | Density (D) | D is 7 or above, at Phase 6 |
| `craft.md` | Cross-axis finishing | Always, at Phase 7, regardless of which axis is loud |

Chroma and surface share one file because in practice the concrete techniques overlap — a technique
that spends chroma usually also spends surface, and the reverse. Splitting them would mean loading
two files for what is functionally one axis of decision.

## Discipline

At most two files load in a single build, matching the at-most-two-loud-axes rule
`references/intensity.md` already enforces. A build with three loud axes has already failed
`scripts/check_vector.py`'s concentration check before technique is even relevant.

`craft.md` is the exception: it loads regardless of vector, at Phase 7, because it covers finishing
moves (optical correction, nested radius maths, the kind of detail Gate G2 checks) that apply to
every system, loud or quiet.
