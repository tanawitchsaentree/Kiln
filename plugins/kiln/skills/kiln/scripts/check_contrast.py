#!/usr/bin/env python3
"""Gate G3, automated (all three sets: precision/coherence/restraint share this gate's wording).

Every text pairing must clear 4.5:1, every UI-boundary pairing 3:1 — computed from real hex via
the WCAG relative-luminance formula, never eyeballed. Same discipline this project already proved
for Dial's own tooling/contrast-check.mjs — ported here so kiln's own gate has a standing script
too, instead of relying on a fixture pair that lived only in a one-time eval report.

  python3 scripts/check_contrast.py '#f2efeb' '#282623' --min 4.5
  python3 scripts/check_contrast.py '#d6d2cc' '#f2efeb' --min 3
"""
import sys


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    if len(hex_color) == 3:
        hex_color = "".join(c * 2 for c in hex_color)
    return tuple(int(hex_color[i:i + 2], 16) / 255 for i in (0, 2, 4))


def relative_luminance(rgb):
    def lin(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(hex1, hex2):
    l1 = relative_luminance(hex_to_rgb(hex1))
    l2 = relative_luminance(hex_to_rgb(hex2))
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        sys.exit(__doc__)
    min_ratio = 4.5
    if "--min" in args:
        idx = args.index("--min")
        min_ratio = float(args[idx + 1])
        args = args[:idx] + args[idx + 2:]

    fg, bg = args[0], args[1]
    ratio = contrast_ratio(fg, bg)
    print(f"{fg} on {bg}: {ratio:.2f}:1 (minimum {min_ratio}:1)")

    if ratio < min_ratio:
        print(f"FAIL  {ratio:.2f}:1 is below the {min_ratio}:1 minimum")
        sys.exit(1)
    print("G3 passes.")
    sys.exit(0)


if __name__ == "__main__":
    main()
