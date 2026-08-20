#!/usr/bin/env python3
"""design-system-forge — audit. Reads a design system, changes nothing.

Eight checks, all arithmetic or grep — no judgement calls, no style opinions:

  1  CONTRAST      every inferable pair, every theme, against its WCAG floor.
                   Borders are checked against BOTH adjacent grounds, because a
                   border sits between two of them.
  2  UNPAIRED      tokens whose intended pairing could not be inferred, so you
                   can see exactly what check 1 did NOT cover.
  3  DEAD TOKENS   defined and never consumed (transitively). Usually a spec
                   that failed contrast and was abandoned without being deleted.
  4  PURITY        raw colour or raw px outside the primitive layer.
  5  THEME DRIFT   a [data-theme="dark"] block and a hand-duplicated
                   prefers-color-scheme block that have fallen out of sync.
  6  MOTION GUARD  transition/animation outside prefers-reduced-motion.
  7  INLINE CSS    page-local <style> blocks reading a THEMED primitive. Checks
                   1-6 walk .css only, so this is the one hole they leave.
  8  STATIC        a :hover/:focus-visible/:focus/:active rule on the styled
                   element with no transition/animation anywhere for it, or a
                   `linear` transition (transitions never loop, so `linear` on
                   one always means the curve was never actually chosen).

Understands hex, rgb(), hsl(), oklch(), and alpha — alpha-bearing foregrounds
are composited over their ground rather than skipped.

Usage
  python3 audit.py [PROJECT_DIR] [--layer1 css/primitives.css] [--quiet]

Exit code is the number of failures, capped at 125. Zero means clean.
"""

import math
import os
import re
import sys

# ---------------------------------------------------------------- colour ----
# Everything normalises to (r, g, b, a) in gamma sRGB 0-255, because that is
# the space browsers composite in. Luminance converts to linear afterwards.

NAMED = {
    'white': (255, 255, 255, 1.0), 'black': (0, 0, 0, 1.0),
    'transparent': (0, 0, 0, 0.0), 'currentcolor': None,
}


def _num(tok, scale=1.0):
    tok = tok.strip()
    if tok.endswith('%'):
        return float(tok[:-1]) / 100 * scale
    return float(tok)


def _oklch_to_srgb(L, C, H, a):
    h = math.radians(H)
    A, B = C * math.cos(h), C * math.sin(h)
    l_ = L + 0.3963377774 * A + 0.2158037573 * B
    m_ = L - 0.1055613458 * A - 0.0638541728 * B
    s_ = L - 0.0894841775 * A - 1.2914855480 * B
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    lin = (
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    )
    out = []
    for v in lin:
        v = max(0.0, min(1.0, v))
        v = 12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055
        out.append(max(0.0, min(1.0, v)) * 255)
    return (out[0], out[1], out[2], a)


def _hsl_to_srgb(h, s, l, a):
    h = (h % 360) / 360
    def f(p, q, t):
        t = t % 1
        if t < 1 / 6: return p + (q - p) * 6 * t
        if t < 1 / 2: return q
        if t < 2 / 3: return p + (q - p) * (2 / 3 - t) * 6
        return p
    if s == 0:
        r = g = b = l
    else:
        q = l * (1 + s) if l < 0.5 else l + s - l * s
        p = 2 * l - q
        r, g, b = f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)
    return (r * 255, g * 255, b * 255, a)


def parse_color(v):
    """CSS colour string -> (r, g, b, a) gamma sRGB, or None if unsupported."""
    if v is None:
        return None
    v = v.strip().lower()
    if v in NAMED:
        return NAMED[v]

    if v.startswith('#'):
        h = v[1:]
        if len(h) in (3, 4):
            h = ''.join(c * 2 for c in h)
        if len(h) not in (6, 8):
            return None
        try:
            n = [int(h[i:i + 2], 16) for i in range(0, len(h), 2)]
        except ValueError:
            return None
        a = n[3] / 255 if len(n) == 4 else 1.0
        return (n[0], n[1], n[2], a)

    m = re.match(r'(rgba?|hsla?|oklch)\(([^()]*)\)$', v)
    if not m:
        return None
    fn, body = m.group(1), m.group(2)
    alpha = 1.0
    if '/' in body:
        body, _, at = body.partition('/')
        alpha = _num(at)
    parts = [p for p in re.split(r'[,\s]+', body.strip()) if p]

    try:
        if fn.startswith('rgb'):
            if len(parts) < 3:
                return None
            c = [_num(p, 255) for p in parts[:3]]
            if len(parts) > 3:
                alpha = _num(parts[3])
            return (c[0], c[1], c[2], alpha)
        if fn.startswith('hsl'):
            if len(parts) < 3:
                return None
            hue = float(re.sub(r'deg$', '', parts[0]))
            if len(parts) > 3:
                alpha = _num(parts[3])
            return _hsl_to_srgb(hue, _num(parts[1]), _num(parts[2]), alpha)
        if fn == 'oklch':
            if len(parts) < 3:
                return None
            L = _num(parts[0])          # 0-1, or a percentage
            C = _num(parts[1])
            H = float(re.sub(r'deg$', '', parts[2]))
            if len(parts) > 3:
                alpha = _num(parts[3])
            return _oklch_to_srgb(L, C, H, alpha)
    except (ValueError, IndexError):
        return None
    return None


def over(fg, bg):
    """Composite fg over bg in gamma space, the way a browser does."""
    a = fg[3]
    if a >= 1.0:
        return fg
    return tuple(fg[i] * a + bg[i] * (1 - a) for i in range(3)) + (1.0,)


def luminance(c):
    def lin(x):
        x /= 255
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])


def contrast(fg, bg):
    fg = over(fg, bg)
    la, lb = luminance(fg), luminance(bg)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# ------------------------------------------------------------------ parse ----

DECL = re.compile(r'(--[\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)')


def strip_comments(s):
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)


def rules(css):
    """[(selector, {token: value})] — innermost blocks, so @media nesting works.

    Keeping only the LAST line of the selector text was a real bug: it is right
    for `@media (...) {` wrappers, where the preceding lines are the at-rule and
    the actual selector is last, but a multi-line selector LIST loses every line
    but one. `:root,\\n[data-theme="light"]` became `[data-theme="light"]`, so
    every semantic role landed in the light override and none in the base table —
    which understated the system's token count by 65 and would have hidden any
    root-only declaration from the layer checks entirely. Drop the at-rule lines
    specifically, then keep everything else joined for split_selector.
    """
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        lines = [l.strip() for l in m.group(1).strip().split('\n') if l.strip()]
        # `@media ... {` and friends open their own block; the selector is what
        # follows them. A trailing comma means the list continues on the next line.
        keep, carry = [], False
        for l in lines:
            if l.startswith('@') and not carry:
                keep = []
            else:
                keep.append(l)
            carry = l.endswith(',')
        sel = ' '.join(keep).strip()
        decls = dict(DECL.findall(m.group(2)))
        if decls and sel:
            out.append((sel, decls))
    return out


def css_files(root):
    found = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in
                       ('node_modules', '.git', 'dist', 'build', '__pycache__')]
        for f in sorted(filenames):
            if f.endswith('.css'):
                found.append(os.path.join(dirpath, f))
    return sorted(found)


def split_selector(sel):
    """Top-level comma split. `:root, [data-theme="light"]` is TWO selectors and
    contributes to two different tables — treating it as one string made every
    root token invisible in an earlier version of this script."""
    parts, depth, cur = [], 0, ''
    for ch in sel:
        if ch in '([':
            depth += 1
        elif ch in ')]':
            depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur)
            cur = ''
        else:
            cur += ch
    parts.append(cur)
    return [p.strip() for p in parts if p.strip()]


def collect_themes(files, root):
    """Build one resolved token table per theme.

    base  = every :root declaration (primitives + the default theme)
    theme = base, then that theme's overrides — the real cascade, not the
            override block alone. Starting from primitives only was a bug in an
            earlier version of this script and it made every dark number wrong.
    """
    base, overrides, sel_of = {}, {}, {}
    for path in files:
        css = strip_comments(open(path, encoding='utf-8').read())
        for sel, decls in rules(css):
            for part in split_selector(re.sub(r'\s+', ' ', sel)):
                names = set(re.findall(r'\[data-theme="([\w-]+)"\]', part))
                neg = set(re.findall(r':not\(\[data-theme="([\w-]+)"\]\)', part))
                positive = names - neg
                if positive:
                    for n in positive:
                        overrides.setdefault(n, {}).update(decls)
                        sel_of.setdefault(n, part)
                elif neg:
                    # :root:not([data-theme="light"]) inside prefers-color-scheme
                    # — a hand-duplicated block. Audited separately on purpose:
                    # that is where drift hides.
                    overrides.setdefault('os-default', {}).update(decls)
                    sel_of.setdefault('os-default', part)
                elif re.match(r'^:root\b', part) or part == 'html':
                    base.update(decls)

    themes = {'default': dict(base)}
    for name, decls in overrides.items():
        t = dict(base)
        t.update(decls)
        themes[name] = t

    # A theme declared on both :root and [data-theme="x"] resolves identically
    # to `default`, and a prefers-color-scheme duplicate resolves identically to
    # the theme it duplicates. Reporting those twice inflates the numbers
    # without adding a single new fact, so collapse them and say so.
    unique, alias = {}, {}
    for name in sorted(themes, key=lambda n: (n != 'default', n)):
        sig = tuple(sorted(themes[name].items()))
        if sig in unique:
            alias.setdefault(unique[sig], []).append(name)
        else:
            unique[sig] = name
    themes = {n: themes[n] for n in unique.values()}
    return themes, base, overrides, sel_of, alias


def resolver(tbl):
    def res(token, depth=0):
        v = tbl.get(token)
        if v is None or depth > 16:
            return None
        v = v.strip()
        m = re.fullmatch(r'var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)', v)
        if m:
            r = res(m.group(1), depth + 1)
            if r is None and m.group(2):
                return parse_color(m.group(2))
            return r
        return parse_color(v)
    return res


# ------------------------------------------------------------------ pairs ----

CONTENT = re.compile(r'--fg-(default|muted|subtle|inert|body|primary|secondary|tertiary)$')
UI_BORDER = re.compile(r'--border-(control|strong|focus|interactive|input|default)$')


def build_pairs(names):
    """Infer (fg, bg, floor, why, tier) from the naming convention.

    tier 'hard' — the pairing is certain from the names, so a miss is a failure.
    tier 'soft' — the pairing is plausible but unproven (is subtle text ever
                  actually placed on the sunken ground?). Reported, not counted:
                  a gate that cries wolf gets ignored, and an uncounted warning
                  that turns out to be real is still in front of you.

    Anything it cannot pair at all is returned separately and printed, so the
    report never implies coverage it does not have.
    """
    pairs, unpaired = [], []
    have = lambda t: t in names
    grounds = [g for g in ('--bg-canvas', '--bg-surface', '--bg-surface-raised',
                           '--bg-surface-sunken') if have(g)]
    body = [g for g in ('--bg-canvas', '--bg-surface') if have(g)] or grounds
    tier = lambda g: 'hard' if g in body else 'soft'

    for t in sorted(names):
        # WCAG 1.4.3 and 1.4.11 both exempt disabled/inactive components. A
        # disabled control is SUPPOSED to recede; holding its outline to 3:1
        # makes "disabled" indistinguishable from "enabled", which is worse for
        # everyone. Disabled TEXT still gets a soft 3:1 — it has to be readable
        # enough to understand what is unavailable.
        if re.fullmatch(r'--action-disabled-(border|bg)', t):
            continue

        if CONTENT.fullmatch(t):
            for g in grounds:
                pairs.append((t, g, 4.5, 'text', tier(g)))
            continue

        m = re.fullmatch(r'--fg-on-(.+)', t)
        if m:
            key = m.group(1)
            cands = [c for c in (f'--bg-{key}', f'--action-{key}-bg',
                                 f'--{key}-bg', f'--status-{key}-bg') if have(c)]
            if key == 'accent':
                cands = [c for c in ('--action-primary-bg', '--bg-accent') if have(c)]
            if cands:
                for g in cands:
                    pairs.append((t, g, 4.5, f'text on {key}', 'hard'))
            else:
                unpaired.append((t, f'no --bg-{key} / --action-{key}-bg to pair against'))
            continue

        if UI_BORDER.fullmatch(t):
            for g in grounds:
                pairs.append((t, g, 3.0, 'control boundary', tier(g)))
            continue

        if re.fullmatch(r'--border-(subtle|divider|muted|hairline)', t):
            continue   # decorative: SC 1.4.11 exempts it

        m = re.fullmatch(r'--status-(\w+)-fg(?:-on-surface)?', t)
        if m:
            s = m.group(1)
            if t.endswith('-on-surface'):
                for g in body:
                    pairs.append((t, g, 4.5, f'{s} text on page', 'hard'))
            elif have(f'--status-{s}-bg'):
                pairs.append((t, f'--status-{s}-bg', 4.5, f'{s} text', 'hard'))
            else:
                unpaired.append((t, f'no --status-{s}-bg'))
            continue

        m = re.fullmatch(r'--status-(\w+)-border', t)
        if m:
            s = m.group(1)
            if have(f'--status-{s}-bg'):
                pairs.append((t, f'--status-{s}-bg', 3.0,
                              f'{s} border vs own fill', 'hard'))
            for g in body:
                pairs.append((t, g, 3.0, f'{s} border vs page', 'hard'))
            continue

        m = re.fullmatch(r'--action-([\w]+)-fg', t)
        if m:
            v = m.group(1)
            floor = 3.0 if v == 'disabled' else 4.5
            bgs = [b for b in (f'--action-{v}-bg', f'--action-{v}-bg-hover',
                               f'--action-{v}-bg-active') if have(b)]
            if bgs:
                for g in bgs:
                    pairs.append((t, g, floor, f'{v} label', 'hard'))
            # A transparent or absent fill means the label sits on the page, so
            # the page is the ground that matters. resolve() returns alpha 0 for
            # `transparent` and the runner drops those pairs, so adding the page
            # here is what keeps ghost/secondary buttons covered at all.
            if not bgs or v in ('secondary', 'ghost', 'tertiary', 'link'):
                for g in body:
                    pairs.append((t, g, floor, f'{v} label on page', 'hard'))
            continue

        m = re.fullmatch(r'--action-([\w]+)-border', t)
        if m:
            for g in body:
                pairs.append((t, g, 3.0, f'{m.group(1)} outline', 'hard'))
            continue

        if re.fullmatch(r'--link-fg(-hover|-visited)?', t):
            for g in body:
                pairs.append((t, g, 4.5, 'link', 'hard'))
            continue

        if re.fullmatch(r'--(signal|accent|indicator)-live', t) or t == '--focus-color':
            for g in body:
                pairs.append((t, g, 3.0, 'structural indicator', 'hard'))
            continue

    return pairs, unpaired


# ----------------------------------------------------------------- checks ----

def check_contrast(themes, alias, quiet):
    names = set()
    for t in themes.values():
        names |= set(t)
    pairs, unpaired = build_pairs(names)
    total, skipped, fails, warns = 0, [], [], []

    for theme in sorted(themes):
        res = resolver(themes[theme])
        for fg, bg, floor, why, tier in pairs:
            a, b = res(fg), res(bg)
            if a is None or b is None:
                skipped.append((theme, fg, bg))
                continue
            if b[3] == 0:
                continue          # a transparent ground is not a ground
            total += 1
            r = contrast(a, b)
            if r < floor - 0.005:
                (fails if tier == 'hard' else warns).append(
                    (theme, fg, bg, round(r, 2), floor, why))

    note = ''
    if alias:
        note = '  (' + '; '.join(f'{k} ≡ {", ".join(v)}' for k, v in alias.items()) + ')'
    print(f'1  CONTRAST      {total} checks across {len(themes)} distinct theme(s)'
          f' — {len(fails)} failure(s), {len(warns)} warning(s){note}')
    for theme, fg, bg, r, floor, why in fails:
        print(f'      FAIL  {theme:<10} {fg} on {bg}   {r} < {floor}   ({why})')
    for theme, fg, bg, r, floor, why in warns:
        print(f'      warn  {theme:<10} {fg} on {bg}   {r} < {floor}   ({why}'
              f' — only if that combination is actually used)')
    if skipped and not quiet:
        seen = set()
        for theme, fg, bg in skipped:
            if (fg, bg) not in seen:
                seen.add((fg, bg))
                print(f'      skip  {fg} on {bg} — unresolved')

    print(f'\n2  UNPAIRED      {len(unpaired)} token(s) no rule could pair'
          f' — NOT covered by check 1')
    for t, why in unpaired:
        print(f'      {t}  ({why})')
    return len(fails)


def check_dead(files, root):
    """Defined, and read by nothing anywhere.

    A Layer 3 contract like --btn-bg is declared and consumed inside the same
    file — that IS the architecture, so "referenced outside its own file" is the
    wrong test and flags every component contract in the system. The only
    signal that holds is: does any var() anywhere read this token at all.

    Split into two lists, because they mean different things. An unused SCALE
    step (--space-20, --text-5xl) is a complete scale with headroom, which is
    correct by design. An unused SEMANTIC ROLE is a spec that was written and
    abandoned — usually because it failed contrast — and it will mislead the
    next person who greps for it.
    """
    defined = {}
    scan = list(files)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in
                       ('node_modules', '.git', 'dist', 'build', '__pycache__')]
        for f in sorted(filenames):
            if f.endswith(('.html', '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte')):
                scan.append(os.path.join(dirpath, f))

    for path in files:
        css = strip_comments(open(path, encoding='utf-8').read())
        for name, _ in DECL.findall(css):
            defined.setdefault(name, path)

    read = set()
    for path in scan:
        try:
            txt = open(path, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        body = strip_comments(txt) if path.endswith('.css') else txt
        read |= set(re.findall(r'var\(\s*(--[\w-]+)', body))
        # A token NAMED in markup and resolved at runtime is read just as
        # genuinely as one inside var(). The live-swatch idiom this template
        # requires — <div data-token="--alu-500"> with getComputedStyle doing
        # the lookup — produces no var() anywhere, so a var()-only scan called
        # two documented ramp steps dead. Over-reporting dead tokens is how a
        # correct token gets deleted on the strength of a clean-looking audit.
        if not path.endswith('.css'):
            for attr in re.findall(r'data-[\w-]*\s*=\s*"([^"]*--[^"]*)"', body):
                read |= set(re.findall(r'(--[\w-]+)', attr))

    SCALE = re.compile(r'--(space|text|leading|tracking|weight|radius|shadow|z|'
                       r'duration|ease|stroke|screen|breakpoint)-|'
                       r'--[a-z]+-(50|1?[0-9]00|950)$')
    roles = sorted(t for t in defined if t not in read and not SCALE.search(t))
    scale = sorted(t for t in defined if t not in read and SCALE.search(t))

    print(f'\n3  DEAD TOKENS   {len(roles)} unused semantic role(s), '
          f'{len(scale)} unused scale step(s)')
    for t in roles:
        print(f'      role   {t}   ({os.path.relpath(defined[t], root)})'
              '  ← a spec that was abandoned, or a real gap')
    if scale:
        print(f'      scale  {", ".join(scale)}'
              '  ← headroom in a complete scale, normally fine')
    return 0                             # a smell to judge, never a gate


def check_purity(files, root, layer1, shell):
    """Raw values in the SYSTEM's layers only.

    The shell chrome is deliberately a separate namespace with its own literals
    — it is documentation, not part of the system being documented, and holding
    it to the system's layer rules is a category error. It is counted and named
    so the exemption is visible rather than silent.
    """
    l1 = os.path.normpath(os.path.join(root, layer1))
    colour = re.compile(r'#[0-9A-Fa-f]{3,8}\b|(?<![\w-])(?:rgba?|hsla?|oklch|lab|lch)\(')
    # 0 and ±1px are resets and hairlines, not spacing decisions. The
    # visually-hidden clip idiom needs `margin: -1px` specifically and a token
    # there would be wrong, not better. Flag 2px and up — that is where a real
    # off-scale spacing choice starts.
    rawpx = re.compile(r'(padding|margin|gap|font-size|border-radius)[\w-]*\s*:'
                       r'\s*[^;]*?(?<![\d.])-?(?!0px|1px)\d+(?:\.\d+)?px')
    hits, exempt = 0, 0
    for path in files:
        if os.path.normpath(path) == l1:
            continue
        rel = os.path.relpath(path, root)
        is_shell = shell and os.path.basename(path) == os.path.basename(shell)
        for i, line in enumerate(strip_comments(open(path, encoding='utf-8').read()).split('\n'), 1):
            bad = bool(colour.search(line)) or (rawpx.search(line) and 'var(' not in line)
            if not bad:
                continue
            if is_shell:
                exempt += 1
                continue
            kind = 'raw colour' if colour.search(line) else 'raw px    '
            print(f'      {kind}  {rel}:{i}  {line.strip()[:70]}')
            hits += 1
    head = f'\n4  PURITY        {hits} raw value(s) in the system layers'
    print(head if hits else head + '  ✓')
    if exempt:
        print(f'      ({exempt} in {shell} — chrome namespace, exempt by design)')
    return hits


def check_inline_style(root, themed_primitives):
    """Page-local <style> blocks are still system CSS, and nothing was checking them.

    Every earlier check walks .css files, so a rule written in an inline <style>
    got a free pass on both layer purity and raw values. That is not a
    theoretical hole: it is where this check's first real finding lived — a hero
    reading Layer 1 primitives directly and inventing four alpha content levels
    on a plate whose semantic layer documents that exactly one is possible.

    Only THEMED primitives are gated, and that distinction is the whole check.
    A first pass flagged every `var(--space-3)` and `var(--text-2xs)` in page CSS
    — 54 findings, all of them wrong. Scale steps have no semantic alias to read
    instead; the scale IS the shared vocabulary, and a page consuming it is using
    the system correctly. What actually breaks is reading a primitive the theme
    swaps: `var(--ember-400)` renders identically in dark mode, and that is the
    defect the layer rule exists to prevent. So the gate is "is this token
    redefined by any theme", not "is this token in Layer 1".

    Inline blocks legitimately hold page-local composition, so raw literals are
    warned, not gated: chrome furniture lives here too, exempt by the same logic
    that exempts shell.css.

    Alpha over a known ground is the case a static checker cannot resolve — it
    needs the composite — so any alpha ink used as a colour is surfaced for a
    human to compute rather than silently passed.
    """
    pages, l1_hits, raw_hits, alpha_hits = [], [], [], []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in
                       ('node_modules', '.git', 'dist', 'build', '__pycache__')]
        for f in sorted(filenames):
            if f.endswith(('.html', '.htm')):
                pages.append(os.path.join(dirpath, f))

    colour = re.compile(r'#[0-9A-Fa-f]{3,8}\b|(?<![\w-])(?:rgba?|hsla?|oklch|lab|lch)\(')
    alpha = re.compile(r'(?:rgba\([^)]*,\s*0?\.\d+\s*\)|'
                       r'rgba?\([^)]*/\s*0?\.\d+\s*\)|opacity\s*:\s*0?\.\d+)')
    rawpx = re.compile(r'(padding|margin|gap|font-size|border-radius)[\w-]*\s*:'
                       r'\s*[^;]*?(?<![\d.])-?(?!0px|1px)\d+(?:\.\d+)?px')
    for path in pages:
        try:
            txt = open(path, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        rel = os.path.relpath(path, root)
        for m in re.finditer(r'<style[^>]*>(.*?)</style>', txt, re.S):
            base = txt[:m.start()].count('\n') + 1
            block = strip_comments(m.group(1))
            for i, line in enumerate(block.split('\n')):
                ln, s = base + i, line.strip()
                for tok in re.findall(r'var\(\s*(--[\w-]+)', line):
                    if tok in themed_primitives:
                        l1_hits.append((rel, ln, tok, s[:60]))
                if alpha.search(line) and not line.lstrip().startswith('--'):
                    alpha_hits.append((rel, ln, s[:66]))
                elif colour.search(line) or (rawpx.search(line) and 'var(' not in line):
                    raw_hits.append((rel, ln, s[:66]))

    n = len(l1_hits)
    print(f'\n7  INLINE CSS    {len(pages)} page(s) · {n} themed-primitive read(s) '
          'in page <style>' + ('' if n else '  ✓'))
    for rel, ln, tok, s in l1_hits:
        print(f'      layer1  {rel}:{ln}  {tok}  in  {s}'
              '\n              ← a theme swaps this; page CSS must read the semantic role')
    for rel, ln, s in alpha_hits:
        print(f'      alpha   {rel}:{ln}  {s}'
              '\n              ← compute the composite over its ground; a static check cannot')
    for rel, ln, s in raw_hits:
        print(f'      warn    {rel}:{ln}  {s}   (page-local chrome is fine; system CSS is not)')
    return n


def check_drift(overrides, sel_of):
    """Two blocks meant to say the same thing, maintained by hand."""
    dark = overrides.get('dark')
    osd = overrides.get('os-default')
    print('\n5  THEME DRIFT   ', end='')
    if not dark or not osd:
        print('n/a — no duplicated prefers-color-scheme block')
        return 0
    missing = sorted(set(dark) - set(osd))
    extra = sorted(set(osd) - set(dark))
    differ = sorted(t for t in set(dark) & set(osd)
                    if dark[t].strip() != osd[t].strip())
    n = len(missing) + len(extra) + len(differ)
    print(f'{n} discrepancy(ies) between [data-theme="dark"] and {sel_of["os-default"]}')
    for t in missing:
        print(f'      only in [data-theme="dark"]        {t}')
    for t in extra:
        print(f'      only in prefers-color-scheme       {t}')
    for t in differ:
        print(f'      different value                    {t}'
              f'   {dark[t].strip()}  vs  {osd[t].strip()}')
    return n


def _block_end(css, open_brace):
    depth, i = 0, open_brace
    while i < len(css):
        if css[i] == '{':
            depth += 1
        elif css[i] == '}':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return len(css)


def check_motion(files, root):
    """Two valid patterns, and the checker must accept both.

      opt-in   @media (prefers-reduced-motion: no-preference) { .x { transition } }
      opt-out  .x { transition }  +  @media (...: reduce) { .x { transition: none } }

    Only accepting opt-in flags correct code, and a checker that flags correct
    code gets switched off — at which point it stops catching the real thing.
    """
    unguarded = 0
    for path in files:
        css = strip_comments(open(path, encoding='utf-8').read())
        rel = os.path.relpath(path, root)

        no_pref, cancelled = [], set()
        for m in re.finditer(r'@media[^{]*prefers-reduced-motion[^{]*\{', css):
            end = _block_end(css, m.end() - 1)
            if 'no-preference' in m.group(0):
                no_pref.append((m.start(), end))
            else:                       # a `reduce` block: collect what it cancels
                for r in re.finditer(r'([^{}]+)\{([^{}]*)\}', css[m.end():end]):
                    body = r.group(2)
                    if re.search(r'(transition|animation)[\w-]*\s*:\s*(none|0s)', body):
                        for s in split_selector(re.sub(r'\s+', ' ', r.group(1))):
                            cancelled.add(s)

        for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
            sels = split_selector(re.sub(r'\s+', ' ', m.group(1)))
            for d in re.finditer(r'(?<![\w-])(transition|animation)\s*:\s*([^;]+)',
                                 m.group(2)):
                if re.match(r'\s*(none|0s|initial|unset)\b', d.group(2)):
                    continue
                pos = m.start(2) + d.start()
                if any(a <= pos <= b for a, b in no_pref):
                    continue
                if all(s in cancelled for s in sels):
                    continue
                line = css[:pos].count('\n') + 1
                print(f'      {rel}:{line}  {sels[0][:34]}  {d.group(0).strip()[:50]}')
                unguarded += 1

    head = f'\n6  MOTION GUARD  {unguarded} unguarded declaration(s)'
    print(head if unguarded else head + '  ✓')
    return unguarded


STATE_PSEUDO = re.compile(r':(?:hover|focus-visible|focus|active)\b')


def _target_segment(sel):
    """The rightmost compound in a selector — the element actually being
    styled, as opposed to an ancestor whose :hover reveals something else.
    `.menu:hover .submenu` states on `.menu`, not `.submenu`; only a state
    pseudo-class inside THIS segment means the styled element itself has the
    state, which is the only case check_static should ever flag."""
    depth, cut = 0, 0
    for i, ch in enumerate(sel):
        if ch in '([':
            depth += 1
        elif ch in ')]':
            depth -= 1
        elif ch in ' >+~' and depth == 0:
            cut = i + 1
    return sel[cut:], cut


def check_static(files, root):
    """A state rule with no motion anywhere is a state that fires with no
    signal — the CSS declares :hover/:focus-visible/:active, and nothing
    tells the user it happened. This is the AI-Slop Ledger's "static despite
    having states" entry, made countable.

    Two valid places to declare the transition, and both must be accepted:
    on the base selector (`.btn { transition: … }`, common when hover/focus/
    active all animate the same way) or on the state selector itself
    (`.btn:hover { transition: … }`, common when only that state animates).
    Requiring only one gets correct code flagged — the exact failure mode
    check_motion's own docstring already warns about, one check number up.

    Only the RIGHTMOST compound in a selector is checked for state pseudo-
    classes (see _target_segment) — `.menu:hover .submenu` states on `.menu`
    revealing `.submenu`, and `.submenu`'s own motion is very often declared
    on `.submenu` alone with no pseudo-class at all. Checking the whole
    selector string flags that entirely legitimate, common pattern.

    `linear` is flagged unconditionally on `transition` (a transition is, by
    definition, a one-shot response to a state change — it cannot loop, so
    there is no continuous case to exempt, unlike `animation` which can carry
    `infinite`). `animation: … linear … infinite` — a real shimmer or
    marquee — is exempt for exactly that reason.
    """
    transitioned = set()
    state_rules = []
    linear_hits = []

    for path in files:
        css = strip_comments(open(path, encoding='utf-8').read())
        rel = os.path.relpath(path, root)
        for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
            sels = split_selector(re.sub(r'\s+', ' ', m.group(1)))
            body = m.group(2)
            has_motion = bool(re.search(
                r'(?<![\w-])(transition|animation)[\w-]*\s*:'
                r'\s*(?!none\b|0s\b|initial\b|unset\b)', body))
            for sel in sels:
                seg, cut = _target_segment(sel)
                base = sel[:cut] + STATE_PSEUDO.sub('', seg)
                if has_motion:
                    transitioned.add(sel)
                    transitioned.add(base)
                if STATE_PSEUDO.search(seg):
                    line = css[:m.start()].count('\n') + 1
                    state_rules.append((rel, line, base, sel))
            for d in re.finditer(r'(?<![\w-])transition[\w-]*\s*:\s*([^;]+)', body):
                if re.search(r'(?<![\w-])linear\b', d.group(1)):
                    line = css[:m.start(2) + d.start()].count('\n') + 1
                    linear_hits.append((rel, line, sels[0][:34], d.group(0).strip()[:50]))
            for d in re.finditer(r'(?<![\w-])animation[\w-]*\s*:\s*([^;]+)', body):
                if (re.search(r'(?<![\w-])linear\b', d.group(1))
                        and 'infinite' not in d.group(1)):
                    line = css[:m.start(2) + d.start()].count('\n') + 1
                    linear_hits.append((rel, line, sels[0][:34], d.group(0).strip()[:50]))

    seen, static = set(), []
    for rel, line, base, full in state_rules:
        key = (rel, base)
        if key in seen or base in transitioned or full in transitioned:
            continue
        seen.add(key)
        static.append((rel, line, base, full))

    n = len(static) + len(linear_hits)
    print(f'\n8  STATIC       {len(static)} state rule(s) with no motion property · '
          f'{len(linear_hits)} bare `linear` on a one-shot transition'
          + ('  ✓' if n == 0 else ''))
    for rel, line, base, full in static:
        print(f'      {rel}:{line}  {full[:40]}'
              f'\n              ← no transition/animation on this selector or on {base!r}')
    for rel, line, sel, decl in linear_hits:
        print(f'      linear  {rel}:{line}  {sel}  {decl}')
    return n


# ------------------------------------------------------------------- main ----

def main(argv):
    root, layer1, shell, quiet = '.', 'css/primitives.css', 'css/shell.css', False
    i = 1
    while i < len(argv):
        a = argv[i]
        if a == '--layer1':
            i += 1
            layer1 = argv[i]
        elif a == '--shell':
            i += 1
            shell = argv[i]
        elif a == '--no-shell':
            shell = None
        elif a == '--quiet':
            quiet = True
        elif not a.startswith('-'):
            root = a
        i += 1

    root = os.path.abspath(root)
    files = css_files(root)
    if not files:
        print(f'no .css found under {root}')
        return 125

    themes, base, overrides, sel_of, alias = collect_themes(files, root)
    print(f'design-system-forge audit — {root}')
    # `base` is every :root declaration in every file, chrome included, because
    # resolution needs all of it. But reporting that total as "root tokens"
    # overstates the SYSTEM's size by however large the chrome is — 66 of 212 in
    # the reference system, and a docs page counting only the system's own files
    # disagreed by exactly that. Two counts that should match and don't is the
    # only reason anyone finds this. Chrome is identified by which file declares
    # it, the same way check_purity exempts it — not by assuming a `--shell-`
    # prefix, since the namespace is the author's to choose.
    chrome = set()
    if shell:
        spath = os.path.normpath(os.path.join(root, shell))
        if os.path.exists(spath):
            chrome = {t for t, _ in DECL.findall(
                strip_comments(open(spath, encoding='utf-8').read()))} & set(base)
    system = len(base) - len(chrome)
    suffix = f' + {len(chrome)} chrome token(s) in {shell}' if chrome else ''
    print(f'{len(files)} css file(s) · {system} system token(s){suffix} · '
          f'themes: {", ".join(sorted(themes))}\n')

    # Which Layer 1 tokens does a theme actually swap? A primitive that every
    # theme resolves identically (the space and type scales) is shared
    # vocabulary and safe to read anywhere; one whose resolved value differs
    # between themes is a re-theming hazard. Computed rather than pattern-matched
    # on the name, so it stays right for a system that names its scales oddly.
    l1path = os.path.normpath(os.path.join(root, layer1))
    layer1_tokens = set()
    if os.path.exists(l1path):
        layer1_tokens = {t for t, _ in DECL.findall(
            strip_comments(open(l1path, encoding='utf-8').read()))}
    themed = set()
    resolvers = {name: resolver(tbl) for name, tbl in themes.items()}
    for t in layer1_tokens:
        vals = {str(res(t)) for res in resolvers.values()}
        if len(vals) > 1:
            themed.add(t)
    # A primitive that no theme swaps but that a semantic role wraps is still
    # worth reading through its role. Those are the colour ramps: they carry
    # meaning the page should name, not a scale step the page just uses.
    for t in layer1_tokens:
        if t in themed:
            continue
        for tbl in themes.values():
            if any(v.strip() == f'var({t})' for k, v in tbl.items()
                   if k not in layer1_tokens):
                themed.add(t)
                break

    n = 0
    n += check_contrast(themes, alias, quiet)
    check_dead(files, root)
    n += check_purity(files, root, layer1, shell)
    n += check_drift(overrides, sel_of)
    n += check_motion(files, root)
    n += check_inline_style(root, themed)
    n += check_static(files, root)

    print(f'\n{"CLEAN" if n == 0 else str(n) + " FAILURE(S)"}'
          '   — checks 2 and 3, and every "warn", are for judgement not counted.')
    return min(n, 125)


if __name__ == '__main__':
    sys.exit(main(sys.argv))
