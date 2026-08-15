# API conventions

How forty components stay recognisable as one system. Load at Package scale, before the second
component.

Decide these once and write them down. Every one of them will otherwise be decided differently by
whoever builds component seventeen.

## Naming

One vocabulary across the system. If the prop is `variant` on one component, it is `variant`
everywhere, never `kind`, `type`, `appearance`, or `style`.

The common set, and pick your names once: `variant` for visual treatment, `size` for scale,
`disabled`, `loading`, `error`, `required`, `readonly`. Boolean props read as adjectives and default
to false, so `disabled` rather than `enabled`.

Event names use one tense. `onChange` and `onOpen` throughout, or the past tense throughout, never
mixed.

Slot and part names match the anatomy diagram in the documentation exactly. A part called `label` in
the docs is `label` in the API.

## Values

Enumerated values, not free strings. A `size` prop taking any string means every consumer invents
their own.

Use the same enum vocabulary across components. If sizes are `sm`, `md`, `lg` on one, they are not
`small`, `medium`, `large` on another.

Every prop has a documented default, and the default is the most common case rather than the most
neutral one.

## Composition over configuration

A component with fifteen props is usually two components, or one component with slots.

Prefer slots for content and props for behaviour. A `title` prop becomes a limitation the moment
someone needs a title with a link in it.

State the nesting rules. Which components may contain which, and the depth limit if there is one.

## Seams

Every component states which CSS custom properties it exposes for consumers to override. That list
is the contract; anything else is internal and may change in a patch release.

An unexposed internal that consumers override anyway is a gap in the seam list rather than a misuse.
Add it deliberately or provide the capability properly.

## Controlled and uncontrolled

Decide the pattern once and apply it to every stateful component. Mixed patterns across a library
are a constant source of bugs in consuming code.

## Framework boundaries

If the system ships more than one binding, the API is the same across them where the platform
allows, and the differences are documented in one place rather than discovered.

## Reviewing

These conventions are what a reviewer rejects work over, so publish them in the contribution guide
rather than holding them as taste.
