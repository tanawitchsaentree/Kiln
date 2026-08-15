# Technique — density

Loaded when D sits at 7 or above. Density is a content axis more than a voice axis, per
`references/intensity.md`'s own note on it — it can run high in a system that is otherwise quiet on
every other axis, and the technique here is about holding a lot of information legible, not about
making the system feel loud.

## Tabular figures everywhere numbers align

Per `references/foundations/dataviz.md`'s rule, generalised beyond charts: any column of numbers,
anywhere in a dense interface, uses tabular figures without exception. Proportional numerals in a
dense table produce a ragged column that the eye has to re-scan on every row, and at high density
that cost compounds fast.

## A real hierarchy inside the dense view, not size alone

Position, weight, and a reserved emphasis colour (per the chroma technique file if that axis is also
loud) distinguish the one or two things in a dense screen that matter most from the many that are
merely present. A dense screen with no internal hierarchy is not information-rich, it's just a wall
of equal-weight facts the reader has to sort themselves.

## Row height and information per row as one decision

Per `references/foundations/theming.md`'s density-mode note, shrinking type is an accessibility
decision disguised as a density one and should be avoided; the actual lever is row height and
information per row. A compact density mode reduces the padding around content, not the size of the
content itself.

## Progressive disclosure inside a dense view

Not every field needs to be visible at once even in a genuinely dense system — a row can carry its
most decision-relevant fields visible and its secondary detail behind an expand, provided the
expand's existence is obvious rather than hidden. This is the density technique most often skipped
because it requires deciding which fields are secondary, which is a real editorial decision rather
than a layout one.

## Tested with real volume, not a curated sample

A density-loud system's curated five-row example table looks fine at any density setting. The
failure shows up at row two thousand, at the column that occasionally holds a much longer value than
the design sample had, and at the empty cell that the design sample never included. Test with the
volume and irregularity the system will actually see, per `references/foundations/dataviz.md`'s
own "too much data" state, which applies to any dense view, not only charts.

## Where this axis breaks

Density breaks first at long strings and at missing data, both of which a curated sample hides by
construction. It breaks second under `references/foundations/i18n.md`'s string-expansion rule — a
dense table designed at English string lengths has no room left when the same labels expand 40% in
another language, and a dense layout has far less slack to absorb that expansion than a spacious one
does.
