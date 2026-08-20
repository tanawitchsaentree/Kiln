# The `audit-kit` verb — the kit audits itself

Everything else here tells someone to derive their numbers, prove their gates,
and delete what nothing reads. This is that standard turned inward, and it is a
**script** rather than a checklist on purpose: a prose checklist for "is the
prose honest" is the exact thing being guarded against. Nobody catches a stale
number by reading the sentence that contains it.

```bash
python3 ~/.claude/skills/design-system-forge/assets/audit_kit.py            # audit
python3 ~/.claude/skills/design-system-forge/assets/audit_kit.py --selftest # prove it
```

Exit code = number of problems. `--selftest` plants one violation of every class
into a temp **copy** of the kit and requires each check to go red.

## The five checks

| # | Check | Fails when |
|---|-------|-----------|
| 1 | **PATHS** — every backticked path resolves on disk | a file is cited that does not exist |
| 2 | **GATES** — every "proven gate" claim has a selftest that runs | the claim has no runnable evidence |
| 3 | **NUMBERS** — every documented count re-derived at runtime | the written number ≠ the real one |
| 4 | **PHASES** — every reference file has a load instruction somewhere | a file is dead weight nothing reads |
| 5 | **MARKERS** — SUPERSEDED points at a real winner; BACKLOG in one file | a pointer dangles or the backlog forked |

## Why each one exists

**PATHS.** A skill is mostly instructions to read other files. A wrong path is
not a typo, it is an instruction that silently does nothing — and the phase that
depended on that file just runs without it. Two exemptions are deliberate:
anything inside a fenced code block (a tree diagram of what the *user* will
build is not a promise about this kit) and output artifact names (`design.md`,
`css/primitives.css`). Requiring those to exist here is a category error, and a
check that cries wolf gets switched off.

**GATES.** "Proven" is a claim about behaviour. The only evidence that counts is
a command someone can run, so this check finds the claim, finds
`assets/selftest.py`, runs it, and requires green on a clean tree. When this
check was first written, five separate files claimed gates were proven and no
selftest existed anywhere in the kit. The claims were true when they were made —
the proof was done by hand, once, and then discarded. That is exactly the shape
of a claim that goes stale without anyone lying.

**NUMBERS.** This is the two-counts rule applied to the kit's own prose. Every
probe is `(regex for the written number, callable that re-derives it)`. Two
things make it work at all:

- **Numbers are written as words as often as digits.** "Four verbs", "six
  checks", "the eight items above". A digit-only regex passes every worded claim
  silently — the same class of blind spot as walking only `.css` for layer rules.
- **Anchor each probe to the sentence that makes the claim, not to the keyword.**
  A loose `NUM + r'\s+checks?'` matched "contrast coverage went 128 → 134 checks"
  in a paragraph *about a past bug* and reported a mismatch against a number that
  was never a claim about the check count.

Count what the tool **prints**, not what its source suggests. `def check_*`
returned 6 for a system with 7 checks: one helper prints two numbered sections.
The numbered output lines are the user-visible contract, so those are the count.
Getting that wrong is what made this check's first run accuse a correct doc.

Its first honest finding was `audit.py`'s own header saying "Six checks" after
check 7 had been added — the docstring never followed the code.

**PHASES.** Guards against dead reference files. A technique file every phase
stopped loading still *looks* alive because a sentence somewhere names it. What
makes a file live is a load instruction, so that is what gets checked: the
pattern is read/load/consult + `references/<file>.md`, not a bare mention.

**MARKERS.** A SUPERSEDED note whose winner does not exist strands the reader at
a dead end with no way to find what replaced it. And a backlog in two files is
two backlogs, which is zero backlogs within a month.

**A marker must open its line.** That is the convention, and making it explicit
is what lets prose *describe* the convention without *violating* it — this file
says SUPERSEDED three times in sentences about the check, and the first version
of the check reported all three as dangling pointers. The cost is nothing real:
a marker buried mid-sentence is one a reader skims past, which is the opposite of
what a marker is for.

## The trap this check keeps walking into

Three separate probes here have been wrong in the same direction — matched on a
keyword and swept up a number that was never a claim. The worst was a probe
looking for `NUM + 'checks'` that found "contrast coverage went 128 → 134 checks"
inside a *paragraph about a past bug* and reported the doc as stale. The mistake
was made again, in this file, two probes below the comment documenting it.

The rule that survives: **anchor to the sentence that makes the claim** — `## The
five checks`, `six violations one at a time` — not to the noun the claim is
about. And every probe has to be shown to bite: plant a wrong number in a copy
and watch the mismatch appear, because a probe that silently matches nothing
reads exactly like a probe that passes.

It counts its own checks too. An auditor exempting itself from its own number
rule would be the most embarrassing thing in the kit. That count reads the
dispatch tuple rather than a text span, because splitting the source on
`'def audit('` found that literal inside the counting function itself and
returned zero — a self-auditor containing the string it searches for is the
ordinary case, not an edge one.

## Proving the auditor

`--selftest` copies the kit to a temp directory, confirms 0 problems on the copy,
then plants six violations one at a time — a fake path, a deleted selftest, a
wrong number, an orphan reference file, a dangling SUPERSEDED, and a BACKLOG in
two files — asserting each moves the exit code and each revert comes back clean.

**Assert on which check fired, not on the total.** Deleting `selftest.py` to
plant a GATES violation also breaks every path that cites it, so the exit code
moves for two reasons at once. Checking only the total would let a completely
broken GATES check pass on PATHS's evidence — the same "a plant that trips two
gates proves neither" trap, one level up, and the reason `audit()` returns
per-check counts.

**Plant into a copy, never the real tree.** A plant-and-revert that edits shipped
files is one interrupted run away from shipping a violation as if it were
content, and this is the script everything else gets checked against. The copy
*is* the revert.

**A plant that doesn't violate proves nothing.** The BACKLOG case first added the
marker to one file, reported the check broken, and was wrong: the rule is
*exactly one*, the kit has zero, and going to one is legal. The failing case was
the plant, not the gate. Same for the dead-token plant in `assets/selftest.py`,
which first went into `[data-theme="dark"]` only — a dark-only declaration is
*also* theme drift, so it moved the exit code through the wrong gate entirely.
A plant that trips two checks proves neither.

## When to run it

**Before packing or handing off the kit, every time.** Not because the kit
changes often, but because the failures this catches are all invisible from the
inside: a path that stopped resolving, a count that drifted after an edit, a
proof that was true once. None of them look wrong while you are reading them.

Run `--selftest` too whenever a check is added or its regex changes. An auditor
that has only ever passed is in the position this whole skill warns about —
quiet, and mistaken for correct.
