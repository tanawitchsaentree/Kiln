#!/usr/bin/env node
// Proof for conformance-names (a limited run must still see the components a skipped check file covers).
// Usage: node tooling/engine/conformance-names.proof.mjs   (exit 1 when any case is wrong)
import { coveredIn } from './conformance-names.mjs';

const NAMES = ['Dialog', 'Sheet', 'Drawer', 'ActionSheet', 'Popover', 'Button', 'Tooltip'];
const cases = [
  { name: 'literal check', src: "await check('Popover', 'opens on Enter', async () => {})", want: ['Popover'] },
  { name: 'loop over an array (the KILN_CHECKS=09 case)', src: "for (const name of ['Dialog', \"Sheet\", `Drawer`, 'ActionSheet']) {\n  await check(name, 'holds focus', async () => {});\n}", want: ['ActionSheet', 'Dialog', 'Drawer', 'Sheet'] },
  { name: 'a word in prose is not a name', src: "await check('Tooltip', 'shows on focus', () => expect(ok, 'the Button stays put'))", want: ['Tooltip'] },
  { name: 'unknown names ignored', src: "await check('Carousel', 'x', () => {})", want: [] },
];
let wrong = 0;
for (const c of cases) {
  const got = [...coveredIn(c.src, NAMES)].sort();
  const ok = got.join() === c.want.join();
  if (!ok) wrong++;
  console.log(`${ok ? '✓' : '✗'} ${c.name}: ${got.join(', ') || 'none'}`);
}
console.log(`${wrong ? '✗' : '✓'} conformance names: ${cases.length - wrong}/${cases.length} cases as expected`);
process.exit(wrong ? 1 : 0);
