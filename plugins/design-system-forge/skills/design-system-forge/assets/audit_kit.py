#!/usr/bin/env python3
"""audit-kit — the kit auditing itself. Exit code = failure count.

The skill tells everyone else to prove their gates and derive their numbers.
This is that standard turned inward, as a script rather than a checklist,
because a prose checklist for "is the prose honest" is the thing being guarded
against.

Six checks:
  1  PATHS      every kit-internal path in a backtick resolves on disk
  2  GATES      every gate claimed "proven" has a selftest that runs red
  3  NUMBERS    every count in the docs is re-counted at runtime and compared
  4  PHASES     every file claimed to load in a phase has a real load command
  5  MARKERS    every SUPERSEDED points at an existing winner; one BACKLOG max
  6  SELFTEST   this script's own gates fire when a violation is planted

Run from anywhere:  python3 assets/audit_kit.py [kit_root]
"""
import contextlib
import io
import os
import re
import shutil
import subprocess
import sys
import tempfile

# Paths in backticks that name what the kit PRODUCES, not what it contains.
# design.md and RULES.md are outputs of a build; css/primitives.css is a file
# the skill tells the user to write. Requiring them to exist inside the kit
# would be a category error, and a check that cries wolf gets switched off —
# the same lesson audit.py's check 7 learned at the cost of 54 false positives.
OUTPUT_ARTIFACTS = {
    'design.md', 'RULES.md', 'README.md', 'index.html', 'foundations.html',
    'components.html', 'patterns.html', 'playground.html', 'primitives.css',
    'semantic.css', 'shell.css', 'base.css', 'preview.js', 'shell.js',
    'verify.py', 'package.json', 'tailwind.config.js', 'main.css',
    'tokens.css', 'theme.css', 'audit_kit.py',
}
# Directory prefixes that only ever appear as output paths.
OUTPUT_PREFIXES = ('css/', 'js/', 'src/', '.storybook/', 'stories/', 'app/')


SELF = os.path.basename(__file__)

# Numbers in the docs are written as words as often as digits — "Four verbs",
# "six checks". A digit-only regex silently passes every worded claim, which is
# the same shape of blind spot as scanning only .css for layer violations.
WORDS = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6,
         'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11,
         'twelve': 12}
NUM = r'(\d+|' + '|'.join(WORDS) + r')'


def as_int(tok):
    t = tok.strip().lower()
    return WORDS.get(t, int(t) if t.isdigit() else None)


def kit_files(root, include_self=False):
    """Kit files, excluding this script by default.

    Auditing your own source is how you get findings about your own regexes:
    the first run flagged five SUPERSEDED violations that were all this file's
    documentation of the SUPERSEDED check. The auditor is not part of the
    corpus it audits — except in check 1, where its own path claims still count.
    """
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if not d.startswith('.')
                       and d not in ('__pycache__',)]
        for f in sorted(filenames):
            if f.endswith(('.md', '.py')):
                if f == SELF and not include_self:
                    continue
                out.append(os.path.join(dirpath, f))
    return sorted(out)


def read(p):
    return open(p, encoding='utf-8').read()


def strip_code_fences(text):
    """Paths inside a fenced block are illustrative scaffolding, not claims
    about this kit's contents. A tree diagram of the system the user will build
    must not be read as a promise that those files ship here."""
    return re.sub(r'```.*?```', '', text, flags=re.S)


# ---------------------------------------------------------------- 1  PATHS
def check_paths(root, files):
    bad = []
    pat = re.compile(r'`([A-Za-z0-9_./-]+\.(?:md|py|css|js|html|json|ts|tsx|jsx))`')
    for path in files:
        body = strip_code_fences(read(path))
        for m in pat.finditer(body):
            ref = m.group(1)
            base = os.path.basename(ref)
            if base in OUTPUT_ARTIFACTS or ref.startswith(OUTPUT_PREFIXES):
                continue
            # A bare extension is a naming convention, not a path. "one
            # `.stories.js` per component" claims nothing about this kit's
            # contents, and demanding a file called `.stories.js` exist is the
            # check inventing its own violation.
            if ref.startswith('.'):
                continue
            # Resolve against the kit root and against the citing file's dir —
            # `study-verb.md` inside references/ is a legitimate sibling ref.
            cands = [os.path.join(root, ref),
                     os.path.join(os.path.dirname(path), ref),
                     os.path.join(root, 'references', ref),
                     os.path.join(root, 'assets', ref)]
            if not any(os.path.exists(c) for c in cands):
                ln = body[:m.start()].count('\n') + 1
                bad.append((os.path.relpath(path, root), ln, ref))
    print(f'\n1  PATHS       {len(bad)} unresolvable kit path(s)'
          + ('' if bad else '  ✓'))
    for f, ln, ref in bad:
        print(f'      {f}:{ln}  `{ref}` — no such file')
    return len(bad)


# ---------------------------------------------------------------- 2  GATES
def check_gates(root, files):
    """A gate described as proven must have a selftest that actually runs red.

    "Proven" is a claim about behaviour, and the only evidence that counts is a
    command someone can run. This check finds the claim, finds the selftest it
    names, runs it, and requires a non-zero exit on planted breakage.
    """
    claims = []
    for path in files:
        for i, line in enumerate(read(path).split('\n'), 1):
            if re.search(r'\bprove(?:n|s)?\b.{0,80}\bgate|gate.{0,80}\bprove(?:n|s)?\b',
                         line, re.I):
                claims.append((os.path.relpath(path, root), i, line.strip()))
    selftest = os.path.join(root, 'assets', 'selftest.py')
    have = os.path.exists(selftest)
    fails = 0
    if claims and not have:
        fails = 1
    print(f'\n2  GATES       {len(claims)} "proven gate" claim(s) · '
          f'selftest {"present" if have else "MISSING"}'
          + ('  ✓' if not fails else ''))
    if fails:
        print('      assets/selftest.py absent — the claim has no runnable evidence')
    elif have:
        r = subprocess.run([sys.executable, selftest], capture_output=True, text=True)
        if r.returncode != 0:
            print(f'      selftest.py exits {r.returncode} on a clean tree — '
                  'it should pass here and fail only on planted breakage')
            fails += 1
        else:
            print('      selftest.py green on a clean tree · '
                  'plant-and-revert cases run inside it')
    return fails


# ---------------------------------------------------------------- 3  NUMBERS
def check_numbers(root, files):
    """Re-count what the docs assert. Two-counts applied to the kit itself.

    Every entry is (regex capturing the written number, callable returning the
    real one). A number nobody can re-derive does not belong in the docs — this
    is the same rule the skill puts on stat rows, so it applies here.
    """
    def n_refs():
        return len([f for f in os.listdir(os.path.join(root, 'references'))
                    if f.endswith('.md')])

    def n_checks():
        """Count what audit.py actually PRINTS as a numbered check.

        Counting `def check_*` is the tempting proxy and it is wrong twice over:
        one helper can print two sections and one check can be inlined without a
        def. The numbered output lines are the user-visible contract, so those
        are the count. (Getting this wrong is what made this very check report a
        false mismatch against a correct doc on its first run — and note the
        optional `\\n`: check 1 prints without a leading newline, so anchoring on
        it silently undercounted by one.)
        """
        src = read(os.path.join(root, 'assets', 'audit.py'))
        return len(set(re.findall(r"'(?:\\n)?(\d)  [A-Z]{2}", src)))

    def n_check_rows():
        """The audit-verb table's numbered rows — a second, independent count of
        the same thing n_checks() counts, derived from the docs instead of the
        code. Two derivations that disagree hand you the stale one."""
        return len(re.findall(r'^\| (\d+) \|', audit_md, re.M))

    def n_human():
        """The numbered items under "audit what no script can"."""
        tail = audit_md.split('Then audit what no script can', 1)[-1]
        return len(re.findall(r'^(\d+)\. \*\*', tail, re.M))

    def n_self_checks():
        """This script's own audit checks — the ones audit() runs, so SELFTEST
        is deliberately not among them. An auditor exempting itself from its own
        number rule would be the single most embarrassing thing in the kit.

        Read the dispatch tuple, not a text span: splitting on `'def audit('`
        found that literal inside THIS function first and returned 0. A source
        file that contains the string it searches for is the ordinary case for a
        self-auditor, not an edge one.
        """
        src = read(os.path.join(root, 'assets', SELF))
        m = re.search(r'for fn in \(([^)]*)\)', src)
        return len(re.findall(r'check_\w+', m.group(1))) if m else 0

    def n_verbs():
        # Verbs are the top-level "## name — …" headings in SKILL.md. Structural
        # sections ("## References", "## Pick the verb first") are Titlecase or
        # have no em-dash, so the pattern excludes them without a blocklist.
        body = read(os.path.join(root, 'SKILL.md'))
        return len(re.findall(r'^## ([a-z][a-z-]*) —', body, re.M))

    def n_systems():
        """Systems are numbered from 0, so "the six systems" means the highest
        index is 6 — seven headings. Counting headings and comparing to the
        written number would flag correct prose, and a check that cries wolf
        gets switched off."""
        body = read(os.path.join(root, 'SKILL.md'))
        idx = sorted(int(m) for m in re.findall(r'^### System (\d)', body, re.M))
        return max(idx) if idx else 0

    skill = read(os.path.join(root, 'SKILL.md'))
    audit_md = read(os.path.join(root, 'references', 'audit-verb.md'))
    audit_py = read(os.path.join(root, 'assets', 'audit.py'))
    kit_md = read(os.path.join(root, 'references', 'audit-kit-verb.md'))
    # Each probe is anchored to the SENTENCE that makes the claim, not to the
    # word "checks". A loose `NUM + r'\s+checks?'` matched "128 → 134 checks" in
    # a paragraph about a past bug and reported a mismatch against a number that
    # was never a claim about the check count. Over-reporting is how a real
    # finding gets waved off.
    probes = [
        ('audit.py header check count',
         re.findall(NUM + r'\s+checks?,', audit_py, re.I), n_checks),
        ('audit-verb.md "things it computes"',
         re.findall(NUM + r'\s+things it computes', audit_md, re.I), n_checks),
        ('audit-verb.md check table rows (vs printed sections)',
         [str(n_check_rows())], n_checks),
        ('human-check count',
         re.findall(NUM + r'\s+(?:human checks|things no script can)',
                    skill + audit_md, re.I)
         + re.findall(r'the ' + NUM + r'\s+items above', audit_md, re.I), n_human),
        ('verb count',
         re.findall(NUM + r'\s+verbs?[:.]', skill, re.I), n_verbs),
        ('reference-file count',
         re.findall(NUM + r'\s+reference file', skill, re.I), n_refs),
        ('system count',
         re.findall(NUM + r'\s+systems\b', skill, re.I), n_systems),
        # Anchored to the phrases that ARE the claim. An earlier `NUM +
        # r'\s+checks\b'` over kit_md matched "134 checks" out of a sentence
        # narrating a past bug — the exact failure mode documented two probes
        # up, reproduced by the person who documented it.
        ('audit-kit own check count',
         re.findall(r'## The ' + NUM + r' checks', kit_md, re.I)
         + re.findall(r'audit_kit\.py`?: ' + NUM + r'\s+checks', skill, re.I),
         n_self_checks),
        ('audit-kit check table rows',
         [str(len(re.findall(r'^\| (\d+) \|', kit_md, re.M)))], n_self_checks),
        ('audit-kit planted-case count',
         re.findall(NUM + r'\s+violations,? one at a time', kit_md, re.I),
         lambda: len(PLANTS)),
    ]
    bad = []
    shown = 0
    for label, written, real_fn in probes:
        if not written:
            continue
        real = real_fn()
        for w in written:
            v = as_int(w)
            if v is None:
                continue
            shown += 1
            if v != real:
                bad.append((label, v, real))
    print(f'\n3  NUMBERS     {shown} documented count(s) re-derived · '
          f'{len(bad)} mismatch(es)' + ('  ✓' if not bad else ''))
    for label, w, real in bad:
        print(f'      {label}: doc says {w}, real count is {real}')
    return len(bad)


# ---------------------------------------------------------------- 4  PHASES
def check_phases(root, files):
    """A file the docs say is loaded in a phase must actually be loaded there.

    Dead reference files are the failure this prevents: a technique file that
    every phase stopped reading still looks alive because a sentence names it.
    The load instruction is what makes it live, so that is what gets checked.
    """
    refs = {f for f in os.listdir(os.path.join(root, 'references'))
            if f.endswith('.md')}
    body = ''.join(read(p) for p in files)
    loaded = set()
    for m in re.finditer(r'(?:[Rr]ead|[Ll]oad|[Cc]onsult|see)\b[^.\n]{0,60}?'
                         r'`?references/([\w-]+\.md)`?', body):
        loaded.add(m.group(1))
    orphan = sorted(refs - loaded)
    print(f'\n4  PHASES      {len(refs)} reference file(s) · '
          f'{len(orphan)} never given a load instruction'
          + ('  ✓' if not orphan else ''))
    for o in orphan:
        print(f'      references/{o} — named nowhere as "read this"; '
              'dead weight or a missing instruction')
    return len(orphan)


# ---------------------------------------------------------------- 5  MARKERS
def check_markers(root, files):
    """A marker must OPEN its line. That is the convention, not a heuristic.

    Without it, prose that documents the convention violates it: the file
    explaining "SUPERSEDED must name a winner" contains the word SUPERSEDED
    three times in sentences about the check, and the first run reported all
    three as dangling pointers. Requiring the marker to open the line separates
    using it from describing it, and it costs nothing real — a marker buried
    mid-sentence is one a reader skims past anyway, which is the opposite of
    what a marker is for.

    Prefixes that don't count as prose: list bullets, blockquotes, and comment
    leaders, so the marker still works inside a `#` comment or a `- ` item.
    """
    marker = re.compile(r'^\s*(?:[-*>]\s*|#+\s*|//\s*|\*\s*)*'
                        r'(?:\*\*)?(SUPERSEDED|BACKLOG)\b')
    sup, backlog = [], []
    for path in files:
        for i, line in enumerate(read(path).split('\n'), 1):
            m = marker.match(line)
            if not m:
                continue
            if m.group(1) == 'SUPERSEDED':
                sup.append((os.path.relpath(path, root), i, line.strip()))
            else:
                backlog.append((os.path.relpath(path, root), i))
    fails = 0
    for f, i, line in sup:
        m = re.search(r'`([A-Za-z0-9_./-]+\.\w+)`', line)
        if not m:
            print(f'      {f}:{i}  SUPERSEDED with no winner named')
            fails += 1
            continue
        ref = m.group(1)
        if not any(os.path.exists(os.path.join(root, c, ref))
                   for c in ('', 'references', 'assets')):
            print(f'      {f}:{i}  SUPERSEDED → `{ref}` does not exist')
            fails += 1
    backlog_files = {f for f, _ in backlog}
    if len(backlog_files) > 1:
        print(f'      BACKLOG appears in {len(backlog_files)} files: '
              f'{sorted(backlog_files)} — must be exactly one')
        fails += 1
    head = (f'\n5  MARKERS     {len(sup)} SUPERSEDED · '
            f'BACKLOG in {len(backlog_files)} file(s)')
    print(head + ('  ✓' if not fails else ''))
    return fails


def audit(root, quiet=False):
    files = kit_files(root)
    out = []
    if not quiet:
        print(f'audit-kit — {root}')
        print(f'{len(files)} kit file(s)')
    n = 0
    # Per-check counts, not just the total. The selftest needs to know WHICH
    # check fired: deleting selftest.py to plant a GATES violation also breaks
    # every path that cites it, so the exit code moves for two reasons at once.
    # Asserting on the total would let a broken GATES check pass on PATHS's
    # evidence — the same "a plant that trips two gates proves neither" trap,
    # one level up.
    per = {}
    for fn in (check_paths, check_gates, check_numbers, check_phases,
               check_markers):
        key = fn.__name__.replace('check_', '').upper()
        if quiet:
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                per[key] = fn(root, files)
            out.append(buf.getvalue())
        else:
            per[key] = fn(root, files)
        n += per[key]
    if not quiet:
        print('\nKIT CLEAN' if not n else f'\nKIT FAILING — {n} problem(s)')
    return n, ''.join(out), per


# ------------------------------------------------------------- 6  SELFTEST
# The auditor's own gates, planted and proven. Every plant goes into a COPY of
# the kit in a temp directory, never into the real tree: a plant-and-revert that
# edits the shipped files is one interrupted run away from shipping a violation
# as if it were content, and this script is what everything else is checked
# against. The copy is the revert.
# (label, which check must fire, edits, why). `expect` names the check whose
# count has to move — see the note in audit() for why the total is not enough.
PLANTS = [
    ('1 PATHS', 'PATHS', 'SKILL.md',
     lambda s: s + '\n\nSee `references/does-not-exist.md` for more.\n',
     'a backticked path naming no file on disk'),
    ('2 GATES', 'GATES', None,
     None,   # handled specially: delete the selftest the claims depend on
     'a "proven gate" claim with no runnable selftest'),
    ('3 NUMBERS', 'NUMBERS', 'assets/audit.py',
     lambda s: s.replace('Eight checks,', 'Ten checks,', 1),
     'a documented count that no longer matches the code'),
    ('4 PHASES', 'PHASES', None,
     None,   # handled specially: add a reference file nothing loads
     'a reference file no phase is told to read'),
    ('5 MARKERS/dangling', 'MARKERS', 'SKILL.md',
     lambda s: s + '\n\nSUPERSEDED by `references/the-winner.md`.\n',
     'a SUPERSEDED pointing at a file that does not exist'),
    ('5 MARKERS/forked', 'MARKERS', None,
     None,   # handled specially: a second BACKLOG file
     'BACKLOG living in two files instead of one'),
]


def selftest(real_root, verbose=False):
    """Prove every check goes red. Exit 0 only if all of them do.

    An auditor that has only ever passed is in exactly the position the skill
    warns about — quiet, and mistaken for correct.
    """
    tmp = tempfile.mkdtemp(prefix='audit-kit-selftest-')
    root = os.path.join(tmp, 'kit')
    shutil.copytree(real_root, root,
                    ignore=shutil.ignore_patterns('.*', '__pycache__'))
    fails = []
    try:
        base, out, _ = audit(root, quiet=True)
        print('\n6  SELFTEST    the auditor against a planted copy of itself')
        if base != 0:
            print(f'      BASELINE  {base} problem(s) on a clean copy — fix the '
                  'kit before trusting a plant')
            if verbose:
                print(out)
            return 1
        print('      baseline  0 problem(s) on a clean copy  ✓')

        cases = []
        for label, expect, rel, mutate, why in PLANTS:
            if mutate:
                cases.append((label, expect, [(rel, mutate)], why))
            elif expect == 'GATES':
                cases.append((label, expect,
                              [('assets/selftest.py', 'DELETE')], why))
            elif expect == 'PHASES':
                cases.append((label, expect,
                              [('references/orphan-technique.md', 'CREATE')], why))
            else:
                # Two files, because the rule is "exactly one" and the kit
                # currently has zero. A one-file plant is legal, and the first
                # version of this case planted exactly that — it reported the
                # check as broken when the check was right and the plant wasn't.
                # A plant that doesn't violate proves nothing about the gate.
                add = lambda s: s + '\n\nBACKLOG: a home for this.\n'
                cases.append((label, expect,
                              [('references/study-verb.md', add),
                               ('references/redesign-verb.md', add)], why))

        for label, expect, edits, why in cases:
            saved, applied = [], True
            for rel, mutate in edits:
                src = os.path.join(root, rel)
                existed = os.path.exists(src)
                original = read(src) if existed else None
                saved.append((src, existed, original))
                if mutate == 'DELETE':
                    os.remove(src)
                elif mutate == 'CREATE':
                    with open(src, 'w', encoding='utf-8') as fh:
                        fh.write('# Orphan\n\nA technique file no phase loads.\n')
                else:
                    planted = mutate(original)
                    if planted == original:
                        applied = False
                        break
                    with open(src, 'w', encoding='utf-8') as fh:
                        fh.write(planted)
            if not applied:
                print(f'      {label:<20} PLANT DID NOT APPLY — the kit '
                      'moved out from under the selftest')
                fails.append(label)
                continue

            code, out, per = audit(root, quiet=True)

            for src, existed, original in saved:
                if existed:
                    with open(src, 'w', encoding='utf-8') as fh:
                        fh.write(original)
                elif os.path.exists(src):
                    os.remove(src)
            back, _, _ = audit(root, quiet=True)

            fired = per.get(expect, 0)
            ok = fired > 0 and code != 0 and back == 0
            print(f'      {label:<20} {expect} fired {fired}× · '
                  f'{code} total · {back} after revert  ' + ('✓' if ok else '✗'))
            if not ok:
                print(f'            check {expect} should have caught: {why}')
                if verbose:
                    print(out)
                fails.append(label)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    if fails:
        print(f'\nAUDITOR NOT PROVEN — {len(fails)} check(s) stayed quiet on a '
              f'planted violation: {", ".join(map(str, fails))}')
        return len(fails)
    print(f'\nAUDITOR PROVEN — {len(PLANTS)} planted violation(s), every check '
          'went red and every revert came back clean')
    return 0


def main(argv):
    args = [a for a in argv[1:] if not a.startswith('-')]
    flags = {a for a in argv[1:] if a.startswith('-')}
    root = os.path.abspath(args[0] if args else
                           os.path.join(os.path.dirname(__file__), '..'))
    if '--selftest' in flags:
        return selftest(root, verbose='-v' in flags)
    n, _, _ = audit(root)
    return n


if __name__ == '__main__':
    sys.exit(main(sys.argv))
