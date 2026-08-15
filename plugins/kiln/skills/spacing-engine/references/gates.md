# Gates — G-S1 through G-S5

Every gate here measures a real rendered page (`getComputedStyle`/`getBoundingClientRect`
in a real browser via Playwright) — never inferred from CSS source text. This is the direct
lesson of the defect this order fixes: the stats-row's CSS looked correct (a real border, a
real padding rule) and still measured 0px clearance, because the padding lived on the wrong
side of the box model relative to where the border was drawn.

## G-S1 — clearance (L3)

**Check:** for every element adjacent to a visible boundary (border, divider, rule, panel
edge), the measured distance from that element's content box to the boundary, on the facing
side, is < the system's clearance token for that axis → red.
**Computed by:** for each candidate pair (element + its nearest visible boundary in the
DOM), `getBoundingClientRect()` on both, compute the gap, compare against the resolved
clearance token's real pixel value (read from `getComputedStyle` on `:root`, never
hardcoded in the checker).
**Gate-Proof:** remove the inline padding from one side of a real multi-cell divided row
(reproducing the exact stats-row defect); confirm the checker flags that exact cell with
the exact measured value (0px or near-0px) and names the token it should snap to; revert;
re-measure to confirm ≥ the clearance token on both sides.

## G-S2 — scale purity (L1, extends docs-engine's G-D10)

**Check:** a sampled computed margin/padding/gap value that doesn't resolve to any of the
system's real scale steps, and has no `data-optical` annotation → red.
**Computed by:** for each sampled element, read the resolved pixel value of each spacing
property via `getComputedStyle`, compare against the full real list of the system's own
`--ds-space-*` (or equivalent) resolved values — not the CSS source's variable NAME (a
component could reference the right-looking variable name while a build/token issue
resolves it to the wrong pixel value; measuring the resolved number is what actually proves
purity).
**Gate-Proof:** add one raw off-grid pixel value (e.g. `padding: 13px`) to a real element's
inline style or a scoped override; confirm the checker flags the exact element and pixel
value with no matching scale step; revert.

## G-S3 — monotonic proximity (L2)

**Check:** for a declared relationship ladder on a page (bound-pair < item < component <
group < section, whichever levels that page actually has), a measured "between" gap at any
level ≤ the "within" gap at the level below it → red.
**Computed by:** measure the real gap between two sibling groups at each declared level and
the real gap between two children within one of those groups; assert strictly-greater at
every adjacent pair of levels.
**Gate-Proof:** shrink a real "between-group" gap below its own "within-group" gap on a
real page (e.g. reduce a section-to-section margin to less than its own paragraph spacing);
confirm the checker flags the exact inversion with both measured values; revert.

## G-S4 — heading binding (L5)

**Check:** for every heading, computed space-above ≤ computed space-below → red.
**Computed by:** measure the gap between a heading and the element immediately before it,
and the gap between the heading and the element immediately after it (accounting for margin
collapse — measure actual rendered position, not just declared CSS margin values, since two
adjacent margins can collapse to something other than their sum); assert above > below.
**Gate-Proof:** swap a real heading's margin-top/margin-bottom values so below exceeds
above; confirm the checker flags the exact heading with both measured values; revert.

## G-S5 — rhythm (L6)

**Check:** for a set of structurally-equivalent sibling elements (list items, stat cells,
card-grid items), measured gaps between consecutive pairs are not identical (variance
beyond an L7-documented optical tolerance) → red.
**Computed by:** measure the gap between every consecutive pair of equivalent siblings;
assert all gaps are equal (±0px, or ±2px only if each carries a `data-optical` reason).
**Gate-Proof:** change the gap on one item in a real repeated list/grid (e.g. one card-grid
item gets an inline `margin-inline-end` no sibling has); confirm the checker flags that
exact item and the measured variance; revert.

## Gate-Proof discipline

Every gate above requires the same protocol before it counts as more than advisory: plant a
real violation on a real page, run the checker, confirm it reports the exact element and
the exact bad measured value (not just "something failed"), revert, re-run to confirm
green. Record the before/after values in whatever report cites the gate — "Gate-Proofed" is
a claim that needs the actual numbers to back it, per this repo's own standing Gate Proof
Rule.
