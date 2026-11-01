# Targets: what a kiln system ships for each platform

A kiln system is written once, as DTCG tokens and React components. The token build turns the same
source into every format below, so a brand file or a change to a semantic token reaches each
platform from one build. Components are another matter, and this page says plainly where the work
stops.

| Platform | What the starter ships | How far it goes |
|---|---|---|
| React | the component package and the tokens | complete |
| HTML, Vue, Svelte, Angular, Solid | the compiled CSS with stable class names, plus an HTML block under every live demo in the book | the look is complete; keyboard, focus and open or close are wired by hand |
| Tailwind | `<tokens>/tailwind`, a preset whose values are the CSS variables | colour, spacing, corners, type and motion, with themes intact |
| SwiftUI | `<tokens>/swift`, one enum per theme | tokens only |
| Jetpack Compose | `<tokens>/kotlin`, one object per theme | tokens only |
| Flutter | `<tokens>/dart`, one class per theme | tokens only |
| Figma | `<tokens>/figma`, one collection with a mode per theme | tokens as variables |

## How the native files are made

`packages/tokens/build.mjs` writes them after the CSS. Each takes the semantic and component tiers,
because product code reads those and never a primitive. Every theme gets a full set, resolved through
the theme overrides, so `Dark` and `Light` hold real values with no lookups left. Dimensions in px
become points, dp or logical pixels one to one, and durations in ms become each platform's own
duration type.

Colours go in only when they are hex. A colour written as `oklch()` or `color-mix()` has no single
value a Swift or Kotlin file can hold, so the build leaves it out and prints how many it skipped. A
system that targets native apps writes its colour primitives as hex.

## The HTML block

The book renders each live demo to static markup (`renderToStaticMarkup`) and shows it under the TSX.
That only works because CSS modules are built with stable names (`<prefix>-<Component>__<part>`),
so the markup and the shipped CSS agree. A component that needs React for its behaviour still shows
its markup. The page says what is left to wire.

## What is not built yet

Native components for SwiftUI, Compose and Flutter, and wrappers for Vue or Svelte. Each is its own
package with its own conformance checks, and a system should only claim one when those checks run.
Until then the Platforms page of the book lists each target with how far it goes, the same as the
table above.

Pane was the first system to ship all of these, on 2026-11-01 (D-042), from 1,149 semantic and
component tokens.
