# EVASION — form rows

Extends whatever EVASION/anti-attractor discipline a project already runs (this repo's own
`kiln/references/baseline.md` ban-list mechanism covers `type_stack`/`scale_ratio`/`base_unit`/
`primary_hue`/`radius`/`elevation_levels` — none of those fields capture a control's silhouette or
per-class depth treatment, which is the gap this table closes). Snapshot the date whenever this
table is consulted, since "the center" (the generic mass every unstyled system converges toward) is
itself model/era-specific, same as `baseline.md`'s own reasoning for why its ban list is measured,
not copied from folklore.

| Pattern | Verdict | Dodge |
|---|---|---|
| Flat rounded pill (or bare rectangle) button, N intent fills (primary/neutral/danger), no depth cue at all | **center** — unless the system's own FORM.md/decision trail names a specific, checked reason (see `references/decision-trail-audit.md`'s USER-CONFIRMED path) | Derive the button's silhouette + depth from `system/FORM.md`'s control-class row, not from "this is what every component library does" |
| Input as bordered rect, 8px radius, flat fill, focus = border-color change only | **center** | Derive from FORM.md's input-class row — check whether this lineage's reference treats a receiving field as recessed/inset rather than flat |
| Card as white/neutral rect + soft ambient shadow + 12-16px radius | **center** | Derive from FORM.md's surface-class row — most lineages that ALSO ban decorative shadow (D-008-style) will land on flat-fill + border here, which is a legitimate, checked answer, not automatically center just because it's common |
| Switch as an iOS-style pill track + circular thumb, no lineage-specific silhouette at all | **center** | Derive from FORM.md's control-class row — note that a toggle track being pill-shaped can be a legitimate physical-metaphor answer (a slide switch), not automatically an evasion failure; the check is whether it was DERIVED or copied unexamined |

## Snapshot date

2026-08-13 — table authored during the `form-language` order (Dial's Button/Input/Switch/Checkbox/
Card/Slider identity-component audit). Re-derive rather than copy verbatim into a future system;
"the center" is measured against this model/era, same caveat as `kiln/references/baseline.md`.

## Dodge, restated

Every dodge in this table reduces to the same move: open `system/FORM.md`, find the component's
class, read that class's silhouette/depth/corner/label/pressed-metaphor answer, build to it. Never
skip straight from "the reference has a nice color palette" to shipping the industry-default shape
with that palette painted on top — that is exactly the failure mode this skill exists to catch.
