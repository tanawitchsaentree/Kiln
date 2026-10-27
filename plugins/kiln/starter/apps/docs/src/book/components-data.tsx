// Component chapters. The prose half of each page. Everything else on a component page is
// generated: props (meta.json, react-docgen-typescript), demo floor (meta.json), tokens used (the
// CSS module), keyboard verification (conformance.json), contrast (evidence.json).
// Examples are real files in ../examples, rendered and shown as source from the same module.
import type { ComponentType, ReactNode } from 'react';
import { Link } from './kit';

const MODS = import.meta.glob('../examples/*.tsx', { eager: true }) as Record<string, { default: ComponentType }>;
const SRCS = import.meta.glob('../examples/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface ExampleRef { file: string; title: string; intro: string; Render: ComponentType; code: string; plain?: boolean; backdrop?: 'field' }
// backdrop 'field': a structure diagram whose labels are measured on the plain Field, never on a photo (D-019)
const ex = (file: string, intro: string, plain?: boolean, backdrop?: 'field'): ExampleRef => {
  const key = `../examples/${file}.tsx`;
  if (!MODS[key]) throw new Error(`example ${file} is listed in a chapter but examples/${file}.tsx does not exist`);
  const code = SRCS[key] ?? '';
  return { file, title: code.match(/^\/\/ @example (.*)$/m)?.[1] ?? file, intro, Render: MODS[key].default, code, plain, backdrop };
};

export interface ComponentChapter {
  name: string;
  slug: string;
  purpose: string; // verb-first, one sentence (content-model point 1)
  importLine: string;
  overview: ReactNode;
  hero: ExampleRef;
  ladder: ExampleRef[]; // one per variant dimension + states + compositions
  whenToUse: string[];
  whenNotToUse: Array<[string, string]>;
  anatomy: Array<[string, string]>;
  states?: Array<[string, string]>;
  content: string[];
  dodont: Array<{ do: string; dont: string }>;
  a11y: string[];
  keyboard?: Array<[string, string, string]>; // key · does · conformance check that proves it
  inherits?: string;
  usage: string; // short, copy-ready snippet
  status: 'alpha' | 'beta' | 'stable'; // see /reference/status for what each one requires
  limitations: string[]; // what it does not do yet (Polaris and MUI keep this list on every page)
  youMust: string[]; // accessibility work left to the app (Primer: implementation requirements)
  backdrops: string; // what changes between themes and between the system's backdrops
  related: Array<[string, string, string]>; // path · label · "use it instead when…"
}

export const COMPONENTS: ComponentChapter[] = [
  {
    name: 'Container',
    slug: 'container',
    status: 'beta',
    limitations: ['It sets width and margins only. It does not centre content vertically.', 'There is no full-bleed escape hatch for one child.'],
    youMust: ['Wrap each page region once. Containers inside containers double the margins.', 'Choose a size from the reading width you need, not from the screen.'],
    usage: '<Container size="lg">…</Container>',
    backdrops: 'Container paints nothing, so it looks the same in both themes and on every backdrop. What changes is whatever sits inside it.',
    purpose: 'Centres a page or region at a maximum width, with the responsive page margin on both sides.',
    importLine: "import { Container } from 'kiln-ds-react';",
    overview: (
      <>
        <p>The outer frame of a page. <code>Container</code> caps its content at one of five widths and adds <code>layout.margin</code> on both sides. 16px on phones, 32px from md (768px), 48px from lg (1024px). The margin and the widths are tokens; the breakpoints come from the token build, so nothing here is typed twice.</p>
        <p>Use it once per page body and let <Link to="/components/grid">Grid</Link> divide what is inside.</p>
      </>
    ),
    hero: ex('ContainerPage', 'The page body here is centred at lg with the responsive margin.', true),
    ladder: [
      ex('ContainerSizes', 'Each outline shows one maximum width. sm is 640px, md 768, lg 1024, xl 1200 (the default) and 2xl 1440.', true),
      ex('ContainerReading', 'For long reading, size sm keeps lines near 60 to 75 characters.', true),
      ex('ContainerWithGrid', 'Container around a Grid is the usual page frame.', true),
    ],
    whenToUse: ['The body of every page.', 'A region that must not stretch on very wide screens (a form, an article).'],
    whenNotToUse: [['Spacing between siblings', 'Stack. Gaps belong to the parent'], ['Columns', 'Grid']],
    anatomy: [['Max width', 'container.max-{size} → layout.container-{size}.'], ['Inline margin', 'container.margin points at layout.margin, which is 16, 32 or 48px by breakpoint.']],
    content: ['Pick the narrowest size that fits the content.'],
    dodont: [
      { do: 'One Container per page body.', dont: 'Nest Containers to add more margin. Use Stack or Grid inside.' },
      { do: 'Use sm for long-form reading.', dont: 'Let paragraphs run 1,400px wide.' },
    ],
    a11y: ['A plain div. No landmark of its own. Put it inside <main>, or pass role/aria-label if it is the landmark.'],
    inherits: 'HTMLAttributes<HTMLDivElement>',
    related: [['/components/grid', 'Grid', 'When the inside needs columns.'], ['/foundations/grid', 'Grid & layout', 'Margins, gutters and breakpoints.']],
  },
  {
    name: 'Grid',
    slug: 'grid',
    status: 'beta',
    limitations: ['Spans are set per breakpoint in whole columns. There is no subgrid or row spanning.', 'Column counts are fixed by the tokens at 4, 8 and 12.'],
    youMust: ['Keep source order the same as visual order so keyboard and screen reader order match.', 'Use full span on small screens unless the content truly fits in a narrow column.'],
    usage: '<Grid>\n  <GridItem span="full" lg={8}>…</GridItem>\n  <GridItem span="full" lg={4}>…</GridItem>\n</Grid>',
    backdrops: 'Grids have no surface either. What sits inside them carries the theme.',
    purpose: 'Lays content out on 4, 8 or 12 columns depending on the screen, with token gutters.',
    importLine: "import { Grid, GridItem } from 'kiln-ds-react';",
    overview: (
      <>
        <p>This grid has 4 columns below md (768px), 8 from md and 12 from lg (1024px), with gutters of 16, 24 and 32px. <code>GridItem</code> spans a number of columns, set per breakpoint with <code>span</code>, <code>md</code> and <code>lg</code>. Spans are clamped to the current column count, so a 6-column item never overflows a 4-column phone grid.</p>
        <p>The breakpoint switching is generated by the token build from the breakpoint tokens. The component carries no pixel values at all.</p>
      </>
    ),
    hero: ex('GridResponsive', 'These boxes go full width on phones, halves at md and thirds at lg.', true),
    ladder: [
      ex('GridBasic', 'The column count changes from 4 to 8 to 12 as the screen grows. Resize the window to watch it.', true, 'field'),
      ex('GridPage', 'Main content and a sidebar. Under lg the sidebar drops below the content.', true),
      ex('GridColumns', 'Pass columns for a local grid that should keep its own count.', true),
    ],
    whenToUse: ['Page layouts with columns.', 'Collections that should reflow by screen size.'],
    whenNotToUse: [['A single row or column of things', 'Stack'], ['A data table', 'A real <table>']],
    anatomy: [['Grid', 'A CSS grid whose column count and gap come from the grid tokens.'], ['GridItem', 'Sets span variables and data attributes, and a generated rule picks the right span for each breakpoint.']],
    states: [['< 768px', '4 columns, 16px gutter, 16px margin.'], ['≥ 768px (md)', '8 columns, 24px gutter, 32px margin.'], ['≥ 1024px (lg)', '12 columns, 32px gutter, 48px margin.']],
    content: ['Think in fractions of the current column count. Four of twelve columns at lg is a third.'],
    dodont: [
      { do: 'Let items default to full width on phones.', dont: 'Force three columns on a 375px screen.' },
      { do: 'Keep source order = reading order.', dont: 'Reorder visually with spans and leave the DOM in a different order.' },
    ],
    a11y: ['Purely visual. The DOM order is the reading and tab order, whatever the spans.', 'Real Chromium confirms 4 columns at 375px, 8 at 800px and 12 at 1280px, and that spans clamp.'],
    inherits: 'HTMLAttributes<HTMLDivElement>',
    related: [['/components/stack', 'Stack', 'When there is only one direction.'], ['/components/container', 'Container', 'The frame around the grid.'], ['/foundations/grid', 'Grid & layout', 'The full layout token set.']],
  },
  {
    name: 'Stack',
    slug: 'stack',
    status: 'beta',
    limitations: ['A row stack wraps, but its items do not line up in columns across lines. Use Grid for that.', 'Gaps are limited to the token scale.'],
    youMust: ['Use the smallest gap that still separates the items.', 'Use a list element inside the Stack when the items are a list.'],
    usage: '<Stack gap="md">…</Stack>',
    backdrops: 'Stacks only space things out, so they look the same in every theme.',
    purpose: 'Spaces children in one direction with a token gap, so children never carry their own margins.',
    importLine: "import { Stack } from 'kiln-ds-react';",
    overview: (
      <>
        <p><code>Stack</code> lays children out in one direction, a column by default or a wrapping row, with one of five gaps from 4 to 32px. Space belongs to the parent. Components have no outer margins, and Stack is how you separate them.</p>
      </>
    ),
    hero: ex('StackBasic', 'A stack holds a title, a line of detail and a row of actions.'),
    ladder: [
      ex('StackDirection', 'Stacks run in a column by default. Rows wrap.'),
      ex('StackGaps', 'Five gaps are available. xs is 4px, sm 8, md 16 (the default), lg 24 and xl 32.'),
      ex('StackAlign', 'align sets the cross axis to start, center, end or stretch.'),
      ex('StackForm', 'A settings group nests rows inside a column, with the label and value side by side.'),
      ex('StackRow', 'A row of short items wraps onto the next line when it runs out of room, and keeps its gap.'),
    ],
    whenToUse: ['Any vertical rhythm inside a component or region.', 'A row of buttons, tags or chips.'],
    whenNotToUse: [['Two-dimensional layouts', 'Grid'], ['Lists with semantics', 'A real <ul>/<ol>, laid out with Stack inside if needed']],
    anatomy: [['Flex container', 'flex-direction column | row (wrap).'], ['Gap', 'stack.gap-{xs…xl} → gap tokens.']],
    content: ['Choose the gap by relationship. Things that belong together sit tighter, and groups sit further apart.'],
    dodont: [
      { do: 'Space with the parent’s gap.', dont: 'Add margins to children to push them apart.' },
      { do: 'Nest stacks for groups within groups.', dont: 'Use one huge gap for everything.' },
    ],
    a11y: ['A plain div. Add role="group" + aria-label when the stack is a group of controls .'],
    inherits: 'HTMLAttributes<HTMLDivElement>',
    related: [['/components/grid', 'Grid', 'When you need columns.'], ['/foundations/spacing', 'Spacing', 'The gap scale.']],
  },
];
