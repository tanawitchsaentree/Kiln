# Full conformance verification after box-sizing (7 files) + Switch reduced-motion fix

Requested specifically because vitest doesn't measure real bounding boxes — hit-area and
non-color-cue are exactly the two properties a `box-sizing` change could silently break, and
neither is checkable from a unit test.

## Result: no regression

Full suite (`npx playwright test`, all 5 projects: chromium, webkit, firefox, forced-colors,
reduced-motion): **268 passed, 5 failed, 17 skipped**, both before and after the fixes.

**Bisected with `git stash`** to confirm the 5 failures are pre-existing, not caused by this
session's changes: stashed all 7 CSS edits + the Switch reduced-motion block, reran the failing
specs on the clean baseline — same 5 tests failed, byte-identical failure messages. Restored the
stash. The failure set is unrelated to this session's work:

- `[webkit] w5-listbox.spec.ts` — Tab-out-of-widget, Mod+A select-all
- `[webkit] w5-radiocards.spec.ts` — roving-tabindex-lands-on-checked
- `[firefox] w5-listbox.spec.ts` — Mod+A select-all
- `[firefox] w5-radiocards.spec.ts` — Tab-exits-group-in-one-stop

All four are keyboard/focus timing issues specific to webkit/firefox's Tab/Mod+A handling in this
Playwright setup — none reference box dimensions, border-width, or hit-area, and none touch any of
the 7 files this session modified in a way relevant to the failure (RadioCards' own keyboard tests
are among the failures, but the identical two tests failed on the pre-fix baseline too).

## The specific tests this fix could have broken — all pass, every project

`w3-forms.spec.ts` (Checkbox/Radio/Switch's own hit-area and non-color-cue assertions) and
`w5-radiocards.spec.ts`'s hit-area/non-color-cue tests, isolated and rerun explicitly across every
project including the two most relevant (`forced-colors`, `reduced-motion`):

```
✓ Checkbox/Radio/Switch: hit area >= 40px (web-first)          — chromium, forced-colors, reduced-motion, webkit, firefox
✓ RadioCards: hit area ทั้งการ์ด >= 40px                          — chromium, forced-colors, reduced-motion
✓ Switch: toggle แล้ว thumb ต้องขยับจริง ไม่ใช่แค่เปลี่ยนสี           — chromium, forced-colors, reduced-motion, webkit, firefox
✓ Switch/Radio: checked state มี border จริง (forced-colors)      — chromium, forced-colors (skipped on reduced-motion/firefox by design)
✓ RadioCards: selected state มี non-color cue จริง (border+indicator) — chromium, forced-colors, reduced-motion
```

`w3-forms.spec.ts` alone: 21/21 passed across chromium + forced-colors + reduced-motion + webkit +
firefox (4 intentional skips, unrelated to this fix).

## Conclusion

The box-sizing fix (adding `box-sizing: border-box` to 7 selectors so hover's border-width
transition no longer grows the element) does not shrink or otherwise alter the hit-area — this
makes sense on inspection: the fix pins the *outer* box size constant and lets the border grow
*inward* into what would have been padding/content space, which is exactly what `box-sizing:
border-box` is for. The hit-area tests assert on the outer box, which was already what these
components' `min-inline-size`/`min-block-size` declarations targeted — the fix didn't change that
target, it only stopped an unintended side effect (transient growth beyond it on hover).

The Switch reduced-motion fix doesn't touch layout at all (only `transition-property` behavior
under a media query), so no hit-area interaction was possible there in the first place — confirmed
anyway by including Switch's own toggle/hit-area tests in the pass list above.

No further action needed. Nothing to report as a regression because nothing moved.
