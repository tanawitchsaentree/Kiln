---
name: form-language
description: Derives a per-component-class form language (silhouette, depth treatment, corner logic, label placement, pressed metaphor) from a system's lineage, between Phase 1 (Foundations) and Phase 2 (Tokens). Use when a system's palette/spacing/type are locked but no decision states what a control's SHAPE and DEPTH should be — the Anatomy Contract covers behavior/API/states, never form, so nothing else in the pipeline asks this question. Also use to audit a shipped system for palette-survived-form-died drift.
---

# Form Language

## Why this exists

A lineage extraction (D-001-style) reliably captures palette, type mood, and shadow policy from a
reference — those are the properties that show up as hex values and boolean rules, easy to write
down. It does **not** reliably capture the reference's actual object shapes, because "what does a
control look like as a physical thing" isn't a token category any existing pipeline step asks
about. The Anatomy Contract (`ds-conventions/SKILL.md`, `docs/BLUEPRINT.md` §6) governs behavior,
variants, sizes, states, tokens, a11y, API, stories, docs — nine points, zero of them about form.
The result, if this step is skipped: a system can lock "no decorative shadow" (a real, checkable
rule) and quietly let every component converge on the generic flat-pill-plus-fill attractor,
because nothing after Phase 1 ever asked "but what SHAPE is this, physically."

This is not a claim that the resulting flatness is automatically wrong — see the
`references/decision-trail-audit.md` template below; a checked, cost-verified, deliberate
no-shadow rule (confirmed via a real audit, not assumed) is a legitimate choice, not a bug by
itself. What's always a bug is skipping the question — building a system that never separately
decided its silhouette vocabulary, whichever answer that vocabulary turns out to be.

## Laws vs parameters (same IRON/OPEN split as spacing-engine)

- **IRON (this skill's own logic, invariant across every system):** every component belongs to
  exactly one of five classes (control/input/surface/display/separator); each class needs an
  explicit silhouette + depth + corner + label-placement + pressed-metaphor answer; every class
  gets 2-3 NEVER rules; identity components get a mandatory eyes-on multi-candidate lab round
  before shipping, never a single "safe default" rendered alone.
- **OPEN (derived per system, locked as D-xxx, never copied from another system's FORM.md):** which
  silhouette, which depth token, which corner radius, which physical metaphor — all of it comes
  from THIS system's own lineage reference, read for form specifically, not palette. Two systems
  sharing a Braun-hardware lineage could legitimately land on different form answers if their
  actual reference photos show different control shapes.

## Derivation protocol

1. **Read the lineage's reference image/description again, specifically for form** — ignore color
   and type entirely this pass. What is each control class's real-world silhouette? Is it raised,
   recessed, or flat? Where does a label sit relative to the control?
2. **Map the five classes** (control/input/surface/display/separator) against the catalog's real
   component list — every component gets exactly one class, logged plainly if a component is
   ambiguous (state the ambiguity, pick one, don't silently drop it).
3. **Write FORM.md in geometry + tokens, not adjectives** — "raised, shadow.raised.sm, pressed =
   inset + fill one stop darker" not "feels tactile and premium." A future engineer must be able to
   build from this without re-reading the reference image.
4. **Cross-check against what's already locked** — a class's depth treatment cannot contradict an
   absolute rule already in `system/DECISIONS.md` (e.g. Dial's D-008 "no decorative shadow") unless
   this derivation demonstrates the existing rule was about DECORATIVE shadow specifically and a
   class genuinely needs a FUNCTIONAL depth cue — state that distinction explicitly if it applies,
   don't quietly reinterpret the old rule.
5. **Name every real gap** — a token that doesn't exist yet, an API surface the current components
   lack, anything the derivation exposes as missing. Log it, don't invent around it.
6. **Lock via `/lock-decision`** once the user confirms the FORM.md reading is a fair one — this is
   a narrower, separate confirmation from the multi-candidate lab pick below (this step confirms
   "this is what the reference says," the lab pick confirms "we're shipping this").

## Verbs

| Verb | What it does |
|---|---|
| `form derive` | Run the derivation protocol above, produce/update `system/FORM.md` |
| `form audit` | Reconstruct a system's decision trail for how its current form language came to be — see `references/decision-trail-audit.md`'s template. Read-only, no code changes. Distinguishes USER-CONFIRMED (a real render/decision on file) from DRIFT (a rule silently reinterpreted) from FACTUALLY-UNFOUNDED (the audit's own premise doesn't match the record — report this plainly rather than forcing the alleged drift narrative to fit) |
| `form goal <component>` | Extract the 1-3 sentence FORM GOAL for one component from FORM.md's class table, for use in `new-component`'s Propose-API step |

## Gates

See `references/gates.md` for G-F1 (recipe markers), G-F2 (form-goal presence), G-F3
(identity-component lock). All three are measured proxies for a check that is fundamentally
eyes-on — G-F3 is what makes the eyes-on lab round unskippable, not a substitute for it.

## Pipeline wiring

- **`foundation` agent**, ลำดับที่ 2 (Foundation scales), between item 6 (Radius/shadow/border) and
  item 7 (Motion) — insert a new item **6.5: Form language** that runs this skill's derivation
  protocol once foundations are locked, before token-architect starts Phase 2.
- **`new-component` skill**, step 2 (Propose API) — before component-engineer proposes props, run
  `form goal <component>` and carry the result into the proposal. The component spec gains a
  mandatory **FORM GOAL** section (1-3 sentences, derived from FORM.md, not invented per-component).
- **`ds-conventions`'s Anatomy Contract / QA checklist** — add "matches FORM GOAL" as a named check
  alongside the existing 9 points, with the markers G-F1 checks for (see `references/gates.md`).
- **`kiln/references/baseline.md`'s measured fields** — the ban-list protocol currently measures
  `radius` and `elevation_levels` but has no field for control silhouette or per-class depth
  treatment; a future baseline re-measure should add `control_silhouette` and
  `depth_treatment_by_class` as fields, since this skill's own audit found that gap real.

## Multi-candidate lab rounds (identity components only)

Button, Input, Switch, Checkbox, Card, Slider — the components that carry a system's face — never
get a single form proposal. Render **at least 3 genuinely different candidates** in `apps/lab/` on
the same scene, sourced from real, distinct positions (not three cosmetic variations of one idea):
one honoring the system's current shipped form, one applying this skill's FORM.md derivation
faithfully, and one taking a harder/more literal read of the same lineage. The user picks with eyes;
`/lock-decision` attaches the winning candidate's screenshot path. Presenting one "safe default"
candidate alone for an identity component is a process violation this skill exists to name — see
G-F3.

## EVASION — form-specific rows

Extends this repo's own EVASION discipline (see `references/evasion-form.md` for the full table)
with the single biggest generic-AI attractor that existing checks (fonts, palettes, motion,
backgrounds) never covered: the flat-rounded-pill-with-N-intent-fills button, the bordered-rect-
8px-radius input, the white-rect-soft-shadow-12-16px-radius card, the iOS-clone switch. Dodge =
derive silhouette/depth from FORM.md, never from instinct or "what every other library does."
