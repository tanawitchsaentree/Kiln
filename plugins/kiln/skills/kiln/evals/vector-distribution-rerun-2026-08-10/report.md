# Test 3 rerun — vector distribution after the M-axis fix

Rerun of the original distinctness test's third test (home-vector distribution across all 18
lineages) after `07-instrument-panel`, `14-scoreboard`, and `17-title-card` had their motion axis
widened (M-axis fix, earlier this engagement). Two direct questions from the request: does the
03/04/07 near-duplicate triangle survive, and does it now overlap with the blind-test-discovered
03/12/16 border-led cluster.

## Method

Extracted all 18 vectors fresh from the actual lineage files (`grep`, not retyped from memory) to
guarantee this rerun reflects the files as they exist now, not the pre-fix numbers from memory.
Computed every pairwise max-axis-difference across all 18×17/2 = 153 unique pairs.

## Result 1 — the 03/04/07 triangle does not survive

| Pair | Max diff (before fix) | Max diff (after fix) | Per-axis diffs (C,T,G,S,M,D) |
|---|---|---|---|
| 03 ↔ 04 | ≤1 | **2** | `1,1,2,1,0,1` |
| 03 ↔ 07 | ≤1 | **6** | `1,1,1,0,6,1` |
| 04 ↔ 07 | ≤1 | **6** | `0,0,1,1,6,0` |

The triangle is gone. 07's motion jump from 2 to 7 (paired with 03 and 04 both staying at M1) opens
a 6-point gap on that single axis alone, which is larger than the entire 6-axis space these three
used to occupy relative to each other. 03↔04 also widened, from ≤1 to 2, because 04's own grid
value (G3) was already 2 points from 03's (G5) and the earlier "≤1 on every axis" framing was
rounding through a borderline case — worth naming honestly: 03↔04 was never quite as tight as
03↔07 and 04↔07 were, even in the original test.

This is exactly the outcome the M-axis fix predicted but didn't verify at the time — the fix's own
record (`evals/motion-axis-2026-08-10/report.md`) reasoned that 07 needed a motion-native vector for
medium-honesty reasons, without checking what that would do to its distance from its two closest
neighbors. It happens to have resolved the flagged mechanical near-duplicate as a side effect, not
by design — worth stating plainly rather than claiming credit for something that wasn't the fix's
stated goal.

## Result 2 — the blind-test-found 03/12/16 cluster is untouched, and does not overlap with the old trio

| Pair | Max diff |
|---|---|
| 03 ↔ 12 | 3 |
| 03 ↔ 16 | 4 |
| 12 ↔ 16 | **1** |

12↔16 remains the tightest pair in the entire 18-lineage set alongside 08↔10 (both at max-diff 1 —
see Result 3). 03's distance from both 12 and 16 (3 and 4) was already outside the ≤1 near-duplicate
threshold even before this rerun — the blind test's finding that 03/12/16 "read as an
interchangeable mechanism family" was a **prose-level, not vector-level, finding**: the original
lineage-distinctness report was explicit that this trio's closeness showed up in shared language
(border-led, hairline separation, standardized vocabulary, terse voice) and Conditions-paragraph
structure, not in the six-axis numbers. This rerun confirms that distinction holds: 12↔16 is a real
numeric near-duplicate (unchanged by the M-axis fix, since neither was touched), but 03 was never
close to either of them numerically — its inclusion in the "border-led triad" was always a
prose-family observation, and the vectors never claimed otherwise.

**No overlap between the two clusters.** The now-dissolved 03/04/07 triangle and the
still-standing 03/12/16 prose family shared exactly one lineage (03) but that lineage's relationship
to the other members of each group was never the same kind of closeness — tight-by-arithmetic to
04/07 (before the fix), loose-by-arithmetic but tight-by-prose to 12/16 (unaffected by the fix,
because it was never a vector-level finding).

## Result 3 — remaining near-duplicates (max diff ≤1), full set

| Pair | Max diff | Per-axis diffs |
|---|---|---|
| 08-seed-catalogue ↔ 10-field-guide | 1 | `1,1,1,0,0,0` |
| 12-architectural-drawing ↔ 16-parts-diagram | 1 | `0,0,1,0,0,1` |

Down from 5 near-duplicate pairs in the original test (03↔07, 04↔07, 08↔10, 12↔16, plus 03↔04 which
was borderline at ≤1) to 2. Both remaining pairs were untouched by the M-axis fix and were already
known, unaddressed findings from the original distinctness test — neither was in scope for that
fix, which only targeted the motion axis specifically, not general vector spacing.

## M distribution, confirmed post-fix

`[1,1,1,1,1,1,1,1,1,1,1,2,2,3,3,7,7,7]` — unchanged from the fix's own report, reconfirmed here by
independent extraction rather than trusted from memory. 11 lineages at M1, three now at the loud
ceiling (07, 14, 17), the intended outcome.

## What this does and doesn't settle

This confirms the M-axis fix had a real, verifiable side effect on distinctness (dissolving the
03/04/07 triangle) beyond its stated purpose (giving motion-forward briefs a home), and confirms
the blind-test cluster (03/12/16) is a separate, still-open finding at the prose level that no
numeric fix will resolve, because it was never a numeric problem. The 08↔10 and 12↔16 pairs remain
open findings from the original distinctness test, not touched by this session's other fixes, and
not claimed as resolved here.
