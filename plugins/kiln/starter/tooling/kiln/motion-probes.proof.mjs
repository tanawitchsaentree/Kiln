#!/usr/bin/env node
// Gate proof for G-MO1, G-MO2 and G-MO3 (Gate Proof Rule: plant the violation, expect red; repair it, expect green).
// Usage: node tooling/engine/motion-probes.proof.mjs   (exit 1 when any case is wrong)
import { chromium } from 'playwright';
import { motionTokenProblems, stateRhythm, toggleChange, decelerates, accelerates, springProblems } from './motion-probes.mjs';

const tok = (over) => ({
  'motion.hover': { tier: 'semantic', type: 'duration', value: '360ms', state: { ':hover': '{duration.brisk}' } },
  'duration.brisk': { tier: 'primitive', type: 'duration', value: '130ms' },
  'motion.enter': { tier: 'semantic', type: 'duration', value: '420ms' },
  'motion.exit': { tier: 'semantic', type: 'duration', value: '240ms' },
  'motion.easing': { tier: 'semantic', type: 'cubicBezier', value: [0.22, 1, 0.36, 1] },
  'motion.easing-exit': { tier: 'semantic', type: 'cubicBezier', value: [0.4, 0, 1, 1] },
  ...over,
});
const live = (css, label = 'Save') => `<style>${css}</style><div data-example-live=""><div data-component="Button"><button class="b">${label}</button></div></div>`;
const BASE = '.b{background:#333;color:#fff;border:0;padding:10px 16px}.b:hover{background:#555}';
// toggles: three chips in a row; `mode` decides how the state shows (a mark put in the DOM, a check track
// that opens from 0fr to 1fr, or a radio group)
const CHIP = '.row{display:flex;gap:8px}.t{color:#fff;border:0;padding:8px 14px;display:inline-grid;grid-auto-flow:column;align-items:center;font:16px system-ui}';
const FILL = "@property --ds-fill-top{syntax:'<color>';inherits:false;initial-value:transparent}@property --ds-fill-foot{syntax:'<color>';inherits:false;initial-value:transparent}";
const TRACK = '.k{display:grid;grid-template-columns:0fr;transition:grid-template-columns 320ms cubic-bezier(.4,0,.2,1)}.k>i{overflow:hidden;width:14px;height:14px;background:#fff}.t[aria-pressed=true] .k{grid-template-columns:1fr}.k>i{min-width:0}';
const chips = (css, mode = '') => {
  const attr = mode === 'radio' ? 'role="radio" aria-checked' : 'aria-pressed';
  const inner = (l) => (mode === 'track' ? `<span class="k"><i></i></span>${l}` : l);
  const flip = mode === 'radio'
    ? "this.parentNode.querySelectorAll('[role=radio]').forEach(b=>b.setAttribute('aria-checked',b===this))"
    : mode === 'mark'
      ? "const on=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',on);if(on){const m=document.createElement('span');m.className='m';m.style.cssText='display:inline-block;width:20px;height:14px;background:#fff';this.prepend(m)}else this.querySelector('.m')?.remove()"
      : "this.setAttribute('aria-pressed',this.getAttribute('aria-pressed')!=='true')";
  const b = (l, on) => `<button class="t" ${attr}="${on}" onclick="${flip}">${inner(l)}</button>`;
  return `<style>${css}</style><div data-example-live=""><div data-component="Chips" class="row"${mode === 'radio' ? ' role="radiogroup"' : ''}>${b('Brick', mode === 'radio')}${b('Plate', false)}${b('Tile', false)}</div></div>`;
};

const cases = [
  { gate: 'bezier', want: 'green', run: () => (decelerates([0.22, 1, 0.36, 1]) && accelerates([0.4, 0, 1, 1]) && !decelerates([0.4, 0, 1, 1]) ? [] : ['curve maths']) },
  { gate: 'G-MO2', want: 'green', run: () => motionTokenProblems(tok({})) },
  { gate: 'G-MO2 symmetric state', want: 'red', run: () => motionTokenProblems(tok({ 'duration.brisk': { tier: 'primitive', type: 'duration', value: '360ms' } })) },
  { gate: 'G-MO2 linear', want: 'red', run: () => motionTokenProblems(tok({ 'motion.easing': { tier: 'semantic', type: 'cubicBezier', value: [0, 0, 1, 1] } })) },
  { gate: 'G-MO2 ease-in on enter', want: 'red', run: () => motionTokenProblems(tok({ 'motion.easing': { tier: 'semantic', type: 'cubicBezier', value: [0.42, 0, 1, 1] } })) },
  { gate: 'G-MO2 exit decelerates', want: 'red', run: () => motionTokenProblems(tok({ 'motion.easing-exit': { tier: 'semantic', type: 'cubicBezier', value: [0.22, 1, 0.36, 1] } })) },
  { gate: 'G-MO2 exit longer', want: 'red', run: () => motionTokenProblems(tok({ 'motion.exit': { tier: 'semantic', type: 'duration', value: '600ms' } })) },
  { gate: 'G-MO2 slow ui', want: 'red', run: () => motionTokenProblems(tok({ 'motion.enter': { tier: 'semantic', type: 'duration', value: '900ms' }, 'motion.exit': { tier: 'semantic', type: 'duration', value: '300ms' } })) },
  // springs: the lab's three materials are green; a wobbly, a creeping and a slow spring are red
  { gate: 'spring enamel', want: 'green', run: () => springProblems({ mass: 1, stiffness: 520, damping: 38 }) },
  { gate: 'spring bakelite', want: 'green', run: () => springProblems({ mass: 2.2, stiffness: 420, damping: 50 }) },
  { gate: 'spring print', want: 'green', run: () => springProblems({ mass: 1, stiffness: 900, damping: 60 }) },
  { gate: 'spring wobble', want: 'red', run: () => springProblems({ mass: 1, stiffness: 520, damping: 12 }) },
  { gate: 'spring creep', want: 'red', run: () => springProblems({ mass: 1, stiffness: 520, damping: 90 }) },
  { gate: 'spring slow', want: 'red', run: () => springProblems({ mass: 6, stiffness: 120, damping: 46 }) },
  // G-MO1, in a page with a real pointer
  { gate: 'G-MO1 snaps', want: 'red', html: live(BASE) },
  { gate: 'G-MO1 browser ease', want: 'red', html: live(BASE + '.b{transition:background-color 200ms ease}') },
  { gate: 'G-MO1 symmetric', want: 'red', html: live(BASE + '.b{transition:background-color 300ms cubic-bezier(.22,1,.36,1)}') },
  { gate: 'G-MO1 slow in, fast out', want: 'red', html: live(BASE + '.b{transition:background-color 120ms cubic-bezier(.22,1,.36,1)}.b:hover{transition-duration:360ms}') },
  { gate: 'G-MO1 rhythm', want: 'green', html: live(BASE + '.b{transition:background-color 360ms cubic-bezier(.22,1,.36,1)}.b:hover{transition-duration:130ms}') },
  { gate: 'G-MO1 token rule', want: 'green', html: live(BASE + ':root{--m:360ms}:where([data-component]:hover){--m:130ms}:where([data-component]:not(:hover)){--m:360ms}.b{transition:background-color var(--m) cubic-bezier(.22,1,.36,1)}') },
  // G-MO3, real clicks on toggles that flip their own state
  { gate: 'G-MO3 gradient swap', want: 'red', toggle: chips(CHIP + '.t{background:linear-gradient(#444,#333);transition:background-color 300ms cubic-bezier(.4,0,.2,1)}.t[aria-pressed=true]{background:linear-gradient(#36c,#249)}') },
  { gate: 'G-MO3 snaps', want: 'red', toggle: chips(CHIP + '.t{background:#444}.t[aria-pressed=true]{background:#36c}') },
  { gate: 'G-MO3 check added to the DOM', want: 'red', toggle: chips(CHIP + '.t{background:#444;transition:background-color 300ms cubic-bezier(.4,0,.2,1)}.t[aria-pressed=true]{background:#36c}', 'mark') },
  { gate: 'G-MO3 colour transition', want: 'green', toggle: chips(CHIP + '.t{background:#444;transition:background-color 300ms cubic-bezier(.4,0,.2,1)}.t[aria-pressed=true]{background:#36c}') },
  { gate: 'G-MO3 registered fill + check track', want: 'green', toggle: chips(FILL + CHIP + TRACK + '.t{--ds-fill-top:#444;--ds-fill-foot:#333;background:linear-gradient(var(--ds-fill-top),var(--ds-fill-foot));transition:--ds-fill-top 300ms cubic-bezier(.4,0,.2,1),--ds-fill-foot 300ms cubic-bezier(.4,0,.2,1)}.t[aria-pressed=true]{--ds-fill-top:#36c;--ds-fill-foot:#249}', 'track') },
  { gate: 'G-MO3 radio group', want: 'green', toggle: chips(CHIP + '.t{background:#444;transition:background-color 300ms cubic-bezier(.4,0,.2,1)}.t[aria-checked=true]{background:#36c}', 'radio') },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 400 } });
let wrong = 0;
for (const c of cases) {
  let problems;
  if (c.run) problems = c.run();
  else {
    await page.setContent(`<!doctype html><html><body style="margin:0;font:16px system-ui"><main style="padding:40px">${c.html ?? c.toggle}</main></body></html>`);
    problems = c.toggle ? (await toggleChange(page, { limit: 2 })).problems : (await stateRhythm(page, { limit: 2 })).problems;
  }
  const got = problems.length ? 'red' : 'green';
  if (got !== c.want) wrong++;
  console.log(`${got === c.want ? '✓' : '✗'} ${c.gate} ${c.want}: ${got}${problems.length ? ` (${problems[0].slice(0, 90)})` : ''}`);
}
await browser.close();
console.log(`${wrong ? '✗' : '✓'} motion probes: ${cases.length - wrong}/${cases.length} cases as expected`);
process.exit(wrong ? 1 : 0);
