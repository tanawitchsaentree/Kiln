// The book's building blocks (kiln docs engine). Everything derivable is derived: tokens from the tokens JSON,
// "tokens used" from each component's real CSS module, evidence and conformance from the JSON the
// verify run writes. Prose is the only hand-written part.
import { createContext, useContext, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';
import tokens from 'kiln-ds-tokens/json';
import { navigate } from './router';
import { BACKDROPS, StageWrap, backdropById } from '../system/backdrops';

/** A fact chip in the docs chrome (plain, D-016): status, size, counts. Not a system component. */
/** A short fact chip in the page header (status, version, tier). Plain text, no role: it is read in place. */
export const Fact = ({ children }: { children: ReactNode }) => <span className="fact">{children}</span>;

export type Why = { p: string | string[]; why: string };
export type Token = { tier: string; type: string; value: string; ref: string | null; css: string; description: string | null; why?: Why | null; themes?: Record<string, { ref: string; value: string }>; breakpoints?: Record<string, { ref: string; value: string }> };
export const TOKENS = tokens as Record<string, Token>;
const BY_CSS = Object.fromEntries(Object.entries(TOKENS).map(([p, t]) => [t.css, p]));

// ---------- verification data (loaded once by the shell) ----------
export interface GroupResult { texts: number; worst: number | null; failures: number }
export interface Evidence {
  generatedAt: string; browser: string; threshold: number; modes: string[]; themes?: string[]; exceptionFloor?: number;
  harness: Record<string, Record<string, Record<string, GroupResult>>>;
  docsPage: Record<string, Record<string, { textElements: number; failures: number; pages?: number }>>;
  summary: { gatingChecks: number; gatingFailures: number; excepted?: number; informational: string[] };
}
export interface Conformance { generatedAt: string; passed: number; total: number; checks: Array<{ component: string; name: string; ok: boolean; detail?: string }> }
export const VerifyContext = createContext<{ evidence: Evidence | null; conformance: Conformance | null }>({ evidence: null, conformance: null });
export const useVerify = () => useContext(VerifyContext);
export const SceneContext = createContext<string>(BACKDROPS[0].id);
export const useScene = () => useContext(SceneContext);

// ---------- navigation ----------
export function Link({ to, children, ...rest }: { to: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & Record<`data-${string}`, string>) {
  return (
    <a {...rest} href={to} onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); navigate(to); }}>
      {children}
    </a>
  );
}

// ---------- page structure ----------
export function Page({ eyebrow, title, lede, children }: { eyebrow: string; title: string; lede: ReactNode; children: ReactNode }) {
  return (
    <article className="book-page">
      <header className="page-head">
        <p className="flush eyebrow">{eyebrow}</p>
        <h1 id="page-title" tabIndex={-1} className="flush page-title">{title}</h1>
        <div className="lede">{lede}</div>
      </header>
      {children}
    </article>
  );
}

export function Section({ id, title, children, wide }: { id: string; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section id={id} className={`book-section${wide ? ' wide' : ''}`} aria-labelledby={`${id}-h`}>
      <div className="prose">
        <h2 id={`${id}-h`} className="flush"><a className="heading-anchor" href={`#${id}`} aria-hidden="true" tabIndex={-1}>#</a>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function Callout({ tone = 'note', title, children }: { tone?: 'note' | 'rule' | 'caution'; title: string; children: ReactNode }) {
  const label = { note: 'Note', rule: 'Rule', caution: 'Caution' }[tone];
  return (
    <aside className={`callout callout-${tone}`} aria-label={`${label}: ${title}`}>
      <p className="flush callout-title"><span className="callout-kind">{label}</span> {title}</p>
      <div className="callout-body">{children}</div>
    </aside>
  );
}

/** A code block with its copy button always visible (USER-STANDARDS #7, G-C1). Long blocks show the
 *  first lines with "Show all"; Copy always copies the whole block. */
export function CodeBlock({ code, label = 'Code', lines = 14 }: { code: string; label?: string; lines?: number }) {
  const body = code.trim();
  const long = body.split('\n').length > lines;
  const [open, setOpen] = useState(!long);
  const [copied, setCopied] = useState(false);
  const shown = open ? body : body.split('\n').slice(0, lines).join('\n');
  return (
    <div className="codeblock" data-codeblock="">
      <div className="codeblock-bar">
        <span className="codeblock-label">{label}</span>
        <span className="codeblock-actions">
          {long && <button type="button" className="copy-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Show less' : `Show all ${body.split('\n').length} lines`}</button>}
          <button type="button" className="copy-btn" data-copy="" onClick={() => { navigator.clipboard?.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 1600); }}>{copied ? 'Copied' : 'Copy'}</button>
        </span>
      </div>
      <pre className={open ? 'code' : 'code clipped'} data-clipped={open ? undefined : ''} tabIndex={0} aria-label={`${label} snippet`}><code>{shown}</code></pre>
    </div>
  );
}

/** A demo stage: the one place the system's own look appears in the docs (D-016). The backdrop comes
 *  from system/backdrops.tsx, so a system on plain surfaces and one on photographs use the same engine. */
export function Stage({ children, plain, className = '', backdrop }: { children: ReactNode; plain?: boolean; className?: string; backdrop?: 'scene' | 'field' }) {
  const chosen = useScene();
  // diagrams pass backdrop="field": the subject is structure, so a busy backdrop would only compete with it
  const b = backdropById(backdrop === 'field' || (backdrop !== 'scene' && chosen === 'field') ? 'field' : chosen);
  const field = b.id === 'field';
  return (
    <div className={`example-live${plain ? ' plain' : ''}${field ? ' stage-field' : ''} ${b.className ?? ''} ${className}`} data-example-live="" data-surface="" data-backdrop={b.id} style={b.image ? { backgroundImage: `url(${b.image})` } : undefined}>
      <StageWrap backdrop={b}>{children}</StageWrap>
    </div>
  );
}

/** Live example + the exact source file that renders it (imported with ?raw), code visible by default. */
export function Example({ title, code, children, plain, backdrop }: { title: string; code: string; children: ReactNode; plain?: boolean; backdrop?: 'scene' | 'field' }) {
  const body = code.replace(/^\/\/ @example.*\n/m, '').trim();
  return (
    <figure className="example" data-example="">
      <Stage plain={plain} backdrop={backdrop}>{children}</Stage>
      <figcaption className="example-bar"><span className="example-title">{title}</span></figcaption>
      <CodeBlock code={body} label="TSX" />
    </figure>
  );
}

export function Code({ children, label }: { children: string; label?: string }) {
  return <CodeBlock code={children} label={label} />;
}

// ---------- tables ----------
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="copy-btn" aria-label={label} onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); }}>
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}
export interface PropDoc { name: string; type: string; default?: string; description: string }
export function PropsTable({ props }: { props: PropDoc[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th scope="col">Prop</th><th scope="col">Type</th><th scope="col">Default</th><th scope="col">Description</th></tr></thead>
        <tbody>{props.map((p) => <tr key={p.name}><th scope="row"><code>{p.name}</code></th><td><code>{p.type}</code></td><td>{p.default ? <code>{p.default}</code> : '—'}</td><td>{p.description}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function KeyboardTable({ keys }: { keys: Array<[string, string]> }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th scope="col">Key</th><th scope="col">Does</th></tr></thead>
        <tbody>{keys.map(([k, a]) => <tr key={k}><th scope="row"><kbd>{k}</kbd></th><td>{a}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function DoDont({ items }: { items: Array<{ do: string; dont: string }> }) {
  return (
    <div className="dodont">
      {items.map((it, i) => (
        <div key={i} className="dodont-row">
          <div className="dodont-cell"><p className="flush dodont-kind">Do</p><p className="flush">{it.do}</p></div>
          <div className="dodont-cell"><p className="flush dodont-kind">Don’t</p><p className="flush">{it.dont}</p></div>
        </div>
      ))}
    </div>
  );
}

export function TokenTable({ prefix, tier, query = '' }: { prefix?: string; tier?: string; query?: string }) {
  const q = query.toLowerCase();
  const rows = Object.entries(TOKENS).filter(([p, t]) => (!prefix || p.startsWith(prefix)) && (!tier || t.tier === tier) && (!q || p.includes(q) || t.css.includes(q) || String(t.value).toLowerCase().includes(q)));
  return (
    <div className="table-wrap">
      <table>
        <caption>{rows.length} token{rows.length === 1 ? '' : 's'}. Read from the tokens JSON</caption>
        <thead><tr><th scope="col">Token</th><th scope="col">Tier</th><th scope="col">Points at</th><th scope="col">Resolved value</th><th scope="col">Why</th><th scope="col"><span className="visually-hidden">Copy</span></th></tr></thead>
        <tbody>
          {rows.map(([p, t]) => (
            <tr key={p}>
              <th scope="row"><code>{t.css}</code></th>
              <td>{t.tier}</td>
              <td>{t.ref ? <code>{t.ref}</code> : '—'}</td>
              <td>{t.type === 'color' && <span className="swatch-dot" style={{ background: `var(${t.css})` }} aria-hidden="true" />}<code>{String(t.value)}</code></td>
              <td data-why=""><WhyText w={t.why} /></td>
              <td><CopyButton text={`var(${t.css})`} label={`Copy var(${t.css})`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- reasons (kiln.why → system/CONCEPT.md principles) ----------
import conceptMd from '../../../../system/CONCEPT.md?raw';
export const PRINCIPLES: Array<{ id: string; name: string; claim: string; therefore: Array<[string, string]> }> = [...conceptMd.matchAll(/^### (P\d+)\s+(.+)\n([\s\S]*?)(?=^### P\d+|(?![\s\S]))/gm)].map((m) => {
  const [claim, rest = ''] = m[3].split(/\*\*Therefore\*\*/);
  const therefore = [...rest.matchAll(/(space|shape|depth|colour|type|motion|interaction): ([^]*?)(?= (?:space|shape|depth|colour|type|motion|interaction): |$)/g)].map((x) => [x[1], x[2].trim()] as [string, string]);
  return { id: m[1], name: m[2].trim(), claim: claim.trim(), therefore };
});
export const CONCEPT_INTRO = conceptMd.replace(/<!--[\s\S]*?-->/g, '').split(/^## Principles/m)[0].replace(/^#.*$/m, '').trim();
const principleName = (id: string) => PRINCIPLES.find((p) => p.id === id)?.name ?? id;
export function WhyText({ w }: { w?: Why | null }) {
  if (!w) return <span className="fail">No reason</span>;
  return <span className="why">{[].concat(w.p as never).map((p: string) => <Link key={p} to={`/principles#${p.toLowerCase()}`} className="why-chip" title={principleName(p)}>{p}</Link>)} {w.why}</span>;
}

// Every component's CSS module, as text. The "tokens used" list is parsed from what the component
// actually references, so it cannot drift from the code.
const CSS_MODULES = import.meta.glob('../../../../packages/react/src/components/*/*.module.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export function TokensUsed({ component }: { component: string }) {
  const src = Object.entries(CSS_MODULES).find(([k]) => k.endsWith(`/${component}/${component}.module.css`))?.[1] ?? '';
  const names = [...new Set([...src.matchAll(/var\((--ds-[a-z0-9-]+)/g)].map((m) => m[1]))].sort();
  // which CSS property each custom property drives, read from the declarations that use it
  const drives = (n: string) => [...new Set([...src.matchAll(/([a-z-]+)\s*:[^;{}]*?var\((--ds-[a-z0-9-]+)/g)].filter((m) => src.slice(m.index, src.indexOf(';', m.index)).includes(n)).map((m) => m[1]))].join(', ');
  if (!names.length) return <p className="muted">No CSS module found for {component}.</p>;
  return (
    <div className="table-wrap">
      <table>
        <caption>{names.length} tokens referenced by <code>{component}.module.css</code></caption>
        <thead><tr><th scope="col">Custom property</th><th scope="col">Drives</th><th scope="col">Points at</th><th scope="col">Default</th></tr></thead>
        <tbody>
          {names.map((n) => {
            const t = TOKENS[BY_CSS[n]];
            return <tr key={n}><th scope="row"><code>{n}</code></th><td>{drives(n) || '—'}</td><td>{t?.ref ? <code>{t.ref}</code> : '—'}</td><td><code>{t ? String(t.value) : 'not a token'}</code></td></tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------- verification panels ----------
export function EvidenceTable({ groups }: { groups: string[] }) {
  const { evidence } = useVerify();
  if (!evidence) return <p className="muted">UNVERIFIED. Evidence.json not found. Run <code>pnpm run verify</code>.</p>;
  const keys = Object.keys(evidence.harness?.[evidence.modes[0]] ?? {});
  return (
    <div className="table-wrap">
      <table>
        <caption>Worst-pixel text contrast in {evidence.browser}, measured on the rendered pages. Normal text needs {evidence.threshold} to 1 and large text needs 3 to 1.</caption>
        <thead><tr><th scope="col">{keys.length ? 'Group · theme' : 'Docs pages · theme'}</th>{evidence.modes.map((m) => <th scope="col" key={m}>{m}</th>)}</tr></thead>
        <tbody>
          {keys.length ? groups.flatMap((g) => keys.map((k) => (
            <tr key={`${g}/${k}`}>
              <th scope="row">{g} · {k}</th>
              {evidence.modes.map((m) => {
                const r = evidence.harness[m]?.[k]?.[g];
                if (!r) return <td key={m}>—</td>;
                const floor = evidence.exceptionFloor ?? 0;
                const state = r.failures === 0 ? 'PASS' : r.worst != null && r.worst >= floor && g !== 'media' ? 'EXCEPTION' : 'FAIL';
                return <td key={m}><span className={state === 'PASS' ? 'pass' : 'fail'}>{state}</span> {r.worst != null ? `${r.worst.toFixed(2)}:1` : ''}{r.failures ? ` · ${r.failures}/${r.texts}` : ''}</td>;
              })}
            </tr>
          ))) : Object.keys(evidence.docsPage?.[evidence.modes[0]] ?? {}).map((k) => (
            <tr key={k}>
              <th scope="row">{k}</th>
              {evidence.modes.map((m) => {
                const r = evidence.docsPage?.[m]?.[k];
                if (!r || !r.pages) return <td key={m}>—</td>;
                return <td key={m}><span className={r.failures ? 'fail' : 'pass'}>{r.failures ? 'FAIL' : 'PASS'}</span> {r.failures}/{r.textElements} over {r.pages} pages</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConformanceList({ component }: { component: string }) {
  const { conformance } = useVerify();
  const checks = conformance?.checks.filter((c) => c.component === component);
  if (!checks) return <p className="muted">UNVERIFIED. Conformance.json not found.</p>;
  return (
    <ul className="checks flush">
      {checks.map((c) => <li key={c.name}><span className={c.ok ? 'pass' : 'fail'}>{c.ok ? 'PASS' : 'FAIL'}</span> {c.name}{c.detail ? <span className="muted">. {c.detail}</span> : null}</li>)}
    </ul>
  );
}

export function VerifiedTags() {
  const { evidence, conformance } = useVerify();
  const tier = (t: string) => Object.values(TOKENS).filter((x) => x.tier === t).length;
  return (
    <ul className="stats flush" aria-label="Verification summary">
      <li><Fact>{evidence ? `${evidence.summary.gatingChecks - evidence.summary.gatingFailures - (evidence.summary.excepted ?? 0)}/${evidence.summary.gatingChecks} text checks pass` : 'contrast: unverified'}</Fact></li>
      {evidence?.summary.excepted ? <li><Fact>{`${evidence.summary.excepted} excepted (E-001)`}</Fact></li> : null}
      <li><Fact>{conformance ? `${conformance.passed}/${conformance.total} conformance` : 'conformance: unverified'}</Fact></li>
      <li><Fact>{`${tier('primitive')} · ${tier('semantic')} · ${tier('component')} tokens`}</Fact></li>
    </ul>
  );
}

// ---------- minimal markdown (for DECISIONS.md / EXCEPTIONS.md, rendered as-is) ----------
export const inline = (s: string) => s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
  part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part);
export function Markdown({ source, skipUntil }: { source: string; skipUntil?: RegExp }) {
  let lines = source.split('\n');
  if (skipUntil) { const i = lines.findIndex((l) => skipUntil.test(l)); if (i > 0) lines = lines.slice(i); }
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(<ul key={out.length} className="flush">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = []; } };
  let fields: Array<[string, string]> = [];
  const flushFields = () => { if (fields.length) { out.push(<dl key={out.length} className="record">{fields.map(([k, v], i) => <div key={i} className="record-row"><dt>{inline(k)}</dt><dd>{inline(v)}</dd></div>)}</dl>); fields = []; } };
  for (const l of lines) {
    // a record field ("- **Where:** value") is a label/value pair, rendered as one
    const field = l.match(/^- \*\*(.+?):\*\*\s*(.*)$/);
    if (field && !l.slice(field[0].indexOf('**', 4) + 2).includes('**')) { flush(); fields.push([field[1], field[2]]); continue; }
    flushFields();
    if (/^- /.test(l)) { list.push(l.slice(2)); continue; }
    flush();
    if (/^### /.test(l)) out.push(<h3 key={out.length} className="md-h3">{inline(l.slice(4))}</h3>);
    else if (/^## /.test(l)) out.push(<h3 key={out.length} className="md-h3">{inline(l.slice(3))}</h3>);
    else if (/^# /.test(l) || /^---\s*$/.test(l) || !l.trim()) continue;
    else if (/^> /.test(l)) out.push(<p key={out.length} className="muted">{inline(l.slice(2))}</p>);
    else out.push(<p key={out.length}>{inline(l)}</p>);
  }
  flush();
  flushFields();
  return <div className="markdown">{out}</div>;
}
