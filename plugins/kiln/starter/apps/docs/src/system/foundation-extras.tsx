// Sections that cover the topics Carbon, Atlassian and Apple give each foundation page
// (tooling/kiln/data/topics/*.json, gate G-BT1). Add one Section per topic, with the id you map it to
// in system/benchmark-coverage.json, or decline the topic there with a reason from the concept. Every
// number comes from tokens; every claim is checked against the code (Pane's foundation-extras shows the
// depth expected). Empty on purpose: G-BT1 lists every uncovered topic until this is written.
import type { ReactElement } from 'react';

export const EXTRAS: Record<string, () => ReactElement> = {};
