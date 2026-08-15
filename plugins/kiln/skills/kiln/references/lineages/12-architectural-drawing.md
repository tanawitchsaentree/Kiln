# 12-architectural-drawing — Architectural drawing

## Conditions

Precision at scale, read as one convention by many different trades — an electrician, a plumber, a
framer — each of whom needs only their own subset of the drawing. Zero ambiguity is permitted, and
the symbols used are standardized industry-wide rather than invented per project, because a drawing
that only its own author can read has failed at the one thing it's for.

## Home vector

`C1 T2 G2 S1 M1 D7` — passes `scripts/check_vector.py` (spread 6, no concentration or payment
issue). Density is the loud axis at 7: a working drawing carries enormous information density —
dimensions, callouts, section marks, material hatching — all legible at once to trades who each read
only the parts relevant to them.

## Hierarchy logic

Not size, but line weight: a strict hierarchy where a heavy line marks a cut, a medium line marks a
visible edge, and a light line carries hatching or a dimension string, with nothing else deciding
what's more important. The second device is a standardized symbol vocabulary — a plumbing symbol
looks the same on every drawing regardless of project, so recognition never depends on this
drawing's own styling choices.

## Colour logic

Close to achromatic: a plain ground, one ink-weight system doing the work colour usually does, and a
rarely reserved colour — typically red — for a revision, marking what changed since the drawing was
last issued. Colour, when it appears at all, marks a change or a discipline overlay, never
decoration.

## Rhythm

The repeating interval is the extension-line offset: dimension strings sit a fixed gap from the
object they measure, with the dimension line set a further fixed gap beyond that, so the rhythm is a
constant multiple of a stated offset rather than a designed spacing scale.

## Signature move

The hairline. Every separation on the sheet — between rooms, between materials, between one trade's
layer and another's — is a drawn line at a specified weight, never a fill, a shadow, or a colour
block. Per `references/foundations/depth.md` this lineage is border-led, not shadow-led: elevation
is minimal to absent by design, and introducing shadow to separate surfaces contradicts the
convention this tradition comes from rather than softening it.

## What it hands the system for free

A solved method for showing many overlapping categories of information on one surface without
colour-coding each one, since line weight and standardized symbol already do that job. It also hands
a natural way to let different readers attend to only their own subset — a plumber reads the
plumbing weight and symbol set and ignores the rest, because the convention already segments the
drawing for them.

## Type character

Condensed, drafting-register, largely set in capitals for labels and callouts. Numerals are tabular
and precise, since dimensions have to align. Hierarchy stays flat at the type level — position and
line weight do all the work display size would otherwise do.

## Voice

Terse, standardized abbreviations (TYP. for typical, VIF for verify in field), no explanation offered
because the reader is a trained professional who already knows the vocabulary. Zero warmth, zero
hedging.

## Failure mode

Pushed toward a general consumer-facing surface, reliance on trade-specific symbols and
abbreviations that assume professional training becomes actively hostile to a first-time reader —
the precision that serves an electrician reading their one subset becomes noise to someone who
needed the whole thing explained. This lineage is application-strong and identity-weak: it has no
solved gesture for a first impression, only for expert repeated reading. If shadow or elevation is
introduced to soften the sheet, the border-led logic collapses, since the medium's entire hierarchy
is line weight and shadow competes with it instead of reinforcing it.

## What it cancels

Cancels elevation and shadow as a separation device entirely — border-led per `depth.md`, and shadow
contradicts the convention this lineage draws from. Cancels colour-coding as the primary way to
distinguish categories, since line weight and symbol already do that job. Cancels display type or
size-based hierarchy; position and weight carry it, never size.

## Behaviour pulled off home

The line-weight hierarchy and the standardized symbol vocabulary both survive a pull toward lower
density, since neither depends on how much is on the sheet at once. What breaks first as this
lineage is pulled toward a low-density, high-motion, high-chroma vector is the border-led rule
itself — a system that starts adding shadow or colour to liven up a sparse layout has abandoned the
one convention the whole tradition depends on. The symbol vocabulary is what survives longest,
since it travels independently of density or colour.
