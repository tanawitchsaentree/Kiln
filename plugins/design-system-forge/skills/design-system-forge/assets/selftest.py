#!/usr/bin/env python3
"""selftest — prove audit.py's gates fire. Exit 0 = every gate proven.

The skill tells everyone to break a token deliberately and confirm a non-zero
exit before claiming a gate works. This is that discipline as a runnable thing,
because a gate that has only ever passed is not known to work — it is known to
be quiet, and those are different.

It builds a tiny synthetic design system in a temp directory, asserts audit.py
calls it clean, then plants one violation per counted gate and asserts the exit
code moves. Synthetic rather than pointed at a real project on purpose: a
fixture that ships with the checker cannot drift out from under it, and the
proof stays true on a machine where no design system exists yet.

The negative cases matter as much as the positive ones. audit.py documents that
checks 2 and 3 are for judgement and are NOT counted as failures; if planting a
dead token moved the exit code, that promise would be false and every "0
failures" report built on it would be overstated.

  python3 assets/selftest.py [-v]
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIT = os.path.join(HERE, 'audit.py')

PRIMITIVES = """\
:root {
  --gray-0:   #ffffff;
  --gray-300: #d4d4d4;
  --gray-600: #595959;
  --gray-900: #111111;
  --gray-400: #9a9a9a;
  --blue-600: #1d4ed8;

  --space-3:    12px;
  --radius-2:   4px;
  --duration-2: 160ms;
  --ease-out:   cubic-bezier(.2,.7,.3,1);
}
"""

# Two theme blocks that must stay identical, because check 5 exists to catch the
# moment they stop being. Written out longhand rather than generated: the drift
# plant needs a real second copy to fall out of sync with.
DARK_BODY = """\
  --bg-canvas:         var(--gray-900);
  --bg-surface:        var(--gray-900);
  --fg-default:        var(--gray-0);
  --fg-muted:          var(--gray-400);
  --border-strong:     var(--gray-400);
  --action-primary-bg: var(--blue-600);
  --action-primary-fg: var(--gray-0);
"""

SEMANTIC = """\
:root,
[data-theme="light"] {
  --bg-canvas:         var(--gray-0);
  --bg-surface:        var(--gray-0);
  --fg-default:        var(--gray-900);
  --fg-muted:          var(--gray-600);
  --border-strong:     var(--gray-600);
  --action-primary-bg: var(--blue-600);
  --action-primary-fg: var(--gray-0);
}

[data-theme="dark"] {
%s}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
%s  }
}
""" % (DARK_BODY, DARK_BODY)

BUTTON = """\
.btn {
  --btn-bg: var(--action-primary-bg);
  --btn-fg: var(--action-primary-fg);
  background: var(--btn-bg);
  color: var(--btn-fg);
  padding: var(--space-3);
  border-radius: var(--radius-2);
  border: 1px solid var(--border-strong);
}

@media (prefers-reduced-motion: no-preference) {
  .btn { transition: background var(--duration-2) var(--ease-out); }
}
"""

PAGE = """\
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>fixture</title>
<link rel="stylesheet" href="css/primitives.css">
<link rel="stylesheet" href="css/semantic.css">
<link rel="stylesheet" href="css/components/button.css">
<style>
  /* Scale steps only. Reading --space-3 from a page is correct use of the
     shared vocabulary; reading anything a theme swaps is check 7's business. */
  .hero { padding: var(--space-3); color: var(--fg-default); }
</style>
</head><body><button class="btn">Go</button></body></html>
"""

FIXTURE = {
    'css/primitives.css': PRIMITIVES,
    'css/semantic.css': SEMANTIC,
    'css/components/button.css': BUTTON,
    'index.html': PAGE,
}

# (gate, file, what to plant, why the gate must move)
# Each plant is the smallest edit that violates exactly one counted gate.
PLANTS = [
    (1, 'CONTRAST', 'css/semantic.css',
     lambda s: s.replace('--fg-muted:          var(--gray-600);',
                         '--fg-muted:          var(--gray-300);', 1),
     '#d4d4d4 body text on white is 1.6:1 — below the 4.5 floor'),
    (4, 'PURITY', 'css/components/button.css',
     lambda s: s.replace('.btn {', '.btn { outline-color: #ff0000;', 1),
     'a hex outside Layer 1 cannot be re-themed'),
    (5, 'DRIFT', 'css/semantic.css',
     lambda s: s[:s.rindex('--fg-muted:          var(--gray-400);')]
     + '--fg-muted:          var(--gray-600);'
     + s[s.rindex('--fg-muted:          var(--gray-400);')
         + len('--fg-muted:          var(--gray-400);'):],
     'the prefers-color-scheme copy no longer matches [data-theme="dark"]'),
    (6, 'MOTION', 'css/components/button.css',
     lambda s: s + '\n.btn:hover { transition: transform 200ms linear; }\n',
     'motion outside a reduced-motion guard'),
    (7, 'INLINE', 'index.html',
     lambda s: s.replace('.hero {', '.hero { background: var(--blue-600);', 1),
     'page CSS reading a themed primitive renders identically in dark mode'),
    (8, 'STATIC', 'css/components/button.css',
     lambda s: s + '\n.badge:hover { background: var(--gray-300); }\n',
     'a :hover rule with no transition anywhere fires with no signal to the user'),
]

# Plants that must NOT move the exit code. A checker that counts what it says it
# does not count makes every clean report an overstatement.
NEGATIVE = [
    # Declared in the base block, not in a theme override, and named so no
    # pairing rule claims it. The first version of this plant went into
    # [data-theme="dark"] only and moved the exit code — correctly, via check 5,
    # since a dark-only declaration IS drift. A plant that violates two gates
    # proves neither.
    ('3  DEAD TOKENS', 'css/semantic.css',
     lambda s: s.replace('  --bg-canvas:         var(--gray-0);',
                         '  --bg-canvas:         var(--gray-0);\n'
                         '  --legacy-tint:       var(--gray-300);', 1),
     'a dead role is a diagnosis, not a failure — audit.py must report it uncounted'),
    ('2  UNPAIRED', 'css/semantic.css',
     lambda s: s.replace('  --bg-canvas:         var(--gray-0);',
                         '  --bg-canvas:         var(--gray-0);\n'
                         '  --fg-on-nothing:     var(--gray-900);', 1),
     'an unpairable token is unaudited, not failing'),
]


def write_fixture(root, files=None):
    for rel, body in (files or FIXTURE).items():
        p = os.path.join(root, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, 'w', encoding='utf-8') as fh:
            fh.write(body)


def run_audit(root):
    r = subprocess.run([sys.executable, AUDIT, root, '--quiet', '--no-shell'],
                       capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def main(argv):
    verbose = '-v' in argv
    if not os.path.exists(AUDIT):
        print(f'selftest: audit.py not found at {AUDIT}')
        return 1

    root = tempfile.mkdtemp(prefix='dsf-selftest-')
    fails = []
    try:
        write_fixture(root)
        code, out = run_audit(root)
        print(f'selftest — {os.path.basename(AUDIT)} against a synthetic system')
        if code != 0:
            print(f'  BASELINE  exit {code} on a clean fixture — a gate is firing '
                  'on correct code, which is how gates get switched off')
            if verbose:
                print(out)
            fails.append('baseline')
            return 1
        n_checks = len(set(re.findall(r'^(\d)  [A-Z]', out, re.M)))
        print(f'  baseline  exit 0 · {n_checks} numbered check(s) reported  ✓')

        for num, name, rel, mutate, why in PLANTS:
            src = os.path.join(root, rel)
            original = open(src, encoding='utf-8').read()
            planted = mutate(original)
            if planted == original:
                print(f'  {num} {name:<9} PLANT DID NOT APPLY — the fixture moved '
                      'out from under the selftest')
                fails.append(name)
                continue
            open(src, 'w', encoding='utf-8').write(planted)
            code, out = run_audit(root)
            open(src, 'w', encoding='utf-8').write(original)     # revert, always
            back, _ = run_audit(root)
            ok = code != 0 and back == 0
            print(f'  {num} {name:<9} exit {code} on plant · {back} after revert  '
                  + ('✓' if ok else '✗'))
            if not ok:
                print(f'        expected non-zero: {why}')
                if verbose:
                    print(out)
                fails.append(name)

        for label, rel, mutate, why in NEGATIVE:
            src = os.path.join(root, rel)
            original = open(src, encoding='utf-8').read()
            open(src, 'w', encoding='utf-8').write(mutate(original))
            code, out = run_audit(root)
            open(src, 'w', encoding='utf-8').write(original)
            reported = label.split('  ')[1].split()[0] in out
            ok = code == 0 and reported
            print(f'  {label:<15} uncounted: exit {code}, reported in output: '
                  f'{reported}  ' + ('✓' if ok else '✗'))
            if not ok:
                print(f'        {why}')
                fails.append(label)
    finally:
        shutil.rmtree(root, ignore_errors=True)

    if fails:
        print(f'\nSELFTEST FAILING — {len(fails)}: {", ".join(map(str, fails))}')
        return len(fails)
    print('\nSELFTEST PASS — every counted gate goes red on a planted violation, '
          'every uncounted one stays quiet')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
