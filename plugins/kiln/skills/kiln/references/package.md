# Package — anatomy of one component

Loaded at Package scale, and by `verbs/component.md` on every run. One component per clean context,
built against a stamp that already exists. Never against a stamp being invented in the same session
— if there is no stamp yet, this is Phase 6 of a fresh build, not `kiln component`.

## Before writing anything

Open the source of the closest existing component in the system. Its behaviour, its prop shape, and
its state coverage are a claim until you have actually read the file — a component described in
documentation and a component as it exists in code drift from each other constantly, and the code
is the one that ships.

Read the stamp for the lineage, the vector, and the token set. Read `references/api-conventions.md`
for the naming vocabulary already in use. A new component invents nothing that an existing one has
already named.

## Build order

1. **State the anatomy** — the named parts, matching whatever the documentation will call them.
   A part named `label` in the anatomy diagram is `label` in the API, not `text` or `caption`.
2. **State coverage** — default, hover, active, focus-visible, disabled, plus whichever of loading,
   error, read-only, indeterminate, and selected apply. State which do not apply and why, rather
   than leaving the gap silent.
3. **Tokens** — alias semantic tokens only. A new component introducing a new primitive or a raw
   value is the single most common way a system's token layer degrades. If the component genuinely
   needs a value nothing else does, it earns a component-tier token that aliases a semantic one —
   see `references/foundations/tokens.md`.
4. **Non-color cue** — every state that isn't conveyed by colour alone gets a second cue: shape,
   position, icon, motion, text. Checked by imagining the component in greyscale.
5. **Accessibility** — native element before ARIA. Keyboard map matches the authoring-practices
   pattern for that widget if one exists. Focus behaviour, live-region use, and label association
   stated per `references/foundations/a11y.md`.
6. **API** — props named from the shared vocabulary, controlled and uncontrolled where the component
   is stateful, seams (exposed CSS custom properties) listed explicitly.

## Consistency checks, run before handoff

Compare against the closest sibling component: same state names, same prop names for the same
concept, same seam-listing convention. Two components solving the same layout problem two different
ways is drift, and it is cheap to catch here and expensive to catch at component twenty-five.

Run `scripts/check_tokens.py` against any new token file the component introduces. A token with no
source note does not ship.

## What the component package contains

Source, its own documentation page built from the template in `references/docs-shell.md`, and its
states as installable variants if the project has a design-tool library per
`references/design-tool.md`. A component without its documentation page is not finished — the live
example block is not optional polish, it is the thing `docs-shell.md` states is hardest and most
load-bearing.

## When the component does not fit the system

Say so, name what would have to change at the system level to accommodate it, and stop rather than
bending the component quietly to fit. A component that needs a seventh state the state model doesn't
have, or a layout the grid can't express, is information about the system's limits, not a problem to
route around invisibly.
