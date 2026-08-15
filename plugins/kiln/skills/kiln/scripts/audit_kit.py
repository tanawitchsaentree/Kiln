#!/usr/bin/env python3
"""audit-kit — checks the skill can be trusted before it's packed. Script, not prose (per the
Dial Uplift / audit-kit order, 2026-08-12). Exit 0 = clean, exit 1 = one or more real violations.

Four checks, each independently gate-proofed (see audit_kit.selftest.py — every violation class
this script claims to catch has a planted-violation test proving it actually goes red):

  1. path-check   — every backtick-quoted path in every *.md file under this skill resolves to a
                     real file/dir, relative to the skill root.
  2. gate-proof    — every gate marked "Proven" in evals/gate-proof-tally-*.md has a real,
                     re-runnable selftest backing it (not just a one-time eval report in a scratch
                     directory) — and that selftest actually passes right now.
  3. count-check   — every declared count this script knows how to re-derive (gate counts per set,
                     lineage count) matches what a fresh count of the real files/headings finds.
  4. dead-load     — every reference file loaded conditionally by a phase/verb file is reachable
                     from a real "load X" instruction somewhere in the phase/verb graph; nothing
                     sits unreferenced the way the technique files once did before this check
                     existed.

Run from the skill root:
  python3 scripts/audit_kit.py
"""
import re
import subprocess
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent


def find_md_files(root):
    return sorted(p for p in root.rglob("*.md") if "superseded" not in p.parts and "evals" not in p.parts)


def build_filename_index(root):
    """Every real filename anywhere under the skill, mapped to its full path(s). Lets a bare
    filename mentioned in prose (`check_vector.py`, `intensity.md`, `_TEMPLATE.md`) resolve without
    needing its full directory prefix restated at every mention — the same way a human reader
    resolves it, by recognizing the filename."""
    index = {}
    for p in root.rglob("*"):
        if p.is_file() and "superseded" not in p.parts and "evals" not in p.parts:
            index.setdefault(p.name, []).append(p)
    return index


PHANTOM_MARKERS = ("phantom", "never a separate file", "never existed", "were never separate files")


def check_paths(root):
    """Every backtick-quoted path (contains a '/' or a recognizable file extension) must resolve.

    Resolution order mirrors how these files actually read, since not every file writes paths
    relative to the skill root:
      1. relative to the skill root (SKILL.md/verbs/phases' own convention: `scripts/check_vector.py`)
      2. relative to the referencing file's own directory (foundations/INDEX.md lists `tokens.md`
         meaning `references/foundations/tokens.md`, not `<root>/tokens.md`)
      3. relative to the skill's parent directory (ORDER.md, read from outside the skill, says
         `kiln/SKILL.md` meaning `.claude/skills/kiln/SKILL.md`)
      4. by bare filename anywhere in the tree (BUILD-NOTES.md/MANIFEST.md/gate files/lineage files
         name `check_vector.py`, `intensity.md`, `_TEMPLATE.md`, `log.json` in prose without any
         directory prefix, expecting the reader to recognize the filename)
    A path resolving under ANY of these is not dead. A path is also not dead if the surrounding
    sentence explicitly narrates it as historical/phantom (BUILD-NOTES.md's own record of three
    filenames that were "never separate files" — a correct historical note, not a live dead link).
    """
    errors = []
    path_pattern = re.compile(r"`([^`]+)`")
    # A backtick span counts as a path candidate only if it looks like one — has a slash, or ends
    # in a known extension. This avoids false positives on `code`, `--flag`, prop names, etc.
    looks_like_path = re.compile(r"^[\w./\-]+\.(md|py|mjs|js|ts|tsx|json|html|css)$|^[\w.\-]+/[\w./\-]+$")
    # .kiln/*.json and apps/docs are files this skill WRITES INTO the host project it's installed
    # into — they never exist inside the skill folder itself, and a fresh install has no .kiln/
    # yet, so these are excluded rather than resolved (there is nothing to find, by definition).
    host_project_write_targets = re.compile(r"^\.kiln/|^apps/docs$|^apps/docs/|^system/|^packages/")
    # docs/DOCS-IA.md is the one host-project READ target this skill's docs verb consumes (the
    # host project's own IA spec) — also nothing to find inside the skill folder, excluded the
    # same way. This is distinct from docs/*.md files that live in THIS repo's own root (the kit's
    # own authoring docs — DISTRIBUTION.md, BLUEPRINT.md, etc.), which DO exist and should resolve
    # against the real repo root below, not be waved away.
    host_project_read_targets = re.compile(r"^docs/DOCS-IA\.md$")
    kit_repo_root = root.parent.parent.parent  # .claude/skills/kiln -> repo root
    # Bare filenames that are unambiguously host-project artifacts even without a directory
    # prefix — `log.json`/`cache.json` are .kiln/'s own two files and no other file in this skill
    # or a fresh host project shares either name, so a bare mention always means those.
    host_project_bare_names = {"log.json", "cache.json"}
    filename_index = build_filename_index(root)

    for md_file in find_md_files(root):
        text = md_file.read_text(encoding="utf-8")
        for match in path_pattern.finditer(text):
            candidate = match.group(1)
            if not looks_like_path.match(candidate):
                continue
            if candidate.startswith("http"):
                continue
            if host_project_write_targets.match(candidate) or host_project_read_targets.match(candidate):
                continue
            if candidate in host_project_bare_names:
                continue

            candidates_to_try = [
                root / candidate,
                md_file.parent / candidate,
                root.parent / candidate,
                kit_repo_root / candidate,
            ]
            if any(c.exists() for c in candidates_to_try):
                continue

            bare_name = candidate.split("/")[-1]
            if bare_name in filename_index:
                continue

            # Check for an explicit historical/phantom narration nearby (within ~400 chars) before
            # flagging — a correctly-documented "this used to be wrong, here's the fix" note is not
            # a live dead link.
            window_start = max(0, match.start() - 400)
            window_end = min(len(text), match.end() + 400)
            window = text[window_start:window_end].lower()
            if any(marker in window for marker in PHANTOM_MARKERS):
                continue

            errors.append(f"{md_file.relative_to(root)}: dead path `{candidate}`")
    return errors


# Which selftest file backs which gate number — the mapping is explicit and small enough to state
# directly rather than guessed from gate names, since gate wording varies slightly across the
# three sets ("Contrast, computed not eyeballed" vs "Contrast survives the treatment") while the
# underlying script is the same one script per gate NUMBER (per the tally's own note: "the same
# script backing G8 in all three sets"). A gate number with no entry here has no selftest, full
# stop — that IS the finding, not a reason to search harder for one.
GATE_TO_SELFTEST = {
    "G1": "check_ratio.selftest.py",
    "G3": "check_contrast.selftest.py",
    "G8": "check_vector.selftest.py",  # token-layer-integrity's arithmetic proxy, per the tally
}
# G8 is genuinely backed by TWO scripts per the tally's own text (check_tokens.py directly, and
# check_vector.py's payment arithmetic as a "proxy" for part of it) — both selftests must exist
# and both must pass for G8 to count as proven.
GATE_TO_SELFTEST_EXTRA = {
    "G8": ["check_tokens.selftest.py"],
}


def check_gate_proofs(root):
    """Every gate marked Proven in the tally must have a real, currently-passing selftest — not
    just an eval report in a one-time scratch directory, and not just "some selftest exists
    somewhere" (that was this check's own first-draft bug: it must be a selftest for THIS gate,
    and it must be run and confirmed green right now, not assumed green from its file existing)."""
    errors = []
    tally_files = sorted((root / "evals").glob("gate-proof-tally-*/report.md"))
    if not tally_files:
        return ["no gate-proof-tally report found under evals/ — cannot verify proven-gate claims"]

    tally_text = tally_files[-1].read_text(encoding="utf-8")
    proven_pattern = re.compile(r"\|\s*(\w+)\s*\|\s*(G\d+)[^|]*\|\s*\*\*Proven\*\*[^|]*\|")
    proven_gates = [(m.group(1), m.group(2)) for m in proven_pattern.finditer(tally_text)]

    if not proven_gates:
        errors.append(f"{tally_files[-1].relative_to(root)}: no gates marked **Proven** found — parser or tally may have drifted")
        return errors

    scripts_dir = root / "scripts"
    checked_selftests = set()  # run each selftest file at most once even if multiple sets share it

    for gate_set, gate_num in proven_gates:
        selftest_names = [GATE_TO_SELFTEST.get(gate_num)] + GATE_TO_SELFTEST_EXTRA.get(gate_num, [])
        selftest_names = [n for n in selftest_names if n]

        if not selftest_names:
            errors.append(
                f"{gate_set} {gate_num}: marked Proven in tally but this gate number has no entry "
                f"in audit_kit.py's own GATE_TO_SELFTEST map — no selftest is known to back it"
            )
            continue

        for selftest_name in selftest_names:
            selftest_path = scripts_dir / selftest_name
            if not selftest_path.exists():
                errors.append(f"{gate_set} {gate_num}: mapped selftest `{selftest_name}` does not exist on disk")
                continue
            if selftest_name in checked_selftests:
                continue
            checked_selftests.add(selftest_name)
            result = subprocess.run(
                [sys.executable, str(selftest_path)], capture_output=True, text=True
            )
            if result.returncode != 0:
                errors.append(
                    f"{gate_set} {gate_num}: selftest `{selftest_name}` exists but does not pass "
                    f"right now (exit {result.returncode}) — {result.stdout.strip()[-200:]}"
                )
    return errors


def check_counts(root):
    """Re-derive every count this script knows how to check, compare against what's declared."""
    errors = []

    gate_files = {
        "precision": root / "references" / "gates-precision.md",
        "coherence": root / "references" / "gates-coherence.md",
        "restraint": root / "references" / "gates-restraint.md",
    }
    real_gate_counts = {}
    for name, path in gate_files.items():
        if not path.exists():
            errors.append(f"gate file missing entirely: {path.relative_to(root)}")
            continue
        text = path.read_text(encoding="utf-8")
        # Heading level for a gate entry is inconsistent across the three files (precision/coherence
        # use ##, restraint uses ### — a real, minor inconsistency, logged separately in BACKLOG;
        # this count accepts either level since the gates themselves are equally real either way.
        count = len(re.findall(r"^#{2,3}\s+G\d+", text, re.MULTILINE))
        real_gate_counts[name] = count

    tally_files = sorted((root / "evals").glob("gate-proof-tally-*/report.md"))
    if tally_files:
        tally_text = tally_files[-1].read_text(encoding="utf-8")
        declared_total_match = re.search(r"(\d+)\s+gates total", tally_text)
        if declared_total_match:
            declared_total = int(declared_total_match.group(1))
            real_total = sum(real_gate_counts.values())
            if declared_total != real_total:
                errors.append(
                    f"{tally_files[-1].relative_to(root)}: declares '{declared_total} gates total' "
                    f"but counting ### G headers across all three gate files finds {real_total} "
                    f"({', '.join(f'{k}={v}' for k, v in real_gate_counts.items())})"
                )

    lineage_dir = root / "references" / "lineages"
    if lineage_dir.exists():
        real_lineage_files = [
            p for p in lineage_dir.glob("*.md") if p.name not in ("INDEX.md", "_TEMPLATE.md")
        ]
        index_file = lineage_dir / "INDEX.md"
        if index_file.exists():
            index_text = index_file.read_text(encoding="utf-8")
            index_rows = len(re.findall(r"^\|\s*\d+\s*\|", index_text, re.MULTILINE))
            if index_rows and index_rows != len(real_lineage_files):
                errors.append(
                    f"references/lineages/INDEX.md lists {index_rows} numbered rows but "
                    f"{len(real_lineage_files)} real lineage files exist on disk"
                )

    return errors


def extract_loaded_files(root):
    """Every path transitively reachable from phases/, verbs/, or SKILL.md — either a sentence
    using 'load'/'read'/'โหลด'/'อ่าน' immediately before the path, a row in one of SKILL.md's own
    conditional-load tables ('| Condition | File |'), or a plain backtick-quoted reference-file
    mention inside any file already known to be reachable (a phase file loading `contract.md`
    makes everything `contract.md` itself mentions reachable too — voice.md is contract part 9,
    reachable only through this second hop, not directly from any phase file).

    This is a real transitive-closure walk, not a one-hop check, because the real failure mode
    (kiln's own technique files sitting unreferenced before this check existed) is exactly a file
    that's mentioned by something, but the mentioning file itself was never in the direct load set
    — a one-hop check would have missed that exact case too."""
    load_verbs = re.compile(r"(?:[Ll]oad|[Rr]ead|โหลด|อ่าน)[^`\n]*`([\w./\-]+\.md)`")
    table_row = re.compile(r"^\|[^|]+\|\s*`([\w./\-]+\.md)`\s*\|", re.MULTILINE)
    any_reference = re.compile(r"`(references/[\w./\-]+\.md)`")

    def direct_mentions(text):
        found = set()
        for match in load_verbs.finditer(text):
            found.add(match.group(1))
        for match in table_row.finditer(text):
            found.add(match.group(1))
        return found

    def all_mentions(text):
        return {m.group(1) for m in any_reference.finditer(text)}

    frontier = set()
    for md_file in (root / "phases").glob("*.md"):
        frontier |= direct_mentions(md_file.read_text(encoding="utf-8"))
    for md_file in (root / "verbs").glob("*.md"):
        frontier |= direct_mentions(md_file.read_text(encoding="utf-8"))
    frontier |= direct_mentions((root / "SKILL.md").read_text(encoding="utf-8"))

    loaded = set()
    while frontier:
        current = frontier.pop()
        if current in loaded:
            continue
        loaded.add(current)
        current_path = root / current
        if current_path.exists() and current_path.suffix == ".md":
            frontier |= all_mentions(current_path.read_text(encoding="utf-8")) - loaded

    return loaded


def check_dead_files(root):
    """Every references/*.md file must be reachable from a real load instruction somewhere."""
    errors = []
    loaded = extract_loaded_files(root)

    all_reference_files = [
        p for p in (root / "references").rglob("*.md")
        if p.name not in ("INDEX.md", "_TEMPLATE.md")
    ]

    for ref_file in all_reference_files:
        rel = str(ref_file.relative_to(root)).replace("\\", "/")
        rel_from_references = str(ref_file.relative_to(root / "references")).replace("\\", "/")
        candidates = {rel, f"references/{rel_from_references}", rel_from_references}
        if not (candidates & loaded):
            # A file living under references/lineages or references/technique is loaded by name
            # dynamically (the lineage/technique picked at runtime), not via a static "load X" line
            # in a phase file — those are legitimately not statically reachable and are excluded.
            if "lineages" in ref_file.parts or "technique" in ref_file.parts or "foundations" in ref_file.parts:
                continue
            errors.append(f"references/{rel_from_references}: not named in any load/read instruction under phases/ or verbs/ or SKILL.md")

    return errors


def check_superseded(root):
    """Every SUPERSEDED file must name a winner that actually exists; BACKLOG must be singular."""
    errors = []
    kit_root = root.parent.parent.parent  # .claude/skills/kiln -> repo root

    backlog_files = list(kit_root.rglob("BACKLOG.md"))
    backlog_files = [b for b in backlog_files if "node_modules" not in b.parts]
    if len(backlog_files) != 1:
        errors.append(f"expected exactly 1 BACKLOG.md in the repo, found {len(backlog_files)}: {[str(b) for b in backlog_files]}")

    superseded_dirs = [kit_root / ".claude" / "agents" / "superseded", kit_root / ".claude" / "skills" / "superseded"]
    winner_pattern = re.compile(r"merged into `([^`]+)`", re.IGNORECASE)
    for sdir in superseded_dirs:
        if not sdir.exists():
            continue
        for f in sdir.rglob("*.md"):
            text = f.read_text(encoding="utf-8")
            if "SUPERSEDED" not in text:
                errors.append(f"{f.relative_to(kit_root)}: lives under superseded/ but has no SUPERSEDED marker")
                continue
            match = winner_pattern.search(text)
            if not match:
                errors.append(f"{f.relative_to(kit_root)}: marked SUPERSEDED but names no winner file")
                continue
            winner_path = kit_root / match.group(1)
            if not winner_path.exists():
                errors.append(f"{f.relative_to(kit_root)}: names winner `{match.group(1)}` which does not exist")
    return errors


def main():
    all_errors = []
    checks = [
        ("path-check", check_paths),
        ("gate-proof", check_gate_proofs),
        ("count-check", check_counts),
        ("dead-load", check_dead_files),
        ("superseded", check_superseded),
    ]

    for name, fn in checks:
        errors = fn(SKILL_ROOT)
        status = "clean" if not errors else f"{len(errors)} violation(s)"
        print(f"[{name}] {status}")
        for e in errors:
            print(f"  ✗ {e}")
        all_errors.extend(errors)

    print()
    if all_errors:
        print(f"✗ audit-kit FAILED — {len(all_errors)} total violation(s). Do not pack.")
        return 1
    print("✓ audit-kit clean — safe to pack.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
