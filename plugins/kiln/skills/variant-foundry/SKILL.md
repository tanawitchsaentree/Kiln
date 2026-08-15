---
name: variant-foundry
description: Generate K genuinely distinct visual candidates per component (not K cosmetic variations of one idea), floor-filter for correctness before judging, judge with a role separated from the generator, and report honest fill-rate (how many candidates actually reached the judging pool vs. were floor-rejected). Use whenever a decision needs more than one safe-default proposal — identity-component form/color re-skins, lineage pivots, or any point where `form-language`'s G-F3 (or any project's own multi-candidate review convention) requires ≥3 real options rather than one.
---

# Variant Foundry

## Why this exists

Whenever a multi-candidate review is called for — a "render ≥3 options, pick with eyes, lock the
winner" step, whether that's kiln's own Phase 5 slice approval, `form-language`'s G-F3, or a
project's own equivalent convention — it names WHAT must happen (real options, not one safe
default) but not HOW to generate options that are actually different from each other, or how to
keep a generator from grading its own homework. Three candidates that are the same idea with the
accent hue nudged 5° apart satisfy the letter of "≥3 candidates" while providing none of its actual
value — this skill is the missing HOW.

## The loop

1. **Niche grid** — before generating anything, write down N distinct DESIGN NICHES for the
   component class being explored (e.g. for a control-class re-skin against a hardware lineage:
   "faithful-literal," "restrained-minimal-read-of-the-same-cues," "harder-industrial"). Each niche
   is a real, different position, not a slider position on one idea. K (how many candidates ship to
   judging) is usually smaller than N (how many niches get attempted) — the grid exists so novelty
   pressure (below) has real distinct territory to check against, not just N renamings of the same
   thing.
2. **Generate, floor-first** — for each niche, produce one real candidate (real tokens, real
   rendered markup — not a text description of what it would look like). Before it's eligible for
   judging, it must clear the FLOOR: every hard constraint already locked for this system (contrast
   ≥AA both themes, forced-colors non-shadow-only state cue, any absolute rule like a scarcity
   constraint on an accent color) — checked the same way this repo checks everything, by measuring
   the rendered output, not reading the CSS and assuming. A candidate that fails the floor is
   REJECTED, not judged leniently — record it as a rejected niche attempt, not silently dropped.
3. **Novelty pressure** — before finalizing which floor-passing candidates go to judging, compare
   them pairwise. Two candidates that pass the floor but are visually/structurally indistinguishable
   (same silhouette, same depth treatment, cosmetic-only hue difference) collapse to one slot —
   report this as a niche that failed to produce real distinctness, don't pad the candidate count by
   counting near-duplicates as separate options.
4. **Judge, separated from the generator** — whoever/whatever picks the winning candidate(s) is not
   the same role that generated them, and does not see the generation reasoning, only the rendered
   result plus the real requirements (`system/FORM.md`'s class table if `form-language` produced
   one, the lineage reference, the floor rules). This mirrors the same principle as a QA gate being
   read-only and separate from the builder that produced what it's checking — a generator judging
   its own output has an incentive to see what it meant to build, not what actually rendered.
5. **Report honest fill-rate** — `fill-rate = candidates that reached judging / K attempted`. A
   fill-rate under 100% is a real finding (some niches produced nothing floor-passing, or collapsed
   under novelty pressure) — report it as such, don't backfill the count with a repeat of an
   already-included candidate to make K look reached.
6. **User picks with eyes, per whatever multi-candidate review convention the project already
   uses** — the judge's ranking is a recommendation in the report, not the final word; the actual
   decision authority for a visually-checkable choice stays with the user. If the project has a
   render-and-compare surface (a Lab-style page, a Storybook composition, a set of static
   screenshots), use it; if not, a side-by-side screenshot matrix is the minimum viable version.
   Keep every candidate (including floor-rejected and judge-passed-over ones) archived with its
   full token diff, so a later swap costs a token change, not a re-run of this whole loop.

## K=3 as a default, not a law

The order that first needed this skill specified K=3. Nothing about the loop requires exactly 3 —
K is however many real, distinct positions the niche grid can actually produce for the component
class in question. If the niche grid can only produce 2 genuinely distinct positions before novelty
pressure collapses further attempts, report K=2 honestly rather than padding to 3 with a near-
duplicate. If a wider brief calls for exploring 5 real positions, K=5 is fine — this skill scales to
whatever the niche grid actually supports.

## Verbs

| Verb | What it does |
|---|---|
| `foundry run <component-class> --k N` | Run the full loop above: niche grid → generate+floor-filter → novelty-pressure dedup → judge → fill-rate report |
| `foundry judge <candidates>` | Run judging alone against an already-generated, already-floor-passed candidate set |

## Report format

Every foundry run reports: the niche grid (N niches attempted), which niches produced a
floor-passing candidate and which were rejected (with the specific floor rule that rejected them),
which passing candidates collapsed under novelty pressure and why, the final judged ranking with
the judge's stated reasoning per candidate, and `fill-rate = passed/attempted`. See
`references/report-template.md` for the exact structure.
