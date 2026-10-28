// Seed icon set for the book: a few generic actions so the Iconography page and the examples render
// from day one. Phase 2 replaces it with the system's own set, drawn from its lineage (stroke,
// caps, joins and grid all decided in system/CONCEPT.md). Stroke icons inherit currentColor.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const seed = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const IconSearch = (p: P) => <svg {...seed} {...p}><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5" /></svg>;
export const IconClose = (p: P) => <svg {...seed} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconCheck = (p: P) => <svg {...seed} {...p}><path d="M5 12l5 5 9-10" /></svg>;
export const IconPlus = (p: P) => <svg {...seed} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const IconMinus = (p: P) => <svg {...seed} {...p}><path d="M5 12h14" /></svg>;
export const IconArrow = (p: P) => <svg {...seed} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconChevronDown = (p: P) => <svg {...seed} {...p}><path d="M6 9l6 6 6-6" /></svg>;
export const IconEdit = (p: P) => <svg {...seed} {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /></svg>;
