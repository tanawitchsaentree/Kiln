# The `audit` verb — score it, don't touch it

Point at a design system that already exists. Report what is wrong. **Change nothing.**

The discipline is the whole value. An audit that quietly fixes things teaches the
team nothing and leaves them unable to tell which problems were real. Hand back a
punch list and let them choose. If they then say "fix it", that is a separate
instruction and you switch to `build` rules.

## Run the tool first, think second

```bash
python3 ~/.claude/skills/design-system-forge/assets/audit.py PROJECT_DIR
# --layer1 css/tokens.css   where the primitives live (default css/primitives.css)
# --shell   css/docs.css    chrome namespace, exempt from purity (--no-shell to disable)
# --quiet                   hide unresolved-pair notes
```

Exit code = number of failures. Zero means the mechanical checks are clean — it
does **not** mean the system is good. Eight things it computes:

| # | Check | Counts as failure |
|---|-------|------------------|
| 1 | Contrast, every inferable pair, every theme, borders vs **both** grounds | yes (`hard` pairs) |
| 2 | Unpaired tokens — what check 1 could **not** cover | no |
| 3 | Dead tokens, split into semantic roles vs scale headroom | no |
| 4 | Raw colour / raw px outside the primitive layer | yes |
| 5 | Theme drift between `[data-theme="dark"]` and a duplicated `prefers-color-scheme` block | yes |
| 6 | Motion outside a reduced-motion guard (accepts opt-in **and** opt-out) | yes |
| 7 | Page-local `<style>` blocks reading **themed** primitives | yes |
| 8 | A `:hover`/`:focus-visible`/`:focus`/`:active` rule on the styled element with no transition/animation anywhere for it, or `linear` on a one-shot transition | yes |

It understands hex, `rgb()`, `hsl()`, `oklch()`, and alpha — translucent
foregrounds get composited over their ground rather than skipped.

**Check 7 exists because checks 1–6 walk `.css` files only.** Anything written in
an inline `<style>` in an HTML page got a free pass on every layer rule, and
that is where real defects hide: a hero reading `var(--ember-400)` renders
identically in dark mode, and a `dialog::backdrop` set to a light-mode alpha
primitive stays light on a dark page. Both were found this way, in a system the
other six checks called clean.

It gates only **themed** primitives — ones whose resolved value differs between
themes, or that a semantic role wraps. Scale steps are exempt: `var(--space-3)`
in page CSS has no semantic alias to read instead, the scale *is* the shared
vocabulary, and flagging it produces dozens of findings that are all wrong. It
also surfaces any alpha used as a colour, because a static checker cannot resolve
a composite — that one is for you to compute, not a failure.

**Check 8 exists because a state rule with no motion property fires with no
signal.** Read `references/motion-system.md` for the full standard; the check
accepts the transition declared either on the base selector or on the state
selector itself, and only ever looks at the rightmost compound in a selector —
`.menu:hover .submenu` states on `.menu`, not `.submenu`, and flagging
`.submenu`'s own (very often pseudo-class-free) transition rule would be
exactly the kind of false positive that gets a check switched off.

**Read the `warn` lines and decide.** A warning means "these two tokens fail
together, but I cannot prove anyone puts them together." `--fg-subtle` on
`--bg-surface-raised` matters only if subtle text ever sits on a raised surface.
Grep for it. If it does, it is a failure the tool undercounted; if it doesn't,
say so and move on. Same for check 2 — an unpaired token is unaudited, and
saying "0 failures" while 8 tokens went unchecked is the exact dishonesty this
verb exists to prevent.

## Then audit what no script can

The script covers arithmetic. `references/anti-generic-standard.md` holds the full standard this
section runs: the real, sourced decisions behind it (what Anthropic and Google Material Design 3
actually ship, checked against live artifacts — and an honest note on where a third source turned
out to have nothing citable), the thirteen-item AI-Slop Ledger, and the default-to-fail grading
discipline. Read it before scoring anything below; this section is the nine dimensions applied,
not a second copy of the standard.

**Score every dimension F until you can write the evidence sentence** — `[dimension] = [grade]
because [specific, checkable evidence] against [the cited decision/ledger row]`. A grade with no
evidence sentence does not get reported above F, no exceptions.

1. **Color system.** Semantic token depth (primitive → semantic → component), a real tonal ramp
   per hue, contrast computed in both themes. Fold in: does component CSS read a Layer 1 primitive
   directly (check 4 catches raw hex, not `var(--gray-900)` in a button, and check 7 only covers
   inline `<style>` — the gap between them is component CSS reading a themed primitive, grep it),
   and is every theme assertable at depth (light declared on `:root` alone means a
   `[data-theme="light"]` subtree inside a dark page silently inherits dark, and every
   per-component theme preview is broken without anyone noticing).
2. **Typography.** A real second face beyond the workhorse text face, a named scale ratio, and a
   line-height that changes per scale step rather than one leading value reused everywhere.
3. **Spacing / density.** Whitespace proportional to the content's real information density, not a
   flat "generous" applied everywhere. Fold in: off-scale values (`padding: 13px`, a fifth grey, a
   third radius — count distinct values per property against the scale's length) and variants that
   restate a property instead of rebinding a token (a variant setting `padding` or `font-size`
   directly means the contract leaked, and the next variant leaks further).
4. **Elevation / depth logic.** Does a shadow or tonal shift correspond to a real stacking or
   interaction meaning, or is it decoration with nothing behind it (Ledger #4)?
5. **Motion.** Nothing static (Ledger #13 — every `:hover`/`:focus-visible`/`:active` rule has a
   real transition or animation behind it, per check 8 and `motion-system.md`'s one non-negotiable).
   Every transition traces to a token, carries a purpose tag (`feedback`/`orientation`/`delight`)
   with the matching `prefers-reduced-motion` behavior, and never uses `linear` on a one-shot
   transition (Ledger #12).
6. **Component state coverage.** Grep every interactive component for `:focus-visible`,
   `:disabled`, `[aria-invalid]`, `:hover`, `:active` against `component-specs.md`'s full
   nine-state matrix. Missing `focus-visible` is the most serious defect in any design system — it
   locks keyboard users out entirely — and it is also the most common.
7. **Accessibility.** WCAG AA as the floor everywhere, AAA at genuinely critical points. Fold in:
   colour as the only signal (status, error, required, selected each need a second signal) and
   silent contrast exemptions (someone dropped a floor to make a colour work and left no note —
   look for suspiciously specific values).
8. **Distinctiveness.** The logo-removal test, scored by counting real hits on the thirteen-item
   Ledger — zero hits and a stated point of view is pass territory, one hit is a named reason, not
   a vibe.
9. **Documentation / governance.** Can another team extend this correctly without asking the
   original author? Fold in: docs that restate values by hand (a swatch with a hardcoded hex, or a
   contrast ratio typed into prose, is already drifting — check whether the docs read the shipped
   variables).

## Reporting format

Severity by consequence, not by how easy it is to fix:

```
AUDIT — <project>
Ran: audit.py → 3 failures, 6 warnings, 0 unpaired

BLOCKING — someone cannot use the product
  1  Button has no :focus-visible                       css/button.css
     Keyboard users get no focus indicator at all.
     Fix: add :focus-visible with a 3:1 ring; never outline:none alone.

SERIOUS — will break or mislead soon
  2  --fg-on-plate missing from the prefers-color-scheme block   semantic.css:213
     Same value today, so nothing renders wrong. Change the dark plate and
     readers on OS preference silently keep the old foreground.

WORTH FIXING
  3  4 dead semantic roles                             semantic.css
     --bg-overlay, --elevation-flush, --fg-on-accent, --status-warning-fg-on-surface
     Either consume them or delete them; right now they mislead a grep.
     Diagnose each one before you pick — the four above were four
     different answers. See "A dead role is a diagnosis" below.

NOT AUDITED
  --fg-on-brand — no --bg-brand exists to pair it against. Unverified.

DIMENSION SCORES (references/anti-generic-standard.md's nine, default F)
  1  Color system         = D  because 3 semantic roles resolve to the same hex in dark mode
                              (drift, not distinct roles) against anti-generic-standard.md
                              dimension 1 and Ledger #9.
  6  Component states      = F  because Button ships default+hover only; grep of button.css
                              finds no :focus-visible, :disabled, or :active — against
                              component-specs.md's nine-state matrix (dimension 6).
                              Fix: add :focus-visible (3:1 ring, never outline:none alone),
                              :disabled (~3:1 text, dim the whole control not just text),
                              :active (a real pressed state, not a copy of :hover).
  8  Distinctiveness       = F  because 4 of 12 Ledger hits present: #1 (Inter, no second
                              face), #2 (purple-blue gradient hero), #7 (3-card feature grid,
                              generic sentence each), #10 (states, same as row 6 above).
```

Every finding: what it is, where, what it costs, what fixes it. No finding
without a location. No severity without a consequence. Every dimension score: what it is, the
grade, the specific evidence, and the cited row it's measured against — no evidence sentence, no
grade above F, per `anti-generic-standard.md`'s default-to-fail rule.

## A dead role is a diagnosis, not a verdict

"Unused" is a symptom with at least four causes, and the fix differs for each.
Never batch-delete the dead list — deleting is right about a quarter of the time.
The four roles in the example above resolved four different ways:

| Cause | Tell | Fix |
|---|---|---|
| **The contract leaked** | The *concept* is used, spelled out as a property. `--elevation-flush` was dead while seven rules wrote `box-shadow: none`. | Add a `--x-shadow` contract slot; states rebind it. Fix the component, keep the token. |
| **It's a synonym** | Resolves to the identical value as another role in *every* theme, and the ground it names doesn't exist. `--fg-on-accent` matched `--action-primary-fg` in all three. | Delete it. Two names for one value is how they drift into two values that were supposed to match. |
| **A real gap** | It solves a case the other roles measurably can't. `--status-warning-fg-on-surface` is the only amber that clears 4.5:1 on a plain surface, because warning's `-fg` is near-black ink for its fill. | Keep it, document it, and say when to reach for it. Unused ≠ unnecessary. |
| **A latent bug** | Something reads a primitive instead. `--bg-overlay` was dead because `dialog::backdrop` read `--alpha-overlay-light` directly and stayed light in dark mode. | Consume the role. The dead token was pointing at the bug. |

The pattern: **a dead role often indicts the code, not the token.** Before
deleting, grep for the *concept* — the literal value, the property, the primitive
underneath. If you find it spelled out by hand, you found a leak, and the role
was right all along.

## Two things to be honest about

**A clean exit code is not a verdict.** Say "the mechanical checks pass" and then
give your judgement on the nine items above separately.

**Report the checker's own false positives.** WCAG exempts disabled controls from
contrast; `margin: -1px` in the visually-hidden idiom is correct and must not be
tokenised; opt-out reduced-motion is as valid as opt-in; a page consuming the
space or type scale is not a layer violation. The script knows these four. If you
hit a fifth, say the script was wrong rather than filing a finding you don't
believe — one bogus finding costs you the other nine.

That last exemption was learned the expensive way: check 7's first version
flagged every scale read in page CSS and produced 54 findings, all false. A gate
that fires on correct code gets switched off, and then it stops catching the one
real thing. When a new check lights up dozens of hits in a system you have
already verified, suspect the check before the system.
