# Theming and modes

Four independent dimensions. Treating them as one produces a combinatorial mess.

**Mode.** Light, dark, and any others. Values change, structure does not.
**Brand.** Which identity is applied. Colour and type change, semantics do not.
**Density.** Compact, default, spacious. Spacing and sizing change, colour does not.
**Contrast.** Standard and high. A user preference, not a design choice.

Decide at token time which dimensions the system supports. Adding one later means revisiting every
token.

## How a theme is applied

A theme sets tier 2 semantic tokens. It never touches tier 1 and never touches a component.

Applied at a container rather than at the root, so a region can differ from the page. A dark panel
inside a light page is a common real requirement and a root-only theme cannot serve it.

```css
[data-theme="dark"] { --color-surface-default: var(--grey-900); }
[data-density="compact"] { --space-inset: var(--space-2); }
```

Components read semantic tokens and therefore need no knowledge of any theme. A component with a
`.dark` variant class has failed this test.

## Mode

Dark is not an inversion. Lightness relationships are not symmetrical: shadows stop working, pure
white text at large sizes is uncomfortable, and saturated colours need lower chroma at low lightness
to avoid vibrating.

Specify each mode's values deliberately rather than computing one from the other. Check contrast in
every mode separately.

Respect `prefers-color-scheme` on first visit, then let an explicit choice override it, then
remember the choice.

## Density

Density changes spacing and control height. It does not change type size, because shrinking type is
an accessibility decision disguised as a density one.

Two or three levels, not five. Each level must be tested with real content, since compact modes
break on long strings first.

## Contrast

High contrast is a user need, not a brand variant. Honour `prefers-contrast` and forced-colours
mode, and test in both. Systems with a strong visual identity fail here most often, because the
identity depends on values that high contrast overrides.

## Multi-brand

If the system serves more than one brand, the semantic layer is shared and only the primitive
anchors differ. When two brands need different semantic names, they are two systems with a shared
vocabulary rather than one system with two themes, and saying so early saves a rewrite.

State which parts are brand-locked and which are free. Usually the accent and the display face are
locked and everything else is shared.
