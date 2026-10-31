# Gates — density and truth

A gate is **advisory only** until it has been Gate-Proofed: plant a violation, watch the check
actually go red, revert, confirm green again. A gate that has never been red does not count as
enforced, no matter how obviously correct its logic looks — this is the repo's own standing Gate
Proof Rule, applied here to every G-D gate below. Record which gates have been proven and how, in
the run's own report — never claim a gate is "wired in" without naming the mutation that proved it.

## G-D1 — demo floor

**Check:** for every component page, `demo_count < variant_count + 3` → red.
**Computed by:** `scripts/audit.mjs` (TS-aware, via `react-docgen-typescript` for a React repo —
swap the parser for the stack's own type system elsewhere, keep the formula).
**Gate-Proof:** delete one demo block from a passing component's page; confirm the audit script's
exit code flips to nonzero and the specific component is named in its output; restore the demo;
confirm green again.

## G-D2 — dedupe

**Check:** byte-identical paragraph appearing twice in one page → red.
**Computed by:** hash each `<p>`/prose block per page (post-MDX-render or pre-render text
extraction, whichever the stack's tooling makes easier), compare within-page.
**Gate-Proof:** copy-paste one existing paragraph to duplicate it on a real page; confirm the
check flags that exact page and paragraph; revert.

## G-D3 — render integrity

**Check:** raw backtick / unrendered markdown syntax literally present in the built HTML output
→ red. (Distinct from backticks inside a real `<code>` block, which are fine — this catches
markdown that failed to parse and leaked through as literal text.)
**Computed by:** build the site, grep the output HTML for markdown-syntax patterns appearing
outside `<code>`/`<pre>` tags.
**Gate-Proof:** intentionally break one MDX file's syntax (e.g. an unclosed inline-code backtick)
so it fails to parse into a real `<code>` element; confirm the built-output grep catches the leak;
revert.

## G-D4 — nav integrity

**Check:** any nav entry 404s, OR `fs-page-count ≠ nav-count` (two-counts) → red.
**Computed by:** crawl the built nav tree, request every URL, confirm 200; separately, count real
page files on disk and compare to the nav data structure's own entry count.
**Gate-Proof:** add a page file with no nav entry (or a nav entry with no matching page); confirm
the two-counts check flags the mismatch by exact number; revert.

## G-D5 — generated tables

**Check:** props table or keyboard table content not traceable to a generator function's output
→ red (i.e., someone hand-typed a row instead of calling the generator).
**Computed by:** the page-generation step itself should refuse to accept a literal markdown table
for these two checklist points — enforce at generation time, not just at audit time, since this
is the one gate that's cheaper to prevent than detect after the fact.
**Gate-Proof:** hand-type one extra row into a generated props table's markdown source; confirm
the audit step (re-running the generator and diffing against the committed page) flags the
mismatch; revert.

## G-D6 — non-prose floor

**Check:** an overview/guide page with zero non-prose structures → red.
**Computed by:** parse the page's rendered structure, count elements matching the structural
component set (cards, tables, steppers — whatever the project's MDX component registry defines
as "structural" vs. plain prose).
**Gate-Proof:** confirmed already on this repo without needing a synthetic plant — Introduction/
Installation/Theming/Dark-mode/Compared-to-alternatives all currently score 0 structures (see
`PLAN.md`'s Phase 1 audit). That real, present-tense failure IS the gate proof for this one:
the check found 5 genuine violations before any fix — plant-and-revert isn't needed when a gate's
first real run already demonstrates it goes red on true positives. Re-verify by re-running the
check after Phase 3's fix and confirming all 5 flip to green.

## G-D7 — chrome tokens

**Check:** hardcoded color/font value anywhere in docs chrome (adapter file + chrome stylesheet)
→ red.
**Computed by:** grep for hex/rgb/hsl/oklch literals and raw px font-family strings outside the
token adapter file itself.
**Gate-Proof:** add one hardcoded hex value to the chrome stylesheet; confirm the grep-based check
flags the exact file:line; revert.

## G-D8 — layout

**Check:** horizontal overflow at 360/768/1180/1440px, console errors, in both light and dark
theme → red.
**Computed by:** Playwright, four viewport widths × two themes = 8 checks per page, checking
`document.documentElement.scrollWidth` against viewport width and collecting console errors.
**Gate-Proof:** force one element to a fixed width wider than the 360px viewport on a real page;
confirm the check flags that exact page/viewport/theme combination; revert.

## G-T1 — composition floor

**Check:** an example template page with fewer than 8 distinct component imports, or fewer than 3
represented categories → red.
**Computed by:** parse the template's own source file's import statements, cross-reference each
imported name against the sidebar nav's own category assignment (never invent a second taxonomy)
— count distinct components and distinct categories.
**Gate-Proof:** remove enough component usages from a passing template to drop it under 8 (or
collapse it to 2 categories); confirm the check flags that exact template by name with its real
count; revert.

## G-T2 — same-source

**Check:** the code panel displayed to the reader for a template's source does not byte-match
(after accounting for the extraction step's own deterministic transform, e.g. import resolution)
the actual module that renders the page → red.
**Computed by:** hash the extracted/displayed source string and separately hash (or re-read) the
real rendering module's source file at build/audit time; compare.
**Gate-Proof:** hand-edit the displayed source string in a template's own code panel so it no
longer matches its rendering module (e.g. change one prop value only in the displayed string);
confirm the hash-mismatch check flags that exact template; revert.

## G-T3 — inventory honesty

**Check:** a template page exists (route resolves, renders) whose catalog entry named a required
component that is not actually present in the page's own imports/render output → red. This catches
a template that got scaffolded with a placeholder for a component the inventory scan said it
needed, but the placeholder was never replaced with the real thing.
**Computed by:** cross-check each shipped template's actual component usage (same import list
G-T1 reads) against its own catalog-decision required-components list.
**Gate-Proof:** remove one required component's usage from a shipped template without updating its
catalog entry; confirm the check flags the exact template and the exact missing component; revert.

## G-T4 — thumbnails

**Check:** a templates-index thumbnail is missing, or its stored hash doesn't match a fresh
screenshot hash of the current render → red (stale thumbnail).
**Computed by:** generate a screenshot at build/audit time for each template, hash it, compare
against the hash recorded when the index was last built.
**Gate-Proof:** change a visible element in one template (e.g. a heading's text) without
regenerating its thumbnail; confirm the hash-mismatch check flags that exact template as stale;
regenerate the thumbnail and confirm green again.

## G-T5 — page health

**Check:** reuses G-D8's proven machinery (overflow/console/contrast, both themes, all
breakpoints) plus a keyboard-walk check (Tab through every interactive element, assert each
focused node is visible and interactive, in a sane order) against every template ROUTE → red on
any failure.
**Computed by:** same Playwright harness as G-D8, run against `/examples/*` routes specifically,
plus a `page.keyboard.press('Tab')` loop asserting `document.activeElement` is a real interactive
element each time, not `body` (a signal of a focus trap or an unreachable control) and not
revisiting an already-focused element before reaching the page's last interactive control (a
signal of a broken tab order/trap).
**Gate-Proof:** add `tabIndex={-1}` to one interactive control inside a template (removing it from
the tab order) or introduce a genuine focus trap; confirm the keyboard-walk check flags that exact
template and control; revert.

## G-D9 — code-block integrity

Fixes the class of defect the docs-engine-amendment-craft-contract order proved live: G-D3
("render integrity — raw backticks / unrendered markdown") only checks that a fence PARSED into
some `<pre>`/`<code>` structure — it says nothing about whether that structure actually got real
panel chrome. A fence can render as valid, backtick-free HTML and still look like six stacked
unstyled inline-code pills if the generator never built a shared panel component for plain
MDX-authored fences (only demo-specific wrapper components got real styling). G-D9 is the gate
that catches this class specifically.

**(a) Two-counts — fenced-block count in source vs rendered `<pre>` count.**
**Check:** for each content page, the number of ` ``` ` fence pairs in the raw MDX source ≠ the
number of real `<pre>` elements in the rendered page → red.
**Computed by:** regex-count fence markers in source; Playwright `page.locator('pre').count()`
against the live render; compare per page.
**Gate-Proof:** remove one fence's closing ` ``` ` from a real page's source (or add a stray
` ``` ` with no matching close) so the counts diverge; confirm the check flags that exact page with
the exact mismatched numbers; revert.

**(b) Inline-code abuse.**
**Check:** ≥2 adjacent paragraphs whose content is ≥80% code characters, OR any inline `<code>`
(one not inside a `<pre>`) containing an import statement, a statement terminator (`;` at a
line's end), or a literal newline → red. This is the exact shape of the live defect: a multi-line
snippet authored correctly as a fence, but rendered — or in a worse case, AUTHORED — as a run of
inline `<code>` spans in bare paragraphs.
**Computed by:** walk the rendered DOM's `<code>` elements not nested in a `<pre>`; test each
against the character-ratio/import/statement/newline heuristics.
**Gate-Proof:** replace one real fence in a page's source with the equivalent content as
consecutive single-backtick inline-code lines (the exact authoring mistake this gate exists to
catch); confirm the check flags that page; revert to the real fence.

**(c) Missing panel anatomy.**
**Check:** any `<pre>` lacking a language indicator, a copy control, or real highlight spans
(`style` attributes carrying `--shiki-*`, or equivalent for a non-Shiki highlighter) → red.
**Computed by:** for each rendered `<pre>`, assert its containing panel has a language-tag element,
a copy-button element, and at least one child carrying highlight-token styling.
**Gate-Proof:** temporarily bypass the shared panel component for one page's fence (render a bare
`<pre><code>` with no CodePanel wrapper); confirm the check flags the missing language tag/copy
control/highlight spans; revert.

## G-D10 — rhythm

**Check:** sampled computed gaps between sibling blocks (heading→prose, prose→code, code→table,
table→demo) that don't resolve to a real spacing-token pixel value (±0px tolerance) → red. Prose
column width outside 60–80ch → red.
**Computed by:** for a sampled set of pages (one per template type: component/foundation/
overview/guide/example), read each sibling pair's computed `margin`/`gap` via
`getComputedStyle`, and independently read the token file's own resolved spacing values
(`packages/tokens/build/css/light.css` or equivalent) — assert exact match, not "close enough."
Prose measure: compute `ch`-equivalent width of the main content column at a standard viewport.
**Gate-Proof:** add one hardcoded pixel margin (not a token) to a heading/prose/code sibling gap
on a real page; confirm the check flags that exact page and the exact non-token pixel value;
revert. Separately, widen a content column past 80ch on a real page; confirm the prose-measure
check flags it; revert.

## G-D11 — table pattern

**Check:** a matrix-shaped markdown table (detected structurally — a real `<table>` with ≥2
columns and ≥2 data rows, the shape a comparison/matrix table takes) rendered WITHOUT the shared
table component's treatment (missing header-row background/weight, missing row rules, or — where
applicable — missing mono first-column treatment) → red.
**Computed by:** for each rendered `<table>`, assert it carries the shared component's class name
(e.g. `docs-table`) and that its header cells resolve a real surface-background token, not the
page's ambient background.
**Gate-Proof:** render one raw `<table>` bypassing the shared `DocsTable`/`table`-override
component on a real page; confirm the check flags the missing class/header treatment; revert.

## Engine gates (tooling/engine/gates.mjs)

The engine runs about forty more gates than this file defines; their one-line definitions are the
header comment of `tooling/engine/gates.mjs`, which is the source of truth. The two below were added
from Pane on 2026-10-29 and are spelled out because both failures passed every other gate.

### G-IN1 — text clears its control's edge
On every Code page, every line of text inside a control-sized bounded shape (20–72px tall, a drawn
border, shadow or fill, radius ≥4px) sits at least max(8px, half the end radius) from the shape's
inline edges; typed text in a bounded field is checked through its padding (centred cells such as
PIN digits are skipped). Gate Proof: set an InputGroup's end padding to gap-xs with a text suffix;
the gate names the suffix and its distance.

### G-ST1 — the address holds only choices
Opening `/` with no query must end with no query: the app never writes a default into the URL.
Opening it with unknown values for the theme and scene parameters must render, fall back to the
defaults and drop both values. Gate Proof: write the current theme into the URL on load; the gate
names the parameter.

### G-RH1 — separate steps stand apart
On every component page, the nearest block above and below every demo stage and every tab bar is
measured: a separate step (a table, a list, code that is not the stage's own, another stage, the
controls) stands at least 24px off, an intro paragraph 16px, and the stage's own heading, caption,
legend or code 8px. Watch for a details element: it does not lay its content out as flex, so put
the gap on a wrapper inside it. Gate Proof: set the live demo's gap to 8px; the gate names each pair.

### G-GL1 — glow is declared and measured
On every Code page, in both themes: any part in a stage with a light outer shadow (blur ≥6px,
alpha ≥0.15) must sit in a `[data-glow]` part in the dark theme and must not exist in the light
theme; text with a light blurred halo fails in dark; no glow reaches beyond 32px (blur + spread).
Each declared part that is on (not unchecked or disabled) is screenshotted with its glow on and off:
the ring 2–6px outside must be lighter by strong 1.25:1, soft or mark 1.15:1, and at 32–38px the
two shots must match within 1.03:1. Gate Proof: remove `data-glow` from a glowing part, or drop a
soft glow to 10% white; the gate names the part and the measured step.

### G-SL1 — a slider has room and holds still
On every component page, every enabled slider is focused and taken to Home and End: it must be at
least 200px long, and neither its own box nor its pane's may change size between the two. A control
that sizes itself from its value text bounces its container on every drag. Gate Proof: drop the
slider's width so it shrinks to fit inside a centred stage; the gate names its length and the jump.

### G-S6 — nothing spills out of the page column
On every page, with folds open, no element inside main may cross main's inline edges, unless it sits
in a scroll or clip container. A spill slides under a sticky rail and puts content behind its text.
Gate Proof: give a do/don't row two 1fr columns and a demo wider than half; the gate names the cell.

G-ST1 also opens the book with every configured scene (sceneParam) and fails if the app drops it, so
a renamed URL parameter can never leave the scene-swept checks measuring the default.

G-ST1 fails when the book has a backdrop control and `docs.scenes` is empty, and when the list names a
backdrop the control does not offer. G-SV1 fails when the book has no `/patterns/states` page
(`docs.statesRoute`) or the matrix there has no cells; a KILN_ROUTES run that leaves the page out skips
it. G-MT1 finds panes by `docs.surfaceSelector` (default `[data-surface]`); a system that marks its
panes with another attribute names it there.

### G-GR1 — glass follows the shared recipe
Component CSS writes `backdrop-filter` only as `none` or through tokens (a literal `blur(` in a
module is red), and every element in a live example that blurs what is behind it carries every
function in `docs.glassRecipe.functions` (default blur, saturate, brightness). Pane's Navbar blurred
only, so it was the one pane that did not darken a bright scene and its text fell to 3.4:1. Recipe:
`docs/style-recipes/glass.md` in kiln. Gate Proof: `surface-probes.proof.mjs` plants
`backdrop-filter: blur(20px)` in a module and on a Navbar; both are red, the full recipe is green.

### G-BR1 — a bare subject paints its surface; no text on the bare photo
A subject marked `data-bare="surface"` (a component that is its own surface and is shown without a
pane under it) must paint one: a backdrop filter or a background at alpha 0.9 or more
(`docs.bareMinAlpha`). Layout subjects are marked `data-bare="layout"` and skipped. On every stage
whose background is a photo, each text node must have an ancestor inside the stage that paints a pane
(backdrop filter, background alpha of `docs.paneAlpha` 0.35 or more, or a gradient). Pane drew chart,
chat and agent text straight on the scene. Set `docs.photoScene` to the brightest photo scene so the
gate looks at one. Opt out per element with `data-photo-text` only for text that is measured some
other way. Gate Proof: a bare BarChart with no surface and a ChatMessage with no pane on a photo are
red; the same with the recipe or a 66% body are green.

### G-MS1 — a mesh gradient is an accent
An element marked `data-mesh`, or whose own or pseudo-element background holds two or more radial or
conic gradients, may cover at most `docs.meshMaxShare` (10%) of its region: the closest section,
stage, surface or card. A mesh on `html` or `body` is a wallpaper and always red. User rule,
2026-10-31. Gate Proof: a mesh filling its section and a mesh body background are red; a 120px mesh
chip in an 800px section is green.

### G-AN1 — the card still looks like the anchor
At the anchor lock, `tooling/kiln/anchor-likeness.mjs --record <anchor html>` measures the picked
card on its backdrop: body lightness and chroma in OKLab (median of the middle half, so text does not
move it) and rim contrast (the outer 2px against the backdrop 4 to 8px outside). The gate opens
`docs.anchor.route` on the recorded scene and theme, measures `docs.anchor.selector` the same way and
fails past `maxDeltaL` 0.05, `maxDeltaC` 0.03 or `maxDeltaRim` 0.4. R-032: Pane's glass was tuned one
number at a time until it read as opaque, and nothing compared it with the anchor. Gate Proof: a 45%
anchor against a 92% card is red; against a 47% card it is green.

## Publish/pack gating

Wire the full gate set into the docs build. A gate that has completed Gate Proof blocks
publish/pack on red. An unproven gate reports its finding in the audit output but does not block
— this mirrors the repo's own existing `taste`/kiln-gate advisory-until-proven convention, applied
to density gates instead of aesthetic ones.
