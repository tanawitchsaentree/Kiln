// The book's appearance axes: how the examples look (backdrop first; material and brand when the system has
// them). System-owned. The engine half (book/appearance.tsx) reads them from the URL, checks every value,
// drops what it does not know and writes only what differs from the default, so an address holds only
// choices (gate G-ST1, starter rule 15). Pane, 2026-10-29: ?scene=room was written on every page and kept
// an old backdrop alive after the default changed.
//
// The param names must match system/kiln.config.json docs: sceneParam (default "scene"), materialParam,
// brandParam. A system with two materials adds, for example:
//   { id: 'material', param: 'material', label: 'Material', options: [['glass', 'Glass'], ['solid', 'Solid']], fallback: 'glass', root: true }
// and a white-label system adds a brand axis the same way. `root: true` sets data-<id> on <html>, which is
// where component CSS reads it.
import { BACKDROPS } from './backdrops';

export interface AppearanceAxis {
  id: string;
  param: string;
  label: string;
  options: Array<[string, string]>;
  fallback: string;
  root?: boolean;
}

export const APPEARANCE: AppearanceAxis[] = [
  { id: 'scene', param: 'scene', label: 'Demo backdrop', options: BACKDROPS.map((b) => [b.id, b.label]), fallback: BACKDROPS[0].id },
];

/** Params that older versions of the book wrote and this one no longer reads. They are dropped on load. */
export const RETIRED_PARAMS: string[] = [];
