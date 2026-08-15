# Blind content-read test — all 18 lineages, 2026-08-10

Full re-run of the earlier 5-file sample, this time against all 18. Run by an agent with no prior
authorship of the lineage files and no prior exposure to them in this session (a separate,
independent sub-agent — the dispatching agent had already seen the answer key while preparing
redacted copies, which would have disqualified it from self-administering a genuine blind test).

**Method**: read `references/lineages/INDEX.md` first (the 18 canonical names + one-line
conditions — the answer key), then read all 18 files with titles/filenames redacted, in a
scrambled order (not file order), recording a guess + second-best guess (if any) + confidence for
each, before opening the sealed filename mapping. Mapping opened only after all 18 guesses were
recorded.

## 1. Reading order used (scrambled)

| Read order | Redacted ID | Actual lineage |
|---|---|---|
| 1 | FILE_09 | 12-architectural-drawing |
| 2 | FILE_02 | 02-botanical-plate |
| 3 | FILE_15 | 07-instrument-panel |
| 4 | FILE_06 | 14-scoreboard |
| 5 | FILE_11 | 05-record-sleeve |
| 6 | FILE_18 | 04-pharmaceutical-label |
| 7 | FILE_03 | 09-letterpress-broadside |
| 8 | FILE_14 | 16-parts-diagram |
| 9 | FILE_07 | 01-transit-signage |
| 10 | FILE_01 | 10-field-guide |
| 11 | FILE_16 | 17-title-card |
| 12 | FILE_10 | 13-security-printing |
| 13 | FILE_05 | 15-manuscript-margin |
| 14 | FILE_17 | 03-nautical-chart |
| 15 | FILE_12 | 11-glaze-notebook |
| 16 | FILE_04 | 18-painted-shop-sign |
| 17 | FILE_08 | 06-textile-draft |
| 18 | FILE_13 | 08-seed-catalogue |

All 18 canonical lineages appeared exactly once — a clean 1:1 mapping, confirming the test actually
covered the full set rather than a subset presented as complete.

## 2. Full 18-row guess table

| File | 1st guess | 2nd guess (if any) | Confidence | Actual | Correct |
|---|---|---|---|---|---|
| FILE_09 | 12-architectural-drawing | 03-nautical-chart / 16-parts-diagram (border-led family) | High | 12-architectural-drawing | Yes |
| FILE_02 | 02-botanical-plate | 10-field-guide | High | 02-botanical-plate | Yes |
| FILE_15 | 07-instrument-panel | 14-scoreboard | High (needed colour-logic check) | 07-instrument-panel | Yes |
| FILE_06 | 14-scoreboard | 07-instrument-panel | High | 14-scoreboard | Yes |
| FILE_11 | 05-record-sleeve | 17-title-card | High | 05-record-sleeve | Yes |
| FILE_18 | 04-pharmaceutical-label | 09-letterpress-broadside | High | 04-pharmaceutical-label | Yes |
| FILE_03 | 09-letterpress-broadside | — | High | 09-letterpress-broadside | Yes |
| FILE_14 | 16-parts-diagram | 12-architectural-drawing | High | 16-parts-diagram | Yes |
| FILE_07 | 01-transit-signage | — | High | 01-transit-signage | Yes |
| FILE_01 | 10-field-guide | 08-seed-catalogue / 02-botanical-plate | High | 10-field-guide | Yes |
| FILE_16 | 17-title-card | 05-record-sleeve | High | 17-title-card | Yes |
| FILE_10 | 13-security-printing | — | High | 13-security-printing | Yes |
| FILE_05 | 15-manuscript-margin | — | High | 15-manuscript-margin | Yes |
| FILE_17 | 03-nautical-chart | 12-architectural-drawing | High | 03-nautical-chart | Yes |
| FILE_12 | 11-glaze-notebook | — | High | 11-glaze-notebook | Yes |
| FILE_04 | 18-painted-shop-sign | — | High | 18-painted-shop-sign | Yes |
| FILE_08 | 06-textile-draft | — | High | 06-textile-draft | Yes |
| FILE_13 | 08-seed-catalogue | 10-field-guide / 02-botanical-plate | High | 08-seed-catalogue | Yes |

**Result: 18/18 correct.**

## 3. 18×18 confusion matrix

All 324 cells checked. Every first guess matched the actual lineage, so the matrix is a clean
diagonal of 18 — zero off-diagonal entries on the primary guess. Non-trivial second-best guesses
that never became anyone's actual first pick (a soft/top-2 view, useful even though they never
caused a miss):

- 07-instrument-panel ↔ 14-scoreboard
- 05-record-sleeve ↔ 17-title-card
- 04-pharmaceutical-label → considered 09-letterpress-broadside
- 12-architectural-drawing ↔ 03-nautical-chart, and ↔ 16-parts-diagram
- 10-field-guide ↔ 08-seed-catalogue ↔ 02-botanical-plate

## 4. The 03/04/07 trio — the specific question this test was built to answer

The earlier vector-math analysis found `03-nautical-chart`, `04-pharmaceutical-label`, and
`07-instrument-panel` sitting within one point of each other on every one of the six axes — a
mechanical near-duplicate triangle. The direct question: does that numeric closeness show up as
real confusion when actually reading the files?

**Direct answer: no.** All three were identified correctly, at high confidence, and none was ever
confused with another trio member — every miss-candidate for any of the three came from *outside*
the trio (07 was weighed against 14-scoreboard, not against 03 or 04; 04 was weighed against
09-letterpress-broadside; 03 was weighed against 12-architectural-drawing).

Nautical-chart and pharmaceutical-label were identified almost immediately — their Conditions
paragraphs closely track the INDEX.md one-liner ("dense overlapping data where a wrong reading has
real consequence" / "legally mandated information... zero tolerance for a missed warning") with no
hesitation against either other trio member. Instrument-panel took more deliberate work, but the
live alternative was 14-scoreboard, resolved by a genuine content difference: instrument-panel
reserves colour only for an out-of-tolerance reading (everything normal stays neutral), while
scoreboard has several permanently-visible role colours (home/away/alert) at once. That's a real,
checkable distinction in the text, not a coin flip.

**What is true, and worth stating precisely**: all three (plus `12-architectural-drawing` and
`16-parts-diagram`) share the same *structural family* — border-led hairline separation, a small
achromatic palette with one reserved functional colour, standardized abbreviation vocabulary,
tabular numerals, terse voice, "application-strong/identity-weak" failure mode. That family
resemblance is almost certainly what pulled their vectors close together in the first place. But
the *problem each one solves*, stated in each file's own Conditions section, is distinct enough that
reading resolves the trio cleanly every time. Same mechanism, different jobs — and in prose,
different jobs wins.

## 5. Other confusable clusters found

**Previously-flagged pairs, replication check:**
- **07-instrument-panel / 14-scoreboard** — replicated as a genuine soft pair requiring real
  reasoning (see §4), correct both times.
- **05-record-sleeve / 17-title-card** — replicated. Both are single-dominant-focal-point,
  "identity-strong/application-weak," cancel dense tabular content; record-sleeve's type violence
  (T7) sits close to title-card's (T9). Resolved on the temporal axis: title-card's Rhythm section
  explicitly describes a *held duration repeating card to card* (a sequence, density=0 by design),
  while record-sleeve is a single static object with compositional balance as its device. Correct
  both times, with real, describable effort before landing on the right one.

**A new cluster, found independently, not on any prior hint list — the "border-led triad":**
`03-nautical-chart`, `12-architectural-drawing`, `16-parts-diagram`. All three explicitly reference
`references/foundations/depth.md`'s border-led category, use hairline separation, standardized
symbol/number vocabulary, one narrowly-reserved functional colour, and near-identical terse
professional voice and failure-mode language. 12 and 03 were each other's second-best guess, and 16
was 12's second-best guess — reading this trio felt like the mechanism description was
near-interchangeable across all three. What separated them cleanly, every time, was the Conditions
paragraph specifically — never the Hierarchy/Colour/Signature-move sections, which read almost the
same across the three. This is a stronger structural echo than either of the two previously-known
pairs, and is new information this full-set run surfaced that the 5-file sample could not have,
since it only included one member of this cluster (12).

**Minor, lower-risk cluster — the "comparison/specimen" family**: `02-botanical-plate`,
`10-field-guide`, `08-seed-catalogue`. `INDEX.md` itself already warns about the botanical-plate vs.
field-guide confusion risk by mood. All three surfaced as live second-guesses for each other at some
point in the run, resolved without real difficulty by reader-posture differences (single
authoritative record vs. urgent field comparison vs. leisurely catalogue comparison).

**Noted, not actually risky**: `04-pharmaceutical-label` and `09-letterpress-broadside` share a
similar signature move (a hard enclosure around one critical line plus one reserved accent colour),
but their Conditions/Voice/Type-character sections diverge enough (compliance-flat-type-small-space
vs. one-time-urgent-declarative-extreme-type-violence) that this was never a real risk in practice —
a noted structural echo, not a confusion.

## 6. Overall hit rate and honest verdict

**18/18 correct (100%).**

Read as prose, the 18 lineages are practically distinguishable — every file's Conditions paragraph
states a specific problem the medium was built to solve, distinct enough across all 18 that
content-only identification worked without the numeric vector ever being needed, including for the
03/04/07 trio the vector math flagged as its sharpest near-duplicate risk.

Distinguishability is not uniform across the set, and that unevenness is real signal, not noise.
Roughly two-thirds of the 18 read as immediately identifiable from the opening sentence alone. The
remaining third — concentrated in three mechanism-sharing clusters (07/14, 05/17, and the
newly-found 03/12/16 border-led triad) — required reading past Conditions into Colour logic,
Rhythm, or Signature move to rule out a real second candidate before answering. The practical risk
this surfaces is not that any two lineages are indistinguishable — none were, in 18/18 — but that a
reader who stops at surface mood rather than reading Conditions carefully (exactly the shortcut
`lineages/INDEX.md`'s own "Picking" section warns against) could plausibly land on the wrong member
of one of these three clusters. The fix that follows from this finding is not to rewrite any of the
18 files — the content already discriminates correctly when actually read — it's to make sure
`INDEX.md`'s existing warning against picking by mood stays prominent, since this test confirms
that warning is protecting against a real, specific failure mode rather than a hypothetical one.
