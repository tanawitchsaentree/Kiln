// A component chapter in four tabs, each its own route (docs-engine component-depth.md):
// usage · style · code · accessibility. The header above the tabs is shared: name, status, last
// updated, purpose and a live demo whose theme and variant selectors come from the enum props.
// Usage is written per component in ../depth; Style is measured (spec-capture); Code and
// Accessibility are generated from meta.json, the CSS module and the conformance run.
import { useState } from 'react';
import { Fact as Tag } from './kit';
import { StageWrap, MATRIX, backdropById } from '../system/backdrops';
import { Choice } from '../system/controls';
import { PACKAGES } from '../system/content';
import meta from './meta.json';
import { inline, WhyText, type Why, Code, CodeBlock, ConformanceList, DoDont, EvidenceTable, Example, Link, Page, Section, Stage, TokensUsed, useVerify } from './kit';
import type { ComponentChapter } from './components-data';
import { DEPTH } from '../depth';
import { UsageTab } from '../depth/UsageTab';
import { StyleTab } from '../depth/StyleTab';
import { OnSurface, SUBJECTS } from '../depth/subjects';
import changelog from '../../../../packages/react/CHANGELOG.md?raw';
import '../depth/depth.css';

export const TABS = ['usage', 'style', 'code', 'accessibility'] as const;
export type Tab = typeof TABS[number];
const TAB_LABEL: Record<Tab, string> = { usage: 'Usage', style: 'Style', code: 'Code', accessibility: 'Accessibility' };

const WHYS = import.meta.glob('../../../../packages/react/src/components/*/*.why.json', { eager: true, import: 'default' }) as Record<string, { concept: string; parts: Record<string, Why>; states: Record<string, Why>; motion: Record<string, Why> }>;
const whyOf = (name: string) => WHYS[`../../../../packages/react/src/components/${name}/${name}.why.json`];

function Reasons({ name }: { name: string }) {
  const w = whyOf(name);
  if (!w) return <p className="fail" data-reasons="">No reasons recorded for {name}.</p>;
  const block = (title: string, rows: Record<string, Why>, what: string) => Object.keys(rows).length ? (
    <>
      <h3>{title}</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th scope="col">{what}</th><th scope="col">Why</th></tr></thead>
          <tbody>{Object.entries(rows).map(([k, v]) => <tr key={k}><th scope="row"><code>{k}</code></th><td><WhyText w={v} /></td></tr>)}</tbody>
        </table>
      </div>
    </>
  ) : null;
  return (
    <>
      <p data-reasons="">{w.concept}</p>
      {block('Parts', w.parts, 'Part')}
      {block('States', w.states, 'State')}
      {block('Motion', w.motion, 'What moves')}
    </>
  );
}

// History per component, parsed from the package changelog: "## version (date)" then "- Name: text".
export const HISTORY: Array<{ version: string; date: string; component: string; text: string }> = changelog.split(/^## /m).slice(1).flatMap((block) => {
  // `## 1.2.0 (2026-10-27)`; a heading without a date still yields its version, so a typo cannot crash the book
  const [, version = block.split(/\s/)[0], date = ''] = block.match(/^(\S+) \((\d{4}-\d{2}-\d{2})\)/) ?? [];
  return [...block.matchAll(/^- (\w+): (.*)$/gm)].map((m) => ({ version, date, component: m[1], text: m[2] }));
});
export const STATUS_LABEL = { alpha: 'Alpha', beta: 'Beta', stable: 'Stable' } as const;

type Meta = typeof meta.components[keyof typeof meta.components];

// Which evidence-harness groups hold this component's text.
export const EVIDENCE_GROUPS: Record<string, string[]> = { Container: ['layout'], Grid: ['layout'], Stack: ['layout'] };

const twoCol = (rows: Array<[string, string]>, a: string, b: string) => (
  <div className="table-wrap">
    <table>
      <thead><tr><th scope="col">{a}</th><th scope="col">{b}</th></tr></thead>
      <tbody>{rows.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody>
    </table>
  </div>
);

function Facts({ c, m }: { c: ComponentChapter; m: Meta }) {
  const { conformance } = useVerify();
  const checks = conformance?.checks.filter((x) => x.component === c.name) ?? [];
  const a11y = !conformance ? 'a11y: unverified (no run)' : checks.length === 0 ? 'a11y: unverified. No test' : checks.every((x) => x.ok) ? `a11y: verified · ${checks.length} checks` : `a11y: ${checks.filter((x) => !x.ok).length} failing`;
  return (
    <ul className="stats flush" aria-label="Component facts" data-facts="">
      <li data-fact="status"><Link to="/reference/status"><Tag>{`status: ${STATUS_LABEL[c.status]}`}</Tag></Link></li>
      <li data-fact="updated"><Tag>{`updated ${HISTORY.find((h) => h.component === c.name)?.date ?? 'never'}`}</Tag></li>
      <li data-fact="size"><Tag>{`${(m.bundle.gzip / 1024).toFixed(1)} kB min+gz`}</Tag></li>
      <li data-fact="a11y"><Tag>{a11y}</Tag></li>
      <li data-fact="since"><Tag>{`since v${HISTORY.filter((h) => h.component === c.name).at(-1)?.version ?? meta.version}`}</Tag></li>
    </ul>
  );
}

/** U1: the live demo in the header. Selectors come from system/controls.tsx (the system's own Select, G-N1), one per enum prop. */
function LiveDemo({ c, m }: { c: ComponentChapter; m: Meta }) {
  const subject = SUBJECTS[c.name];
  const dims: Array<[string, string[]]> = [...Object.entries(m.kinds as Record<string, string[]>), ...(m.sizes.length ? [['size', m.sizes] as [string, string[]]] : [])];
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (document.documentElement.dataset.theme as 'dark' | 'light') ?? 'dark');
  const [picked, setPicked] = useState<Record<string, string>>(() => Object.fromEntries(dims.map(([k, o]) => [k, (m.exports[0].props.find((p) => p.name === k)?.default as string | null) ?? o[0]])));
  const variantDim = dims[0];
  return (
    <div className="live-demo" data-live-demo="" data-registry="U1">
      <p className="flush muted small">Live demo. Pick a theme and {variantDim ? `a ${variantDim[0]}` : 'a variant'}{dims.length > 1 ? ` or ${dims.slice(1).map(([k]) => k).join(' and ')}` : ''} and the component and its code below update together.</p>
      <div className="live-demo-controls">
        <div data-selector="theme"><Choice label="Theme" value={theme} onChange={(v) => setTheme(v as 'dark' | 'light')} options={[['dark', 'Dark'], ['light', 'Light']]} /></div>
        <div data-selector="variant">{variantDim
          ? <Choice label={variantDim[0][0].toUpperCase() + variantDim[0].slice(1)} value={picked[variantDim[0]]} onChange={(v) => setPicked({ ...picked, [variantDim[0]]: v })} options={variantDim[1].map((o) => [o, o] as [string, string])} />
          : <Choice label="Variant" value="default" onChange={() => {}} options={[['default', `${c.name} has one variant`]]} />}</div>
        {dims.slice(1).map(([k, opts]) => <div key={k} data-selector={k}><Choice label={k[0].toUpperCase() + k.slice(1)} value={picked[k]} onChange={(v) => setPicked({ ...picked, [k]: v })} options={opts.map((o) => [o, o] as [string, string])} /></div>)}
      </div>
      <div data-theme={theme} className="live-demo-stage"><Stage>{!subject ? <c.hero.Render /> : subject.bare ? subject.render(picked) : <OnSurface>{subject.render(picked)}</OnSurface>}</Stage></div>
      {subject && <CodeBlock code={subject.code(picked)} label="TSX" />}
    </div>
  );
}

function GeneratedProps({ m, inherits }: { m: Meta; inherits?: string }) {
  return (
    <>
      {m.exports.map((e) => (
        <div key={e.displayName}>
          <h3><code>{e.displayName}</code></h3>
          {e.props.length ? (
            <div className="table-wrap">
              <table>
                <caption>Generated from the TypeScript source by react-docgen-typescript</caption>
                <thead><tr><th scope="col">Prop</th><th scope="col">Type</th><th scope="col">Default</th><th scope="col">Description</th></tr></thead>
                <tbody>{e.props.map((p) => <tr key={p.name}><th scope="row"><code>{p.name}{p.required ? '' : '?'}</code></th><td><code>{p.type}</code></td><td>{p.default != null ? <code>{String(p.default)}</code> : '—'}</td><td>{p.description ? inline(p.description) : <span className="muted">UNDOCUMENTED</span>}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p className="muted">No props of its own. Everything is passed through.</p>}
        </div>
      ))}
      {inherits && <p className="muted">It also passes through every prop of <code>{inherits}</code>.</p>}
    </>
  );
}

function VerifiedKeyboard({ rows }: { rows: Array<[string, string, string]> }) {
  const { conformance } = useVerify();
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th scope="col">Key</th><th scope="col">Does</th><th scope="col">Verified by</th></tr></thead>
        <tbody>
          {rows.map(([k, does, check]) => {
            const c = conformance?.checks.find((x) => `${x.component}: ${x.name}` === check);
            return (
              <tr key={k}>
                <th scope="row"><kbd>{k}</kbd></th>
                <td>{does}</td>
                <td>{c ? <><span className={c.ok ? 'pass' : 'fail'}>{c.ok ? 'PASS' : 'FAIL'}</span> <span className="muted">{c.name}</span></> : <span className="fail">UNVERIFIED. No test</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Backdrops({ c }: { c: ComponentChapter }) {
  return (
    <>
      <div data-backdrops="">
      <p>{c.backdrops}</p>
      <div className="backdrop-matrix">
        {(['dark', 'light'] as const).flatMap((th) => (['dark', 'bright'] as const).map((kind) => { const b = backdropById(MATRIX[kind]); return (
          <figure key={`${th}-${kind}`} className={`backdrop-cell ${b.className ?? ''}`} data-cell="" data-scene-kind={kind} data-tile={b.id} data-theme={th} style={b.image ? { backgroundImage: `url(${b.image})` } : undefined}>
            <figcaption className="backdrop-caption">{th} theme · {kind === 'dark' ? MATRIX.darkLabel : MATRIX.brightLabel}</figcaption>
            <StageWrap backdrop={b}><c.hero.Render /></StageWrap>
          </figure>
        ); }))}
      </div>
      </div>
    </>
  );
}

/** Usage for a component whose depth content is not written yet: the old sections, and the gap stays visible to G-K2. */
function LegacyUsage({ c }: { c: ComponentChapter }) {
  return (
    <>
      <p className="fail" data-depth-missing="">The full usage guide for {c.name} is not written yet. These are the short notes from the first edition.</p>
      <Section id="overview" title="Overview">{c.overview}</Section>
      <Section id="hero" title="In use" wide><p>{c.hero.intro}</p><Example title={c.hero.title} code={c.hero.code} plain={c.hero.plain} backdrop={c.hero.backdrop}><c.hero.Render /></Example></Section>
      <Section id="usage" title="When to use it">
        <h3>Use it for</h3>
        <ul>{c.whenToUse.map((w) => <li key={w}>{w}</li>)}</ul>
        <h3>Use something else for</h3>
        {twoCol(c.whenNotToUse, 'Situation', 'Use instead')}
      </Section>
      <Section id="anatomy" title="Anatomy"><ol className="anatomy">{c.anatomy.map(([part, what]) => <li key={part}><b>{part}</b>. {what}</li>)}</ol></Section>
      {c.states && <Section id="states" title="States and motion">{twoCol(c.states, 'State', 'Behaviour')}</Section>}
      <Section id="guidelines" title="Do and don’t"><DoDont items={c.dodont} /><h3>Writing for it</h3><ul>{c.content.map((x) => <li key={x}>{x}</li>)}</ul></Section>
      <Section id="related" title="Related">
        <div className="table-wrap"><table><thead><tr><th scope="col">See</th><th scope="col">Choose it instead when</th></tr></thead>
          <tbody>{c.related.map(([to, label, why]) => <tr key={to}><th scope="row"><Link to={to}>{label}</Link></th><td>{why}</td></tr>)}</tbody></table></div>
      </Section>
    </>
  );
}

export function ComponentPage({ c, tab }: { c: ComponentChapter; tab: Tab }) {
  const m = (meta.components as Record<string, Meta>)[c.name];
  const depth = DEPTH[c.name];
  const base = `/components/${c.slug}`;
  const demos = 1 + c.ladder.length;
  return (
    <Page eyebrow={`Components · ${c.name}`} title={c.name} lede={
      <div data-component-header="">
        <p className="purpose">{c.purpose}</p>
        <Facts c={c} m={m} />
        <LiveDemo c={c} m={m} />
        <nav className="tab-nav" aria-label={`${c.name} sections`}>
          {TABS.map((t) => <Link key={t} to={`${base}/${t}`} className="tab-link" aria-current={t === tab ? 'page' : undefined}>{TAB_LABEL[t]}</Link>)}
        </nav>
      </div>
    }>
      {tab === 'usage' && (depth ? <UsageTab d={depth} name={c.name} kinds={m.kinds} sizes={m.sizes} /> : <LegacyUsage c={c} />)}

      {tab === 'style' && (
        <>
          <StyleTab name={c.name} kinds={m.kinds} sizes={m.sizes} backdrops={<Backdrops c={c} />} />
          <Section id="why" title="Why it looks and moves like this"><Reasons name={c.name} /></Section>
          <Section id="css" title="CSS API" wide>
            <p className="muted">Custom properties this component reads, parsed from its CSS module at build time, with the CSS property each one drives.</p>
            <TokensUsed component={c.name} />
          </Section>
        </>
      )}

      {tab === 'code' && (
        <>
          <Section id="import" title="Import and use">
            <Code label="Install">{`npm install ${PACKAGES.react}`}</Code>
            <Code label="Import">{c.importLine}</Code>
            <Code label="Usage">{c.usage}</Code>
          </Section>
          <Section id="hero" title="In use" wide>
            <p>{c.hero.intro}</p>
            <Example title={c.hero.title} code={c.hero.code} plain={c.hero.plain} backdrop={c.hero.backdrop}><c.hero.Render /></Example>
          </Section>
          <Section id="demos" title="Variants, states and compositions" wide>
            <p className="muted">{demos} demos on this tab; the content-model floor for {c.name} is {m.demoFloor} ({m.variantCount} variant dimension{m.variantCount === 1 ? '' : 's'}{m.variantDimensions.length ? `: ${m.variantDimensions.join(', ')}` : ''} + 3), computed from its TypeScript props.</p>
            {c.ladder.map((ex) => (
              <div key={ex.file} className="ladder-step">
                <h3>{ex.title}</h3>
                <p>{ex.intro}</p>
                <Example title={ex.title} code={ex.code} plain={ex.plain} backdrop={ex.backdrop}><ex.Render /></Example>
              </div>
            ))}
          </Section>
          <Section id="api" title="Props" wide><GeneratedProps m={m} inherits={c.inherits} /></Section>
        </>
      )}

      {tab === 'accessibility' && (
        <>
          <Section id="a11y-provides" title="What the system provides">
            <ul>{c.a11y.map((x) => <li key={x}>{x}</li>)}</ul>
          </Section>
          <Section id="a11y-duties" title="What you still have to do">
            <ul className="checklist" data-a11y-duties="">{c.youMust.map((x) => <li key={x}>{x}</li>)}</ul>
          </Section>
          {c.keyboard && <Section id="keyboard" title="Keyboard"><VerifiedKeyboard rows={c.keyboard} /></Section>}
          <Section id="tested" title="How it is tested">
            <p>Automated checks run on every build. Screen reader passes with VoiceOver and NVDA have not been recorded yet, which is why no component is marked Stable.</p>
            <p className="muted">Executed against this built site in real Chromium by <code>tooling/conformance.mjs</code>.</p>
            <ConformanceList component={c.name} />
          </Section>
          <Section id="evidence" title="Measured contrast" wide>
            <p className="muted">Each text node of this component on the test page, scored at its worst pixel on every backdrop and in every mode.</p>
            <EvidenceTable groups={EVIDENCE_GROUPS[c.name] ?? []} />
          </Section>
          <Section id="limitations" title="Limitations">
            <ul data-limitations="">{c.limitations.map((x) => <li key={x}>{x}</li>)}</ul>
          </Section>
          <Section id="history" title="Change history">
            <div className="table-wrap" data-history="">
              <table>
                <thead><tr><th scope="col">Version</th><th scope="col">Date</th><th scope="col">Change</th></tr></thead>
                <tbody>{HISTORY.filter((h) => h.component === c.name).map((h) => <tr key={h.text}><th scope="row">{h.version}</th><td>{h.date}</td><td>{inline(h.text)}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="muted small">The source is <code>{m.source}</code> and its styles are in <code>{m.source.replace('.tsx', '.module.css')}</code>.</p>
          </Section>
        </>
      )}
    </Page>
  );
}
