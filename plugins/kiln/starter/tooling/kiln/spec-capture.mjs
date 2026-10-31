#!/usr/bin/env node
// spec-capture — measures every component's Style tab subjects in the built docs and writes the
// values a reader sees there (component-depth.md S1–S4, gate G-K5). Nothing on a Style tab is typed:
// the tab renders targets, this tool forces each state through Chrome DevTools (CSS.forcePseudoState),
// reads computed style, and maps each value back to the token that produces it in that theme.
//
// Page contract (page-contract.md): on /<componentsBase>/<slug>/style, each rendered subject is
// [data-spec-target="<prop>=<option>;<prop>=<option>"] inside a [data-spec-theme="<theme>"] wrapper.
// A target marked data-spec-disabled is the disabled twin of its key and records only that state.
//
// Usage: node tooling/kiln/spec-capture.mjs        writes <app>/public/specs.json
// A token change shows up here on the next run with no edit to any docs page, which is what G-K5
// proves by mutation.
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { docsConfig, componentPages } from './config.mjs';
import { serveDist } from './serve-dist.mjs';

const C = docsConfig();
const PAGES = componentPages(C).filter((pg) => (pg.tabs ?? []).includes('style'));
const STATES = ['default', 'hover', 'active', 'focus-visible', 'disabled'];
const COLOUR = ['background-color', 'color', 'border-top-color', 'outline-color', 'box-shadow', 'opacity'];
const TYPE = ['font-size', 'font-weight', 'line-height', 'letter-spacing'];
const BOX = ['min-height', 'padding-inline-start', 'padding-block-start', 'column-gap', 'border-top-left-radius', 'min-width', 'outline-width', 'outline-offset'];

const srv = await serveDist(C.abs(C.dist));
const browser = await chromium.launch();
const out = { generatedAt: new Date().toISOString(), states: STATES, components: {} };
let targetsSeen = 0;

// Runs in the page: resolves every --ds-* token in the context of `el`'s theme, for reverse lookup.
const TOKEN_MAP = () => {
  const names = new Set();
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list) => { for (const r of list) { if (r.style) for (const p of r.style) if (p.startsWith('--ds-')) names.add(p); if (r.cssRules) walk(r.cssRules); } };
    walk(rules);
  }
  // Which token names fit a property, and which tier wins: the component's own token, then semantic, then
  // a primitive. A name that does not fit the property (a padding token for a font size) is never chosen.
  const FAMILY = [[/^color$/, /fg|text|ink|on-|label/], [/^background-color$/, /bg|surface|fill|accent/], [/border.*color$/, /border|line|rim|ring/],
    [/^font-size$/, /type|font|text|label|body|title/], [/^font-weight$/, /weight/], [/^line-height$/, /leading|line/], [/^letter-spacing$/, /tracking|letter/],
    [/height$/, /height|control|size/], [/^padding|gap$/, /padding|gap|inset|space/], [/radius$/, /radius|corner/], [/^min-width$/, /width|min|size/],
    [/^outline-(width|offset)$/, /focus|ring|width/], [/^icon-size$/, /icon|size/], [/duration$/, /motion|duration/], [/timing-function$/, /easing|ease|motion/], [/^opacity$/, /opacity|alpha|disabled/]];
  const PRIMITIVE = /^--ds-(color|duration|size|space|ease|easing|font|weight)-/;
  window.__specPick = (names, prop, comp, options = []) => {
    const fam = FAMILY.find(([re]) => re.test(prop))?.[1];
    const fitting = fam ? names.filter((n) => fam.test(n.slice(5))) : names;
    const fit = fitting.length ? fitting : (fam && /color/.test(prop) ? names : fitting);
    // the component's own token first, and among those the one named after this target's option
    const score = (n) => (n.startsWith(`--ds-${comp.toLowerCase()}-`) ? (options.some((o) => n.includes(`-${o}-`) || n.endsWith(`-${o}`)) ? -1 : 0) : PRIMITIVE.test(n) ? 2 : 1);
    return [...fit].sort((a, b) => score(a) - score(b))[0] ?? null;
  };
  window.__specTokens = (host) => {
    // the probe sits in a wrapper whose inherited values no real token has, so a baseline match is never a token
    const wrap = document.createElement('div'); wrap.style.cssText = 'position:absolute; width:3px; color:rgb(1, 2, 3); font-weight:123; visibility:hidden';
    const probe = document.createElement('div'); wrap.appendChild(probe); host.appendChild(wrap);
    const map = {};
    // A var() that is invalid for a property computes to that property's inherited or initial value, so a
    // shadow token painted into color reads as the text colour. Only a value that differs from the
    // probe's own baseline came from the token (Pane, 2026-10-28: white text was named a shadow token).
    const PROPS = ['color', 'width', 'font-weight', 'transition-duration', 'transition-timing-function', 'box-shadow', 'opacity'];
    probe.style.cssText = '';
    const base = Object.fromEntries(PROPS.map((p) => [p, getComputedStyle(probe).getPropertyValue(p)]));
    for (const n of names) {
      const raw = getComputedStyle(host).getPropertyValue(n).trim(); if (!raw) continue;
      probe.style.cssText = PROPS.map((p) => `${p}: var(${n})`).join('; ');
      const cs = getComputedStyle(probe);
      const vals = [raw, ...PROPS.map((p) => cs.getPropertyValue(p)).filter((v, i) => v !== base[PROPS[i]])];
      for (const v of new Set(vals)) if (v && v !== 'auto' && v !== 'none' && v !== '0s' && v !== 'ease') (map[v] ??= []).push(n);
    }
    wrap.remove();
    return map;
  };
};

try {
  for (const pg of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(`${srv.base}${C.componentsBase}/${pg.slug}/style`, { waitUntil: 'networkidle' });
    await page.evaluate(TOKEN_MAP);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-spec-target]' });
    const comp = { targets: [], motion: {} };
    for (const nodeId of nodeIds) {
      const { attributes } = await cdp.send('DOM.getAttributes', { nodeId });
      const attr = Object.fromEntries(attributes.reduce((a, v, i) => (i % 2 ? a : [...a, [v, attributes[i + 1]]]), []));
      const key = attr['data-spec-target'];
      const { object } = await cdp.send('DOM.resolveNode', { nodeId });
      const read = async (props) => { const res = await cdp.send('Runtime.callFunctionOn', {
        objectId: object.objectId, returnByValue: true,
        functionDeclaration: `function (props) {
          let el = this.matches('[data-component]') ? this : this.querySelector('[data-component]') ?? this;
          // a root that draws nothing (a wrapper around cells) is described by the first part that does
          const draws = (e) => { const c = getComputedStyle(e); return c.boxShadow !== 'none' || c.borderTopStyle !== 'none' || !['rgba(0, 0, 0, 0)', 'transparent'].includes(c.backgroundColor) || c.backgroundImage !== 'none'; };
          if (!draws(el)) el = [...el.querySelectorAll('input, textarea, button, [role]')].find(draws) ?? el;
          const host = this.closest('[data-spec-theme]') ?? document.body;
          const map = window.__specTokens(host);
          const cs = getComputedStyle(el);
          const opts = (this.dataset.specTarget || '').split(';').map((kv) => kv.split('=')[1]).filter(Boolean);
          const pick = (v, prop) => window.__specPick(map[v] ?? [], prop, el.dataset.component || '', opts);
          const r = {};
          const fs = parseFloat(cs.fontSize); const hasText = /\\S/.test(el.textContent);
          for (const p of props) {
            // an outline that is not drawn reports the browser default (medium, currentColor): not the component's
            if (p.startsWith('outline') && cs.outlineStyle === 'none') continue;
            if (p.startsWith('border') && p.endsWith('color') && cs.borderTopStyle === 'none') continue;
            if (['font-size', 'line-height', 'letter-spacing', 'font-weight'].includes(p) && !hasText) continue;
            // a part with no text and no icon paints nothing in its text colour (a switch track, a radio circle)
            if (p === 'color' && !hasText && !el.querySelector('svg')) continue;
            const v = cs.getPropertyValue(p).trim();
            if (p === 'min-width' && !/^[\\d.]+px$/.test(v)) continue;
            let token = pick(v, p);
            // unitless and em tokens compute to px: compare the ratio to the font size instead
            if (!token && (p === 'line-height' || p === 'letter-spacing') && fs) { const ratio = String(+(parseFloat(v) / fs).toFixed(3)); token = pick(ratio, p) ?? pick(ratio + 'em', p); }
            // a shadow composed from several tokens (focus ring and halo) names the ones whose colours it carries
            if (!token && p === 'box-shadow') { const parts = Object.keys(map).filter((k) => /^rgba?\\(/.test(k) && v.includes(k)).map((k) => pick(k, p)).filter(Boolean); if (parts.length) token = [...new Set(parts)].join(' + '); }
            // a colour the content brings (a swatch in a colour picker, a chart's data hue) is set through a
            // custom property the app fills; it is named as content, never left as a missing token (Pane, 2026-10-30)
            if (!token && /color$/.test(p) && el.closest('[data-not-token]')) token = 'content colour';
            r[p] = { value: v, token };
          }
          // a part whose look is its size (a spacer, a divider) is described by the size, when a token sets it
          for (const p of ['block-size', 'inline-size']) { const v = cs.getPropertyValue(p).trim(); const token = pick(v, p) ?? pick(v); if (token) r[p] = { value: v, token }; }
          const icon = el.querySelector('svg'); if (icon) { const ic = getComputedStyle(icon); r['icon-size'] = { value: ic.width, token: pick(ic.width) }; }
          return { theme: host.dataset?.specTheme ?? null, r };
        }`,
        arguments: [{ value: props }],
      });
      // an exception inside the page would otherwise surface as a confusing undefined later
      if (res.exceptionDetails) throw new Error(`${pg.title} ${key}: ${res.exceptionDetails.exception?.description ?? res.exceptionDetails.text}`);
      return res.result.value; };
      const target = { key, theme: null, states: {} };
      // a disabled twin is rendered disabled, so its resting look is the disabled state and nothing else
      const twin = 'data-spec-disabled' in attr;
      for (const st of twin ? ['disabled'] : STATES.filter((x) => x !== 'disabled')) {
        const { nodeIds: inner } = await cdp.send('DOM.querySelectorAll', { nodeId, selector: '[data-component]' });
        const el = inner[0] ?? nodeId;
        // focus is a state only something focusable has; forcing it on a Card just draws the browser's ring
        if (st === 'focus-visible') {
          const { object: o } = await cdp.send('DOM.resolveNode', { nodeId: el });
          const { result } = await cdp.send('Runtime.callFunctionOn', { objectId: o.objectId, returnByValue: true, functionDeclaration: 'function () { return this.tabIndex >= 0 && !this.disabled; }' });
          if (!result.value) continue;
        }
        if (st !== 'default' && st !== 'disabled') await cdp.send('CSS.forcePseudoState', { nodeId: el, forcedPseudoClasses: [st] });
        const props = st === 'default' ? [...COLOUR, ...TYPE, ...BOX] : COLOUR.concat(st === 'focus-visible' ? ['outline-width', 'outline-offset'] : []);
        const v = await read(props);
        target.theme = v.theme; target.states[st] = v.r;
        await cdp.send('CSS.forcePseudoState', { nodeId: el, forcedPseudoClasses: [] });
      }
      comp.targets.push(target); targetsSeen++;
    }
    await ctx.close();
    // Motion is read with motion on; under reduced motion every duration is zero at the token level.
    if (nodeIds.length) {
      const live = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
      const p2 = await live.newPage();
      await p2.goto(`${srv.base}${C.componentsBase}/${pg.slug}/style`, { waitUntil: 'networkidle' });
      await p2.evaluate(TOKEN_MAP);
      comp.motion = await p2.evaluate(() => {
        const el = document.querySelector('[data-spec-target] [data-component], [data-spec-target][data-component]'); if (!el) return {};
        const map = window.__specTokens(el.closest('[data-spec-theme]') ?? document.body);
        const pick = (v, prop) => window.__specPick(map[v] ?? [], prop, el.dataset.component || '');
        const cs = getComputedStyle(el);
        const props = cs.transitionProperty.split(',').map((s) => s.trim());
        const durs = cs.transitionDuration.split(',').map((s) => s.trim());
        const ease = cs.transitionTimingFunction.split(/,(?![^(]*\))/).map((s) => s.trim());
        return Object.fromEntries(props.map((p, i) => [p, { duration: { value: durs[i % durs.length], token: pick(durs[i % durs.length], 'transition-duration') }, easing: { value: ease[i % ease.length], token: pick(ease[i % ease.length], 'transition-timing-function') } }]));
      });
      await live.close();
    }
    out.components[pg.title] = comp;
    console.log(`${nodeIds.length ? '✓' : '✗'} ${pg.title.padEnd(12)} ${nodeIds.length} targets`);
  }
} finally {
  await browser.close();
  srv.close();
}

const file = path.join(C.abs(C.app), 'public', 'specs.json');
mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`${targetsSeen ? '✓' : '✗'} spec-capture: ${targetsSeen} targets on ${PAGES.length} style tabs → ${path.relative(C.root, file)}`);
if (!targetsSeen) { console.log('  NOTHING FOUND: no [data-spec-target] on any style tab, so nothing was measured'); process.exit(1); }
