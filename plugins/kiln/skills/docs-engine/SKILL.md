---
name: docs-engine
description: Generates, audits, or uplifts Bootstrap/MUI-grade documentation for ANY design-system/component-library repo — dense multi-demo component pages, generated props/keyboard tables, full-page example templates (dashboard/pricing/sign-in/etc.) composed from the library's own public API, an editorial-grade landing page and navbar, measured density and composition gates. Use whenever the user wants a docs site built for a design system, wants existing docs scored against a real content model, wants full-page usage examples (not just per-component demos), wants the docs site's own landing/navbar/typography raised to a polished editorial standard, or wants docs "fixed properly" rather than patched page by page. Four verbs: `docs build` (generate from scratch, includes examples+editorial), `docs audit` (score only, no edits, ranked punch list), `docs uplift` (audit → fix everything below floor → re-audit to prove the delta), `docs examples` (inventory-scan the library's public API against a template catalog, build every buildable full-page example, generate a thumbnail index). Reach for this instead of hand-writing or hand-ordering individual doc pages or example templates.
metadata:
  version: "2.0.0"
---

# Docs Engine

Docs are generated from a **measured content model**, not written page by page on request. A
component page with one demo and a duplicated paragraph is a bug this skill exists to make
structurally impossible — every floor below is a number computed from the component's own
source, never a target chosen by feel.

**Ownership boundary:** this skill owns the *content model* (what a page must contain, how dense
it must be, how truth is sourced) and the *gates* that prove it. It does not own chrome framework
choice (Fumadocs/Nextra/Astro/Docusaurus/VitePress — whichever the project already has stays) —
chrome is a thin renderer layer that consumes this skill's page content through one token
adapter, per `references/phase0.md`'s chrome contract.

**Relationship to `kiln`:** if `kiln` is also installed, `kiln docs` and `docs/DOCS-IA.md` defer
to this skill for the content model and gates — kiln keeps only its own lineage/token-adapter
concerns (`kiln/references/docs-shell.md`'s "Token contract" section). Do not maintain two
competing page templates in the same repo.

## Verbs

| Invocation | Does | Edits files? |
|---|---|---|
| `docs audit` | Runs Phase 0 + scores every page against `references/content-model.md`; emits a ranked punch list with computed numbers | No |
| `docs build` | Phase 0 → generate every page type from scratch against the content model, using `references/research-protocol.md` where source material is thin; includes the examples + editorial capabilities below | Yes |
| `docs uplift` | `docs audit` → fix everything the audit found below floor → re-run `docs audit` to prove the delta with before/after numbers | Yes |
| `docs examples` | Inventory-scans the library's public API against `references/template-catalog.md`, builds every BUILDABLE/BUILDABLE-WITH-GAPS template as a real full-page route, generates the thumbnail index | Yes |

All four run Phase 0 first (below) and are scored against the same content model — `uplift` is
not a different standard, just `audit` immediately followed by fixing; `examples` is a focused
sub-scope of `build` that can also run standalone against an existing docs site.

## Phase 0 — preflight (every verb, every repo)

Load `references/phase0.md`. Detect, with file:line evidence, before touching anything:
framework/docs stack, component inventory + truth-source ranking, existing docs surface, token/
theme mechanism. Cache the findings block; re-scan only when configs change. **Never skip this
because "it's the same repo as last time" — configs and component counts drift.**

## Content model

Load `references/content-model.md`. Defines the 13-point component-page checklist, the
foundation-page checklist, the overview/guide-page checklist, and the density floors — all
MEASURED (computed from the component's own TS types/tests at generation time), never
aspirational round numbers.

The floor that matters most: **`demo_count ≥ variant_count + 3`**, where `variant_count` is the
number of real enum/state prop *dimensions* on the component's primary export (one dimension per
enum prop or canonical state prop — e.g. Button's `variant`/`intent`/`size`/`loading` = 4
dimensions, floor 7), read via a TS-aware parser (`react-docgen-typescript` for a React repo — see
`scripts/audit.mjs`), never by counting union-member *options* (that overcounts layout primitives
like Flex into an absurd floor) and never hand-typed.

## Research protocol

Load `references/research-protocol.md` when a checklist item lacks material. Order: (1) component
source/types/stories/tests (2) documented canon of that component class, as a coverage *outline*
only, filled from this repo's real code (3) equivalents' docs for coverage comparison only, never
content (4) if all three fail, emit a SPEC DEBT entry naming exactly what's missing — never
invent. Every researched content block carries a provenance stamp.

## Examples (full-page templates)

Load `references/template-catalog.md` (the canonical catalog + inventory gate + CATALOG SIGNAL
convention) and `references/template-contract.md` (the 7-point per-template checklist: composition
floor, same-source rule, thumbnails, realistic content, skeleton diversity, page-level a11y). A
template composes MANY components into a real page a reader would ship — this is the gap between
"component reference" (dense per-component pages, the v1 content model) and "usage examples"
(Bootstrap/MUI ship both). Never build a template by reaching into the library's internal `src/`
— a template that needs internal access is itself a finding (missing public capability), logged
as CATALOG SIGNAL, not worked around silently.

## Editorial

Load `references/editorial.md` for the landing page / navbar depth / typographic rhythm / taste-
pass checklist — the second half of the Bootstrap-grade gap. A docs site can have dense component
pages and full-page examples and still read as an unstyled dump if its own landing page and navbar
never got the same design attention as the components it documents. Every number shown on the
landing page (component count, demo count, a11y-verified count) is computed at generation time,
never hand-typed; every external link is gated by a `docs.repoUrl`-style config key, never a dead
href.

## Gates

Load `references/gates.md` for G-D1 through G-D8 (density/truth) and G-T1 through G-T5 (examples:
composition floor, same-source, inventory honesty, thumbnail freshness, page health) — exact
definitions and how to Gate-Proof each one (plant a violation, confirm it goes red, revert — a
gate that has never been red does not exist, per this repo's own standing Gate Proof Rule).
`scripts/audit.mjs` computes G-D1/G-D2/G-D6 today; G-D3/G-D4/G-D5/G-D7/G-D8 and all of G-T1-G-T5
need a build+crawl step (documented in `gates.md`, not yet scripted for every case — name gaps
rather than claiming automated coverage that doesn't exist).

## Renderer adapters

`references/phase0.md`'s chrome contract is framework-agnostic in principle (one token adapter
file, semantic name wins on collision). The *implementation* in this skill today is proven only
against Fumadocs (`apps/docs` in this repo). A Nextra/Astro/Docusaurus/VitePress adapter is a real
extension point, not yet built — do not claim this skill works turnkey on those stacks until one
has actually been run against a repo using them.

## Reports

Exactly two per run, per the calling order's own rule if one is active, otherwise as a sane
default: one after Phase 0 + audit (ranked punch list, ≤15 lines + screenshots), one after the
full run (before/after numbers, gate status, screenshots). No cheerleading, no summary beyond the
computed numbers.
