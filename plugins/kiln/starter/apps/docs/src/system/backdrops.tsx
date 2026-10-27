// Backdrops a demo stage can sit on. System-owned: kiln's docs engine reads this file and never knows
// what the system looks like. A system on plain surfaces keeps these; a system on imagery adds its
// photos here (with credits) and wraps the stage in whatever context its components need, such as
// an environment provider. The Field is the plain ground for diagrams and layout demos (D-019 in Pane).
import type { ReactNode } from 'react';

export interface Backdrop { id: string; label: string; kind: 'surface' | 'image' | 'field'; className?: string; image?: string; dark?: boolean }

export const BACKDROPS: Backdrop[] = [
  { id: 'page', label: 'Page', kind: 'surface', className: 'stage-page' },
  { id: 'raised', label: 'Raised', kind: 'surface', className: 'stage-raised' },
  { id: 'field', label: 'Field (diagrams)', kind: 'field' },
];
/** The two backdrops every component page shows it on, in every theme (gate G-B1): the darker and the
 *  brighter of what the system really sits on. */
export const MATRIX: { dark: string; bright: string; darkLabel: string; brightLabel: string } = { dark: 'page', bright: 'raised', darkLabel: 'page surface', brightLabel: 'raised surface' };
export const backdropById = (id: string) => BACKDROPS.find((b) => b.id === id) ?? BACKDROPS[0];

/** Wraps every stage's children. Return them unchanged unless the system's components need a context. */
export function StageWrap({ children }: { backdrop: Backdrop; children: ReactNode }) {
  return <div className="stage-env">{children}</div>;
}
