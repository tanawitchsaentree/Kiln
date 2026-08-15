# Gate-proof tally — updated for the restraint set

42 gates total now that `gates-restraint.md` exists (14 precision + 14 coherence + 14 restraint,
each counted separately even where the underlying mechanism repeats — token-layer integrity is the
same script backing G8 in all three sets, but it's a distinct claim about a distinct gate file
each time, and this tally counts gates as declared, not as deduplicated mechanisms).

## The rule for what counts as "proven" here

Per the Gate Proof Rule already standing in this project: a gate is **proven** only if either (a)
it's backed by a script, that script was mutated to disable the specific rule, a real violation was
shown to wrongly pass under the mutation, and the mutation was reverted with a matching sha256; or
(b) for an unscripted, judgement-based gate, a constructed pass/fail fixture pair was built and
shown to produce the correct, discriminating verdict against the gate's own written criteria.

Applying a gate's reasoning to one real case (as this engagement did for Dial, repeatedly, e.g.
checking D-008's refusal against 26 real files for the restraint floor's cost criteria) is real,
valuable evidence, but it is not the same claim as gate-proof — one real case shows the gate can be
applied, not that its criteria reliably discriminate a violation from a pass across the range of
inputs it will actually see. Gates below that only have this weaker form of evidence are marked
**partially proven**, not proven, and the distinction is preserved rather than rounded up.

## Full tally

| Set | Gate | Status |
|---|---|---|
| Precision | G1 Ratio discipline | **Proven** — fixture pair (`gate-proof-2026-08-10`) |
| Precision | G2 Optical correction | Not proven |
| Precision | G3 Contrast, computed not eyeballed | **Proven** — fixture pair |
| Precision | G4 Semantic tier does real work | Not proven |
| Precision | G5 Spacing family discipline | Not proven |
| Precision | G6 Z-layer naming | Not proven |
| Precision | G7 Motion restraint | Not proven |
| Precision | G8 Token layer integrity | **Proven** — script mutation + reran clean against Dial's real 26 files |
| Precision | G9 Reduced motion | Not proven as a gate (the underlying claim was checked live against Dial's Switch fix, but that's a real-case application, not a gate-proof of the gate itself) |
| Precision | G10 Focus visibility on every surface | Not proven as a gate (same distinction — `contrast-check.mjs` reuse against Dial's real tokens is a real-case application) |
| Precision | G11 Forced-colours mode | Not proven |
| Precision | G12 Baseline distance | Not proven — cannot be proven at all until `baseline.md`'s ban list is measured; this is a standing, correctly-labelled not-run, not a gap in this pass |
| Precision | G13 Look at it | Not proven as a gate (exercised once against Dial's Card, no fixture pair) |
| Precision | G14 Acceptance criteria | Not proven |
| Coherence | G1 Lineage identifiability | **Partially proven** — fixture pair built, but an evidence-bar gap was found and documented (a plausible-but-ungrounded sentence can pass) |
| Coherence | G2 Signature move present and load-bearing | Not proven |
| Coherence | G3 Profile arithmetic holds | **Proven** — script mutation (spread rule) |
| Coherence | G4 Payment is actually spent | **Partially proven** — arithmetic half proven by mutation; the gate's own emphasized half (built-artefact delivery) is explicitly unscripted and was flagged, not proven |
| Coherence | G5 Concentration held under real content | Not proven |
| Coherence | G6 No leakage into the quiet axes | Not proven |
| Coherence | G7 Rotation against the log | Not proven as its own gate (rotation arithmetic exists in the script and was exercised incidentally by other tests, but no dedicated mutation test targeted it specifically) |
| Coherence | G8 Token layer integrity | **Proven** — same script, same proof as precision G8 |
| Coherence | G9 Contrast survives the treatment | Not proven |
| Coherence | G10 Focus visibility survives the treatment | Not proven |
| Coherence | G11 Forced-colours floor | Not proven |
| Coherence | G12 Baseline distance | Not proven — same standing reason as precision G12 |
| Coherence | G13 Look at it | Not proven |
| Coherence | G14 Acceptance criteria | Not proven |
| Restraint | G1 Refusal named, specific, costly | **Partially proven** — cost criteria applied to a real case (Dial's S0, `floor-cost-2026-08-10`), not a constructed fixture pair |
| Restraint | G2 Refusal holds without exception | **Partially proven** — same real-case application (D-008 checked against 26 files), not a constructed pair |
| Restraint | G3 Profile arithmetic holds | **Proven** — three separate mutations (ceiling, floor, flatline), each isolated and reverted with sha256 confirmed each time |
| Restraint | G4 Quiet axes distinguishable | Not proven |
| Restraint | G5 Density not smuggling loudness | Not proven |
| Restraint | G6 Hierarchy without volume tools | Not proven |
| Restraint | G7 Contrast, computed not eyeballed | Not proven as its own fixture for this set specifically (shares the precision set's proven method, but wasn't independently re-run against a restraint-specific case) |
| Restraint | G8 Token layer integrity | **Proven** — same script, same proof |
| Restraint | G9 Reduced motion | Not proven |
| Restraint | G10 Focus visibility on every surface | Not proven |
| Restraint | G11 Forced-colours mode | Not proven |
| Restraint | G12 Baseline distance | Not proven — same standing reason |
| Restraint | G13 Look at it | Not proven |
| Restraint | G14 Acceptance criteria | Not proven |

## Totals

**7 of 42 fully proven.** **4 of 42 partially proven** (real signal exists, gap or scope limit
explicitly documented, not rounded up to a clean pass). **31 of 42 not proven** — including every
instance of G11 (forced-colours), G12 (baseline, correctly blocked pending measurement), G13 (look
at it), and G14 (acceptance criteria) across all three sets; these four alone account for 12 of the
31.

Counting by underlying mechanism rather than by declared gate (since G8/token-integrity and the
G3-family arithmetic checks are the same script proven once, not three times): **4 distinct
mechanisms are gate-proven** (token-layer-integrity script, contrast-formula fixture pair,
ratio-discipline fixture pair, and the vector arithmetic script — spread/concentration/payment
under expressive, ceiling/floor/flatline under restraint, each mutation-tested individually) plus
**2 distinct mechanisms partially proven** (lineage-identifiability's evidence bar, and the
restraint floor's cost criteria).

## What this means operationally — advisory versus blocking

**Every gate marked "Proven" above may block a build.** Its script or fixture-pair evidence shows
it reliably separates a real violation from a real pass, which is the standard this project already
applies to its own tooling (`no-hardcode-lint` in the sibling Dial project, `check_vector.py`,
`check_tokens.py`) before trusting a red result to stop work.

**Every gate marked "Partially proven" may inform a fix but should not be the sole reason to block
a build without a second, independent check.** The documented gap (an evidence bar too loose to
catch a confidently-wrong answer, or an artefact-delivery claim with no tooling) means a false green
is possible in a way the fully-proven gates have already ruled out — treat a partially-proven
gate's red as a real signal worth investigating, and its green as provisional, not as settled as a
fully-proven gate's green.

**Every gate marked "Not proven" is advisory only and must never be the sole basis to block a
build.** This is not a claim that these 31 gates are wrong or unimportant — several (G12 baseline,
in particular) are correctly *unable* to be proven yet for reasons entirely outside this pass's
control, and several others (G13 look-at-it, G9/G10 accessibility gates) encode real, sound
judgement that a careful reviewer applying them by hand will very likely get right. The distinction
this tally exists to preserve is narrower and more specific: "this gate encodes good judgement" and
"this gate has been shown to reliably catch what it claims to catch, including at its edges" are
different claims, and only gates with the second kind of evidence should ever be treated as a hard
stop rather than a strong recommendation. A future pass through this list, gate by gate, is the
correct way to close this gap — not by loosening what "proven" means here, and not by treating an
unproven gate as settled because it sounds right.
