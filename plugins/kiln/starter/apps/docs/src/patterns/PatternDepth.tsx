// Pattern pages (docs-engine component-depth.md, Site breadth): each one is the problem, the anatomy of
// the solution, a live composed example, its variations, rendered do/don't pairs and the components it
// uses. A pattern that needs a component Pane does not have yet says so in `gap` instead of faking it.
import type { ReactNode } from 'react';
import { Link, Page, Section, Stage } from '../book/kit';
import { PairView } from '../depth/UsageTab';
import type { Pair } from '../depth/types';

export interface PatternDepth {
  title: string;
  lede: string;
  problem: ReactNode;
  anatomy: Array<[string, string]>;
  example: { title: string; render: ReactNode };
  variations: Array<{ title: string; text: string; render: ReactNode }>;
  pairs: Pair[];
  gap?: string;
  related: Array<[string, string, string]>;
}

export function PatternDepthPage({ p }: { p: PatternDepth }) {
  return (
    <Page eyebrow="Patterns" title={p.title} lede={<p>{p.lede}</p>}>
      <Section id="problem" title="The problem">{p.problem}{p.gap && <p className="muted" data-pattern-gap="">{p.gap}</p>}</Section>
      <Section id="anatomy" title="Anatomy of the solution">
        <ol className="anatomy">{p.anatomy.map(([part, what]) => <li key={part}><b>{part}.</b> {what}</li>)}</ol>
      </Section>
      <Section id="example" title="Live example" wide>
        <figure className="in-context" data-example=""><Stage>{p.example.render}</Stage><figcaption>{p.example.title}</figcaption></figure>
      </Section>
      <Section id="variations" title="Variations" wide>
        {p.variations.map((v) => (
          <div key={v.title} className="modifier">
            <h3>{v.title}</h3>
            <p>{v.text}</p>
            <figure className="in-context" data-example=""><Stage>{v.render}</Stage><figcaption>{v.title}</figcaption></figure>
          </div>
        ))}
      </Section>
      <Section id="dodont" title="Do and don’t" wide>{p.pairs.map((pair, i) => <PairView key={i} pair={pair} />)}</Section>
      <Section id="related" title="Components it uses">
        <div className="table-wrap"><table><thead><tr><th scope="col">Component</th><th scope="col">Its job here</th></tr></thead>
          <tbody>{p.related.map(([to, label, why]) => <tr key={label}><th scope="row"><Link to={to}>{label}</Link></th><td>{why}</td></tr>)}</tbody></table></div>
      </Section>
    </Page>
  );
}
