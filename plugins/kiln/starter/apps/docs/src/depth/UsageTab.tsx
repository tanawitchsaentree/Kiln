// Usage tab: renders a Depth object as sections U2–U14 (U1 is the live demo in the shared header).
// Markers follow docs-engine page-contract.md so kiln's G-K gates can read the page. Tables of
// options are driven by meta.json: an option with no row here renders as a visible gap.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Section, Stage } from '../book/kit';
import { isNA, type Depth, type NotApplicable, type Pair } from './types';

function NA({ id, title, why }: { id: string; title: string; why: NotApplicable }) {
  return <Section id={id} title={title}><div data-registry={id.toUpperCase()} data-na={why.na}><p className="muted">Not applicable. {why.na}</p></div></Section>;
}

export function PairView({ pair }: { pair: Pair }) {
  return (
    <div className="gx-pair-row live-pair">
      <figure className="gx-pair-cell" data-do=""><Stage className="pair-stage">{pair.do}</Stage><figcaption><b>Do.</b> {pair.doNote}</figcaption></figure>
      <figure className="gx-pair-cell" data-dont=""><Stage className="pair-stage">{pair.dont}</Stage><figcaption><b>Don’t.</b> {pair.dontNote}</figcaption></figure>
    </div>
  );
}

/** Numbered callouts measured off the live component, so the component itself carries no docs hooks. */
function Anatomy({ render, parts }: { render: ReactNode; parts: Depth['anatomy']['parts'] }) {
  const box = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState<Array<{ n: number; x: number; y: number; from: number; fromY: number } | null>>([]);
  useLayoutEffect(() => {
    const measure = () => {
      const host = box.current; if (!host) return;
      const o = host.getBoundingClientRect();
      // marks stand in a lane past the component's inline end, each on a leader to its part, so no mark
      // ever covers the content it names; parts at the same height fan out vertically
      const root = host.firstElementChild?.getBoundingClientRect(); if (!root) return;
      const lane = root.right - o.left + 40;
      const found = parts.map((p) => host.querySelector(p.selector)?.getBoundingClientRect() ?? null);
      const ys = found.map((r) => (r ? r.top + r.height / 2 - o.top : 0));
      const order = ys.map((y, i) => [y, i] as const).sort((a, b) => a[0] - b[0]).map(([, i]) => i);
      const placed: number[] = [];
      for (const i of order) placed[i] = Math.max(ys[i], (placed.length ? Math.max(...placed.filter((v) => v != null)) : -Infinity) + 28);
      // leaders start at the component's edge, so a line never crosses the content it points past
      setMarks(found.map((r, i) => (r ? { n: i + 1, x: lane, y: placed[i], from: root.right - o.left + 4, fromY: ys[i] } : null)));
    };
    measure();
    const ro = new ResizeObserver(measure); if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [parts]);
  return (
    <figure className="anatomy-figure" data-example="">
      <Stage className="anatomy-stage"><div ref={box} className="anatomy-host">{render}{marks.map((m) => m && <span key={m.n} aria-hidden="true"><svg className="anatomy-lead" style={{ insetInlineStart: 0, insetBlockStart: 0 }} width="100%" height="100%"><path d={`M${m.from} ${m.fromY} H${m.x - 20} L${m.x - 12} ${m.y}`} /></svg><span className="anatomy-mark" style={{ insetInlineStart: m.x, insetBlockStart: m.y }}>{m.n}</span></span>)}</div></Stage>
      <ol className="anatomy-legend">{parts.map((p) => <li key={p.part}><b>{p.part}.</b> {p.what}</li>)}</ol>
    </figure>
  );
}

const Rows = ({ id, options, rows, cols }: { id: string; options: string[]; rows: Record<string, [string, string]>; cols: [string, string, string] }) => (
  <div className="table-wrap">
    <table>
      <thead><tr>{cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
      <tbody>{options.map((o) => <tr key={o} data-option={o}><th scope="row"><code>{o}</code></th>{rows[o] ? <><td>{rows[o][0]}</td><td>{rows[o][1]}</td></> : <td colSpan={2} className="fail">No guidance written for {o} ({id}).</td>}</tr>)}</tbody>
    </table>
  </div>
);

export function UsageTab({ d, name, kinds, sizes }: { d: Depth; name: string; kinds: Record<string, string[]>; sizes: string[] }) {
  const kindOptions = Object.values(kinds).flat();
  const kindProp = Object.keys(kinds)[0];
  return (
    <>
      <Section id="u2" title="Overview"><div data-registry="U2">{d.overview}</div></Section>

      <Section id="u3" title="When to use it">
        <div data-registry="U3">
          <h3>Use {name} for</h3>
          <ul>{d.whenToUse.map((w) => <li key={w}>{w}</li>)}</ul>
          <h3>Use something else when</h3>
          <div className="table-wrap"><table><thead><tr><th scope="col">The situation</th><th scope="col">Use instead</th></tr></thead>
            <tbody>{d.whenNot.map((w) => <tr key={w.situation}><th scope="row">{w.situation}</th><td><Link to={w.to}>{w.label}</Link></td></tr>)}</tbody></table></div>
        </div>
      </Section>

      {isNA(d.variants) ? <NA id="u4" title="Variants" why={d.variants} /> : (
        <Section id="u4" title="Variants">
          <div data-registry="U4">
            <p>Every option of the <code>{kindProp}</code> prop, read from the TypeScript source, with what it is for and what it may sit next to.</p>
            <Rows id="U4" options={kindOptions} rows={Object.fromEntries(Object.entries(d.variants).map(([k, v]) => [k, [v.purpose, v.pairing]]))} cols={['Option', 'Purpose', 'Pairing rule']} />
          </div>
        </Section>
      )}

      <Section id="u5" title="Anatomy" wide>
        <div data-registry="U5">
          <Anatomy render={d.anatomy.render} parts={d.anatomy.parts} />
          {d.anatomy.perVariant && <p>{d.anatomy.perVariant}</p>}
        </div>
      </Section>

      {isNA(d.sizes) ? <NA id="u6" title="Sizes" why={d.sizes} /> : (
        <Section id="u6" title="Sizes">
          <div data-registry="U6">
            <Rows id="U6" options={sizes} rows={Object.fromEntries(Object.entries(d.sizes).map(([k, v]) => [k, [v.use, v.pairs]]))} cols={['Size', 'Use it for', 'Pairs with']} />
          </div>
        </Section>
      )}

      {isNA(d.emphasis) ? <NA id="u7" title="Emphasis and hierarchy" why={d.emphasis} /> : (
        <Section id="u7" title="Emphasis and hierarchy" wide><div data-registry="U7">{d.emphasis.text}<PairView pair={d.emphasis.pair} /></div></Section>
      )}

      {isNA(d.placement) ? <NA id="u8" title="Placement and alignment" why={d.placement} /> : (
        <Section id="u8" title="Placement and alignment" wide>
          <div data-registry="U8">
            <div className="table-wrap"><table><thead><tr><th scope="col">Placement</th><th scope="col">Use it when</th></tr></thead>
              <tbody>{d.placement.rows.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table></div>
            <div className="in-context-grid">{d.placement.examples.map((e) => <figure key={e.title} className="in-context" data-example=""><Stage>{e.render}</Stage><figcaption>{e.title}</figcaption></figure>)}</div>
          </div>
        </Section>
      )}

      {isNA(d.combinations) ? <NA id="u9" title="Combinations" why={d.combinations} /> : (
        <Section id="u9" title="Combinations" wide>
          <div data-registry="U9">
            <h3>Recommended</h3>
            <div className="table-wrap"><table><thead><tr><th scope="col">Combination</th><th scope="col">When</th></tr></thead>
              <tbody>{d.combinations.good.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table></div>
            <h3>Avoid</h3>
            <div className="in-context-grid">{d.combinations.avoid.map((a) => <figure key={a.title} className="in-context" data-dont=""><Stage>{a.render}</Stage><figcaption><b>Avoid {a.title}.</b> {a.why}</figcaption></figure>)}</div>
          </div>
        </Section>
      )}

      {isNA(d.content) ? <NA id="u10" title="Content" why={d.content} /> : (
        <Section id="u10" title="Content" wide>
          <div data-registry="U10">
            {d.content.formula}
            <PairView pair={d.content.pair} />
            <h3>Long labels</h3><p>{d.content.overflow.text}</p><Stage className="narrow-stage">{d.content.overflow.render}</Stage>
            <h3>Right-to-left</h3><p>{d.content.rtl.text}</p><Stage>{d.content.rtl.render}</Stage>
            <h3>Text expansion</h3><p>{d.content.expansion.text}</p><Stage>{d.content.expansion.render}</Stage>
          </div>
        </Section>
      )}

      <Section id="u11" title="Behaviours">
        <div data-registry="U11">
          <h3>States</h3>
          <div className="table-wrap"><table><thead><tr><th scope="col">State</th><th scope="col">What it does</th><th scope="col">Why</th></tr></thead>
            <tbody>{d.behaviours.states.map(([s, a, b]) => <tr key={s}><th scope="row">{s}</th><td>{a}</td><td>{b}</td></tr>)}</tbody></table></div>
          <h3>Mouse, keyboard and touch</h3>
          <div className="table-wrap"><table><thead><tr><th scope="col">Input</th><th scope="col">Gesture</th><th scope="col">Result</th><th scope="col">Proven by</th></tr></thead>
            <tbody>{d.behaviours.interactions.map(([i, g, r, p]) => <tr key={i + g}><th scope="row">{i}</th><td><kbd>{g}</kbd></td><td>{r}</td><td className="muted small">{p.replace(/^\w+: /, '')}</td></tr>)}</tbody></table></div>
          <h3>Loading and feedback</h3>{d.behaviours.loading}
          <h3>Default focus</h3>{d.behaviours.focus}
        </div>
      </Section>

      {isNA(d.deepDive) ? <NA id="u12" title="Each variant in depth" why={d.deepDive} /> : (
        <Section id="u12" title="Each variant in depth" wide>
          <div data-registry="U12">
            {kindOptions.map((o) => { const v = (d.deepDive as Exclude<Depth['deepDive'], NotApplicable>)[o]; return v ? (
              <div key={o} className="deep-dive" data-deep-dive={o}>
                <h3><code>{o}</code></h3>
                {v.purpose}
                <figure className="in-context" data-in-context=""><Stage>{v.context}</Stage><figcaption>{o} in a real layout</figcaption></figure>
                <h4>Best practices</h4>
                <ul>{v.practices.map((p) => <li key={p}>{p}</li>)}</ul>
                <PairView pair={v.pair} />
              </div>
            ) : <p key={o} className="fail" data-deep-dive={o}>No deep dive written for {o}.</p>; })}
          </div>
        </Section>
      )}

      {isNA(d.modifiers) ? <NA id="u13" title="Modifiers" why={d.modifiers} /> : (
        <Section id="u13" title="Modifiers" wide>
          <div data-registry="U13">{d.modifiers.map((m) => <div key={m.name} className="modifier"><h3>{m.name}</h3>{m.rules}<PairView pair={m.pair} /></div>)}</div>
        </Section>
      )}

      <Section id="u14" title="Related and references">
        <div data-registry="U14">
          <h3>Related</h3>
          <div className="table-wrap"><table><thead><tr><th scope="col">See</th><th scope="col">Choose it instead when</th></tr></thead>
            <tbody>{d.related.map(([to, label, why]) => <tr key={to}><th scope="row"><Link to={to}>{label}</Link></th><td>{why}</td></tr>)}</tbody></table></div>
          <h3>References</h3>
          <ul>{d.references.map((r) => <li key={r.url}><a href={r.url} data-reference="" rel="noreferrer">{r.title}</a>. {r.why}</li>)}</ul>
          <h3>Feedback</h3>
          <p>To report a mistake or a gap on this tab, open an issue that names <code>apps/docs/src/depth/{name.toLowerCase()}.tsx</code>. That one file holds everything written here.</p>
        </div>
      </Section>
    </>
  );
}
