// The Usage tab's content, one object per component, shaped by docs-engine component-depth.md
// (sections U1–U14). Prose lives here; tables of options come from meta.json, so a new variant
// with no row here shows up as a gap on the page and in G-K3 instead of disappearing.
import type { ReactNode } from 'react';

/** A rendered do/don't pair. Both sides are live components, never a screenshot or a sentence alone. */
export interface Pair { do: ReactNode; doNote: string; dont: ReactNode; dontNote: string }

/** A section that does not apply says why, visibly (G-K2). */
export interface NotApplicable { na: string }
export const isNA = (x: unknown): x is NotApplicable => typeof x === 'object' && x !== null && 'na' in x;

export interface Depth {
  /** U2. Paragraphs after the chapter's own overview: the job the component does in a screen. */
  overview: ReactNode;
  /** U3. Each "not" names the sibling to use instead. */
  whenToUse: string[];
  whenNot: Array<{ situation: string; to: string; label: string }>;
  /** U4. One entry per kind-enum option in meta.json. */
  variants: Record<string, { purpose: string; pairing: string }> | NotApplicable;
  /** U5. Numbered parts, located on the live component by selector so the component needs no docs hooks. */
  anatomy: { render: ReactNode; parts: Array<{ part: string; selector: string; what: string }>; perVariant?: string };
  /** U6. One entry per size option in meta.json. */
  sizes: Record<string, { use: string; pairs: string }> | NotApplicable;
  /** U7. How many loud instances a surface may hold, with a live pair. */
  emphasis: { text: ReactNode; pair: Pair } | NotApplicable;
  /** U8. Placement → use case, with live examples. */
  placement: { rows: Array<[string, string]>; examples: Array<{ title: string; render: ReactNode }> } | NotApplicable;
  /** U9. Recommended combinations, and combinations to avoid rendered live. */
  combinations: { good: Array<[string, string]>; avoid: Array<{ title: string; why: string; render: ReactNode }> } | NotApplicable;
  /** U10. Label formula and a live pair, plus live overflow, RTL and +30% expansion renders. */
  content: { formula: ReactNode; pair: Pair; overflow: { text: string; render: ReactNode }; rtl: { text: string; render: ReactNode }; expansion: { text: string; render: ReactNode } } | NotApplicable;
  /** U11. Every state, every input method, loading and default focus. */
  behaviours: { states: Array<[string, string, string]>; interactions: Array<[string, string, string, string]>; loading: ReactNode; focus: ReactNode };
  /** U12. One block per variant option: purpose, an in-context example, practices, a live pair. */
  deepDive: Record<string, { purpose: ReactNode; context: ReactNode; practices: string[]; pair: Pair }> | NotApplicable;
  /** U13. Optional slots and booleans, each with rules and a live pair. */
  modifiers: Array<{ name: string; rules: ReactNode; pair: Pair }> | NotApplicable;
  /** U14. Siblings with the reason to switch, and at least two external references. */
  related: Array<[string, string, string]>;
  references: Array<{ title: string; url: string; why: string }>;
}
