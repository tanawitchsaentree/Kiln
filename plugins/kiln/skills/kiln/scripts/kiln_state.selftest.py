#!/usr/bin/env python3
"""Gate Proof for kiln_state.py — the harness that turns kiln's phase sequence from prose into an
enforced state machine. Every case here plants a real attempt to violate the sequence (skip a
required field, advance past the phase 5 checkpoint without approval, jump the reference branch
the wrong way, re-init over a live run) and asserts the harness actually rejects it — a harness
that has only ever been run the correct way is not known to enforce anything, it's known to be
quiet, per this repo's own standing Gate Proof rule.

Runs entirely inside a temp directory via subprocess (not imported functions), so this exercises
exactly the CLI a phase file would actually invoke.

Run: python3 scripts/kiln_state.selftest.py
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT = Path(__file__).parent / "kiln_state.py"


def run(root, *args):
    result = subprocess.run(
        [sys.executable, str(SCRIPT), *args], cwd=root, capture_output=True, text=True
    )
    return result.returncode, result.stdout + result.stderr


def main():
    failures = []

    with tempfile.TemporaryDirectory(prefix="kiln-state-selftest-") as root:
        # Case 1: the full happy path, no reference — phase 2 must skip to 4, not 3.
        code, out = run(root, "init", "--verb", "build", "--scale", "Spec")
        if code != 0:
            failures.append(f"init: expected 0, got {code} — {out[:200]}")
        else:
            print("✓ init succeeds on a clean directory")

        code, out = run(root, "advance", "--data",
                         '{"brief":"x","scale":"Spec","has_reference":false}')
        if code != 0:
            failures.append(f"phase 0 exit (complete data): expected 0, got {code} — {out[:200]}")
        else:
            print("✓ phase 0 -> 1 with complete data succeeds")

        code, out = run(root, "advance", "--data",
                         '{"lineage_name":"x","home_vector":[1,1,1,1,1,1],'
                         '"signature_move":"x","fit_statement":"x"}')
        if code != 0:
            failures.append(f"phase 1 exit: expected 0, got {code} — {out[:200]}")

        code, out = run(root, "advance", "--data",
                         '{"vector":[3,8,2,1,2,6],"loud_axis":"type","loud_axis_payment":"x"}')
        state = json.loads((Path(root) / ".kiln" / "state.json").read_text())
        if code != 0 or state["current_phase"] != 4:
            failures.append(
                f"phase 2 exit with has_reference=false should skip to phase 4, "
                f"got exit {code}, current_phase={state.get('current_phase')}"
            )
        else:
            print("✓ phase 2 -> 4 correctly skips phase 3 when has_reference is false")

    # Case 2: has_reference=true must route through phase 3, not skip it.
    with tempfile.TemporaryDirectory(prefix="kiln-state-selftest-") as root:
        run(root, "init", "--verb", "build", "--scale", "Package")
        run(root, "advance", "--data", '{"brief":"x","scale":"Package","has_reference":true}')
        run(root, "advance", "--data",
            '{"lineage_name":"x","home_vector":[1,1,1,1,1,1],'
            '"signature_move":"x","fit_statement":"x"}')
        code, out = run(root, "advance", "--data",
                         '{"vector":[3,8,2,1,2,6],"loud_axis":"type","loud_axis_payment":"x"}')
        state = json.loads((Path(root) / ".kiln" / "state.json").read_text())
        if code != 0 or state["current_phase"] != 3:
            failures.append(
                f"phase 2 exit with has_reference=true should route through phase 3, "
                f"got exit {code}, current_phase={state.get('current_phase')}"
            )
        else:
            print("✓ phase 2 -> 3 correctly routes through the reference phase when it exists")

    # Case 3: a phase exit missing a required field must be REJECTED, and the phase must not move.
    with tempfile.TemporaryDirectory(prefix="kiln-state-selftest-") as root:
        run(root, "init", "--verb", "build", "--scale", "Spec")
        code, out = run(root, "advance", "--data", '{"brief":"x","scale":"Spec"}')  # missing has_reference
        state = json.loads((Path(root) / ".kiln" / "state.json").read_text())
        if code == 0:
            failures.append("phase 0 exit missing has_reference exited 0 — required-field check did not fire")
        elif "has_reference" not in out or state["current_phase"] != 0:
            failures.append(f"missing-field case failed (exit {code}) but didn't name the field or moved phase — {out[:200]}")
        else:
            print("✓ a phase exit missing a required field is rejected and the phase does not move")

    # Case 4: phase 5's checkpoint — advancing without approved:true must be REJECTED, and `guard`
    # must independently block phase-6+ work until it's genuinely set.
    with tempfile.TemporaryDirectory(prefix="kiln-state-selftest-") as root:
        run(root, "init", "--verb", "build", "--scale", "Spec")
        run(root, "advance", "--data", '{"brief":"x","scale":"Spec","has_reference":false}')
        run(root, "advance", "--data",
            '{"lineage_name":"x","home_vector":[1,1,1,1,1,1],"signature_move":"x","fit_statement":"x"}')
        run(root, "advance", "--data", '{"vector":[3,8,2,1,2,6],"loud_axis":"type","loud_axis_payment":"x"}')
        run(root, "advance", "--data",
            '{"plan":"p","out_of_scope":"x","acceptance_criteria":["a"],"riskiest_slice":"x"}')
        # now at phase 5 — try to leave it without approval
        code, out = run(root, "advance", "--data",
                         '{"stamp":{},"token_block":"x","acceptance_criteria":["a"]}')
        state = json.loads((Path(root) / ".kiln" / "state.json").read_text())
        if code == 0:
            failures.append("phase 5 exit without approved:true exited 0 — checkpoint check did not fire")
        elif state["current_phase"] != 5:
            failures.append("phase 5 exit without approval moved the phase anyway")
        else:
            print("✓ phase 5 exit without approved:true is rejected, phase stays at 5")

        code, out = run(root, "guard", "--min-phase", "6")
        if code == 0:
            failures.append("guard --min-phase 6 passed while still at unapproved phase 5")
        else:
            print("✓ guard --min-phase 6 correctly blocks while phase 5 is unapproved")

        run(root, "advance", "--data",
            '{"stamp":{},"token_block":"x","acceptance_criteria":["a"],"approved":true}')
        code, out = run(root, "guard", "--min-phase", "6")
        if code != 0:
            failures.append(f"guard --min-phase 6 still failing after real approval — {out[:200]}")
        else:
            print("✓ guard --min-phase 6 passes once phase 5 is genuinely approved")

    # Case 5: re-init over a live run without --force must be REJECTED — otherwise `init` silently
    # destroys a run's real history, which is worse than the thing this harness exists to prevent.
    with tempfile.TemporaryDirectory(prefix="kiln-state-selftest-") as root:
        run(root, "init", "--verb", "build", "--scale", "Spec")
        code, out = run(root, "init", "--verb", "build", "--scale", "Spec")
        if code == 0:
            failures.append("re-init without --force exited 0 — a live run can be silently destroyed")
        else:
            print("✓ re-init without --force is rejected")

    print()
    if failures:
        print(f"✗ kiln_state.selftest FAILED — {len(failures)} case(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("✓ kiln_state.selftest clean — the harness enforces sequence, required fields, and the "
          "phase 5 checkpoint, not just prose asking nicely.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
