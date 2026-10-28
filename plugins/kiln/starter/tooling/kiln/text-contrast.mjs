// text-contrast — worst-pixel WCAG contrast for every visible text node on a page, read from the
// real rendered pixels (after backdrop-filter, gradients, images — whatever is actually behind it).
// Shared by tooling/engine/evidence.mjs (harness + docs pages) and the lab anchor round.
import { PNG } from 'pngjs';

export const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
export const parseColor = (s) => {
  if (!s) return null;
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return a < 1 ? null : [r, g, b];
  }
  const h = s.trim().match(/^#([0-9a-f]{6})/i);
  return h ? [0, 2, 4].map((i) => parseInt(h[1].slice(i, i + 2), 16)) : null;
};

/** rgba() with 0 < alpha < 1 → [r, g, b, a]; opaque or unparseable → null. */
export const parseTranslucent = (s) => {
  const m = s?.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return a > 0 && a < 1 ? [r, g, b, a] : null;
};
// Translucent text is painted with source-over blending, so the colour a reader sees at a pixel is
// exactly a·fg + (1−a)·bg — computed per pixel against the real bg, not assumed.
const blend = ([r, g, b, a], bg) => [r * a + bg[0] * (1 - a), g * a + bg[1] * (1 - a), b * a + bg[2] * (1 - a)];

/**
 * Scrolls the page one viewport at a time; at each stop wraps every visible text node in a
 * background-less span, hides only those spans, screenshots, and scores each text node against the
 * pixels under its own boxes. Returns one entry per text node (worst across scroll stops), tagged
 * with the nearest [data-group] ancestor so callers can aggregate per card/variant.
 *
 * text-shadow is deliberately NOT stripped: a halo with an explicit colour stays painted while the
 * glyphs are hidden, so the score is text-vs-halo — the WCAG 1.4.3 Understanding rule for text with a
 * halo. A shadow in currentColor turns transparent with the text and so earns no credit.
 */
/** `threshold` is the normal-text minimum; WCAG large text gets 3:1. Each entry carries `required`. */
export async function measurePageText(page, threshold = 4.5) {
  const collect = () => page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let i = 0;
    // Each text node gets its own background-less wrapper span, so hiding the text later touches
    // nothing that paints a background (forced-color-adjust on a <button> would bring its author
    // red fill back in forced-colors mode and measure a colour pair no reader ever sees).
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    // Text sliding under a sticky or fixed bar (top bar, bottom bar) is covered there; its pixels belong
    // to the bar, not to the text's background. Every box is clipped to the band the bars leave visible.
    const barEls = [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); if (!(cs.position === 'fixed' || cs.position === 'sticky') || cs.visibility === 'hidden') return false; const b = e.getBoundingClientRect(); return b.width > innerWidth * 0.5 && b.height > 0 && b.height < innerHeight * 0.5; });
    const bars = barEls.map((e) => e.getBoundingClientRect());
    const band = { left: 0, right: innerWidth, top: Math.max(0, ...bars.filter((b) => b.top <= 1).map((b) => b.bottom)), bottom: Math.min(innerHeight, ...bars.filter((b) => b.bottom >= innerHeight - 1).map((b) => b.top)) };
    for (const n of nodes) {
      const parent = n.parentElement;
      if (!n.textContent.trim() || !parent || parent.closest('[aria-hidden="true"], .skip, script, style, title, :disabled, [aria-disabled="true"], [data-disabled]') || parent.closest('label')?.control?.disabled) continue; // disabled controls are exempt (WCAG 1.4.3, inactive user interface components), and so is the label of one
      let span = parent.matches('[data-ev-doc]') && parent.childNodes.length === 1 ? parent : null;
      if (!span) {
        span = document.createElement('span');
        span.dataset.evDoc = String(i++);
        n.replaceWith(span);
        span.append(n);
      }
      // Only text a reader can see: drop boxes clipped by a scroll container or covered by another
      // element (the topmost element at the box centre must be this span or inside it).
      // clip each box to every scrolling/clipping ancestor, so text cut off by a scroll container
      // is scored only on the part a reader can see
      const clips = [];
      for (let a = span.parentElement; a && a !== document.body; a = a.parentElement) {
        const o = getComputedStyle(a);
        if (/(auto|scroll|hidden|clip)/.test(o.overflowX + o.overflowY)) {
          // the visible area is the padding box — inside the border, which overflow does not clip to
          const b = a.getBoundingClientRect();
          const left = b.left + a.clientLeft, top = b.top + a.clientTop;
          clips.push({ left, top, right: left + a.clientWidth, bottom: top + a.clientHeight });
        }
      }
      const clip = (r) => clips.reduce((c, k) => {
        const left = Math.max(c.left, k.left), top = Math.max(c.top, k.top), right = Math.min(c.right, k.right), bottom = Math.min(c.bottom, k.bottom);
        return { left, top, right, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
      }, { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
      if (!barEls.some((e) => e.contains(span))) clips.push(band); // the bar's own text is measured in full
      const rects = [...span.getClientRects()].map(clip).filter((r) => {
        if (!(r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight)) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!hit && (hit === span || span.contains(hit));
      });
      if (!rects.length) continue;
      // WCAG large text (1.4.3): ≥24px, or ≥18.66px at bold (700+) — needs 3:1 instead of 4.5:1
      const cs = getComputedStyle(span);
      const px = parseFloat(cs.fontSize);
      const large = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
      out.push({ key: span.dataset.evDoc, large, group: span.closest('[data-group]')?.dataset.group ?? null, label: n.textContent.trim().slice(0, 40), color: cs.color, rects: rects.map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })) });
    }
    return out;
  });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = page.viewportSize().height;
  const worst = new Map();
  for (let y = 0; y < height; y += vh) {
    // behavior 'instant' — the docs set scroll-behavior: smooth, and measuring rects mid-animation
    // then screenshotting after it settles misaligns every sample (it read mullion pixels as "text bg").
    const at = await page.evaluate((top) => { scrollTo({ top, behavior: 'instant' }); return scrollY; }, y);
    if (Math.abs(at - Math.min(y, height - vh)) > 1) throw new Error(`scroll landed at ${at}, wanted ${y}`);
    await page.waitForTimeout(50);
    const items = await collect();
    await page.addStyleTag({ content: '[data-ev-doc] { color: transparent !important; forced-color-adjust: none !important; } * { text-decoration-line: none !important; }' }).then((h) => h.evaluate((s) => (s.id = 'ev-hide')));
    await page.waitForTimeout(50);
    // one retry on a screenshot timeout (a loaded machine, not a page problem); a second failure throws
    const shot = () => page.screenshot({ timeout: 90000 });
    const png = PNG.sync.read(await shot().catch(() => shot()));
    await page.evaluate(() => document.getElementById('ev-hide')?.remove());
    for (const it of items) {
      const fg = parseColor(it.color);
      const tl = fg ? null : parseTranslucent(it.color);
      let min = Infinity;
      let where = null;
      for (const r of it.rects)
        for (let py = Math.ceil(r.y); py < Math.floor(r.y + r.h); py++)
          for (let px = Math.ceil(r.x); px < Math.floor(r.x + r.w); px++) {
            if (px < 0 || py < 0 || px >= png.width || py >= png.height) continue;
            const i = (py * png.width + px) * 4;
            const rgb = [png.data[i], png.data[i + 1], png.data[i + 2]];
            const v = fg ? ratio(fg, rgb) : tl ? ratio(blend(tl, rgb), rgb) : 0;
            if (v < min) { min = v; where = { x: px, y: py + at, rgb }; }
          }
      if (!fg && !tl) { // gradient / translucent text has no single colour to score — count it, don't guess it
        if (!worst.has(it.key)) worst.set(it.key, { label: it.label, min: null, unmeasurable: true, color: it.color, group: it.group, required: it.large ? 3 : threshold });
        continue;
      }
      if (!Number.isFinite(min)) continue;
      const prev = worst.get(it.key);
      if (!prev || min < prev.min) worst.set(it.key, { label: it.label, min: Math.round(min * 100) / 100, color: it.color, at: where, rects: it.rects.length, group: it.group, large: it.large, required: it.large ? 3 : threshold });
    }
  }
  const all = [...worst.values()].sort((a, b) => (a.min ?? -1) - (b.min ?? -1));
  return { textElements: all.length, failures: all.filter((t) => t.min == null || t.min < t.required), worst: all.slice(0, 5), all };
}

