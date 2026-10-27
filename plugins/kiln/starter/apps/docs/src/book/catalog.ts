// The whole planned catalog (docs/CATALOG.md), so the nav shows what is missing as well as what exists
// (docs-engine component-depth.md, G-IA1). A catalog item counts as built when any of its names is a
// component chapter.
import catalog from '../../../../docs/CATALOG.md?raw';

export interface PlannedWave { wave: number; title: string; items: string[] }

/** "Sheet/BottomSheet" → "Sheet or BottomSheet"; brackets, counts and notes are dropped. */
const clean = (s: string) => s.replace(/\[.*?\]|\(.*?\)|×\d+:?/g, '').replace(/\s*\/\s*/g, ' or ').replace(/\s+/g, ' ').trim();

export function plannedWaves(built: string[]): PlannedWave[] {
  const have = new Set(built.map((b) => b.toLowerCase()));
  return [...catalog.matchAll(/^\*\*W(\d+) ([^(*]+?)\s*\(\d+\):\*\*\s*(.+)$/gm)].map((m) => ({
    wave: Number(m[1]),
    title: m[2].trim(),
    items: m[3].split(/,\s*(?![^[]*\])/).map(clean).filter((n) => n && !n.toLowerCase().split(' or ').some((a) => have.has(a))),
  })).filter((w) => w.items.length);
}
