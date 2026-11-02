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
    // the choice starts when the state attribute flips (on the click, after the press), not on pointer
    // down: :active has its own fast way in (G-MO1, G-MO2), and timing from the press punished it (Pane, 2.6.3)
    const frames = []; let t0 = null, down = null;
    const mo = new MutationObserver(() => { if (t0 === null) t0 = performance.now(); });
    mo.observe(el, { attributes: true, attributeFilter: ['aria-pressed', 'aria-checked', 'aria-selected', 'data-state'] });
    window.addEventListener('pointerdown', () => { down = performance.now(); }, { capture: true, once: true });
    const start = performance.now();
    // what focus paints (a ring, which motion.md keeps instant) is read once with focus taken away, so it is
    // never judged as the choice snapping (Pane, 2.6.3: Tabs had no box-shadow transition; the ring was focus)
    const end = (r) => { mo.disconnect(); const had = document.activeElement; had?.blur?.(); el.blur(); r.blurred = look(); had?.focus?.({ preventScroll: true }); done(r); };
    const tick = () => {
      const t = performance.now();
      frames.push({ t, x: nb ? nb.getBoundingClientRect().x : null, look: look() });
      if (t0 !== null && t - t0 > ms) return end({ t0, down, frames, neighbour: !!nb });
      if (t - start > ms + 2000) return end({ t0, down, frames, neighbour: !!nb });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};

/** Pure judgement over one sampled change, shared with the proof. */
export function judgeToggle({ t0, down = null, frames, blurred = null }, { jump = 4, share = 0.5, early = 60, settle = 300 } = {}) {
  const out = [];
  if (t0 === null || frames.length < 3) return out; // the state never flipped: nothing to judge (toggleChange counts it as skipped)
  const rest = (down !== null ? frames.filter((f) => f.t <= down).at(-1) : null) ?? frames[0];
  const before = frames.filter((f) => f.t <= t0).at(-1) ?? frames[0];
  const after = frames.filter((f) => f.t > t0);
  const end = frames.at(-1);
  // a jump is one frame that carries most of the move: a track opening 0fr → 1fr on a decelerating curve
  // moves a few px in its first frame and is smooth (Pane, 2.6.3: 5.2px of a 14px track was red at a flat 4px)
  let worst = 0, total = 0;
  const seq = [before, ...after];
  for (let i = 1; i < seq.length; i++) {
    if (seq[i].x === null || seq[i - 1].x === null || before.x === null) continue;
    total = Math.max(total, Math.abs(seq[i].x - before.x));
    if (seq[i].t - t0 <= settle) worst = Math.max(worst, Math.abs(seq[i].x - seq[i - 1].x));
  }
  if (worst > jump && worst >= share * total) out.push(`its neighbour jumps ${worst.toFixed(1)}px of its ${total.toFixed(1)}px move in one frame: the toggle changes size at once`);
  const mid = after.find((f) => f.t - t0 >= early);
  if (mid) {
    // a property the press already moved belongs to :active and its own rhythm, not to the choice; one that
    // focus painted (it changes when focus leaves) belongs to the focus ring
    const snapped = end.look.map((v, k) => (rest.look[k] === before.look[k] && before.look[k] !== v && mid.look[k] === v && (!blurred || blurred[k] === v) ? k : -1)).filter((k) => k >= 0);
    if (snapped.length) {
      const PAINT = ['background-color', 'background-image', 'color', 'border-color', 'box-shadow', 'opacity'];
      const where = (k) => `${['', '::before ', '::after '][Math.floor(k / 6)] ?? `child ${Math.floor(k / 6) - 2} `}${PAINT[k % 6]}`;
      const img = snapped.some((k) => k % 6 === 1), sh = snapped.find((k) => k % 6 === 4) !== undefined;
      const why = img ? ' (a gradient cannot be transitioned; paint it from two registered colours, --ds-fill-top and --ds-fill-foot)'
        : sh ? ' (two shadow lists interpolate only when they have the same layers with inset in the same places; pad the shorter one with transparent layers)' : '';
      out.push(`${snapped.map(where).slice(0, 3).join(', ')} already at its end ${Math.round(mid.t - t0)}ms after the press: it swaps instead of changing${why}`);
    }
  }
  return out;
}

/** Clicks toggles in the demos and judges each change both ways where it can go back. */
export async function toggleChange(page, { scope = 'main [data-example-live]', limit = 4, window: ms = 700, jump = 4, early = 60, settle = 300, hold = 90 } = {}) {
  const out = [], skipped = []; let seen = 0, tag = 0;
  const handles = (await page.$$(`${scope} ${TOGGLE_SELECTOR}`)).slice(0, limit * 4);
  for (const h of handles) {
    if (seen >= limit) break;
    await h.scrollIntoViewIfNeeded().catch(() => {});
    const box = await h.boundingBox().catch(() => null);
    if (!box || box.width < 8 || box.height < 8) continue;
    const id = `kiln-mo3-${tag++}`;
    const info = await h.evaluate((el, id) => {
      el.setAttribute('data-kiln-probe', id);
      const radio = /^(radio|tab|option)$/.test(el.getAttribute('role') ?? '') || (el.hasAttribute('aria-selected') && !el.hasAttribute('aria-pressed'));
      return { radio, inComponent: !!el.closest('[data-component]'), on: ['true', 'on', 'checked', 'active'].includes(el.getAttribute('aria-pressed') ?? el.getAttribute('aria-checked') ?? el.getAttribute('aria-selected') ?? el.dataset.state), name: `${el.closest('[data-component]')?.dataset.component ?? el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 24)}"` };
    }, id);
    if (info.radio && info.on) continue; // pressing the chosen option changes nothing
    if (!info.inComponent) continue; // the book's own chrome in a demo (a scene picker) is not the component under test
    const sel = `[data-kiln-probe="${id}"]`;
    // the point pressed must land on the toggle (or its label): a covered or off-screen toggle is skipped and
    // counted, never judged on a press that went somewhere else (Pane: a Calendar under the stage picker)
    const reach = async () => {
      const b = await h.boundingBox(); if (!b) return null;
      const pt = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      const hits = await page.evaluate(([s, x, y]) => { const el = document.querySelector(s), at = document.elementFromPoint(x, y); return !!at && (el === at || el.contains(at) || at.contains(el) || at.closest('label')?.contains(el)); }, [sel, pt.x, pt.y]);
      return hits ? pt : null;
    };
    const press = async () => {
      const pt = await reach(); if (!pt) return null;
      // rest on the toggle first so the hover transition is over, then a click held as long as a person holds one
      await page.mouse.move(pt.x, pt.y); await page.waitForTimeout(600);
      const sampling = page.evaluate(SAMPLER, [sel, ms]);
      await page.waitForTimeout(50); await page.mouse.down(); await page.waitForTimeout(hold); await page.mouse.up();
      return sampling;
    };
    let judged = false;
    for (const dir of info.radio ? ['on'] : ['on', 'off']) {
      const s = await press().catch(() => null);
      if (!s || s.t0 === null) { skipped.push(`${info.name}: ${s ? 'its state never flipped on a click' : 'the press does not land on it'}`); break; }
      judged = true;
      for (const p of judgeToggle(s, { jump, early, settle })) out.push(`${info.name} (${dir === 'on' ? 'first press' : 'pressed back'}): ${p}`);
    }
    if (judged) seen++;
    await page.mouse.move(1, 1);
  }
  return { checked: seen, problems: out, skipped };
}

// ---------------------------------------------------------------- G-MO4 an overlay arriving and leaving
// motion.md "Decelerate in, accelerate out": a dialog, sheet, popover or menu arrives on a decelerating curve,
// leaves on an accelerating one, and leaves faster, exit ≤ `exitRatio` × enter. An overlay that arrives with
// motion and vanishes in one frame is red too: the way out is part of the rhythm (Pane handoff, item 7).
export const OVERLAY_TRIGGER = ':is([aria-haspopup]:not([aria-haspopup=false]), [aria-expanded=false][aria-controls]):not([disabled]):not([aria-disabled=true])';

/** In-page: records every animation that starts in the next `ms` ms, except the trigger's own. */
const ANIMS = ([sel, ms]) => new Promise((done) => {
  const trig = document.querySelector(sel);
  const seen = new Map(); const start = performance.now();
  // an entrance with fill: both stays in getAnimations() after it ends; only what starts from now counts
  const before = new Set(document.getAnimations());
  const timing = (a) => {
    const eff = a.effect; if (!eff?.getTiming) return null;
    const t = eff.getTiming(); const kf = eff.getKeyframes?.() ?? [];
    // a CSS transition carries its curve on the timing, a CSS animation on its first keyframe
    const easing = t.easing && t.easing !== 'linear' ? t.easing : (kf[0]?.easing ?? t.easing);
    const tgt = eff.target; const props = kf.flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x)));
    return { duration: Number(t.duration) || 0, delay: Number(t.delay) || 0, easing, props: [...new Set(props.concat(a.transitionProperty ? [a.transitionProperty] : []))], on: tgt ? `${tgt.tagName.toLowerCase()}${tgt.getAttribute('role') ? `[role=${tgt.getAttribute('role')}]` : ''}` : '?' };
  };
  const tick = () => {
    for (const a of document.getAnimations()) {
      const tgt = a.effect?.target;
      if (seen.has(a) || before.has(a) || !tgt || (trig && (tgt === trig || trig.contains(tgt)))) continue;
      const t = timing(a); if (t && t.duration > 0) seen.set(a, t);
    }
    if (performance.now() - start > ms) return done([...seen.values()]);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

/** Pure judgement over what moved on the way in and on the way out. */
export function judgeOverlay(enter, exit, { exitRatio = 0.6 } = {}) {
  const out = [];
  const main = (list) => list.slice().sort((a, b) => b.duration + b.delay - (a.duration + a.delay))[0];
  const e = main(enter), x = main(exit);
  if (!e) return out; // arrives with no motion: G-MO1/G-MO2 own the quiet case
  const curve = (s) => parseTimings(s)[0]?.bezier ?? null;
  const ec = curve(e.easing);
  if (ec && !decelerates(ec)) out.push(`arrives on "${e.easing}" (${e.on}), which does not decelerate`);
  if (!x) { out.push(`arrives over ${Math.round(e.duration)}ms and leaves in one frame: give it an exit, about ${Math.round(e.duration * exitRatio)}ms, accelerating`); return out; }
  const xc = curve(x.easing);
  if (xc && !accelerates(xc)) out.push(`leaves on "${x.easing}" (${x.on}), which does not accelerate away`);
  if (x.duration > e.duration * exitRatio + 1) out.push(`leaves over ${Math.round(x.duration)}ms, more than ${exitRatio} × its ${Math.round(e.duration)}ms entrance`);
  return out;
}

/** Opens each overlay trigger in the demos with a real click, closes it with Escape, judges both halves. */
export async function overlayChoreography(page, { scope = 'main [data-example-live]', limit = 3, window: ms = 900, exitRatio = 0.6 } = {}) {
  const out = []; let seen = 0, tag = 0;
  const handles = (await page.$$(`${scope} ${OVERLAY_TRIGGER}`)).slice(0, limit * 3);
  for (const h of handles) {
    if (seen >= limit) break;
    const box = await h.boundingBox().catch(() => null);
    if (!box || box.width < 8 || box.height < 8) continue;
    const id = `kiln-mo4-${tag++}`;
    const name = await h.evaluate((el, id) => { el.setAttribute('data-kiln-probe', id); return `${el.closest('[data-component]')?.dataset.component ?? el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 24)}"`; }, id);
    const sel = `[data-kiln-probe="${id}"]`;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(500);
    const inP = page.evaluate(ANIMS, [sel, ms]);
    await page.waitForTimeout(30); await page.mouse.down(); await page.mouse.up();
    const enter = await inP.catch(() => []);
    const opened = await h.evaluate((el) => el.getAttribute('aria-expanded') === 'true' || el.dataset.state === 'open' || !!document.querySelector('[role=dialog],[role=alertdialog],[role=menu],[role=listbox],[popover]:popover-open'));
    if (!opened) continue;
    seen++;
    const outP = page.evaluate(ANIMS, [sel, ms]);
    await page.waitForTimeout(30); await page.keyboard.press('Escape');
    const exit = await outP.catch(() => []);
    for (const p of judgeOverlay(enter, exit, { exitRatio })) out.push(`${name}: ${p}`);
    await page.mouse.move(1, 1); await page.waitForTimeout(200);
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
