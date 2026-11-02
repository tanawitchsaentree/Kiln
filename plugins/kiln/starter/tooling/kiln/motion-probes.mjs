// motion-probes: the measurements behind G-MO1 and G-MO2, shared by gates.mjs and motion-probes.proof.mjs.
//
// The rhythm kiln holds a system to (references/foundations/motion.md, "Rhythm"):
//   fast on, slow off  a state is entered fast and left slowly: the transition into :hover or :active is
//                      shorter than the one out of it, by at least `minRatio` (user, 2026-11-01: "เข้าเร็ว
//                      ออกช้า … ไม่ใช่สักแต่จะ smooth")
//   decelerate in      what arrives or answers the user starts fast and settles: the curve's slope at the
//                      start is steeper than at the end
//   accelerate out     an exit token, when there is one, starts slow and leaves fast, and is shorter than
//                      the entrance
//   never default      no `linear` or bare `ease` on anything that moves or fades, and nothing that changes
//                      on hover with no transition at all (the "static, raw" complaint, R-039)
//   bands              state durations sit in bands wide enough for a concept and narrow enough to feel

export const DEFAULT_BANDS = {
  hoverOn: [60, 200], hoverOff: [180, 520], pressOn: [30, 140], pressOff: [160, 460],
  maxUi: 700, minRatio: 1.6, ambient: /spin|breathe|loop|scene|ambient|shimmer/,
};

const KEYWORDS = { ease: [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1], 'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1], linear: [0, 0, 1, 1] };

/** Slopes of a CSS cubic-bezier at its two ends (dy/dx). Start > end means it decelerates. */
export function bezierEnds([x1, y1, x2, y2]) {
  const start = x1 === 0 ? (y1 === 0 ? (x2 === 0 ? Infinity : y2 / x2) : Infinity) : y1 / x1;
  const end = x2 === 1 ? (y2 === 1 ? (x1 === 1 ? Infinity : (1 - y1) / (1 - x1)) : Infinity) : (1 - y2) / (1 - x2);
  return { start, end };
}
export const decelerates = (b) => { const { start, end } = bezierEnds(b); return start > end; };
export const accelerates = (b) => { const { start, end } = bezierEnds(b); return start < end; };

/** Splits a computed transition-timing-function list, keeping the commas inside cubic-bezier(). */
export function parseTimings(s) {
  return String(s ?? '').split(/,(?![^(]*\))/).map((x) => x.trim()).filter(Boolean).map((x) => {
    const m = x.match(/^cubic-bezier\(([^)]+)\)$/);
    if (m) return { name: x, bezier: m[1].split(',').map(Number) };
    return { name: x, bezier: KEYWORDS[x] ?? null };
  });
}
export const parseDurations = (s) => String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean).map((x) => (x.endsWith('ms') ? parseFloat(x) : parseFloat(x) * 1000));

// ---------------------------------------------------------------- G-MO2 tokens (no browser)
/** Static rhythm of the token set (tokens.json from the token build). */
export function motionTokenProblems(tokens, bands = DEFAULT_BANDS) {
  const B = { ...DEFAULT_BANDS, ...bands };
  const out = [];
  const sem = Object.entries(tokens).filter(([p, t]) => t.tier !== 'primitive' && p.startsWith('motion.'));
  const ms = (v) => (String(v).endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);
  const value = (ref) => tokens[ref]?.value;
  for (const [p, t] of sem) {
    if (t.type === 'duration') {
      if (!B.ambient.test(p) && ms(t.value) > B.maxUi) out.push(`${p} is ${t.value}: interface motion over ${B.maxUi}ms reads as lag (ambient names: ${B.ambient.source})`);
      const state = t.state ?? t.extensions?.['kiln.state'];
      if (state) for (const [sel, ref] of Object.entries(state)) {
        const on = ms(value(String(ref).replace(/[{}]/g, '')) ?? 0), off = ms(t.value);
        if (!(on * B.minRatio <= off)) out.push(`${p}: into ${sel} ${on}ms, out ${off}ms. Fast on, slow off needs out ≥ ${B.minRatio} × in`);
      }
    }
    if (t.type === 'cubicBezier') {
      const b = (Array.isArray(t.value) ? t.value : String(t.value).replace(/^cubic-bezier\(|\)$/g, '').split(/[ ,]+/)).filter((x) => x !== '').map(Number);
      const exit = /exit|depart|leave/.test(p);
      if (b.join() === '0,0,1,1') out.push(`${p} is linear: nothing in the interface moves at a constant speed`);
      else if (exit && !accelerates(b)) out.push(`${p} [${b}] should accelerate away (start slower than it ends)`);
      else if (!exit && !/inout|in-out|move/.test(p) && !decelerates(b)) out.push(`${p} [${b}] should decelerate: start fast, settle slowly`);
    }
  }
  const enter = tokens['motion.enter'], exit = tokens['motion.exit'];
  if (enter && exit && ms(exit.value) >= ms(enter.value)) out.push(`motion.exit ${exit.value} is not shorter than motion.enter ${enter.value}`);
  return out;
}

// ---------------------------------------------------------------- G-MO1 controls in the page
const READ = (el) => { const cs = getComputedStyle(el); return { d: cs.transitionDuration, f: cs.transitionTimingFunction, p: cs.transitionProperty, look: [cs.backgroundColor, cs.color, cs.boxShadow, cs.transform, cs.opacity, cs.borderColor, cs.filter].join('|') }; };

/** Hovers and presses each control and reads the transition into the state and out of it.
 *  Runs from Node (playwright page), because :hover and :active need a real pointer. */
export async function stateRhythm(page, { scope = 'main [data-example-live]', controls = 'button, [role=button], a[href], [role=tab], [role=switch], [role=checkbox], [role=radio], label', limit = 8, bands = {} } = {}) {
  const B = { ...DEFAULT_BANDS, ...bands };
  const out = [];
  const handles = (await page.$$(`${scope} :is(${controls})`)).slice(0, limit * 3);
  let seen = 0;
  for (const h of handles) {
    if (seen >= limit) break;
    const box = await h.boundingBox().catch(() => null);
    if (!box || box.width < 8 || box.height < 8) continue;
    const name = await h.evaluate((el) => `${el.closest('[data-component]')?.dataset.component ?? el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 24)}"`);
    if (await h.evaluate((el) => !el.isConnected || el.disabled || el.getAttribute('aria-disabled') === 'true')) continue;
    seen++;
    await page.mouse.move(1, 1); await page.waitForTimeout(600);
    const rest = await h.evaluate(READ);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(600);
    const hover = await h.evaluate(READ);
    await page.mouse.down(); await page.waitForTimeout(250);
    const press = await h.evaluate(READ);
    // leave before letting go, so the press never becomes a click (a click opens or closes the demo and the
    // next control would be read on a page that changed under it)
    await page.mouse.move(1, 1); await page.mouse.up(); await page.waitForTimeout(50);
    const max = (s) => Math.max(0, ...parseDurations(s));
    const [restD, hoverD, pressD] = [rest.d, hover.d, press.d].map(max);
    if (hover.look !== rest.look && hoverD === 0 && restD === 0) { out.push(`${name}: changes on hover with no transition (it snaps)`); continue; }
    if (hoverD === 0 && restD === 0) continue; // nothing animates and nothing changes: a quiet control is allowed
    for (const t of parseTimings(hover.f).concat(parseTimings(rest.f))) {
      if (t.name === 'linear' || t.name === 'ease') { out.push(`${name}: timing "${t.name}" is the browser default, not a rhythm`); break; }
    }
    if (hover.look !== rest.look) {
      if (!(hoverD * B.minRatio <= restD)) out.push(`${name}: hover in ${hoverD}ms, out ${restD}ms. Fast on, slow off needs out ≥ ${B.minRatio} × in`);
      if (hoverD < B.hoverOn[0] || hoverD > B.hoverOn[1]) out.push(`${name}: hover in ${hoverD}ms, outside ${B.hoverOn.join('–')}ms`);
      if (restD < B.hoverOff[0] || restD > B.hoverOff[1]) out.push(`${name}: hover out ${restD}ms, outside ${B.hoverOff.join('–')}ms`);
    }
    if (press.look !== hover.look && pressD > 0 && pressD > B.pressOn[1]) out.push(`${name}: press goes down in ${pressD}ms, slower than ${B.pressOn[1]}ms`);
  }
  return { checked: seen, problems: out };
}

// ---------------------------------------------------------------- G-MO3 a toggle changing state
// Pane R-048 ("switching chips feels stiff"): a chosen fill was a gradient, which no transition can
// interpolate, so it swapped in one frame; a check mark was added to the DOM and the chip widened at once,
// so its neighbour jumped. G-MO1 never saw it, because it only hovers and presses.
// The probe clicks real toggles, samples every animation frame for `window` ms after the press, and goes
// red when (a) a neighbour moves more than `jump` px between two frames, or (b) a paint property of the
// toggle (its own fill, its ::before/::after, its direct children) already equals its end value at `early`
// ms after the press while it started elsewhere.
export const TOGGLE_SELECTOR = ':is([aria-pressed], [aria-checked], [aria-selected], [data-state=on], [data-state=off], [data-state=checked], [data-state=unchecked], [data-state=active], [data-state=inactive]):not([aria-haspopup]):not([aria-expanded]):not([disabled]):not([aria-disabled=true])';

/** In-page sampler (serialised into the page): records per frame the neighbour's x and the toggle's paint. */
const SAMPLER = ([sel, ms]) => {
  const el = document.querySelector(sel);
  const sib = (e) => { for (const d of ['nextElementSibling', 'previousElementSibling']) { let s = e[d]; while (s && !(s.getBoundingClientRect().width > 0)) s = s[d]; if (s) return s; } return null; };
  // a toggle wrapped in a label or an item cell: the neighbour is the wrapper's
  let host = el; while (host.parentElement && !sib(host) && host.parentElement !== document.body) host = host.parentElement;
  const nb = sib(host);
  const PAINT = ['backgroundColor', 'backgroundImage', 'color', 'borderColor', 'boxShadow', 'opacity'];
  const read = (e, pseudo) => { const cs = getComputedStyle(e, pseudo); return PAINT.map((k) => cs[k]); };
  const look = () => [...read(el), ...read(el, '::before'), ...read(el, '::after'), ...[...el.children].slice(0, 6).flatMap((c) => read(c))];
  return new Promise((done) => {
    const frames = []; let t0 = null;
    el.addEventListener('pointerdown', () => { t0 = performance.now(); }, { capture: true, once: true });
    const start = performance.now();
    const tick = () => {
      const t = performance.now();
      frames.push({ t, x: nb ? nb.getBoundingClientRect().x : null, look: look() });
      if (t0 !== null && t - t0 > ms) return done({ t0, frames, neighbour: !!nb });
      if (t - start > ms + 3000) return done({ t0, frames, neighbour: !!nb });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};

/** Pure judgement over one sampled change, shared with the proof. */
export function judgeToggle({ t0, frames }, { jump = 4, early = 60, settle = 300 } = {}) {
  const out = [];
  if (t0 === null || frames.length < 3) return ['the press never reached the toggle'];
  const before = frames.filter((f) => f.t <= t0).at(-1) ?? frames[0];
  const after = frames.filter((f) => f.t > t0);
  const end = frames.at(-1);
  let worst = 0;
  const seq = [before, ...after];
  for (let i = 1; i < seq.length; i++) {
    if (seq[i].t - t0 > settle || seq[i].x === null || seq[i - 1].x === null) continue;
    worst = Math.max(worst, Math.abs(seq[i].x - seq[i - 1].x));
  }
  if (worst > jump) out.push(`its neighbour jumps ${worst.toFixed(1)}px in one frame (over ${jump}px): the toggle changes size at once`);
  const mid = after.find((f) => f.t - t0 >= early);
  if (mid) {
    const snapped = end.look.map((v, k) => (before.look[k] !== v && mid.look[k] === v ? k : -1)).filter((k) => k >= 0);
    if (snapped.length) {
      const PAINT = ['background-color', 'background-image', 'color', 'border-color', 'box-shadow', 'opacity'];
      const where = (k) => `${['', '::before ', '::after '][Math.floor(k / 6)] ?? `child ${Math.floor(k / 6) - 2} `}${PAINT[k % 6]}`;
      const img = snapped.some((k) => k % 6 === 1);
      out.push(`${where(snapped[0])} is already at its end ${Math.round(mid.t - t0)}ms after the press: it swaps instead of changing${img ? ' (a gradient cannot be transitioned; paint it from two registered colours, --ds-fill-top and --ds-fill-foot)' : ''}`);
    }
  }
  return out;
}

/** Clicks toggles in the demos and judges each change both ways where it can go back. */
export async function toggleChange(page, { scope = 'main [data-example-live]', limit = 4, window: ms = 700, jump = 4, early = 60, settle = 300 } = {}) {
  const out = []; let seen = 0, tag = 0;
  const handles = (await page.$$(`${scope} ${TOGGLE_SELECTOR}`)).slice(0, limit * 4);
  for (const h of handles) {
    if (seen >= limit) break;
    const box = await h.boundingBox().catch(() => null);
    if (!box || box.width < 8 || box.height < 8) continue;
    const id = `kiln-mo3-${tag++}`;
    const info = await h.evaluate((el, id) => {
      el.setAttribute('data-kiln-probe', id);
      const radio = /^(radio|tab|option)$/.test(el.getAttribute('role') ?? '') || (el.hasAttribute('aria-selected') && !el.hasAttribute('aria-pressed'));
      return { radio, on: ['true', 'on', 'checked', 'active'].includes(el.getAttribute('aria-pressed') ?? el.getAttribute('aria-checked') ?? el.getAttribute('aria-selected') ?? el.dataset.state), name: `${el.closest('[data-component]')?.dataset.component ?? el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 24)}"` };
    }, id);
    if (info.radio && info.on) continue; // pressing the chosen option changes nothing
    seen++;
    const sel = `[data-kiln-probe="${id}"]`;
    const press = async () => {
      // rest on the toggle first so the hover transition is over before the change is sampled
      const b = await h.boundingBox(); if (!b) return null;
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(600);
      const sampling = page.evaluate(SAMPLER, [sel, ms]);
      await page.waitForTimeout(50); await page.mouse.down(); await page.mouse.up();
      return sampling;
    };
    for (const dir of info.radio ? ['on'] : ['on', 'off']) {
      const s = await press().catch(() => null);
      if (!s) break;
      for (const p of judgeToggle(s, { jump, early, settle })) out.push(`${info.name} (${dir === 'on' ? 'first press' : 'pressed back'}): ${p}`);
    }
    await page.mouse.move(1, 1);
  }
  return { checked: seen, problems: out };
}

// ---------------------------------------------------------------- springs (why.json mechanism.spring)
/** A part on a damped spring: ζ = c / (2√(k·m)) between 0.75 and 1 (no wobble, no creep) and a settle time
 *  4 / (ζ·ω₀), ω₀ = √(k/m), under 600ms. A declared signature moment (signature: true) may go to ζ 0.5. */
export function springProblems(spring, name = 'spring') {
  const { mass: m = 1, stiffness: k, damping: c, signature = false } = spring ?? {};
  if (![m, k, c].every((x) => Number.isFinite(x) && x > 0)) return [`${name}: mass, stiffness and damping must be positive numbers`];
  const zeta = c / (2 * Math.sqrt(k * m)), w0 = Math.sqrt(k / m), settle = 4 / (zeta * w0) * 1000;
  const out = [];
  const lo = signature ? 0.5 : 0.75;
  if (zeta < lo) out.push(`${name}: ζ ${zeta.toFixed(2)} wobbles (needs ≥ ${lo}${signature ? '' : '; a bounce is a declared signature moment'})`);
  if (zeta > 1.05) out.push(`${name}: ζ ${zeta.toFixed(2)} creeps (needs ≤ 1)`);
  if (settle > 600) out.push(`${name}: settles in ${Math.round(settle)}ms (needs ≤ 600ms)`);
  return out;
}
