#!/usr/bin/env python3
"""Gate G8, automated. Every token must carry a source note.

Scans a CSS or DTCG JSON file and reports tokens with no source note, plus raw values that bypass
the token layer.

  python3 scripts/check_tokens.py tokens.css
  python3 scripts/check_tokens.py tokens.json
"""
import json, re, sys, os

RAW = re.compile(r":\s*(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\))")
DECL = re.compile(r"^\s*(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);\s*(/\*(.*?)\*/)?", re.M)


def check_css(path):
    # CSS custom properties have no group/file inheritance mechanism — DTCG's $description
    # inheritance is a source-format concept and does not survive into generated CSS output.
    # Each declaration's own trailing comment (if any) is the only note a CSS file can carry.
    text = open(path).read()
    missing, ok = [], 0
    for m in DECL.finditer(text):
        name, _value, _c, note = m.group(1), m.group(2), m.group(3), m.group(4)
        if note and note.strip():
            ok += 1
        else:
            missing.append(name)

    raw_outside = []
    for i, line in enumerate(text.splitlines(), 1):
        if line.strip().startswith("--"):
            continue
        if RAW.search(line):
            raw_outside.append((i, line.strip()[:70]))

    return ok, missing, raw_outside, 0


def check_json(path):
    data = json.load(open(path))
    missing, ok, inherited = [], 0, 0

    # DTCG groups inherit $description down to their children unless a token overrides it with
    # its own. A file-level $description on the root object is itself a group description and
    # covers every token in the file unless a nearer group or the token itself overrides it —
    # this is what a leaf-only check (the previous version of this function) missed.
    def walk(node, path_parts, inherited_description):
        nonlocal ok, inherited
        if isinstance(node, dict):
            own_description = str(node.get("$description", "")).strip()
            effective = own_description or inherited_description
            if "$value" in node:
                if own_description:
                    ok += 1
                elif effective:
                    ok += 1
                    inherited += 1
                else:
                    missing.append(".".join(path_parts))
                return
            for k, v in node.items():
                if not k.startswith("$"):
                    walk(v, path_parts + [k], effective)

    root_description = str(data.get("$description", "")).strip()
    walk(data, [], root_description)
    return ok, missing, [], inherited


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = sys.argv[1]
    if not os.path.exists(path):
        sys.exit(f"not found: {path}")

    ok, missing, raw, inherited = (check_json if path.endswith(".json") else check_css)(path)
    total = ok + len(missing)
    print(f"tokens with a source note   {ok}/{total}")
    if inherited:
        print(f"  of which inherited from a group/file $description: {inherited}")

    if missing:
        print("\nFAIL  no source note:")
        for name in missing:
            print(f"  {name}")
    if raw:
        print("\nFAIL  raw value outside the token block:")
        for line_no, snippet in raw:
            print(f"  L{line_no}  {snippet}")

    if missing or raw:
        print("\nA token with no source note is a default wearing a variable name.")
        sys.exit(1)
    print("G8 passes.")
    sys.exit(0)


if __name__ == "__main__":
    main()
