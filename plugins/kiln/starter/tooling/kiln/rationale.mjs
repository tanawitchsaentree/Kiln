#!/usr/bin/env node
// rationale — nothing in a kiln system exists because it looked nice. Every value and every behaviour
// traces back to a principle distilled from the system's concept (skill kiln, references/concept.md).
//
//   concept     system/CONCEPT.md has a concept paragraph and ≥3 principles "### P<n> <name>", each
//               with a "Therefore" consequence for every axis (space, shape, depth, colour, type, motion,
//               interaction)
//   tokens      every token in the DTCG sources resolves a $extensions["kiln.why"] = { p, why } on
//               itself or its nearest group; p names real principles; why is a reason, not a taste
//   components  every component has <Name>.why.json covering everything its CSS module does:
//               each class (part, seen or unseen), each state selector (hover, focus, disabled,
//               data-state, forced colours, reduced motion…), each transitioned property and keyframes
//   derivation  the form came from the principles, not from a pattern library (references/derivation.md):
//               the generic default it avoids, a lineage reference, ≥3 derivation steps that quote a
//               principle's Therefore text on a named axis, and a variant round the user picked from.
//               Every reason names the axis it acts on, and that principle must speak to that axis.
//               Components still awaiting their round are listed in rationale.pendingDerivation and
//               reported on every run until they are redone; they are not hidden.
//
//   seed mode   while system/kiln.config.json tokens.allowSeed is true (a fresh kiln starter), reasons
//               naming principle "SEED" and an unwritten concept are reported as pending, not failed, so
//               the build can be proven before Phase 1. Once allowSeed is false a SEED reason is a
//               failure, and tooling/kiln/milestone.mjs refuses to close M1 while allowSeed is true.
//   agent picks with autonomy.picks = "agent" (picks decided once at intake), variants.by may be
//               "agent", with variants.reason and a row for the component in system/REVIEW.md.
//
// A reason fails if it is shorter than 8 words or argues from appearance ("looks clean", "modern",
// "สวย", "rounded is friendlier" without saying what it is for).
// Usage: node tooling/kiln/rationale.mjs [--json]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { docsConfig, ROOT } from './config.mjs';

const C = docsConfig();
const SYS = (() => { try { return JSON.parse(readFileSync(path.join(ROOT, 'system', 'kiln.config.json'), 'utf8')); } catch { return {}; } })();
const SEED_MODE = SYS.tokens?.allowSeed === true;
const AGENT_PICKS = SYS.autonomy?.picks === 'agent';
const REVIEW = existsSync(path.join(ROOT, 'system', 'REVIEW.md')) ? readFileSync(path.join(ROOT, 'system', 'REVIEW.md'), 'utf8') : '';
let seeds = 0;
const R = { concept: 'system/CONCEPT.md', tokens: 'packages/tokens/src', components: C.componentsDir, ...(C.rationale ?? {}) };
const AXES = ['space', 'shape', 'depth', 'colour', 'type', 'motion', 'interaction'];
const TASTE = /\b(looks?|feels?) (nice|good|clean|modern|better|cool|premium|sleek|elegant|beautiful|pretty|friendly|right|fresh)\b|\baesthetic(ally)?\b|\bvisual(ly)? appeal|\btrend(y|ing)?\b|\bjust (nicer|prettier)\b|สวย|ดูดี|ทันสมัย|น่ารัก|เท่ห?์?/i;
const problems = [];
const pending = new Set(R.pendingDerivation ?? []);
const notices = [];
const add = (area, msg) => (SEED_MODE && area === 'concept' ? notices.push(`concept: ${msg}`) : problems.push({ area, msg }));

// ---------------------------------------------------------------- concept
const conceptFile = C.abs(R.concept);
const principles = new Map();
if (!existsSync(conceptFile)) add('concept', `${R.concept} missing. Distil the concept into principles before designing anything.`);
else {
  const md = readFileSync(conceptFile, 'utf8');
  const intro = md.split(/^### P\d+/m)[0].replace(/^#.*$/gm, '').trim();
  if (intro.split(/\s+/).length < 40) add('concept', 'the concept paragraph is under 40 words; say what the system is, for whom, and what it must never become');
  for (const m of md.matchAll(/^### (P\d+)\s+(.+)\n([\s\S]*?)(?=^### P\d+|^## |(?![\s\S]))/gm)) {
    const [, id, name, body] = m;
    const therefore = body.split(/\*\*Therefore\*\*/i)[1] ?? '';
    const axes = Object.fromEntries([...therefore.matchAll(/(space|shape|depth|colou?r|type|motion|interaction): ([^]*?)(?= (?:space|shape|depth|colou?r|type|motion|interaction): |\n|$)/g)].map((x) => [x[1].replace('color', 'colour'), x[2].trim()]));
    principles.set(id, { name: name.trim(), axes });
    const missing = AXES.filter((a) => !new RegExp(`\\b${a === 'colour' ? 'colou?r' : a}\\b`, 'i').test(therefore));
    if (!therefore) add('concept', `${id} has no **Therefore** block`);
    else if (missing.length) add('concept', `${id} says nothing about ${missing.join(', ')} under Therefore (write "not affected, because …" if so)`);
  }
  if (principles.size < 3) add('concept', `${principles.size} principles found; at least 3 "### P<n> <name>" headings are needed`);
}
const affects = (p, axis) => { const t = principles.get(p)?.axes?.[axis]; return !!t && !/^not affected/i.test(t); };
const checkReason = (where, w, needAxis = false) => {
  const area = where.split(' ')[0];
  if (!w || typeof w !== 'object') return add(area, `${where}: no reason`);
  const ps = [].concat(w.p ?? []);
  if (ps.includes('SEED')) {
    seeds++;
    if (!SEED_MODE) add(area, `${where}: still the starter's SEED reason; give it this system's own principle and reason`);
    return;
  }
  if (!ps.length) add(area, `${where}: names no principle`);
  for (const p of ps) if (!principles.has(p)) add(area, `${where}: principle ${p} is not in ${R.concept}`);
  const words = String(w.why ?? '').trim().split(/\s+/).filter(Boolean).length;
  if (words < 8) add(area, `${where}: reason has ${words} words; say what it does for the reader or the concept`);
  if (TASTE.test(w.why ?? '')) add(area, `${where}: reason argues from taste ("${String(w.why).match(TASTE)[0]}")`);
  if (needAxis) {
    if (!AXES.includes(w.axis)) add(area, `${where}: name the axis it acts on (${AXES.join(', ')})`);
    else if (ps.length && !ps.some((p) => affects(p, w.axis))) add(area, `${where}: ${ps.join('/')} says nothing about ${w.axis}, so it cannot be the reason for it`);
  }
};

// ---------------------------------------------------------------- tokens
let tokenCount = 0;
const tokDir = C.abs(R.tokens);
const walk = (node, trail, inherited, file) => {
  const own = node.$extensions?.['kiln.why'];
  const why = own ?? inherited;
  if (own) checkReason(`tokens ${file}:${trail.join('.') || '(root)'}`, own);
  if ('$value' in node) {
    tokenCount++;
    if (!why) add('tokens', `${file}:${trail.join('.')} has no reason on itself or any group above it`);
    return;
  }
  for (const [k, v] of Object.entries(node)) if (!k.startsWith('$') && v && typeof v === 'object') walk(v, [...trail, k], why, file);
};
if (existsSync(tokDir)) for (const f of readdirSync(tokDir).filter((n) => n.endsWith('.json'))) walk(JSON.parse(readFileSync(path.join(tokDir, f), 'utf8')), [], null, f);
else add('tokens', `${R.tokens} not found`);

// ---------------------------------------------------------------- components
let compCount = 0;
const compDir = C.abs(R.components);
const STATE_RE = /:(hover|active|focus-visible|focus-within|focus|disabled|checked|invalid|placeholder-shown|empty)\b|\[(data-[\w-]+|aria-[\w-]+)(?:=['"]?([\w-]+)['"]?)?\]/g;
function cssFacts(css) {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const classes = new Set([...body.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const states = new Set();
  for (const m of body.matchAll(STATE_RE)) states.add(m[1] ? m[1] : m[3] ? `${m[2]}=${m[3]}` : m[2]);
  for (const m of body.matchAll(/@media\s*\(([\w-]+)(?::\s*([\w-]+))?\)/g)) if (!/width|height/.test(m[1])) states.add(`@media ${m[1]}${m[2] ? `: ${m[2]}` : ''}`);
  const motion = new Set();
  for (const m of body.matchAll(/transition(?:-property)?\s*:\s*([^;]+);/g)) for (const part of m[1].split(',')) { const prop = part.trim().split(/\s+/)[0]; if (prop && !/^var\(|^\d|^none$/.test(prop)) motion.add(prop); }
  for (const m of body.matchAll(/@keyframes\s+([\w-]+)/g)) motion.add(`@${m[1]}`);
  return { classes, states, motion };
}
if (existsSync(compDir)) for (const name of readdirSync(compDir).filter((n) => statSync(path.join(compDir, n)).isDirectory())) {
  const cssFile = path.join(compDir, name, `${name}.module.css`);
  if (!existsSync(cssFile)) continue;
  compCount++;
  const whyFile = path.join(compDir, name, `${name}.why.json`);
  if (!existsSync(whyFile)) { add('components', `${name}: no ${name}.why.json`); continue; }
  const why = JSON.parse(readFileSync(whyFile, 'utf8'));
  const derived = !pending.has(name);
  if (!derived) notices.push(`${name}: awaiting its derivation round (rationale.pendingDerivation); its current form is not derived from the concept`);
  if (derived) {
    if (why.identity === false) { if (String(why.identity_reason ?? '').split(/\s+/).length < 8) add('derivation', `${name}: identity false needs identity_reason (why this has no form of its own)`); }
    else {
      const avoid = why.default_to_avoid ?? [];
      if (!avoid.length) add('derivation', `${name}: name the generic default it avoids (default_to_avoid) and where that default comes from`);
      // a family round copied into every member named one member's default (Pane's switch inherited the
      // text field's), so each member's own default must be named: by its name, or a word in `kind`
      const words = [name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(), ...[].concat(why.kind ?? []).map((k) => String(k).toLowerCase())];
      if (avoid.length && !avoid.some((a) => words.some((w) => String(a.pattern ?? '').toLowerCase().includes(w)))) add('derivation', `${name}: default_to_avoid never names this component's own default (mention "${words[0]}", or list what it is called elsewhere in "kind")`);
      for (const a of avoid) if (String(a.why_not ?? '').split(/\s+/).length < 8) add('derivation', `${name}: default_to_avoid "${a.pattern}" needs why_not`);
      if (!(why.references ?? []).some((r) => r.url || r.source)) add('derivation', `${name}: cite at least one lineage reference (references[].url or source)`);
      const steps = why.derivation ?? [];
      if (steps.length < 3 || new Set(steps.map((d) => d.p)).size < 2) add('derivation', `${name}: derivation needs ≥3 steps from ≥2 principles`);
      for (const d of steps) {
        const t = principles.get(d.p)?.axes?.[d.axis] ?? '';
        if (!t) add('derivation', `${name}: derivation step ${d.p}/${d.axis} has no Therefore text in ${R.concept}`);
        else if (String(d.consequence ?? '').length < 20 || !t.includes(String(d.consequence).trim())) add('derivation', `${name}: derivation ${d.p}/${d.axis} must quote the principle's Therefore text, not paraphrase it`);
        if (String(d.form ?? '').split(/\s+/).length < 8) add('derivation', `${name}: derivation ${d.p}/${d.axis} must say what form follows (form)`);
      }
      const v = why.variants ?? {};
      if (!(v.options?.length >= 3)) add('derivation', `${name}: render ≥3 variants derived differently (variants.options)`);
      if (!v.picked) add('derivation', `${name}: name the picked variant (variants.picked)`);
      if (v.by === 'agent') {
        if (!AGENT_PICKS) add('derivation', `${name}: variants.by is "agent" but autonomy.picks is not "agent"; the user picks`);
        if (String(v.reason ?? '').split(/\s+/).length < 12) add('derivation', `${name}: an agent pick needs variants.reason (why this one beats the others, from the principles)`);
        if (!new RegExp(`\\b${name}\\b`).test(REVIEW)) add('derivation', `${name}: an agent pick needs its row in system/REVIEW.md so the user can review it`);
      } else if (v.by !== 'user') add('derivation', `${name}: say who picked (variants.by = "user", or "agent" when autonomy.picks is "agent")`);
      if (v.lab && !existsSync(C.abs(v.lab))) add('derivation', `${name}: variants.lab ${v.lab} does not exist`);
    }
  }
  if (!why.concept || String(why.concept).split(/\s+/).length < 12) add('components', `${name}: "concept" must say in a sentence how this component expresses the system's concept`);
  const facts = cssFacts(readFileSync(cssFile, 'utf8'));
  for (const [kind, set] of [['parts', facts.classes], ['states', facts.states], ['motion', facts.motion]]) {
    for (const key of set) if (!why[kind]?.[key]) add('components', `${name}: ${kind} "${key}" is in the CSS but has no reason`);
    for (const [key, w] of Object.entries(why[kind] ?? {})) { if (!set.has(key)) add('components', `${name}: ${kind} "${key}" has a reason but is not in the CSS (stale)`); checkReason(`components ${name} ${kind}.${key}`, w, derived); }
  }
}

const by = (a) => problems.filter((p) => p.area === a).length;
if (process.argv.includes('--json')) console.log(JSON.stringify({ principles: [...principles].map(([id, p]) => ({ id, name: p.name })), tokenCount, compCount, problems, pending: [...pending] }, null, 2));
else {
  for (const p of problems.slice(0, 60)) console.log(`✗ ${p.area.padEnd(10)} ${p.msg}`);
  for (const n of notices) console.log(`⚠ pending    ${n}`);
  if (seeds) console.log(`⚠ seed       ${seeds} starter SEED reasons left${SEED_MODE ? ' (allowed while tokens.allowSeed is true; M1 needs none)' : ''}`);
  if (problems.length > 60) console.log(`  … ${problems.length - 60} more`);
  console.log(`${problems.length ? '✗' : '✓'} rationale: ${principles.size} principles · ${tokenCount} tokens (${by('tokens')} problems) · ${compCount} components (${by('components')} problems) · concept ${by('concept')} problems · derivation ${by('derivation')} problems${pending.size ? ` · ${pending.size} awaiting a derivation round` : ''}`);
}
process.exit(problems.length ? 1 : 0);
