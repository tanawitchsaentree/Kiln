# kiln 2.0.0 — build notes

Not loaded at runtime. For whoever maintains the skill.

## What this is

A design system generator that refuses the statistical middle by requiring a declared lineage from
outside web design and a six-axis intensity vector with enforced arithmetic. Range runs from
restrained institutional systems to extreme expressive ones.

## Where each mechanism came from

**Leg Work** — phases live in `phases/`, one file each, read on arrival. A phase file does not
describe the phases after it. Knowing the finished shape while making an early decision pulls the
work toward the finished shape, so the sequence table in SKILL.md carries names and file paths and
no detail.

**Index-then-pick** — `lineages/INDEX.md` and `technique/INDEX.md` are slim indexes. Load the index,
pick, load one file. Both indexes state the cost of over-loading inline, which is what makes the
rule actually hold.

**Push to pull** — technique reference is split into five axis files plus a gate-time craft file.
A build pulls the one or two the vector earns.

**Pruning** — no-ops removed. Opening paragraphs that restated a rule stated below them are gone.
Rationale that changes a decision was kept. Rationale that only motivates was cut.

**Momento principle** — two hard context resets, after the approved slice and before gates, each
with an explicit carry-forward list. Clearing beats compaction, since a compacted history reads as
authority the model half-trusts.

**Caching** — `.kiln/cache.json` holds the pre-flight scan and any relationship card.

**Planning in thinking** — Phase 4 does the critique pass in thinking and shows only the revised
plan. A rejected plan shown to the user is re-sent on every later turn and changes no decision.

**Vertical slice** — Phase 5 builds one screen end to end, choosing the riskiest slice rather than
the most demonstrable one, and stops for a response before expanding.

**Acceptance criteria before build** — Phase 4 writes three to five brief-specific yes-or-no checks
before anything exists. Criteria written afterward describe what was built.

**Out of scope** — Phase 4 writes it, contract part 8 carries it.

**Words as design material** — `references/voice.md` and contract part 9. Every lineage file carries
a voice note, so the language comes from the same source as the type.

**Deterministic where possible** — `scripts/           check_vector, check_tokens, measure_baseline
evals/             briefs, results` decides profile and rotation compliance.
Arithmetic does not need a model, and a script does not drift.

**Look at it** — gate 13 in both sets requires rendering or screenshotting the artefact and judging
the image.

**Untrusted content and project safety** — `references/safety.md`, read before touching an existing
project or any external content.

## Scale layer, added after the Auro question

The trigger was a real program-scale system, Alaska Airlines' Auro, and the question of whether
this skill could produce one. It cannot, in one pass, and neither could anything else. Auro is
around forty component packages plus separate token and stylesheet packages, published status and
release history, support matrices, contribution and CSS conventions, an accessibility statement,
and a maintained documentation site. That is a programme with staff, not an artefact.

What is tractable is the decomposition. Auro is not one large thing, it is many small packages
held together by governance, and a small package is exactly the size this skill works at well.

Three scales now exist in `references/scale.md`, chosen at Phase 0 and stated in the first reply.
Spec is one session. Package is one component per session against the stamp, indefinitely, with the
anatomy in `references/package.md` and the `kiln component` verb. Program adds the governance
artefacts in `references/program.md`, which the skill can write but cannot run, and that limit is
stated in the file rather than left for the user to discover.

The one-component-per-clean-context rule is the mechanism that makes Package scale work. Batching
components produces drift, because context degrades faster than the consistency requirement.

## Documentation shell

Added after three real docs sites were put side by side. The observation that drove it: Auro,
Atlassian Design System, and MUI X have near-identical shells. Dark chrome, three regions, blue
accent, the same badge pill. Docs sites have their own convergence problem, and a generated one
would land exactly there.

The position taken in `references/docs-shell.md` splits the two halves. Information architecture
stays conventional, because a reader arrives to find something and novelty in navigation costs them
and buys nothing. Surface comes from the system's own lineage and vector, because the shell is the
system's largest application of itself. The test is a screenshot with the wordmark removed: still
identifiable, or drifted to the baseline.

The file specifies the buildable parts rather than a content plan. Three regions with their
behaviours, the fixed component page order with live example before prose and when-not-to-use as a
first-class section, the live example block with render, code toggle, copy, and prop controls
generated from one source, search, responsive collapse with the measure preserved, and a
machine-readable surface since agents now read design system docs to write code against them.

`verbs/docs.md` builds it in five testable stages, starting with the shell holding one real page
rather than a placeholder.

## Completion pass

Everything previously listed as missing is now built. What changed:

`references/foundations/INDEX.md` — grid and breakpoints, spacing ownership, elevation, iconography,
motion tokens, content formatting. The layer beneath components that every production system has
and the earlier build did not. Iconography is the section that mattered most, because icons are the
fastest place a system loses its lineage.

`references/foundations/theming.md` — primitive and semantic token layers, what a theme may and may not change,
why dark mode is not an inversion, multi-brand axes, the contrast matrix.

`references/export.md` — DTCG as the source of truth carrying the source note in `$description`,
generated targets, and the rule that generated files are never edited.

`references/design-tool.md` — the design tool side. One authoritative direction, name parity as the
whole discipline, what maps and what cannot.

`references/constraint.md` — the mandated palette and licensed typeface case, which is the most
common real situation. The lineage still drives hierarchy, rhythm, density, edge cases, and voice,
and the vector marks fixed axes with an asterisk.

`references/docs-shell.md` and `verbs/docs.md` — the documentation surface as a buildable artefact.

Hybrid stamp format specified in `phases/8-stamp.md`, with the rule that shared tokens stay shared.

`scripts/measure_baseline.py` — generates the eight briefs, a recording template, and tallies into
ban and watch tables. The baseline being unmeasured was the longest-standing hole and this removes
the excuse.

`scripts/check_tokens.py` — gate G8 automated, catching tokens with no source note and raw values
outside the token block.

`evals/briefs.md` — eight test runs in priority order with pass conditions and likely failure
causes. `evals/results.md` is the empty log they fill.

`README.md` — human entry point, separate from these maintainer notes.

## 2.0.0 — the completeness pass

Built after the user pointed out, correctly, that each round shipped a partial and forced them to
find the next gap. A full audit was run against three real systems before building rather than
after, and the gaps it found were these.

**Foundations were missing entirely.** The system had tokens with source notes and no token
architecture. No tier model, which is the single most consequential omission, since a system without
a semantic tier cannot be themed without renaming everything. No theming model, no grid system, no
motion system as distinct from motion techniques, no iconography, no imagery, no accessibility
foundation, no language and script handling, no data visualisation. Ten files now sit in
`references/foundations/`, index-then-pick like lineages and technique, with tokens/grid/a11y
unconditional and depth on its own stated condition (corrected later — see "The gap this closed"
below and `evals/token-load-2026-08-10/report.md` — an earlier draft of this note and of
`phases/6-expand.md` stated depth as an unconditional fourth minimum-set member, contradicting
`foundations/INDEX.md`'s own table three lines above it).

**The designer surface did not exist.** Everything was code-side. Real systems have a design tool
library with variable mapping, naming parity, and handoff conventions, and a system that lives only
in code gets worked around by designers within one release. `references/design-tool.md`.

**Nothing kept the system alive after launch.** No CI enforcement, no adoption measurement, no
migration or deprecation mechanics, no gap register. Systems fail from disuse more than from bad
design. `references/adoption.md`.

**API conventions were assumed rather than specified.** The consistency check said to compare
property names without saying what they should be. `references/api-conventions.md`.

**Two long-flagged items were finally fixed.** A fixed corporate identity where palette and type are
mandated, and the stamp format for two-lineage hybrids. Both in `references/constraint.md`. The
useful finding in the first is that a mandated brand removes what the lineage drives in colour and
type and leaves hierarchy, rhythm, edge cases, and voice untouched, which is most of the value.

**Scope limits are now stated in SKILL.md.** What the skill does not do, said plainly, so a user
learns it from the skill rather than by discovering an absence. This is what ends the pattern of
shipping partials.

`MANIFEST.md` lists every file and when it loads.

## The gap this closed

The 2.0.0 pass above described a completeness audit and named what got built. What it did not catch,
and what the folder was actually delivered in for some time afterward, is that the router files
(`SKILL.md`, `MANIFEST.md`, `BUILD-NOTES.md`, `ORDER.md`, `AGENT-ORDER.md`) described a structure
that mostly did not exist on disk. Twenty content files and three scripts sat flat in the folder
root with no `phases/`, `verbs/`, `references/`, `references/lineages/`, or `references/technique/`
directories — meaning every phase file, every verb file, all eighteen lineage files, all five
technique axis files, `intensity.md`, `contract.md`, `extraction.md`, `voice.md`, `safety.md`,
`baseline.md`, `scale.md`, `package.md`, `program.md`, `docs-shell.md`, and both gate files were
named repeatedly across five router documents and did not exist. `README.md`'s own line — "Copy the
whole folder. The phase and reference files are loaded on demand and the structure matters" — was
true of the intent and false of the artefact.

This was found by reading every file in the folder against what the router files claimed about it,
rather than by trusting MANIFEST.md's own table, which is exactly the discipline `ORDER.md` asks an
agent adopting this skill to apply to *other* projects' claims about their own components and
exceptions. The router files were themselves an uncited claim until someone opened the folder.

Closed by: restructuring the 20 existing files into the directories MANIFEST.md's own tree already
specified (they needed no content changes, only relocation), then writing every missing file —
`intensity.md` and `contract.md` and `extraction.md` first, since the lineage and phase files quote
their vocabulary; the lineage template and index, then all 18 lineage files, each validated against
`scripts/check_vector.py` before being written rather than after; the five technique files and their
index; all nine phase files and all five verb files, both sets checked against `SKILL.md`'s own
routing table for exact filename agreement; the two gate files, numbered to agree with the two gate
numbers (`G8` for token integrity, `G12` for baseline) that `scripts/check_tokens.py`,
`scripts/measure_baseline.py`, and three other files already referenced as fixed anchors before the
gate files themselves existed; and `baseline.md`, `scale.md`, `package.md`, `program.md`,
`docs-shell.md`, `voice.md`, `safety.md` last, since nothing else in the tree depended on their
content existing first.

Three stale entries were found and fixed in the same pass: the token-cost tables in `MANIFEST.md`
and this file stated numbers computed before the files existed (necessarily invented, since nothing
was there to measure) and are now computed from the real files. The structure diagram below had
three phantom filenames (`foundations.md`, `handoff.md`, `constrained.md`) duplicating entries that
already correctly named `foundations/INDEX.md`, `design-tool.md`, and `constraint.md` — removed.
`08-seed-catalogue.md`'s first draft called an axis at 6 "loud," contradicting `intensity.md`'s own
stated threshold of 7; fixed to say explicitly that the lineage has no loud axis at home position,
in the same category as `10-field-guide.md`, `15-manuscript-margin.md`, and `16-parts-diagram.md`.
Three of the eighteen lineage files (`01`, `02`, `17`) were silent on the depth/separation strategy
`references/foundations/depth.md` already commits them to as the "space-led" reference cases;
each got the missing paragraph added to its Hierarchy logic section rather than left implicit.

## Structure

The tree as it actually exists on disk. An earlier draft of this table listed three files —
`foundations.md`, `handoff.md`, `constrained.md` — that were never separate files; each was always
meant to be `foundations/INDEX.md`, `design-tool.md`, and `constraint.md`, which are the entries
that remain below. Restructuring the folder to match this table (rather than fixing the table to
match a folder that stayed flat) is what closed that gap.

```
SKILL.md              router, always loaded
phases/0-8.md          one file per phase
verbs/                study, audit, extend, component, docs
references/
  intensity.md        the six axes and the arithmetic
  extraction.md       ten relationship fields
  contract.md         nine parts of a shippable system
  voice.md            words as material
  safety.md           untrusted content, project safety
  baseline.md         measurement protocol, list not yet filled
  scale.md            spec, package, program, and the honest limits
  package.md          anatomy of one component package
  program.md          governance layer above the packages
  docs-shell.md       the documentation surface as a buildable artefact
  design-tool.md      Figma parity, variable mapping, handoff
  adoption.md         CI enforcement, metrics, migration, gap register
  api-conventions.md  cross-component API naming
  constraint.md       fixed brand identity, two-lineage hybrids
  export.md           token pipeline and target formats
  gates-precision.md  14 gates for quiet vectors
  gates-coherence.md  14 gates for loud vectors
  foundations/        index + 10 foundation files
  lineages/           index, template, 18 written files
  technique/          index, 5 axis files, craft
scripts/               check_vector.py, check_tokens.py, measure_baseline.py
evals/                 briefs.md, results.md
```

## Token behaviour

Peak simultaneous context per segment, which matters more than the sum, since the resets discard
what came before. Re-measured after the completeness pass filled in the files this table used to
project rather than measure — the numbers below are computed directly from what's on disk
(bytes / 4), not estimated ahead of the files existing.

| Segment | Peak |
|---|---|
| SKILL.md, resident | ~1,500 |
| Phases 0–4, resident SKILL + spine (intensity/extraction/contract) + one lineage file | ~10,700 |
| Phases 5–6, resident SKILL + minimum foundations (tokens/grid/depth/a11y) | ~6,000 |
| Phases 7–8, resident SKILL + one gate file + craft | ~4,700 |

Peak is ~10,700, at Phases 0–4 — higher than the earlier projection, mostly because a single lineage
file plus the spine files it depends on (`intensity.md`, `extraction.md`, `contract.md`, all now
real prose rather than placeholders) is a heavier read than the projection assumed. Still never
simultaneously loaded with Phases 5–6 or 7–8, because the two resets discard it.

Whole folder on disk is ~76,400 tokens now that every referenced file actually exists, versus the
35,687 the folder held before this pass, when most of that tree was router files pointing at files
that didn't exist yet. A single build still touches a fraction of it — one lineage file out of
eighteen, one gate file out of two, two or three foundations out of ten.

## Baseline is still unmeasured

`references/baseline.md` holds the protocol and a list of predictions marked as predictions. Gate
G12 in both sets depends on it and must be reported as not run until eight briefs have been run in
clean contexts and counted. This is the highest-value remaining task and it takes one session.

Do not fill the ban list from a published anti-slop list. Those describe someone else's briefs on
someone else's model version.

## Not built

Nothing structural. What remains is execution rather than design.

The baseline ban list is still empty. The protocol and the script exist, the eight runs have not
been done. Gate G12 reports as not run until they are.

No test has been executed. `evals/briefs.md` lists eight, `evals/results.md` is empty. Every claim
in this skill is a design hypothesis until at least tests 1, 2, and 3 have run.

`contract.md` and `extraction.md` load whole and could split, worth roughly 600 tokens each.
Deliberately left, since splitting them adds a file read to every build to save tokens that the
context resets already handle.

## Test plan

Repeatability: same brief, two clean runs, vectors must differ by 3 or more on two axes.

Separation: four briefs from different domains, compare type ratios and hierarchy devices rather
than colours.

Range: one brief at a quiet vector and a loud one, each passing its own gate set. Most likely first
failure is the loud run breaking the floor.

Reference fidelity: one brief with a reference, output shares its measured relationships and
contains components the reference never had.

Extension: produced system, clean context, ask for a component it lacks. It should arrive using
existing tokens.
