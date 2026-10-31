// Style tab (component-depth.md S1–S5). The subjects below are what tooling/kiln/spec-capture.mjs
// measures; the tables are its output (public/specs.json), so a token change reaches this tab with no
// edit here. A value with no token is shown as a gap, because a raw value in a component is a bug.
import type { ReactNode } from 'react';
import { Stage } from '../book/kit';
import { BareHost, OnSurface, SUBJECTS } from './subjects';

const Wrap = ({ bare, children }: { bare?: boolean | 'layout'; children: ReactNode }) => (bare ? <div className="demo-row spec-row" data-bare={bare === 'layout' ? 'layout' : 'surface'}>{children}</div> : <OnSurface>{children}</OnSurface>);

type Cell = { value: string; token: string | null };
type Target = { key: string; theme: string | null; states: Record<string, Record<string, Cell>> };
type Spec = { generatedAt: string; components: Record<string, { targets: Target[]; motion: Record<string, { duration: Cell; easing: Cell }> }> };

const FILES = import.meta.glob('../../public/specs.json', { eager: true, import: 'default' }) as Record<string, Spec>;
const SPEC = FILES['../../public/specs.json'] ?? null;

const THEMES = ['dark', 'light'] as const;
const STATE_LABEL: Record<string, string> = { default: 'Default', hover: 'Hover', active: 'Pressed', 'focus-visible': 'Focus', disabled: 'Disabled' };

/** Every combination of the enum props, as "prop=option;prop=option" keys. */
export function combos(kinds: Record<string, string[]>, sizes: string[]) {
  const dims: Array<[string, string[]]> = [...Object.entries(kinds), ...(sizes.length ? [['size', sizes] as [string, string[]]] : [])];
  return dims.reduce<Array<Record<string, string>>>((acc, [k, opts]) => acc.flatMap((a) => opts.map((o) => ({ ...a, [k]: o }))), [{}]);
}
const keyOf = (p: Record<string, string>) => Object.entries(p).map(([k, v]) => `${k}=${v}`).join(';') || 'default';

// unset is not a value the component chose (no shadow, no fill, no minimum), so it gets no data-value
const UNSET = new Set(['', 'none', '0px', 'rgba(0, 0, 0, 0)', 'transparent', 'normal', 'auto', '0s', '1']);
const V = ({ c }: { c?: Cell }) => !c || UNSET.has(c.value) ? <td className="muted">none</td> : (
  <td data-value={c.value} data-token={c.token ?? undefined}>{c.token ? <><code>{c.token.replace(/^--ds-/, '')}</code><br /><span className="muted small">{c.value}</span></> : <><span className="fail">no token</span> <span className="muted small">{c.value}</span></>}</td>
);

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: Array<[string, ...Array<Cell | undefined>]> }) {
  return (
    <div className="table-wrap" data-spec="">
      <table>
        <caption>{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map(([label, ...cells]) => <tr key={label}><th scope="row">{label}</th>{cells.map((c, i) => <V key={i} c={c} />)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function StyleTab({ name, kinds, sizes, backdrops }: { name: string; kinds: Record<string, string[]>; sizes: string[]; backdrops: ReactNode }) {
  const subject = SUBJECTS[name];
  const all = combos(kinds, sizes);
  const spec = SPEC?.components[name];
  const find = (key: string, theme: string, twin = false) => spec?.targets.find((t) => t.key === (twin ? `${key};disabled` : key) && t.theme === theme);
  const kindKeys = combos(kinds, []);
  const sizeKeys = sizes.map((s) => ({ ...(kindKeys[0] ?? {}), size: s }));
  return (
    <>
      <section className="book-section wide" aria-labelledby="s0-h">
        <div className="prose">
          <h2 id="s0-h" className="flush">What is measured</h2>
          <p>Every value on this tab is read from the built component in a real browser by <code>spec-capture.mjs</code>. It forces each state through Chrome DevTools, reads the computed style, and names the token that produced the value in that theme. {SPEC ? <>Last captured {SPEC.generatedAt.slice(0, 10)}.</> : <span className="fail">Not captured yet. Run the spec capture.</span>}</p>
          {subject ? THEMES.map((th) => (
            <div key={th} className="spec-subjects">
              <p className="eyebrow flush">{th} theme</p>
              <div data-spec-theme={th} data-theme={th}><Stage><Wrap bare={subject.bare}>
                {all.map((p) => <span key={keyOf(p)} className="spec-cell" data-spec-target={keyOf(p)}>{subject.render(p)}</span>)}
                {subject.disabled && kindKeys.map((p) => { const k = { ...p, ...(sizes.length ? { size: sizes.at(-1)! } : {}) }; return <span key={`${keyOf(k)}-d`} className="spec-cell" data-spec-target={`${keyOf(k)};disabled`} data-spec-disabled="">{subject.render(k, true)}</span>; })}
              </Wrap></Stage></div>
            </div>
          )) : <p className="fail">No subject defined for {name} in depth/subjects.tsx.</p>}
        </div>
      </section>

      <section className="book-section wide" aria-labelledby="s1-h">
        <div className="prose">
          <h2 id="s1-h" className="flush">Colour</h2>
          <p>Fill, text, border and shadow for each state, in each theme. Pressed is shown while held and focus while reached by keyboard.</p>
          {THEMES.flatMap((th) => kindKeys.map((p) => {
            const k = keyOf({ ...p, ...(sizes.length ? { size: sizes.at(-1)! } : {}) });
            const t = find(k, th); const d = subject?.disabled ? find(k, th, true) : undefined;
            const states = { ...(t?.states ?? {}), ...(d ? { disabled: d.states.disabled } : {}) };
            return (
              <div key={`${th}-${k}`}>
                <h3>{Object.values(p).join(' · ') || name} · {th}</h3>
                <Table caption={`${name} ${k} in the ${th} theme`} head={['State', 'Fill', 'Text', 'Border', 'Shadow']}
                  rows={Object.entries(states).map(([s, v]) => [STATE_LABEL[s] ?? s, v['background-color'], v.color, v['border-top-color'], v['box-shadow']])} />
              </div>
            );
          }))}
        </div>
      </section>

      <section className="book-section wide" aria-labelledby="s2-h">
        <div className="prose">
          <h2 id="s2-h" className="flush">Typography</h2>
          <Table caption={`${name} type per size`} head={['Size', 'Font size', 'Weight', 'Line height']}
            rows={(sizes.length ? sizeKeys : [kindKeys[0] ?? {}]).map((p) => { const v = find(keyOf(p), 'dark')?.states.default ?? {}; return [p.size ?? 'default', v['font-size'], v['font-weight'], v['line-height']]; })} />
        </div>
      </section>

      <section className="book-section wide" aria-labelledby="s3-h">
        <div className="prose">
          <h2 id="s3-h" className="flush">Structure and spacing</h2>
          <p>Measured from the DOM per size. The redline shows the same numbers on the live component.</p>
          <Table caption={`${name} structure per size`} head={['Size', 'Height', 'Inline padding', 'Gap', 'Radius', 'Icon']}
            rows={(sizes.length ? sizeKeys : [kindKeys[0] ?? {}]).map((p) => { const v = find(keyOf(p), 'dark')?.states.default ?? {}; return [p.size ?? 'default', v['min-height']?.value && v['min-height'].value !== '0px' ? v['min-height'] : v.height, v['padding-inline-start'], v['column-gap'], v['border-top-left-radius'], v['icon-size']]; })} />
          {subject && <div className="redlines">{(sizes.length ? sizeKeys : [kindKeys[0] ?? {}]).map((p) => { const v = find(keyOf(p), 'dark')?.states.default ?? {}; return (
            <figure key={keyOf(p)} className="redline" data-example="">
              <Stage backdrop="field"><div className="redline-host">{subject.bare ? <BareHost bare={subject.bare}>{subject.render(p)}</BareHost> : <OnSurface>{subject.render(p)}</OnSurface>}
                <span className="rl rl-h" aria-hidden="true">{v['min-height']?.value !== '0px' ? v['min-height']?.value : v.height?.value}</span>
                <span className="rl rl-p" aria-hidden="true">{v['padding-inline-start']?.value}</span>
              </div></Stage>
              <figcaption>{p.size ?? name}: height {v['min-height']?.value !== '0px' ? v['min-height']?.value : v.height?.value}, padding {v['padding-inline-start']?.value}, radius {v['border-top-left-radius']?.value}</figcaption>
            </figure>
          ); })}</div>}
        </div>
      </section>

      <section className="book-section wide" aria-labelledby="s4-h">
        <div className="prose">
          <h2 id="s4-h" className="flush">Motion</h2>
          {spec && Object.keys(spec.motion).length ? (
            <div className="table-wrap" data-spec=""><table><caption>{name} transitions, read with motion on</caption>
              <thead><tr><th scope="col">Property</th><th scope="col">Duration</th><th scope="col">Easing</th></tr></thead>
              <tbody>{Object.entries(spec.motion).map(([prop, m]) => <tr key={prop}><th scope="row"><code>{prop}</code></th><V c={m.duration} /><V c={m.easing} /></tr>)}</tbody></table></div>
          ) : <p className="muted">{name} has no transitions of its own.</p>}
          <p className="muted small">Under reduced motion every duration token is zero, so all of these become instant.</p>
        </div>
      </section>

      <section id="backdrops" className="book-section wide" aria-labelledby="s5-h">
        <div className="prose">
          <h2 id="s5-h" className="flush">On bright and dark backdrops</h2>
          {backdrops}
        </div>
      </section>
    </>
  );
}
