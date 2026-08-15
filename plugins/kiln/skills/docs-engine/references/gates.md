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

## Publish/pack gating

Wire the full gate set into the docs build. A gate that has completed Gate Proof blocks
publish/pack on red. An unproven gate reports its finding in the audit output but does not block
— this mirrors the repo's own existing `taste`/kiln-gate advisory-until-proven convention, applied
to density gates instead of aesthetic ones.
