# design-system-forge — changelog

## 1.1.0 — Motion system + sourced anti-generic standard (major)

Two upgrades to the `audit` verb (and, for motion, to `build`'s System 3/System 6 as well) —
replacing vague "does it look premium" checks with real citations and a real mechanical gate.

### The anti-generic standard

- **New file:** `references/anti-generic-standard.md` — the ban-list-style checklist that used to
  live as 3-4 unsourced lines in `SKILL.md` is now a real standard, checked against live artifacts:
  - Anthropic (claude.ai, anthropic.com), verified by reading shipped CSS and the published
    brand-guidelines source directly: confirmed accent color, confirmed dark mode is an
    independent token remap (not an invert), confirmed self-hosted custom typefaces.
  - Google Material Design 3, verified against the live spec's own content API and the official
    token source: confirmed the 26+-role tonal color system, confirmed elevation now runs on
    tonal-surface-difference (the 2021-era "surface tint overlay" is deprecated in the current
    spec), confirmed the exact type scale and state-layer opacity values.
  - A third source ("Lovable") was checked and found to have **no citable public statement** on
    design philosophy anywhere — reported honestly rather than attributed anyway. The specific
    tells that prompted the idea survive in the ledger, labeled "observed pattern, no named
    source."
- **The AI-Slop Ledger** — 13 specific, countable tells (generic type stack, purple-gradient hero,
  flat radius with no per-tier logic, decorative shadow, glassmorphism with no function,
  icon-in-circle repetition, templated 3-card grids, emoji-as-icon, invert-only dark mode,
  2-state components, unverified contrast, purposeless motion, and — new — a state rule with zero
  motion behind it).
- **Nine-dimension rubric**, default-to-fail: color, typography, spacing/density, elevation, motion,
  component states, accessibility, distinctiveness, documentation. Every grade above F requires an
  evidence sentence citing a specific ledger row or sourced decision — no evidence, no grade above F.
- Folded in every check the old "eight things no script can" list already had (missing states,
  layer violations, off-scale values, theme depth, docs restating values, color-only signals,
  silent contrast exemptions) — nothing was dropped, just re-homed under the right dimension.

### Motion system — nothing static

The old motion guidance was one line per creativity level naming techniques ("cursor-reactive,
physics-based, glitch, typewriter, scroll-scrubbed") with zero instructions for building any of
them. That's now real:

- **New file:** `references/motion-system.md` — timing hierarchy, easing vocabulary (named
  `cubic-bezier` curves, not "ease-in-out"), a distance-duration relationship table, a three-tag
  purpose system (`feedback`/`orientation`/`delight`, each with its own `prefers-reduced-motion`
  behavior), a required motion-spec format for anything beyond a hover-darken, an input-parity
  requirement (hover always needs a focus-visible and touch equivalent), and real build recipes
  for magnetic hover, cursor-reactive spotlight, text-mask reveal, two tiers of spring/physics
  motion, glitch, and typewriter. Scroll-driven techniques (pinned scroll, sticky zoom, parallax,
  section snap, scroll-scrubbed sequences) point to the existing `creative-frontend` skill's
  `scroll-choreography.md` instead of duplicating it.
- **New mechanical gate:** `assets/audit.py` check 8 (STATIC) — computes, doesn't guess, whether
  every `:hover`/`:focus-visible`/`:focus`/`:active` rule on a styled element has a real
  transition/animation behind it (accepting either the base selector or the state selector as the
  valid place to declare it), and flags `linear` on any one-shot transition. Proven with a real
  plant-and-revert selftest case, and checked against a synthetic parent-hover-reveals-child
  pattern to confirm it doesn't false-positive on legitimate code.
- `component-specs.md`'s "wrap it in a media query" one-liner is now a required-motion-moment table
  per component class (Card, Switch, Toast, Skeleton, Dialog, list/grid, etc.).
- `creative-dials.md`'s four per-level Motion rows now point at real recipes and real tokens
  instead of bare technique names. (Found and fixed in passing: the file's own header claimed
  "the same 7 component states" across every level — the real matrix in `component-specs.md` has
  9. Now says "the same state matrix" and points there instead of hardcoding a number that can
  drift again.)

### Verification

`audit_kit.py` (KIT CLEAN), `audit_kit.py --selftest` (AUDITOR PROVEN, 6 planted violations all
caught and reverted — one of the planted-violation cases itself referenced a stale string from
before this update and had to be fixed to keep testing anything), and `assets/selftest.py` (PASS,
all 8 counted gates including the new STATIC one, uncounted gates confirmed to stay quiet) all pass
clean after every change in this update.

### Known limitation, stated plainly rather than solved silently

`motion-system.md` and `creative-dials.md` reference `~/.claude/skills/creative-frontend/references/scroll-choreography.md`
for scroll-driven techniques — a path on the machine this was built on, not a portable reference
inside this plugin. Someone installing `design-system-forge` from this marketplace without also
having `creative-frontend` installed at that path will hit a dead reference for scroll-scrubbed/
pinned/parallax techniques specifically. Not fixed in this pass — flagging it rather than either
silently leaving it or inventing a fix under time pressure.

## 1.0.0 — Initial

Five verbs (build/audit/study/redesign/audit-kit), three-layer token architecture, four creativity
levels, the component state matrix, the docs shell, and the original `audit.py` (7 checks) with its
own Gate Proof discipline.
