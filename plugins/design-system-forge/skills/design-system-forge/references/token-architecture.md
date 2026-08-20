# Token Architecture — 3 layers, no shortcuts

## The model

```
Layer 1  PRIMITIVES    raw values, no semantics       --gray-900  --amber-500  --space-4
                       ↓ referenced ONLY by Layer 2
Layer 2  SEMANTIC      roles that mean something      --bg-surface  --fg-muted  --border-focus
                       ↓ the ONLY layer dark mode redefines
Layer 3  COMPONENT     per-component contracts       --btn-bg  --card-pad  --input-border
                       ↓ resolves to Layer 2, never to Layer 1
```

**Three laws:**
1. Component CSS reads Layer 3 or Layer 2. A component referencing `--gray-900` cannot be re-themed — that's a bug, not a shortcut.
2. Dark mode redefines Layer 2 only. If you're swapping primitives per mode, the semantic layer is too thin.
3. Zero raw values in component CSS. No hex, no rgb(), no px spacing, no bare ms. Everything traces to a token.

---

## Naming convention

`--{category}-{role}-{variant}-{state}`

```
--bg-surface            --bg-surface-raised      --bg-surface-sunken
--fg-default            --fg-muted               --fg-subtle
--border-default        --border-strong          --border-focus
--action-primary-bg     --action-primary-bg-hover
--status-error-bg       --status-error-fg
```

Rules: kebab-case, no abbreviations (`background` not `bg` in *new* categories — but `bg`/`fg` are conventional enough to keep), never encode the literal value in the name (`--fg-muted` not `--fg-gray-500`), state suffix last.

---

## Layer 1 — Primitives

Generate an 11-step ramp per hue. Steps are perceptual, not linear — use OKLCH for even lightness distribution.

```css
:root {
  /* Neutral ramp — the workhorse. Tint it slightly toward your brand hue
     so neutrals feel part of the system rather than borrowed. */
  --neutral-50:  oklch(0.985 0.002 260);
  --neutral-100: oklch(0.967 0.003 260);
  --neutral-200: oklch(0.922 0.005 260);
  --neutral-300: oklch(0.870 0.007 260);
  --neutral-400: oklch(0.708 0.010 260);
  --neutral-500: oklch(0.556 0.012 260);
  --neutral-600: oklch(0.439 0.012 260);
  --neutral-700: oklch(0.371 0.011 260);
  --neutral-800: oklch(0.269 0.009 260);
  --neutral-900: oklch(0.208 0.008 260);
  --neutral-950: oklch(0.145 0.006 260);

  /* Brand ramp — same 11 steps, your dominant hue */
  --brand-50 … --brand-950;

  /* Accent ramp — the sharp one. Often only 3 steps are needed. */
  --accent-400: …; --accent-500: …; --accent-600: …;

  /* Status — success / warning / error / info, 3 steps each (bg, border, fg) */
}
```

Lightness anchors that matter: **500** is the pure brand color, **600–700** are for text on light backgrounds (AA-safe), **50–100** are tints for status backgrounds, **900–950** are dark-mode surfaces.

### Type scale

Pick one ratio and never deviate. Store as tokens; off-scale sizes are banned.

| Use | Ratio | Character |
|-----|-------|-----------|
| Dense UI, dashboards | 1.125 / 1.2 | many steps, small jumps |
| General product (default) | 1.25 | balanced |
| Editorial, marketing | 1.333 / 1.414 | dramatic |
| Level 3–4 display | 1.5+ with a deliberate gap | cinematic |

```css
--text-xs: 0.75rem;   --text-sm: 0.875rem;  --text-base: 1rem;
--text-lg: 1.125rem;  --text-xl: 1.25rem;   --text-2xl: 1.5rem;
--text-3xl: 1.875rem; --text-4xl: 2.25rem;  --text-5xl: 3rem;
--text-6xl: 3.75rem;  --text-7xl: 4.5rem;

/* Leading is inverse to size — large text needs tighter leading */
--leading-none: 1;      --leading-tight: 1.15;   /* display */
--leading-snug: 1.35;   --leading-normal: 1.55;  /* body */
--leading-relaxed: 1.7;                          /* long-form */

/* Tracking is also inverse — big type tightens, small caps open up */
--tracking-tighter: -0.04em;  --tracking-tight: -0.02em;
--tracking-normal: 0;         --tracking-wide: 0.02em;
--tracking-widest: 0.1em;

--font-display: …;  --font-text: …;  --font-mono: …;
--weight-light: 300; --weight-regular: 400; --weight-medium: 500;
--weight-semibold: 600; --weight-bold: 700; --weight-black: 900;
```

### Spacing

One base unit (4px), one scale, no exceptions. If `spacing-control` is available, defer to it.

```css
--space-0: 0;      --space-px: 1px;   --space-1: 0.25rem;  /* 4 */
--space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;    /* 16 */
--space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem;
--space-10: 2.5rem; --space-12: 3rem;  --space-16: 4rem;
--space-20: 5rem;   --space-24: 6rem;  --space-32: 8rem;
```

**Proximity law:** related elements sit closer than unrelated ones, and the gap between groups is at least 2 steps larger than the gap within a group. Label→input is `--space-2`; field→field is `--space-6`. Getting this one thing right does more for perceived quality than any color choice.

### Radius, shadow, motion, z-index

```css
--radius-none: 0; --radius-sm: 0.25rem; --radius-md: 0.5rem;
--radius-lg: 0.75rem; --radius-xl: 1rem; --radius-2xl: 1.5rem; --radius-full: 9999px;

/* Shadows: multi-layer with correct optical falloff. A single large blur
   reads as fake; two layers (tight contact + soft ambient) reads as real.
   Tint the shadow toward the brand hue rather than pure black. */
--shadow-xs: 0 1px 2px oklch(0.2 0.02 260 / 0.05);
--shadow-sm: 0 1px 2px oklch(0.2 0.02 260 / 0.06), 0 1px 3px oklch(0.2 0.02 260 / 0.10);
--shadow-md: 0 2px 4px oklch(0.2 0.02 260 / 0.06), 0 4px 8px oklch(0.2 0.02 260 / 0.08);
--shadow-lg: 0 4px 8px oklch(0.2 0.02 260 / 0.06), 0 12px 24px oklch(0.2 0.02 260 / 0.10);
--shadow-xl: 0 8px 16px oklch(0.2 0.02 260 / 0.08), 0 24px 48px oklch(0.2 0.02 260 / 0.12);

--duration-instant: 100ms; --duration-fast: 150ms; --duration-normal: 250ms;
--duration-slow: 400ms; --duration-slower: 600ms; --duration-slowest: 1000ms;

--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);      /* general movement */
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);       /* arrivals */
--ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);   /* transforms */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);      /* playful, L3–4 */

--z-base: 0; --z-raised: 10; --z-sticky: 100; --z-overlay: 200;
--z-modal: 300; --z-popover: 400; --z-toast: 500; --z-tooltip: 600;
```

---

## Layer 2 — Semantic (the themeable layer)

```css
:root {
  /* Surfaces — sunken < base < raised < overlay */
  --bg-canvas:          var(--neutral-50);
  --bg-surface:         white;
  --bg-surface-raised:  white;
  --bg-surface-sunken:  var(--neutral-100);
  --bg-surface-hover:   var(--neutral-100);
  --bg-overlay:         oklch(0.145 0.006 260 / 0.5);

  /* Content — 3 levels is enough; a 4th always becomes illegible */
  --fg-default: var(--neutral-900);
  --fg-muted:   var(--neutral-600);
  --fg-subtle:  var(--neutral-500);
  --fg-on-accent: white;

  --border-default: var(--neutral-200);
  --border-strong:  var(--neutral-300);
  --border-focus:   var(--brand-500);

  /* Interactive */
  --action-primary-bg:        var(--brand-600);
  --action-primary-bg-hover:  var(--brand-700);
  --action-primary-bg-active:  var(--brand-800);
  --action-primary-fg:        white;
  --action-secondary-bg:      transparent;
  --action-secondary-border:  var(--border-strong);

  --status-error-bg: var(--red-50); --status-error-fg: var(--red-700);
  --status-error-border: var(--red-200);
  /* …success / warning / info identically */

  --focus-ring: 0 0 0 2px var(--bg-surface), 0 0 0 4px var(--border-focus);
}
```

### Dark mode — semantic layer only

```css
[data-theme="dark"] {
  --bg-canvas:         var(--neutral-950);
  --bg-surface:        var(--neutral-900);
  --bg-surface-raised: var(--neutral-800);   /* raised = LIGHTER in dark */
  --bg-surface-sunken: var(--neutral-950);
  --bg-surface-hover:  var(--neutral-800);

  --fg-default: var(--neutral-50);
  --fg-muted:   var(--neutral-400);
  --fg-subtle:  var(--neutral-500);

  --border-default: var(--neutral-800);
  --border-strong:  var(--neutral-700);

  /* Saturated colors vibrate on dark — step DOWN in lightness index
     (toward the lighter end of the ramp) and reduce chroma slightly. */
  --action-primary-bg:       var(--brand-500);
  --action-primary-bg-hover: var(--brand-400);

  /* Shadows barely read on dark. Lean on raised surface lightness and
     borders for elevation instead of pushing shadow opacity up. */
  --shadow-md: 0 2px 4px oklch(0 0 0 / 0.3), 0 4px 12px oklch(0 0 0 / 0.4);
}
```

Support both explicit toggle and OS preference:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* same dark overrides */ }
}
```

Set `color-scheme: light dark` so native form controls and scrollbars follow.

**Dark mode gotchas:** pure white text on pure black causes halation — use `--neutral-50` on `--neutral-950`. Elevation inverts (raised gets lighter, not shadowed). Brand colors need lower chroma. Images and illustrations may need a `filter: brightness(0.9)` pass.

---

## Layer 3 — Component tokens

```css
.button {
  --btn-bg: var(--action-primary-bg);
  --btn-fg: var(--action-primary-fg);
  --btn-pad-x: var(--space-4);
  --btn-pad-y: var(--space-2);
  --btn-radius: var(--radius-md);
  --btn-font: var(--text-sm);

  background: var(--btn-bg);
  color: var(--btn-fg);
  padding: var(--btn-pad-y) var(--btn-pad-x);
  border-radius: var(--btn-radius);
  font-size: var(--btn-font);
  transition: background var(--duration-fast) var(--ease-out-quart);
}

/* Variants rebind tokens — they never restate properties */
.button[data-variant="secondary"] {
  --btn-bg: var(--action-secondary-bg);
  --btn-fg: var(--fg-default);
}
.button[data-size="lg"] {
  --btn-pad-x: var(--space-6);
  --btn-pad-y: var(--space-3);
  --btn-font: var(--text-base);
}
```

This is why the third layer exists: variants become token rebinds, so there's exactly one place per component where visual decisions live.

---

## Stack adapters

**Tailwind** — point the theme at the CSS variables so both systems share one source:
```js
// tailwind.config.js
theme: { extend: {
  colors: {
    surface: 'var(--bg-surface)',
    'fg-muted': 'var(--fg-muted)',
  },
  borderRadius: { md: 'var(--radius-md)' },
}}
```

**TS export** for consumption in JS logic:
```ts
export const tokens = {
  color: { bgSurface: 'var(--bg-surface)' },
  space: { 4: 'var(--space-4)' },
} as const
```

Keep CSS variables as the single source of truth in every case. Duplicating values into JS objects guarantees drift.

---

## Verification

```bash
# No raw hex/rgb in component CSS (primitives file excluded)
grep -rnE '#[0-9a-fA-F]{3,8}|rgba?\(' components/ --include=*.css

# No raw px spacing in padding/margin/gap
grep -rnE '(padding|margin|gap)[^:]*:\s*[0-9]+px' components/ --include=*.css
```
Both should return nothing. Also confirm every `--*` referenced actually resolves — an undefined variable fails silently and invisibly.
