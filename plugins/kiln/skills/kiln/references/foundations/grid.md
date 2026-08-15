# Grid and breakpoints

## Breakpoints

Four or five named breakpoints, named by size rather than by device. Naming a breakpoint `tablet`
guarantees it will be wrong within two years.

Set them from where the content breaks, not from device statistics. Design at the widest and the
narrowest first, then find where the layout stops working between them.

Mobile-first declarations, so the base styles are the constrained case and every breakpoint adds
rather than overrides.

## Container queries over viewport queries

For components, the viewport is the wrong question. A card in a sidebar and the same card in a main
column have different available widths at the same viewport, and only a container query knows that.

Use viewport breakpoints for page-level layout. Use container queries for components. A component
that responds to the viewport cannot be reused in a narrow region, which is most of the reasons
components get rewritten.

## The grid

Column count, gutter, and margin, each as tokens. Twelve columns is conventional and fine. Fewer
columns with a larger gutter reads calmer and is worth considering when the vector is quiet.

Subgrid so nested components align to the parent's tracks rather than approximating them. This is
what separates a system that feels engineered from one that feels assembled.

State whether the grid is fluid, fixed, or fluid within a maximum. A maximum is almost always
correct, because a paragraph stretched across a wide monitor is unreadable.

## Measure

Text measure is a separate constraint from the grid and it wins. Between 60 and 78 characters for
body copy, regardless of how many columns the content spans.

A layout that lets a paragraph fill twelve columns has a grid but no typography.

## Spacing

One unit, one scale, every value a multiple. Derive the unit from the type's cap height rather than
picking 8 because everyone picks 8. A unit derived from type produces vertical rhythm for free.

Distinguish inset from stack from inline. Padding inside a component, space between stacked
siblings, and space between inline siblings are three different decisions and should be three
different token families.

## Z-layers

Named by purpose, never by number. `--layer-dropdown`, `--layer-modal`, `--layer-toast`. A system
with `z-index: 9999` somewhere has already lost this.

Order them once, document the order, and put every new layer into the named scale rather than
between two existing numbers.
