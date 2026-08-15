# Lineage distinctness test — 2026-08-10

18 lineage files at `references/lineages/`, originally written by 3 parallel subagents (6 files
each). This is the real risk that split authorship carries: each agent converges on plausible,
independently-reasonable defaults without seeing what the other two wrote, and averaging across
three independent writers can quietly recreate the statistical middle the whole skill exists to
avoid — just distributed across 18 files instead of concentrated in one.

Three tests run, read-only, against the actual files. Findings below independently re-verified
against the vectors recorded in this session's own build log before being accepted.

## Test 1 — Blind identification

Sample of 5, picked by total-byte-size mod 18 (a pseudo-random, reproducible selection, not "first
five"): lineages 04, 07, 11, 15, 18. Each read with the filename and header line ignored, reasoning
from Conditions + Hierarchy logic content alone.

| Sampled | Blind guess (content only) | Confusable with | Actual | Correct |
|---|---|---|---|---|
| 1 | Pharma/legal compliance label — legally mandated, zero tolerance for a missed warning, boxed-warning hierarchy | mild overlap with 13-security-printing | 04-pharmaceutical-label | Yes |
| 2 | Instrument panel/cockpit — continuous monitoring, operator under load, fixed-position + bezel enclosure | real overlap with 14-scoreboard (both: fixed position + one reserved alert colour) | 07-instrument-panel | Yes |
| 3 | Private maker's notebook — idiosyncratic notation, swatch-anchored recipe | none | 11-glaze-notebook | Yes |
| 4 | Manuscript with marginal commentary — two-track layout, layered authority over time | none | 15-manuscript-margin | Yes |
| 5 | Hand-painted shop sign — visible hand, brushstroke variation | soft overlap with 05-record-sleeve (both single-bold-colour identity) | 18-painted-shop-sign | Yes |

**Hit rate: 5/5.** Every sampled lineage was correctly identifiable from content alone with no
access to its filename — the prose is specific enough to discriminate, at least for this sample.
Two soft-confusable pairs surfaced during the reasoning itself even though both guesses landed
correctly (07↔14, 18↔05) — both pairs reappear as independently-confirmed findings in Test 2 and
Test 3 below, which is exactly the kind of signal a single test alone would have missed: Test 1's
headline number (5/5) reads as a clean pass, but the reasoning trail underneath it was already
flagging the same two soft pairs the other two tests confirm harder.

## Test 2 — "What it hands the system for free" overlap

Read across all 18 files, looking for payoffs that are the same mechanism described twice, not just
similar wording.

**Rhetorical convergence, independent of content:** 13 of 18 files (03, 04, 06, 09, 10, 11, 12, 13,
14, 15, 16, 17, 18) use the identical scaffold — "a solved/already-solved pattern for X, so the
system doesn't have to invent Y from scratch." This is a sentence-template convergence across what
were three independent writing batches, which is worth naming even though a shared template is a
weaker finding than a shared payoff — it's evidence the three agents converged on how to write this
section before any of them necessarily converged on what to say in it.

**Content-level payoff clusters (3 found, covering 6 of 18 lineages):**

1. **07-instrument-panel ↔ 14-scoreboard** — both hand "fixed position + one reserved colour for
   the exception/role state" as the free mechanism. 07: "normal is neutral, abnormal is the one
   reserved hue... position is memorized, not chosen per session." 14: "position never depends on
   current content, only colour and digit value change." These are, mechanically, the same payoff.
2. **05-record-sleeve ↔ 17-title-card** — both explicitly name "a splash screen" as the payoff use
   case for a single dominant, undiluted identity moment — the same application named twice from
   two different source traditions.
3. **03-nautical-chart ↔ 12-architectural-drawing** — both hand "hairline/line-weight separation
   lets overlapping categories share one dense surface without colour-coding" as the free
   mechanism — the same border-led density solution, independently arrived at.

## Test 3 — Home vector distribution

Vectors extracted by grep against each file's own "Home vector" section, not retyped from memory,
then independently re-verified against this session's own build-time record of all 18 vectors
before being accepted into this report.

Per-axis distribution across all 18:

```
      min  max  mean  spread
C      1    8   4.17    7
T      2    9   4.44    7
G      1    7   3.39    6
S      1    8   3.61    7
M      1    4   1.67    3
D      0    8   4.50    8
```

C, T, S, and D spread genuinely across the 0-10 range — no axis regressed to a narrow middle band
across the whole set. **G is moderately clustered**: 8 of 18 lineages sit at exactly G2.
**M is the real problem**: 11 of 18 lineages sit at exactly M1, and none of the 18 exceeds M4 —
motion is essentially undifferentiated across the entire lineage set, meaning the "loud on motion"
case (a genuinely choreographed, motion-forward lineage) has no home anywhere in these 18 files.

ASCII histogram of M across all 18 (each `#` = one lineage at that value):

```
M=0  |
M=1  | ###########   (11)
M=2  | ###           (3)
M=3  | ###           (3)
M=4  | #              (1)
```

**Near-duplicate vectors** (max difference ≤1 on every one of the 6 axes — independently
re-verified against the recorded vectors, not just accepted from the initial pass):

- `03-nautical-chart` (C4 T3 G5 S2 M1 D8) ≈ `07-instrument-panel` (C3 T2 G4 S2 M2 D7) — diffs
  `1,1,1,0,1,1`, max 1.
- `04-pharmaceutical-label` (C3 T2 G3 S1 M1 D7) ≈ `07-instrument-panel` (C3 T2 G4 S2 M2 D7) — diffs
  `0,0,1,1,1,0`, max 1.
- `08-seed-catalogue` (C5 T6 G2 S3 M1 D6) ≈ `10-field-guide` (C4 T5 G3 S3 M1 D6) — diffs
  `1,1,1,0,0,0`, max 1.
- `12-architectural-drawing` (C1 T2 G2 S1 M1 D7) ≈ `16-parts-diagram` (C1 T2 G1 S1 M1 D6) — diffs
  `0,0,1,0,0,1`, max 1.

**03/04/07 form a near-duplicate triangle** — three lineages occupy essentially the same point in
six-dimensional vector space (every pairwise difference ≤1 on every axis among all three). At the
mechanical (arithmetic) level, nothing in `check_vector.py`'s own rules would catch a brief landing
on any of these three interchangeably — only the prose currently separates them, and Test 1 already
showed the prose does discriminate for at least the 07 case, but the arithmetic layer offers no
backup if the prose gets thinner in a future edit.

## Overall verdict

The 18 lineages are meaningfully distinct in prose, and mostly distinct across the vector space —
Test 1 scored 5/5 on blind identification, and 4 of 6 axes spread genuinely rather than clustering.
But there is real, locatable evidence of the exact parallel-agent-convergence risk this test set out
to check for: a shared payoff-sentence template across 13 of 18 files, three genuine content-level
payoff overlaps covering 6 lineages, a collapsed Motion axis (11/18 at the same value, ceiling of 4
across the whole set), and a mechanical near-duplicate triangle (03/04/07) plus two more
near-duplicate pairs (08≈10, 12≈16) — five lineages total sitting within one point of another
lineage on every single axis.

**The skill's "prevents the statistical middle" claim holds in aggregate, not uniformly.** A brief
that happens to land near the 03/04/07 region of vector space, or that most needs a genuinely
motion-forward lineage, is exactly where this specific set of 18 files is currently weakest — not
because any single file is badly written, but because three independent writers, working from the
same template and the same six-axis vocabulary, converged toward each other in exactly the spots
this test was built to find. The fix is narrower than "rewrite the lineages": either widen M's
range in at least 2-3 of the 11 clustered files (a lineage whose native rhythm is genuinely more
motion-forward than M1-2 should be allowed to say so), or accept the clustering as a real fact about
which of the 18 traditions have anything to say about motion at all and document that explicitly
rather than leaving it to be discovered.
