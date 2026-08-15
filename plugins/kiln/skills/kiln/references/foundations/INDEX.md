# Foundations index

The layers every component sits on. Read this index, load only the foundations the brief needs.

A component built before its foundations are decided will encode a guess, and forty components
later that guess is expensive to remove. Foundations come first even when they feel abstract.

| Foundation | File | Load when |
|---|---|---|
| Token architecture | `tokens.md` | always, at Phase 6 |
| Theming and modes | `theming.md` | more than one mode, brand, or density |
| Grid and breakpoints | `grid.md` | always, at Phase 6 |
| Depth, border, radius | `depth.md` | S above 1, or any elevation at all |
| Motion system | `motion.md` | M above 1 |
| Iconography | `iconography.md` | the system ships icons |
| Imagery | `imagery.md` | illustration, photography, or a logo lockup |
| Accessibility | `a11y.md` | always, at Phase 6 |
| Language and script | `i18n.md` | more than one language, or any non-Latin script |
| Data visualisation | `dataviz.md` | the system displays charts or numeric series |

`motion.md` here is the system, meaning durations, easings, and choreography rules.
`technique/m-motion.md` is the implementation. Load the foundation to decide, the technique to build.

## Order

Tokens, then grid, then depth, then everything else. Theming is decided with tokens rather than
after them, because retrofitting a second mode onto a single-mode token set means renaming
everything.

## Minimum viable set

A Spec-scale system needs tokens, grid, and a11y unconditionally, plus depth per its own stated
condition above (S above 1, or any elevation at all) — not unconditionally. A vector with S at 1 or
below and no elevation genuinely has nothing for `depth.md` to decide (no border-vs-shadow-vs-space
choice to make when there's effectively no depth to separate), and loading it anyway is exactly the
unused-foundation cost this section warns against. The rest are added when the brief has them. Do
not write a foundation the brief does not need, since an unused foundation still has to be
maintained and will be wrong by the time someone needs it.
