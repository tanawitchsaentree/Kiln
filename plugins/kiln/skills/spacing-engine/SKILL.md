---
name: spacing-engine
description: Turns the spacing-control doctrine (spacing encodes relationship, one scale, monotonic proximity) into a MEASUREMENT — computed styles + real boundingBox checks in a real browser, not a checklist read by eye. Use whenever building or auditing any layout in a docs-engine-built site (component pages, foundation pages, full-page examples, Storybook frames): checking clearance around dividers/panel edges, verifying a spacing value resolves to a real scale token, checking that between-group gaps exceed within-group gaps, or verifying heading/rhythm consistency. Also use when a system's own spacing parameters (base unit, density-mode map, clearance token) need deriving from its locked tokens rather than invented fresh. Reach for this instead of eyeballing whether something "looks cramped."
metadata:
  version: "1.0.0"
---

# Spacing Engine

Adopts `~/.claude/skills/spacing-control`'s doctrine as this factory's **IRON layer** —
verbatim in spirit, not copied number-for-number (that skill's own scale is base-4; every
system this factory builds locks its own base unit as a `D-xxx` decision, per
`references/laws.md`'s derivation rule). The doctrine: **spacing is not decoration — it
encodes relationship.** Elements that belong together sit closer; elements that don't sit
farther. This skill's job is proving that with a computed-style measurement, not asserting
it from the CSS source.

**Why this skill exists, not just the doctrine on its own:** a real defect shipped past a
Gate that only checked "does a border/divider render" — a stats row where the numeral sat at
0px clearance from its own divider, because the padding was on the wrong side of the box
model. The doctrine names the rule ("content never touches the edge harder than it
separates") but had never been a *measurement* until this skill. See
`references/gates.md`'s G-S1 for the exact defect and its Gate Proof.

## Laws vs. parameters (read `references/laws.md` in full before applying anything)

**IRON — L1 through L7, invariant across every system this factory ever builds.** Scale
purity, monotonic proximity, clearance, bound-pairs-tightest, heading-binds-downward,
rhythm, optical-honesty-with-a-named-reason. These do not change per system.

**OPEN — the butterfly layer, locked per system as `D-xxx` like everything else.** Base
unit, the actual scale values, which density mode applies to which zone, the clearance
token, the ratios between relationship levels. A spacious Braun-derived system and a dense
terminal system obey the *same laws* and share *none* of these numbers. Never copy a
parameter from another system or from `spacing-control`'s own reference scale directly —
derive it from THIS system's already-locked tokens (see `references/dial-parameters.md`
for the one worked example, Dial's own derivation, done this way on purpose so it's a
template for the next system rather than a one-off).

## Verbs

| Invocation | Does |
|---|---|
| `spacing audit <url\|dir>` | Runs G-S1 through G-S5 against a live URL (real browser, real computed styles) or a directory of CSS/component source (static scale-purity check only — G-S1/G-S3/G-S4/G-S5 need a real render). Emits pass/fail per law, per element: the exact element, the bad value, the token it should snap to. |
| `spacing derive` | Walks a system's own locked token file (e.g. `dial-tokens/build/css/light.css`) and proposes an OPEN parameter set (mode map, clearance token, ladder) grounded in values that already exist — never invents a number the token set doesn't already have. Output is a proposal for `/lock-decision`, not an automatic decision. |

## Gates

Load `references/gates.md` for G-S1 (clearance) through G-S5 (rhythm) — exact definitions,
what `scripts/spacing-check.mjs` (bundled with this skill — run via
`node scripts/spacing-check.mjs --url <url> [--scale-var-prefix --ds-space-] [--json]`, needs
`playwright` resolvable from wherever it's invoked) measures for each, and the Gate Proof each
one needs (plant a real violation, confirm red with the exact bad value, revert, confirm
green). None of these are satisfied by reading CSS source — every one is a
`getBoundingClientRect`/`getComputedStyle` measurement in a real rendered page, because the
stats-row defect is proof that CSS can look correct and still measure wrong.

## Derivation protocol (OPEN parameters — `references/dial-parameters.md` is one full worked
example against a real system; repeat the same steps against YOUR system's own locked decisions,
never copy Dial's numbers, only the method)

1. Read the target system's own locked spacing decision (base unit, scale steps) and its
   lineage mood (spacious/comfortable vs. dense/compact — usually already stated in that
   system's own design-decision log or brief).
2. Map the doctrine's relationship ladder (bound-pair → fields/rows → component↔component →
   sub-group → section → page-margin) onto the system's OWN scale steps, choosing the density
   column (loose/medium/tight) that matches the stated mood — never the tight column by
   default, never a value the scale doesn't already contain.
3. Cross-check every real component's already-shipped spacing (an icon↔label gap, a card's
   inner padding, a form field's stack gap) against the proposed ladder — if a real component
   already uses a value for a relationship class, that's the strongest possible evidence for
   what the parameter should be, stronger than deriving it fresh.
4. Write the result as a prose+table reference file AND a machine-readable spacing-laws file
   that ships with the token package — lock the decision through whatever this project's own
   decision-locking convention is (an ADR, a comment in the token source, a `/lock-decision`-
   style skill — use what the project already has).
5. Never invent a value the derivation didn't produce. If a relationship class has no clean
   mapping onto the existing scale, that's a real gap — log it, don't force a number.

## Reports

Same discipline as `docs-engine`: capped reports, computed numbers only, no cheerleading.
Gate Proof is mandatory before any G-S gate counts as more than advisory — plant, measure
red with the exact element+value, revert, measure green, record both in the report.
