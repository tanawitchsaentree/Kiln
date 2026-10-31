// The Appearance menu and its state (pattern from Pane's topbar). One control in the top bar says what the
// examples currently show and opens the axes in system/appearance.ts. The address carries a value only when
// someone chose something other than the default; unknown and retired values fall back and are dropped on
// load (G-ST1). Nothing is written to storage here.
import { useEffect, useLayoutEffect, useState } from 'react';
import { APPEARANCE, RETIRED_PARAMS, type AppearanceAxis } from '../system/appearance';
import { Choice } from '../system/controls';

export type Appearance = Record<string, string>;

const known = (a: AppearanceAxis, v: string | null) => (v != null && a.options.some(([id]) => id === v) ? v : a.fallback);

function readAppearance(): Appearance {
  const q = new URLSearchParams(location.search);
  return Object.fromEntries(APPEARANCE.map((a) => [a.id, known(a, q.get(a.param))]));
}

/** The address after a change: defaults removed, choices kept, every other param left alone. */
export function addressFor(look: Appearance, href = location.href): string {
  const u = new URL(href);
  for (const p of RETIRED_PARAMS) u.searchParams.delete(p);
  for (const a of APPEARANCE) {
    const v = look[a.id];
    if (!v || v === a.fallback) u.searchParams.delete(a.param); else u.searchParams.set(a.param, v);
  }
  return `${u.pathname}${u.search}${u.hash}`;
}

export function useAppearance(): [Appearance, (id: string, value: string) => void] {
  const [look, setLook] = useState<Appearance>(readAppearance);
  useLayoutEffect(() => {
    for (const a of APPEARANCE) if (a.root) document.documentElement.dataset[a.id] = look[a.id];
  }, [look]);
  useEffect(() => {
    const next = addressFor(look);
    if (next !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(null, '', next);
  }, [look]);
  return [look, (id, value) => setLook((l) => ({ ...l, [id]: value }))];
}

/** The top-bar control. The summary names every current choice, so the reader sees what the book shows. */
export function AppearanceMenu({ look, onChange }: { look: Appearance; onChange: (id: string, value: string) => void }) {
  const summary = APPEARANCE.map((a) => a.options.find(([id]) => id === look[a.id])?.[1] ?? look[a.id]).join(', ');
  const controls = Object.fromEntries(APPEARANCE.map((a) => [`data-${a.id}-control`, '']));
  return (
    <details className="tb-appearance" {...controls}>
      <summary aria-label={`Appearance of the examples: ${summary}`}>Appearance <span className="muted">{summary}</span></summary>
      <div className="tb-appearance-body">
        <p className="muted">How the examples in this book look. In a product each of these is one prop, set in code.</p>
        {APPEARANCE.map((a) => (
          <Choice key={a.id} label={a.label} value={look[a.id]} options={a.options} onChange={(v) => onChange(a.id, v)} />
        ))}
      </div>
    </details>
  );
}
