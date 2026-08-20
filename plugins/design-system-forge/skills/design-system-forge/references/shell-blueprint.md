# Shell Blueprint — a showcase, not a scaffold

The shell is the deliverable people actually look at. A perfect system in a blank
white page reads as unfinished; a good system in a well-made shell reads as a
product. Treat the shell as a designed artifact.

This file is a **template with a fixed contract and a free surface**. The contract
(namespacing, the token set, the structural classes, the required features) does
not change between projects. The surface — what the chrome actually looks like —
is redesigned per system, from the three presets below or your own.

---

## 1. The namespacing rule

```
--shell-*     nav, sidebar, ToC, page chrome    ← calm, high-contrast, always navigable
--*           the system on display             ← as loud as the dial allows
```

Without this split a Level 4 system makes its own documentation unusable — you
cannot evaluate a wild theme through wild navigation. The chrome should feel like
a good gallery: quiet, confident, clearly a different layer from the work on the
walls. Still art-directed — art-directed to recede.

**Two independent theme toggles**, and this matters more than it sounds: viewing a
light system inside dark chrome is how you catch surface bugs. `[data-theme]` for
the system, `[data-shell-theme]` for the chrome.

### The chrome is a token layer too

Earlier versions of this template described the chrome in prose, and the result
was a shell with ~100 hardcoded literals scattered through it — a stylesheet
nobody could retheme, sitting next to a system built on strict layers. The chrome
is exempt from the *system's* layers, not from having layers of its own.

**Declare every chrome value in the block below and consume it by name.** After
that, `--shell-*` literals appear in exactly one place, and swapping a preset is
an edit to one block rather than a search across a file.

```css
:root {
  /* ---- surfaces: sunken < bg < surface < raised ---- */
  --shell-bg:            #F7F5F2;
  --shell-sunken:        #EFECE7;
  --shell-surface:       #FFFFFF;
  --shell-raised:        #FFFFFF;

  /* ---- content: exactly three levels + on-accent ---- */
  --shell-fg:            #1C1917;
  --shell-fg-muted:      #6B645C;   /* ≥4.5:1 on --shell-bg */
  --shell-fg-subtle:     #8C857C;   /* ≥4.5:1 on --shell-bg — verify, don't assume */
  --shell-fg-on-accent:  #FFFFFF;

  /* ---- lines: decorative vs identifying, same split as the system ---- */
  --shell-border:        #E2DDD6;   /* dividers — no contrast floor */
  --shell-border-strong: #C9C2B9;   /* control edges — ≥3:1 */
  --shell-accent:        #964C1B;   /* current-page, links — ≥4.5:1 as text */
  --shell-focus:         #964C1B;   /* ≥3:1 on every surface it lands on */

  /* ---- semantic pills (pass/fail, do/don't) ---- */
  --shell-ok-bg:         #DFEEE2;  --shell-ok-fg:   #2C6B3F;
  --shell-bad-bg:        #FBE3DF;  --shell-bad-fg:  #9B3024;

  /* ---- code block: its own mini-theme, dark in both shell themes ---- */
  --shell-code-bg:       #15130F;
  --shell-code-fg:       #D9D3CB;
  --shell-code-border:   #2E2A25;
  --shell-code-tag:      #F0AC6D;  --shell-code-attr: #FFD873;
  --shell-code-str:      #8FC7A3;  --shell-code-com:  #6B645C;

  /* ---- type: the chrome's own scale. No off-scale sizes here either. ---- */
  --shell-font:    ui-sans-serif, system-ui, sans-serif;   /* chrome may use system fonts */
  --shell-mono:    ui-monospace, SFMono-Regular, monospace;
  --shell-text-micro: 0.5625rem;  /* 9px — uppercase mono labels only */
  --shell-text-xs:    0.6875rem;  /* 11px */
  --shell-text-sm:    0.8125rem;  /* 13px */
  --shell-text-base:  0.9375rem;  /* 15px — chrome prose */
  --shell-text-lg:    1.375rem;
  --shell-text-xl:    clamp(2.125rem, 4.5vw, 3.25rem);
  --shell-track-label: 0.14em;    /* micro labels open up */

  /* ---- geometry ---- */
  --shell-nav-w:    260px;
  --shell-toc-w:    200px;
  --shell-header-h: 56px;
  --shell-radius:   4px;
  --shell-radius-sm: 2px;
  --shell-gutter:   var(--space-8);

  /* ---- motion: one duration, one easing. The chrome doesn't perform. ---- */
  --shell-duration: 180ms;
  --shell-ease:     cubic-bezier(0.25, 1, 0.5, 1);
}

[data-shell-theme="dark"] {
  --shell-bg: #15130F;      --shell-sunken: #12100D;
  --shell-surface: #1E1B17;  --shell-raised: #232019;
  --shell-fg: #F7F5F2;       --shell-fg-muted: #A8A099;
  --shell-fg-subtle: #857D74;
  --shell-border: #2E2A25;   --shell-border-strong: #46403A;
  --shell-accent: #F0AC6D;   --shell-focus: #F0AC6D;
  --shell-ok-bg: #1B2E20;    --shell-ok-fg:  #8FC7A3;
  --shell-bad-bg: #33201C;   --shell-bad-fg: #E8A79C;
}
```

Audit the chrome against its own floors — `--shell-fg-muted` and `-subtle` at
4.5:1 on `--shell-bg` *and* `--shell-surface`, `--shell-border-strong` and
`--shell-focus` at 3:1 on both. Docs that fail contrast while documenting a
contrast-compliant system is the most embarrassing outcome available here, and it
happens because people audit the system and forget the chrome. `audit.py` exempts
the chrome file from *purity* precisely so you can hardcode this block — it does
not exempt you from checking the numbers.

---

## 2. Layout

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER  wordmark · system name · search · 2 theme toggles   │  sticky, 56px
├────────────┬──────────────────────────────────┬──────────────┤
│  SIDEBAR   │  CONTENT                          │  ToC        │
│            │                                   │             │
│ Overview   │  ## Section                       │ On this page│
│ Foundations│  prose                            │  · Preview  │
│  Color     │  ┌─────────────────────────────┐ │  · States   │
│  Type      │  │ PREVIEW SURFACE             │ │  · Code     │
│  Spacing   │  │ (system tokens live here)   │ │  · A11y     │
│  Motion    │  └─────────────────────────────┘ │             │
│ Components │  ┌─────────────────────────────┐ │  sticky     │
│  Button    │  │ CODE + copy button          │ │             │
│  Input …   │  └─────────────────────────────┘ │             │
│ Patterns   │                                   │             │
│ Playground │                                   │             │
│ Rules      │  max-width 820px prose            │             │
│  sticky    │                                   │             │
└────────────┴──────────────────────────────────┴──────────────┘
```

Prose caps at ~820px; preview surfaces may bleed wider. Sidebar and ToC are both
sticky and independently scrollable. Below 1180px the ToC drops; below 860px the
sidebar becomes a drawer.

**Grid, not floats or fixed offsets** — `minmax(0, 1fr)` on the content column,
or a long code block will blow the layout out horizontally:

```css
.shell__body {
  display: grid;
  grid-template-columns: var(--shell-nav-w) minmax(0, 1fr) var(--shell-toc-w);
}
```

**`minmax(0, 1fr)` is necessary but not sufficient — something still has to
absorb the overflow.** It lets the column shrink below its content; it does not
tell a wide table what to do about it. A token table's min-content width is the
sum of its longest cells, and `--action-secondary-bg-hover` in a `nowrap`
`<code>` is not negotiable, so the *page* scrolls sideways instead. Give every
wide table its own scroll container:

```css
.tokens-scroll { overflow-x: auto; }
.tokens-scroll:focus-visible { outline: 2px solid var(--shell-accent); outline-offset: 2px; }
```

```html
<div class="tokens-scroll" tabindex="0" role="region" aria-label="Semantic roles">
  <table class="tokens">…</table>
</div>
```

The `tabindex="0"` is not optional garnish: **a container only a mouse can
scroll is a 2.1.1 failure**, and adding scroll without it trades a layout bug
for an accessibility one. Focusable means it must show focus, and `role="region"`
requires a name — so all four attributes travel together or none of them do.

**Test between your breakpoints, not at them.** This bug lived at 900px: below
1180 the ToC is gone, above 860 the sidebar still costs its full width, so the
content column is at its narrowest exactly where nobody screenshots. Sweep
1440 / 1180 / 900 / 700 and assert `scrollWidth <= clientWidth` on every page.

**Chrome drift is the maintenance failure of this template.** Five pages each
holding their own copy of the sidebar means the sixth link gets added to four of
them. Two ways out — pick one and be consistent:

- **Single source, injected.** Keep the nav in `js/shell.js` as data and render
  it, marking current via `location.pathname`. One edit adds a link everywhere.
- **Duplicated, but verified.** Keep the markup inline and add a check that all
  pages carry an identical nav block. Never duplicate without the check.

---

## 3. Required pages

### 1. Overview — the page that earns trust
- **An art-directed hero that performs the mood.** Not "Design System v1" in
  Helvetica. This is the one place in the shell where the system's own
  personality takes the full canvas. Level 3–4 should be genuinely striking.
- The locked **BRIEF block** verbatim
- A short paragraph on the system's reasoning
- **A stat row of measured numbers** — count them, don't assert them. "177 tokens
  · 20 components · 82 contrast checks" is only worth printing if a script
  produced those numbers, and a wrong count on the front page discredits
  everything behind it.
- Quick-start snippet

Size the hero against **its own box, not the viewport**. A hero in a content
column narrower than the window will overshoot with `vw` and clip:

```css
.hero { container-type: inline-size; }
.hero__title { font-size: clamp(3.4rem, 15.5cqi, 9.5rem); }
```

**An absolutely positioned decoration needs a reserved track, not luck.** A
rotated side label, a corner badge, a vertical rule — each sits outside flow and
will draw straight through whatever is beneath it at some width you didn't test.
Pad the parent by the decoration's own width and derive the offset from that same
token, so the two numbers cannot drift apart:

```css
.hero {
  --hero-rot-track: 1.75rem;
  padding-inline-end: calc(clamp(1.5rem, 4vw, 3.5rem) + var(--hero-rot-track));
}
.hero__rot { right: calc((var(--hero-rot-track) - 1ch) / 2); }
```

**And use physical `top`/`right` on anything that sets `writing-mode`.** An
absolutely positioned element resolves logical insets in *its own* writing mode,
so on a `vertical-rl` label `inset-block-start` means `right` and
`inset-inline-end` means `bottom`. Logical properties are correct everywhere else
in this template; here they silently invert, and the symptom is a label whose
horizontal position tracks the viewport for no visible reason. Measure overlap
rather than eyeballing it — the collision test is four lines:

```js
const hit = (a, b) => a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom
```

### 2. Foundations
- **Colour** — live swatches reading the actual variables, each with token name,
  resolved value, and **computed contrast vs its intended pairing** with a
  pass/fail marker. Group by semantic role, not just raw ramps.
- **Typography** — a real specimen: every step rendered with a meaningful
  sentence showing size/leading/tracking/weight. Prose at body size, a display
  line at hero size. No filler pangrams — use text from the system's domain.
- **Spacing** — bars per step with px/rem, plus a proximity-law demo (correct vs
  incorrect grouping, side by side)
- **Radius / shadow** — swatch grid; shadows on both light and dark surfaces
- **Motion** — live hoverable demos per duration and easing, with a
  reduced-motion note

### 3. Components — one section or page each
The 10-point checklist in `component-specs.md`. The all-states grid is mandatory
and is the centrepiece.

### 4. Patterns
Full compositions at realistic scale: form, data table view, auth screen, page
shell. These prove the components compose.

### 5. Playground
Kitchen sink, every component at once, plus **forced light and dark side by
side**. This is where mismatched radii and three shades of border become obvious.
Use it before claiming done.

### 6. Rules
`RULES.md` reachable from the chrome. A rules file nobody can find from the docs
does not get read.

---

## 4. Required features

| Feature | Why it matters |
|---------|---------------|
| Two theme toggles (system + shell) | proves dark parity instead of claiming it |
| Copy button on every code block | docs become usable, not just readable |
| Live token reads via `getComputedStyle` | docs cannot drift from the system |
| Computed contrast ratios | turns the a11y claim into evidence |
| `[data-force]` state mirrors | all seven states visible at once |
| Sticky sidebar + ToC with scroll-spy | navigable past 30 sections |
| Keyboard navigable throughout | accessible-system docs must be accessible |
| `localStorage` persistence | reload doesn't fight the reader |
| Search / filter over components | needed past ~15 components |

### Live token reads

```js
const resolve = (name, el = document.documentElement) =>
  getComputedStyle(el).getPropertyValue(name).trim()

document.querySelectorAll('[data-token]').forEach(el => {
  const name = el.dataset.token
  el.querySelector('[data-swatch]').style.background = `var(${name})`
  el.querySelector('[data-value]').textContent = resolve(name)
})
```

### Contrast, computed for real

```js
const srgbToLin = c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const luminance = ([r, g, b]) =>
  0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255)
const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
// Resolve through a probe so tokens compute exactly as shipped.
// Probe inside the themed subtree you're measuring, or you read the WRONG theme.
const rgbOf = (cssValue, host = document.body) => {
  const probe = document.createElement('span')
  probe.style.cssText = 'position:absolute;visibility:hidden'
  probe.style.color = cssValue
  host.append(probe)
  const rgb = getComputedStyle(probe).color.match(/[\d.]+/g).slice(0, 3).map(Number)
  probe.remove()
  return rgb
}
```

### Theme toggles, and the one that bites

```js
const SYS = 'ds-theme', SHELL = 'ds-shell-theme'
const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches
const applySystem = t => { document.documentElement.dataset.theme = t
                           localStorage.setItem(SYS, t) }
const applyShell  = t => { document.documentElement.dataset.shellTheme = t
                           localStorage.setItem(SHELL, t) }
applySystem(localStorage.getItem(SYS) ?? (prefersDark() ? 'dark' : 'light'))
applyShell(localStorage.getItem(SHELL) ?? (prefersDark() ? 'dark' : 'light'))
```

Run it **inline in `<head>` before first paint**, or the page flashes the wrong
theme. Note this also means you cannot force a theme for a screenshot by editing
the markup — the script re-applies from `localStorage` on load. Seed the storage
key instead.

**Every theme must be assertable at any depth.** Declare light on **both**
`:root` and `[data-theme="light"]`:

```css
:root, [data-theme="light"] { --bg-surface: …; }
[data-theme="dark"]         { --bg-surface: …; }
```

With light on `:root` alone, a `[data-theme="light"]` subtree inside a dark page
has nothing to re-declare the light values and silently inherits dark. Every
per-preview theme toggle in the docs breaks, and the symptom is easy to miss
because the page itself looks right. If you duplicate the dark block into a
`prefers-color-scheme` query, the two copies will drift — `audit.py` check 5
exists for exactly that.

---

## 5. Structural classes

The contract every preset implements. Keep the names; restyle freely.

```
.shell               grid root
.shell__header       sticky bar: wordmark, name, search, toggles
.shell__nav          sidebar; .shell__nav-link[aria-current="page"]
.shell__main         content column
.shell__toc          right rail; .shell__toc-link[aria-current="true"]
.section             one documented thing; .section__head / __body
.preview             framed demo; .preview__toolbar / __label / __stage / __row
.states-grid         .states-grid__cell + .states-grid__label
.code                .code__copy[data-copied] + .tok-* spans
.ratio               .ratio__pill[data-pass]
.dodont              .dodont__item[data-kind="do"|"dont"] + .dodont__head
.props               props/variants table
.note                accessibility and rationale asides
.stat                .stat__num + .stat__label
.brief               the locked BRIEF block
```

### Preview surface

```html
<div class="preview" data-theme="light">
  <div class="preview__toolbar">
    <span class="preview__label">Button — all variants</span>
    <button class="preview__toggle" data-preview-theme>Dark</button>
  </div>
  <div class="preview__stage">
    <!-- system components live here -->
  </div>
</div>
```

```css
.preview {
  border: 1px solid var(--shell-border);
  border-radius: var(--shell-radius);
  overflow: hidden;
  margin-block: var(--space-8);
}
.preview__toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--shell-surface);
  border-block-end: 1px solid var(--shell-border);
  font: 500 var(--shell-text-micro)/1 var(--shell-mono);
  letter-spacing: var(--shell-track-label);
  text-transform: uppercase;
  color: var(--shell-fg-muted);
}
/* The stage adopts the SYSTEM's canvas, not the shell's */
.preview__stage {
  padding: var(--space-8);
  background: var(--bg-canvas);
  color: var(--fg-default);
}
.preview__stage[data-grid] {   /* for transparency and shadow testing */
  background-image:
    linear-gradient(45deg, var(--bg-surface-sunken) 25%, transparent 25%),
    linear-gradient(-45deg, var(--bg-surface-sunken) 25%, transparent 25%);
  background-size: 16px 16px;
}
```

`data-theme` on `.preview` is why the assertable-at-depth rule is not academic.

### The states grid

Label every cell — an unlabelled grid of near-identical buttons communicates
nothing.

```html
<div class="states-grid">
  <div class="states-grid__cell">
    <span class="states-grid__label">default</span>
    <button class="btn">Save</button>
  </div>
  <div class="states-grid__cell">
    <span class="states-grid__label">hover</span>
    <button class="btn" data-force="hover">Save</button>
  </div>
</div>
```

Mirror every pseudo-class with an attribute selector so all states render at
once:

```css
.btn:hover,         .btn[data-force="hover"]  { /* … */ }
.btn:active,        .btn[data-force="active"] { /* … */ }
.btn:focus-visible, .btn[data-force="focus"]  { /* … */ }
```

Two things to get right. **The declarations must be identical**, not similar —
paired selectors that drift make the docs lie about the shipped states. And
**keep the attribute values consistent**: if the CSS mirrors `:focus-visible`
with `[data-force="focus"]`, writing `data-force="focus-visible"` in markup
renders a default-looking cell labelled "focus". Verify with a checker that the
`data-force` values in your HTML all have a matching CSS mirror; the failure is
invisible by construction, because the cell still renders.

---

## 6. Three chrome presets

The layout contract is fixed; the chrome's character is not. Match the preset to
the system, and check the numbers whichever you pick.

### A — Gallery (default)
Warm off-white, near-black text, hairline borders, one accent for current-page.
System fonts. Everything recedes; the previews are the only colour on the page.
Right for Levels 1–2 and for any system whose own palette is loud.

### B — Instrument
Sunken chrome slightly darker than the content surface, so content reads as lit.
Uppercase mono micro-labels at `--shell-text-micro` with open tracking, hairline
rules, one live-indicator colour. Content surfaces stay plain. Suits technical,
dense, or hardware-flavoured systems; the mono labels do the work, so the palette
can stay almost neutral.

### C — Editorial
A wider prose measure (~680px), a real serif or high-contrast display face for
section heads while UI labels stay mono, generous vertical rhythm, rules instead
of boxes. Fits Level 3–4 systems where the docs are part of the pitch. The one
preset where the chrome may use a non-system font — and the one most at risk of
competing with the work, so keep the colour count low.

**Whichever you pick: pick one and commit.** Chrome that is half gallery and half
editorial reads as indecision, and indecision in the frame makes the work inside
look accidental too.

---

## 7. File structure (zero-build)

```
design-system/
├── index.html            Overview
├── foundations.html      colour · type · space · material · motion
├── components.html       every component, or split per component if >20
├── patterns.html         form · data view · auth
├── playground.html       kitchen sink + forced light/dark side by side
├── css/
│   ├── primitives.css    Layer 1 — the ONLY file with raw system values
│   ├── semantic.css      Layer 2 + every theme
│   ├── base.css          reset, type utilities, focus
│   ├── components/*.css  Layer 3 — zero raw values
│   └── shell.css         --shell-* chrome only
├── js/
│   └── shell.js          themes, live tokens, ToC, copy, tabs, dialog
├── RULES.md
└── README.md
```

One file per component page is right past ~20 components; below that, one
`components.html` with sections is easier to scan and keeps the ToC useful.

Keeping `primitives.css` as the only file with raw system values is what makes the
`audit.py` purity check meaningful. `shell.css` is the declared exception.

**Page-local `<style>` blocks are the third place CSS lives, and the easiest to
forget.** Composition that belongs to one page — a hero, an auth split, a
foundations ramp — is right to keep inline rather than bloating a shared file. But
those rules obey the same layers: read Layer 2 for anything a theme swaps, the
`--shell-*` scale for chrome furniture, and the space/type scales freely. `audit.py`
check 7 covers exactly this, because checks 1–6 walk `.css` files and never see it.

---

## 8. Shell quality bar

The shell fails if any of these is true:

- default system fonts in the **hero** (chrome may use them; the hero may not)
- unlabelled state grids, or `data-force` values with no matching CSS mirror
- fewer than two theme toggles, or a theme not assertable at depth
- code blocks you cannot copy
- a sidebar that doesn't mark the current page, or that differs between pages
- hardcoded token values or hand-typed contrast ratios in the docs
- a Foundations page listing colours without contrast data
- asserted counts in the stat row that no script produced
- chrome text that fails 4.5:1 against chrome surfaces

Those are the difference between a scaffold and a showcase, and every one of them
is checkable before you claim done.
