# Extraction — reading a reference for relationships, never for values

Loaded by `phases/3-reference.md` and by `verbs/study.md`. The discipline is the same in both: a
reference gives you relationships between things, never the things themselves. A hex code lifted
from a photo is a colour that happened to be lit that way on that day. A relationship — this element
is always darker than the one it sits on, this label is always smaller than the thing it labels — is
a rule that survives translation into an interface.

## The ten fields

**1. Hierarchy device.** What tells the eye what matters first, when it is not size. Position,
enclosure, weight, isolation, repetition, colour reserved for one thing. Most references use two of
these together, rarely three.

**2. Colour role, not colour value.** Which roles exist — ground, structure, one reserved accent,
warning — and how many. Not the hex. A record sleeve's orange and a seed catalogue's orange are the
same field with different weight.

**3. Rhythm.** The interval that repeats. A margin that recurs, a baseline that things return to, a
spacing between marks that stays constant while the marks themselves vary. Rhythm is measurable even
in a reference with no numbers on it — measure it in the image.

**4. Density gradient.** Where the reference is generously spaced and where it is packed, and
whether that gradient means something (a legend is always denser than the thing it explains) or is
arbitrary (this photo just happened to be printed at that size).

**5. Signature move.** The one thing that, if removed, makes the reference stop looking like itself.
Every lineage file names this for its tradition. A reference-specific signature move can differ from
its lineage's canonical one and both are worth recording.

**6. Type or mark character.** Not the typeface. Whether marks are drawn or set, whether letterforms
are geometric or humanist, whether numerals are tabular or proportional, whether the register is
formal or handmade. A photograph of a hand-painted sign has a mark character even with no typeface
to name.

**7. Material or surface quality.** What the ground behaves like — paper with tooth, enamel with
glare, film with grain, glass with reflection. This is the field a flat screen cannot literally
reproduce and has to translate — see the conflict-handling section below.

**8. Edge and boundary treatment.** How one region ends and another begins. Hard rule, soft gradient,
generous gap, overlap. Consistent within a reference even when nothing else is.

**9. What is deliberately absent.** What a reference in this tradition never does — no shadow, no
gradient, no diagonal, no serif. The absence is as much a rule as anything present, and it is the
field most often skipped because there is nothing to point at.

**10. Failure mode under stress.** What the reference would do badly if forced into a role it
wasn't built for — a printed chart forced to show live data, a signage system forced to hold a
paragraph. Naming this in advance is what keeps the lineage from being applied somewhere it breaks.

## The never-extract list

Never lift a literal hex value from a reference photograph. Lighting, printing, scanning, and screen
colour management all touch it before it reaches you, and the number you'd extract is several steps
removed from the designer's intent. Extract the relationship — this is the reserved accent, this
is always darker than its ground — and choose the actual value from the system's own primitive
scale.

Never extract a literal pixel measurement from a photograph for the same reason: perspective and
resolution have already distorted it. Extract the ratio between two measurements instead, which
survives the distortion that touched both equally.

Never extract a typeface by matching letterforms to a font-identification result. Extract the
character the type has (field 6) and choose an interface typeface that carries that character and
is licensed and ships good hinting at UI sizes.

Never extract copy, wording, or tone of voice verbatim from a reference into the system's interface
copy. Extract the register (formal, technical, plain) and write original copy in it.

## Conflict handling — the reference wants something a flat screen cannot do

The material and surface field is where this happens most. A reference photographed on painted metal
has specular highlight, physical wear, and a surface that changes with viewing angle. None of that
exists on a flat backlit rectangle.

Do not fake the material with a gradient or a texture image standing in for a photograph of a
surface. That is decoration wearing the reference's clothes rather than a translation of its logic.
Instead, ask what the material was doing structurally — usually separating one region from another,
or signalling permanence versus disposability — and solve that structural job with a mechanism the
screen actually has: a border, a spacing relationship, an elevation rule. State the substitution
in the diagnosis rather than letting it pass silently as if the screen had somehow reproduced the
material.

## The diagnosis is the deliverable

`verbs/study.md` treats the completed ten-field table as a finished piece of work on its own,
independent of whether a system ever gets built from it. Write it that way: specific enough that
someone who has not seen the reference could describe its logic back accurately, and honest about
which fields the reference simply does not answer (most references are silent on at least two or
three — say so rather than inventing an answer to fill the row).
