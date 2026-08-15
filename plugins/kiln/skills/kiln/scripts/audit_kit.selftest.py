#!/usr/bin/env python3
"""Gate Proof for audit_kit.py itself — plants one real violation per check class, confirms
audit_kit.py exits non-zero and names the planted violation, then reverts. Per the Dial Uplift /
audit-kit order's B2: every violation class audit_kit.py claims to catch must be shown to actually
go red, not assumed to work because the code looks right.

Runs against the REAL skill tree (mutating real files temporarily, always reverted in a finally
block) rather than a synthetic fixture tree, because several of audit_kit.py's checks (gate-proof,
count-check, dead-load) depend on cross-referencing real files against each other in ways a small
synthetic tree would not exercise honestly.

Run: python3 scripts/audit_kit.selftest.py
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
AUDIT_SCRIPT = ROOT / "scripts" / "audit_kit.py"


def run_audit():
    result = subprocess.run(
        [sys.executable, str(AUDIT_SCRIPT)], capture_output=True, text=True, cwd=ROOT
    )
    return result.returncode, result.stdout + result.stderr


def with_mutation(path, mutate_fn, check_fn, label):
    """mutate_fn(text) -> mutated text. check_fn(exit_code, output) -> (ok: bool, reason: str)."""
    original = path.read_text(encoding="utf-8")
    try:
        path.write_text(mutate_fn(original), encoding="utf-8")
        code, output = run_audit()
        ok, reason = check_fn(code, output)
        if not ok:
            return False, f"{label}: {reason}"
        return True, None
    finally:
        path.write_text(original, encoding="utf-8")
        if path.read_text(encoding="utf-8") != original:
            raise RuntimeError(f"{label}: revert did not restore {path} byte-for-byte")


def case_path_check(failures):
    target = ROOT / "SKILL.md"

    def mutate(text):
        return text + "\nSee `references/this-file-does-not-exist.md` for details.\n"

    def check(code, output):
        if code == 0:
            return False, "planted dead path did not cause a failing exit"
        if "this-file-does-not-exist" not in output:
            return False, f"failed but didn't name the planted path — output: {output[:200]}"
        return True, None

    ok, reason = with_mutation(target, mutate, check, "path-check")
    if ok:
        print("✓ path-check: planted dead path correctly caught")
    else:
        failures.append(reason)


def case_gate_proof_unmapped(failures):
    tally_files = sorted((ROOT / "evals").glob("gate-proof-tally-*/report.md"))
    if not tally_files:
        failures.append("gate-proof case: no tally file found to mutate")
        return
    target = tally_files[-1]

    def mutate(text):
        return text + "\n| Precision | G99 Fake gate | **Proven** — no real script backs this |\n"

    def check(code, output):
        if code == 0:
            return False, "planted unmapped Proven gate did not cause a failing exit"
        if "G99" not in output:
            return False, f"failed but didn't name the planted gate — output: {output[:200]}"
        return True, None

    ok, reason = with_mutation(target, mutate, check, "gate-proof (unmapped gate)")
    if ok:
        print("✓ gate-proof: planted unmapped Proven-gate claim correctly caught")
    else:
        failures.append(reason)


def case_gate_proof_broken_script(failures):
    target = ROOT / "scripts" / "check_ratio.py"

    def mutate(text):
        return text.replace("TOLERANCE = 0.01", "TOLERANCE = 999")

    def check(code, output):
        if code == 0:
            return False, "breaking check_ratio.py's tolerance did not cause a failing exit"
        if "check_ratio.selftest.py" not in output:
            return False, f"failed but didn't name the broken selftest — output: {output[:300]}"
        return True, None

    ok, reason = with_mutation(target, mutate, check, "gate-proof (broken underlying script)")
    if ok:
        print("✓ gate-proof: a genuinely broken gate script correctly caught by its own selftest")
    else:
        failures.append(reason)


def case_count_check(failures):
    tally_files = sorted((ROOT / "evals").glob("gate-proof-tally-*/report.md"))
    if not tally_files:
        failures.append("count-check case: no tally file found to mutate")
        return
    target = tally_files[-1]

    def mutate(text):
        return re.sub(r"\d+\s+gates total", "41 gates total", text, count=1)

    def check(code, output):
        if code == 0:
            return False, "planted wrong gate total did not cause a failing exit"
        if "41 gates total" not in output:
            return False, f"failed but didn't name the planted count — output: {output[:300]}"
        return True, None

    ok, reason = with_mutation(target, mutate, check, "count-check")
    if ok:
        print("✓ count-check: planted wrong declared total correctly caught")
    else:
        failures.append(reason)


def case_dead_load(failures):
    targets = [
        ROOT / "references" / "gates-precision.md",
        ROOT / "references" / "gates-coherence.md",
        ROOT / "references" / "gates-restraint.md",
    ]
    originals = {t: t.read_text(encoding="utf-8") for t in targets}
    try:
        for t in targets:
            t.write_text(
                originals[t].replace("`references/baseline.md`", "baseline reference removed for test"),
                encoding="utf-8",
            )
        code, output = run_audit()
        if code == 0:
            failures.append("dead-load: removing baseline.md's only reachable references did not cause a failing exit")
        elif "baseline.md" not in output:
            failures.append(f"dead-load: failed but didn't name baseline.md — output: {output[:300]}")
        else:
            print("✓ dead-load: orphaning baseline.md's only reachable reference correctly caught")
    finally:
        for t in targets:
            t.write_text(originals[t], encoding="utf-8")
            if t.read_text(encoding="utf-8") != originals[t]:
                raise RuntimeError(f"dead-load case: revert did not restore {t} byte-for-byte")


def case_superseded_bad_winner(failures):
    target = ROOT.parent.parent / "agents" / "superseded" / "intake.md"
    if not target.exists():
        failures.append(f"superseded case: {target} not found")
        return

    def mutate(text):
        return text.replace(
            "Merged into `.claude/agents/interpreter.md`",
            "Merged into `.claude/agents/nonexistent-winner.md`",
        )

    def check(code, output):
        if code == 0:
            return False, "planted nonexistent winner path did not cause a failing exit"
        if "nonexistent-winner.md" not in output:
            return False, f"failed but didn't name the planted winner — output: {output[:300]}"
        return True, None

    ok, reason = with_mutation(target, mutate, check, "superseded (bad winner path)")
    if ok:
        print("✓ superseded: planted nonexistent winner path correctly caught")
    else:
        failures.append(reason)


def case_superseded_duplicate_backlog(failures):
    repo_root = ROOT.parent.parent.parent
    real_backlog = repo_root / "BACKLOG.md"
    fake_backlog = repo_root / "packages" / "BACKLOG.md"
    if not real_backlog.exists():
        failures.append("superseded (duplicate BACKLOG) case: no real BACKLOG.md found to duplicate")
        return
    try:
        fake_backlog.write_text(real_backlog.read_text(encoding="utf-8"), encoding="utf-8")
        code, output = run_audit()
        if code == 0:
            failures.append("superseded (duplicate BACKLOG): planted second BACKLOG.md did not cause a failing exit")
        elif "found 2" not in output:
            failures.append(f"superseded (duplicate BACKLOG): failed but didn't report the count — output: {output[:300]}")
        else:
            print("✓ superseded: planted duplicate BACKLOG.md correctly caught")
    finally:
        if fake_backlog.exists():
            fake_backlog.unlink()


def main():
    failures = []
    case_path_check(failures)
    case_gate_proof_unmapped(failures)
    case_gate_proof_broken_script(failures)
    case_count_check(failures)
    case_dead_load(failures)
    case_superseded_bad_winner(failures)
    case_superseded_duplicate_backlog(failures)

    print()
    final_code, final_output = run_audit()
    if final_code != 0:
        failures.append(f"real tree is not clean after all reverts — audit_kit.py exit {final_code}:\n{final_output}")
    else:
        print("✓ real tree confirmed clean after every mutation was reverted")

    print()
    if failures:
        print(f"✗ audit_kit.selftest FAILED — {len(failures)} case(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("✓ audit_kit.selftest clean — all 5 checks are gate-proof against real planted violations.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
