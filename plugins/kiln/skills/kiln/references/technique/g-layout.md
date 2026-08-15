# Technique — grid unconventionality

Loaded when G sits at 7 or above. Concrete moves for departing from the centred column on an even
grid, pulled from traditions that never had that grid to begin with.

## Asymmetric column division

Two or three unequal columns, the ratio stated and repeated rather than eyeballed per page — a wide
primary column against a narrow secondary one, the ratio itself becoming a recognisable rhythm the
same way a symmetric grid's gutter is recognisable. Per `references/foundations/grid.md`'s subgrid
requirement, nested content still aligns to whichever unequal track it sits in rather than
approximating its own centring.

## The broken or interrupted grid

A grid that a reader has to learn before it reads as ordered rather than chaotic — a module that
shifts at a stated interval, an element that deliberately crosses two tracks and is anchored to
both. The interruption has to be systematic (it happens the same way every time it happens) or it
reads as an error rather than a structure.

## Layout carrying meaning through position alone

Per `references/foundations/depth.md`'s space-led separation strategy, native to several of these
lineages, position and generous distance do the separating work a border or a shadow would do in a
quieter system. An element's distance from its neighbour is itself the hierarchy signal, and this
only reads correctly when the spacing scale is disciplined enough that a reader can trust "further
apart" to always mean "less related."

## Diagonal and rotation as a structural device

Rare, and it has to be systematic — one fixed angle used for one specific kind of element (a status
flag, a callout), never freehand per instance. A diagonal introduced once as decoration and never
again is not a grid technique, it's an accident with a good excuse.

## Overlap as a deliberate layering decision

Two elements sharing the same space, one legibly on top of the other, used to signal a relationship
a side-by-side layout cannot (this belongs to that, this is layered over that as an annotation).
Needs a stated z-layer per `references/foundations/grid.md`'s named-layer rule even at the loud end
— overlap without an explicit stacking rule produces layout that breaks the first time content
changes length.

## Where this axis breaks

An unconventional grid breaks hardest under real content and under narrow viewports, because the
technique was usually proven at one fixed width with curated content. Test with a string 40% longer
than the design copy per `references/foundations/i18n.md`, and test the collapse behaviour below the
grid's narrowest planned width — an asymmetric grid with no stated narrow-viewport behaviour will
improvise one, and the improvisation is rarely deliberate.
