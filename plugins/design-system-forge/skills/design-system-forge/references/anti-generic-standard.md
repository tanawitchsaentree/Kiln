# The anti-generic standard — cited decisions, a countable ledger, a nine-dimension rubric

This file replaces "does it look premium" with "which decision does it match or violate, and
where's the source." Every claim below was checked against a live artifact or a published spec —
not remembered, not assumed. Where a claim couldn't be verified, it's marked as such rather than
smoothed over. Read this once before running `audit`'s nine-dimension pass or System 6's
pre-delivery check; both cite it, neither restates it.

## Research basis — decisions, not adjectives

Three sources were checked directly. Two produced verifiable, citable decisions. One did not, and
that failure is reported rather than papered over.

### Anthropic (claude.ai, anthropic.com) — verified against live shipped CSS and the published brand-guidelines source, 2026-08-19

| Decision | Confidence | Source |
|---|---|---|
| Primary accent is a warm clay/terracotta orange (`#d97757`), not a blue | High | Anthropic's own brand-guidelines doc names it "Orange — Primary accent"; the identical hex appears independently in anthropic.com's page source, its brand CSS, and claude.ai's app CSS |
| The brand's stated light background is cream (`#faf9f5`), not pure white | High, for the brand palette. **Nuance:** claude.ai's own primary chat-canvas token resolves to pure `#ffffff` — only its *secondary* surface tokens are the cream tint. Cite the nuance, not "the whole app is cream." | Same brand-guidelines doc; cross-confirmed in anthropic.com's live CSS and claude.ai's shipped token values |
| Dark mode is built by remapping semantic tokens to a separate, non-mirrored set of scale steps — not a CSS invert filter and not a lightness flip of the same hue | High | Zero `filter: invert` in claude.ai's shipped CSS; light `bg-000` and dark `bg-000` resolve to different hue/saturation steps of the primitive ramp, not mirrored lightness |
| Typography is self-hosted, custom-drawn faces (Anthropic Sans / Serif / Mono) with generic system fonts appearing only as a fallback stack, never as the primary declaration | High | `@font-face` declarations for `anthropic-sans`/`anthropic-serif` observed directly in both sites' shipped CSS; `anthropic-sans` ships as a variable font with an optical-size axis |
| A `prefers-reduced-motion: reduce` rule exists and forces near-zero animation duration | High, narrow scope — confirms an accessibility hook exists, not a full motion philosophy | Observed directly in claude.ai's shipped CSS |

**Explicitly not verifiable by this method, do not cite as fact:** "streaming text is the signature/only motion pattern" (the streaming logic lives in minified JS bundles not parsed here), any prose "design philosophy" statement in Anthropic's own words (none was found on the fetched pages), and which literal color paints primary buttons in the live product (a separate blue-scale "accent" token slot exists alongside the clay "brand" slot; which one renders where wasn't confirmed from static source).

### Google Material Design 3 — verified against m3.material.io's own content API and the official `material-web` token source, 2026-08-19

| Decision | Confidence | Source (quoted) |
|---|---|---|
| Color roles run in triads — primary/secondary/tertiary, each with `on-*` and `*-container` pairs — plus surface, error, and outline roles, 26+ roles total, generated from one seed via the HCT color space (hue/chroma/tone, tones 0–100) | High | m3.material.io/styles/color/system, /styles/color/roles |
| Elevation is **currently** signaled primarily by tonal difference between surface roles, not by a tint overlay — the 2021-era "surface tint overlay" mechanism is explicitly deprecated in the live spec. Shadow is optional, used only "when required to create additional protection against a background or to encourage interaction," not applied by default at every level | High — and note this **corrects** the "surface tint overlay" framing this task started with; cite tonal-difference-plus-optional-shadow instead | m3.material.io/styles/elevation/overview, quoted directly: "Surface tint color is deprecated. Use elevation level tokens (0–5) instead." |
| Six elevation levels map to fixed resting heights: 0 / 1 / 3 / 6 / 8 / 12dp for levels 0–5 | High | Same page |
| Type scale is five roles (display, headline, title, label, body) × three sizes (large, medium, small) = 15 baseline styles, each with a fixed, hardcoded size/line-height pair — not a computed ratio at runtime. As of the 2025 Expressive update, 15 "emphasized" styles were added for 30 total | High | m3.material.io/styles/typography; exact pairs cross-checked against `material-web`'s own token source (`_md-sys-typescale.scss`) — e.g. Headline Large 32px/40px, Body Large 16px/24px, Label Small 11px/16px |
| Interaction states (hover/focus/pressed/dragged) are opacity-based overlay tokens using the content's own color, not per-component hand-picked values: **hover +8%, focus +10%, pressed +10%, dragged +16%** opacity. "Activated" is the documented exception — it changes container/content color directly instead of using an opacity layer | High — note the exact numbers **correct** the 8/12/12/16 assumption this task started with | m3.material.io/foundations/interaction/states, quoted directly from the page's own state-value caption |

### Lovable — checked directly, found nothing citable

Searched lovable.dev, its blog/docs, and third-party press coverage (TechCrunch, Business Insider,
Yahoo Finance, Inc.) for any statement — from Lovable itself or a credible third party — describing
a design philosophy or an approach to avoiding generic AI-generated UI. **None exists.** Press
coverage is entirely about business metrics (valuation, growth, "democratizing coding"), not design
craft. This is reported as a real finding, not smoothed over: **"Lovable" does not appear anywhere
below as a cited source**, because attributing a real-sounding decision to a company that never
stated it is exactly the failure mode this file exists to prevent.

The specific tells that prompted the idea of a "Lovable" pillar — templated 3-card feature grids,
hierarchy that ignores actual content, type/color choices that never leave a framework's defaults —
are real, observable, and load-bearing regardless of who said them first. They appear in the ledger
below labeled **"observed pattern, no named source"** rather than attributed to a company that
never published them.

## The AI-Slop Ledger — thirteen countable tells

Each one is something you can point at and count, not a feeling. "Feels generic" is not a finding;
"three of these thirteen are present, here's where" is.

Every row carries a stable ID (`dsf-ledger-##-slug`) so a finding can cite it precisely instead of
paraphrasing — "violates `dsf-ledger-09-invert-dark-mode`" is greppable across every audit this
skill has ever run; "dark mode looks off" is not.

| # | ID | Tell | Cites | Why it's not a style choice |
|---|---|---|---|---|
| 1 | `dsf-ledger-01-generic-typeface` | Inter, Roboto, Arial, or the bare `system-ui` stack as the **primary** face, with no second face for identity | Anthropic ships custom Anthropic Sans/Serif/Mono, system fonts only as fallback; this skill's own `creative-dials.md` already forbids this at Level 2+ | A typeface is the first thing a reader's eye resolves; the generic stack is the specific fingerprint of "nobody made a call here" |
| 2 | `dsf-ledger-02-purple-gradient-hero` | A purple-to-blue gradient used as the hero/marketing background | `creative-dials.md` names this exact combination as forbidden at Level 2 | It is the single most recognizable "this is an AI product" visual cliché in current UI, precisely because it requires no palette decision beyond accepting a default |
| 3 | `dsf-ledger-03-flat-radius` | One border-radius value applied to every surface — card, button, and input share a number with no stated per-tier rule | This skill's own `creative-dials.md` requires "a deliberate radius choice applied with a rule — e.g. inputs 6, cards 12, pills full"; MD3's shape system is likewise tiered by component role, not flat | A single flat radius is what happens when radius was never actually decided, only defaulted |
| 4 | `dsf-ledger-04-decorative-shadow` | Shadow used to decorate a surface with no elevation/hierarchy meaning behind it | MD3 explicitly: shadow is used "only when required... to encourage interaction," not applied by default to signal nothing | A shadow that doesn't correspond to a real stacking order is noise wearing the costume of depth |
| 5 | `dsf-ledger-05-blur-no-function` | Glassmorphism / backdrop-blur with no functional reason (nothing is actually behind it worth obscuring, no overlay/scrim purpose) | Observed pattern, no named source — none of the three researched practices document blur as a default effect; MD3's move away from decorative surface effects toward tonal, functional signals is directionally consistent | Blur applied to a flat, single-layer background is decorating an absence |
| 6 | `dsf-ledger-06-icon-circle-repeat` | The same icon-in-a-circle motif repeated for every feature/section with no variation in treatment | Observed pattern, no named source | Repetition without variation is a template signature, not a design decision made per-content |
| 7 | `dsf-ledger-07-three-card-grid` | A three-card feature grid — icon, title, one generic sentence — standing in for real content or a real information hierarchy | Observed pattern, no named source (this is the specific "Lovable" idea with the attribution removed, per the research section above) | The grid shape is chosen before the content exists, so the content is padded to fit it rather than the reverse |
| 8 | `dsf-ledger-08-emoji-icon` | An emoji standing in for an icon in product UI | Observed pattern, no named source | Emoji render inconsistently across platforms and carry no consistent optical weight against real iconography — a placeholder that shipped |
| 9 | `dsf-ledger-09-invert-dark-mode` | Dark mode implemented as a color-invert or a straight lightness-flip of the light palette | Anthropic's dark mode remaps semantic tokens to an independently chosen set of scale steps — confirmed not an invert and not a mirrored lightness flip | An inverted light palette usually breaks at least one contrast pair that happened to work only in one direction |
| 10 | `dsf-ledger-10-two-state-component` | An interactive component shipping only `default` and `hover`, missing `focus-visible`, `active`, `disabled`, `error`, or `loading` | This skill's own `component-specs.md` state matrix — nine required states, cross-referenced by dimension 6 below | A component with two states is a mockup, not a component; `focus-visible` missing means keyboard users are locked out entirely |
| 11 | `dsf-ledger-11-unverified-contrast` | A contrast ratio asserted ("looks readable") rather than computed against WCAG's 4.5:1 / 3:1 floors, in either theme | This skill's own `component-specs.md` contrast floor, and `assets/audit.py`'s own mechanical contrast check | "Looks fine" is exactly the claim a computed ratio either confirms or falsifies in one command; asserting it is the thing Gate Proof discipline exists to replace |
| 12 | `dsf-ledger-12-purposeless-motion` | Motion with no easing curve chosen on purpose and no token behind it — a flat linear tween, or a duration picked by feel | `creative-dials.md`'s own per-level easing specs (e.g. Level 2: "ease-out-quart for movement, ease-out-expo for arrivals"); Anthropic's confirmed `prefers-reduced-motion` accessibility hook, which only makes sense to have if the motion it disables was intentional in the first place | Motion without a cause-effect relationship to the interaction that triggered it reads as decoration, and decoration is what this whole ledger is about removing |
| 13 | `dsf-ledger-13-static-despite-state` | An interactive element with a `:hover`/`:focus-visible`/`:active` rule (a real state, styled) that has zero transition or animation property anywhere for it | `references/motion-system.md`'s `dsf-motion-static-state` ("one non-negotiable"), made countable by `assets/audit.py` check 8 | A state that exists in the CSS and nowhere else is a state nobody experiences firing — this is "static" made specific and gate-checkable rather than a vibe |

Count them. A system with zero hits on this ledger and a real per-dimension pass below is
distinctive by evidence, not by claim.

## The nine-dimension rubric — default to fail

Score every dimension **F until proven otherwise.** A dimension earns a better grade only when the
auditor can write the evidence sentence in the required form:

```
[dimension] = [grade] because [specific, checkable evidence] against [the cited decision/ledger row it's measured against].
```

No evidence sentence, no grade above F. "Looks good" is not evidence. A screenshot, a computed
ratio, a grep result, or a specific file:line is evidence.

1. **Color system** (`dsf-dim-color`) — semantic token depth (primitive → semantic → component, per `token-architecture.md`), a real tonal ramp per hue (not 3–4 arbitrary stops), contrast ratio computed in both light and dark. Cite against: MD3's 26+-role triad system as the depth reference, Anthropic's confirmed independent-dark-mode-remap practice, ledger #9 and #11.
2. **Typography** (`dsf-dim-type`) — a real second face beyond the workhorse text face (ledger #1), a named scale ratio, optical sizing where the face supports it, and a *line-height that changes per level* rather than one leading value reused everywhere. Cite against: Anthropic's confirmed custom-type practice, MD3's exact per-style size/line-height pairs (e.g. Headline Large 32/40 vs Body Large 16/24 — the ratio of size to line-height is not constant across the scale, and neither should yours be).
3. **Spacing / density** (`dsf-dim-spacing`) — whitespace proportional to actual information density of the content being shown, not a flat "generous" applied everywhere regardless of what's on the page. Cite against: this skill's own density policy per creative level in `creative-dials.md`, MD3's precision about interactive geometry (48dp touch target, 40dp state layer — spacing decisions tied to a measured purpose, not vibes).
4. **Elevation / depth logic** (`dsf-dim-elevation`) — does a shadow or tonal shift correspond to a real stacking/interaction meaning, or is it decoration? Cite against: MD3's current mechanism directly — tonal surface difference as the primary signal, shadow reserved for cases needing "additional protection against a background or to encourage interaction," six defined levels at fixed dp heights. Ledger #4.
5. **Motion** (`dsf-dim-motion`). Nothing static: every interactive state rule has a motion property behind it (Ledger #13), every transition traces to a token (duration + easing named, never inlined per-rule), every animation carries a purpose tag (`feedback`/`orientation`/`delight`) with the correct `prefers-reduced-motion` behavior for that tag, and `linear` never appears on a one-shot transition. Cite against: `references/motion-system.md` in full (timing hierarchy, easing vocabulary, distance–duration relationship, purpose tags), `assets/audit.py` check 8's computed evidence, `creative-dials.md`'s per-level easing table, Anthropic's confirmed reduced-motion hook, Ledger #12 and #13.
6. **Component state coverage** (`dsf-dim-states`) — every interactive component actually ships all nine states from `component-specs.md`'s matrix (`default`, `hover`, `active`, `focus-visible`, `disabled`, `loading`, `error`, `read-only` where applicable, `indeterminate` where applicable), not just default+hover. Cite against: ledger #10, and grep the component's own CSS/markup for each pseudo-class/attribute as the evidence, not a claim that they exist.
7. **Accessibility** (`dsf-dim-a11y`) — WCAG AA (4.5:1 body, 3:1 large text and UI borders) as the floor everywhere, AAA (7:1) considered at genuinely critical points (primary CTA text, error messaging) rather than nowhere. Cite against: `component-specs.md`'s contrast floor, `assets/audit.py`'s computed check, ledger #11.
8. **Distinctiveness** (`dsf-dim-distinct`) — the logo-removal test: strip branding and ask whether the system still reads as itself or collapses into "a template." Score this by counting AI-Slop Ledger hits (0 hits and a stated point of view = pass territory; any hit is a specific, named reason it isn't distinctive, not a vibe). Cite against: `creative-dials.md`'s named "convergence trap" (Space Grotesk + slate + one teal accent) as the concrete example of what a *failed* distinctiveness check looks like even when every other dimension is clean.
9. **Documentation / governance** (`dsf-dim-docs`) — can a different team pick this system up and extend it correctly without asking the original author? Cite against: this skill's own System 5 (`RULES.md` with reasoning attached to hard-won decisions, not just prohibitions) and `audit-kit-verb.md`'s Gate Proof discipline (a rule nobody can check is a rule nobody keeps) as the standard for what "documented" has to mean here.

## Fix format — a value, never advice

Every dimension that fails gets a fix stated as a real value, token, or structural change — never a
suggestion to "try" or "consider" something. Compare:

- Wrong: "Consider adjusting the border radius for better hierarchy."
- Right: "Replace the flat `--radius: 8px` used on cards, buttons, and inputs with a tiered scale — `--radius-control: 6px` (buttons, inputs, badges), `--radius-container: 12px` (cards, modals), `--radius-pill: 9999px` (status pills only) — per ledger #3 and the Level 2 shape policy in `creative-dials.md`."

If a concrete value genuinely can't be determined without more information from the user (a brand
constraint, a stack decision), say exactly what's missing to determine it — that is still more
useful than a vague suggestion, and it's an honest "not run," per this skill's own standard for an
unanswerable check.
