// Every page of the book except the component tabs (ComponentPage) and the patterns (PatternDepth).
// kiln docs engine: tables, scales, playgrounds and verification numbers are generated from the tokens,
// meta.json, conformance.json and evidence.json. What the system says about itself comes from
// ../system/content.tsx and ../system/foundation-extras.tsx, so this file never carries one system's voice.
import { useState, type ReactElement } from 'react';
import decisionsMd from '../../../../system/DECISIONS.md?raw';
import exceptionsMd from '../../../../system/EXCEPTIONS.md?raw';
import * as Icons from '../icons';
import { ThemePlayground, ContrastPlayground, TypePlayground, SpacingPlayground, ShapePlayground, MotionPlayground, IconBrowser, TouchTargetPlayground } from './playgrounds';
import { inline, PRINCIPLES, CONCEPT_INTRO, Callout, Code, CopyButton, ConformanceList, EvidenceTable, Link, Markdown, Page, Section, TOKENS, TokenTable, VerifiedTags, useVerify } from './kit';
import { COMPONENTS } from './components-data';
import { GridLayoutPage } from './grid-page';
import { ComponentPage, EVIDENCE_GROUPS, HISTORY, STATUS_LABEL, TABS } from './ComponentPage';
import { TabRedirect } from './TabRedirect';
import { StatesPage } from './states';
import { PATTERN_DEPTH } from '../system/patterns';
import { EXTRAS } from '../system/foundation-extras';
import { GUIDES } from '../system/guides';
import { PatternDepthPage } from '../patterns/PatternDepth';
import { PARTS } from './router';
import { CONTENT, NAME, PACKAGES } from '../system/content';
import { Choice } from '../system/controls';
import meta from './meta.json';

const tok = (p: string) => TOKENS[p]?.value ?? '—';
const OPEN_EXCEPTIONS = (exceptionsMd.match(/^### E-\d{3}:.*— OPEN\s*$/gm) ?? []).length;

// ================================ Introduction ================================

function Overview() {
  return (
    <Page eyebrow={`${NAME} · design system`} title={CONTENT.overview.title} lede={<p>{CONTENT.overview.lede}</p>}>
      <Section id="box" title="What is in the box">
        <ul>
          <li><b>{PACKAGES.tokens}</b>. {Object.keys(TOKENS).length} design tokens in three tiers (primitive, semantic, component), shipped as CSS, JS with types, SCSS and JSON.</li>
          <li><b>{PACKAGES.react}</b>. {Object.keys(meta.components).length} components ({Object.keys(meta.components).join(', ')}). It carries the tokens, so one install and one import are enough.</li>
          <li><b>This book</b>. Foundations, every component in four tabs, patterns, accessibility evidence and the full token reference.</li>
        </ul>
        <VerifiedTags />
      </Section>
      <Section id="chapters" title="The book" wide>
        <div className="category-grid">
          {PARTS.map((part) => (
            <div key={part.title} className="panel" data-surface="">
              <Link to={part.pages[0].path}><span className="card-link">{part.title}</span></Link>
              <p className="flush muted">{CONTENT.partBlurb[part.title] ?? ''}</p>
              <p className="flush small muted">{part.pages.length} chapter{part.pages.length === 1 ? '' : 's'}: {part.pages.map((p) => p.title).join(' · ')}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section id="status" title="Status">
        <p>{CONTENT.overview.status}</p>
        <p>Every open compromise is in the <Link to="/reference/exceptions">exceptions register</Link>, which has {OPEN_EXCEPTIONS} open today.</p>
        <Callout tone="note" title="How this book stays honest">
          <p>Numbers on these pages are not typed by hand. Token tables come from the tokens JSON, the tokens each component uses from its CSS, contrast from <code>evidence.json</code> and test results from <code>conformance.json</code>, all written by <code>pnpm run verify</code>. If a file is missing the page says UNVERIFIED instead of showing a number.</p>
        </Callout>
      </Section>
    </Page>
  );
}

function GettingStarted() {
  return (
    <Page eyebrow="Getting started" title="Getting started" lede={<p>One install and one import. {PACKAGES.react} carries the tokens inside it, so a React app needs nothing else. It needs React 18 or newer.</p>}>
      <Section id="install" title="1 · Install">
        <Code label="Install">{`npm install ${PACKAGES.react}`}</Code>
        <Code label="main.tsx">{`import '${PACKAGES.react}/all.css';\nimport { Container, Stack } from '${PACKAGES.react}';`}</Code>
        <p>A first screen, laid out only with the layout components, so no spacing or width is typed by hand.</p>
        <Code label="App.tsx">{`import '${PACKAGES.react}/all.css';
import { Container, Grid, GridItem, Stack } from '${PACKAGES.react}';

export function App() {
  return (
    <Container size="xl">
      <Stack gap="xl">
        <header>
          <h1>Projects</h1>
          <p>Everything your team is working on this month.</p>
        </header>
        <Grid>
          <GridItem span="full" lg={8}>
            <Stack gap="md">
              <h2>Active</h2>
              {/* the main list */}
            </Stack>
          </GridItem>
          <GridItem span="full" lg={4}>
            <Stack gap="md">
              <h2>Recent activity</h2>
              {/* a side column on wide screens, below the list on phones */}
            </Stack>
          </GridItem>
        </Grid>
      </Stack>
    </Container>
  );
}`}</Code>
        <p>The tokens also ship on their own as <code>{PACKAGES.tokens}</code>, for projects that are not React. The React package includes them as <code>{PACKAGES.react}/tokens.css</code> and <code>{PACKAGES.react}/tokens</code>, so you never need both.</p>
      </Section>
      <Section id="other-project" title="Using it before it is published">
        <p>Publishing is the maintainer’s decision. Until then, pack a tarball and install that one file.</p>
        <Code>{`# in this repo\npnpm run release:pack            # → release/${PACKAGES.react}-${meta.version}.tgz\n\n# in the other project\nnpm install /path/to/release/${PACKAGES.react}-${meta.version}.tgz`}</Code>
        <p>Every verify run installs exactly that tarball into an empty project, alone, and imports, typechecks and renders it (<code>tooling/smoke-import.mjs</code>), so this path is tested on every run.</p>
      </Section>
      <Section id="tokens-only" title="Tokens without React">
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Import</th><th scope="col">What you get</th></tr></thead>
          <tbody>
            <tr><th scope="row"><code>{PACKAGES.tokens}/css</code></th><td>Every custom property, with themes, breakpoints and reduced-motion blocks.</td></tr>
            <tr><th scope="row"><code>{PACKAGES.tokens}/js</code></th><td>An ES module with <code>tokens</code> (resolved values) and <code>cssVar</code> (var() references), typed by <code>TokenName</code>.</td></tr>
            <tr><th scope="row"><code>{PACKAGES.tokens}/scss</code></th><td><code>$ds-*</code> as var() references and <code>$ds-raw-*</code> as resolved values, for media queries.</td></tr>
            <tr><th scope="row"><code>{PACKAGES.tokens}/json</code></th><td>Every token with tier, type, reference and resolved value, for build tools and design-tool sync.</td></tr>
          </tbody>
        </table></div>
      </Section>
    </Page>
  );
}

function Principles() {
  return (
    <Page eyebrow="Introduction" title="Principles" lede={<p>{CONCEPT_INTRO || 'TODO(phase 1) write system/CONCEPT.md'}</p>}>
      <Section id="how" title="How the principles are used">
        <p>Every token, every part of a component, every state and every movement names one of these principles and says what it does for the reader. The build fails when something has no reason, or when the reason is only about how it looks.</p>
        {!PRINCIPLES.length && <p className="fail">TODO(phase 1) no principles in system/CONCEPT.md yet.</p>}
      </Section>
      {PRINCIPLES.map((p) => (
        <Section key={p.id} id={p.id.toLowerCase()} title={`${p.id} · ${p.name}`}>
          <p>{p.claim}</p>
          <div className="table-wrap">
            <table>
              <caption>What follows from {p.id} on each axis</caption>
              <thead><tr><th scope="col">Axis</th><th scope="col">Therefore</th></tr></thead>
              <tbody>{p.therefore.map(([axis, text]) => <tr key={axis}><th scope="row">{axis}</th><td>{text}</td></tr>)}</tbody>
            </table>
          </div>
        </Section>
      ))}
    </Page>
  );
}

// ================================ Foundations ================================

function ColorPage() {
  const prim = Object.entries(TOKENS).filter(([, t]) => t.tier === 'primitive' && t.type === 'color');
  return (
    <Page eyebrow="Foundations" title="Colour" lede={<p>{CONTENT.foundations.color.lede}</p>}>
      <Section id="playground" title="Check a pair" wide><ContrastPlayground /></Section>
      <Section id="palette" title="Palette" wide>
        <ul className="swatches flush">{prim.map(([p, t]) => <li key={p}><span className="chip" style={{ background: `var(${t.css})` }} aria-hidden="true" /><code>{p}</code><span className="muted">{t.value}</span></li>)}</ul>
      </Section>
      <Section id="roles" title="Roles">
        <p>Components never use a primitive directly. They go through a semantic role, so changing a role moves every component that uses it.</p>
        <TokenTable prefix="text." /><TokenTable prefix="action." /><TokenTable prefix="surface." /><TokenTable prefix="line." /><TokenTable prefix="status." />
      </Section>
    </Page>
  );
}

function ThemeValue({ type, v }: { type: string; v: string }) {
  return type === 'color' ? <span className="tv"><span className="chip" style={{ background: v }} aria-hidden="true" /><code>{v}</code></span> : <code>{v}</code>;
}

function Themes() {
  const themed = Object.entries(TOKENS).filter(([, t]) => t.themes);
  const others = [...new Set(themed.flatMap(([, t]) => Object.keys(t.themes ?? {})))];
  return (
    <Page eyebrow="Foundations" title="Themes" lede={<p>{CONTENT.foundations.themes.lede}</p>}>
      <Section id="playground" title="Try a theme" wide><ThemePlayground /></Section>
      <Section id="switch" title="Switching themes">
        <p>Set <code>data-theme</code> on any element. The nearest one wins, so a region can carry its own theme. With no attribute anywhere, the page follows the reader’s system setting through <code>prefers-color-scheme</code>.</p>
        <Code label="HTML">{`<html data-theme="light">   <!-- whole page -->\n<aside data-theme="dark">   <!-- one region -->`}</Code>
      </Section>
      <Section id="changes" title="What changes between themes" wide>
        <p>Only these tokens have a second value. Everything else is the same in every theme.</p>
        <div className="table-wrap">
          <table className="tokens">
            <thead><tr><th scope="col">Token</th><th scope="col">Base</th>{others.map((o) => <th key={o} scope="col">{o}</th>)}<th scope="col">Copy</th></tr></thead>
            <tbody>{themed.map(([p, t]) => <tr key={p}><td><code>{p}</code></td><td><ThemeValue type={t.type} v={t.value} /></td>{others.map((o) => <td key={o}>{t.themes?.[o] ? <ThemeValue type={t.type} v={t.themes[o].value} /> : '—'}</td>)}<td><CopyButton text={`var(${t.css})`} label={`Copy var(${t.css})`} /></td></tr>)}</tbody>
          </table>
        </div>
      </Section>
    </Page>
  );
}

function Typography() {
  const steps = Object.keys(TOKENS).filter((p) => /^type\.(display|headline|title|emphasis|body|reading|label|caption|micro)$/.test(p)).map((p) => p.slice(5));
  return (
    <Page eyebrow="Foundations" title="Typography" lede={<p>{CONTENT.foundations.typography.lede}</p>}>
      <Section id="playground" title="Type tester" wide><TypePlayground /></Section>
      <Section id="scale" title="Scale" wide>
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Role</th><th scope="col">Size</th><th scope="col">Sample</th></tr></thead>
          <tbody>{steps.map((s) => <tr key={s}><th scope="row"><code>type.{s}</code></th><td>{tok(`type.${s}`)}</td><td style={{ fontSize: `var(--ds-type-${s})`, lineHeight: 1.15 }}>The quick brown fox</td></tr>)}</tbody>
        </table></div>
      </Section>
      <Section id="weights" title="Weights, leading, tracking"><TokenTable prefix="type.weight" /><TokenTable prefix="type.leading" /><TokenTable prefix="type.tracking" /></Section>
    </Page>
  );
}

function Spacing() {
  const scale = Object.entries(TOKENS).filter(([p]) => p.startsWith('space.')).sort((a, b) => parseFloat(String(a[1].value)) - parseFloat(String(b[1].value)));
  return (
    <Page eyebrow="Foundations" title="Spacing" lede={<p>{CONTENT.foundations.spacing.lede}</p>}>
      <Section id="playground" title="Try a gap" wide><SpacingPlayground /></Section>
      <Section id="scale" title="The scale" wide>
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col">Specimen</th><th scope="col"><span className="visually-hidden">Copy</span></th></tr></thead>
          <tbody>{scale.map(([p, t]) => <tr key={p}><th scope="row"><code>{p}</code></th><td>{String(t.value)}</td><td><span className="bar" style={{ inlineSize: `var(${t.css})` }} aria-hidden="true" /></td><td><CopyButton text={`var(${t.css})`} label={`Copy var(${t.css})`} /></td></tr>)}</tbody>
        </table></div>
      </Section>
      <Section id="gaps" title="Named gaps"><p>What components and layouts use. Each points at one step of the scale.</p><TokenTable prefix="gap." /></Section>
    </Page>
  );
}

function Dimensions() {
  return (
    <Page eyebrow="Foundations" title="Dimensions" lede={<p>{CONTENT.foundations.dimensions.lede}</p>}>
      <Section id="playground" title="See the hit areas" wide><TouchTargetPlayground /></Section>
      <Section id="breakpoints" title="Breakpoints"><TokenTable prefix="breakpoint." /></Section>
      <Section id="controls" title="Controls and targets"><TokenTable prefix="control." /><p><code>layout.touch</code> is {tok('layout.touch')}, the smallest hit area for anything tappable.</p></Section>
      <Section id="sizes" title="Sizes"><TokenTable prefix="size." /></Section>
      <Section id="layers" title="Stacking order"><TokenTable prefix="layer." /></Section>
    </Page>
  );
}

function Shape() {
  return (
    <Page eyebrow="Foundations" title="Shape & elevation" lede={<p>{CONTENT.foundations.shape.lede}</p>}>
      <Section id="playground" title="Corner and shadow" wide><ShapePlayground /></Section>
      <Section id="corners" title="Corners">
        <ul className="radius-scale flush">{Object.entries(TOKENS).filter(([p]) => p.startsWith('corner.')).map(([p, t]) => <li key={p}><span className="radius-chip" style={{ borderRadius: `var(${t.css})` }} aria-hidden="true" /><code>{p}</code> <span className="muted">{t.value}</span></li>)}</ul>
      </Section>
      <Section id="elevation" title="Elevation"><TokenTable prefix="elevation." /></Section>
    </Page>
  );
}

function Motion() {
  return (
    <Page eyebrow="Foundations" title="Motion" lede={<p>{CONTENT.foundations.motion.lede}</p>}>
      <Section id="playground" title="Motion player" wide><MotionPlayground /></Section>
      <Section id="tokens" title="Tokens"><TokenTable prefix="motion." /><TokenTable prefix="duration." /><TokenTable prefix="easing." /></Section>
      <Section id="reduced" title="Reduced motion"><p>With <code>prefers-reduced-motion: reduce</code>, the token stylesheet sets every duration to 0ms and every movement distance to 0, so components need no special case.</p></Section>
    </Page>
  );
}

function IconsPage() {
  const list = Object.entries(Icons).filter(([n]) => n.startsWith('Icon'));
  return (
    <Page eyebrow="Foundations" title="Iconography" lede={<p>{CONTENT.foundations.icons.lede}</p>}>
      <Section id="browser" title="Find and copy an icon" wide><IconBrowser /></Section>
      <Section id="set" title="The set" wide>
        <ul className="icon-grid flush">{list.map(([name, Icon]) => { const I = Icon as (p: { className?: string }) => ReactElement; return <li key={name}><I className="icon-cell" /><code>{name}</code></li>; })}</ul>
      </Section>
    </Page>
  );
}

// ================================ Accessibility ================================

function Accessibility() {
  const { evidence, conformance } = useVerify();
  const components = [...COMPONENTS.map((c) => c.name), 'Docs page'];
  return (
    <Page eyebrow="Accessibility" title="How it is verified" lede={<p>Two automated runs back every claim in this book. One measures text contrast pixel by pixel on every backdrop and theme, and the other tests behaviour in a real browser. Both run against the built site.</p>}>
      <Section id="contrast" title="Contrast, measured">
        <ol>
          <li>Load each page on each backdrop, in each theme.</li>
          <li>Wrap every visible text node, make only that text transparent and screenshot.</li>
          <li>Score the text colour against every pixel inside its boxes. The node’s score is its worst pixel, which must reach 4.5:1 for normal text and 3:1 for large text.</li>
          <li>Repeat in normal, reduced-transparency and forced-colours modes.</li>
        </ol>
        {evidence && <p>The last run made {evidence.summary.gatingChecks} text checks with {evidence.summary.gatingFailures} failures, in {evidence.browser} on {new Date(evidence.generatedAt).toLocaleString()}.</p>}
      </Section>
      <Section id="behaviour" title="Behaviour, tested" wide>
        {conformance && <p><b>{conformance.passed}/{conformance.total}</b> checks pass ({new Date(conformance.generatedAt).toLocaleString()}).</p>}
        {components.map((c) => <div key={c}><h3>{c}</h3><ConformanceList component={c} /></div>)}
      </Section>
      <Section id="evidence" title="All measured groups" wide><EvidenceTable groups={[...new Set(Object.values(EVIDENCE_GROUPS).flat())]} /></Section>
    </Page>
  );
}

// ================================ Reference ================================

function Tokens() {
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('all');
  return (
    <Page eyebrow="Reference" title="Tokens" lede={<p>Every token, with the token it points at and its resolved value. Components only read component tokens, component tokens only point at semantic ones, and only primitives hold raw values. The build fails otherwise.</p>}>
      <Section id="all" title="All tokens" wide>
        <div className="token-filter">
          <label className="field"><span>Search</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. accent, 40px" /></label>
          <Choice label="Tier" value={tier} onChange={setTier} options={[['all', 'All'], ['primitive', 'Primitive'], ['semantic', 'Semantic'], ['component', 'Component']]} />
        </div>
        <TokenTable tier={tier === 'all' ? undefined : tier} query={q} />
      </Section>
    </Page>
  );
}

const Decisions = () => (
  <Page eyebrow="Reference" title="Decisions" lede={<p>The system’s long-term memory, rendered from <code>system/DECISIONS.md</code>. A changed decision is a new entry that supersedes the old one.</p>}>
    <Section id="log" title="Decision log" wide>{/^### D-001/m.test(decisionsMd) ? <Markdown source={decisionsMd} skipUntil={/^### D-001/} /> : <p>No decision is locked yet. The first one is the lineage, in Phase 1.</p>}</Section>
  </Page>
);
const Exceptions = () => (
  <Page eyebrow="Reference" title="Exceptions" lede={<p>Every accepted shortfall, with the narrowest scope it may apply to, rendered from <code>system/EXCEPTIONS.md</code>. {OPEN_EXCEPTIONS} open.</p>}>
    <Section id="register" title="Register" wide>{/^### E-001/m.test(exceptionsMd) ? <Markdown source={exceptionsMd} skipUntil={/^### E-001/} /> : <p>No exception is open or closed. Every shortfall the system accepts will be listed here with its narrowest scope.</p>}</Section>
  </Page>
);
const Credits = () => (
  <Page eyebrow="Reference" title="Credits" lede={<p>Images, fonts, engines and tools the system stands on.</p>}>
    <Section id="credits" title="Credits"><p>{CONTENT.credits}</p></Section>
    <Section id="engines" title="Engines and tools"><ul><li>Measurement. Playwright, Chromium and axe-core.</li><li>Build. Vite, pnpm and a DTCG token build with tier enforcement.</li><li>Produced with kiln, the design-system engine for Claude Code.</li></ul></Section>
  </Page>
);

function StatusPage() {
  const { conformance, evidence } = useVerify();
  const cell = (ok: boolean | null, text?: string) => <td><span className={ok === null ? 'muted' : ok ? 'pass' : 'fail'}>{ok === null ? 'Not tested' : ok ? 'Pass' : 'Fail'}</span>{text && <span className="muted small"> {text}</span>}</td>;
  const contrast = (n: string, theme: string | null, mode: string) => {
    if (!evidence) return null;
    const rows = Object.entries(evidence.harness[mode] ?? {}).filter(([k]) => theme === null || k.startsWith(`${theme}/`)).flatMap(([, g]) => (EVIDENCE_GROUPS[n] ?? []).map((x) => g[x]).filter(Boolean));
    return rows.length ? rows.every((x) => x.failures === 0) : null;
  };
  return (
    <Page eyebrow="Reference" title="Status & accessibility matrix" lede={<p>Every component carries a status with written criteria. The matrix shows which tests each component has passed in the last verify run.</p>}>
      <Section id="levels" title="What each status means">
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Status</th><th scope="col">Requires</th></tr></thead>
          <tbody>
            <tr><th scope="row">Alpha</th><td>Builds and has a page, but part of its behaviour is not measured yet. The API may change.</td></tr>
            <tr><th scope="row">Beta</th><td>Every automated check passes and contrast is measured in every theme on every backdrop.</td></tr>
            <tr><th scope="row">Stable</th><td>Everything in Beta, plus recorded screen reader passes and one release without a breaking change.</td></tr>
          </tbody>
        </table></div>
      </Section>
      <Section id="matrix" title="Accessibility matrix" wide>
        <div className="table-wrap"><table className="matrix" data-a11y-matrix="">
          <thead><tr><th scope="col">Component</th><th scope="col">Status</th><th scope="col">Behaviour and keyboard</th><th scope="col">Contrast</th><th scope="col">Forced colours</th><th scope="col">Screen reader</th></tr></thead>
          <tbody>{COMPONENTS.map((c) => { const own = conformance?.checks.filter((x) => x.component === c.name) ?? []; return (
            <tr key={c.name}><th scope="row"><Link to={`/components/${c.slug}`}>{c.name}</Link></th><td>{STATUS_LABEL[c.status]}</td>{cell(own.length ? own.every((x) => x.ok) : null, own.length ? `${own.length} checks` : undefined)}{cell(contrast(c.name, null, 'normal'))}{cell(contrast(c.name, null, 'forced-colors'))}{cell(null)}</tr>
          ); })}</tbody>
        </table></div>
      </Section>
    </Page>
  );
}

function ChangelogPage() {
  const versions = [...new Set(HISTORY.map((h) => h.version))];
  return (
    <Page eyebrow="Reference" title="Change history" lede={<p>Every change to {PACKAGES.react}, newest first, grouped by release. Each component page shows only its own rows.</p>}>
      {versions.map((v) => { const rows = HISTORY.filter((h) => h.version === v); return (
        <Section key={v} id={`v${v.replace(/\W/g, '-')}`} title={`${v} (${rows[0].date ?? ''})`}>
          <div className="table-wrap"><table><thead><tr><th scope="col">Component</th><th scope="col">Change</th></tr></thead>
            <tbody>{rows.map((h) => { const c = COMPONENTS.find((x) => x.name === h.component); return <tr key={h.text}><th scope="row">{c ? <Link to={`/components/${c.slug}`}>{h.component}</Link> : h.component}</th><td>{inline(h.text)}</td></tr>; })}</tbody></table></div>
        </Section>
      ); })}
    </Page>
  );
}

// ================================ routing table ================================

const BASE_PAGES: Record<string, () => ReactElement> = {
  '/': Overview,
  '/getting-started': GettingStarted,
  ...GUIDES,
  '/principles': Principles,
  '/foundations/color': ColorPage,
  '/foundations/themes': Themes,
  '/foundations/typography': Typography,
  '/foundations/spacing': Spacing,
  '/foundations/grid': GridLayoutPage,
  '/foundations/dimensions': Dimensions,
  '/foundations/shape': Shape,
  '/foundations/motion': Motion,
  '/foundations/icons': IconsPage,
  ...Object.fromEntries(COMPONENTS.flatMap((c) => [
    [`/components/${c.slug}`, () => <TabRedirect to={`/components/${c.slug}/usage`} />] as const,
    ...TABS.map((t) => [`/components/${c.slug}/${t}`, () => <ComponentPage c={c} tab={t} />] as const),
  ])),
  '/patterns/states': StatesPage,
  ...Object.fromEntries(Object.entries(PATTERN_DEPTH).map(([path, p]) => [path, () => <PatternDepthPage p={p} />])),
  '/accessibility': Accessibility,
  '/reference/tokens': Tokens,
  '/reference/status': StatusPage,
  '/reference/changelog': ChangelogPage,
  '/reference/decisions': Decisions,
  '/reference/exceptions': Exceptions,
  '/reference/credits': Credits,
};

// Foundation pages carry the system's sections that cover the reference systems' topics (G-BT1).
export const PAGE_COMPONENTS: Record<string, () => ReactElement> = Object.fromEntries(Object.entries(BASE_PAGES).map(([route, Page]) => {
  const Extra = EXTRAS[route];
  return [route, Extra ? () => <><Page /><Extra /></> : Page];
}));
