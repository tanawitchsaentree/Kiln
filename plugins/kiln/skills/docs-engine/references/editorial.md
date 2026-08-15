# Editorial pass — raising the whole site surface, not just component pages

This closes the second half of the Bootstrap-grade gap: even a docs site with dense, complete
component pages can still read as a plain, unstyled "docs dump" if the site's own landing page,
navbar, and typographic rhythm were never given the same design attention as the components it
documents. Four checks, run once per site, not per page.

## 1. Landing page

The docs site's own root route (often distinct from an "Introduction" content page — check both
exist and don't duplicate each other's job) needs:

- **Hero** stating what the system IS, pulled from the project's own real positioning language
  (e.g. a locked decision log's lineage/rationale entry) — never marketing copy invented for the
  occasion. If the project already has this exact line on an Introduction page, reuse it verbatim
  rather than writing a second version that can drift from the first.
- **Computed stats row** — component count, demo count, a11y-verified count (or whatever the
  project's own real, derivable numbers are) — every number here must be computed at generation
  time from a real source (barrel export count, audit script output, conformance spec coverage),
  never hand-typed. A stats row with a stale hand-typed number is worse than no stats row.
- **Category card grid** — reuse whatever component-category card grid mechanism already exists
  (built once, per docs-engine v1's G-D6 fix) rather than building a second one.
- **Template showcase strip** — links to the example templates (see `template-catalog.md`), with
  their generated thumbnails, if any templates exist yet.
- **Install command** with copy affordance — reuse the real install command already documented
  elsewhere (an Installation page) rather than retyping it a second time.

## 2. Navbar depth

- **Version badge** — read from the package's own version field at build time (already covered
  by docs-engine v1's chrome work list if that ran first).
- **External links driven by config, never hardcoded** — a `docs.repoUrl` (or equivalently-named)
  config key controls whether a GitHub/repo link renders at all. If the key is absent or the repo
  genuinely has no public remote yet, the navbar renders a locally-appropriate alternative (e.g.
  nothing, or a "no public repo yet" note if the project's own docs already state that fact
  elsewhere) — never a dead link pointing at a URL that doesn't resolve.
- **Changelog page**, if the project has a real `CHANGELOG.md` to generate it from. If no such
  file exists, this is a SPEC DEBT entry (missing truth source), not an invented changelog.

## 3. Typographic rhythm pass

Run once across the whole site, not per page:

- Heading scale steps used in chrome/prose match the project's own real type-scale tokens — never
  a hardcoded font-size that happens to look right (this reuses G-D7's "no hardcoded chrome
  values" logic, extended to typography specifically).
- Prose measure (characters per line) sits in the 60-80ch range for body/article-style content —
  wider lines hurt readability regardless of how correct the type scale itself is.
- Section spacing (the gap between major page sections — hero to stats row, stats row to card
  grid, etc.) comes from the project's own real spacing tokens, checked the same way G-D7 checks
  color — a lint pass grepping for a raw px value in chrome/landing styles where a spacing token
  should be used instead.
- No orphan heading (an H2 with no visible content below it) at the bottom of a standard viewport
  height — checked live via a real viewport-height screenshot/scroll check, not eyeballed once at
  one arbitrary window size.

## 4. Taste/kiln advisory pass

If the project has a taste/kiln-style gate set available (this repo's own `kiln` skill, or
equivalent), run its advisory attractor check specifically against the landing page and templates
index: does the landing page's structure actually derive from the system's own declared lineage,
or has it converged toward the generic hero-plus-three-cards shape every unstyled docs template
defaults to regardless of the system underneath it? This check is advisory (per that gate set's
own Gate Proof status), not a blocking gate on its own — but it's the check that catches "technically
has a hero, stats, and cards" while still looking like nothing in particular.
