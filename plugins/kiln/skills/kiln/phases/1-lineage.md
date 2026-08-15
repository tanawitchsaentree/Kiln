# Phase 1 — Lineage

Pick one tradition from `references/lineages/INDEX.md`, rotate against the log, and state it aloud
before anything else gets decided.

## Picking

Read the index. Read the **conditions** line of two or three candidates whose stated problem is
closest to the brief's actual problem — not whose adjective matches the brief's mood. Load exactly
one full lineage file for the one you're leaning toward, per `ORDER.md`'s hard limit: never the
folder, never two files for a single-lineage build.

Match on the problem, not the subject. A monitoring dashboard's real problem might be dense
comparison across many similar rows (`08-seed-catalogue`'s problem) rather than glanceable state
under operator load (`07-instrument-panel`'s problem) — check which one the brief actually has
before defaulting to the lineage whose name sounds most like the brief's domain.

## Rotation

`python3 scripts/check_vector.py --vector 0,0,0,0,0,0 --log .kiln/log.json` (a placeholder vector is
fine here — this early check is only reading the log's rotation note, not validating a real vector
yet) names the previous run's lineage. Do not pick it again for a fresh build in the same project.
If the log doesn't exist, this is the first run in this project and there's nothing to rotate
against.

## Constraints

If the brief mandates a palette or a typeface, read `references/constraint.md` now, before finishing
this phase — the lineage still runs and still carries most of the value (hierarchy, rhythm, edge
cases, voice), it just stops driving colour and type. Say this explicitly rather than treating the
constraint as a reason to skip the lineage pick.

If the brief genuinely needs two surfaces that no single lineage serves well — an identity surface
and a dense application surface — `references/constraint.md` also covers declaring two lineages
with a named boundary. This is rare; check that the brief actually has two surfaces before reaching
for it.

## Stating it

One line, in plain text, before moving to Phase 2: the lineage's name and one sentence on why its
problem matches the brief's problem. This line belongs in the eventual stamp — write it now so
Phase 8 isn't reconstructing the reasoning from memory.

## What to carry forward

The declared lineage's name, its home vector, its signature move, and the one-line fit statement.
Not the full lineage file's text — Phase 2 needs the home vector as a starting position, not the
whole document re-read.
