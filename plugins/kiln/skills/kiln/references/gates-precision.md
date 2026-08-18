# Gates — precision set, for quiet vectors

Loaded at Phase 7, one gate file only, never any two of the three (`gates-coherence.md` and
`gates-restraint.md` are the other two). Use this set when the intensity vector's loud axis (per
`references/intensity.md`) sits below 7, or when no axis clears 6, **and** the build did not declare
the restraint profile at Phase 2 — a system that is choosing restraint rather than paying for
boldness is judged on execution precision, because precision is the entire argument a quiet system
is making. A build that did declare restraint uses `gates-restraint.md` instead, even though its
vector will also read as quiet by this file's own threshold.

Every gate below needs evidence per `phases/7-gates.md`'s "Evidence discipline" section — read
that first if you loaded this file directly rather than arriving at it through Phase 7.

**Not every gate here has been gate-proved to the same standard it asks of the systems it scores.**
`evals/gate-proof-tally-2026-08-10/report.md` tracks which of these 14 gates have been mutation- or
fixture-tested against a real pass/fail pair (7 of 42 across all three gate files, as of that
report) versus which are currently sound judgement with no proof they reliably catch a violation at
the edges. A gate marked proven in that tally may block a build on a red result. A gate not yet
proven is advisory — worth recording, worth investigating if it comes back red, but never the sole
reason to stop a build, because nobody has yet shown the gate itself reliably tells a real problem
from a false one.

## G1 — Ratio discipline

Every type size, every spacing step, and the radius scale trace to a stated ratio or a stated unit
multiplication, not to a value that happened to look right. Evidence: the ratio stated, and every
scale value shown as that ratio applied N times.

## G2 — Optical correction

Radii nest correctly (`inner = outer − padding`, per `references/foundations/depth.md`), icon
sizing derives from cap height rather than font size, and vertical centring is optical rather than
geometric where the two differ visibly. Evidence: the computed inner radius for at least one real
nested case, shown against what a naive copy would have produced.

## G3 — Contrast, computed not eyeballed

Every text pairing clears 4.5:1, every UI-boundary pairing clears 3:1, computed from the actual
resolved values the build emits — not estimated, not read off a palette swatch. Evidence: the
computed ratio per pairing, in every mode the system ships.

## G4 — Semantic tier does real work

Pick one semantic token and simulate a full theme change (every value inverts). The token's name
still reads correctly under the new values. Evidence: the token name and the before/after values,
with a one-line check that the name didn't describe the old value.

## G5 — Spacing family discipline

Inset, stack, and inline spacing are drawn from distinct token families per
`references/foundations/grid.md`, not from one general spacing scale applied contextually.
Evidence: one example of each family in use, with the token name shown.

## G6 — Z-layer naming

Every stacking context uses a named layer token, never a raw z-index number. Evidence: grep or
equivalent search across the built output for a bare `z-index:` numeric literal; zero results
required.

## G7 — Motion restraint

No layout property (width, height, top, margin) is animated; only transform and opacity, per
`references/foundations/motion.md`. Duration and easing come from the named scale, never an
inline arbitrary value. Evidence: every `@keyframes` or transition rule inspected, listing the
properties actually animated.

## G8 — Token layer integrity

`scripts/check_tokens.py` run against the actual token file. Zero tokens missing a source note,
zero raw values found outside the token block. Evidence: the script's output, pasted in full.

## G9 — Reduced motion

`prefers-reduced-motion: reduce` collapses spatial movement to an opacity change of 150ms or less,
verified by toggling the preference and observing the actual rendered behaviour, not by reading the
CSS and assuming it fires. Evidence: a screenshot or a described before/after under the toggled
preference.

## G10 — Focus visibility on every surface

The focus ring is tested on the lightest and the darkest surface the component can sit on, not only
on a default background, and clears 3:1 against both the element and what's behind it. Evidence:
the computed contrast on at least two distinct real surfaces.

## G11 — Forced-colours mode

The system is checked under forced-colours mode specifically, since it overrides exactly the custom
values a system depends on. Evidence: a screenshot under forced-colours, with any broken cue named
explicitly rather than silently left for later.

## G12 — Baseline distance

Compared against the current ban list in `references/baseline.md`. Report which ban-list entries
this system triggers, if any, and whether that's a deliberate choice made and stated, or drift.
**If the baseline is unmeasured, this gate reports as not run** — do not substitute a guess for the
measurement.

## G13 — Look at it

Render or screenshot the actual artefact and look at it, rather than reasoning about the tokens in
the abstract. This is the one gate a script cannot do. Evidence: the screenshot itself, with one
sentence on whether it reads as intended.

## G14 — Acceptance criteria, separately

Run the brief's own acceptance criteria from Phase 4, as their own pass, distinct from the craft
gates above. A system can pass all thirteen gates above and still fail what it was built for — this
gate exists because that gap is real and worth checking on its own. Evidence: each criterion, met or
not, with what was checked.
