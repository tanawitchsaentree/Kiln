import { useEffect, useState } from 'react';
import routes from './routes.json';

export interface PageRef { path: string; title: string; part: string; tabs?: string[] }
export const PAGES: PageRef[] = routes.parts.flatMap((p) => p.pages.map((pg) => ({ ...pg, part: p.title })));
export const PARTS = routes.parts;
// Every route the book serves: a page with tabs is one route per tab (docs-engine component-depth.md).
export const ROUTES: string[] = PAGES.flatMap((p) => (p.tabs ? p.tabs.map((t) => `${p.path}/${t}`) : [p.path]));
/** The page a route belongs to: a tab route resolves to its component's page. */
export const pageOf = (path: string) => PAGES.find((p) => p.path === path) ?? PAGES.find((p) => p.tabs?.some((t) => path === `${p.path}/${t}`));

// A page with tabs opens on its first tab; rewriting here means every reader of the path agrees.
const firstTab = (p: string) => { const pg = PAGES.find((x) => x.path === p && x.tabs); return pg ? `${p}/${pg.tabs![0]}` : p; };
const current = () => {
  const raw = location.pathname.replace(/\/+$/, '') || '/';
  const to = firstTab(raw);
  if (to !== raw) history.replaceState(null, '', `${to}${location.search}${location.hash}`);
  return to;
};

/** Pathname routing; links keep the ?scene= so the backdrop survives navigation. */
export function useRoute() {
  const [path, setPath] = useState(current());
  useEffect(() => {
    const on = () => setPath(current());
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  return path;
}

export function navigate(to: string) {
  const [raw, hash] = to.split('#');
  const p = raw && firstTab(raw);
  const url = `${p || location.pathname}${location.search}${hash ? `#${hash}` : ''}`;
  if (p && p !== current()) {
    history.pushState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  } else history.replaceState(null, '', url);
  if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: 'start' }));
}
