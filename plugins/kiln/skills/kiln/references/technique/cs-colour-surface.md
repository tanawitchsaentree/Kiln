# Technique — chroma and surface

Loaded when C or S sits at 7 or above. One file for both because a technique that spends one
usually spends the other — a saturated colour and a material surface quality tend to arrive
together, and separating the vocabulary would mean loading two files for one decision.

## Chroma

**Reserve saturation for exactly one role.** The single most common way a chroma-loud system still
reads as generic is spreading the saturated colour across many roles instead of one. Pick one thing
the colour means — a specific action, a specific status, a specific brand touchpoint — and let
every other colour in the system go quieter than default to pay for it, per
`references/intensity.md`'s payment rule.

**Push chroma at low lightness rather than high.** A saturated colour at high lightness (a pastel)
reads as decoration. The same hue pushed dark and saturated reads as material — ink, enamel,
dye — and is harder to arrive at by accident, which is exactly why it reads as intentional.

**Two colours that clash on purpose.** A deliberately inharmonious pair — not adjacent on the wheel,
not a tasteful complementary — signals a system that made a choice rather than one that reached for
a colour tool's suggested harmony. Riskier, and it needs a stated reason in the source note or it
reads as an accident.

**Colour as a closed vocabulary, published.** A loud chroma system earns trust by being finite — a
reader who sees the third saturated colour used for a new purpose loses confidence in all of them.
State the closed list and what each member means, the way `references/foundations/dataviz.md`
requires for a chart palette, generalised to the whole interface.

## Surface

**Behave like a stated material, not an abstract texture.** Paper has tooth and shows fibre at the
edge of a mark. Enamel has glare and chips at a corner. Film has grain that's denser in shadow.
Pick one real material, state which, and let every surface decision in the system trace to how that
material actually behaves rather than to a decorative filter applied once.

**Surface quality changes at the edge, not only in the field.** A material's most convincing tell is
often at its boundary — where paper curls, where enamel chips, where a painted line has a slightly
uneven width. A flat texture fill with a crisp vector edge reads as a texture applied to a shape,
not as the shape being made of that material.

**Depth from the material, not from a shadow.** Per `references/foundations/depth.md`'s choice of
primary separator, a surface-loud system usually gets its depth from material behaviour (a raised
surface catches light differently than a recessed one, in the material's own terms) rather than
from an added drop shadow. A shadow layered onto a material system that doesn't otherwise use
shadow reads as a second, unrelated depth system fighting the first.

**State what's being translated, not faked.** Per `references/extraction.md`'s conflict-handling
section, when the reference's material genuinely cannot exist on a flat backlit screen, name the
structural job the material was doing and solve that job with a real mechanism (a border, a spacing
rule) rather than painting a texture image over a flat surface as if it reproduced the material.

## Where these axes break

Both fail hardest under `references/foundations/a11y.md`'s forced-colours and high-contrast
requirements, because those modes override exactly the values a chroma- or surface-led identity
depends on. Test there specifically, per Gate G11 in `references/gates-coherence.md` — this is the
gate a loud chroma or surface system fails most often and most invisibly.
