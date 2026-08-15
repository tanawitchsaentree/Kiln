# Real per-phase token load — measured, 2026-08-10

Every number below is `len(file_bytes) / 4` on the actual files in `kiln/` as they exist today, not
an estimate written before the files existed. Loads are attributed by reading each phase file's own
instructions line by line — not by grepping for backtick-quoted filenames, which over-counts (a
phase file can *name* a file in prose, to explain why it matters later, without instructing the
reader to open it now; `phases/4-plan.md`'s mention of the gate files is exactly this case and does
not count as a load).

## Method: segments, not phases in isolation

`SKILL.md` states two hard resets: after Phase 5 (once the slice is approved) and before Phase 7.
Phases between resets accumulate in the same context — a per-phase number in isolation understates
what's actually resident, because Phase 4 doesn't start from zero, it starts from whatever Phases
0-3 already loaded and never discarded. The three real segments are: **Phases 0-5** (first reset
happens at the end of 5), **Phase 6 alone** (fresh context after reset 1), **Phases 7-8** (fresh
context after reset 2, per `phases/7-gates.md`'s own opening line).

## Segment 1 — Phases 0 through 5

| Path | Tokens | What's included |
|---|---|---|
| No reference, no brand constraint | 7,624 | SKILL.md + phases 0,1,2,4,5 + `scale.md` + `lineages/INDEX.md` + one lineage file |
| + Phase 3 fires (reference exists) | 9,503 | above + `phases/3-reference.md` + `extraction.md` |
| + brand constraint (`constraint.md`) | 10,640 | above + `constraint.md` |
| + `intensity.md` re-read at Phase 2 | **10,934** | above + `intensity.md` (conditional: "if any rule's reasoning isn't already clear from the script's own failure messages") |

**Peak of the whole build is here, at 10,934**, not at Phase 6 as the token-cost tables elsewhere
in this repo implied before this measurement. It requires three conditions stacking (a reference
exists, a brand constraint applies, and `intensity.md` gets re-read) — plausible, not rare, since a
constrained-brand brief is a common real case per `constraint.md`'s own framing ("the most common
real situation").

## Segment 2 — Phase 6 alone (fresh context after reset 1)

| Path | Tokens |
|---|---|
| Spec scale, S≤1 (no depth foundation needed) | 6,325 |
| Spec scale, S>1 (depth foundation loads) | 6,953 |
| Package/Program, building the 2nd+ component (adds `verbs/component.md`, `package.md`, `api-conventions.md`) | 8,965 |
| + one loud-axis technique file (T, C, G, M, or D at 7+) | 9,658 |

Two more foundations can stack on top of any of these rows if the brief needs them (theming,
motion, iconography, imagery, i18n, dataviz) — each is 400-600 tokens, per
`references/foundations/INDEX.md`'s own conditions, and none of them fired in a bare Spec-scale
build with no stated need for them, so they're not counted in the baseline rows above. A system with
genuinely many foundation conditions firing at once (multi-brand, multi-language, ships icons, ships
charts) could plausibly reach the same ~10,900 peak Segment 1 hits, but that's a brief stacking many
real requirements, not the segment overshooting on its own.

## Segment 3 — Phases 7-8 (fresh context after reset 2)

| Path | Tokens |
|---|---|
| One gate set + craft.md (both sets cost almost the same, precision 4,706 / coherence ~4,790) | 4,706 |

This segment is well clear of every other segment and was never the risk.

## Real peak vs. the claim this repo made before measuring

`MANIFEST.md` and `BUILD-NOTES.md` (as of the previous pass in this repo, before this measurement)
stated Phases 0-4's peak at ~10,700, computed as SKILL + phases 0-4 + intensity/extraction/contract
+ one lineage file — a number that was itself already a correction of an earlier, purely aspirational
figure (~6,000) written before the phase and lineage files existed at all. That 10,700 estimate:

- **Omitted Phase 5** entirely from the segment (5 costs only ~500 tokens on its own, negligible).
- **Included `contract.md`**, which does not actually load until Phase 6, not Phases 0-4 — this
  was double-counted against the wrong segment.
- **Missed the brand-constraint stacking case** (`constraint.md` loading in both Phase 1 and
  potentially referenced again at Phase 2), which is the difference between 9,503 and 10,640.
- **Missed `intensity.md`'s conditional re-read** at Phase 2, worth another ~900 tokens.

Net effect: the real peak (10,934) lands close to the old estimate (10,700) by coincidence — the
old number omitted Phase 5 and miscounted `contract.md` into the wrong segment, while missing the
constraint+intensity stacking case that turns out to be the actual driver of the peak. Both errors
happened to net out to a similar final number; neither was measured, both were guessed forward from
before the files existed. This report replaces the guess with a measurement and documents exactly
where the guess got the mechanism wrong even though the headline number was close.

## Bugs found while tracing the loads, fixed during this pass

**1. The loud-axis technique file had no phase instructing anyone to load it.** `phases/2-vector.md`
deferred loading it to "Phase 6 or 7," but neither `phases/6-expand.md` nor `phases/7-gates.md`
actually contained an instruction to load it — only `craft.md` was wired into Phase 7. Followed
literally, a real loud-vector build would never load `t-type.md`/`cs-colour-surface.md`/etc. at all,
defeating the entire point of Gate G2's "reaches only for a technique it has been reminded exists"
design. **Fixed**: added an explicit load step to `phases/6-expand.md` (before building the expanded
component, since the technique vocabulary informs construction, not scoring) and corrected
`phases/2-vector.md`'s and `references/technique/INDEX.md`'s cross-references to point at the fixed
location instead of the ambiguous "Phase 6 or 7."

**2. `foundations/INDEX.md` contradicted itself on whether depth is conditional.** Its own table
states `depth.md` loads "when S above 1, or any elevation at all" — genuinely conditional. Its
"Minimum viable set" section then stated every Spec-scale system needs "tokens, grid, depth, and
a11y," unconditionally, contradicting the table three lines above it. This is exactly the case that
mattered for Segment 2's real number: a system with S≤1 and no elevation (Dial is exactly this case,
S=1 in the audit run alongside this one) has nothing for `depth.md` to decide, and loading it anyway
is the unused-foundation cost `foundations/INDEX.md` itself warns against one paragraph earlier.
**Fixed**: reworded the minimum-viable-set section to defer to the table's own stated condition
rather than restating a stronger, contradicting claim.

## What this confirms about the "cut, don't accept" instruction

No phase, once correctly attributed to its real segment, overshoots what a genuinely lean build
needs — the 10,934 peak is driven by three legitimate, simultaneously-firing conditions (a
reference, a brand constraint, and a script-failure that triggers a documentation re-read), not by
any phase loading something it didn't need. There was nothing to cut in that sense. What needed
cutting was the two files above that were silently wrong about their own conditions — both now
fixed rather than left as an accepted discrepancy between what the phase files claim and what a
literal reading of them would actually do.
