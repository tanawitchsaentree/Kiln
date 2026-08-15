# Verb — audit-kit

`kiln audit-kit` / `/audit-kit`. Checks this skill folder itself — not a system built with it. No
model judgement calls here: this verb runs a real script and reports its exit code, per the same
"script, not prose" instruction that produced it. If a check ever needs a judgement call to decide
pass/fail, that's a sign the check belongs in `kiln audit` (which judges systems) instead of here
(which only verifies mechanical facts about this skill's own files).

## Run

```
python3 scripts/audit_kit.py
```

Exit 0 = clean, safe to pack. Exit 1 = one or more real violations — do not pack, do not silently
patch `audit_kit.py` to stop reporting them; fix the actual file the violation names. `SKILL.md`'s
gate-proof column names the mutate-confirm-revert discipline this script's own selftest
(`scripts/audit_kit.selftest.py`) follows — read it before changing any of the five checks below,
since each one has a planted-violation test proving it actually catches what it claims to.

## What it checks (five, all mechanical)

1. **path-check** — every backtick-quoted path across every `*.md` file under this skill resolves
   to a real file, trying skill-root-relative, referencing-file-relative, parent-relative, and
   bare-filename-anywhere-in-tree resolution in that order (real files in this skill are written
   all four ways depending on which file and where it sits — a stricter single convention would
   flag files that are actually fine).
2. **gate-proof** — every gate marked **Proven** in the latest `evals/gate-proof-tally-*/report.md`
   has a real, mapped selftest under `scripts/` (see `audit_kit.py`'s own `GATE_TO_SELFTEST` table),
   and that selftest is actually run and confirmed passing right now — not assumed passing because
   some selftest file exists somewhere. A gate proven once in a scratch eval directory and never
   turned into a standing test does not count; that gap is exactly what this check exists to catch.
3. **count-check** — every count this script knows how to re-derive (gate totals per set, lineage
   file count against `references/lineages/INDEX.md`'s own row count) is compared against a fresh
   count of the real files/headings. A mismatch means either the doc drifted or the count logic
   itself needs fixing — chase to the real cause, don't hand-edit the number to make it match.
4. **dead-load** — every `references/*.md` file (excluding `lineages/`, `technique/`, and
   `foundations/`, which are loaded dynamically by name at runtime, not statically) must be
   reachable by walking from `phases/`, `verbs/`, and `SKILL.md` through real load instructions —
   either a "load/read `X`" sentence, a `| Condition | File |` table row, or a backtick-quoted
   mention inside any file already known to be reachable (transitive, not one-hop — a file quoted
   only inside another unreachable file is still unreachable). This is the same failure class the
   technique files had before route-checking existed for them.
5. **superseded** — every file under `.claude/agents/superseded/` or `.claude/skills/superseded/`
   carries a `SUPERSEDED` marker and names a winner file that actually exists on disk; exactly one
   `BACKLOG.md` exists anywhere in the repo.

## Wiring

`docs/DISTRIBUTION.md`'s "เช็คก่อนขาย" section names this as a required, non-optional gate before
any pack/release action — read that file's own wording for the exact rule rather than restating it
here (single source of truth; don't duplicate the requirement text into two files that can drift).

## On a failure

Read the violation the script names, open the actual file, fix it for real, re-run. A violation in
`gate-proof` usually means either a new selftest needs writing (see `check_ratio.py`/
`check_ratio.selftest.py` as the template for turning a judgement-only gate into a scripted,
gate-proofed one) or the tally itself overclaimed and should be corrected to **Partially proven** or
**Not proven** instead. A violation in `dead-load` usually means either a real orphaned file (delete
or wire it) or a load path that needs adding to a phase/verb file, not a change to the check's own
reachability logic — the check's logic is itself gate-proofed against exactly this kind of file, so
suspect the content before suspecting the checker.
