# Design tool surface

The system as designers use it. Load at Package or Program scale, or when the brief mentions Figma,
a library, or handoff.

A system that exists only in code is used by engineers and worked around by designers. The two
surfaces drift within one release, and every drift becomes an argument about which is correct.

## Parity is the whole job

One name per thing, in both places. A component called Button in code is called Button in the
library, and its variants carry the same names as its props.

A variant that exists in the library and not in code is a promise the product cannot keep. A prop
that exists in code and not in the library is a capability designers will never use. Publish the
gaps in both directions rather than letting people discover them.

Decide which side is authoritative and say so. Usually code, since it is what ships.

## Variables map to tokens

Design tool variables are generated from the same token source as the CSS. Not recreated by hand.

Tier structure survives the mapping. Primitives as one collection, semantics as another, and
designers use only the semantic collection. A designer picking a primitive is the same failure as a
component referencing one.

Modes map to variable modes rather than to separate libraries. One library with a light and dark
mode beats two libraries that must be kept in sync by discipline.

Generation runs in CI alongside the CSS build, or the two will diverge and nobody will know when.

## Library structure

One published library per system, versioned, with release notes designers can read.

Components grouped as they are grouped in the documentation, since a designer who learned the docs
navigation should not have to learn a second one.

Every component includes its states as variants, so a designer can show a disabled or error state
without redrawing it.

Deprecated components stay in the library, marked, until the version that removes them. Removing a
component from a library breaks every file that used it, silently.

## What belongs in the library and what does not

Components, tokens, icons, and layout templates belong.

One-off marketing artwork, in-progress explorations, and anything product-specific do not. A shared
library that accumulates product-specific work becomes unmaintainable, and the usual symptom is a
library nobody dares to update.

## What maps and what does not

Colour, type styles, spacing, radius, and elevation map cleanly and belong as variables rather than
as styles wherever the tool supports it.

Component state, focus behaviour, keyboard interaction, motion, and responsive behaviour do not map.
State this openly. A design file cannot express them, so they live in the code system and the design
file links to them rather than approximating them.

Variants map, and their property names must match the code's property names exactly. A tool variant
called Size with values Large and Small beside a code property called `scale` taking `lg` and `sm`
is two systems wearing one name.

## Authority flips once

Design-authoritative is legitimate early, while the system is being invented and nothing is in
production. Code-authoritative is correct once it ships.

State when the flip happens, and then actually flip it. Systems that never flip end up with two
sources of truth and a standing argument about which is real.

## Handoff

Handoff is a conversation, not an export. What travels is intent, states, edge cases, and the
interactions that are not visible in a static frame.

The system reduces handoff by making most of it unnecessary. When a design uses only library
components with named tokens, the specification is already written. Handoff is then only the parts
the system does not cover, which is exactly the right amount.

State which edge cases a designer must specify: empty, error, loading, long string, overflow. A
frame delivered without them is not finished, and saying so in the system is how that becomes normal
rather than personal.

The handoff itself names four things: which components are system components and which are one-offs,
which tokens are used, what is deliberately outside the system and marked with the break clause, and
which states were not designed and therefore need a decision. The last one is the valuable one, since
most implementation friction is a state nobody designed and nobody flagged.

## Adoption signal

The proportion of a design file using library components is the earliest available measure of
whether the system is working. It moves before code adoption does, because designers hit friction
first.

Track it if the tool allows. A file at 40% library usage is telling you something about the system
rather than about the designer.
