# Phase 0 — preflight (any repo)

Run this before `docs audit`, `docs build`, or `docs uplift` touches anything. Emit a findings
block with file:line citations for every line below. Cache it in the run's own report; re-scan
only when package.json/tsconfig/framework configs change — not on every invocation.

## 1. Framework and docs stack

Detect which of these (or none) is already installed, from the docs app's own `package.json`,
never assumed:

- Next.js + Fumadocs (`fumadocs-ui`/`fumadocs-core`/`fumadocs-mdx`)
- Nextra
- Astro + Starlight
- Docusaurus
- VitePress
- None — no docs app exists yet (only relevant for `docs build`)

The content model (`content-model.md`) is renderer-independent. Only the thin adapter layer
(nav-tree wiring, MDX component registration, the token-to-CSS-variable mapping) is
framework-specific — write it once per stack, never re-derive the content model per framework.

## 2. Component inventory

- Source directory (e.g. `packages/react/src/components/*`) — one directory per component,
  confirmed by listing it, not guessed from a README.
- Export barrel (e.g. `src/index.ts`) — cross-check that every source directory is actually
  reachable through the public API; a component with source but no barrel export is not part of
  the public inventory and gets a docs page only if the project explicitly wants internal-only
  components documented (rare — confirm before assuming).
- TS types — every component's own prop types file or inline interface; this is truth-source
  rank ①, read directly, never paraphrased from memory of "what a Button usually has."

## 3. Truth sources, ranked

In order of trust, each with a real count from this repo (not assumed to exist):

1. **Component source + TS types** — always rank 1. If a claim can be derived from what the code
   actually accepts/returns, that's the source, full stop.
2. **Stories** (Storybook `.stories.tsx` or equivalent) — a real rendered example, but often just
   one canonical case, not a variant catalog. Count them; don't assume story count implies
   coverage.
3. **Tests / conformance specs** — the only source that can back a *behavioral* claim (keyboard
   handling, focus management, ARIA state). A claim with no test backing it gets "UNVERIFIED — no
   test" in the output, never an invented "yes it does this."
4. **Token build output** (e.g. `packages/tokens/build/{css,json}/*`) — the only valid source for
   foundation-page live values. Never hand-copy a resolved value into a page's own source.
5. **DECISIONS / spec docs** — prose intent, useful for "why," lowest rank for "what" because it
   drifts from the code fastest.

Count each source's real coverage (e.g. "14/46 components have a conformance spec") — this number
drives the a11y-status badge and the keyboard-table honesty check later; never claim full
coverage without counting.

## 4. Existing docs surface + density

If a docs app already exists: list every page, and for component pages specifically, run the
demo-floor computation (`content-model.md` / `scripts/audit.mjs`) to get today's real score before
proposing any change. This is what makes `docs uplift`'s "before/after" report honest instead of
vibes.

## 5. Design tokens + theme mechanism (chrome adapter)

- Locate the token build output (light/dark/high-contrast, whatever modes exist).
- Locate or confirm the absence of a chrome token adapter (one file mapping the system's own
  semantic token names onto the docs framework's CSS variable namespace — e.g.
  `apps/docs/src/lib/fumadocsTokenAdapter.tsx` in this repo).
- If no adapter exists yet (`docs build` on a fresh repo): building one is Stage 1, always,
  before any page content — chrome must consume real tokens from day one, not get retrofitted
  after pages exist with hardcoded values.
- If an adapter exists: grep it and the chrome's own stylesheet for hardcoded hex/px values —
  zero tolerance (G-D7). Report the exact count found, even if zero.

## Output

A findings block, file:line cited, covering all five sections above. This is the only input the
rest of the skill's verbs consume — no verb re-derives Phase 0 facts from scratch mid-run.
