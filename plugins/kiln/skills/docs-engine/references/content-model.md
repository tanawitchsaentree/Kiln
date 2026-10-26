# Content model — measured, not aspirational

Every number in this file is either a formula computed at generation/audit time, or a fixed
minimum small enough to defend on its own (≥2 Do/Dont pairs, ≥1 non-prose structure). Nothing
here is a round number chosen because it felt right.

## Page-type: component

Checklist, all 13 points required for a page to count as done:

1. **Header** — breadcrumb category · component name · one-sentence purpose describing what it
   DOES (a verb-first sentence), not a restatement of its name.
2. **Badge row** — bundle size (computed via a real build step, e.g. esbuild --minify + gzip on
   the component's own export; never guessed) · source link · a11y status (derived from truth
   source ③: "Verified" only if a conformance/behavior test exists and passes, else "Unverified —
   no test," never a bare claim) · since-version (from the package's own version file/changelog).
3. **Import block** with copy affordance.
4. **Hero demo** — the single canonical real-world use. Live render + code toggle + copy, code
   generated from the exact same state driving the render (never a second hand-written string
   that can drift).
5. **Demo ladder** — MECHANICALLY DERIVED, never a fixed editorial list:

   ```
   sections = (enum props on the primary export, one per prop)
            ∪ (canonical state props found: disabled, invalid/error, loading, indeterminate,
               readOnly — whichever the component's own type actually declares)
            ∪ (composition patterns: with-label, controlled vs uncontrolled, inside a parent
               container the component is documented to compose with)
   ```

   Each section: 1-3 sentence intro + live demo + collapsible code.

   **Floor: `demo_count ≥ variant_count + 3`**, where `variant_count` = count of *dimensions*
   above (one per enum prop + one per canonical state prop present), not the sum of each enum's
   option count — summing options overcounts layout primitives (a component with a `gap`/`align`/
   `justify`/`wrap` prop each with 4-7 options is not a 20-dimension component, it's a 4-dimension
   one). Computed via a TS-aware parser (`react-docgen-typescript` for React — see
   `scripts/audit.mjs`), never regex-guessed against source text.

   A single-demo page for a component with `variant_count ≥ 1` is a FAIL, full stop.

6. **Usage** — when to use / when NOT to use / which sibling to prefer instead. MUST NOT
   byte-duplicate the header's one-sentence purpose (G-D2 checks this mechanically — hash both
   paragraphs, compare).
7. **Do/Dont** — ≥2 pairs, rendered as real markdown (a literal backtick character surviving into
   the HTML output is G-D3, an automatic FAIL regardless of content quality).
8. **Props table** — generated from TS types at build time (`react-docgen-typescript` or
   equivalent for the stack). A hand-typed table is FAIL (G-D5) even if its content happens to be
   correct today — it will drift the next time the prop type changes and nothing will catch it.
9. **Keyboard table** — generated from the conformance spec / behavioral tests. If no test
   exists for this component's keyboard behavior, the row reads "UNVERIFIED — no test," never
   an unbacked claim about what keys "should" do.
10. **Accessibility** — roles, SR behavior, focus behavior. Only claims a real test makes
    falsifiable; same honesty rule as point 9.
11. **Styling/CSS API** — public CSS custom properties table: name · default (read live from the
    token build output) · what it controls. Generated, not retyped (same drift risk as point 8).
12. **Related** — 3-4 sibling components + one-line "X vs Y" disambiguation for each (not just a
    bare link — the reader needs the actual reason to pick one over the other).
13. **Footer** — source/edit links, prev/next navigation.

## Page-type: foundation

One per token category (color, type, spacing, motion, icons, etc.):

- Live values only — read from the token build output at render time, never retyped into the
  page's own source. A foundation page with a hand-copied hex value is the same drift risk as an
  un-generated props table.
- Visual specimens: ramps, type waterfall, spacing bars, motion players — whatever the category
  needs to actually show the value, not just name it.
- Copy-per-token affordance.
- Usage rules (when this token vs. its siblings).
- ≥1 non-prose structure per page (the specimens above satisfy this by construction; a foundation
  page that's still pure prose despite this requirement is the same FAIL as G-D6 below).

## Page-type: overview and guides

Every overview/guide page (introduction, installation, theming, comparison, etc.) carries **≥1
non-prose structure**: a category card grid, a comparison table, a stepper, a version table —
something that isn't another paragraph. Concretely:

- Introduction → category card grid (derived from the real component category list the sidebar
  nav already uses, never a second hand-typed list).
- Installation → per-package cards + real copy-able install commands.
- Comparison page → a real `<table>`, not a bulleted prose comparison.

A wall-of-prose overview page — however well-written — is a FAIL (G-D6). This is exactly Dial's
original failure case before this skill existed: five overview pages, zero structures, on a repo
that already had the token/component data needed to build real ones.

## Density floor summary (for `docs audit`'s scoring pass)

| Check | Formula | Pass condition |
|---|---|---|
| Component demo floor | `demo_count ≥ variant_count + 3` | per component page |
| Overview structure floor | count of non-prose elements | `≥ 1` per overview/guide page |
| Foundation structure floor | count of live specimens | `≥ 1` per foundation page |
| Badge row completeness | 3 fields present and each backed by a real source | all 3, all pages |
| Props/keyboard/CSS tables | traceable to a generator call, not hand-typed | 100% of pages |

## Page-type: shell (the frame every page sits in)

Content density is worthless if the frame fails. Measured on Pane (2026-10-26): a 26-chapter book
passed every content floor while (a) on screens ≤860px the whole chapter list rendered above the
content, so choosing a chapter left the reader scrolling past the menu, and (b) two hero cards
touched with 0px between them because a `gap` sat on an element that was not flex/grid. Neither was
caught, because nothing checked the frame. Reference behaviour: MUI, Material, Apple developer docs.

Required, all of them:

1. **One chapter = one page.** A route per chapter. Choosing a chapter replaces the content area,
   scrolls to the top and moves focus to the page `<h1>` (`tabIndex={-1}`) — never "same long page,
   jump down".
2. **Narrow screens collapse the navigation.** Below the layout's largest two-column breakpoint the
   sidebar becomes a top bar with a Menu button (`aria-expanded`, `aria-controls`) that opens a
   drawer; Esc and the backdrop close it; focus goes in on open and back to the button on close;
   the content behind is `inert` while open. Content is the first thing under the top bar.
3. **Spacing is owned by containers.** Every container that spaces children is flex or grid with a
   token `gap`; components carry no outer margins.

Gates (run in a real browser against the built site, at 375 / 768 / 1280px):

| Gate | Pass condition |
|---|---|
| G-S1 chapter opens as a page | after choosing a chapter from the nav: `scrollY === 0`, the `<h1>` top is inside the first half of the viewport, and it has focus — at every width |
| G-S2 menu | narrow width: Menu opens the drawer, Esc closes it, focus returns to Menu |
| G-S3 spacing | no two surface cards on any page touch (<8px) or overlap, at phone and desktop width |
| G-S4 fails closed | every gate that iterates over elements fails when it finds none ("NO CARDS FOUND") — a selector that matches nothing must never pass |

G-S3 was first written with a hashed-class selector that matched nothing and passed vacuously; it
was caught only by gate-proofing (re-introducing the 0px bug and watching it stay green). Give
surfaces a stable hook (`data-<system>-card`) and keep G-S4.

Before calling docs done, also **look**: screenshot one component page and the overview at 375,
768 and 1280px and review them by eye. A metric is not a substitute for opening the page.

| G-S5 instant page | after choosing a chapter, with motion ON, every element in the viewport is at full opacity on the first painted frame. No staggered fade/rise on page content (measured on Pane: a 640ms + 70ms-stagger "reveal" left content at opacity 0 for ~1s after every switch, reported as "glass frames appear, then the content loads") |

## Prose gate (every page type)

Density and shell gates say nothing about how the words read. On Pane the first full book scored
48/100 on the Button chapter (human-tone sniff) with 346 pause dashes, 33 "X, not Y" scaffolds and
166 "Label:" lines across 34 pages, all written by the agent and all invisible to the other gates.

| Gate | Pass condition |
|---|---|
| G-P1 tone | the rendered prose of every page (headings, paragraphs, list items, table descriptions, generated JSDoc; inline code replaced by a placeholder) passes human-tone `lint.py` with zero hard violations. Append-only records (the decision log) are the only exclusion and must be named |
| G-P2 workflow | `tone_rules` loaded before drafting; existing prose sniffed and its score reported before rewriting; `compare_text` run after, and the delta reported rather than claimed |

Rewrite from the idea when a line fails. Swapping a dash for a period and keeping the rhythm leaves
fragments like "Disabled. Native attribute, with the reason in text", which pass the lint and still
read as machine output. Read the result aloud before calling it done.
