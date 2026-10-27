import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PAGES, PARTS, navigate, pageOf, useRoute } from './book/router';
import { Link, SceneContext, VerifyContext, type Conformance, type Evidence } from './book/kit';
import { PAGE_COMPONENTS } from './book/pages';
import { plannedWaves } from './book/catalog';
import { BACKDROPS, backdropById } from './system/backdrops';
import { Choice } from './system/controls';
import { NAME } from './system/content';

// Verification results ship inside the bundle (the verify run rebuilds the docs after writing them),
// so badges and evidence tables render in the same frame as the page instead of popping in later.
const VERIFY = import.meta.glob('../public/{evidence,conformance}.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const verifyFile = <T,>(name: string) => (VERIFY[`../public/${name}.json`] as T | undefined) ?? null;
// A stale or older-format file must read as "unverified", never crash the page or show wrong numbers.
const validEvidence = (e: Evidence | null) => (e && Array.isArray(e.modes) && e.harness && e.docsPage && Array.isArray(e.summary?.informational) ? e : null);
const validConformance = (c: Conformance | null) => (c && Array.isArray(c.checks) ? c : null);

function useOnThisPage(path: string) {
  const [items, setItems] = useState<Array<{ id: string; title: string }>>([]);
  // layout effect: the list is filled before the browser paints, so it never appears a frame late
  useLayoutEffect(() => {
    setItems([...document.querySelectorAll('main .book-section')].map((s) => ({ id: s.id, title: s.querySelector('h2')?.textContent?.replace(/^#/, '') ?? s.id })));
  }, [path]);
  return items;
}

const PLANNED = plannedWaves(PARTS.find((p) => p.title === 'Components')?.pages.map((p) => p.title) ?? []);

export function App() {
  const path = useRoute();
  const evidence = validEvidence(verifyFile<Evidence>('evidence'));
  const conformance = validConformance(verifyFile<Conformance>('conformance'));
  const [scene, setScene] = useState(backdropById(new URLSearchParams(location.search).get('scene') ?? BACKDROPS[0].id).id);
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  // Theme: system follows prefers-color-scheme; the choice is stored; ?theme= overrides (tests).
  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>(() => (new URLSearchParams(location.search).get('theme') as 'light' | 'dark' | null) ?? ((localStorage.getItem('ds-theme') as 'system' | 'light' | 'dark' | null) ?? 'system'));
  const [systemLight, setSystemLight] = useState(() => matchMedia('(prefers-color-scheme: light)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)');
    const on = () => setSystemLight(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const theme = themePref === 'system' ? (systemLight ? 'light' : 'dark') : themePref;
  useLayoutEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('ds-theme', themePref); }, [theme, themePref]);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstRender = useRef(true);

  // A chapter is a new page: close the menu, start at the top, move focus to the page heading.
  useEffect(() => {
    setMenuOpen(false);
    if (firstRender.current) { firstRender.current = false; return; }
    if (location.hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    requestAnimationFrame(() => document.getElementById('page-title')?.focus({ preventScroll: true }));
  }, [path]);
  // Menu drawer (narrow screens): Esc closes, focus goes in on open and back to the button on close.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('#book-nav input, #book-nav a')?.focus());
    return () => { document.removeEventListener('keydown', onKey); menuButton.current?.focus(); };
  }, [menuOpen]);
  const onPage = useOnThisPage(path);

  useEffect(() => {
    const u = new URL(location.href);
    u.searchParams.set('scene', scene);
    history.replaceState(null, '', u);
  }, [scene]);
  useEffect(() => {
    const pg = pageOf(path);
    const tab = pg?.tabs && path !== pg.path ? path.slice(pg.path.length + 1) : null;
    document.title = pg ? `${pg.title}${tab ? ` ${tab[0].toUpperCase()}${tab.slice(1)}` : ''}. ${NAME}` : NAME;
  }, [path]);

  const PageComponent = PAGE_COMPONENTS[path];
  const here = pageOf(path);
  const idx = here ? PAGES.indexOf(here) : -1;
  const [prev, next] = [PAGES[idx - 1], PAGES[idx + 1]];
  const filtered = useMemo(() => PARTS.map((part) => ({ ...part, pages: part.pages.filter((p) => !q || p.title.toLowerCase().includes(q.toLowerCase()) || part.title.toLowerCase().includes(q.toLowerCase())) })).filter((p) => p.pages.length), [q]);

  return (
    <VerifyContext.Provider value={{ evidence, conformance }}>
    <SceneContext.Provider value={scene}>
      {/* Plain, opaque docs chrome (D-016). The system's look appears only inside demo stages. */}
      <div className="page">
        <a className="skip" href="#main">Skip to content</a>

        <header className="topbar">
          <Link to="/" className="brand-link"><span className="brand">{NAME}</span><span className="brand-sub">design system</span></Link>
          <span className="topbar-title">{here?.title}</span>
          <div className="topbar-tools">
            <div className="seg" role="group" aria-label="Theme" data-theme-control="">
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button key={t} type="button" className="seg-btn" aria-pressed={t === themePref} data-theme-value={t} onClick={() => setThemePref(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
            <div className="topbar-scene" data-scene-control=""><span className="topbar-scene-label" aria-hidden="true">Demo backdrop</span>
              <Choice label="Demo backdrop" value={scene} onChange={setScene} options={BACKDROPS.map((b) => [b.id, b.label] as [string, string])} />
            </div>
          </div>
          <button ref={menuButton} type="button" className="menu-btn" data-menu-toggle="" aria-expanded={menuOpen} aria-controls="book-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button>
        </header>
        {menuOpen && <div className="drawer-scrim" aria-hidden="true" onClick={() => setMenuOpen(false)} />}

        <aside className={`rail${menuOpen ? ' open' : ''}`} id="book-nav" aria-label="Book navigation">
          <nav aria-label="Book" data-book-nav="">
            <label className="field"><span className="visually-hidden">Find a chapter</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a chapter" /></label>
            {filtered.map((part) => (
              <div key={part.title} className="nav-part">
                <p className="nav-part-title" data-nav-part="">{part.title}</p>
                <ul className="toc flush">
                  {part.pages.map((p) => <li key={p.path}><a href={p.path} aria-current={p.path === here?.path ? 'page' : undefined} onClick={(e) => { e.preventDefault(); navigate(p.path); }}>{p.title}</a></li>)}
                </ul>
                {part.title === 'Components' && !q && PLANNED.map((w) => (
                  <details key={w.wave} className="nav-planned">
                    <summary>Planned · wave {w.wave} {w.title} ({w.items.length})</summary>
                    <ul className="toc flush">{w.items.map((n) => <li key={n} data-planned="">{n} <span className="visually-hidden">Planned · wave {w.wave}</span></li>)}</ul>
                  </details>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main id="main" className="content" key={path} inert={menuOpen || undefined}>
          {PageComponent ? <PageComponent /> : (
            <section aria-labelledby="nf"><h1 id="nf" className="flush page-title">Not in the book</h1><p className="muted">No chapter at {path}. <Link to="/">Back to the overview</Link>.</p></section>
          )}
          <nav className="pager" aria-label="Chapters">
            {prev ? <Link to={prev.path} className="pager-link" data-surface=""><span className="eyebrow">Previous</span><span className="pager-title">{prev.title}</span></Link> : <span />}
            {next ? <Link to={next.path} className="pager-link next" data-surface=""><span className="eyebrow">Next</span><span className="pager-title">{next.title}</span></Link> : <span />}
          </nav>
        </main>

        {onPage.length > 2 && (
          <aside className="on-page" aria-label="On this page">
            <p className="flush nav-part-title">On this page</p>
            <ul className="toc flush">{onPage.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ul>
          </aside>
        )}
      </div>
    </SceneContext.Provider>
    </VerifyContext.Provider>
  );
}
