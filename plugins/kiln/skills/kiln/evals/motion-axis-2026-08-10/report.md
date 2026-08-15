# M-axis ceiling fix — 2026-08-10

The problem: across all 18 lineage files, motion capped at 4 with 11 of 18 sitting at exactly 1.
Combined with the concentration rule (a build needs a loud axis somewhere to pass spread at all,
per `intensity.md`), no lineage in the set could ever be the home for a genuinely motion-forward
build — a brief whose actual thesis is choreography had nowhere to land honestly. Two options were
on the table: widen M in 2-3 lineages whose real-world medium is actually motion-native, or write
the gap down explicitly in `lineages/INDEX.md` as a known, permanent limitation of this set.

## Decision: widen M in three lineages, chosen for medium-honesty, not arithmetic convenience

**`07-instrument-panel`** (M 2→7, now sharing the concentration ceiling with density at 7). A real
instrument panel's readouts move continuously and physically — a needle sweeps, a digital counter
increments, an alert blinks at a fixed rate. That continuous motion is not decoration layered on
top of "continuous monitoring," it *is* the condition the lineage's own Conditions section names.
Holding M at 2 was underselling how much of "continuous monitoring" is actually motion, not just
many-things-visible-at-once density.

**`14-scoreboard`** (chroma demoted from loud to C3, motion promoted to M7, now sharing the ceiling
with density at 8). The digit flip, the buzzer flash, the clock counting down to zero on screen are
the medium's actual mechanism — the thing a photograph of a scoreboard always misses. The reserved
home/away/alert colour system is real and stays fully described in Colour logic and Signature move,
it just no longer needs to be the *numerically loud* axis to be load-bearing; it holds up fine at
C3-4. Motion was the more medium-honest choice for the second loud slot.

**`17-title-card`** (M 4→7, now sharing the ceiling with type at 9). A title card is a held frame
with a specific, timed entrance and exit, not a static poster with type on it — the choreography of
appearance (hard cut vs. slow fade vs. hold-then-snap) is as much the medium's content as the
typographic choice. Rhythm's own section already described this lineage as fundamentally temporal;
M4 was inconsistent with a section that had already called the rhythm temporal rather than spatial.

**Why these three and not others**: `06-textile-draft` and `09-letterpress-broadside` were checked
and ruled out — both already spend both loud slots (grid+chroma+surface for textile-draft's
concentration limit; type+grid for letterpress) and raising M to 7 in either breaks CONCENT or
PAYMENT. Motion genuinely has no room in every lineage; forcing it everywhere would have meant
lying about some medium's actual rhythm just to flatten the M distribution artificially.

## Verified

All 18 vectors re-run against `scripts/check_vector.py` after the edits: 18/18 still pass. New M
distribution across the set: `{1: 11, 2: 2, 3: 2, 7: 3}` — min 1, max 7, mean 2.33. Three real homes
now exist for a motion-forward brief (07, 14, 17), each justified by that lineage's own medium, not
picked to satisfy a distribution target. The other 15 lineages were left exactly as they were —
most traditions represented here (a botanical plate, a pharmaceutical label, a parts diagram) are
genuinely, honestly still, and forcing motion into them would have been the same category of error
this fix corrects, in the opposite direction.

Each edited file's downstream sections (Rhythm, Failure mode, What it cancels, Behaviour pulled off
home) were checked and updated where they contradicted the new vector — most notably
`14-scoreboard.md`'s old Failure mode ("push motion up toward decoration and legibility breaks")
needed a real distinction added (functional state-tied motion vs. decorative untied motion) now
that motion is the lineage's own second loud axis rather than something it was previously warning
against.
