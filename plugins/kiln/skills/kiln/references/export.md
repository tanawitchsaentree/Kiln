# Export

Token delivery formats. Load at Phase 8 when the system ships to more than one consumer.

One source of truth, many generated outputs. Hand-maintaining two formats guarantees they diverge,
and the divergence is discovered by a product team at the worst moment.

## Source of truth

DTCG JSON is the reasonable default. It is a published format, it carries type and description per
token, and generators exist for every target.

The source carries the source note from the contract in the `$description` field. That note is the
only thing preventing a future maintainer from changing a value without knowing why it was that
value.

```json
{
  "color": {
    "ink": {
      "$value": "oklch(22% 0.02 250)",
      "$type": "color",
      "$description": "lineage: line work is never pure black"
    }
  }
}
```

## Targets

CSS custom properties for anything web. Two files, primitives and semantics, since a theme swaps
only the first.

Tailwind theme block for Tailwind projects, mapping semantic tokens into the theme namespace rather
than into arbitrary utility names.

SCSS variables where a build already uses SCSS. Note that SCSS variables cannot be themed at
runtime, so a themed system exports SCSS for build-time values only and keeps runtime values in
custom properties.

shadcn-style CSS variables where the project uses that convention, which means mapping the system's
semantic names onto the expected variable names rather than renaming the system.

JSON for design tools, per `references/design-tool.md`.

Platform outputs for iOS and Android where the system is not web only. Names differ by platform
convention and the mapping is stated rather than transliterated.

## Rules

Generated files are never edited. Mark them at the top with a line saying so and naming the source.

The generator runs in the build, not by hand. A manual step is a step that gets skipped.

Version the token package independently of the components. Consumers upgrade tokens far more often
than they upgrade components.

A token removal is a breaking change. A token addition is not. State the deprecation path: mark it
deprecated, keep it working for one major version with the replacement named, then remove.

## What not to export

Do not export every primitive to every target. Products consuming semantic tokens should not be
able to reach a primitive, since the moment they can, they will, and theming stops working.
