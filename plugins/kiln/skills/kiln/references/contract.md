# Contract — nine parts of a shippable system

What "the system exists" means, stated once so Phase 6 has a checklist rather than a feeling. Every
part ships at every scale. At Spec scale several are thin; thin is allowed, absent is not.

## 1. Lineage and vector statement

The declared lineage, one line on why it fits the brief's problem, and the intensity vector in the
`C{n} T{n} G{n} S{n} M{n} D{n}` format with the loud axis named and what paid for it. This is the
first thing anyone reading the system encounters, in the stamp and in the system document.

## 2. Token set

Three tiers per `references/foundations/tokens.md`. Every token carries a source note. Primitive
scale generated rather than hand-picked, semantic layer aliasing primitives by role, component tier
used only where a component genuinely needs a value nothing else does.

`scripts/check_tokens.py` gates this part. A token with no source note is not shipped, regardless of
how small the omission looks.

## 3. Foundations

Whichever of `references/foundations/INDEX.md`'s ten files the brief needs, at minimum tokens, grid,
depth, and accessibility. Each foundation used is a decision recorded in the system document, not an
assumption left implicit. A foundation not used is not built — an unused foundation still has to be
maintained and will be wrong by the time someone needs it.

## 4. Component inventory with state coverage

Every component ships default, hover, active, focus-visible, disabled, and whichever of loading,
error, read-only, indeterminate, and selected apply to it. A component with three of six relevant
states is an unfinished component, not a smaller one.

State naming is consistent across the inventory — see `references/api-conventions.md`. The
inventory itself is a table: component, states covered, states explicitly not applicable and why.

## 5. Specimen

One artefact that shows the system operating on real content, not a token sheet. At Spec scale this
is a single screen built in Phase 5's thin slice, expanded. At Package or Program scale this is the
documentation shell from `references/docs-shell.md` holding at least one real component page built
to the full template.

A specimen with placeholder content everywhere is not a specimen. It has to contain at least one
long string, one empty state, and one piece of real or realistically-shaped data.

## 6. Break clause

The stated conditions under which a component or pattern may depart from the system, and what has
to happen when it does: a named exception, a reason, a review trigger. A system with no break clause
either never bends (unlikely, and if true, unexamined) or bends silently every time (certain, and
worse).

Write it as a short, specific policy, not a general permission. "A component may use a token outside
its role when the brief names an interop constraint with an external design system, recorded in that
component's own documentation" is a break clause. "Exceptions may be made as needed" is not.

## 7. Extension protocol

How component number forty-one gets built without anyone re-deriving the system from scratch. This
is `verbs/component.md`'s job at runtime, but the contract requires that the protocol itself be
statable in the system document: which file a new component's author reads first, what they check
against, what they are not allowed to introduce (a new primitive colour, a new spacing value, a
prop name that doesn't match an existing vocabulary entry).

The extension protocol is what `evals/briefs.md`'s test 6 actually tests — a produced system, clean
context, asked for a component it lacks. If that test fails, this part of the contract is unwritten
even if a file with this heading exists.

## 8. Out-of-scope list

Written at Phase 4, before anything is built, and carried forward rather than reconstructed after
the fact. What the brief could plausibly have asked for and this build deliberately does not cover.

An out-of-scope list written after the build describes what got skipped, which is a different and
less useful document — it rationalises gaps instead of bounding the work. Written before, it is a
commitment the build gets held to.

## 9. Voice

The system's language, per `references/voice.md`: verb choice, error structure, empty-state
register, the sentence-level decisions that make interface copy sound like one system wrote it.
Every lineage file carries a voice note, so this part draws from the same source as the type and the
colour rather than being written separately by whoever happens to be filling in copy that day.

A system that specifies every visual token and says nothing about voice will look coherent and read
as if six people wrote it, because six people will.

## What "done" does not mean

None of the nine parts being present means the system is finished forever. It means the system is
shippable at its declared scale. Program scale adds governance on top of all nine; Package scale
repeats parts 4 and 9 per component indefinitely against the same stamp. The contract is the floor,
not the ceiling.
