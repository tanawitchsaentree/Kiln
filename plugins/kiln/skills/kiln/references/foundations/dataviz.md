# Data visualisation

Load when the system shows charts, series, or dense numeric comparison. It is a design system inside
a design system, and treating it as an afterthought is why most systems have inconsistent charts.

## Chart palette is a separate palette

The brand palette is wrong for data. Brand colours are chosen for identity and are usually too few,
too saturated, and not perceptually spaced.

A categorical palette needs colours that are equally distinguishable, including for the most common
colour vision deficiencies. Six to eight is the practical maximum, and past that a chart needs a
different form rather than more colours.

A sequential palette needs even perceptual steps, which is what OKLCH is for. A ramp built by
changing saturation in a device colour space will have bands that read as boundaries in the data.

A diverging palette needs a meaningful midpoint and equal weight on both sides.

Semantic colours for up and down, or good and bad, are locale-dependent and must be configurable.
Red for loss is not universal.

## Never colour alone

Series need a second encoding: pattern, marker shape, or direct labelling. Direct labelling is best
and legends are a fallback, since a legend makes the reader move their eyes between two places.

## Type in charts

Tabular figures everywhere, without exception. Axis labels one step below body size. The value being
emphasised may be much larger, and everything else stays small.

Axis labels are horizontal. Rotated labels mean the chart is the wrong shape or has too many
categories.

## Structure

Start the axis at zero for bars, since bar length is the encoding. Line charts may start elsewhere
and must say so.

Gridlines are the lightest visible element or absent. A gridline competing with the data is a
gridline too heavy.

State the rule for chart types: which encodings the system supports and which it refuses. Most
systems should refuse pie charts beyond three slices, dual axes, and 3D anything.

## States

Charts need the same states components do. Empty, loading, error, partial data, and too much data.
The last one is specific to charts and is the one systems forget: what happens at two thousand
points.

## Accessibility

Every chart has a text alternative that states the finding rather than describing the shape.

Data tables are the fallback and should be available rather than hidden. Many users prefer them.

Interactive charts need keyboard access to each data point and an announced value.
