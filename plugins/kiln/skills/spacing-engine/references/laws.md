# The seven laws (IRON — invariant across every system)

Adopted from `~/.claude/skills/spacing-control`'s doctrine, restated as measurable
invariants rather than a checklist read by eye. Every law below has a corresponding gate in
`gates.md` that measures it with `getComputedStyle`/`getBoundingClientRect` in a real
rendered page — never inferred from CSS source text alone, because CSS that "looks correct"
can still measure wrong (see the stats-row defect: correct-looking border/padding rules,
0px measured clearance).

## L1 — Scale purity

Every gap, padding, and margin resolves to a token from the system's own single scale. An
off-grid value (a raw px number that isn't one of the scale's real steps) is a bug, not a
stylistic choice — full stop, no exceptions except the named optical cases in L7.

## L2 — Monotonic proximity

Moving up nesting levels (bound-pair → item → component → group → section → page), spacing
must never decrease. The gap *between* two things at a given level must exceed the gap
*within* either of those things. The instant a "between" gap is ≤ a "within" gap at any
level, the visual grouping inverts and the eye misreads what belongs to what.

## L3 — Clearance

Content sitting adjacent to any VISIBLE boundary (a border, a divider line, a rule, a
panel's own edge) keeps at least the system's clearance token of distance from that
boundary, on the side facing it. Touching the line — 0px, or less than the token — is red,
regardless of how correct the surrounding CSS rule looks. **This is the law the stats-row
defect violated**: a divider correctly drawn, content correctly padded on ONE side, zero
clearance on the other, because the padding lived on the wrong cell relative to where the
border was drawn.

## L4 — Bound pairs tightest

Label↔value, icon↔text, bullet↔text: whatever the smallest, most tightly coupled pair of
elements on a page is, its gap must be the smallest spacing value anywhere in its
surrounding context. If a bound pair's gap is larger than the gap between two otherwise
unrelated components nearby, the pairing itself stops reading as a pairing.

## L5 — Heading binding

A heading's space-above must exceed its space-below, always, in every density mode. This is
what visually binds a heading to the content it introduces rather than floating it
equidistant between two blocks (which reads as belonging to neither — an orphaned heading).

## L6 — Rhythm

Repeated, structurally-equivalent units (list items, table rows, stat cells, card-grid
items) share identical gaps throughout. Unequal spacing between visually-parallel siblings
reads as an error even when each individual gap is independently on-scale.

## L7 — Optical honesty

A deviation from the scale is allowed only when it is ≤2px, and only when it names WHY
(hanging punctuation/bullets, an icon whose visual weight differs from its bounding box,
all-caps letter-spacing compensation, optical alignment of large numerals). The reason must
be carried as a real, inspectable annotation (e.g. `data-optical="icon-bbox-differs"`) — an
unannotated off-grid value is not an optical exception, it's a stray, and L1 applies.

## L2 has two valid separation mechanisms — gap-based and divider-based

Found live while Gate-Proofing G-S3 against this repo's own landing-page panel (a continuous
surface, every row/control flush against its neighbor, separated by a hairline rule and each
element's own internal padding — not by margin/gap between elements). Measuring "between" and
"within" gaps the way G-S3's model assumes (space between two border boxes) reports a false 0px
"gap" at every level of a divider-based layout, because there IS no gap — separation is provided
entirely by (a) the hairline itself and (b) L3's own clearance (each element's content keeps real
distance from ITS OWN edge, which happens to be where the hairline sits).

**Both are valid, real spacing strategies — L2's actual invariant is monotonic SEPARATION, not
specifically monotonic GAP:**
- **Gap-based** (e.g. a card grid with real `gap`/`margin` between siblings): measure border-box-
  to-border-box distance directly. G-S3 in its original form applies.
- **Divider-based** (e.g. a continuous panel with hairline rules and zero inter-item margin):
  there is no meaningful "between" gap to compare against a "within" gap in the same units — the
  correct check is that L3's clearance token is honored consistently at every level (confirmed via
  live measurement: Dial's landing panel keeps 24-25px real clearance at both the section-row level
  and the control level, i.e. the SAME clearance token at both levels, which is the divider-based
  equivalent of "the outer separation is at least as large as the inner one" — equal is fine here
  because the invariant that matters is "no level touches its divider harder than the level below
  it," not "the outer gap is numerically bigger").
- A page may mix both strategies at different levels (this landing page's stats-row-to-stats-row
  IS divider-based, but templates-grid-to-templates-grid-item elsewhere on the same page IS
  gap-based) — G-S3's ladder declaration for a given page must state which mechanism applies at
  each level rather than assuming one uniformly.

## Parameters are NOT laws

None of the seven laws above name a number. Base unit, the scale's actual steps, which
density mode governs which zone, the clearance token's specific value, the exact ratio
between adjacent relationship levels — all of that is the OPEN layer, derived per system
from that system's own locked tokens and lineage (see `SKILL.md`'s derivation protocol and
`dial-parameters.md` for Dial's own worked derivation). Applying `spacing-control`'s own
reference numbers (base-4, `2xs 4 / xs 8 / sm 12...`) to a system whose real locked scale is
base-8 would itself be a law violation — L1 says the scale is THIS system's own, not a
borrowed one.
