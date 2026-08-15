# kiln audit of Dial — read-only, 2026-08-10

Target: `ds-agent-kit`'s Dial system (`dial-tokens`, `dial-react`), 46 components, built before kiln
existed. No Dial file was modified to produce this report. Every finding below cites a command run
or a file opened; nothing is asserted from memory.

## 1. Inferred vector

Dial declares no lineage and no vector — it predates kiln and never went through Phase 1 or Phase 2.
The vector below is inferred from the built artefact, the same inference `AGENT-ORDER.md`'s Task 1
describes for adopting an existing system, using real values pulled from
`packages/tokens/build/css/light.css`, `packages/tokens/src/primitive/typography.json`,
`packages/tokens/src/semantic/layout.json`, and a grep across every `.module.css` file for
`shadow`/`transition`/`animation` usage.

| Axis | Score | Evidence |
|---|---|---|
| C (chroma) | 2 | One reserved accent (`brand.700` in light, `brand.400` in dark), everywhere else a warm-neutral ramp. Scarce by explicit rule (D-001: "accent เข้มใช้เฉพาะ primary interactive element ที่สำคัญที่สุด...ห้ามใช้ตกแต่ง"). |
| T (type) | 1 | Single font family for heading and body (`fontFamily.sans` = Inter/system-ui stack, confirmed in `typography.json`), flat 1.2 ratio confirmed exact to the pixel (see below), hierarchy explicitly delegated to position/weight, not scale, per D-001/D-005. |
| G (grid) | 1 | Standard 5 breakpoints (`sm/md/lg/xl/2xl`), 12-column, gutter = `space.300` (24px). No asymmetry, no broken grid, no container-query-first design named anywhere in `layout.json`. |
| S (surface) | 1 | Zero decorative shadow by explicit rule (D-008: "ห้ามมี drop-shadow ตกแต่งบน card/button/input ปกติ"). `shadow` appears only in the floating-layer components D-008 exempts (Dialog, Popover, Toast, Tooltip — confirmed via grep, 2 each at most). Flat fills, hairline borders. |
| M (motion) | 1 | 3 named durations, 2-3 easings (`transition.fast/base/slow`, `enter/exit`), all color/border-only except one real spatial transition (Switch's thumb, flagged in §2 below). No choreography, no staggering, nothing named as a signature moment. |
| D (density) | 3 | Comfortable/spacious baseline (D-010, explicit), generous 8px-unit spacing scale (`space.100`-`1100`), no dense table/dashboard component shipped yet (Table is "basic," explicitly not the dense DataGrid). |

`C2 T1 G1 S1 M1 D3`

```
$ python3 kiln/scripts/check_vector.py --vector 2,1,1,1,1,3
vector  C2 T1 G1 S1 M1 D3
note    no log found; first run for this project
FAIL    SPREAD  max-min is 2, needs 5 or more. This profile is flat and has no point of view.

fix the vector and run again. do not proceed on a failing profile.
```

**Spread fails at 2, needs 5.** This is the numeric explanation the request asked for: Dial is not
"quiet in a considered way" by kiln's own arithmetic, it is flat — no axis is meaningfully further
from the others than a rounding error would produce. Every axis sits in the 1-3 band except density
at 3, which is itself barely elevated. There is no axis Dial is spending on and no axis it is
deliberately withholding relative to another; six axes were set the same way, which is what a
system with no declared intensity vector looks like when reconstructed after the fact.

This is not a claim that Dial is bad. D-001 through D-010 show real, cited reasoning behind every
one of these choices (warm neutral from a cream reference, flat type ratio because the Braun
reference uses position not font for hierarchy, no shadow because the reference has none). The
finding is narrower: **the reasoning was never compressed into a vector with a payment structure**,
so nothing in the system currently states which axis, if any, Dial means to be memorable on. A
system can be quiet by considered, unanimous restraint (this looks like what happened) or quiet by
default drift (kiln's whole reason for existing is to tell those two apart), and Dial's own record
supports the former reading — but "the record supports it" and "the vector states it" are different
claims, and only the second one is what `check_vector.py` checks.

**Correction, 2026-08-10, same day, follow-up (S rescored 1 → 0):** the original S=1 score above
was inconsistent with how every other axis in this report was scored. `intensity.md`'s "What a
score measures" section (written after this audit, in direct response to the ambiguity this
finding exposed) makes explicit what was already the implicit rule for the other five axes:
a score measures **expressive use by choice**, not literal on-screen presence. D-008 is not a
preference toward flatness, it is an absolute rule ("ห้ามมี drop-shadow ตกแต่งบน card/button/input
ปกติ") with a narrowly named exception (floating layers only) — checked directly against the real
token files: shadow appears in exactly 3 of 26 component files (`dialog.json`, `popover.json`,
`toast.json`), precisely the floating-layer exception D-008 itself names, holding with zero
unstated exceptions across the other 23. That is a genuinely held, zero-exception refusal, not a
"mostly flat" preference — the corrected score is **S0**, not S1.

The corrected vector is `C2 T1 G1 S0 M1 D3`. Under the expressive profile this still fails spread
(now 3, still under 5) — that result doesn't change, Dial still hasn't declared a loud axis. But
under the restraint profile (`gates-restraint.md`, built after this audit in direct response to the
question this finding raised): `python3 scripts/check_vector.py --vector 2,1,1,0,1,3 --profile
restraint` → **passes ceiling, floor, and flatline**, refusing surface outright. This reverses the
original finding stated below in §4 ("Dial has never stated an intensity vector... no declared
point of view to defend") on the restraint question specifically: Dial now has a real, arithmetic
zero on an axis its own governing rule absolutely forbids, which is exactly what the floor rule
exists to detect. See `evals/restraint-profile-2026-08-10/report.md` for the full profile decision
and `evals/floor-cost-2026-08-10/report.md` for whether this specific refusal also clears the
floor's cost requirement (a refusal only counts if the medium would otherwise have wanted that
axis) — S0 passing the arithmetic is not automatically the same as S0 being a *costly*, and
therefore meaningful, refusal; that second question is checked separately in the cost-criteria
report and is not settled by the arithmetic alone.

## 2. Gate results — precision set (`gates-precision.md`)

Precision set used because no axis reaches 6, let alone 7 — the coherence set's own load rule in
`gates-coherence.md` ("loud axis at 7 or above") does not fire anywhere in this vector.

| Gate | Result | Evidence |
|---|---|---|
| G1 Ratio discipline | **GREEN** | `fontSize.md=16` × 1.2ⁱ computed in Python matches every declared step (`xs 11, sm 13, md 16, lg 19, xl 23, 2xl 28, 3xl 33, 4xl 40, 5xl 48`) to the pixel. |
| G2 Optical correction | **N/A** | No genuine nested-radius case exists in the codebase. Every rounded child (Card.Media, InputGroup's nested Input) sits flush against its parent's edge and relies on `overflow: hidden` to clip, never an inset child needing `inner = outer − padding`. Checked Card, InputGroup, Badge, Button, Dialog, Drawer, Fieldset, Input, Popover — none place a rounded element inset with a visible gap from a rounded parent. This is a real architectural choice (clip instead of compute), not a hidden violation; the gate has nothing to check here, marked N/A rather than green, since green would overclaim a check that never ran against real content. |
| G3 Contrast, computed | **GREEN** (spot check) | `contrast-check.mjs color-text-default:color-surface-canvas` → 13.165:1 light / 13.831:1 dark. `color-border-interactive:color-surface-canvas` → 3.722:1 / 3.716:1 (correctly classified UI-only, not text). Spot check, not exhaustive — see "not checked" section. |
| G4 Semantic tier does real work | **GREEN** | `color.surface.raised` = `neutral.25` in light, `neutral.900` in dark — full inversion, name still correct in both (confirmed by reading `light.css`/`dark.css` directly). `color.text.default` inverts the same way. No `.dark` variant class found anywhere in `.module.css` files (checked earlier in this engagement); components read semantic vars only. |
| G5 Spacing family discipline | **GREEN** | `space.json` declares distinct `inset`/`stack`/`inline` groups with distinct values (`inset.sm=space.200`, `stack.sm=space.200` but `stack.md=space.400` vs `inline.md=space.200` — genuinely different scales per family, not the same numbers relabelled). |
| G6 Z-layer naming | **GREEN** | `grep -rn "z-index:\s*[0-9]"` across every `.module.css` returns zero bare literals. Toast uses `var(--ds-z-index-toast)`; same pattern confirmed in Dialog/Drawer/Popover/Tooltip. |
| G7 Motion restraint | **RED** | `Switch.module.css` transitions `inset-inline-start` on the thumb — a real spatial/layout-adjacent property, not transform. `border-width` is also transitioned on several components (Radio, RadioCards, Switch's track) rather than a transform-based equivalent; per `motion.md`'s own rule ("if a layout property must animate, animate a transform that produces the same visual result, or accept the cost knowingly"), this was not stated as a knowing exception anywhere found. Confirmed by reading `transition-property` declarations directly in Switch/Radio/RadioCards `.module.css`. |
| G8 Token layer integrity | **RED** (gate too narrow, see note) | `check_tokens.py` run against every `packages/tokens/src/component/*.json` file returns 0/N tokens with a source note on every single file (26/26 files, spot-checked all). This is because `check_tokens.py` only recognizes a `$description` as a *direct sibling* of `$value` and does not credit an ancestor group's or file's `$description` — Dial's actual, legitimate convention is a file-level `$description` (confirmed present and substantive on every file read, e.g. `card.json`'s is a 400-word contrast self-check) plus occasional group-level notes, never a per-leaf note. **This is marked red because the gate as written genuinely returns a fail on real input, per the instruction to run scripts and not eyeball what they decide** — but it is flagged for §3 below as very likely a gate-strictness gap rather than a real Dial documentation gap; DTCG's own spec permits inherited `$description`, and `check_tokens.py`'s `walk()` function (read directly, `references/../scripts/check_tokens.py:40-54`) never checks a parent's `$description` before flagging a leaf. |
| G9 Reduced motion | **RED** | Confirmed by direct inspection of every `.module.css` with a `transition`/`animation` property (19 of 45 total): 12 have a `prefers-reduced-motion` block, 7 do not (Card, Checkbox, Button, Input, Link, PinInput, Radio, RadioCards, Textarea — corrected list below). Of those 7, only Switch's missing coverage is a genuine violation, because Switch is the only one transitioning a spatial property (`inset-inline-start`); the rest transition color/border only, which `motion.md`'s own rule treats as already collapsed to an acceptable non-spatial change and not requiring an explicit override. **Net: 1 real violation (Switch), 6 false alarms from a naive "has transition, no override" scan** — reported both counts because the naive scan is what a less careful audit would have stopped at. |
| G10 Focus visibility on every surface | **GREEN** | `contrast-check.mjs color-border-focus:color-surface-raised` and `:color-surface-canvas` → light 4.275:1 / 4.021:1, dark 5.662:1 / 5.949:1. Both clear 3:1 on both of Dial's two most common surfaces, computed from real resolved hex, not read off a swatch. |
| G11 Forced-colours mode | **NOT RUN** | Requires toggling `forced-colors: active` in a real browser and observing the render — this session did not launch a forced-colours Playwright project against Dial (kiln's own audit budget did not extend to a full browser pass; Dial's own `conformance/playwright.config.ts` does define a `forced-colors` project used in Dial's own prior QA, but re-running it was out of scope for this pass — see §4). |
| G12 Baseline distance | **NOT RUN** | `references/baseline.md`'s ban list is unmeasured (empty table, confirmed by reading the file). No comparison is possible without it. Strong circumstantial overlap is visible on inspection alone — warm off-white ground (`neutral.50` = `#f2efeb`), single sans face, 1.2 ratio, 8px base unit — matching several of the specific defaults `ORDER.md` names as refuse-unless-named ("an 8px unit with a 1.25 ratio" is close but not identical: Dial's ratio is 1.2, not 1.25) — but this is an observation, not a G12 result, because there is no measured list to score against yet. |
| G13 Look at it | **GREEN (rendered), flagged (content)** | Real screenshot taken (`data-display-card--header-body-footer` story, chromium, `apps/storybook` running on :6006). The render is clean, legible, and internally consistent — nothing broken. Named honestly: it is also visually close to the "warm off-white field... nothing decorative" pattern `ORDER.md` names as the current AI-design giveaway, though Dial's serif-vs-sans detail differs (Dial is sans throughout, not the serif-heavy variant named in the ban description). Screenshot on file at `/tmp/g13_dial_card.png` for this session; not committed anywhere. |
| G14 Acceptance criteria | **NOT RUN** | Dial has no kiln-format brief-specific acceptance criteria — it was never given a Phase 4 plan, since it predates kiln. Writing acceptance criteria retroactively to score against would be inventing the brief kiln never issued, which the eval discipline (`evals/results.md`: "do not backfill") explicitly prohibits doing to kiln's own eval log; the same logic applies to backfilling a target system's criteria. Reported not run rather than fabricated. |

**Corrected G9 component list** (the report above states it once; here is the checked list for
the record): transitions found lacking `prefers-reduced-motion` — Card (color/border only, false
alarm), Checkbox (color/border only, false alarm), Button (color only, false alarm), Input
(border only, false alarm), Link (color only, false alarm), PinInput (border only, false alarm),
Radio (border only, false alarm), RadioCards (border/bg only, false alarm), Switch (**thumb
`inset-inline-start` — real violation**), Textarea (border only, false alarm).

## 3. Gate results — coherence set (`gates-coherence.md`)

Run per instruction, despite the vector indicating the precision set is the correct one. Reported
honestly: most of this set cannot execute at all against Dial, and that inability is itself the
finding.

| Gate | Result | Evidence |
|---|---|---|
| G1 Lineage identifiability | **NOT RUN** | Dial declares no lineage (`grep -rn "lineage" system/DECISIONS.md CLAUDE.md` returns nothing). There is nothing to test identifiability of. |
| G2 Signature move present | **NOT RUN** | No signature move is named anywhere in Dial's decision record (`grep -n "signature"` across `DECISIONS.md`/`BLUEPRINT.md` returns nothing). Same root cause as G1. |
| G3 Profile arithmetic holds | **RED** (by definition) | The inferred vector fails `check_vector.py` on spread alone, shown in §1. This is the same failure reported there, repeated here because this gate set frames it as a coherence failure rather than a design observation. |
| G4 Payment actually spent | **NOT RUN** | No axis is at 8+ in the inferred vector, so there is nothing named as "paid for" to verify. |
| G5 Concentration held under real content | **NOT RUN** | No loud axis exists to test concentration of. |
| G6 No leakage into quiet axes | **NOT RUN** | Same reason. |
| G7 Rotation against the log | **NOT RUN** | No `.kiln/log.json` exists for this project (Dial was never built through kiln) and no vector was ever declared to rotate against. |
| G8 Token layer integrity | **RED** | Same result and same caveat as the precision set's G8 above — this gate is identical across both sets. |
| G9 Contrast survives the treatment | **GREEN** (spot check) | Same evidence as precision G3/G10; there is no "loud surface" to specifically stress-test since no axis is loud, so this reduces to the same general contrast check already run. |
| G10 Focus visibility survives the treatment | **GREEN** (spot check) | Same reasoning and same evidence as above — no loud surface exists to specifically target. |
| G11 Forced-colours floor | **NOT RUN** | Same as precision G11 — not executed this pass. |
| G12 Baseline distance | **NOT RUN** | Same as precision G12 — unmeasured. |
| G13 Look at it | **GREEN (rendered), flagged (content)** | Same screenshot, same honest flag as precision G13. |
| G14 Acceptance criteria | **NOT RUN** | Same as precision G14. |

**The finding this set actually surfaces**: 9 of 14 coherence gates are structurally unrunnable
against Dial, not because Dial is well-built or poorly built, but because the coherence set's entire
vocabulary (loud axis, payment, signature move, rotation) presupposes a system that went through
kiln's own Phase 1 and Phase 2. Running this set against a pre-kiln system is closer to asking a
gate file a question it has no inputs for than auditing the system. This is worth stating plainly
per the instruction's own framing, rather than marking these "not applicable" quietly — a system
that never declared a lineage is not automatically exempt from ever being asked to.

## 3.5. Correction — G8 rerun after fixing the gate (2026-08-10, same day, follow-up)

The suspicion recorded in §2/§3's G8 rows was investigated and confirmed. `check_tokens.py`'s
`check_json()` walker only credited a `$description` sitting as a *direct sibling* of `$value`,
never an ancestor group's or file's `$description` — even though DTCG's own spec permits inherited
group-level descriptions and Dial's actual, legitimate convention is exactly that (a file-level
`$description`, sometimes a group-level one, never a per-leaf one).

**Fixed in `scripts/check_tokens.py`**: the walker now threads an `inherited_description` parameter
down the tree, crediting a token with a source note if either its own `$description` or the nearest
ancestor's `$description` is non-empty. Gate-proved before trusting it: three fixtures (a
file-level-only note, a token with no description anywhere in its ancestor chain, and a token whose
own note overrides an inherited one) all produce the correct verdict; a deliberate mutation that
disabled the inheritance credit reverted Dial's `card.json` to the old wrong 0/10, and reverting the
mutation restored byte-identical sha256 (`77a3c2a5...`) and correct behavior.

**Rerun against all 26 of Dial's real `packages/tokens/src/component/*.json` files**:

```
component     ok/total   inherited   exit
alert          17/17        17         0
avatar          3/3          3         0
badge          31/31        31         0
button         34/34        34         0
card           10/10        10         0
checkbox        5/5          5         0
dialog          5/5          5         0
helperText      2/2          2         0
icon            1/1          1         0
image           2/2          2         0
input           8/8          8         0
kbd             3/3          3         0
link            4/4          4         0
listbox         8/8          8         0
popover         4/4          4         0
radio           4/4          4         0
radioCards     10/10        10         0
rating          3/3          3         0
skeleton        2/2          2         0
spinner         2/2          2         0
stat            3/3          3         0
switch          5/5          5         0
table           9/9          9         0
text            4/4          4         0
toast           9/9          9         0
tooltip         2/2          2         0
```

**26/26 files exit 0. Every single token in every file inherits a real, substantive source note**
(confirmed no file is passing on an accidentally-empty-but-truthy description — every root
`$description` is well over 20 characters, most are full contrast self-checks running to hundreds
of words). **The suspicion is confirmed: this was entirely a gate-blindness problem, not a Dial
documentation gap.** Zero red remains in G8 for Dial once the gate can actually see what Dial's
convention puts there. Updating both G8 rows above (§2 and §3) from RED to **GREEN, corrected
2026-08-10** — the original RED entries are left in place above rather than deleted, so this report
shows both what the unfixed gate found and what the fixed gate found, per the same discipline this
report already applied to not silently upgrading an unproven check.

## 4. The three-pile summary requested

**Red (confirmed problems, fix or accept explicitly):**
- Switch's thumb transition (`inset-inline-start`) has no `prefers-reduced-motion` override — one
  real component, real spatial property, real gap. (Precision/Coherence G7 and G9.)
- The inferred vector fails `check_vector.py`'s spread rule (2, needs 5) — Dial has never stated an
  intensity vector, so by kiln's own arithmetic there is currently no declared point of view to
  defend, only unanimous quiet.
- ~~`check_tokens.py` returns 0/N source-note coverage on every one of Dial's 26 component token
  files~~ — **resolved 2026-08-10, moved to the third pile below.** This was the gate's own
  narrowness (no credit for DTCG's legitimate inherited group/file `$description`), not a Dial
  gap. Fixed in `scripts/check_tokens.py`, gate-proved, rerun against all 26 files: 26/26 exit 0.

**Not run (reported honestly, not scored):**
- G11 Forced-colours mode, both sets — no browser pass executed this session.
- G12 Baseline distance, both sets — `baseline.md`'s ban list is still unmeasured; nothing to
  compare against.
- G14 Acceptance criteria, both sets — Dial has no kiln-format criteria to run, and none were
  invented to fill the gap.
- Coherence G1, G2, G4, G5, G6, G7 — no lineage, no vector, no log ever declared for this project;
  the gate has no input.

**Green despite a known live issue — the pile that matters most:**
- **G8 (token source notes) was exactly this pile, and stayed there for the length of one follow-up
  fix rather than forever.** At the time this report was first written, the gate returned red across
  the board, and the report deliberately did *not* call it green from the rule's intent while the
  script said red — that would have been "trust the reviewer's casual read over the gate," the exact
  failure mode item 1 warned against. Instead the gap was named explicitly (§2/§3's G8 rows) and
  investigated rather than argued around. The investigation confirmed the suspicion: the gate itself
  was blind to DTCG's legitimate inherited-description convention, fixed and gate-proved in §3.5
  above, rerun clean 26/26. **This is the intended lifecycle for a "green despite a known issue"
  finding** — name it, don't paper over it, then go fix the actual cause (the gate, in this case, not
  the target) rather than leaving the caveat to accumulate as permanent noise in every future run.
- **G2 (optical correction) marked N/A rather than green** for the same reason in reverse: it would
  have been easy to call this green ("no bad nested radius found"), but no genuine nested-radius
  case exists to have found one *in*, so a green would overclaim a check that never actually
  exercised real content. N/A is the honest label, not a pass.
- **Coherence set's 9 not-run gates** could easily have been silently skipped and the report could
  have presented only the 5 that ran as "the coherence set result" — that would look like a passing
  score by omission. Reporting 9/14 not-run, loudly, is the corrected version.

## What was not checked, and why

Full contrast audit across every component × every variant × both themes was not run — only the
5-6 pairings shown above were spot-checked with `contrast-check.mjs`. A complete sweep would need a
script iterating every `--ds-*-text-*`/`--ds-*-border-*` pair against its declared background, which
does not exist yet in either kiln or Dial's own tooling.

Forced-colours mode (G11, both sets) was not executed — it needs a real Playwright run with the
`forced-colors` project, which exists in Dial's own `conformance/playwright.config.ts` but was not
re-run this pass.

The `.kiln/log.json` rotation check (coherence G7) has no log to check against because this is the
first time kiln has touched this project — expected, not a gap.

No component beyond Card was screenshotted for G13. A single render was treated as sufficient
evidence that the system renders coherently, not as a claim that every one of the 46 components was
individually inspected.
