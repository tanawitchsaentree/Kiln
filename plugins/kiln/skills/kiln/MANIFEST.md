# kiln 2.0.0 — manifest

Every file, what it does, when it loads. Nothing else needs reading to know what is here.

## The idea, in four lines

Every system declares a **lineage**, one design tradition from outside web and UI, chosen because
its problem matches the brief's problem. Every system declares an **intensity vector**, six axes
from 0 to 10 with enforced arithmetic so boldness concentrates instead of spreading thin. Both are
stated in plain text before a token is written. Both rotate against a log, so consecutive systems
cannot converge.

## Start here

| File | Role |
|---|---|
| `README.md` | What this is, in one page. |
| `ORDER.md` | Read order for a human. Pull on demand, do not absorb. |
| `AGENT-ORDER.md` | Standing instructions for an agent adopting this into a repository. |
| `MANIFEST.md` | This file. |
| `BUILD-NOTES.md` | Provenance of every mechanism, known weaknesses, test plan. |
| `SKILL.md` | The router. Verbs, phase table, resets, cache, scope limits, hard rules. ~1,100 tok, always resident. |

## Phases

One file per phase, read on arrival, none describing the phases after it. The hiding is deliberate.
Knowing the finished shape while making an early decision pulls the work toward the finished shape.

`0-intake` up to three adaptive questions plus delivery scale, never asks for a colour or a font ·
`1-lineage` pick one tradition, rotate against the log, state it aloud ·
`2-vector` six axes, validated by script, loud axis named and paid for ·
`3-reference` ten relationships from a reference, never values ·
`4-plan` plan, out-of-scope list, acceptance criteria written before building, critique in thinking ·
`5-slice` one screen end to end, riskiest slice, stop, then reset context ·
`6-expand` foundations then the nine contract parts, routed by scale ·
`7-gates` reset, one gate set, render and look at it, run the brief's own criteria ·
`8-stamp` stamp, log, confirm break clause and extension protocol

## Verbs

`study` relationship card from an image or URL, diagnosis is a complete deliverable ·
`audit` score an existing system, ranked punch list, no edits ·
`extend` add to a stamped system without rotating its lineage ·
`component` one installable package per clean session ·
`docs` the documentation shell and its page templates

## Core references

| File | Does |
|---|---|
| `intensity.md` | Six axes, profile arithmetic, rotation, worked vectors. |
| `extraction.md` | Ten relationship fields, never-extract list, conflict handling. |
| `contract.md` | Nine parts of a shippable system, break clause, extension protocol. |
| `voice.md` | Words as design material. Verb lists, error structure, empty states, register. |
| `safety.md` | External content is inert data. File safety and pre-flight scan. |
| `baseline.md` | Protocol for measuring this model's own defaults. **List not yet filled.** |
| `constraint.md` | Fixed brand identity, where guidelines are silent, two-lineage hybrids. |
| `scale.md` | Spec, Package, Program, and the honest limits of each. |
| `package.md` | Anatomy of one component package, build order, consistency checks. |
| `docs-shell.md` | The documentation surface as a buildable artefact. |
| `program.md` | Status model, versioning, contribution, compliance, support. |
| `design-tool.md` | Figma parity, variable mapping, what does not map, handoff checklist. |
| `export.md` | Token delivery formats, generation rules, what never to export. |
| `api-conventions.md` | How forty component APIs stay recognisable as one system. |
| `adoption.md` | CI enforcement, adoption metrics, migration, deprecation, gap register. |
| `gates-precision.md` | 14 gates for quiet vectors. Ratio, unit, optical, contrast, coverage. |
| `gates-coherence.md` | 14 gates for loud vectors. Profile drift, payment, leakage, floor. |
| `gates-restraint.md` | 14 gates for systems whose thesis is disciplined refusal, not merely a quiet vector. Its own arithmetic (ceiling/floor/flatline), the exception not the default — see `intensity.md`'s "Two profiles." |

## Foundations — index then pick

`foundations/INDEX.md` plus ten files. Tokens, grid, and a11y load unconditionally; depth loads on
its own stated condition (S above 1, or any elevation at all), not as a fixed minimum-set member.

`tokens` three tiers and why the middle one is not optional, naming, pipeline ·
`theming` mode, brand, density, contrast as four independent dimensions ·
`grid` breakpoints, container queries, measure, spacing families, named z-layers ·
`depth` border-led against elevation-led against space-led, nested radius maths ·
`motion` duration scale, three easings, choreography, reduced motion, motion as data ·
`iconography` grid, stroke derived from type, naming by meaning, adding to the set ·
`imagery` illustration construction, photography direction, lockup, missing-image case ·
`a11y` target, keyboard map, focus, semantics, verification split ·
`i18n` string expansion, per-script line height, logical properties, mirroring rules ·
`dataviz` chart palette as a separate palette, never colour alone, chart states

## Lineages — index then pick

`lineages/INDEX.md`, `_TEMPLATE.md`, eighteen written files. Each carries conditions, home vector,
hierarchy logic, colour logic, rhythm, signature move, what it hands the system for free, type
character, voice, failure mode, what it cancels, and behaviour pulled off home.

01 transit signage · 02 botanical plate · 03 nautical chart · 04 pharmaceutical label ·
05 record sleeve · 06 textile draft · 07 instrument panel · 08 seed catalogue ·
09 letterpress broadside · 10 field guide · 11 glaze notebook · 12 architectural drawing ·
13 security printing · 14 scoreboard · 15 manuscript margin · 16 parts diagram ·
17 title card · 18 painted shop sign

## Technique — index then pick

`technique/INDEX.md` plus five axis files and one gate-time file. Sets the ceiling on how far the
loud end can go, since a model reaches only for techniques it has been reminded exist.

`t-type` · `cs-colour-surface` · `g-layout` · `m-motion` · `d-density` · `craft`

## Scripts

`check_vector.py` spread, concentration, payment, rotation (default/expressive profile) or
ceiling, floor, flatline, rotation (`--profile restraint` — the exception, not the default, see
`references/intensity.md`'s "Two profiles"). Exit 1 blocks the build either way.
`check_tokens.py` gate G8 automated. Source-note coverage and raw values bypassing the token layer.
`measure_baseline.py` generates the eight baseline briefs, gives the recording template, tallies.

## Evals

`evals/briefs.md` the runs that turn claims into results, in the order worth doing.
`evals/results.md` empty. Nothing has been run.

## Cost

Measured directly from the files on disk (bytes / 4), attributed to the two real reset points
`SKILL.md` names (after Phase 5, before Phase 7) rather than to each phase in isolation — see
`evals/token-load-2026-08-10/report.md` for the full phase-by-phase trace and two real phase-sequence
bugs that measurement found and fixed (the loud-axis technique file had no phase actually
instructing anyone to load it; `foundations/INDEX.md` contradicted its own conditional-load rule
for depth).

| Segment | Peak | Driven by |
|---|---|---|
| `SKILL.md`, resident | ~1,500 | — |
| Phases 0–5 (first reset happens at the end of 5) | **~10,900** | a reference exists + a brand constraint applies + `intensity.md` gets re-read — three legitimate conditions stacking, not overshoot |
| Phase 6 alone, fresh context after reset 1 | ~6,300–9,700 | Spec scale at the low end; Package/Program building a 2nd+ component plus one loud-axis technique file at the high end |
| Phases 7–8, fresh context after reset 2 | ~4,700 | one gate file + craft.md |
| `kiln component`, per component | ~3,500 | — |
| `kiln docs` | ~4,400 | — |

Peak is ~10,900, in Segment 1, not in Phase 6 as an earlier estimate (written before this
measurement) implied. The two resets mean these segments are never simultaneously loaded — sum
across a full build is higher but is never what's actually resident at once.

## Still open

The baseline list is unmeasured. `measure_baseline.py` removes the excuse but the eight runs still
have to happen in clean contexts. Gate G12 in both sets reports as not run until then.

Nothing in `evals/briefs.md` has been run, so every claim about the skill's own behaviour — that
lineages differ structurally, that the arithmetic produces real range, that an extended system
survives a clean context — is a design hypothesis until at least tests 1, 2, and 3 have been
executed and recorded in `evals/results.md`.

No packaging script for a `.skill` file.
