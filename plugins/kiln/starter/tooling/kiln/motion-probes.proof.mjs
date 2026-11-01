#!/usr/bin/env node
// Gate proof for G-MO1 and G-MO2 (Gate Proof Rule: plant the violation, expect red; repair it, expect green).
// Usage: node tooling/engine/motion-probes.proof.mjs   (exit 1 when any case is wrong)
import { chromium } from 'playwright';
import { motionTokenProblems, stateRhythm, decelerates, accelerates, springProblems } from './motion-probes.mjs';

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
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 400 } });
let wrong = 0;
for (const c of cases) {
  let problems;
  if (c.run) problems = c.run();
  else { await page.setContent(`<!doctype html><html><body style="margin:0;font:16px system-ui"><main style="padding:40px">${c.html}</main></body></html>`); problems = (await stateRhythm(page, { limit: 2 })).problems; }
  const got = problems.length ? 'red' : 'green';
  if (got !== c.want) wrong++;
  console.log(`${got === c.want ? '✓' : '✗'} ${c.gate} ${c.want}: ${got}${problems.length ? ` (${problems[0].slice(0, 90)})` : ''}`);
}
await browser.close();
console.log(`${wrong ? '✗' : '✓'} motion probes: ${cases.length - wrong}/${cases.length} cases as expected`);
process.exit(wrong ? 1 : 0);
