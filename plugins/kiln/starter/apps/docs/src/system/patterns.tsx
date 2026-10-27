// The twelve patterns every kiln book covers (component-depth.md, G-IA1). Each is a TODO until the
// system has the components to compose it: problem, anatomy of the solution, a live example built from
// the system's components, variations, live do/don't pairs and the components it uses. A pattern that
// needs a component the catalog has not reached says so in `gap`. See Pane's patterns for depth.
import type { PatternDepth } from '../patterns/PatternDepth';

const REQUIRED: Array<[string, string]> = [
  ['common-actions', 'Common actions'], ['dialogs', 'Dialogs'], ['disabled-states', 'Disabled states'], ['empty-states', 'Empty states'],
  ['filtering', 'Filtering'], ['forms', 'Forms'], ['loading', 'Loading'], ['notifications', 'Notifications'],
  ['overflow-content', 'Overflow content'], ['read-only-states', 'Read-only states'], ['search', 'Search'], ['status-indicators', 'Status indicators'],
];

const stub = (title: string): PatternDepth => ({
  title,
  lede: `TODO(milestone) what the ${title.toLowerCase()} pattern solves, in one sentence.`,
  problem: <p>TODO(milestone) the problem this pattern solves for the reader, and the principle that decides the answer.</p>,
  anatomy: [['TODO(milestone)', 'each part of the solution and the component that provides it']],
  example: { title: 'TODO(milestone) a live example built from the system’s components', render: <p className="fail">TODO(milestone) live example</p> },
  variations: [],
  pairs: [],
  related: [],
});

export const PATTERN_DEPTH: Record<string, PatternDepth> = Object.fromEntries(REQUIRED.map(([slug, title]) => [`/patterns/${slug}`, stub(title)]));
