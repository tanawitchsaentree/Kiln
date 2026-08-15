# Working inside a constraint

Two situations the flow otherwise handles badly. Load when either applies.

## A fixed corporate identity

The brief mandates the palette, the typeface, or both, and they are not negotiable.

The lineage still runs, and it still carries most of the value. What it stops driving is colour and
type. What it continues to drive is hierarchy logic, which devices are used and which are refused,
rhythm and spacing, edge case behaviour, what the system gets for free, and voice.

Two brand colours and a mandated grotesque do not tell you how to separate a heading from its body,
what an empty state looks like, whether alarm is a reserved hue, or how a long string behaves. A
lineage tells you all of that.

Say this explicitly at Phase 1 rather than treating the constraint as a reason to skip the lineage:

> Palette and display face are fixed by brand. Taking the nautical chart lineage for everything
> else: one reserved alarm hue drawn from the brand set, hierarchy by enclosure and symbol rather
> than by size, and the never-overlap rule for labels.

The intensity vector is constrained too. A mandated palette usually fixes C within a range. Set the
axes you can and state which one is locked, then find the loud axis among those that remain.

Record the constraint in the stamp so a later run does not treat the fixed values as choices:

```
/* kiln 2.0.0 · lineage: nautical-chart · vector: C[fixed]3 T7 G2 S1 M1 D7
```

## Where the brand guideline is silent

Most guidelines cover logo, palette, typeface, and photography. Most say nothing about elevation,
motion, density, iconography beyond the mark, interface copy, error states, or composition.

Everything the guideline is silent on is where the lineage works, and it is usually most of the
interface. Say this to the user, because a brief with a fixed identity normally arrives carrying the
assumption that nothing is left to decide.

## Where the brand guideline is wrong for interfaces

Print palettes frequently fail interface contrast. A brand red at the specified value may not reach
4.5:1 on the brand background.

Do not silently correct it. Name the conflict, propose an interface-specific derivation that keeps
the brand hue while meeting contrast, and say it is a derivation. Brand teams accept this readily
when asked and resent it when discovered.

The same applies to a display face with no usable small sizes, a lockup that cannot survive a narrow
viewport, and a palette with no neutral ramp.

## The vector under a fixed brand

Chroma and often type violence become inputs rather than choices. Record them as given.

The profile arithmetic still applies to the whole vector. A brand mandating high chroma has already
spent the payment, so grid, surface, and motion must go quiet whether that was the plan or not.

> Vector C7* T5* G2 S1 M2 D6, asterisk fixed by brand. Brand spends the loud axis on colour, so
> structure holds quiet. Differs from last run on grid and density.

Stamp the identity source alongside it so a later run does not rotate away from a constraint:

```
 * identity: <brand guideline name and version>
```

## Two lineages in one system

Some briefs need an identity surface and a dense application surface, and no single lineage serves
both well. Lineages 05, 17, and 18 are identity-strong and application-weak. Lineages 03, 07, 12,
and 16 are the reverse.

Declare both. Name which surfaces each governs. Never blend them into an average, since averaging
two traditions produces the baseline with extra steps.

The boundary between them must be a real boundary a user crosses, such as marketing to product, or
shell to canvas. A boundary that runs through the middle of one screen reads as inconsistency
rather than as range.

Tokens are shared. Both lineages draw from one token set, and the difference is in which devices
each surface uses and how much room it gets. Two token sets is two systems.

Each surface gets its own vector, and both must pass the profile rules independently.

Stamp both, with the surfaces named:

```
/* kiln 2.0.0 · lineage: record-sleeve [marketing] + parts-diagram [product]
 * vector: marketing C7 T7 G6 S4 M3 D1 · product C1 T2 G4 S1 M1 D8
 * shared tokens: yes · boundary: marketing site to authenticated app
 */
```

Log both, as one entry with a `lineages` array rather than as two entries.

Run the gate set that matches each surface's vector, separately. A hybrid usually needs both gate
files across the whole system, which is the one legitimate reason to load both.
