# Verb — docs build

Full generation from a component library, for a repo with no docs site yet (or one being rebuilt
from scratch). If a docs site already exists, use `docs uplift` instead — `build` assumes a blank
slate and will not merge cleanly with hand-written pages.

## Steps

1. Run Phase 0 (`references/phase0.md`). If no docs framework is installed, this is the one
   place `build` makes a framework choice — prefer whatever the project's own stack conventions
   suggest (a Next.js monorepo → Fumadocs is the proven adapter in this skill today; other stacks
   need their own adapter written first, per `SKILL.md`'s Renderer Adapters section — do not
   silently reach for Fumadocs on a non-Next stack).
2. **Stage 1 — token adapter.** Before any page content: one file mapping the system's own
   semantic tokens onto the chosen framework's CSS variable namespace. Read the framework's real
   variable names from its installed package on disk, never from memory. Zero hardcoded values
   (G-D7 must be green before Stage 2 starts, not just by the end).
3. **Stage 2 — chrome.** Top navbar (product name + version, read from the package's own version
   field · search · GitHub/changelog link if a public remote exists, omitted honestly if not ·
   theme toggle with a real `aria-label`) + sidebar (generated from the component export barrel,
   never a second hand-typed list) + right ToC.
4. **Stage 3 — one real page, fully against the content model.** Pick one component with a
   non-trivial API (has ≥2 real variant dimensions). Build every one of the 13 checklist points
   for real, including the generated props/keyboard tables and the mechanically-derived demo
   ladder. This is the template-proving page — if a checklist point turns out unbuildable for a
   real component, fix `content-model.md`'s wording now, before it's copied 45 more times.
5. **Stage 4 — migrate/build two more pages,** deliberately including one component with a
   near-zero variant count (tests whether the template overfits to "components with lots of
   props") and one with real behavioral complexity (keyboard/focus — tests whether the keyboard
   table generation and a11y section actually have material to draw from).
6. **Stage 5 — the rest.** Same template, mechanically, for every remaining component + every
   foundation page + every overview/guide page. No design decisions mid-run per this repo's
   standing rule — anything the template doesn't cleanly answer goes to SPEC DEBT via
   `references/research-protocol.md`, not an ad hoc call.
7. **Stage 6 — gates.** Wire G-D1 through G-D8 into the build. Gate-Proof each per
   `references/gates.md` before treating any of them as blocking.
8. Report per the calling context's rules (this repo's docs-engine-upgrade order: two capped
   reports total for the whole run, not one per stage).
