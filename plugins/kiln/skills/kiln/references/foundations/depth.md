# Depth, border, radius

Three ways of separating one surface from another. Pick one as primary and let the others support
it, because a system using all three equally reads as noisy at every scale.

## Choosing the primary separator

**Border-led.** Hairlines separate everything, elevation is minimal or absent. Reads precise and
technical. Native to lineages 03, 12, and 16. Best at high density.

**Elevation-led.** Shadow and surface lightness separate, borders are rare. Reads soft and layered.
Best at low density where surfaces have room to float.

**Space-led.** Neither border nor shadow. Separation comes from generous space alone. The hardest
of the three and the most confident. Native to lineages 01, 02, and 17.

The choice follows the lineage. State it, then hold it. A system that starts space-led and adds
borders when a layout gets tight has abandoned its own decision.

**This section names ONE system-wide choice. A real lineage extraction usually needs a second,
narrower pass — the `form-language` skill — because the primary-separator choice above doesn't by
itself answer what a control's actual SILHOUETTE is** (a raised extruded key vs. a flat rectangle
with a fill change can both satisfy "elevation-led," but they look nothing alike, and nothing in
the choice above forces picking between them). This gap is easy to miss precisely because "no
decorative shadow" (a real, legitimate, checkable rule) is not the same claim as "no functional
depth cue at all" — a system can hold the first rule with zero exceptions and still have never asked
the second question. If the brief's reference is a physical/hardware lineage (03, 07, 16, or any
lineage where the source object has real depth), invoke `form-language` once foundations lock, to
derive a per-component-class (control/input/surface/display/separator) silhouette+depth+corner
answer in geometry and tokens, not adjectives — see that skill's own derivation protocol and its
gates (G-F1 recipe markers, G-F2 form-goal presence, G-F3 identity-component lock, the last of which
makes the eyes-on multi-candidate check this file can't replace with a rule of thumb unskippable).

## Elevation

If you use it, define levels as a set with a stated meaning, not as a list of shadows. Resting,
raised, overlay, and sticky is usually enough. Each level says what kind of thing lives there.

A shadow is two shadows: a tight dark one for contact and a wide soft one for ambient occlusion.
One shadow always looks cheap.

Shadows do not survive dark mode. On dark surfaces, elevation reads through surface lightness rather
than through shadow, so each mode needs its own elevation values.

Never animate elevation on hover for every card. It is the most common decorative motion in
interfaces and it communicates nothing.

## Border

Weight derives from the type's stroke weight rather than being picked. One hairline, one emphasis
weight, and rarely a third.

Colour is a semantic token, and border colour in dark mode is usually a lighter surface rather than
a darker line.

A border that appears only on hover causes a one-pixel layout shift unless the resting state already
reserves the space with a transparent border.

## Radius

One value, or two. A system with five radii has a radius problem.

Nested radius must be computed rather than copied. An inner corner inside an outer corner needs
`inner = outer − padding`, or the curves fight. This is the single most visible unpolished detail in
generated interfaces.

Zero radius is a real choice and a strong one. It belongs to several lineages here and should not be
treated as the absence of a decision.

Full-round on a rectangular element reads as a pill and carries meaning, usually status or filter.
Reserve it rather than using it decoratively.
