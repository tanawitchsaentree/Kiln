# Technique — craft, cross-axis finishing

Loaded at Phase 7 regardless of which axis is loud, or even whether any axis is loud. These details
separate a system that reads as engineered from one that reads as assembled, independent of how bold
the vector is.

**Their evidence attaches to G13 in every set (precision, coherence, restraint), not G2.** G2 means
a different thing in each gate set — precision's G2 is "Optical correction," which happens to match
this file's contents, but coherence's G2 is "Signature move present and load-bearing" and
restraint's G2 is "The refusal holds without exception." A build routed to the coherence or
restraint set that only checked its own G2 for this file's items would be checking nothing — the
file has no home there under that number. G13 is the one gate number every set actually shares, so
that is where this file's checklist reports, always, regardless of which set is loaded.

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

## One frame per boundary, not one frame per element

An element that already reads as a bounded unit because its own edge carries a border does not also
wrap a child that independently marks the same boundary with its own border — icon box inside
bordered card, ring inside bordered ring inside bordered diagram, are the recurring shape of this.
Two borders occupying the same small region read as frame-inside-frame, not as one clear device,
even when each border is individually correct. Before nesting a second border inside a bordered
container, name the distinct boundary it marks that the outer border doesn't already mark — no
distinct boundary named, no second border.

## Locked ratio, not a per-instance guess

A container built to hold a smaller mark at a fixed proportion (an icon inside a badge, a step
number inside a circle) locks that proportion as one ratio and reuses it everywhere the pattern
recurs. Three components independently choosing 2.2:1, 2.25:1, and 2.4:1 for what is visually "the
same" icon-in-container pattern is three per-instance guesses, not one decision, even though every
individual instance can look fine in isolation — the drift only shows up sitting next to each other.
Check with `scripts/check_ratio_lock.py`, fed the measured outer:inner size of every instance of the
pattern; it fails loud on the first ratio that doesn't match the others and names which instance and
by how much.

## The rendered check, not just the token check

Every craft item above, including the two just added, can pass a token-level review and still be
visibly wrong once rendered — nested radius maths is easy to get right in a spreadsheet and easy to
get wrong the moment a real padding value is substituted in. That used to be this file's argument
for why Gate G13 has to be a human render-and-look step with nothing scripted underneath it. That
argument was only half right, and the half that was wrong is exactly the class of defect that ships
past it: nested-radius math, border-weight derivation, ratio-locking, and positional dependency
(`spacing-engine`'s L8/G-S6) are all `getComputedStyle`/`getBoundingClientRect` measurements a script
can and should make — `spacing-engine` exists specifically because a defect that "looks correct" in
CSS source can still measure wrong once rendered, which is the same failure this file describes for
craft items, not a different one. G13 in every set now requires that scripted pass — see
`phases/7-gates.md` — with the human look reserved for what genuinely has no measurable definition
(does this read as a decision, does the signature move still land). Do not let a clean G13 read
substitute for running the scripts; do not let running the scripts substitute for actually looking,
either — a system can measure clean and still look assembled.
