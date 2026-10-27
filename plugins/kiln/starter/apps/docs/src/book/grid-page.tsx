// Grid & layout (kiln docs engine). The generated half of the page: an annotated anatomy per breakpoint,
// the breakpoint table, a span gallery on the real Grid and a playground, all read from the tokens. The
// written half, one section per topic in benchmarks/topics/grid.json, is the system's
// (system/foundation-extras.tsx), mapped in system/benchmark-coverage.json (gate G-BT1).
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Grid, GridItem } from 'kiln-ds-react';
import { Code, Example, Page, Section, Stage, TOKENS, TokenTable } from './kit';
import GridBasic from '../examples/GridBasic';
import GridBasicSrc from '../examples/GridBasic.tsx?raw';
import { GridPlayground } from './playgrounds';
import { Choice } from '../system/controls';
import { CONTENT, PACKAGES } from '../system/content';

const px = (p: string) => parseFloat(String(TOKENS[p].value));
const at = (p: string, bp: 'base' | 'md' | 'lg') => (bp === 'base' ? TOKENS[p].value : TOKENS[p].breakpoints?.[bp]?.value ?? TOKENS[p].value);
type BP = { id: 'base' | 'md' | 'lg'; label: string; min: number; sample: number; columns: number; gutter: number; margin: number };
export const BPS: BP[] = (['base', 'md', 'lg'] as const).map((id) => ({
  id,
  label: id === 'base' ? 'Phone' : id === 'md' ? 'Tablet' : 'Desktop',
  min: id === 'base' ? 0 : px(`viewport.${id}`),
  sample: id === 'base' ? 390 : id === 'md' ? 834 : 1280,
  columns: Number(at('layout.columns', id)),
  gutter: parseFloat(String(at('layout.gutter', id))),
  margin: parseFloat(String(at('layout.margin', id))),
}));
const colWidth = (b: BP, w = b.sample) => (w - b.margin * 2 - b.gutter * (b.columns - 1)) / b.columns;

// ---------- annotated anatomy, drawn from the tokens at a breakpoint's sample width ----------
function Anatomy({ bp, labels = true, children }: { bp: BP; labels?: boolean; children?: ReactNode }) {
  const scale = 640 / Math.max(640, bp.sample);
  const frame: CSSProperties = { inlineSize: bp.sample * scale, '--m': `${bp.margin * scale}px`, '--g': `${bp.gutter * scale}px`, '--c': bp.columns } as CSSProperties;
  return (
    <figure className="gx-figure">
      <div className="gx-frame" data-graphic-ground="" style={frame} role="img" aria-label={`${bp.label} grid: ${bp.columns} columns, ${bp.gutter}px gutters, ${bp.margin}px margins at ${bp.sample}px wide`}>
        <span className="gx-margin start" data-graphic="margin" /><span className="gx-margin end" data-graphic="margin" />
        <div className="gx-cols">{Array.from({ length: bp.columns }, (_, i) => <span key={i} className="gx-col" data-graphic="column" />)}</div>
        {children && <div className="gx-content">{children}</div>}
        {labels && <>
          {/* 1 over the third column, 2 over the gutter after the sixth, 3 over the end margin */}
          <span className="gx-callout" style={{ insetInlineStart: `calc(var(--m) + ((100% - var(--m) * 2 - var(--g) * (var(--c) - 1)) / var(--c) + var(--g)) * 2 + (100% - var(--m) * 2 - var(--g) * (var(--c) - 1)) / var(--c) / 2)` }}>1</span>
          <span className="gx-callout" style={{ insetInlineStart: `calc(var(--m) + ((100% - var(--m) * 2 - var(--g) * (var(--c) - 1)) / var(--c) + var(--g)) * ${Math.ceil(bp.columns / 2)} - var(--g) / 2)` }}>2</span>
          <span className="gx-callout" style={{ insetInlineStart: `calc(100% - var(--m) / 2)` }}>3</span>
        </>}
      </div>
      {labels && <figcaption><ol className="gx-legend flush"><li><b>Columns</b> hold content. {bp.columns} at {bp.label.toLowerCase()} width, each about {Math.round(colWidth(bp))}px at {bp.sample}px.</li><li><b>Gutters</b> ({bp.gutter}px) separate what sits in the columns.</li><li><b>Margins</b> ({bp.margin}px) keep content off the screen edge.</li></ol></figcaption>}
    </figure>
  );
}

function AnatomyPicker() {
  const [id, setId] = useState<BP['id']>('lg');
  const bp = BPS.find((b) => b.id === id)!;
  return (
    <div className="gx-anatomy">
      <div className="gx-pick"><Choice label="Breakpoint" value={id} onChange={(v) => setId(v as BP['id'])} options={BPS.map((b) => [b.id, `${b.label} · ${b.columns} columns`] as [BP['id'], string])} /></div>
      <Stage className="gx-stage" backdrop="field"><Anatomy bp={bp} /></Stage>
    </div>
  );
}

// ---------- span gallery: real Grid + GridItem at 12 columns ----------
const SPLITS: Array<[string, number[], number?]> = [
  ['Full', [12]], ['Halves', [6, 6]], ['Thirds', [4, 4, 4]], ['Quarters', [3, 3, 3, 3]],
  ['Main and side', [8, 4]], ['Wide main', [9, 3]], ['Centred reading column', [8], 2],
];
function SpanGallery() {
  return (
    <Stage className="gx-stage" backdrop="field">
      <div className="gx-spans">
        {SPLITS.map(([name, spans, offset]) => (
          <div key={name} className="gx-span-row">
            <span className="gx-span-name">{name}</span>
            <Grid columns={12} className="gx-span-grid">
              {spans.map((s, i) => <GridItem key={i} span={s} style={offset && i === 0 ? { gridColumn: `${offset + 1} / span ${s}` } : undefined}><div className="gx-cell"><span>{s} / 12</span></div></GridItem>)}
            </Grid>
          </div>
        ))}
      </div>
    </Stage>
  );
}

export function GridLayoutPage() {
  return (
    <Page eyebrow="Foundations" title="Grid & layout" lede={<p>{CONTENT.foundations.grid.lede}</p>}>
      <Section id="anatomy" title="Anatomy" wide>
        <p>Columns, gutters and margins at each breakpoint, drawn from the layout tokens at a typical width for that breakpoint.</p>
        <AnatomyPicker />
      </Section>
      <Section id="breakpoints" title="Breakpoints" wide>
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">Breakpoint</th><th scope="col">From</th><th scope="col">Columns</th><th scope="col">Gutter</th><th scope="col">Margin</th><th scope="col">Column width</th></tr></thead>
            <tbody>{BPS.map((b) => <tr key={b.id}><th scope="row">{b.label}</th><td>{b.min}px</td><td>{b.columns}</td><td>{b.gutter}px</td><td>{b.margin}px</td><td>{Math.round(colWidth(b))}px at {b.sample}px</td></tr>)}</tbody>
          </table>
        </div>
      </Section>
      <Section id="spans" title="Common spans" wide>
        <p>The splits that come up most, drawn with the real Grid and GridItem at 12 columns.</p>
        <SpanGallery />
      </Section>
      <Section id="demos" title="Try it" wide>
        <Example title="Column count follows the screen" code={GridBasicSrc} plain backdrop="field"><GridBasic /></Example>
        <GridPlayground />
      </Section>
      <Section id="tokens" title="Layout tokens">
        <TokenTable prefix="layout." />
        <TokenTable prefix="grid." />
        <TokenTable prefix="container." />
      </Section>
      <Section id="tools" title="In code and in design tools">
        <Code label="React">{`import { Container, Grid, GridItem } from '${PACKAGES.react}';\n\n<Container size="xl">\n  <Grid>\n    <GridItem span="full" lg={8}>…</GridItem>\n    <GridItem span="full" lg={4}>…</GridItem>\n  </Grid>\n</Container>`}</Code>
        <p>In a design tool, set a layout grid with the column count, gutter and margin from the breakpoint table for each frame width you draw.</p>
      </Section>
    </Page>
  );
}
