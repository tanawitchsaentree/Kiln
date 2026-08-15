import sys

def srgb_to_lin(c):
    c = c / 255.0
    return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055) ** 2.4

def luminance(hexcolor):
    hexcolor = hexcolor.lstrip('#')
    r, g, b = int(hexcolor[0:2],16), int(hexcolor[2:4],16), int(hexcolor[4:6],16)
    r, g, b = srgb_to_lin(r), srgb_to_lin(g), srgb_to_lin(b)
    return 0.2126*r + 0.7152*g + 0.0722*b

def contrast(hex1, hex2):
    l1, l2 = luminance(hex1), luminance(hex2)
    lighter, darker = max(l1,l2), min(l1,l2)
    return (lighter + 0.05) / (darker + 0.05)

if __name__ == "__main__":
    a, b = sys.argv[1], sys.argv[2]
    r = contrast(a, b)
    print(f"{a} vs {b}: {r:.2f}:1")
