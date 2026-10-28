#!/usr/bin/env node
// Gate proof for rationale.mjs: a fixture system that passes, then one planted violation at a time,
// each of which must turn the gate red with the matching message.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL = path.join(path.dirname(fileURLToPath(import.meta.url)), 'rationale.mjs');
const therefore = '**Therefore** space: gaps group what belongs together. shape: corners nest by depth. depth: one layer per level. colour: the scene supplies hue. type: one family, weight carries rank. motion: things settle, never snap. interaction: every target is reachable by touch.';
const CONCEPT = `# Concept\n\nA fixture system used only to prove the rationale gate. It stands for a calm reading surface for people who read long documents on small screens, and it must never become decoration that competes with the words on the page for attention.\n\n## Principles\n\n### P1 Words first\nThe page exists for reading.\n${therefore}\n\n### P2 Calm\nNothing moves unless the reader moved it.\n${therefore}\n\n### P3 Reachable\nEverything works by touch and keyboard.\n${therefore}\n`;
const W = (p, why) => ({ 'kiln.why': { p, why } });
const TOKENS = { space: { $extensions: W('P1', 'a four pixel step keeps related lines close and separates unrelated groups clearly'), 4: { $value: '16px' } } };
const CSS = `.root { border-radius: var(--r); transition: transform var(--d); }\n.root:hover { transform: translateY(-1px); }\n.label { color: var(--t); }\n`;
const LAB = 'apps/lab/button';
const WHY = { concept: 'The button is the one action a reader takes after reading, so it stays quiet until needed.',
  default_to_avoid: [{ pattern: 'gradient filled pill button with a drop shadow from UI kits', why_not: 'it shouts on every screen and competes with the words the page exists for' }],
  references: [{ title: 'fixture lineage', source: 'fixture' }],
  derivation: [
    { p: 'P1', axis: 'type', consequence: 'one family, weight carries rank', form: 'the label uses the body family and only semibold weight marks it as the action' },
    { p: 'P2', axis: 'motion', consequence: 'things settle, never snap', form: 'hover lifts by one pixel over a long ease and settles instead of jumping' },
    { p: 'P3', axis: 'interaction', consequence: 'every target is reachable by touch', form: 'the whole pill is a 44px target so touch never misses it' },
  ],
  variants: { lab: LAB, options: ['A', 'B', 'C'], picked: 'B', by: 'user' },
  parts: { root: { p: 'P3', axis: 'interaction', why: 'the whole pill is the target so a thumb never misses the action' }, label: { p: 'P1', axis: 'type', why: 'the label says the verb so the reader knows what happens before pressing' } },
  states: { hover: { p: 'P2', axis: 'motion', why: 'a small lift confirms the pointer is over the target without pulling the eye away' } },
  motion: { transform: { p: 'P2', axis: 'motion', why: 'the lift settles over a long ease so it reads as a response, not as decoration' } } };

function run(mutate) {
  const dir = mkdtempSync(path.join(tmpdir(), 'rationale-'));
  const files = { 'system/CONCEPT.md': CONCEPT, 'system/kiln.config.json': JSON.stringify({ docs: { componentsDir: 'c' } }), 'packages/tokens/src/primitive.json': JSON.stringify(TOKENS), 'c/Button/Button.module.css': CSS, 'c/Button/Button.why.json': JSON.stringify(WHY), [`${LAB}/index.html`]: '<!doctype html>' };
  mutate?.(files);
  for (const [f, body] of Object.entries(files)) { mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); if (body != null) writeFileSync(path.join(dir, f), body); }
  const r = spawnSync('node', [TOOL], { env: { ...process.env, KILN_SYSTEM_ROOT: dir }, encoding: 'utf8' });
  rmSync(dir, { recursive: true, force: true });
  return { code: r.status, out: r.stdout + r.stderr };
}
const cases = [
  ['clean fixture passes', null, 0, /✓ rationale/],
  ['principle without a motion consequence', (f) => { f['system/CONCEPT.md'] = CONCEPT.replace(/motion: things settle, never snap\. /, ''); }, 1, /says nothing about motion/],
  ['token with no reason', (f) => { f['packages/tokens/src/primitive.json'] = JSON.stringify({ radius: { 1: { $value: '8px' } } }); }, 1, /has no reason/],
  ['reason that argues from taste', (f) => { f['packages/tokens/src/primitive.json'] = JSON.stringify({ radius: { $extensions: W('P1', 'rounded corners look modern and clean on every screen we tried'), 1: { $value: '8px' } } }); }, 1, /argues from taste/],
  ['reason citing an unknown principle', (f) => { f['packages/tokens/src/primitive.json'] = JSON.stringify({ space: { $extensions: W('P9', 'a four pixel step keeps related lines close and groups apart'), 4: { $value: '16px' } } }); }, 1, /P9 is not in/],
  ['CSS part with no reason', (f) => { f['c/Button/Button.module.css'] = CSS + '.icon { inline-size: var(--i); }\n'; }, 1, /parts "icon" is in the CSS but has no reason/],
  ['transition with no reason', (f) => { f['c/Button/Button.module.css'] = CSS.replace('transition: transform var(--d);', 'transition: transform var(--d), background-color var(--d);'); }, 1, /motion "background-color"/],
  ['state with no reason', (f) => { f['c/Button/Button.module.css'] = CSS + '.root:disabled { opacity: .5; }\n'; }, 1, /states "disabled"/],
  ['stale reason for a part that no longer exists', (f) => { f['c/Button/Button.why.json'] = JSON.stringify({ ...WHY, parts: { ...WHY.parts, ghost: { p: 'P1', why: 'a ghost part that the stylesheet no longer has at all' } } }); }, 1, /stale/],
  ['derivation that paraphrases instead of quoting the principle', (f) => { const w = structuredClone(WHY); w.derivation[0].consequence = 'weight shows how important things are'; f['c/Button/Button.why.json'] = JSON.stringify(w); }, 1, /must quote the principle/],
  ['variant picked by the agent while the user picks', (f) => { const w = structuredClone(WHY); w.variants.by = 'agent'; f['c/Button/Button.why.json'] = JSON.stringify(w); }, 1, /autonomy.picks is not "agent"; the user picks/],
  ['agent pick with reason and review row passes', (f) => { const w = structuredClone(WHY); Object.assign(w.variants, { by: 'agent', reason: 'B keeps the weight on the label and the lift on press, so P1 and P2 both show at rest' }); f['c/Button/Button.why.json'] = JSON.stringify(w); f['system/kiln.config.json'] = JSON.stringify({ autonomy: { picks: 'agent' }, docs: { componentsDir: 'c' } }); f['system/REVIEW.md'] = '| Button | B | reason |'; }, 0, /✓ rationale/],
  ['agent pick missing from REVIEW.md', (f) => { const w = structuredClone(WHY); Object.assign(w.variants, { by: 'agent', reason: 'B keeps the weight on the label and the lift on press, so P1 and P2 both show at rest' }); f['c/Button/Button.why.json'] = JSON.stringify(w); f['system/kiln.config.json'] = JSON.stringify({ autonomy: { picks: 'agent' }, docs: { componentsDir: 'c' } }); }, 1, /row in system\/REVIEW.md/],
  ['SEED reason passes in seed mode', (f) => { f['packages/tokens/src/primitive.json'] = JSON.stringify({ $extensions: W('SEED', 'seed value from the kiln starter so the build works from day one'), radius: { 1: { $value: '8px' } } }); f['system/kiln.config.json'] = JSON.stringify({ tokens: { allowSeed: true }, docs: { componentsDir: 'c' } }); }, 0, /1 starter SEED reasons left/],
  ['SEED reason fails once allowSeed is off', (f) => { f['packages/tokens/src/primitive.json'] = JSON.stringify({ $extensions: W('SEED', 'seed value from the kiln starter so the build works from day one'), radius: { 1: { $value: '8px' } } }); }, 1, /still the starter's SEED reason/],
  ['family default that never names this component', (f) => { const w = structuredClone(WHY); w.default_to_avoid = [{ pattern: 'a Material outlined text field with a floating label', why_not: 'it is drawn for a different control and says nothing about this one' }]; f['c/Button/Button.why.json'] = JSON.stringify(w); }, 1, /never names this component's own default/],
  ['no generic default named', (f) => { const w = structuredClone(WHY); w.default_to_avoid = []; f['c/Button/Button.why.json'] = JSON.stringify(w); }, 1, /generic default it avoids/],
  ['reason on an axis the principle does not touch', (f) => { const w = structuredClone(WHY); f['system/CONCEPT.md'] = CONCEPT.replace(/interaction: every target is reachable by touch\./g, 'interaction: not affected.'); f['c/Button/Button.why.json'] = JSON.stringify(w); }, 1, /says nothing about interaction/],
  ['pending component is reported, not failed', (f) => { f['system/kiln.config.json'] = JSON.stringify({ docs: { componentsDir: 'c', rationale: { pendingDerivation: ['Button'] } } }); f['c/Button/Button.why.json'] = JSON.stringify({ ...WHY, derivation: [], variants: {} }); }, 0, /awaiting its derivation round/],
  ['component without a why file', (f) => { f['c/Button/Button.why.json'] = null; }, 1, /no Button.why.json/],
];
let failed = 0;
for (const [name, mutate, want, re] of cases) {
  const r = run(mutate);
  const ok = r.code === want && re.test(r.out);
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    exit ${r.code}, wanted ${want}\n    ${r.out.split('\n').slice(0, 3).join('\n    ')}`}`);
}
console.log(`${failed ? '✗' : '✓'} rationale selftest: ${cases.length - failed}/${cases.length}`);
process.exit(failed ? 1 : 0);
