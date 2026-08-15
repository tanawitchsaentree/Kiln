# Dial's OPEN parameters — one worked derivation

Every value below is either (a) an existing token Dial's real components already use for
that exact relationship class, confirmed by grep against `packages/react/src/components/*/
*.module.css`, or (b) a mapping of `spacing-control`'s own LOOSE-mode relationship ladder
onto Dial's real base-8 scale (never the reference's base-4 numbers directly — Dial's scale
doesn't have 4/12/48-as-a-primitive-step the same way; every Dial value below is a real
step in `packages/tokens/build/css/light.css`'s own `--ds-space-*` list).

**Why loose, not tight or medium:** D-001 (lineage) explicitly calls the reference mood
"spacious/comfortable" (few large controls, generous separation, from a hardware panel with
few components — the opposite of a dense dashboard). D-003 (base unit) says the same thing
independently: base-8 was chosen over base-4 specifically because base-4 "เหมาะ dense UI/
dashboard ที่ระบบนี้ยังไม่ระบุว่าต้องมี" (suits dense UI Dial doesn't need). Loose is not a
default guess — it's the mode the system's own locked decisions already point at.

| Relationship (tightest → loosest) | Dial token | Value | Evidence |
|---|---|---|---|
| Bound pair (icon↔label, e.g. Button's leftIcon↔children) | `--ds-space-inline-sm` | 8px | `Button.module.css:13`, real shipped gap |
| Stack gap inside a compound control (FormField's Label→control→HelperText) | `--ds-space-stack-sm` | 8px | `FormField.module.css:8`, real shipped gap |
| Fields/rows within one group | `--ds-space-stack-md` | 32px | Majority real usage (3 of 4 grepped call sites use `stack-md` for this class; `stack-lg` used once for a looser stand-alone section, kept distinct — see below) |
| Card / component inner padding | `--ds-space-inset-md` | 24px | `Card.module.css:71,79,83`, real shipped padding — matches `spacing-control`'s own LOOSE "card padding = 24" cell exactly |
| Component ↔ component (e.g. two Cards side by side) | `--ds-space-inline-lg` / `--ds-space-stack-lg` | 24px | Mapped from LOOSE's "component↔component" cell; this is the SAME token as card padding by value (24px) but a different semantic alias (`inline`/`stack` vs `inset`) — intentional: the reference's own LOOSE column has card-padding and component-gap both landing on the same numeral (24) at this specific density, not a Dial-specific coincidence |
| Sub-group ↔ sub-group | `--ds-space-stack-lg` | 48px→ nearest real step is `--ds-space-600` (48px) | Mapped from LOOSE's "sub-group↔sub-group = 2xl(48)" cell; Dial has no existing semantic alias at this exact step yet — logged as a real gap below, use the primitive `--ds-space-600` directly until a semantic alias is decided |
| Heading: space above / below | `--ds-space-stack-lg` (32px) / `--ds-space-stack-sm` (8px) | 32/8 | Mapped from LOOSE's "heading above/below = xl/md" cell onto Dial's real stack-lg/stack-sm aliases; above > below holds (32 > 8) |
| Section ↔ section | `--ds-space-700` (primitive, no semantic alias yet) | 64px | Mapped from LOOSE's "section↔section = 3xl(64)" cell |
| Page / frame margin | `--ds-space-inset-lg` | 32px, or `--ds-space-700` (64px) for a marketing/landing-style wide margin | Dial's real `inset-lg` (32px) is the content-page margin already in use (`Demo.tsx`'s preview padding); a landing/editorial page may reasonably use the wider `--ds-space-700` per LOOSE's own page-margin row — this is a per-zone choice, not a single fixed value, per the derivation protocol's "which mode per zone" allowance |
| Clearance token (L3 — content vs. any visible boundary) | `--ds-space-inline-lg` / `--ds-space-inset-lg` | 24-32px depending on axis | The stats-row fix (this order) used `--ds-space-inline-lg` (24px) for inline clearance around a vertical divider — adopted as Dial's standing clearance token for that axis; block-axis clearance (e.g. content vs. a horizontal rule) uses `--ds-space-inset-lg` (32px) to match the page-margin convention already established |

## Real gaps found during derivation (logged, not invented around)

1. **No semantic alias exists yet for the "sub-group↔sub-group" (48px) or "section↔section"
   (64px) relationship classes** — Dial's semantic layer (`space.inset.*`/`space.stack.*`/
   `space.inline.*`) stops at `lg` (32px for inset, up to 48px for stack via `stack-lg`), with
   nothing named for 64px. Component/docs code that needs this level today must reference
   the primitive `--ds-space-700` directly, which is exactly the kind of primitive-not-
   semantic reference D-001/D-006's iron rule normally forbids for component code — logged
   as a real token-architecture gap, not silently worked around with an invented alias name.
2. **`--ds-space-stack-lg` (32px) is used for two different relationship classes above**
   (fields/rows-within-a-group's occasional looser variant, AND heading-space-above) — this
   is consistent with `spacing-control`'s own worked example (a résumé's role-title `before`
   and its heading-before landing on the same token by coincidence of the ladder), not a
   modeling error, but worth flagging if Dial's semantic layer ever wants to split these into
   distinct named aliases for clarity.

## Locked as

This derivation should be locked via `/lock-decision` as a new `D-xxx` entry in
`system/DECISIONS.md` before being treated as binding — this file is the proposal, not the
lock itself (per this repo's own standing rule that structural decisions go through
`/lock-decision` only).
