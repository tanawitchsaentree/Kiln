// ui-probes: the measurements behind six gates that came from Pane's complaints, kept apart from gates.mjs so
// the same code runs in the gates and in their proof (ui-probes.proof.mjs). In-page functions go to
// page.evaluate and take everything they need as one argument.
//
// G-CP1  a search never lists the same label twice for one query (R-035: three "Button" rows, one per tab)
// G-BJ1  controls in one bar that do different jobs look different (R-036: the search field and the version
//        announcement were the same grey pill)
// G-FR1  a focus ring is drawn inside every ancestor that clips (R-038: rings cut off by an overflow: hidden pane)
// G-SP1  a split button's menu lines up with the whole button, not with its arrow half (R-038)
// G-SC1  the showcase is working flows, each with a state switch (R-040: a grid of parts that did nothing)
// G-PG1  a playground starts on the values of the tokens it models (R-035: sliders started on old numbers)

/** Labels that repeat inside one result list. */
export function duplicateOptionsProbe({ options }) {
  const seen = new Map();
  for (const o of document.querySelectorAll(options)) {
    const r = o.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const label = (o.getAttribute('aria-label') ?? o.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (label) seen.set(label, (seen.get(label) ?? 0) + 1);
  }
  return [...seen].filter(([, n]) => n > 1).map(([l, n]) => `"${l}" is listed ${n} times`);
}

/** In each bar, a field, a button and a link that share one look (fill, edge and corner) are read as one job. */
export function barJobsProbe({ bars }) {
  const out = [];
  const job = (el) => (el.matches('input, textarea, [role=searchbox], [role=combobox]:not(button), [data-field]') ? 'field' : el.matches('a[href]') ? 'link' : 'button');
  const look = (el) => { const cs = getComputedStyle(el); return [cs.backgroundColor, cs.backgroundImage, cs.borderTopColor, cs.borderTopWidth, cs.borderRadius].join('|'); };
  const filled = (el) => { const cs = getComputedStyle(el); return !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor) || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0; };
  for (const bar of document.querySelectorAll(bars)) {
    const items = [...bar.querySelectorAll('input, textarea, [role=searchbox], [role=combobox], [data-field], button, a[href]')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && filled(el) && !el.closest('[role=dialog], [role=menu], [role=listbox]'); });
    const byLook = new Map();
    for (const el of items) { const k = look(el); if (!byLook.has(k)) byLook.set(k, new Map()); byLook.get(k).set(job(el), el); }
    for (const jobs of byLook.values()) if (jobs.size > 1) {
      const names = [...jobs].map(([j, el]) => `${j} "${(el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.textContent || '').trim().slice(0, 24)}"`);
      out.push(`${names.join(' and ')} look the same in one bar`);
    }
  }
  return out;
}

/** The focused element's ring (outline, or a focus box-shadow spread) must fit inside every clipping ancestor. */
export function focusClipProbe() {
  const el = document.activeElement;
  if (!el || el === document.body) return [];
  const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
  let ring = 0;
  if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) ring = parseFloat(cs.outlineWidth) + Math.max(0, parseFloat(cs.outlineOffset) || 0);
  else { const spreads = [...cs.boxShadow.matchAll(/(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/g)].filter((m) => !/inset/.test(cs.boxShadow)).map((m) => +m[4]); ring = Math.max(0, ...spreads); }
  if (!ring) return [];
  const box = { l: r.left - ring, t: r.top - ring, rr: r.right + ring, b: r.bottom + ring };
  const out = [];
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const pc = getComputedStyle(p); if (pc.overflow === 'visible' && pc.overflowX === 'visible' && pc.overflowY === 'visible') continue;
    if (pc.overflowY === 'auto' || pc.overflowY === 'scroll') continue; // a scroller clips by design; scrolling reveals the ring
    const q = p.getBoundingClientRect();
    const cut = Math.max(q.left - box.l, q.top - box.t, box.rr - q.right, box.b - q.bottom);
    if (cut > 0.5) { const name = el.closest('[data-component]')?.getAttribute('data-component') ?? el.tagName.toLowerCase(); out.push(`${name} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 20)}": its focus ring is cut by ${Math.round(cut)}px at a clipping parent`); break; }
  }
  return out;
}

/** The open menu of a split button starts at the button's start edge (or ends at its end edge). */
export function splitAlignProbe({ root, menu }) {
  const a = document.querySelector(root), m = document.querySelector(menu);
  if (!a || !m) return ['no open split-button menu to measure'];
  const ra = a.getBoundingClientRect(), rm = m.getBoundingClientRect();
  const start = Math.abs(rm.left - ra.left), end = Math.abs(rm.right - ra.right);
  return Math.min(start, end) > 2 ? [`the menu is ${Math.round(Math.min(start, end))}px off the button's edge (it lines up with a half, not the whole)`] : [];
}

/** Every scenario has a state switch with at least three states and a live screen. */
export function showcaseProbe({ scenario, min = 3 }) {
  const all = [...document.querySelectorAll(scenario)];
  if (!all.length) return ['the showcase has no working scenarios (mark each with data-scenario)'];
  const out = [];
  for (const s of all) {
    const states = s.querySelectorAll('[role=radiogroup] [role=radio], [role=tablist] [role=tab], select option').length;
    const live = s.querySelectorAll('button, input, [role=slider], [role=switch]').length;
    const name = s.getAttribute('aria-label') ?? 'a scenario';
    if (states < min) out.push(`${name}: ${states} states to switch (needs ${min}: ready, loading, empty or failing)`);
    if (live < 3) out.push(`${name}: ${live} controls, so it is a picture rather than a flow`);
  }
  return out;
}

/** A control marked data-playground-token="--ds-x" starts on the token's current value. */
export function playgroundProbe() {
  const out = []; let n = 0;
  for (const el of document.querySelectorAll('[data-playground-token]')) {
    n++;
    const name = el.getAttribute('data-playground-token');
    const want = parseFloat(getComputedStyle(el).getPropertyValue(name));
    const got = parseFloat(el.getAttribute('aria-valuenow') ?? el.value ?? el.getAttribute('data-value'));
    if (Number.isFinite(want) && Number.isFinite(got) && Math.abs(want - got) > Math.max(0.01, Math.abs(want) * 0.01)) out.push(`${name}: the playground starts on ${got}, the token is ${want}`);
  }
  return { checked: n, problems: out };
}
