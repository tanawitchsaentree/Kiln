// Foundation playgrounds (USER-STANDARDS #6, docs-engine G-F1). Each one has real controls that change
// a live preview and a copy-ready snippet of the current setting. Values come from the token JSON, so a
// playground never offers a number the system doesn't have. Previews are token-drawn specimens, so they
// work before the system has components; controls come from system/controls.tsx, which must become the
// system's own Select and Slider (G-N1) during wave 1.
import { useMemo, useState, type ReactElement, type ReactNode } from 'react';
import * as Icons from '../icons';
import { Range, Choice } from '../system/controls';
import { CodeBlock, Fact, Stage, TOKENS } from './kit';

const byPrefix = (pre: string) => Object.entries(TOKENS).filter(([p]) => p.startsWith(pre));
const Select = Choice;
const Specimen = ({ children, style, className = '' }: { children: ReactNode; style?: React.CSSProperties; className?: string }) => <div className={`specimen ${className}`} style={style}>{children}</div>;

function Playground({ title, controls, preview, code, note, bare, backdrop }: { title: string; controls: ReactNode; preview: ReactNode; code: string; note?: ReactNode; bare?: boolean; backdrop?: 'scene' | 'field' }) {
  return (
    <div className="playground" data-playground="">
      <p className="flush pg-title">{title}</p>
      <div className="pg-body">
        <div className="pg-controls" data-controls="">{controls}</div>
        <div className="pg-preview" data-preview="">{bare ? preview : <Stage className="pg-stage" backdrop={backdrop}>{preview}</Stage>}</div>
      </div>
      {note && <div className="pg-note">{note}</div>}
      <CodeBlock code={code} />
    </div>
  );
}

// ---------- WCAG maths for the estimates ----------
const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex = (h: string) => { const m = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16)); };
const alphaOf = (h: string) => (h.replace('#', '').length === 8 ? parseInt(h.replace('#', '').slice(6, 8), 16) / 255 : 1);

// ---------- Colour ----------
export function ContrastPlayground() {
  const solids = Object.entries(TOKENS).filter(([p, t]) => t.type === 'color' && t.tier === 'primitive' && alphaOf(String(t.value)) === 1);
  const [fg, setFg] = useState(solids[0]?.[0] ?? '');
  // start on the strongest pair, so the page opens on a passing example and the reader explores down from it
  const [bg, setBg] = useState(() => solids.reduce((best, [p, t]) => (solids[0] && ratio(hex(String(t.value)), hex(String(solids[0][1].value))) > ratio(hex(String(TOKENS[best]?.value ?? '#000000')), hex(String(solids[0][1].value))) ? p : best), solids[solids.length - 1]?.[0] ?? ''));
  if (!fg || !bg) return <p className="fail">No solid primitive colours to compare.</p>;
  const r = Math.round(ratio(hex(String(TOKENS[fg].value)), hex(String(TOKENS[bg].value))) * 100) / 100;
  return (
    <Playground
      title="Contrast between two solid colours"
      controls={<>
        <Select label="Text" value={fg} options={solids.map(([p]) => [p, p])} onChange={setFg} />
        <Select label="Fill" value={bg} options={solids.map(([p]) => [p, p])} onChange={setBg} />
      </>}
      preview={
        <div className="pg-swatch" style={{ background: `var(${TOKENS[bg].css})`, color: `var(${TOKENS[fg].css})` }}>
          <span className="pg-swatch-big">Aa</span>
          <span>{r}:1</span>
          <span className="pg-verdicts"><Fact>{r >= 4.5 ? 'AA text' : 'Fails AA text'}</Fact><Fact>{r >= 3 ? 'AA large / UI' : 'Fails 3:1'}</Fact></span>
        </div>
      }
      note={<p className="flush">Opaque pairs like these are computed. Anything over imagery or translucency is measured by the evidence run instead.</p>}
      code={`color: var(${TOKENS[fg].css});\nbackground: var(${TOKENS[bg].css});\n/* ${r}:1 */`}
    />
  );
}

// ---------- Typography ----------
export function TypePlayground() {
  const steps = ['display', 'headline', 'title', 'emphasis', 'body', 'label', 'caption', 'micro'];
  const [step, setStep] = useState('title');
  const [weight, setWeight] = useState('weight-semibold');
  const [leading, setLeading] = useState('leading-tight');
  const [text, setText] = useState('The quick brown fox jumps');
  return (
    <Playground
      title="Type tester"
      controls={<>
        <Select label="Size" value={step} options={steps.map((s) => [s, `${s} · ${TOKENS[`type.${s}`].value}`])} onChange={setStep} />
        <Select label="Weight" value={weight} options={['weight-regular', 'weight-medium', 'weight-semibold'].map((w) => [w, `${w.replace('weight-', '')} · ${TOKENS[`type.${w}`].value}`])} onChange={setWeight} />
        <Select label="Leading" value={leading} options={['leading-tight', 'leading-body'].map((l) => [l, `${l.replace('leading-', '')} · ${TOKENS[`type.${l}`].value}`])} onChange={setLeading} />
        <label className="pg-control"><span className="pg-label">Sample</span><input value={text} onChange={(e) => setText(e.target.value)} /></label>
      </>}
      preview={<Specimen><p className="flush" style={{ fontSize: `var(--ds-type-${step})`, fontWeight: `var(--ds-type-${weight})` as never, lineHeight: `var(--ds-type-${leading})` }}>{text}</p></Specimen>}
      code={`font-family: var(--ds-type-family);\nfont-size: var(--ds-type-${step});\nfont-weight: var(--ds-type-${weight});\nline-height: var(--ds-type-${leading});`}
    />
  );
}

// ---------- Spacing ----------
export function SpacingPlayground() {
  const gaps = byPrefix('gap.');
  const [gap, setGap] = useState('gap.2xl');
  const [count, setCount] = useState(4);
  const [row, setRow] = useState<'row' | 'column'>('row');
  const t = TOKENS[gap];
  return (
    <Playground
      title="Gap between items"
      controls={<>
        <Select label="Gap token" value={gap} options={gaps.map(([p, v]) => [p, `${p} · ${v.value}`])} onChange={setGap} />
        <Range label="Items" min={2} max={8} step={1} value={count} onChange={setCount} />
        <Select label="Direction" value={row} options={[['row', 'Row'], ['column', 'Column']]} onChange={setRow} />
      </>}
      preview={<Specimen><div style={{ display: 'flex', flexDirection: row, flexWrap: 'wrap', gap: `var(${t.css})` }}>{Array.from({ length: count }, (_, i) => <span key={i} className="pg-box">{i + 1}</span>)}</div></Specimen>}
      code={`<div style={{ display: 'flex', flexDirection: '${row}', gap: 'var(${t.css})' }}>…</div>\n/* ${t.value} */`}
    />
  );
}

// ---------- Grid ----------
export function GridPlayground() {
  const [cols, setCols] = useState(12);
  const [span, setSpan] = useState(4);
  const [gutter, setGutter] = useState('space.8');
  const g = TOKENS[gutter];
  const s = Math.min(span, cols);
  return (
    <Playground
      backdrop="field"
      title="Columns, gutter and span"
      controls={<>
        <Range label="Columns" min={1} max={12} step={1} value={cols} onChange={setCols} />
        <Range label="Highlighted span" min={1} max={12} step={1} value={span} onChange={setSpan} />
        <Select label="Gutter" value={gutter} options={['space.4', 'space.6', 'space.8'].map((p) => [p, `${p} · ${TOKENS[p].value}`])} onChange={setGutter} />
      </>}
      preview={
        <div className="pg-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: `var(${g.css})` }}>
          <div className="pg-cell on" style={{ gridColumn: `span ${s}` }}>span {s}</div>
          {Array.from({ length: Math.max(0, cols * 2 - s) }, (_, i) => <div key={i} className="pg-cell">{''}</div>)}
        </div>
      }
      code={`<Grid columns={${cols}}>\n  <GridItem span={${s}}>…</GridItem>\n</Grid>\n/* gutter: var(${g.css}) = ${g.value} */`}
    />
  );
}

// ---------- Shape ----------
export function ShapePlayground() {
  const corners = byPrefix('corner.');
  const elev = byPrefix('elevation.').filter(([p]) => !p.endsWith('halo'));
  const [corner, setCorner] = useState('corner.panel');
  const [shadow, setShadow] = useState('elevation.float');
  return (
    <Playground
      title="Corner and elevation"
      controls={<>
        <Select label="Corner" value={corner} options={corners.map(([p, t]) => [p, `${p} · ${t.value}`])} onChange={setCorner} />
        <Select label="Shadow" value={shadow} options={elev.map(([p]) => [p, p])} onChange={setShadow} />
      </>}
      preview={<Specimen className="pg-shape" style={{ borderRadius: `var(${TOKENS[corner].css})`, boxShadow: `var(${TOKENS[shadow].css})` }}>Surface</Specimen>}
      code={`border-radius: var(${TOKENS[corner].css});\nbox-shadow: var(${TOKENS[shadow].css});`}
    />
  );
}

// ---------- Motion ----------
export function MotionPlayground() {
  const durs = byPrefix('duration.').filter(([p]) => !p.endsWith('stagger'));
  const eases = byPrefix('easing.');
  const [dur, setDur] = useState('duration.slow');
  const [ease, setEase] = useState('easing.soft');
  const [on, setOn] = useState(false);
  const bez = String(TOKENS[ease].value).match(/[\d.]+/g)?.map(Number) ?? [0.2, 0, 0, 1];
  const path = `M0,100 C${bez[0] * 100},${100 - bez[1] * 100} ${bez[2] * 100},${100 - bez[3] * 100} 100,0`;
  return (
    <Playground
      title="Duration and easing"
      controls={<>
        <Select label="Duration" value={dur} options={durs.map(([p, t]) => [p, `${p} · ${t.value}`])} onChange={setDur} />
        <Select label="Easing" value={ease} options={eases.map(([p]) => [p, p])} onChange={setEase} />
        <button type="button" className="copy-btn" onClick={() => setOn(!on)}>Play</button>
      </>}
      preview={
        <div className="pg-motion">
          <svg viewBox="-4 -4 108 108" className="pg-curve" aria-label={`Easing curve ${String(TOKENS[ease].value)}`} role="img"><path d={path} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          <div className="pg-track"><span className="pg-dot" style={{ transform: on ? 'translateX(calc(100% * 6))' : 'none', transition: `transform var(${TOKENS[dur].css}) var(${TOKENS[ease].css})` }} /></div>
        </div>
      }
      note={<p className="flush">With reduced motion on, the dot jumps instead of sliding, because every duration token is 0ms.</p>}
      code={`transition: transform var(${TOKENS[dur].css}) var(${TOKENS[ease].css});\n/* ${TOKENS[dur].value}, ${String(TOKENS[ease].value)} */`}
    />
  );
}

// ---------- Icons ----------
export function IconBrowser() {
  const all = Object.entries(Icons).filter(([n]) => n.startsWith('Icon'));
  const [q, setQ] = useState('');
  const [size, setSize] = useState('control.icon-md');
  const [picked, setPicked] = useState(Object.keys(Icons).find((n) => n.startsWith('Icon')) ?? '');
  const list = useMemo(() => all.filter(([n]) => n.toLowerCase().includes(q.toLowerCase())), [q]);
  const P = (Icons as Record<string, (p: { className?: string; style?: object }) => ReactElement>)[picked];
  return (
    <Playground
      title="Icon browser"
      controls={<>
        <label className="pg-control"><span className="pg-label">Search</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="share, heart…" /></label>
        <Select label="Size" value={size} options={[['control.icon-sm', `small · ${TOKENS['control.icon-sm'].value}`], ['control.icon-md', `medium · ${TOKENS['control.icon-md'].value}`]]} onChange={setSize} />
      </>}
      preview={
        <ul className="pg-icons flush">
          {list.map(([n, I]) => { const C = I as (p: { style?: object }) => ReactElement; return <li key={n}><button type="button" className={n === picked ? 'pg-icon on' : 'pg-icon'} aria-pressed={n === picked} aria-label={n} onClick={() => setPicked(n)}><C style={{ inlineSize: `var(${TOKENS[size].css})`, blockSize: `var(${TOKENS[size].css})` }} /></button></li>; })}
        </ul>
      }
      note={<p className="flush">Selected {picked}. Click any icon to change the snippet below.</p>}
      code={`import { ${picked} } from './icons';\n<${picked} style={{ inlineSize: 'var(${TOKENS[size].css})', blockSize: 'var(${TOKENS[size].css})' }} />`}
    />
  );
}

// ---------- Dimensions ----------
export function TouchTargetPlayground() {
  const [show, setShow] = useState(true);
  const sizes = byPrefix('control.').filter(([p, t]) => /^\d/.test(String(t.value)) && !p.includes('icon'));
  return (
    <Playground
      title="Touch targets"
      controls={<Select label="Show hit areas" value={show ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => setShow(v === 'on')} />}
      preview={
        <Specimen className={show ? 'pg-targets on' : 'pg-targets'}>
          <div className="pg-target-row">{sizes.map(([p, t]) => <span key={p} className="pg-target-item"><span className="pg-target" style={{ blockSize: `var(${t.css})`, inlineSize: `var(${t.css})` }} title={p} /><span className="pg-target-label">{String(t.value)}</span></span>)}</div>
        </Specimen>
      }
      note={<p className="flush">The outline is {TOKENS['layout.touch']?.value ?? '44px'} square, centred on each control size. Anything smaller needs a larger press area.</p>}
      code={`min-block-size: var(--ds-layout-touch);\nmin-inline-size: var(--ds-layout-touch);`}
    />
  );
}

// ---------- Themes ----------
export function ThemePlayground() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  return (
    <Playground
      title="The same specimen in each theme"
      controls={<Select label="Theme" value={theme} options={[['dark', 'Dark'], ['light', 'Light']]} onChange={setTheme} />}
      preview={
        <div data-theme={theme} className="pg-theme">
          <Specimen><p className="flush pg-title">A title in this theme</p><p className="flush muted">Secondary text in this theme</p><span className="pg-solid">Loud fill</span></Specimen>
        </div>
      }
      code={`<section data-theme="${theme}">…</section>`}
    />
  );
}

// ---------- Content ----------
export function LabelPlayground() {
  const LABELS: Array<[string, string]> = [['short', 'Save'], ['verb-noun', 'Save changes'], ['long', 'Save changes to this project and notify everyone']];
  const [which, setWhich] = useState('verb-noun');
  const [width, setWidth] = useState(220);
  const text = LABELS.find(([k]) => k === which)?.[1] ?? '';
  return (
    <Playground
      title="A label in the space it gets"
      controls={<>
        <Select label="Label" value={which} options={LABELS.map(([k, t]) => [k, t.length > 18 ? `${t.slice(0, 18)}…` : t])} onChange={setWhich} />
        <Range label="Space" min={120} max={420} step={20} value={width} onChange={setWidth} unit="px" />
      </>}
      preview={<Specimen style={{ inlineSize: `${width}px`, maxInlineSize: '100%' }}><span className="demo-chip pg-label-demo">{text}</span><span className="muted">{text.split(/\s+/).length} words · {text.length} characters</span></Specimen>}
      note={<p className="flush">A label that names the action in a verb and a noun survives a narrow column. A sentence-long label wraps or gets cut, so its meaning moves into the helper text.</p>}
      code={`<button>${text}</button>`}
    />
  );
}

// ---------- Accessibility ----------
export function FocusPlayground() {
  const [ring, setRing] = useState<'on' | 'off'>('on');
  const w = TOKENS['focus-ring.width']?.css ?? '--ds-focus-ring-width';
  const c = TOKENS['focus-ring.color']?.css ?? '--ds-focus-ring-color';
  return (
    <Playground
      title="Keyboard focus you can see"
      controls={<Select label="Focus ring" value={ring} options={[['on', 'Drawn'], ['off', 'Removed']]} onChange={setRing} />}
      preview={<Specimen><span className="demo-chip" style={ring === 'on' ? { outline: `var(${w}) solid var(${c})`, outlineOffset: `var(${w})` } : { outline: 'none' }}>Focused control</span><span className="muted">{ring === 'on' ? 'A keyboard user can see where they are.' : 'A keyboard user is lost (fails WCAG 2.4.7).'}</span></Specimen>}
      note={<p className="flush">The ring comes from the focus-ring tokens, so every component draws the same one in every theme and in forced colours.</p>}
      code={ring === 'on' ? `:focus-visible {\n  outline: var(${w}) solid var(${c});\n  outline-offset: var(${w});\n}` : `/* never: */\n:focus-visible { outline: none; }`}
    />
  );
}
