# 13-security-printing — Security printing

## Conditions

The document must prove itself genuine to a stranger with no shared context, and it must survive an
adversary actively trying to copy it. The design's job is not to look good, it is to make forgery
expensive relative to the value it protects, so friction is built in on purpose: a genuine note is
allowed to be slightly harder to read or verify than a copyist would bother matching. Match this
lineage when the brief's real problem is proving authenticity under active attack, not when it is
merely "should look secure."

## Home vector

`C2 T3 G6 S8 M1 D5` — loud axis is surface at 8. The entire anti-forgery mechanism lives in surface:
microprinting, guilloché line work, intaglio relief you can feel, watermarks visible only in
transmitted light, ink that shifts colour with viewing angle. Paid for by chroma at 2 and motion at
1, both comfortably at or below the payment threshold. Passes `check_vector.py`.

## Hierarchy logic

Two devices, not size. First, isolation: the portrait, seal, or watermark sits alone in a reserved
field carved out of the surrounding pattern, so the eye finds it by contrast with density rather
than by being told it is bigger. Second, repetition as ground: the guilloché lattice repeats at a
pitch fine enough that any single break, gap, or irregularity in it reads immediately as wrong,
which means the pattern itself is the alarm system, not a decoration behind one.

## Colour logic

Three roles. A multi-colour guilloché ground carrying the fine pattern, a fixed intaglio black for
portrait and lettering, and one colour-shifting or otherwise unreproducible ink reserved for a
single element such as the denomination or seal. That third role is never used decoratively
elsewhere on the document, so its appearance anywhere else on a genuine surface always means
"verify this."

## Rhythm

The line pitch of the guilloché lattice, held tighter than commodity printing can reliably
reproduce. The interval is not a spacing choice, it is a resolution threshold: a genuine document's
fine lines hold their pitch under magnification, and a photocopy or low-fidelity scan of it breaks
down into a fuzz at exactly the scale a forger would need to reproduce cleanly.

## Signature move

Fine pattern work operating at the edge of reproducibility, resolving cleanly only at the exact
viewing distance, tilt, or magnification the medium was designed for. Remove it and what's left is
a pretty engraved pattern with no anti-forgery function at all; the security is the resolution
threshold, not the motif.

## What it hands the system for free

A tiered verification model already solved: a glance check, a tilt check, and a magnified check,
each catching a different grade of forgery attempt. Any interface that needs multiple depths of
trust confirmation (a quick glance state, a closer look, an expert audit) inherits this structure
instead of inventing a verification ladder from scratch.

## Type character

Engraved, intaglio-register lettering with fixed stroke contrast, not a drawn or casual hand.
Numerals are tabular and set at a size that stays legible at both arm's length and under
magnification. Micro-text exists specifically to be illegible at normal size and legible only
closer in — display size does no dramatic work here, it does verification work.

## Voice

Formal and exact. Denomination, series, and watermark call-outs are printed plainly as fact, never
softened or stylised, because ambiguity in the words undermines the same trust the pattern work is
built to protect.

## Failure mode

Pushed toward decoration, the fine pattern work loses its resolution threshold and becomes merely
busy, at which point it stops functioning as security and starts functioning as visual noise.
Pushed toward more friction than its payment allows, it becomes illegible to the legitimate verifier
too, defeating the one asymmetry — genuine slightly harder than fake, not genuine impossible for
everyone — that makes the whole mechanism work.

## What it cancels

Cancels flat single-colour surfaces as a default. Cancels a design logic where colour signals
brand rather than a specific, checkable claim. Cancels expressive or ambient motion, since
verification depends on the document being still and inspectable. Cancels any tolerance for scale
ambiguity, since a pattern's pitch is the entire mechanism.

## Behaviour pulled off home

Pull chroma up toward a livelier system and the reserved-ink rule breaks first: once colour appears
everywhere, no single colour can mean "check this" anymore. Pull motion up and the surface stops
being inspectable at all, since the mechanism depends on a held, static artefact a viewer can tilt
and magnify at their own pace. Density can move considerably either direction and the isolation and
repetition devices still hold, because they were never about how much is on the page, only about
what is reserved versus what repeats.
