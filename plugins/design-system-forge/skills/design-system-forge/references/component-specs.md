# Component Specs — roster, states, anatomy

## The state matrix

Every interactive component ships **all** of these. A component missing any of them is not done.

| State | Required for | Failure if skipped |
|-------|-------------|--------------------|
| `default` | all | — |
| `hover` | all pointer-interactive | feels dead |
| `active` / pressed | all clickable | no tactile confirmation |
| `focus-visible` | all focusable | **keyboard users are locked out** |
| `disabled` | all inputs/actions | unclear why nothing happens |
| `loading` | anything triggering async work | double-submits, perceived hang |
| `error` | anything accepting input | user can't recover |
| `read-only` | text inputs (where applicable) | confused with disabled |
| `indeterminate` | checkbox, progress | can't express partial selection |

Plus the two axes: **size** (sm / md / lg) and **variant** (primary / secondary / ghost / danger…).

### The three rules people break

1. **`focus-visible`, not `focus`.** Use `:focus-visible` so mice don't trigger rings but keyboards always do. Never `outline: none` without an equally visible replacement.
2. **`disabled` still needs contrast.** Disabled text at 2:1 is unreadable — it must stay legible enough to be understood, just clearly non-interactive. Aim for ~3:1 minimum and reduce opacity of the *whole* control, not just the text.
3. **`loading` preserves layout.** Swapping a label for a spinner must not change the component's size, or the page jumps. Reserve the width.

---

## Tier 1 — Primitives

Build and complete all of Tier 1 before starting Tier 2.

### Button
- **Variants:** primary, secondary, ghost, danger, (optional) link
- **Sizes:** sm / md / lg — pad and font-size scale, radius usually doesn't
- **Anatomy:** `[optional leading icon] label [optional trailing icon]`
- **Must have:** min tap target 44×44px on touch, `aria-busy` when loading, icon-only variant requires `aria-label`, `gap` between icon and label from the space scale
- **a11y:** real `<button>` element, `type` always explicit in forms, never a `div` with onClick

### Input / Textarea
- **Anatomy:** `label` → `[optional description]` → `control` → `[error or hint]`
- **States:** + `read-only`, `error`, and filled-vs-empty must be visually distinct
- **Must have:** label always present (placeholder is **not** a label — it disappears and fails a11y), error message tied via `aria-describedby`, `aria-invalid` on error, error text has an icon so color isn't the only signal
- **Textarea:** resize behavior explicit, min-height from the scale

### Select
- Native `<select>` for Level 1–2 unless there's a real reason not to — it's accessible and mobile-native for free
- Custom listbox needs: full keyboard (↑↓, Home/End, type-ahead, Esc), `role="listbox"`/`role="option"`, `aria-selected`, focus return to trigger on close
- Never build a custom select without the keyboard support. A broken one is worse than a plain one.

### Checkbox / Radio / Switch
- **Checkbox:** + `indeterminate`. **Radio:** groups need `fieldset`+`legend` and shared `name`. **Switch:** `role="switch"`, `aria-checked`, and it must apply immediately (if it needs a Save button, use a checkbox instead)
- All three: label is clickable and tied to the control, hit area extends to the label, custom visuals keep the real input for a11y (visually hidden, not `display:none`)

### Badge / Avatar / Link / Kbd / Spinner
- **Badge:** status variants, and never color-only — pair with text or icon
- **Avatar:** image → initials → icon fallback chain, sizes, optional status dot, `alt` handling
- **Link:** underline by default in body text (color alone fails colorblind users), external-link indicator, visited state considered
- **Spinner:** `role="status"` + visually-hidden "Loading", sized in `em` so it scales with text
- **Kbd:** monospace, subtle raised surface

---

## Tier 2 — Composites

### Card
- Anatomy: `[media]` → `[header: title + optional action]` → `body` → `[footer]`
- Interactive cards need hover + focus-visible on the *whole card*; ensure only one nested focusable target or use the "card with a real link inside" pattern to avoid nested-interactive a11y violations
- Padding from one token, consistent on all sides unless media bleeds to the edge

### Alert / Toast
- Four intents: info, success, warning, error — each with icon + color + text (never color alone)
- **Alert:** inline, static, `role="alert"` only if it appears dynamically
- **Toast:** stacking rules, auto-dismiss duration (min 5s, and never auto-dismiss errors), pause on hover, `aria-live="polite"` region, dismissible by keyboard, max visible count
- Toasts must not be the only place critical info appears

### Tabs / Accordion
- **Tabs:** `role="tablist"`, arrow-key navigation, `aria-selected`, panel tied by `aria-controls`, active indicator animates via transform not width, overflow strategy for many tabs
- **Accordion:** `<details>`/`<summary>` is a legitimate zero-JS base, otherwise `aria-expanded` + button trigger, single vs multi-open declared, height animation via grid-template-rows or max-height with a known value

### Dialog / Menu / Tooltip
- **Dialog:** native `<dialog>` preferred. Requires focus trap, focus restore on close, Esc to close, backdrop click behavior declared, scroll lock, `aria-labelledby`, and **initial focus on the first meaningful element** — not the close button
- **Menu:** `role="menu"`, arrow keys, Esc, click-outside, positioned with collision detection, submenu delay
- **Tooltip:** `role="tooltip"` + `aria-describedby`, delay in ~400ms, **never** the only source of critical info, must work on keyboard focus, and never contain interactive content (use a popover)

### Table
- Semantic `<table>`/`<thead>`/`<th scope>` always — a div grid breaks screen readers
- Features: sortable headers with `aria-sort`, sticky header, row selection, zebra or hairline (pick one), numeric columns right-aligned and tabular-nums, empty state, loading skeleton rows, responsive strategy (horizontal scroll with a shadow affordance, or card reflow)
- Cell padding from the scale; row height consistent

### Pagination / Breadcrumb / Progress / Skeleton / EmptyState
- **Pagination:** current page marked `aria-current`, prev/next disabled at bounds, truncation with ellipsis
- **Breadcrumb:** `<nav aria-label="Breadcrumb">`, ordered list, last item `aria-current="page"` and not a link
- **Progress:** `role="progressbar"` + aria value attrs; indeterminate variant
- **Skeleton:** matches the real content's dimensions, shimmer respects reduced-motion, `aria-hidden` with a live-region status elsewhere
- **EmptyState:** illustration/icon + heading + one sentence + one primary action. This is the most-skipped and most-noticed component — a system without it always ships blank screens.

---

## Tier 3 — Patterns

- **Form layout** — label placement, grouping via fieldsets, required/optional convention (mark one, not both), inline vs summary validation, submit area placement, error summary at top for long forms
- **Header / nav** — logo, primary nav, actions, mobile drawer, active-route indication, sticky behavior, skip-to-content link
- **Sidebar** — collapsed/expanded, section grouping, nested items, active state, persisted preference
- **Page shell** — header + sidebar + content + optional footer, max-width container, responsive breakpoint behavior
- **Data table view** — table + toolbar (search/filter/bulk actions) + pagination + empty/loading/error states
- **Auth screen** — the "one screen that proves the system" — centered card, brand moment, form, error handling, secondary actions

---

## Per-component doc page checklist

Each component's shell page must contain:

1. **Name + one-sentence purpose** — what it's for, when to reach for it
2. **Anatomy diagram** — labeled parts (annotated markup is fine)
3. **Live preview** — the default, in both themes
4. **All states grid** — every state from the matrix, labeled, visible at once
5. **All variants × sizes grid**
6. **Copyable code** — markup + the tokens it consumes
7. **Props / variants table** — name, values, default, description
8. **Do / Don't pair** — one correct and one incorrect usage, side by side, with the reason
9. **Accessibility notes** — roles, keyboard map, ARIA used, and what the consumer must supply
10. **Related components** — links

The states grid is the most valuable thing on the page. It's how someone verifies the system is real rather than a demo.

---

## Universal requirements

**Keyboard map** — Tab/Shift+Tab moves between components; arrow keys move *within* a composite (tabs, menu, radio group, listbox); Enter activates; Space toggles; Esc dismisses; Home/End jump to ends.

**Motion** — every component below has a required motion moment, not just an optional polish
pass. Read `references/motion-system.md` for the timing/easing tokens, the purpose-tag discipline,
and the recipes. A blanket "wrap everything in `no-preference`" is the wrong instinct — under
`prefers-reduced-motion: reduce`, `feedback`/`orientation` motion stays but simplifies (a button
still needs *some* press confirmation), only `delight` motion disappears entirely; see
motion-system.md's purpose-tag table for exactly which.

| Component class | Required motion moment |
|---|---|
| Button, Link, Badge (clickable) | Press feedback (`feedback`, 80–150ms), hover state transition |
| Card, interactive container | Hover lift (`orientation` — signals "this is clickable"), focus-visible ring transition |
| Switch, Checkbox, Radio | Spring-pop on toggle (`feedback`, `var(--ease-spring)`) |
| Toast, Alert | Slide/fade in on appear, faster fade on auto-dismiss (`orientation`) |
| Skeleton → real content | Crossfade with layout reserved — no jump (`orientation`); see component-specs.md's own loading-state rule above |
| Accordion, Tabs panel | Height/opacity transition on expand, active-indicator transform on select (`orientation`) |
| Dialog, Menu, Tooltip | Entrance/exit pair per motion-system.md's distance–duration table (`orientation`) |
| List, grid of repeated items on first render or filter change | Staggered reveal, `var(--motion-stagger-step)` per item (`orientation`) |

Any interactive component shipping with **zero** motion property despite having `:hover` or
`:focus-visible` rules is not "restrained," it's incomplete — `assets/audit.py` check 8 catches
this mechanically, per motion-system.md's "one non-negotiable."

**Contrast floor** — 4.5:1 body text, 3:1 large text (≥24px or ≥19px bold), 3:1 for UI component borders and focus indicators, at every creativity level.

**Never color-only** — status, error, selection, and required-ness must each carry a second signal (icon, text, weight, position).

**Touch targets** — 44×44px minimum for anything tapped, even when the visual is smaller (expand the hit area with padding or a pseudo-element).
