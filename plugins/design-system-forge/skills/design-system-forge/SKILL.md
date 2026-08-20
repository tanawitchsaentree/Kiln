---
name: design-system-forge
description: >
  Turn a single image, a screenshot, a mood board, or one small sentence into a complete,
  production-grade design system — tokens, components, all states, light/dark — plus a
  beautiful art-directed documentation shell (a Storybook-quality showcase, never an empty
  scaffold). Five verbs: BUILD a system from a seed, AUDIT an existing one and return a punch
  list without touching it, STUDY a reference to extract its design DNA as a portable brief,
  REDESIGN an existing interface with the same copy and a different visual fingerprint, or
  AUDIT-KIT to check this skill's own paths, counts, gates and dead files before packing it.
  Includes a creativity dial from "safe enterprise" to "fully experimental" so the same
  process serves a bank and an art studio. Trigger whenever the user wants a design system,
  design tokens, a component library, a UI kit, a style guide, a theme, or a Storybook/docs
  site — or drops an image and asks to "build a system from this", "make components like
  this", "extract the design", "turn this into a theme" — or asks whether an existing system
  is any good, or wants an interface redesigned. Trigger on:
  "design system", "design token", "component library", "UI kit", "style guide", "theme",
  "storybook", "audit my design system", "review my tokens", "is this accessible",
  "redesign this", "make it not look generic", "extract the design DNA", "study this",
  "สร้าง design system", "ทำ design token", "ทำ component library",
  "สร้างธีม", "ทำ UI kit", "แกะดีไซน์จากรูป", "เอารูปนี้มาทำระบบ", "ทำ style guide",
  "ทำ shell เก็บ component", "จากภาพนี้", "seed", "from this screenshot", "brand system",
  "make it consistent", "ทำให้มันเป็นระบบ", "ตรวจ design system", "ออกแบบใหม่",
  "ตีความ aesthetic", "รีดีไซน์". Use this INSTEAD of building one-off components
  when the user wants something reusable and systematic.
---

# Design System Forge — seed to system to showcase

You take the smallest possible input — one image, one sentence — and produce a **complete design system with a showcase worth looking at**. Most attempts fail in one of two ways: the system is thorough but ugly and generic, or it looks nice but is three components in a blank shell with no states, no dark mode, and no rules. You do neither.

## Pick the verb first

| Verb | Input | Output | Touches files? |
|------|-------|--------|----------------|
| **build** (default) | an image or a text seed | a full system + docs shell | yes |
| **audit** | a system that already exists | a punch list, severity-ordered | **no** |
| **study** | any reference — image, site, object | a portable `design.md` of its DNA | writes one file |
| **redesign** | an existing interface | same copy and IA, new fingerprint | yes |
| **audit-kit** | this skill itself | paths, counts, gates, dead files — exit = problems | **no** |

If the user's intent is ambiguous, say which verb you're running in one line and continue. Getting this wrong is expensive in one direction only: **`audit` must never edit, and `study` must never build.** Those two boundaries are the point of having separate verbs — a user who asks "is this any good?" and gets 40 changed files has lost the ability to judge their own system.

---

## build — the six systems

Run them in order. Do not skip System 0 or System 6.

### The one non-negotiable

**The creativity dial moves the expression. It never moves the completeness.**

A "safe" system and an "experimental" system have the same token layers, the same component states, the same accessibility floor, the same dark mode parity, the same documentation depth. Safe does not mean lazy, and bold does not mean unfinished. If you find yourself shipping fewer states because the theme is wild, stop — that is the failure mode this skill exists to prevent.

### System 0 — Set the dial and the scope (ask, don't assume)

Two answers needed before extracting anything. If the user hasn't given them, ask — this is the one moment where asking saves an entire wasted build.

**1. Creativity level (1–4).** Read `references/creative-dials.md` for the full policy per level.

| Level | Name | For | Signature |
|-------|------|-----|-----------|
| 1 | Safe | Banks, health, gov, B2B admin, regulated | Neutral base + one brand hue, restrained motion, flat surfaces |
| 2 | Refined | Default. SaaS, product teams, dashboards | One dominant hue + sharp accent, real type pairing, subtle depth |
| 3 | Bold | Consumer, brand-forward, marketing-adjacent | Display type at extremes, saturated commitment, one signature moment |
| 4 | Experimental | Editorial, agency, portfolio, art, games | Unexpected pairings, texture, asymmetry, full art direction |

No signal? **Default to Level 2** and say so in one line. Never silently pick 4 because it's more fun, and never silently pick 1 because it's safer.

**2. Target stack.** Changes the output format, not the design:
- **Zero-build** (HTML + CSS variables + vanilla JS) — fastest, works anywhere, best for handoff
- **React + Tailwind** — tokens as CSS vars consumed via Tailwind theme extension
- **React + CSS Modules / vanilla-extract** — tokens as typed exports
- **Existing codebase** — read what's there first, match it, extend it

If unclear, default to **zero-build for the shell** and note that components port cleanly later, since CSS-variable-driven components move into any framework with no rewrite.

### System 1 — Extract the brief from the seed

The seed is tiny. The brief is not. Write the brief out explicitly before any code — it is the contract everything downstream is checked against.

`references/study-verb.md` holds the full extraction method, including pixel sampling and the take/leave discipline. Read it if the seed is an image; the short version follows.

**Path A — from an image.** Separate **what to steal** from **what is incidental**. A photograph of a ceramic bowl is not a UI: take its palette, material feeling, and proportion — not a literal bowl-shaped button. Extract in this order: palette (5–8 named colours, which dominates, which is the 5% accent) → type *classification* (not the font) → spatial density → shape language → depth and texture → era and genre, named → the mood in one sentence.

If the image is a screenshot of existing UI, also note the layout grid, nav pattern, and component shapes — literal borrowing is appropriate there, but still upgrade the type and depth per the dial.

**Path B — from a small text seed.** Given "a fintech for farmers" or "ระบบจัดคิวร้านตัดผม", answer the five questions in `study-verb.md`, inventing and committing where the seed is silent, then write the same 7-point brief.

**Lock the brief** as a block the user can correct in one message:

```
BRIEF
Mood:      calm competence with a warm edge
Era:       Swiss grid, softened
Dominant:  deep slate  #1E2430
Accent:    signal amber #FFB020  (used at ~5%)
Type:      humanist sans, low contrast, wide  →  Instrument Sans + Söhne Mono
Density:   spacious (8px base, 1.6 body leading)
Shape:     6px radius, 1px hairline strokes
Depth:     one soft shadow layer + 2% grain
Level:     2 (Refined)
Stack:     zero-build
Never:     no purple gradients, no glassmorphism
```

Show it, then keep building — don't stop and wait unless the user asked to review it.

### System 2 — Build the token architecture

Three layers, always, at every creativity level. Read `references/token-architecture.md` for the full template and naming rules.

```
Layer 1  PRIMITIVES     raw values, no meaning        --gray-900, --amber-500, --size-4
   ↓                    never referenced by components
Layer 2  SEMANTIC       roles, meaning, themeable     --bg-surface, --fg-muted, --border-focus
   ↓                    this is the ONLY layer a theme redefines
Layer 3  COMPONENT      per-component contracts       --btn-bg, --btn-fg, --card-pad
                        always resolve to Layer 2
```

Four rules that make or break the system:

1. **Components read Layer 3 or Layer 2 only.** A component reading `--gray-900` directly is a bug — it cannot be re-themed and it will break in dark mode.
2. **Themes swap Layer 2 only.** If you're redefining primitives per mode, the semantic layer is too thin.
3. **Zero hardcoded values in component CSS.** No hex, no px for spacing, no ad-hoc durations. Every value traces to a token. System 6 checks this.

   **Page-local CSS is system CSS.** A rule in an inline `<style>` obeys the same layers as one in a `.css` file. Inline blocks are where layer discipline quietly dies, because most checkers only walk `.css` — a hero reading `var(--ember-400)` directly looks fine and then renders identically in dark mode. Reading a scale step (`--space-3`, `--text-sm`) from a page is fine; reading anything a theme swaps is not.
4. **Every theme must be assertable at any depth.** Declare light on both `:root` and `[data-theme="light"]`, never `:root` alone — otherwise a light subtree inside a dark page silently inherits dark, and every per-preview theme toggle in your docs is broken while the page still looks fine.

Generate the full set: colour (semantic roles for surface/content/border/interactive/status), type scale, spacing scale, radius, shadow, motion, z-index, breakpoints. Do not ship a partial token set and fill gaps with magic numbers later.

**Two borders, not one.** `--border-subtle` for dividers has no contrast floor (SC 1.4.11 exempts decorative lines); `--border-control` identifies a control and must clear 3:1. Collapsing them into one token forces you to either fail the floor or over-darken every divider.

**A border sits between two grounds.** Check it against both — the page surface *and* its own fill. Status borders that pass against the page while failing against their own tint are the most commonly missed contrast defect.

### System 3 — Build the components

Read `references/component-specs.md` for the roster, state matrix, and per-component anatomy, and `references/motion-system.md` for the required motion moment per component class — a state without motion is not restrained, it's unfinished.

Build in tiers, and **finish each tier before starting the next** — a system with 30 half-done components is worth less than one with 12 complete ones.

- **Tier 1 — Primitives:** Button, Input, Textarea, Select, Checkbox, Radio, Switch, Label, Badge, Avatar, Link, Kbd, Spinner
- **Tier 2 — Composites:** Card, Alert, Tabs, Accordion, Dialog, Menu, Tooltip, Toast, Table, Pagination, Breadcrumb, Progress, Skeleton, EmptyState
- **Tier 3 — Patterns:** Form layout, Header/nav, Sidebar, Page shell, Data table, Auth screen

**Every interactive component ships all of these or it is not done:**

`default` · `hover` · `active` · `focus-visible` · `disabled` · `loading` (where an action occurs) · `error` (where input occurs) · plus its size and variant axes.

`focus-visible` is the one that gets skipped and the one that matters most — it is the entire keyboard experience. Never remove an outline without replacing it with something equally visible.

Mirror every pseudo-class with `[data-force="…"]` carrying **identical** declarations, so the docs can show all states at once and regression tooling has a stable surface. Keep the attribute values consistent with the CSS or you get default-looking cells wearing the wrong label.

### System 4 — Build the shell (the part everyone gets wrong)

The shell is a documentation site for the system, and it must be **as designed as the system it documents**. A blank white page with `<h2>Button</h2>` and one button is a failure even if the button is perfect.

Read `references/shell-blueprint.md` for the token contract, structural classes, three chrome presets, and the quality bar.

The key idea: namespace the chrome separately.

```
--shell-*    nav, sidebar, ToC, page chrome     ← stays navigable, calm, high-contrast
--*          the design system being shown      ← can be as wild as Level 4 wants
```

This is what makes Level 4 possible. If the chrome inherits an experimental theme, the navigation becomes unusable and the system becomes impossible to evaluate. The chrome should feel like a well-made gallery: quiet, confident, clearly a different layer from the work on the walls — art-directed to recede.

**The chrome is exempt from the system's token layers, not from having its own.** Declare every `--shell-*` value in one block and consume it by name; scattering literals through the chrome file produces a stylesheet nobody can retheme sitting next to a system built on strict layers.

Required pages: **Overview** (art-directed hero + locked brief + measured stat row), **Foundations** (live swatches with computed ratios, real type specimen, spacing with a proximity demo, motion demos), **Components** (10-point treatment each, all-states grid mandatory), **Patterns**, **Playground** (kitchen sink + forced light/dark side by side), and **Rules** reachable from the chrome.

Required features: two independent theme toggles, copy-to-clipboard on every code block, live token reads via `getComputedStyle`, computed contrast ratios, sticky nav + ToC with scroll-spy, full keyboard navigability, `localStorage` persistence.

**Storybook instead?** Read `references/storybook-adapter.md`. Storybook gives you controls, interaction testing, a11y addons, and an ecosystem, but you'll fight its chrome for a distinctive look. The custom shell gives total visual control and zero config, but you rebuild controls and testing yourself. Level 3–4 where the showcase is part of the pitch: custom usually wins. Level 1–2 inside an engineering org: Storybook usually wins.

### System 5 — Write the rules

A system without rules decays back into inconsistency within weeks. Ship a short, opinionated `RULES.md` — not a style essay, a list of decisions:

- When to use each button variant, and which one is the page's single primary
- The allowed spacing pairs, and the proximity law (related things closer than unrelated things)
- Which type scale steps are for what, and the ban on off-scale sizes
- How to add a new component without breaking the system
- What is deliberately excluded, and why

Record the **reasoning behind hard-won decisions**, especially the ones that look arbitrary. "This token has one content level because any darker step lands within 1.3:1 of the other one" stops someone re-adding it in six months. A rule with its proof attached survives; a bare prohibition gets overturned.

End it with the **runnable commands**, `audit.py` among them. A rule nobody can check is a rule nobody keeps, and the person who inherits the system will not reconstruct the audit invocation from memory.

If `spacing-control` is available, use it for the spacing scale and density modes rather than inventing a parallel one.

### System 6 — Verify before you claim it's done

**Run the audit script rather than eyeballing it:**

```bash
python3 ~/.claude/skills/design-system-forge/assets/audit.py .
```

Contrast in every theme, borders against both grounds, token purity, dead tokens, theme drift, motion guards, page-local `<style>` blocks reading themed primitives, and state rules with no motion property at all (nothing static, per `references/motion-system.md`). Exit code is the failure count. Then check what no script can:

- [ ] **Keyboard path** — tab through the shell and every demo. Focus always visible, order logical, dialogs trap and restore focus
- [ ] **Dark mode parity** — every component and page in both modes. Check shadows; they usually break
- [ ] **Counts are measured** — every number in the stat row came from a script, not an estimate
- [ ] **Brief adherence** — reread the locked brief. Does it feel like the mood sentence? If it drifted toward generic, name where and fix it
- [ ] **The nine-dimension pass** — run the exact same standard `audit` scores against: read `references/anti-generic-standard.md`, default every dimension to F, grade each with its evidence sentence, and count real hits on the thirteen-item AI-Slop Ledger before calling this done. A system that hasn't cleared this is not verified, whichever verb built it.

**Verify in a browser, not just statically.** Static checks miss what rendering catches: clipped headings, a chevron whose two halves don't join, a forced-light panel rendering dark. Load the pages, screenshot them, and look.

**Prove your gate fails.** A checker that has only ever passed is not known to work. Break a token deliberately, confirm non-zero exit, restore. Then you can claim it. `assets/selftest.py` is that discipline made runnable for `audit.py` — it plants a violation of each counted gate against a synthetic system and requires every one to go red, and it also requires the *uncounted* checks to stay quiet, because a checker that counts what it promised not to count makes every clean report an overstatement.

**Prove it against a copy, and assert on which gate fired.** A plant-and-revert that edits real files is one interrupted run away from shipping the violation as content. And a plant that trips two gates proves neither — deleting a file to break check A also breaks every path citing it, so watch the specific check's count, not the exit code. Both mistakes were made here before they were written down.

**Before packing or handing off this kit, run `assets/audit_kit.py` and do not pack on a non-zero exit.** See `references/audit-kit-verb.md`.

**Make two counts of the same thing and compare them.** A single number is unfalsifiable; two that disagree hand you the bug. Here the docs page counted 211 tokens from `document.styleSheets` and `audit.py` reported 212 — a one-off worth shrugging at, except chasing it found the script's rule parser keeping only the *last line* of a selector, so `:root,\n[data-theme="light"]` parsed as light-only. Every semantic role was landing in the light override and none in the base table. The gap that surfaced it was a rounding-level 1; the defect under it silently mis-resolved every theme (contrast coverage went 128 → 134 checks once fixed). Disagreement between two derivations is the cheapest bug detector you have — build the second one in.

Report failures honestly rather than quietly fixing the check. State plainly what was built, what was verified, and what was left out.

---

## audit — score it, don't touch it

Read `references/audit-verb.md`. Run `assets/audit.py`, read its warnings and unpaired list rather than only its exit code, then run the nine dimensions no script can score — `references/anti-generic-standard.md` holds the sourced standard, the AI-Slop Ledger, and the default-to-fail grading rule, and audit-verb.md applies it. Report severity-ordered by consequence, every finding with a location and a fix, every dimension score with its evidence sentence.

**Change nothing.** A clean exit code means the mechanical checks pass, not that the system is good — say those separately. If the user then asks for fixes, that's a new instruction and you switch to `build` rules.

## study — extract the DNA, build nothing

Read `references/study-verb.md`. Emit a one-page `design.md`: mood, era, level, palette with shares, type classification, density, shape, material, motion character, take/leave, and a confidence note distinguishing measured values from estimated ones.

Sample the pixels if you can reach the file; if you read it by eye, **say so** with the likely error, because a 5% palette error can move a contrast ratio across its floor. Then **stop** — the user asked you to interpret, and the whole value is that they can correct the reading before 200 tokens depend on it.

## redesign — same content, different fingerprint

Read `references/redesign-verb.md`. Inventory routes, components, states, and copy first; run `audit` on the original to inherit its real accessibility floor. Name what it currently reads as — that sentence becomes the forbidden list — then move **at least three** axes meaningfully (type classification, colour strategy, spacing rhythm, shape opinion, material, composition). Changing indigo to teal is a recolour, not a redesign.

Copy and IA are immutable, and they constrain the layout rather than the reverse. If a preserved string doesn't fit your new hero, the hero is wrong. Then it's `build` from System 2 onward, plus a feature-parity check and proof that accessibility didn't regress.

## audit-kit — turn the standard inward

Read `references/audit-kit-verb.md`. Run `assets/audit_kit.py`: five checks, exit code is the problem count — every backticked path resolves, every "proven gate" claim has a selftest that runs, every documented number is re-derived and compared, every reference file has a real load instruction, every SUPERSEDED points at a winner that exists. `--selftest` plants one violation of each class into a temp copy and requires each check to go red.

**This is a precondition, not an option: run it before packing or handing off this kit, every time, and do not pack on a non-zero exit.** The failures it catches are the ones invisible from the inside — a path that stopped resolving, a count that drifted after an edit, a proof that was true once and got discarded. Its first honest finding was `audit.py`'s own header claiming six checks after the seventh was added.

---

## Decision tree

```
User input arrives
  │
  ├─ Editing, packing, or handing off THIS SKILL?
  │    → AUDIT-KIT first. audit_kit.py must exit 0 before you pack.
  │
  ├─ "is this any good / review / audit / ตรวจ" + an existing system?
  │    → AUDIT. Run audit.py, add the human checks, report. EDIT NOTHING.
  │
  ├─ "interpret this first / what's the aesthetic / ตีความก่อน"?
  │    → STUDY. Emit design.md. STOP before System 2.
  │
  ├─ "redesign this / make it not look generic / ออกแบบใหม่" + existing UI?
  │    → REDESIGN. Inventory + audit first, then build. Copy is immutable.
  │
  ├─ An image / screenshot / mood board?
  │    → BUILD: System 0 (dial + stack), System 1 Path A, then 2→6
  │
  ├─ A one-line text seed?
  │    → BUILD: System 0, System 1 Path B (invent and commit), then 2→6
  │
  ├─ An existing codebase to systematize?
  │    → Read the code FIRST. Inventory existing colours/fonts/spacing.
  │    → System 1 becomes "extract the implicit system, then fix its inconsistencies"
  │    → Default to Level 1–2; a refactor is not the moment for art direction
  │
  ├─ "Just the tokens / just a theme"?
  │    → Systems 0, 1, 2, and a Foundations-only shell. Skip Tier 2–3 components.
  │
  └─ "Add a component to an existing system"?
       → Skip to System 3, obey the existing token layers, then System 4 page + System 6
```

## References

Read the relevant file **before** writing code, not after:

- `references/creative-dials.md` — the 4 levels as concrete policy: font libraries, colour strategies, shape/depth/motion budgets, and what each level forbids
- `references/token-architecture.md` — 3-layer model, naming conventions, full CSS variable template, theme strategy, type/space scale math
- `references/component-specs.md` — component roster, the state matrix, per-component anatomy and a11y requirements
- `references/motion-system.md` — timing hierarchy, easing vocabulary, distance–duration relationship, purpose tags (`feedback`/`orientation`/`delight`), and build recipes for every named Level 3–4 technique — read this before building any interactive moment, not as a finishing pass
- `references/shell-blueprint.md` — chrome token contract, layout, structural classes, three presets, and the quality bar
- `references/audit-verb.md` — how to run and read the audit, the nine dimensions, reporting format
- `references/anti-generic-standard.md` — the sourced standard (Anthropic and Google Material Design 3, checked against live artifacts) behind the nine dimensions, the thirteen-item AI-Slop Ledger, and the default-to-fail grading rule — read this before scoring anything in `audit` or System 6
- `references/study-verb.md` — DNA extraction, pixel sampling, take/leave discipline, the `design.md` format
- `references/redesign-verb.md` — inventory, fingerprint displacement, the axes table, copy-preservation rules
- `references/storybook-adapter.md` — CSF3 setup, theme decorator, custom Storybook theming, the honest tradeoff table
- `references/audit-kit-verb.md` — read this before editing or packing this kit: the five self-checks, why each exists, and how the auditor is itself proven
- `assets/audit.py` — the contrast/purity/drift/motion/inline-CSS checker. Runs standalone on any project.
- `assets/selftest.py` — plants a violation of each of audit.py's counted gates and requires every one to go red. This is what makes "proven gate" a claim rather than a hope.
- `assets/audit_kit.py` — the kit auditing itself. Mandatory before packing; `--selftest` proves its own checks fire.
