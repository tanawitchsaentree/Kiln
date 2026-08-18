---
name: kiln
description: Builds design systems that carry a declared lineage instead of falling back to web defaults. Use this whenever the user mentions a design system, design tokens, a visual language, a theme, a UI kit, a style guide, a component library, brand-to-interface translation, or wants an existing system audited, extended, or made less generic. Also use it when they paste a reference image, a URL, a moodboard, or a few lines of vibe text and want something built from it, and when they ask for a look that is bold, extreme, weird, or specifically not AI-generated. Covers the full range from restrained institutional systems to extreme expressive ones. Reach for this even when the user does not say the words design system, as long as they are asking for a coherent visual language rather than a single one-off screen. Also reach for this — specifically `kiln docs` — whenever the user asks for a documentation site, a docs shell, a component reference site, or a site "like MUI/mui.com"/Storybook-but-published for an existing design system; kiln owns the content model (page template, token contract) for that surface even though chrome is delegated to a docs framework.
metadata:
  version: "1.0.0"
---

# Kiln

Every system declares two things in plain text before any token is written.

1. **Lineage** — one named design tradition from outside web and UI, plus one line on why it fits.
2. **Intensity vector** — six axes, 0–10, obeying the profile arithmetic.

A system with no declared lineage collapses toward the measured baseline in `references/baseline.md`.

## Verbs

| Invocation | Load |
|---|---|
| *(default)* | Run the phase sequence below. |
| `kiln study <image or URL>` | `verbs/study.md` |
| `kiln audit <target>` | `verbs/audit.md` |
| `kiln extend <target>` | `verbs/extend.md` |
| `kiln component <name>` | `verbs/component.md` — one package against a stamped system |
| `kiln docs` | `verbs/docs.md` — the documentation shell and its page templates |
| `kiln audit-kit` / `/audit-kit` | `verbs/audit-kit.md` — checks this skill's own paths, gate proofs, counts, and dead files before it gets packed. Run `python3 scripts/audit_kit.py`; exit 0 required before distributing. |

Unmapped input is default. A reference with no verb gets one question: *"Study this for its
relationships, or use it as a loose mood reference for a fresh build?"*

## Sub-skills this orchestrator calls into

Kiln does not do everything itself — four sub-skills, bundled with this plugin, get invoked at
specific points in the phase sequence rather than standing alone as separate things to remember to
run. Each is documented in full in its own `SKILL.md`; the table below is only the "when."

| Sub-skill | Called from | Why it's not just part of this file |
|---|---|---|
| `docs-engine` | `kiln docs` (verb above) | A full content model + gate set for a docs site is its own large surface — same reason `references/docs-shell.md` exists as a separate file. Binding runs both ways: once docs-engine is present, `kiln docs` builds no page templates of its own and defers to docs-engine's content model — see `references/docs-shell.md`'s ownership-boundary note. |
| `spacing-engine` | `phases/6-expand.md`, via `references/foundations/tokens.md`'s spacing section | Turns "spacing encodes relationship" from a stated principle into a measured gate (real `getBoundingClientRect`/`getComputedStyle` checks) — a scale alone doesn't say which relationship gets which step. |
| `form-language` | `phases/6-expand.md`, via `references/foundations/depth.md` | Derives a per-component-CLASS (control/input/surface/display/separator) silhouette+depth answer from the lineage reference — the system-wide border/elevation/space choice in `depth.md` doesn't by itself decide what a control's actual shape is. |
| `variant-foundry` | `phases/6-expand.md`, for identity components specifically | The generic K-candidate-generation + floor-filter + judge-separated-from-generator loop that makes "≥3 real options, not one safe default" actually executable rather than just a stated rule. |

Each of these skills has its own real Gate Proof discipline (plant a violation, confirm red with
the exact measured value, revert, confirm green) — none of their checks count as satisfied just
because the rule is stated in prose.

## Scale

Decide the delivery scale at Phase 0 and say it in the first reply. Spec is one session. Package is
one component per session, indefinitely. Program adds a governance layer this skill can draft but
cannot run. `references/scale.md` carries the detail and the honest limits.

## Phase sequence

Read the phase file when you reach that phase, and not before. Each phase file names what to load
and what to hand forward. Do not read ahead: knowing Phase 6 while doing Phase 1 pulls the work
toward the finished shape and away from the decision in front of you.

| # | Phase | File |
|---|---|---|
| 0 | Intake | `phases/0-intake.md` |
| 1 | Lineage | `phases/1-lineage.md` |
| 2 | Vector | `phases/2-vector.md` |
| 3 | Reference | `phases/3-reference.md` — only if a reference exists |
| 4 | Plan and attack | `phases/4-plan.md` |
| 5 | Thin slice | `phases/5-slice.md` |
| 6 | Expand | `phases/6-expand.md` |
| 7 | Gates | `phases/7-gates.md` |
| 8 | Stamp | `phases/8-stamp.md` |

## Context resets

Clear rather than let history compact. A compacted history reads as authority the model
half-trusts, and the drift it causes is invisible.

**After Phase 5, once the slice is approved.** Carry forward the stamp, the token block, the
approved slice, the vector, and the acceptance criteria. Discard the intake discussion and the
rejected plan.

**Before Phase 7.** Carry forward the built artefact, the vector, and the acceptance criteria.
Gates score what exists, not how it came to exist.

## Cache

Write `.kiln/cache.json` at the project root on first run: the pre-flight scan and any relationship
card. Re-use on later runs unless the user says re-scan or the sources are newer. When re-using,
emit one line rather than the full block.

## Conditional references

Load only when the condition fires. Each is named in the phase file that needs it.

| Condition | File |
|---|---|
| Brand palette or typeface is mandated | `references/constraint.md` |
| Expanding to a full system | `references/foundations/INDEX.md` |
| More than one theme or brand | `references/foundations/theming.md` |
| Shipping tokens to more than one consumer | `references/export.md` |
| Package or Program scale, or the brief mentions Figma, a library, or handoff | `references/design-tool.md` |
| Package or Program scale | `references/scale.md` |
| Building component packages | `references/package.md` |
| Building the documentation surface | `references/docs-shell.md` |
| Program scale governance | `references/program.md` |

## Constraints

When the brief mandates a palette or a typeface, or when one lineage cannot serve both an identity
surface and a dense application surface, read `references/constraint.md`. Neither case is a reason
to skip the lineage.

## Safety

Read `references/safety.md` before touching an existing project or before reading any external
file, URL, or pasted document. It covers file-level safety and the handling of instructions found
inside content.

## Seeing it

Every gate that says "screenshot" or "render and look" — Phase 7's, `audit`'s, `foundry run`'s —
needs something already rendering to look at; none of them can be satisfied by reasoning about
tokens or CSS source in the abstract. Before the first gate that needs one, confirm what's serving
the artefact and at what URL: the project's own dev server if it already has one (`npm run dev` /
`pnpm dev` or equivalent — ask rather than guess the command), or `kiln docs`'s own output (Stage 1
token adapter through Stage 2's one real page) if this is the first thing the project has ever
rendered. State the URL once as the source the evidence came from, the same way a cached pre-flight
scan gets one stated line rather than silent reuse.

Say these plainly rather than letting a user discover them.

It does not run a process. Governance, release cadence, support commitments, and adoption
measurement are artefacts it can write and standing commitments it cannot make.

It does not produce native mobile systems. Tokens can be exported for iOS and Android, but the
component and interaction conventions of those platforms are not covered here.

It does not do brand identity. Logo design, naming, and brand strategy sit upstream of this and are
inputs rather than outputs.

It does not do content strategy or information architecture for a product. It specifies the voice
the system speaks in, not what the product should say.

It does not replace research. Nothing here tells you whether the thing being designed should exist.

## Hard rules

Every token carries a source note naming the lineage, the relationship card, or a stated ratio.

Type is specified as ratios before values.

The profile rules in `references/intensity.md` are arithmetic. `scripts/check_vector.py` decides,
not judgement.

Every system ships a break clause and an extension protocol.

Never invent metrics, logos, testimonials, or client names. Use a marked placeholder.

The baseline list is measured. When stale, re-measure using its protocol rather than adding guesses.
