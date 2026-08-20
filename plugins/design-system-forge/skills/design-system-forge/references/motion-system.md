# Motion System — nothing static, everything tokenized, everything provable

`creative-dials.md` names motion vocabulary per level (fades at Level 1, magnetic hover and
scroll-scrubbed sequences at Level 3–4) but naming a technique is not the same as knowing how to
build it well. This file is the how. Read it whenever System 3 builds an interactive component or
System 4's shell needs a scroll-driven moment — motion is not a finishing pass, it's part of the
component's contract.

**Sourcing, stated plainly:** the timing/easing/distance tables below are this skill's own craft
standard, already proven in production interaction specs (`~/.claude/agents/interaction-designer.md`)
before this file existed — not invented for this update. The named techniques at the end
(magnetic hover, text mask, cursor-reactive, spring, glitch, typewriter) are **industry-observed
convention among motion-forward sites, not a published standard from any single source** — Awwwards
itself judges holistically (Design 40% / Usability 30% / Creativity 20% / Content 10%, per
awwwards.com's own evaluation page) and publishes no technical motion rubric. Don't cite "Awwwards
requires X" for anything below; cite the specific mechanism instead.

## The one non-negotiable

**Every interactive element that has a `:hover`, `:focus-visible`, `:active`, or `[aria-*]` state
rule must also have a transition or animation property.** A component with state rules and zero
motion property is not "restrained," it's unfinished — the state exists in the CSS but nothing
tells the user it fired. `assets/audit.py`'s check 8 (below) makes this a script-checkable fact,
not a reviewer's impression.

## Purpose tags — every animation answers a question or it gets deleted

Three tags, and every animation in the system carries exactly one, stated in a comment next to the
rule (`/* motion: feedback */`) so a reviewer or a script can find it without guessing intent.

| Tag | Answers | `prefers-reduced-motion: reduce` behavior |
|---|---|---|
| `feedback` | "Did my action register?" — press, toggle, submit, select | Keep, but simplify to instant or near-instant (≤50ms) |
| `orientation` | "Where did that come from? What's connected to what? What's happening?" — origin, relationship, status, progress | Keep, but simplify to instant or a static equivalent (e.g. a spinner becomes a static "Loading…" label) |
| `delight` | Atmospheric, aesthetic, brand expression — nothing breaks if it's gone | **Disable entirely.** Wrap in `@media (prefers-reduced-motion: no-preference)`, never render it under `reduce` |

An animation that doesn't answer one of the three questions in the tag definitions is decoration,
and decoration is exactly what the AI-Slop Ledger's motion entries exist to catch. If you can't
name which tag an animation carries, that's the finding — not a reason to tag it `delight` by
default and move on.

## Timing hierarchy

Duration is a function of what kind of thing happened, not a stylistic choice made per component.

| Interaction type | Duration | Why |
|---|---|---|
| Direct feedback (button press, toggle, checkbox) | 80–150ms | Must feel instant — anything slower reads as lag |
| Element appearance (tooltip, small popover) | 180–220ms | Noticeable but doesn't make the user wait |
| Element disappearance | 120–160ms | Faster than its own appearance — exits should feel quicker than entries |
| Content transitions (page, tab panel) | 240–320ms | Long enough for the eye to track what changed |
| Spatial transitions (drawer, sheet, modal) | 280–360ms | Distance traveled suggests time; a full-screen sheet earns more than a small popover |
| Decorative / delight (success confetti, celebration) | 400–600ms | Permission to enjoy it, once, not looped |

## Easing vocabulary — never bare `ease-in-out`, never `linear` on a discrete state change

| Curve | `cubic-bezier` | Feel | Use for |
|---|---|---|---|
| Decisive entrance | `(0.2, 0.8, 0.2, 1)` | Confident arrival | Element entering (modal open, tooltip show) |
| Accelerating exit | `(0.4, 0, 1, 1)` | Leaving with intent | Element exiting |
| Neutral transition | `(0.4, 0, 0.2, 1)` | Smooth, unremarkable | Page/panel transitions where the curve itself shouldn't be noticed |
| Spring / pop | `(0.34, 1.56, 0.64, 1)` | Playful overshoot | Toggle flips, like/save actions, anything meant to feel alive |
| Emphasized arrival (scroll reveals, hero moments) | `(0.16, 1, 0.3, 1)` | Swift, cinematic | Scroll-triggered reveals, hero entrances (this is `ease-out-expo`) |
| Natural deceleration | `(0.25, 1, 0.5, 1)` | General-purpose movement | Anything that doesn't fit a more specific row above (this is `ease-out-quart`) |
| Continuous (shimmer, marquee, indeterminate progress) | `linear` | Constant rate | The **only** place `linear` is correct — anything with a beginning and end should never use it |

`linear` on a button hover or a discrete state change is the specific, gate-checkable tell of
motion that was never actually designed — see Ledger #12 and #13.

## Distance–duration relationship

Duration should scale with how far something travels, not stay fixed regardless of distance.

| Distance | Duration |
|---|---|
| 0–8px (button press feedback) | 100–150ms |
| 8–40px (element shift, hover lift) | 180–240ms |
| 40–200px (panel slide, dropdown) | 240–320ms |
| 200–600px (drawer, large panel) | 320–450ms |
| Full screen (modal, page transition) | 380–500ms |

## Motion tokens

Name these once in the token layer (System 2) and reference by name everywhere — no rule below
should ever contain a raw millisecond or a raw `cubic-bezier()` literal outside this token block.

```
--motion-instant       80ms
--motion-fast          150ms
--motion-base          240ms
--motion-slow          320ms
--motion-deliberate    450ms
--motion-cinematic     700ms

--ease-decisive        cubic-bezier(0.2, 0.8, 0.2, 1)
--ease-exit            cubic-bezier(0.4, 0, 1, 1)
--ease-neutral         cubic-bezier(0.4, 0, 0.2, 1)
--ease-spring          cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-out-expo        cubic-bezier(0.16, 1, 0.3, 1)
--ease-out-quart       cubic-bezier(0.25, 1, 0.5, 1)

--motion-stagger-step  70ms
```

A variant that hardcodes `transition: transform 300ms ease` instead of `transition: transform
var(--motion-base) var(--ease-neutral)` is the same contract leak `token-architecture.md` already
warns about for color and space — motion is a token layer too, not an exception.

## The motion spec — write this before building any non-trivial interactive moment

For anything beyond a simple hover-darken, write the spec first (mirrors
`~/.claude/agents/interaction-designer.md`'s own output format):

```
INTERACTION:    [name]
PURPOSE TAG:    feedback | orientation | delight
TRIGGER:        [exact event — mouse, keyboard, touch, scroll-position, separately if they differ]
PHASES:
  1. [name] — duration: var(--motion-*) · easing: var(--ease-*) · properties: [...] · start → end state
  2. [name, if multi-phase] — ...
REDUCED MOTION: [per the purpose-tag table above — disabled, simplified-to-instant, or static equivalent]
INPUT PARITY:   hover → focus-visible equivalent: [...] · hover → touch equivalent: [...]
ANTI-PATTERN CHECKED: [the specific thing this must not do — see "Patterns that always fail" below]
```

No spec, no build. A component built without this for anything beyond hover-darken is exactly how
"static apart from one darkened button" ships as if it were finished.

## Input parity is not optional

Every behavior defined for `hover` needs a `focus-visible` equivalent (same visual feedback,
keyboard-triggered) and, where the component is used on touch, a tap equivalent — hover has no
meaning on a touchscreen, so a hover-only interaction is invisible to a real share of users, not a
graceful degradation. Tooltip content specifically needs a non-hover path: a tap-to-show/tap-to-
dismiss trigger, or an inline alternative that carries the same information without requiring hover
at all.

## Patterns that always fail

| Pattern | Why | Instead |
|---|---|---|
| State rule (`:hover`, `:focus-visible`, `[aria-*]`) with no transition/animation property at all | The state exists in the CSS and nowhere else — nothing tells the user it fired | Every state rule ships with a transition; see the one non-negotiable above |
| `transition: all 300ms ease` | `all` transitions properties nobody asked for (including ones that shouldn't animate, like `display`) and masks which property actually matters | Name the exact properties: `transition: transform var(--motion-base) var(--ease-neutral), opacity var(--motion-base) var(--ease-neutral)` |
| Looping/pulsing attention-getters that never stop | Becomes wallpaper within seconds, then becomes an accessibility complaint (vestibular triggers, seizure risk at the wrong frequency) | One-shot on a real trigger; if attention is genuinely needed after first load, a static visual weight change, not motion |
| Auto-rotating carousels | Removes the user's control over pacing, and motion continues even when they've looked away | User-driven navigation with visible affordance |
| Spinners where the content shape is known ahead of time | A blank spinner tells you nothing about what's coming; a skeleton matching the real layout tells you immediately | Skeleton in the real component's dimensions, per `component-specs.md` |
| Magnetic hover, parallax, or cursor-reactive effects rendered identically on touch | These are `pointer: fine` conventions; on touch they either do nothing (dead JS) or misfire on scroll | Gate behind `matchMedia('(pointer: fine)')`; touch gets the plain interactive state, not a broken imitation |
| A drag-to-dismiss or fling interaction using a fixed-duration CSS transition instead of real physics | A fixed duration can't respond to how fast the user actually dragged — it either overshoots a slow drag or lags a fast one | Use a real spring/physics simulation (velocity-aware, interruptible) for anything the user can interrupt mid-motion; reserve the CSS spring curve for discrete, non-interruptible state changes |

## Recipes for the named Level 3–4 vocabulary

`creative-dials.md` names these; this is how to actually build each one. For scroll-driven
techniques already covered in depth — **pinned horizontal scroll, sticky zoom reveal, parallax
layering, reveal-on-scroll, section snap, and scroll-scrubbed sequences** — read
`~/.claude/skills/creative-frontend/references/scroll-choreography.md` instead of duplicating that
recipe here; it already has the GSAP + Lenis + ScrollTrigger implementation. What follows are the
techniques that file doesn't cover.

### Magnetic hover

The element tracks the cursor within its own bounds and translates toward it; releasing the cursor
snaps it back with a spring curve. Desktop-only — gate it, don't degrade it.

```js
function magneticHover(el, strength = 0.35) {
  if (!matchMedia('(pointer: fine)').matches) return; // touch gets the plain hover state instead
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * strength;
    const y = (e.clientY - r.top - r.height / 2) * strength;
    el.style.transition = 'none'; // instant while following the cursor
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform var(--motion-deliberate) var(--ease-spring)'; // spring back
    el.style.transform = 'translate(0, 0)';
  });
}
```

### Cursor-reactive (spotlight / gradient follow)

Update two CSS custom properties on `mousemove`; let CSS do the actual rendering so the effect
stays declarative and the JS payload stays tiny.

```js
el.addEventListener('mousemove', (e) => {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
  el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
});
```
```css
.cursor-spotlight {
  background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), var(--glow-color) 0%, transparent 60%);
}
```

### Text mask reveal

`clip-path` over character/line reveal — cheaper and more robust than a background-clip gradient
trick, and animates cleanly with the token curves above.

```css
.text-reveal {
  clip-path: inset(0 100% 0 0);
  transition: clip-path var(--motion-cinematic) var(--ease-out-expo);
}
.text-reveal.in-view { clip-path: inset(0 0 0 0); }
```

### Physics-based / spring — two tiers, know which one you need

**Spring-approximation** (CSS, for discrete, non-interruptible state changes — a toggle flipping, a
save action popping): use `var(--ease-spring)` on the transition. That's it; this is what the
token already gives you.

**True spring** (velocity-aware, interruptible mid-gesture — a drag-released card settling, a
fling): CSS cannot do this. Use a real spring simulation (Framer Motion's `type: "spring"`, or a
hand-rolled damped-harmonic-oscillator on `requestAnimationFrame`) — see "Patterns that always
fail" above for why substituting a fixed-duration transition here is wrong, not just cheaper.

### Glitch

One-shot, brief (150–300ms), triggered by a real event — never continuous. Layered duplicate
pseudo-elements, each clipped to a slice and offset, with a channel-shifted color.

```css
.glitch { position: relative; }
.glitch::before, .glitch::after {
  content: attr(data-text);
  position: absolute; inset: 0;
  animation: glitch-slice 220ms steps(2, end) 1;
}
.glitch::before { clip-path: inset(10% 0 60% 0); transform: translateX(-2px); color: var(--glitch-cyan); }
.glitch::after  { clip-path: inset(60% 0 10% 0); transform: translateX(2px);  color: var(--glitch-magenta); }
@keyframes glitch-slice { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; } }
```

`animation-iteration-count: 1` is load-bearing — a looping glitch reads as a broken page, not a
brand moment.

### Typewriter

For static, known-length content, `steps()` timed to character count is more robust than a JS
interval:

```css
.typewriter {
  overflow: hidden;
  white-space: nowrap;
  width: 0;
  animation: type var(--motion-cinematic) steps(var(--char-count)) forwards;
}
@keyframes type { to { width: var(--char-count, 20) ch; } }
```

For dynamic/variable-width content (proportional fonts where `ch` isn't reliable, or
server-rendered text of unknown length), set `textContent` progressively in JS instead — and under
`prefers-reduced-motion: reduce`, skip the effect entirely and render the full string immediately;
a typewriter is `delight`-tagged, never `feedback` or `orientation`.

## Auditing motion — what check 8 catches, and what still needs you

`assets/audit.py` check 8 (STATIC) catches: a state rule (`:hover`/`:focus-visible`/`:active`/
`[aria-*]`) with no transition/animation property anywhere in the same rule or a sibling rule for
the same selector; bare `linear` or unparameterized `ease-in-out` used on a non-continuous
property; and `transition: all` (masks which property is actually meant to move). It cannot verify
purpose tags exist (that's a comment convention, not a computable property) or that a technique
is gated correctly for touch — audit those by hand, per the checklist in `audit-verb.md`'s
dimension 5.
