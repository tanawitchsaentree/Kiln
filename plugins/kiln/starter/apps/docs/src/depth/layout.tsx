// Usage tabs for the layout primitives (Container, Grid, Stack). They have no form of their own
// (identity: false in their why.json), so their pages are about structure, and their diagrams sit on
// the Field backdrop. Seed content from the kiln starter: rewrite it in the system's voice.
import { Container, Grid, GridItem, Stack } from 'kiln-ds-react';
import type { Depth } from './types';

const Box = ({ children }: { children: React.ReactNode }) => <div className="demo-box"><p className="flush">{children}</p></div>;
const NO_EMPHASIS = { na: 'A layout primitive has no emphasis of its own. Hierarchy comes from what is placed inside it.' };
const NO_DIVE = { na: 'There is no variant prop, so there is nothing to compare one variant against.' };
const LAYOUT_BEHAVIOUR = (what: string) => ({
  states: [['Rest', what, 'Structure only. It paints nothing.'], ['Forced colours', 'No change, because it draws nothing.', 'Structure survives by definition.']] as Array<[string, string, string]>,
  interactions: [['Keyboard', 'Tab', 'Not focusable. Children keep their own order.', 'Renders a div'], ['Screen reader', 'Read', 'Not announced. It has no role.', 'Renders a div']] as Array<[string, string, string, string]>,
  loading: <p>It has no loading state. Keep placeholders the same size as the content they stand for, so the layout does not move when content arrives.</p>,
  focus: <p>It never takes focus. Reading and tab order follow the DOM order of its children.</p>,
});

export const CONTAINER: Depth = {
  overview: (
    <>
      <p>Container sets how wide a page or region may grow, and keeps the page margin on both sides. Content inside it never runs edge to edge on a wide screen, and never touches the edge on a phone.</p>
      <p>The margin comes from the layout tokens, 16px on phones and wider at larger breakpoints. The widths come from the same tokens as the Grid, so a Container and the Grid inside it agree about where the edges are.</p>
    </>
  ),
  whenToUse: ['Around the whole page, inside main.', 'Around a reading column, at sm or md.', 'Around a region that should line up with the page width.'],
  whenNot: [{ situation: 'Space between siblings', to: '/components/stack', label: 'Stack' }, { situation: 'Columns', to: '/components/grid', label: 'Grid' }],
  variants: { na: 'Container has no variant prop. It only sets a width and a margin.' },
  anatomy: { render: <Container size="sm"><Box>Content column</Box></Container>, parts: [{ part: 'Maximum width', selector: '[data-component="Container"]', what: 'From container.max-size, which points at the layout container tokens.' }, { part: 'Inline margin', selector: '[data-component="Container"]', what: 'container.margin, the page margin for the breakpoint.' }] },
  sizes: {
    sm: { use: '640px. A reading column or a single form.', pairs: 'Body text at about 70 characters a line.' },
    md: { use: '768px. An article with images, or settings.', pairs: 'Two Grid columns at most.' },
    lg: { use: '1024px. A feed with a side panel.', pairs: 'A 12-column Grid.' },
    xl: { use: '1200px, the default. Most app screens.', pairs: 'A 12-column Grid.' },
    '2xl': { use: '1440px. Galleries and wide media.', pairs: 'Grids of many small items.' },
  },
  emphasis: NO_EMPHASIS,
  placement: { rows: [['Inside main', 'The default page frame.'], ['Inside a section', 'A narrower column within the page, such as a reading block.']], examples: [{ title: 'A reading column', render: <Container size="sm"><Box>Reading text sits at sm, about 70 characters a line.</Box></Container> }] },
  combinations: { good: [['Container + Grid', 'The usual page frame.'], ['Container sm + text', 'A reading page.']], avoid: [{ title: 'a container inside a container', why: 'Two margins stack and the content shrinks for no reason.', render: <Container size="md"><Container size="md"><Box>Double margin</Box></Container></Container> }] },
  content: { na: 'Container holds no text of its own. Its content follows the rules of the components inside it.' },
  behaviours: LAYOUT_BEHAVIOUR('A centred block at its maximum width with the page margin.'),
  deepDive: NO_DIVE,
  modifiers: { na: 'Container has no optional slots or booleans.' },
  related: [['/components/grid', 'Grid', 'Columns inside the container.'], ['/foundations/grid', 'Grid and layout', 'The breakpoints and margins.']],
  references: [{ title: 'Apple Human Interface Guidelines · Layout', url: 'https://developer.apple.com/design/human-interface-guidelines/layout', why: 'Margins around content on every screen size.' }, { title: 'WCAG 2.2 · 1.4.10 Reflow', url: 'https://www.w3.org/WAI/WCAG22/Understanding/reflow.html', why: 'Why content must fit 320px without sideways scrolling.' }],
};

export const GRID: Depth = {
  overview: (
    <>
      <p>Grid lays content on columns that follow the screen, with 4 on phones, 8 from 768px and 12 from 1024px. Each item says how many columns it spans at each breakpoint, so the same markup gives one column on a phone and three on a desktop.</p>
      <p>Gutters come from the layout tokens and grow with the breakpoint. Spans never change the DOM order, so reading order and tab order stay the same at every width.</p>
    </>
  ),
  whenToUse: ['A collection of items, such as a feed or a gallery.', 'A page with a main column and a side column.', 'Any layout that changes column count with the screen.'],
  whenNot: [{ situation: 'One row or one column of things', to: '/components/stack', label: 'Stack' }, { situation: 'Rows of data with headers', to: '/reference/status', label: 'A real table' }],
  variants: { na: 'Grid has no variant prop. Its columns come from the layout tokens.' },
  anatomy: { render: <Grid><GridItem span={2}><Box>Span 2</Box></GridItem><GridItem span={2}><Box>Span 2</Box></GridItem></Grid>, parts: [{ part: 'Grid', selector: '[data-component="Grid"]', what: 'A CSS grid whose column count and gap come from the grid tokens.' }, { part: 'Item', selector: '[data-component="Grid"] > *', what: 'GridItem. Sets the span for each breakpoint.' }] },
  sizes: { na: 'Grid has no size prop. Its column count follows the breakpoint, and columns can be overridden with the columns prop.' },
  emphasis: NO_EMPHASIS,
  placement: { rows: [['Inside a Container', 'The default. The grid edges match the page margin.'], ['Inside a component', 'Rarely. A component’s own content is usually a Stack.']], examples: [{ title: 'Main and side', render: <Grid><GridItem span="full" lg={8}><Box>Main</Box></GridItem><GridItem span="full" lg={4}><Box>Side</Box></GridItem></Grid> }] },
  combinations: { good: [['Grid of components', 'A collection that reflows with the screen.'], ['Container + Grid', 'A page frame.']], avoid: [{ title: 'spans that do not add up', why: 'Items wrap at odd places and leave holes. Make each row sum to the column count.', render: <Grid columns={4}><GridItem span={3}><Box>3</Box></GridItem><GridItem span={3}><Box>3</Box></GridItem></Grid> }] },
  content: { na: 'Grid holds no text of its own.' },
  behaviours: LAYOUT_BEHAVIOUR('Columns and gutters from the tokens at each breakpoint.'),
  deepDive: NO_DIVE,
  modifiers: [{ name: 'Responsive spans', rules: <p>Set <code>span</code> for phones, then <code>md</code> and <code>lg</code> for wider screens. An item with only <code>span</code> keeps it at every width.</p>, pair: { do: <Grid><GridItem span="full" md={4}><Box>Full, then half</Box></GridItem><GridItem span="full" md={4}><Box>Full, then half</Box></GridItem></Grid>, doNote: 'Full width on phones, halves from md.', dont: <Grid columns={4}><GridItem span={1}><Box>¼</Box></GridItem></Grid>, dontNote: 'A quarter of a phone is too narrow to read.' } }],
  related: [['/components/container', 'Container', 'The frame around the grid.'], ['/foundations/grid', 'Grid and layout', 'Columns, gutters and breakpoints.']],
  references: [{ title: 'Apple Human Interface Guidelines · Layout', url: 'https://developer.apple.com/design/human-interface-guidelines/layout', why: 'Adaptive columns and margins across screen sizes.' }, { title: 'WCAG 2.2 · 1.3.2 Meaningful Sequence', url: 'https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html', why: 'Why spans must never reorder content.' }],
};

export const STACK: Depth = {
  overview: (
    <>
      <p>Stack spaces its children in one direction with a gap from the token scale. Children never carry their own margins, so spacing is owned by the parent and stays consistent when items move.</p>
      <p>A column stack is the usual way to lay out the inside of a component. A row stack lays things out inline and wraps when it runs out of room, such as a row of tags or buttons.</p>
    </>
  ),
  whenToUse: ['The inside of a component, with its title, text and actions.', 'A row of tags, chips or buttons.', 'Any list of items with even spacing.'],
  whenNot: [{ situation: 'Items that must line up in columns', to: '/components/grid', label: 'Grid' }, { situation: 'A list with meaning, such as steps', to: '/foundations/typography', label: 'A real ul or ol' }],
  variants: { na: 'Stack has no variant prop. Direction, gap and alignment are layout choices, covered below.' },
  anatomy: { render: <div className="demo-box"><Stack direction="row" gap="md"><span className="demo-chip">One</span><span className="demo-chip">Two</span><span className="demo-chip">Three</span></Stack></div>, parts: [{ part: 'Flex container', selector: '[data-component="Stack"]', what: 'A flex box in column or row direction. Row wraps.' }, { part: 'Gap', selector: '[data-component="Stack"] > *', what: 'stack.gap, xs 4px to xl 32px, between every pair of children.' }] },
  sizes: { na: 'Stack has no size prop. Its gap prop picks from the spacing scale, shown under Modifiers.' },
  emphasis: NO_EMPHASIS,
  placement: { rows: [['Inside a component', 'Column, gap md. The usual layout inside a component.'], ['A row of controls', 'Row, gap sm.']], examples: [{ title: 'Content in a column', render: <div className="demo-box"><Stack gap="md"><b>Lysefjord</b><span className="muted">Saved to Trips</span></Stack></div> }] },
  combinations: { good: [['Stack inside a component', 'Content in a column.'], ['Row stack of labels', 'Labels under a title.']], avoid: [{ title: 'margins on children', why: 'Margins fight the gap and differ between items. Let the Stack own the space.', render: <div className="demo-box"><Stack gap="md"><b style={{ marginBlockEnd: 24 }}>Title with its own margin</b><span className="muted">Text</span></Stack></div> }] },
  content: { na: 'Stack holds no text of its own.' },
  behaviours: LAYOUT_BEHAVIOUR('Children in a line with an even gap.'),
  deepDive: NO_DIVE,
  modifiers: [{ name: 'Gap', rules: <p>Pick the gap by how related the children are. xs and sm for parts of one thing, such as an icon and its label. md for items in a component. lg and xl between groups.</p>, pair: { do: <div className="demo-box"><Stack gap="xs"><b>Mara Lind</b><span className="muted small">Bergen</span></Stack></div>, doNote: 'A name and its place, close together.', dont: <div className="demo-box"><Stack gap="xl"><b>Mara Lind</b><span className="muted small">Bergen</span></Stack></div>, dontNote: 'The same pair far apart reads as two separate things.' } }],
  related: [['/components/grid', 'Grid', 'Two-dimensional layout.'], ['/foundations/spacing', 'Spacing', 'The gap scale.']],
  references: [{ title: 'Every Layout · The Stack', url: 'https://every-layout.dev/layouts/stack/', why: 'The case for parent-owned spacing.' }, { title: 'Apple Human Interface Guidelines · Layout', url: 'https://developer.apple.com/design/human-interface-guidelines/layout', why: 'Grouping related items by proximity.' }],
};

