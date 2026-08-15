# 03-nautical-chart — Nautical chart

## Conditions

Dense, overlapping operational data, read where a wrong reading has a real physical consequence: a
boat runs aground, a hazard is missed. Depth soundings, buoys, hazards, and a compass rose all
occupy the same shared plane at once, and the chart's whole problem is making that coexistence
legible without any one layer obscuring another. A brief matches this lineage when it is a dense
operational surface with real stakes on a misread, not a general "lots of data" screen.

## Home vector

`C4 T3 G5 S2 M1 D8` — passes `scripts/check_vector.py` on its own; density at 8 is paid for by
surface at 2 and motion at 1. Density is the loud axis, because the chart's entire reason for
existing is fitting the maximum amount of safety-critical information into one shared space without
ambiguity — density is not a side effect here, it is the medium's actual problem.

## Hierarchy logic

This lineage is border-led, per `references/foundations/depth.md`: hairlines separate every category
of information — land from sea, channel from hazard — and elevation plays no role at all. A fixed
symbol vocabulary does the second job, where each mark (anchorage, wreck, light) means exactly one
thing regardless of how much clutter surrounds it. Separation comes from the line and the symbol,
never from shadow or surface lift.

## Colour logic

A small number of roles: sea, land, navigable channel, sounding ink, and one reserved hazard colour
used for nothing else. The governing rule is that the hazard hue is exclusive — it never gets reused
decoratively or for any category short of danger to navigation, because the moment it is diluted, the
one colour a reader can trust at a glance stops being trustworthy.

## Rhythm

The interval is the depth-contour interval: contour lines recur at a fixed depth step and tile the
whole chart at that step. Labels follow a consistent offset from the symbol they annotate rather than
sitting on any baseline grid, because their placement is governed by the never-overlap rule, not by a
typographic rhythm.

## Signature move

The never-overlap labelling discipline, combined with border-led hairline separation of every
category sharing the same plane. Every label is placed so it never collides with another mark or
label, no matter how dense the surrounding data gets. Remove that discipline and the dense layers
collide, and the chart stops being trustworthy — which is the same as it stopping being a chart.

## What it hands the system for free

A fully solved dense-overlay pattern for operational screens: how to stack several independent data
layers in one shared canvas without one obscuring another, a hairline-based separation vocabulary
that scales with density instead of degrading under it, and a label-collision protocol. This is built
for dense product and dashboard surfaces, not for a single hero moment.

## Type character

Small, upright, and utilitarian. Numerals are tabular by necessity, since soundings are dense fields
of numbers that must align. There are no display sizes: type stays flat everywhere, and hierarchy is
carried entirely by position, symbol, and border, never by type size.

## Voice

Exact, terse, and abbreviation-heavy, in the standardized shorthand of chart notation. Neutral in
register, and it withholds nothing that matters to safety even in the smallest label space available.

## Failure mode

This lineage is application-strong and identity-weak. Pushed onto an identity or marketing surface,
the border-led density reads as cluttered and cold, because it has no mechanism for a single
dominant moment — its entire logic is built for many equal-weight facts coexisting, not for one
thing to command attention. Put it on a homepage and it reads like a spec sheet, because that is
functionally what it is.

## What it cancels

Elevation or shadow-based separation, any single dominant hero image, decorative colour use, and
generous whitespace as a hierarchy device — density is the design here, not something to be
softened.

## Behaviour pulled off home

Pull density down far from 8 and the never-overlap protocol survives but has nothing to prove: with
little content to collide, the border-led symbol vocabulary starts to look over-engineered for what
it is holding. Push chroma up and the reserved-hazard-hue rule breaks first, because a system running
several loud hues can no longer keep one colour meaning danger and only danger.
