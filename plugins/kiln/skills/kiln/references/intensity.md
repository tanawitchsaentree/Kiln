# Intensity vector

Six axes, each 0–10. Not a single dial from restrained to extreme, because a dial produces one
shape of boldness. A vector produces many, and the arithmetic is what stops it collapsing to a
mid-value default on every axis.

`scripts/check_vector.py` enforces every rule below. It is deterministic and it decides, not
judgement. Run it before proposing a vector and again if the vector changes.

## The six axes

**C — Chroma.** How saturated the palette runs. Low is a system that could pass for monochrome from
across a room. High is a system with at least one colour that reads as a colour before it reads as
a brand.

**T — Type violence.** How far the type departs from a single neutral grotesque at a single weight.
Low is one face, one weight, size as the only lever. High is contrast of era, contrast of weight,
or a display face doing real work at reading sizes.

**G — Grid unconventionality.** How far the layout departs from a centred column on an even grid.
Low is the column. High is asymmetry, a broken grid, or a structure a reader has to learn before it
becomes legible.

**S — Surface eventfulness.** How much texture, pattern, or material quality the surfaces carry
beyond a flat fill. Low is a flat colour. High is a surface that behaves like a specific material —
paper, film, cloth, painted metal — with the wear that material implies.

**M — Motion presence.** How much the system moves beyond a state-change fade. Low is instant or a
150ms opacity change. High is choreography: staggered entry, orchestrated transition, motion that
carries meaning on its own.

**D — Density.** How much information sits in view at once, independent of the other five. Low is
generous space and few things per screen. High is dense, tabular, many things visible at once. This
axis alone can run high in an otherwise quiet system, because density is a content decision more
than a voice decision — a monitoring dashboard is dense and can still be visually quiet.

## What a score measures — expressive use, not total appearance

Every axis score is **how much the system spends on that axis by choice**, not whether the axis is
present at all in the literal rendered output. This was already the implicit reading for five of
the six axes — chroma asks how saturated the palette *runs*, not whether any colour exists on
screen; type violence asks how far type *departs* from neutral, not whether text is present; grid
unconventionality asks how far layout *departs* from a centred column, not whether the page has
layout. Every interface has colour, type, and layout by simple necessity, so scoring their mere
presence would make the low end of those three axes meaningless — nothing could ever be quiet.

This file is now explicit about it because surface (S) was the one axis where the distinction
actually mattered and had been scored inconsistently: **a functionally necessary property that
carries no decorative or expressive intent scores toward whichever axis it touches only if it was
chosen for its own sake, not merely present.** A flat, undecorated fill is S0 — "flat colour" is
already this axis's own stated floor. A drop shadow used purely as a functional depth cue in a
system with an explicit house rule against decorative shadow is also S0 for that system, even
though a shadow exists on screen wherever the rule's own exceptions apply (a floating layer, a
modal) — because the system's own stated position is that shadow is not spent expressively, it is
reserved narrowly and everywhere else refused outright.

**The test**: would removing this property change what the system is arguing, or only what it
looks like at a glance? Removing a genuinely spent axis changes the argument — a system that spent
chroma at 8 stops being itself if chroma drops to 2. Removing a merely-present, functionally
necessary property changes nothing about the argument — a system with one small functional shadow
on a dropdown, present because a dropdown needs to visually separate from the page and for no other
reason, is not "spending" on surface eventfulness; removing that one shadow and replacing it with a
border would not change what the system is about.

This reading is what makes the restraint profile's floor rule (`gates-restraint.md`) checkable at
all — a floor claim of 0 on an axis is a claim that the system spends nothing there by choice, and
"by choice" only means something if presence and expressive spend are different questions. Under
the opposite reading — score whatever is literally rendered, functional or not — almost nothing
could ever reach a true 0, because nearly every interface renders *some* colour, *some* type
weight, *some* spacing decision; the floor rule would then be unpassable for any real system, which
would make `gates-restraint.md` decorative rather than usable. See `intensity.md`'s sibling
decision in `gates-restraint.md`'s own floor criteria for the second half of this: a 0 also has to
have cost something to earn (the system's medium had to actually want that axis before refusing it
counts) — this section settles what a score *measures*; the floor's cost criteria settle what
counts as a *real* refusal versus a 0 that was never in question.

## The arithmetic

**Spread.** `max(vector) − min(vector)` must be 5 or more. A vector where every axis sits near the
middle is flat and the script fails it with `SPREAD`. A system with no low axis has no floor for a
high one to stand on.

**Concentration.** At most two axes may sit at 7 or above. A third one at 7 fails with `CONCENT`.
Boldness spread across four axes reads as noise, not confidence — the reader cannot tell which
choice is deliberate.

**Payment.** Any axis at 8 or above must be balanced by at least two axes at 2 or below, checked
independently for every axis that qualifies. This is `PAYMENT` in the script's output. An extreme
axis is not free. If chroma runs at 9, something else — usually grid and motion — has to go quiet
enough to carry it. A system that is loud everywhere has not made a decision, it has failed to make
one six times.

**Rotation.** Checked against `.kiln/log.json` if a log exists. The new vector must move by 3 or
more on at least two axes relative to the most recent entry, or the script fails with `ROTATE`. Two
systems in the same project with near-identical vectors are one system with a second name. The
script also names the previous lineage as a note — pick a different one.

## Reading a vector

Format is always `C{n} T{n} G{n} S{n} M{n} D{n}`, in that order, values as plain integers.

```
C2 T7 G3 S1 M2 D8
```

Read this one: type is the loud axis at 7. Density sits at 8, which is extreme and needs payment —
chroma at 2 and surface at 1 are the two quiet axes covering it. Grid and motion sit low-middle,
neither loud nor part of the payment. This is a dense, typographically assertive, visually quiet
system — a monitoring dashboard with a strong display face, not a poster.

```
C8 T2 G6 S7 M6 D1
```
This one fails. Three axes (C, G, S) sit at or near 7, which is concentration bleeding past two.
Chroma at 8 is extreme and needs two axes at 2 or below to pay for it; only density qualifies. The
script would return both `CONCENT` and `PAYMENT` failures. Fix: pick which two of chroma, grid, and
surface actually carry the system, and pull the third down.

```
C4 T5 G4 S5 M4 D5
```
This one fails on spread alone — `max − min` is 1. Nothing here has a point of view yet; every axis
is a default that hasn't been argued with.

## Naming the loud axis

Once a vector passes, name which axis is loudest and say what it is spending on. "Type is loud at 8,
paid for by chroma at 1 and motion at 2" is a sentence that belongs in the stamp. A vector with no
named loud axis is a set of six numbers nobody has taken a position on.

## Density is the axis most often forgotten under load

The other five axes describe voice. Density describes content. A brief for a data-heavy tool can
run every voice axis quiet and still be a legitimate, working system if density runs high — do not
inflate the other five to compensate for a brief that is genuinely dense and genuinely quiet
elsewhere. Padding a vector to look more "designed" defeats the arithmetic's actual purpose, which
is honesty about where the system spends its attention.

## Where the vector comes from

Phase 2 sets it, informed by the lineage's home vector (each lineage file states one) and by the
brief. A lineage's home vector is a starting position, not a requirement — a brief can pull a
lineage toward its own version of the tradition, and the file that states the home vector also
states what happens to the lineage's signature move when a controlling axis moves far from home.

Under a fixed brand constraint, some axes are given rather than chosen. Mark them with an asterisk
in the stamp and see `constraint.md` for how the arithmetic still applies to what's left.

## Two profiles

Everything above is the **expressive** profile, the default, and it is the right one for the large
majority of briefs — including most quiet ones. A brief with no loud axis is not automatically a
restraint brief; it may simply be a brief that never called for volume, and that's an ordinary,
common, entirely legitimate outcome scored under `gates-precision.md`.

A second, narrower profile exists for a different case: a system whose stated *thesis* is
disciplined refusal, not merely the absence of a loud axis. `references/gates-restraint.md` covers
when this applies and what it demands — it is not a lowered version of the spread rule, it has its
own different arithmetic (a hard ceiling, a required literal-zero floor proving an actual refusal,
and its own flatline check), run via `scripts/check_vector.py --profile restraint`. **Do not reach
for the restraint profile just because a vector fails spread** — a failed spread check almost always
means the vector needs an actual loud axis chosen, not that the system has secretly been a restraint
thesis all along. Read `gates-restraint.md`'s own entry test before declaring this profile; it is
the exception, and treating it as a routine substitute for spread would turn it into exactly the
escape hatch its own entry criteria were written to prevent.
