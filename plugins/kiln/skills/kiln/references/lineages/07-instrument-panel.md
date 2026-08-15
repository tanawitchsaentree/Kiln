# 07-instrument-panel — Instrument panel

## Conditions

Continuous monitoring where the state being watched never stops changing and a missed reading has
a real cost. The operator is under load and cannot afford to search for a number, so every readout
holds one fixed position learned by muscle memory rather than a position that gets rearranged for
taste. The problem is glanceability under sustained attention, not first impression.

## Home vector

`C3 T2 G4 S2 M7 D7` — passes `scripts/check_vector.py` (spread 5, two axes at the concentration
ceiling, no payment issue since neither is at 8+). Density and motion share the loud role. Density
at 7: continuous monitoring means many gauges and readouts are visible at once, at a glance, because
the operator cannot afford to page through screens to find the one that matters right now. Motion
at 7 is not decorative: a real instrument panel's readouts move continuously and physically — a
needle sweeps, an alert blinks at a fixed rate, a digital readout increments — and that continuous
motion *is* the "state never stops changing" condition this lineage exists to serve, not an effect
layered on top of it. A version of this lineage with M held at 1-2 would be describing a panel of
frozen dials, which is a different, static medium (closer to `16-parts-diagram`'s exploded-view
stillness) — the live sweep is load-bearing, not optional. This is a genuine second use of the
concentration ceiling, not a forced one: earlier drafts of this file held motion at 2, which
undersold how much of "continuous monitoring" is actually motion, not just density.

## Hierarchy logic

Fixed position, not size. Every readout has one place on the panel and it never moves, so the
operator's eye and hand both learn the layout as a location rather than as a label. The second
device is enclosure: each gauge sits inside its own bezel or frame, so a cluster of related
readouts (engine, navigation, electrical) is grouped by visible boundary rather than by proximity
alone.

## Colour logic

Three roles: a dark, near-neutral ground; a structural ink for bezels, needles, and numerals; and
one reserved colour, spent only on an out-of-tolerance reading. The rule is strict: colour appears
nowhere else. A value inside its normal range renders in the same neutral ink as everything around
it, no matter how important that value is. Importance is shown by position and enclosure, never by
tinting a healthy reading to make it feel more attended-to.

## Rhythm

The repeating interval is the gauge module itself: bezel diameter (or, on a digital panel, readout
block height) sets a center-to-center spacing that tiles across the panel at a constant multiple of
that one unit. The rhythm is mechanical, not typographic — it comes from how many dials physically
fit at a hand's reach, not from a baseline grid.

## Signature move

Colour is spent on exactly one thing: an out-of-tolerance value, and nowhere else. Remove that rule
and let colour vary by category or brand, and the panel stops reading as an instrument panel and
starts reading as a dashboard mockup, because the one signal an operator trusts at a glance has been
diluted into decoration.

## What it hands the system for free

A state-communication method that needs no separate design: normal is neutral, abnormal is the one
reserved hue, and nothing else competes for that attention. It also hands a layout logic that
resists drift — because position is memorized, not chosen per session, there is no argument to be
had about rearranging the dashboard for aesthetics.

## Type character

Numerals must be tabular so a changing value doesn't shift its neighbours as digits change width.
Labels are short, standardized abbreviations, usually set in a single flat weight — display size
does no hierarchy work here at all; position and enclosure already did it. Geometric, mechanical,
no display face.

## Voice

Terse and standardized: fixed abbreviations (RPM, ALT, HDG), no explanation offered because the
reader already knows the vocabulary. Warnings are direct commands, not descriptions of the problem —
neutral register throughout, no warmth attempted or expected.

## Failure mode

Pushed onto an identity or marketing surface, it goes cold: there is no single readable focal point
because the whole tradition is built to distribute attention evenly across many fixed positions
rather than concentrate it on one. This lineage is application-strong and identity-weak; it has no
solved gesture for a first impression, only for sustained, repeated reading. Pushed too far from
home by raising chroma for branding, the reserved alarm colour stops meaning "attend to this now"
because it now has to compete with a brand hue doing the same visual weight.

## What it cancels

Cancels hierarchy by size or display type. Cancels decorative colour variety — one hue is reserved
and everything else must stay out of its way. Cancels layouts that relocate a value between sessions
or breakpoints, since the whole method depends on a reading always being where the operator's hand
already expects it. Cancels hover-to-reveal for anything safety-relevant; a critical value is always
visible, never gated behind an interaction.

## Behaviour pulled off home

Fixed position and enclosure survive almost any pull, because they cost nothing to keep even as
other axes move. What breaks first is the reserved-colour rule: as soon as chroma is pulled up to
serve an identity need, the alarm hue has to share visual weight with a brand hue, and the operator
loses the one unambiguous signal the panel promised. Density can fall a long way from 7 before the
lineage stops being recognizable — a sparse instrument panel is still legible as one, as long as the
remaining readouts keep their fixed positions and their untouched neutral ink. Motion can also fall
some way from 7 without breaking recognizability — a mostly-static panel with only the alert light
truly live still reads as an instrument panel — but pulling it all the way to 1-2 removes the
continuous-sweep quality that separates this lineage from a frozen technical diagram; see
`references/technique/m-motion.md` for how to build the sweep/increment/blink vocabulary once M is
the loud or co-loud axis here.
