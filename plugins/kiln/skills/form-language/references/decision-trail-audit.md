# Decision-trail audit — template and worked example (Dial, 2026-08-13)

Read-only. Reconstructs how a system's current form language came to be, so a governance question
("did this drift, or was it decided?") gets answered from the actual record rather than assumed from
the shipped result looking generic.

## Protocol

1. Read every locked decision that touches shadow/depth/silhouette, in chronological order, quoting
   the exact text — not a paraphrase.
2. For each step, check: is there a real render/screenshot on file (`apps/lab/candidates.js`, a
   `system/sheets/*.png`, a cited path in `DECISIONS.md`'s own entry) that the user actually
   compared before confirming? If yes → **USER-CONFIRMED**. If a rule was applied to a new case
   later without ever being re-confirmed against that case → **DRIFT**. If the audit's own premise
   (an alleged prior decision, an alleged semantic slide) doesn't match what the record actually
   contains → **FACTUALLY-UNFOUNDED**, and say so plainly rather than forcing the narrative to fit.
3. Cross-check against any available independent, external verification (an audit run by a
   different tool/skill on the same rule, at a different time, for a different purpose) — an
   external confirmation that the rule is deliberate and cost-checked outranks an assumption that it
   drifted, per this repo's own Gate Proof discipline (a claim needs the actual evidence, not just
   plausibility).
4. State the verdict per step in one table. Do not smooth over a FACTUALLY-UNFOUNDED finding to
   make the requesting order's narrative work — report what the record shows.

## Worked example — Dial's form-language audit, 2026-08-13

Run as Part 1 of the `form-language` order, which alleged: "D-003 locked 'Neumorph ล้วน'
(user-picked in Lab); D-008 'no decorative shadows' was progressively read as 'no shadows on
controls,' silently flattening every component."

| Step | Claim | Record | Verdict |
|---|---|---|---|
| D-003 = neumorphism, user-picked in Lab | Origin of the flattening | No such D-003 exists for Dial. Dial's real `D-003` (`system/DECISIONS.md`) is "Spacing base unit = 8px." The `docs/KIT-CHANGELOG.md` v10 entry mentioning "D-003 neumorph ล้วน" describes an earlier demo/test cycle of the KIT tooling itself, explicitly reset in v13: "รีเซ็ต `system/` กลับเป็น blank template (ล้าง D-001/D-002/D-003 neumorphism/mobile-first demo...)." Dial's actual D-001-D-010 were authored fresh after that reset. | **FACTUALLY-UNFOUNDED** — nothing drifted from this, because it never existed for this system |
| D-008 "no decorative shadow" slid into "no shadow on controls" | Semantic slide inside a locked decision | D-008's own text names `card/button/input` directly at lock time and explicitly considered and rejected neumorphism's dual-shadow recipe by name ("neumorphism dual-shadow (มี recipe อยู่แล้วแต่ขัดกับกฎ...ตรงๆ)"). The rule always meant what it currently says. | **USER-CONFIRMED, no drift** |
| Was the flattening ever confirmed in a lab render? | — | `apps/lab/candidates.js` contains zero real candidates (template comment only). D-001/D-008 were locked through the written propose-confirm text loop, not an eyes-on multi-candidate render. | **Real gap — no lab render ever happened, but it's a missing STEP, not evidence of drift from an existing one** |
| "No gate caught it because Anatomy Contract says nothing about form" | Root cause | Confirmed independently: the 9-point Anatomy Contract has zero form coverage. Separately, an external audit (`kiln/evals/dial-audit-2026-08-10/`, `kiln/evals/floor-cost-2026-08-10/`) independently re-verified D-008 as a deliberate, cost-checked, zero-unstated-exceptions refusal across 26 real component token files — not a drifted default. | **CONFIRMED as the real gap, with a different shape than alleged: no drift occurred; form was simply never asked as its own question** |

## What this means for interpreting a future audit's premise

An order's stated "defect in evidence" can be wrong about ITS OWN causal story while still be
right about the underlying gap it's trying to fix. Report the trail exactly as found — including
telling the requester their premise doesn't hold — rather than either (a) silently correcting the
narrative to fit what actually happened, or (b) forcing findings to match the alleged story out of
deference to how the request was framed. The fix (build FORM.md, add G-F1-G-F3, run the eyes-on
lab round) is usually still correct even when the "why it broke" story turns out to be wrong.
