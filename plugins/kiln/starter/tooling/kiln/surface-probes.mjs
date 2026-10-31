// surface-probes: the measurements behind G-GR1, G-BR1, G-MS1 and G-AN1, kept apart from gates.mjs so the
// same code runs in the gates and in their proof (surface-probes.proof.mjs plants each violation on a
// fixture page and expects red, then green on the repaired page). The in-page functions are passed to
// page.evaluate, so each one is self-contained and takes everything it needs as one argument.
//
// G-GR1  glass follows the shared recipe. Pane, 2026-10-31: Navbar blurred without saturate or brightness,
//        so it was the one glass that did not darken a bright scene, and its text fell to 3.4:1.
// G-BR1  a subject that is its own surface paints one, and no live text sits on the photo with no pane.
//        Pane: chart, chat and agent subjects were shown "bare" and drew their text straight on the scene.
// G-MS1  a mesh or gradient-art element is an accent: at most a tenth of its region (user rule, 2026-10-31).
// G-AN1  the card still looks like the anchor the user picked. Pane R-032: glass was tuned one number at a
//        time until it read as opaque, and nothing compared it with the anchor.

/** Static half of G-GR1: component CSS writes backdrop-filter only as none or through tokens. */
export function glassCssProblems(css, file) {
  const out = [];
  for (const m of css.matchAll(/(?:-webkit-)?backdrop-filter\s*:\s*([^;}]+)/g)) {
    const v = m[1].trim();
    if (/^(none|inherit|initial|unset)$/.test(v)) continue;
    // a filter is fine when every argument is a token (blur(var(--x-blur)) saturate(var(--x-saturate)) …);
    // a raw number inside a filter function is the hand-written glass that drifted from the recipe
    const args = [...v.matchAll(/\b(?:blur|saturate|brightness|contrast|grayscale|sepia|hue-rotate|invert|opacity)\s*\(([^()]*(?:\([^()]*\))?[^()]*)\)/g)].map((x) => x[1].trim());
    if (args.some((x) => !/^var\(--[\w-]+\)$/.test(x))) out.push(`${file}: backdrop-filter "${v.slice(0, 60)}" writes the filter by hand; use the shared glass recipe tokens`);
  }
  return out;
}

/** In-page half of G-GR1: every element that blurs what is behind it uses every function of the recipe. */
export function glassRecipeProbe({ scope, functions }) {
  const out = [];
  const name = (el) => el.closest('[data-component]')?.getAttribute('data-component') ?? el.className?.toString().split(' ')[0] ?? el.tagName.toLowerCase();
  for (const el of document.querySelectorAll(scope)) {
    const cs = getComputedStyle(el);
    const f = cs.backdropFilter || cs.webkitBackdropFilter || 'none';
    if (f === 'none' || cs.display === 'none' || cs.visibility === 'hidden') continue;
    const have = new Set([...f.matchAll(/([a-z-]+)\(/g)].map((x) => x[1]));
    const miss = functions.filter((fn) => !have.has(fn));
    if (miss.length) out.push(`${name(el)}: backdrop-filter "${f}" lacks ${miss.join(' and ')}`);
  }
  return out;
}

/** In-page G-BR1. Bare subjects (data-bare="surface") paint a surface; text on a photo stage sits on a pane. */
export function bareSurfaceProbe({ minAlpha, paneAlpha, stages }) {
  const out = [];
  const alpha = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return c === 'transparent' ? 0 : 1; const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? Number(p[3]) : 1; };
  const filtered = (cs) => (cs.backdropFilter || cs.webkitBackdropFilter || 'none') !== 'none';
  const name = (el) => el.closest('[data-component]')?.getAttribute('data-component') ?? el.tagName.toLowerCase();
  for (const host of document.querySelectorAll('[data-bare="surface"]')) {
    const root = host.querySelector('[data-component]') ?? host.firstElementChild;
    if (!root) continue;
    const cs = getComputedStyle(root);
    if (!filtered(cs) && alpha(cs.backgroundColor) < minAlpha) out.push(`${name(root)} is shown bare as its own surface but paints none (no backdrop-filter, background alpha ${alpha(cs.backgroundColor).toFixed(2)} < ${minAlpha})`);
  }
  for (const stage of document.querySelectorAll(stages)) {
    if (!/url\(/.test(getComputedStyle(stage).backgroundImage)) continue;
    const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.textContent.trim()) continue;
      const el = t.parentElement;
      if (!el || el.closest('[data-photo-text], [hidden], [aria-hidden="true"]')) continue;
      const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
      let covered = false;
      for (let a = el; a && a !== stage; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (filtered(cs) || alpha(cs.backgroundColor) >= paneAlpha || (cs.backgroundImage !== 'none' && !/url\(/.test(cs.backgroundImage))) { covered = true; break; }
      }
      const who = name(el);
      if (!covered && !seen.has(who)) { seen.add(who); out.push(`${who}: "${t.textContent.trim().slice(0, 30)}" sits on the photo with no surface under it`); }
    }
  }
  return out;
}

/** In-page G-MS1. A mesh (data-mesh, or a background of two or more radial/conic gradients, on the element or
 *  its ::before/::after) covers at most maxShare of its region: the closest section, stage or card. */
export function meshShareProbe({ maxShare, regions }) {
  const out = [];
  const meshy = (bg) => bg && bg !== 'none' && (bg.match(/(radial|conic)-gradient\(/g)?.length ?? 0) >= 2;
  const vw = innerWidth, vh = innerHeight;
  const area = (r) => Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh * 50) - Math.max(r.top, -vh * 50));
  for (const el of document.querySelectorAll('*')) {
    const marked = el.hasAttribute('data-mesh');
    const own = meshy(getComputedStyle(el).backgroundImage);
    const pseudo = ['::before', '::after'].some((p) => meshy(getComputedStyle(el, p).backgroundImage));
    if (!marked && !own && !pseudo) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const wallpaper = el === document.documentElement || el === document.body;
    const region = wallpaper ? null : el.parentElement?.closest(regions);
    const ra = region ? area(region.getBoundingClientRect()) : vw * Math.max(vh, document.documentElement.scrollHeight);
    const share = wallpaper ? 1 : area(r) / Math.max(1, ra);
    if (share > maxShare) out.push(`${el.getAttribute('data-component') || el.className?.toString().split(' ')[0] || el.tagName.toLowerCase()}: a mesh covers ${Math.round(share * 100)}% of its ${wallpaper ? 'page (a wallpaper)' : region?.tagName.toLowerCase() ?? 'page'} (at most ${Math.round(maxShare * 100)}%)`);
  }
  return out;
}

// ---------------------------------------------------------------- G-AN1 pixels (no image library needed)
// sRGB → OKLab, so the body's lightness and chroma are compared the way the eye sees them.
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function oklab(r, g, b) {
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const relLum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[s.length >> 1] : 0; };

/** Body lightness and chroma (median over the middle half, so text does not move it) and rim contrast (the
 *  card's outer 2px against the 4-8px of backdrop just outside it). */
export async function cardStats(page, selector, pad = 10) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  const b = await el.boundingBox();
  if (!b) throw new Error(`NO ${selector} on the page`);
  const clip = { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + 2 * pad, height: b.height + 2 * pad };
  const png = (await page.screenshot({ clip })).toString('base64');
  const { w, h, data } = await page.evaluate(async (src) => {
    const img = new Image(); img.src = `data:image/png;base64,${src}`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    return { w: img.width, h: img.height, data: [...x.getImageData(0, 0, img.width, img.height).data] };
  }, png);
  const ox = b.x - clip.x, oy = b.y - clip.y;
  const sx = w / clip.width; const at = (x, y) => { const i = (Math.round(y * sx) * w + Math.round(x * sx)) * 4; return [data[i], data[i + 1], data[i + 2]]; };
  const L = [], A = [], B = [];
  for (let y = oy + b.height * 0.25; y < oy + b.height * 0.75; y += 2) for (let x = ox + b.width * 0.25; x < ox + b.width * 0.75; x += 2) { const [l, a, bb] = oklab(...at(x, y)); L.push(l); A.push(a); B.push(bb); }
  const band = (inner, outer) => {
    const v = [];
    for (let t = 0.2; t <= 0.8; t += 0.02) for (let d = inner; d < outer; d++) {
      const xs = ox + b.width * t, ys = oy + b.height * t;
      v.push(relLum(...at(xs, oy + d)), relLum(...at(xs, oy + b.height - 1 - d)), relLum(...at(ox + d, ys)), relLum(...at(ox + b.width - 1 - d, ys)));
    }
    return median(v);
  };
  const edge = band(0, 2), out = band(-8, -4);
  const a = median(A), bb = median(B);
  return { L: +median(L).toFixed(4), C: +Math.hypot(a, bb).toFixed(4), rim: +((Math.max(edge, out) + 0.05) / (Math.min(edge, out) + 0.05)).toFixed(3) };
}

/** The G-AN1 verdict: problems when the card has drifted from the anchor past the allowed deltas. */
export function anchorDrift(ref, now, { maxDeltaL = 0.05, maxDeltaC = 0.03, maxDeltaRim = 0.4 } = {}) {
  const out = [];
  if (Math.abs(now.L - ref.L) > maxDeltaL) out.push(`body lightness ${now.L} against the anchor's ${ref.L} (Δ ${(now.L - ref.L).toFixed(3)}, allowed ${maxDeltaL})`);
  if (Math.abs(now.C - ref.C) > maxDeltaC) out.push(`body chroma ${now.C} against the anchor's ${ref.C} (Δ ${(now.C - ref.C).toFixed(3)}, allowed ${maxDeltaC})`);
  if (Math.abs(now.rim - ref.rim) > maxDeltaRim) out.push(`rim contrast ${now.rim}:1 against the anchor's ${ref.rim}:1 (allowed ±${maxDeltaRim})`);
  return out;
}
