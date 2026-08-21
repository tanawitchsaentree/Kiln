#!/usr/bin/env python3
"""kiln's execution harness — makes the phase sequence a real, checkable state machine instead of
prose Claude is trusted to follow from memory.

Every other file in this skill describes phases 0-8 as if they were nodes in a graph: named,
sequenced, each with a "what to carry forward" contract. None of that was ever enforced by code —
context resets relied entirely on the model correctly re-stating the carry-forward list from its
own memory, and nothing anywhere would notice if Phase 6 started before Phase 5's stop-for-approval
checkpoint was actually approved. This script is that enforcement, and `.kiln/state.json` is the
real state object — written to disk, not just held in a conversation's context — so a context reset
can safely discard everything and reload exactly this file instead of trusting recall.

  python3 scripts/kiln_state.py init --verb build --scale Spec
  python3 scripts/kiln_state.py advance --data '{"brief": "...", "scale": "Spec", "has_reference": false}'
  python3 scripts/kiln_state.py status
  python3 scripts/kiln_state.py guard --min-phase 6

Exit code: 0 = allowed / clean, 1 = rejected (wrong phase, missing field, checkpoint not approved).
State lives at .kiln/state.json, relative to cwd — same convention as .kiln/cache.json and
.kiln/log.json, and deliberately a separate file from both: cache.json and log.json are
cross-SESSION memory (don't re-scan, don't repeat a lineage); state.json is this run's own
phase-by-phase record, reset by `init` at the start of a new build.
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone

STATE_PATH = os.path.join(".kiln", "state.json")

# Fields each phase must supply in --data before `advance` will accept the transition off of it.
# This is a completeness check (the right keys are present), not a semantic one — check_vector.py
# and friends already validate the actual values; this only guards that nothing is silently skipped.
REQUIRED_FIELDS = {
    0: ["brief", "scale", "has_reference"],
    1: ["lineage_name", "home_vector", "signature_move", "fit_statement"],
    2: ["vector", "loud_axis", "loud_axis_payment"],
    3: ["reference_table"],
    4: ["plan", "out_of_scope", "acceptance_criteria", "riskiest_slice"],
    5: ["stamp", "token_block", "acceptance_criteria"],
    6: ["built_artefact", "vector", "acceptance_criteria"],
    7: ["gate_results", "acceptance_criteria_results"],
    8: [],
}

# Phase 5 is the one hard-stated checkpoint in this skill ("Show the slice and stop for a response
# before expanding. This is a real checkpoint, not a formality" — phases/5-slice.md). Advancing
# off phase 5 requires an explicit approved:true in --data, not just the usual required fields —
# a slice with a complete carry-forward payload but no approval is still not approved.
CHECKPOINTS = {5: "approved"}


def now():
    return datetime.now(timezone.utc).isoformat()


def load_state():
    if not os.path.exists(STATE_PATH):
        sys.exit(f"no state at {STATE_PATH} — run `init` first")
    with open(STATE_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_state(state):
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
        f.write("\n")


def next_phase(current, has_reference):
    """The legal next phase, given the one real branch in the sequence: phase 3 (Reference) exists
    only when a reference was named at phase 0. Every other transition is a straight +1."""
    if current == 2:
        return 3 if has_reference else 4
    if current == 8:
        return None
    return current + 1


def cmd_init(args):
    if os.path.exists(STATE_PATH) and not args.force:
        sys.exit(f"{STATE_PATH} already exists — pass --force to start a fresh run over it")
    state = {
        "verb": args.verb,
        "scale": args.scale,
        "current_phase": 0,
        "has_reference": None,  # set by phase 0's own --data
        "checkpoints": {},
        "carry_forward": {},
        "history": [{"phase": 0, "entered_at": now()}],
    }
    save_state(state)
    print(f"initialized — verb={args.verb} scale={args.scale} phase=0")
    return 0


def cmd_advance(args):
    state = load_state()
    current = state["current_phase"]
    try:
        data = json.loads(args.data)
    except json.JSONDecodeError as e:
        sys.exit(f"--data is not valid JSON: {e}")

    missing = [k for k in REQUIRED_FIELDS.get(current, []) if k not in data]
    if missing:
        sys.exit(
            f"REJECTED — phase {current} exit is missing required field(s): {', '.join(missing)}\n"
            f"phase {current} needs: {', '.join(REQUIRED_FIELDS.get(current, [])) or '(nothing)'}"
        )

    checkpoint = CHECKPOINTS.get(current)
    if checkpoint and not data.get(checkpoint):
        sys.exit(
            f"REJECTED — phase {current} has a real checkpoint ('{checkpoint}') and it is not "
            f"true in --data. Show the work and get a real answer before advancing; this is not "
            f"a field to default to true."
        )

    if current == 0:
        has_reference = bool(data["has_reference"])
    else:
        has_reference = state["has_reference"]

    nxt = next_phase(current, has_reference)
    if nxt is None:
        sys.exit(f"REJECTED — phase {current} is terminal (8), nothing to advance to")

    state["carry_forward"].update(data)
    if checkpoint:
        state["checkpoints"][checkpoint] = True
    if current == 0:
        state["has_reference"] = has_reference
    state["history"][-1]["exited_at"] = now()
    state["history"][-1]["data"] = data
    state["history"].append({"phase": nxt, "entered_at": now()})
    state["current_phase"] = nxt
    save_state(state)
    print(f"advanced — phase {current} -> {nxt}")
    return 0


def cmd_status(args):
    state = load_state()
    print(f"verb={state['verb']} scale={state['scale']} phase={state['current_phase']}")
    if state["carry_forward"]:
        print("carry_forward:")
        print(json.dumps(state["carry_forward"], indent=2))
    if state["checkpoints"]:
        print("checkpoints:", state["checkpoints"])
    return 0


def cmd_guard(args):
    """Read-only gate a hook or a human can call before letting risky work (e.g. writing component
    files) proceed: `guard --min-phase 6` fails unless current_phase >= 6. Exists specifically so
    "don't build before phase 5 is approved" can be enforced by something other than the model's
    own memory of having read that instruction."""
    state = load_state()
    if state["current_phase"] < args.min_phase:
        sys.exit(
            f"BLOCKED — current phase is {state['current_phase']}, this action needs phase "
            f">= {args.min_phase}. Advance the state machine for real, don't just proceed."
        )
    print(f"ok — phase {state['current_phase']} >= {args.min_phase}")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init")
    p_init.add_argument("--verb", required=True)
    p_init.add_argument("--scale", required=True, choices=["Spec", "Package", "Program"])
    p_init.add_argument("--force", action="store_true")

    p_adv = sub.add_parser("advance")
    p_adv.add_argument("--data", required=True)

    sub.add_parser("status")

    p_guard = sub.add_parser("guard")
    p_guard.add_argument("--min-phase", type=int, required=True)

    args = ap.parse_args()
    fn = {"init": cmd_init, "advance": cmd_advance, "status": cmd_status, "guard": cmd_guard}[args.cmd]
    sys.exit(fn(args))


if __name__ == "__main__":
    main()
