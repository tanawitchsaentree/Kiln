# Phase 6 — Expand

Foundations, then the nine contract parts, routed by scale. This is where the approved slice grows
into the full system.

Run `python3 scripts/kiln_state.py guard --min-phase 6` before building anything here. If it
blocks, Phase 5's approval was never genuinely recorded — go back and get a real one, don't call
`advance` with `approved: true` just to make the guard pass.

## Foundations first

Read `references/foundations/INDEX.md`. Load only the foundations the brief actually needs — tokens,
grid, and accessibility load unconditionally; depth loads on its own stated condition (S above 1, or
any elevation at all) rather than unconditionally, same as the rest (more than one mode needs
theming, the system ships icons needs iconography, and so on). Do not load a foundation the brief
doesn't need; an unused foundation still has to be maintained and will be wrong by the time someone
needs it.

Tokens and grid load unconditionally, and in that order, per the index's own stated order — theming
gets decided with tokens rather than retrofitted after, because adding a second mode to a
single-mode token set later means renaming everything.

## Then the contract

Read `references/contract.md` for the nine parts a shippable system needs. Several are already
partially satisfied by Phase 5's approved slice (the specimen, part 5, and a first pass at the
component inventory, part 4) — expand them rather than starting fresh.

Work through the parts roughly in the order the contract file lists them, since later parts assume
earlier ones exist: the token set (part 2) has to exist before the component inventory (part 4) can
alias it correctly, and the extension protocol (part 7) has to name what a new component checks
against, which means the API conventions need to exist first.

## Route by scale

**Spec** expands the slice's own component to full state coverage and writes the contract document
around it. It does not build a second component.

**Package** builds this component, then stops — subsequent components are separate sessions against
`verbs/component.md` and `references/package.md`, never batched into this same expansion pass.

**Program** does everything Package does, plus drafts the governance artefacts in
`references/program.md` alongside the first component, stating their honest limits at draft time.

## API conventions, once, before the second component

If this build will have more than one component (Package or Program scale), read
`references/api-conventions.md` now and fix the naming vocabulary — prop names, enum values, event
naming, controlled/uncontrolled pattern — before a second component gets built to invent its own.

## Identity components — multi-candidate, not a single safe default

Whichever component carries the system's face (usually a button, an input, a card, a toggle — the
ones a user would recognize the system by) does not get one proposed form and a confirmation. Run
`variant-foundry`'s loop: a niche grid of genuinely distinct positions (not cosmetic variations of
one idea), generate one real candidate per niche, floor-filter for the brief's hard constraints
(contrast, forced-colors, accent scarcity if the brief has one), judge with a role separated from
whatever generated the candidates, and report the honest fill-rate. Presenting one candidate alone
for an identity component is a process violation this skill's own G-F3 (in `form-language`) exists
to catch. Every candidate — including floor-rejected and judge-passed-over ones — stays archived
with its token diff so a later swap costs a token change, not a re-run of the loop.

## The loud axis's technique file, if Phase 2 flagged one

If Phase 2 named a technique file for a loud axis (7 or above), load it now, here, before building
the expanded component — this is the concrete build step Phase 2 deferred to "Phase 6 or 7"; it
belongs here specifically because the technique vocabulary informs how the component is built, not
how it's scored afterward (that's `references/technique/craft.md` at Phase 7, a different file with
a different job). At most two technique files load, matching the at-most-two-loud-axes rule.

## What to carry forward to the next reset

Call `python3 scripts/kiln_state.py advance --data '{"built_artefact": "...", "vector": [C,T,G,S,M,D],
"acceptance_criteria": [...]}'` before resetting.

The built artefact (tokens, foundations in use, the expanded component or components), the vector,
and the acceptance criteria from Phase 4. This is the second hard reset `SKILL.md` names, happening
before Phase 7 — gates score what exists, not how it came to exist, so the reasoning trail behind
each decision does not need to survive into Phase 7's context.
