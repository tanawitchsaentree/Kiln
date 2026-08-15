# Technique — craft, cross-axis finishing

Loaded at Phase 7 regardless of which axis is loud, or even whether any axis is loud. These are the
details Gate G2 checks for in `references/gates-precision.md` and `references/gates-coherence.md`,
and they separate a system that reads as engineered from one that reads as assembled, independent of
how bold the vector is.

## Nested radius, computed

Per `references/foundations/depth.md`: an inner corner inside an outer corner needs
`inner = outer − padding`, never a copy of the outer value. A copied radius produces two curves that
visibly fight at the corner, and it is the single most common unpolished detail in a generated
interface, loud vector or quiet. Compute it every time a radius nests, not only when the mismatch is
large enough to notice by eye.

## Optical centring, not geometric

Per `references/foundations/iconography.md`: an icon centred geometrically against a line of text
sits low, because the eye weighs the icon's visual mass against the text's cap height, not against
its full bounding box including descenders. Nudge by eye against the specific glyph, then lock the
offset as a token so it doesn't have to be re-eyeballed on every future use of that icon size.

## Optical margin alignment for punctuation

Per the type technique file's version of this rule, generalised: certain marks sit slightly outside
their geometric bounding box to read as aligned. This applies even in a system with no loud type
axis — a quote mark or a hyphen at the start of a line reads as hanging wrong at any intensity.

## Border weight derived, not picked

Per `references/foundations/depth.md`: border weight comes from the type's own stroke weight rather
than from an arbitrary pixel value someone found looked right. This produces a border that visually
agrees with the text sitting near it instead of competing with it at a different visual weight.

## Consistent terminal and corner treatment

One angle for diagonals, one terminal treatment for line-ends, one corner rounding logic — decided
once and applied everywhere, per `references/foundations/iconography.md`'s icon-construction rule
generalised to every drawn mark in the system, not only icons. A system that varies these per
instance looks collected rather than commissioned, regardless of how bold or quiet its vector is.

## The rendered check, not the token check

Every craft item above can pass a token-level review and still be visibly wrong once rendered —
nested radius maths is easy to get right in a spreadsheet and easy to get wrong the moment a real
padding value is substituted in. Gate G13 in both gate files exists specifically because craft
details are the ones a script cannot catch and a look at the actual render can.
