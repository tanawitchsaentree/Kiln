// Usage-tab content per component (component-depth.md U1–U14). A component with no entry here renders
// its first-edition notes and fails G-K2 until its depth file is written. Each wave adds its files.
import type { Depth } from './types';
import { CONTAINER, GRID, STACK } from './layout';

export const DEPTH: Record<string, Depth> = { Container: CONTAINER, Grid: GRID, Stack: STACK };
