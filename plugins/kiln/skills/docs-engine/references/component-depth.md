# Component depth — the Carbon bar (content model v3)

`content-model.md` decides that a component page exists and is wired to real sources. This file
decides how much it has to *say*. It was written after a user put Carbon's Button usage tab next
to a kiln page (2026-10-27): Carbon covers variants with purposes, numbered anatomy per variant,
seven sizes with use cases, emphasis, alignment, button groups with recommended and forbidden
combinations, label content rules, RTL, overflow, universal behaviours, loading, a deep dive per
variant with in-context examples, modifiers, related and research references. The kiln page had a
hero, a ladder, a do/don't list and tables. Both pass `content-model.md`. Only one is a reference.

A system kiln builds is not done until its component pages clear this file. The pilot exception
does not exist: "pilot" changes how many components are in the wave, never how deep each one goes.

## Shape: four tabs, each its own route

Every component has `/components/<slug>/usage`, `/style`, `/code`, `/accessibility` (Carbon,
Spectrum, Atlassian, Primer all split this way). `/components/<slug>` redirects to `usage`. The
header above the tabs is shared: name · status (links to criteria) · last updated (from the
changelog) · one-sentence purpose · **live demo with a theme selector and a variant selector**
generated from the component's enum props (G-K1).

## Usage tab — section registry

Each section is REQUIRED unless the page renders a visible "Not applicable" line with the reason
(e.g. "Badge has one size, so there is no size guidance"). Silent omission is a FAIL (G-K2).

| # | Section | Must contain | Derived from |
|---|---|---|---|
| U1 | Live demo | theme × variant selectors, code of the current state with copy | enum props (meta) |
| U2 | Overview | what it is, what job it does in a screen, ≥2 paragraphs | written |
| U3 | When to use / when not | each "not" names the sibling to use instead, linked | written + catalog |
| U4 | Variants | table: one row **per option** of every kind-enum (variant/intent/tone/kind) with purpose and pairing rule | rows = options in meta (G-K3) |
| U5 | Anatomy | numbered callouts drawn over the live component (parts marked `data-part`), legend per variant whose parts differ | DOM parts |
| U6 | Sizes | table: one row per size option, use case, what it pairs with (field heights, body size) | rows = size options (G-K3) |
| U7 | Emphasis and hierarchy | the rule for how many high-emphasis instances per surface, live do/don't pair | written + live |
| U8 | Placement and alignment | table placement → use case; live in-context examples | written + live |
| U9 | Combinations | recommended combinations table and combinations to avoid, each avoid case rendered live | written + live |
| U10 | Content | label formula, case, live do/don't; **overflow** (live long label: wrap vs truncate); **RTL** (live, `dir="rtl"`); text expansion (+30% label) | written + live (G-K8) |
| U11 | Behaviours | states table (every state the component has), mouse/keyboard/touch interactions, loading and feedback, default focus | states from CSS + tests |
| U12 | Per-variant deep dive | for **each** variant option: purpose, an in-context example inside a realistic surface, best practices, ≥1 live do/don't pair | one block per option (G-K4) |
| U13 | Modifiers | each optional slot or boolean (icon, icon-only, full width, …): rules + live do/don't | optional props in meta |
| U14 | Related, references, feedback | siblings with the reason to switch · **≥2 external references** with URL (research, standards, other systems' rationale) · edit / feedback link | written (G-K7) |

Do/don't pairs are **rendered components**, never screenshots and never prose-only bullets.

## Style tab — generated, not typed

| # | Section | Source |
|---|---|---|
| S1 | Colour per state per theme: background, text, border, icon for default/hover/active/focus/disabled(/selected/loading) | computed style of the live component in each forced state, reverse-mapped to the token name (G-K5) |
| S2 | Typography per size | computed font-size/weight/line-height → token names |
| S3 | Structure and spacing redlines per size: height, padding, gap, icon size, radius, min width | measured from the DOM, drawn as a redline diagram |
| S4 | Motion per transition | token durations/easing read from the CSS |
| S5 | Backdrops (G-B1) | 2 themes × dark/bright scene |

Changing a token must change the Style tab with no edit to the page (G-K5 proves it by mutation).

## Code tab

Import + install · props (generated, with deprecation flags) · demo ladder (`content-model.md` floor)
· CSS API (generated) · recipes (controlled, inside a form, as a link with router, with async
action) · sandbox link once packages are published.

## Accessibility tab

What the system provides (each item backed by a test) · design recommendations · development
considerations, written as a checklist the app team owns · keyboard (verified) · screen reader
announcements (what is spoken, per state) · how it is tested, with the component's matrix row.

## Depth benchmark (G-K6)

**Scope:** benchmarks measure how much a page explains, never what a component looks like. Copying a
benchmark's anatomy (Carbon's stripe-and-icon notification, its button set) imports its look; form
comes from the system's own derivation (kiln `references/derivation.md`).


`benchmarks/carbon-depth.json` holds measured word counts and section counts of Carbon's usage tab
for every component Carbon also has (fetched by `scripts/benchmark-depth.mjs`, dated). The audit
reports each page's usage words and sections against it, and FAILS a page below **0.5 × the
benchmark** for the same component. Components with no benchmark fall back to the section registry
alone. The ratio is a floor against thinness, not a target; padding prose to clear it is caught by
the prose gate and by G-K2's "must contain" column.

## Site breadth (G-IA1)

The nav shows the whole planned catalog, not only what exists: built components link, planned ones
show as "Planned · wave N" from `docs/CATALOG.md` so the gap is visible. Required top-level parts:
Getting started (designing, developing, contributing, migrating) · Foundations (grid, accessibility,
colour, content, icons, motion, spacing, themes, typography) · Components · Patterns (common
actions, dialogs, disabled states, empty states, filtering, forms, loading, notifications, overflow
content, read-only states, search, status indicators) · Data visualisation when the catalog has
charts. Each pattern page follows the same registry idea: problem, anatomy of the solution, live
composed example, variations, do/don't, related components.

## Gates

| Gate | Pass condition |
|---|---|
| G-K1 tabs | four tab routes per component, shared header with status, last updated, live demo with theme and variant selectors |
| G-K2 registry | every U-section present, or a visible "Not applicable" with a reason |
| G-K3 enumerations | variants table rows = kind-enum options, sizes table rows = size options (from meta) |
| G-K4 per-variant | one deep-dive block per variant option, each with a live in-context example and a live do/don't pair |
| G-K5 generated style | Style tab values come from computed style; mutating a token changes them |
| G-K6 depth | usage words and sections ≥ 0.5 × Carbon benchmark where one exists (always reported) |
| G-K7 references | ≥2 external references with working URLs per component |
| G-K8 content demos | live RTL render and live overflow render present and not clipped |
| G-IA1 breadth | nav lists the full catalog with planned items marked; required top-level parts present |
