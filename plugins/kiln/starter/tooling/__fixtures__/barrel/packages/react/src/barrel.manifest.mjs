// Fixture manifest for tooling/generate-barrel.selftest.mjs — same shape as a real system's
// (header + components blocks, one raw block). The selftest's mutations string-replace the Wave 1
// components array below, so keep its literal text as is (and never quote it in a comment — the
// first match wins).
export const BARREL_MANIFEST = [
  {
    header: `Wave 1 (fixture): Box, VisuallyHidden.`,
    components: ['Box', 'VisuallyHidden'],
  },
  {
    raw: `export type { Token } from './types';`,
  },
  {
    header: `Wave 2 (fixture): Button.`,
    components: ['Button'],
  },
];
