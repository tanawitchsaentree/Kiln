# Template contract — what every example template page must have

All seven points required for a template to count as done. This is the content-model.md of the
examples capability — same discipline (measured floors, generated not hand-typed, honesty over
invention), applied to full-page compositions instead of single-component pages.

1. **A real full-page route** in the docs site (e.g. `/examples/dashboard`), rendered live with
   the library's own real components and real tokens — verified in both light and dark theme, and
   at every breakpoint the project's own responsive floor requires (reuse G-D8's viewport set:
   360/768/1180/1440).

2. **Composition floor: ≥8 distinct components spanning ≥3 categories** (layout + forms/atoms +
   overlay/data, using whatever category taxonomy the repo's own sidebar nav already uses — never
   invent a second one). A hero with two buttons is not a template — this floor exists specifically
   to keep "example" meaning "a real composed page," not "a slightly bigger demo." Computed by
   counting distinct component imports in the template's own source file, cross-checked against
   the sidebar's category assignment for each — not hand-counted or eyeballed.

3. **Complete source view** — same-source rule: the code displayed to the reader IS the actual
   module that renders the page, extracted at build time (e.g. read the `.tsx` file's own source
   text, not a hand-copied second string) — never a hand-maintained twin that can drift from what
   actually runs. Plus a copy button and a full-file download affordance, since a template's
   source is long enough that copy-paste-from-a-panel is the realistic usage pattern.

4. **An index page listing all templates with real thumbnails** — generated screenshots taken at
   build time against the actual rendered page, never a placeholder image or a hand-drawn mockup.
   A thumbnail that doesn't match the current render (stale) is worse than no thumbnail — see
   G-T4.

5. **Realistic content** — plausible domain data (real-sounding product names, dates, numbers —
   never "Lorem ipsum" or "foo/bar/baz" placeholder text, since a reader evaluating whether a
   template fits their use case needs to see it under realistic content weight). Honest-copy rule:
   no invented testimonials, no fake metrics, no fabricated social proof inside the template's own
   content — a pricing template can show plausible plan names and prices, but not a fake "10,000+
   customers" counter that implies a real business fact.

6. **Distinct macrostructure per template** — no two templates in the same catalog run share the
   same page skeleton (see `template-catalog.md`'s Skeleton diversity section). Log the assigned
   skeleton name in the template's own header comment so it's traceable, not just decided once and
   forgotten.

7. **Passes the full page gate set** — G-D8 (layout/console/contrast, both themes, all
   breakpoints) plus a keyboard walk: every interactive element on the page must be reachable via
   Tab in a sane order (matching visual/logical reading order, no unreachable dead controls, no
   focus trap the reader can't escape) — verified live (e.g. via Playwright's keyboard API
   pressing Tab repeatedly and asserting each focused element is a real, visible, interactive
   control), never assumed from the component-level a11y claims alone. A template composing
   several individually-accessible components can still produce an inaccessible PAGE (wrong tab
   order, a focus trap between two overlays) — this point exists because page-level a11y is not
   guaranteed by component-level a11y.
