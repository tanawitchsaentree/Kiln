# Gate Proof — kiln, 2026-08-10

Applies the Gate Proof Rule (mutate → confirm-red → revert → confirm-sha-match, or for unscripted
gates: construct a pass/fail fixture pair and show the written criteria discriminate them) to the 3
most load-bearing gates in each of kiln's two gate sets. Fixtures live in `/tmp/gate-proof/` (not
committed anywhere); this directory is the permanent eval record.

## Summary

| Gate | Proven | One-line why |
|---|---|---|
| Precision G8 — Token layer integrity (`check_tokens.py`) | **Yes** | Disabling the raw-value regex check made the script wrongly pass a real hardcoded-hex violation; reverted, sha256 matches. |
| Precision G3 — Contrast, computed not eyeballed | **Yes** | WCAG relative-luminance formula on two real hex pairs cleanly separates a 2.38:1 fail from an 8.86:1 pass against the gate's stated 4.5:1 line. |
| Precision G1 — Ratio discipline | **Yes** | One token file traces to a constant 1.2500 ratio across 5 steps; the other has no stated ratio and its actual step-to-step ratios vary (1.18–1.42) — the gate's "trace to a stated ratio... not a value that happened to look right" language cleanly catches the difference. |
| Coherence G3 — Profile arithmetic holds (`check_vector.py` spread) | **Yes** | Disabling the spread check made a flat vector (max-min=2) wrongly pass; reverted, sha256 matches. |
| Coherence G4 — Payment is actually spent (`check_vector.py` payment, code-level proxy) | **Yes, with caveat** | Disabling the payment check made an underpaid extreme-axis vector (1 quiet axis, needs 2) wrongly pass; reverted, sha256 matches. This proves the arithmetic proxy only — see caveat below on G4's own "built artefact" requirement, which is unscripted and unproven. |
| Coherence G1 — Lineage identifiability | **Partially proven / caveat** | A nautical-chart mock and a generic bold-hero mock produce visibly different "would you know the lineage without the wordmark" verdicts, but the gate's stated evidence bar ("one sentence on what would give it away") is satisfiable even by a weak, ungrounded but plausible-sounding sentence — see write-up for the gap. |

6 of 6 gates tested produce a real, demonstrated discriminating signal. 5 are fully proven by the
strict letter of the Gate Proof Rule (script mutation or clean pass/fail pair). 1 (Coherence G1) and
half of 1 (Coherence G4's artefact-delivery half) are flagged with honest caveats about evidence-bar
looseness or missing tooling rather than reported as a clean pass.

---

## Pick rationale (one line each)

**Precision set:**
- **G8** (token layer integrity) — the only precision gate backed by a script; if it silently
  always passed, every hardcoded value and undocumented token in the whole system goes
  undetected, which defeats the entire token-architecture premise of the skill.
- **G3** (contrast, computed not eyeballed) — an accessibility floor; if this silently passed,
  systems with genuinely unreadable text/UI ship, and no other gate catches it (G9/G10 are
  contrast's siblings for reduced-motion/focus, not for base text).
- **G1** (ratio discipline) — the gate against "values that happened to look right," which is
  the single failure mode this whole skill exists to prevent (arbitrary design masquerading as a
  system). If G1 always passed, a system with zero real structure could stamp itself as
  disciplined.

**Coherence set:**
- **G3** (profile arithmetic holds) — the load-bearing gate on the vector itself; if this always
  passed, a system with no point of view (flat vector) or an internally contradictory profile
  ships as if it were deliberate.
- **G4** (payment is actually spent) — the gate that catches the vector's numbers being cosmetic;
  a system can pass G3's arithmetic on paper while never actually delivering the quiet axes it
  claims paid for the loud one. This is described in the gate text itself as the exact gap G3
  doesn't close.
- **G1** (lineage identifiability) — the gate against "generic bold interface with a wordmark
  slapped on," which is coherence's version of precision's G1: it's the check that the loudness
  is actually *this* system and not an interchangeable default with more contrast/scale turned up.

---

## Precision G8 — Token layer integrity

**Gate text:** `scripts/check_tokens.py` run against the actual token file. Zero tokens missing a
source note, zero raw values found outside the token block.

**Why load-bearing:** it's the only enforcement of the "every value has a documented origin"
premise that the rest of the skill's token-architecture language depends on. If it's a no-op, a
system can ship raw hex/rgba scattered through component rules while still claiming token
discipline.

**Mutation:** disabled the raw-value-outside-block check in `scripts/check_tokens.py` by changing:

```python
-        if RAW.search(line):
+        if False and RAW.search(line):
             raw_outside.append((i, line.strip()[:70]))
```

**Test input (real violation):** `/tmp/gate-proof/tokens-raw-outside.css`:
```css
:root {
  --color-brand-500: #3b6ef0; /* primitive, source: brand hue rotation from ORDER.md step 4 */
}
.button {
  background-color: #3b6ef0;
}
```

**Confirmed-red (original, unmutated script):**
```
$ python3 scripts/check_tokens.py /tmp/gate-proof/tokens-raw-outside.css
tokens with a source note   1/1

FAIL  raw value outside the token block:
  L5  background-color: #3b6ef0;

A token with no source note is a default wearing a variable name.
exit=1
```

**Confirmed-wrongly-green (mutated script, same file):**
```
$ python3 scripts/check_tokens.py /tmp/gate-proof/tokens-raw-outside.css   # mutated
tokens with a source note   1/1
G8 passes.
exit=0
```
This proves the raw-value check was doing real work — disabling it changed the verdict on a real
violation from fail to pass.

Also confirmed the missing-source-note half of G8 on the original script against
`/tmp/gate-proof/tokens-missing-note-only.css` (a token with no `/* ... */` note):
```
tokens with a source note   1/2

FAIL  no source note:
  --color-brand-600
exit=1
```
And confirmed a clean file (`/tmp/gate-proof/tokens-clean.css`, token referenced via `var()`, no
raw value, every token noted) passes: `G8 passes. exit=0`.

**Revert + sha256:**
```
sha256 before mutation: ede60ab9cd618b5a3fab2859c90c12054cd9a881585a046c95aec03ea50ac5b6
sha256 after revert:    ede60ab9cd618b5a3fab2859c90c12054cd9a881585a046c95aec03ea50ac5b6
```
Byte-identical. Re-ran the raw-outside test against the reverted script and confirmed it fails
again (exit 1), i.e. the revert didn't just match bytes but restored real behavior.

**Verdict: this gate is proven.** The script enforces a genuine, disableable rule, and the
original correctly separates a violating token file from a clean one.

---

## Precision G3 — Contrast, computed not eyeballed

**Gate text:** every text pairing clears 4.5:1, every UI-boundary pairing clears 3:1, computed from
the actual resolved values — not estimated, not read off a swatch.

**Why load-bearing:** this is the base accessibility floor for all text in the system. Unlike
G9 (reduced motion) or G10 (focus visibility), which are specific interaction states, G3 covers
every ordinary text pairing the system ships. If this silently always passed, systems with
genuinely unreadable body text ship as "accessible."

**No script ships with kiln for this** (`grep -rn contrast` across `scripts/`, `SKILL.md`, and
`references/*.md` found no contrast-checking tool — only prose mentions in `constraint.md`). So
this is a criteria-discrimination test, not a script mutation. Used a small WCAG relative-luminance
helper (`/tmp/gate-proof/contrast.py`, standard sRGB→linear→relative-luminance→contrast-ratio
formula, the same one the gate expects to be applied to "actual resolved values") to compute real
numbers for two hex pairings.

**Test case construction:**
- FAIL case: light-gray text `#a8a8a8` on white `#ffffff` background — a common "looks readable
  enough" mistake.
- PASS case: dark-gray text `#4a4a4a` on white `#ffffff` background.

**Confirmed-red / confirmed-pass (exact computed values):**
```
$ python3 contrast.py "#a8a8a8" "#ffffff"
#a8a8a8 vs #ffffff: 2.38:1        <- fails the stated 4.5:1 text floor

$ python3 contrast.py "#4a4a4a" "#ffffff"
#4a4a4a vs #ffffff: 8.86:1        <- clears the stated 4.5:1 text floor
```

**Reasoning against the gate's own criteria:** the gate says "computed from the actual resolved
values ... not estimated." 2.38:1 vs 8.86:1 is not a borderline judgment call — the gate's 4.5:1
line unambiguously separates them. A reviewer applying the stated criterion literally (compute the
ratio, compare to 4.5) reaches the correct verdict in both directions with no room to argue either
way.

**Verdict: this gate is proven.** The written criterion (4.5:1 text / 3:1 UI-boundary, computed not
eyeballed) is specific enough to discriminate a real near-miss failure (2.38:1, which *looks*
plausible at a glance — this is exactly the "eyeballed" trap the gate is written to prevent) from a
real pass (8.86:1).

---

## Precision G1 — Ratio discipline

**Gate text:** every type size, spacing step, and radius scale traces to a stated ratio or a stated
unit multiplication, not to a value that happened to look right. Evidence: the ratio stated, and
every scale value shown as that ratio applied N times.

**Why load-bearing:** this is the single check against the failure mode the whole skill exists to
prevent — a system that looks disciplined (has a "scale," has token names) but is actually
arbitrary numbers chosen by eye. If G1 always passed, a system could stamp arbitrary design as
principled with zero actual verification.

**Test case construction — two DTCG-style token files:**

`/tmp/gate-proof/g1-pass-ratio-tokens.json` — steps declare `"$description": "16 * 1.25^N, source:
type ratio 1.25"` and the values are `10.24, 12.8, 16, 20, 25, 31.25`.

`/tmp/gate-proof/g1-fail-random-tokens.json` — steps declare `"$description": "looked right"` (no
ratio claimed) with values `11, 13, 16, 19, 27, 34`.

**Confirmed-red / confirmed-pass — computed step-to-step ratios:**
```
pass file  [10.24, 12.8, 16.0, 20.0, 25.0, 31.25]
  12.8/10.24 = 1.2500
  16.0/12.8  = 1.2500
  20.0/16.0  = 1.2500
  25.0/20.0  = 1.2500
  31.25/25.0 = 1.2500

fail file  [11.0, 13.0, 16.0, 19.0, 27.0, 34.0]
  13.0/11.0 = 1.1818
  16.0/13.0 = 1.2308
  19.0/16.0 = 1.1875
  27.0/19.0 = 1.4211
  34.0/27.0 = 1.2593
```

**Reasoning against the gate's own criteria:** the pass file's ratio is constant at 1.2500 across
every step and the description explicitly names the ratio and source — satisfies "traces to a
stated ratio ... shown as that ratio applied N times" exactly. The fail file's description names no
ratio ("looked right") and the actual computed ratios wander from 1.18 to 1.42 with no constant —
this is precisely "a value that happened to look right," the gate's own named failure case. A
reviewer applying the criterion literally reaches the correct verdict on both without ambiguity.

**Verdict: this gate is proven.** The gate's evidence bar ("the ratio stated, and every value shown
as that ratio applied N times") is concrete enough that it can't be satisfied by a token file with
no stated ratio and inconsistent actual ratios — the fail case has nothing to point to, and the
pass case has an exact, checkable answer.

---

## Coherence G3 — Profile arithmetic holds

**Gate text:** `scripts/check_vector.py` run against the final vector. Evidence: the script's
output, exit code included.

**Why load-bearing:** this is the arithmetic gate on the vector itself — the six-axis
declaration every downstream phase (build, other gates) treats as ground truth. If the spread
check (one of the four rules inside the script) is a no-op, a system with a genuinely flat, no-
point-of-view profile (e.g. `5,5,4,5,6,5`, spread=2) stamps itself as having a coherent loud/quiet
argument when it has none.

**Mutation:** disabled the spread check in `scripts/check_vector.py`:
```python
-    if spread < 5:
+    if False and spread < 5:
```

**Test input (real violation):** vector `5,5,4,5,6,5` (spread = max−min = 2, well under the
required 5).

**Confirmed-red (original script):**
```
$ python3 scripts/check_vector.py --vector 5,5,4,5,6,5
vector  C5 T5 G4 S5 M6 D5
note    no log found; first run for this project
FAIL    SPREAD  max-min is 2, needs 5 or more. This profile is flat and has no point of view.
exit=1
```

**Confirmed-wrongly-green (mutated script, same vector):**
```
$ python3 scripts/check_vector.py --vector 5,5,4,5,6,5   # mutated
vector  C5 T5 G4 S5 M6 D5
note    loud axis is motion at 6
note    no log found; first run for this project
passes spread, concentration, payment, rotation.
exit=0
```

Also confirmed the original script correctly passes a genuinely well-spread vector
(`3,8,2,1,2,6`, spread=7): `passes spread, concentration, payment, rotation. exit=0`.

**Revert + sha256:**
```
sha256 before mutation: 8f75c4269cfa56bf1ca6061cad0356186193454aa708d551aa598de23800d9f3
sha256 after revert:    8f75c4269cfa56bf1ca6061cad0356186193454aa708d551aa598de23800d9f3
```
Byte-identical. Re-ran both the flat-vector fail case and the well-spread pass case against the
reverted script and confirmed original behavior restored (fail case → exit 1 again).

**Verdict: this gate is proven.** The spread rule inside `check_vector.py` is real and
disableable, and its removal measurably changes a genuinely flat vector from fail to pass.

---

## Coherence G4 — Payment is actually spent, not just declared

**Gate text:** for every axis at 8+, the two axes named as paying for it are verifiably quiet in
the *built artefact*, not just in the stamp's stated numbers. Explicitly: "A vector can pass
`check_vector.py`'s arithmetic while the built system fails to actually deliver the quiet axes it
claimed." Evidence: one concrete example of the paying axis actually being quiet where it
mattered — a screenshot, not a description.

**Why load-bearing:** this is the gate that stops the vector's numbers from being decorative. A
system can declare "chroma pays for density" on paper and never actually deliver a quiet chroma
anywhere in the built system — G3's arithmetic alone can't catch that, because arithmetic only
checks the stamp, not the artefact. G4 is coherence's answer to precision's "look at it" problem,
specifically for the payment claim.

**Important scoping note:** G4 as written is explicitly about the *built artefact*, which this
task's script-mutation protocol doesn't reach (there's no script that inspects a real rendered
system for quiet-axis delivery — that's inherently a look-at-it gate, same category as G13/coherence-
G1). What *is* script-backed and directly upstream of G4 is the **payment arithmetic check** inside
`check_vector.py` (the `PAYMENT` rule: any axis ≥8 requires ≥2 axes ≤2) — this is the arithmetic
half of the payment claim, and it's the piece I could mutate and prove. I'm reporting this as
proof of the arithmetic proxy, with the artefact-level claim left as a caveat rather than papered
over.

**Mutation:** disabled the payment check in `scripts/check_vector.py`:
```python
-        if len(quiet) < 2:
+        if False and len(quiet) < 2:
```

**Test input (real violation):** vector `3,9,2,5,5,6` — type axis at 9 (≥8, "extreme"), but only
one axis (`G` at 2) is ≤2; the rule requires two.

**Confirmed-red (original script):**
```
$ python3 scripts/check_vector.py --vector 3,9,2,5,5,6
vector  C3 T9 G2 S5 M5 D6
FAIL    PAYMENT type at 8 or above needs two axes at 2 or below. Found 1.
exit=1
```

**Confirmed-wrongly-green (mutated script, same vector):**
```
$ python3 scripts/check_vector.py --vector 3,9,2,5,5,6   # mutated
vector  C3 T9 G2 S5 M5 D6
note    loud axis is type at 9
passes spread, concentration, payment, rotation.
exit=0
```

**Revert + sha256:**
```
sha256 before mutation: 8f75c4269cfa56bf1ca6061cad0356186193454aa708d551aa598de23800d9f3
sha256 after revert:    8f75c4269cfa56bf1ca6061cad0356186193454aa708d551aa598de23800d9f3
```
Byte-identical (same file as G3's mutation above — both mutations were applied and reverted in the
same session against the same original copy at `/tmp/gate-proof/check_vector.py.orig`; the final
revert restores both rules simultaneously, confirmed by re-running both the spread and payment fail
cases in sequence against the reverted file and seeing both fail correctly).

**Verdict: this gate is proven for its script-backed arithmetic half; the artefact-delivery half
(the part the gate text actually emphasizes — "verifiably quiet in the built artefact... not
description") remains unscripted and unprovable by mutation, and is honestly the weaker half of
this gate as currently written.** The gate's own text anticipates this gap ("a vector can pass the
arithmetic while the built system fails to deliver") — which means the gate is aware of its own
incompleteness, but nothing in kiln currently forces the artefact-level check to happen beyond an
instruction to "screenshot the calmest screen." Recommend treating G4's artefact-evidence
requirement with the same seriousness as G13/coherence-G1 in any future audit — it currently has no
tooling and depends entirely on the agent's discipline.

---

## Coherence G1 — Lineage identifiability

**Gate text:** screenshot the system, remove the wordmark, ask whether it is still identifiable as
*this* system rather than a generic bold interface. Evidence: the screenshot, and one sentence on
what specifically would give it away without the name.

**Why load-bearing:** this is coherence's version of precision's G1 — the check against a loud
system that's actually an interchangeable default with the volume turned up rather than a real
declared lineage doing real work. If this always passed, "bold" could substitute for "coherent
with a stated tradition" and nobody would ever be forced to notice.

**Test case construction — two rendered mocks** (screenshots taken via headless Chrome,
`/tmp/gate-proof/g1coherence/`):

1. `pass-nautical.png` — built from the actual `03-nautical-chart.md` lineage file's stated
   signature move (border-led hairline separation, never-overlap label discipline, reserved single
   hazard hue, tabular soundings, no elevation/shadow) — sea/land/channel fields separated by
   hairlines, a hazard diamond in the single reserved red, tabular depth numbers, offset
   never-colliding labels, a compass rose.
2. `fail-generic-bold.png` — a stock SaaS hero pattern: purple-to-pink gradient card, rounded
   corners, drop shadow, bold display type, white CTA pill — the exact "generic bold interface"
   the gate warns against, with no named lineage behind any of its choices.

**Confirmed-red / confirmed-pass reasoning (with wordmark removed from both, since neither had one
to begin with):**

- `fail-generic-bold.png`: nothing in this artefact points to any specific outside tradition.
  Gradient-card-with-shadow-and-rounded-corners-and-bold-sans is the default output of "make it
  look bold and modern" from essentially any current design tool or model — there is no signature
  move named anywhere that this image is doing. One-sentence verdict: *"Nothing here would give it
  away — this is the generic bold interface the gate is written to catch, indistinguishable from a
  thousand SaaS landing sections."* This correctly fails.
- `pass-nautical.png`: the hairline-only separation (no shadow anywhere), the single reserved red
  hazard mark used for nothing else, the tabular soundings, and the never-overlapping offset labels
  are all named, specific behaviors from `references/lineages/03-nautical-chart.md`'s own
  "Signature move" section, not incidental style choices. One-sentence verdict: *"The border-led
  hairline separation and the single reserved hazard hue reused for nothing else are the giveaway —
  a generic dashboard would use shadow/elevation for the same separation and would not protect one
  hue's meaning that strictly."* This correctly passes.

**Honest caveat on this gate's proof (why I'm not calling it a clean "Yes"):** the two fixtures I
built are near-maximally distinct on purpose (a literal chart-styled mock vs. a literal generic
SaaS gradient card), and the gate correctly discriminates them. But the gate's actual evidence bar —
"one sentence on what specifically would give it away" — does not require that sentence to be
*true* or *falsifiable*, only present. A weaker, more borderline system (say, a bold system that
uses shadows sparingly and has one custom accent color, without any lineage-specific signature
move) could still generate a plausible-sounding one-sentence claim ("the accent color and type
weight give it away") that isn't actually backed by anything distinctive — and the gate as written
has no mechanism to catch a confidently-wrong sentence, only an absent one. G2 ("Signature move
present and load-bearing," checked in the same gate set) is the actual backstop for that gap, since
it demands the sentence point at something from the *stated* lineage file specifically — but G1
alone, read in isolation, would pass a plausible-sounding but ungrounded claim.

**Verdict: this gate is proven to work correctly at the extremes I tested (clearly discriminates a
real generic-default artefact from a real lineage-driven one), but the gate's own evidence bar has
a gap in the middle of the distribution that this test surfaces rather than resolves — it is not
fully proven against a borderline case, and I'm reporting that honestly rather than rounding it up
to a clean pass.**

---

## Fixtures index

All fixtures created under `/tmp/gate-proof/` (ephemeral, not part of this permanent record) and
referenced above by path:
- `check_tokens.py.orig`, `check_vector.py.orig` — pristine copies used to diff/verify reverts
- `tokens-missing-note-only.css`, `tokens-raw-outside.css`, `tokens-clean.css` — G8 fixtures
- `contrast.py` — small WCAG relative-luminance helper used for G3/G9 computation (no script ships
  with kiln for this; built fresh per the task's own instructions for unscripted gates)
- `g1-pass-ratio-tokens.json`, `g1-fail-random-tokens.json` — precision G1 fixtures
- `g1coherence/pass-nautical.html`, `g1coherence/fail-generic-bold.html`, and their rendered
  `.png` screenshots — coherence G1 fixtures

No file inside `/Users/tanawitch.saentree/Downloads/ds/Klin/` other than this report and its parent
directory was left modified: `scripts/check_tokens.py` and `scripts/check_vector.py` were each
mutated and reverted within this session, with sha256 verified identical before and after both
mutations.
