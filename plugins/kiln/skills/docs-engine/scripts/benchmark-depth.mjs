#!/usr/bin/env node
// benchmark-depth — measures Carbon's usage tab for each component Carbon has, so a kiln page can be
// held to a real reference instead of a number picked by feel (component-depth.md, G-K6).
// Counts words and h2/h3 sections inside <main>, after removing scripts, styles, nav and code.
// Usage: node scripts/benchmark-depth.mjs [out.json]   (default: ../benchmarks/carbon-depth.json)
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] ?? path.join(HERE, '..', 'benchmarks', 'carbon-depth.json');
// Carbon slug → kiln catalog name (docs/CATALOG.md). Only components both have.
const MAP = {
  accordion: 'Accordion', breadcrumb: 'Breadcrumb', button: 'Button', checkbox: 'Checkbox',
  'code-snippet': 'CodeSnippet', 'content-switcher': 'SegmentedControl', 'data-table': 'DataGrid',
  'date-picker': 'DatePicker', dropdown: 'Select', 'file-uploader': 'FileUpload', link: 'Link',
  list: 'List', loading: 'Spinner', menu: 'Menu', modal: 'Dialog', notification: 'Banner',
  'number-input': 'NumberInput', pagination: 'Pagination', popover: 'Popover', 'progress-bar': 'Progress',
  'progress-indicator': 'Stepper', 'radio-button': 'Radio', search: 'SearchInput', slider: 'Slider',
  'structured-list': 'DescriptionList', tabs: 'Tabs', tag: 'Tag', 'text-input': 'Input', tile: 'Card',
  toggle: 'Switch', tooltip: 'Tooltip', 'tree-view': 'TreeView',
};

const words = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
async function measure(slug) {
  const res = await fetch(`https://carbondesignsystem.com/components/${slug}/usage/`);
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const html = await res.text();
  const main = (html.match(/<main[\s\S]*?<\/main>/i) ?? [''])[0]
    .replace(/<(script|style|nav|pre|code|svg)[\s\S]*?<\/\1>/gi, ' ');
  const sections = (main.match(/<h[23][\s>]/gi) ?? []).length;
  const text = main.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
  return { words: words(text), sections };
}

// Re-runs keep earlier measurements and only fetch what failed; requests are spaced so the site does not throttle.
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')).components : {};
const out = { source: 'carbondesignsystem.com usage tabs', measuredAt: new Date().toISOString().slice(0, 10), components: {} };
for (const [slug, name] of Object.entries(MAP)) {
  if (prev[name]?.words) { out.components[name] = prev[name]; continue; }
  await new Promise((r) => setTimeout(r, 2500));
  try { out.components[name] = { carbon: slug, ...(await measure(slug)) }; }
  catch (e) { out.components[name] = { carbon: slug, error: String(e.cause?.code ?? e.message) }; }
  console.log(`${name.padEnd(18)} ${JSON.stringify(out.components[name])}`);
}
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`→ ${OUT}`);
