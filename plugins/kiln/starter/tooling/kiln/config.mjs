// Docs engine config: system/kiln.config.json → "docs", merged over defaults, paths resolved from the
// repo root. Every docs tool reads names and paths from here and nowhere else, so the engine carries
// no system's answers (page-contract.md lists what each key means).
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// KILN_SYSTEM_ROOT lets selftests point the engine at a fixture system.
export const ROOT = process.env.KILN_SYSTEM_ROOT ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULTS = {
  app: 'apps/docs', dist: 'apps/docs/dist', routes: 'apps/docs/src/book/routes.json', meta: 'apps/docs/src/book/meta.json',
  componentsDir: 'packages/react/src/components', componentsPackage: 'packages/react', changelog: 'packages/react/CHANGELOG.md',
  componentsBase: '/components', foundationsBase: '/foundations', tabs: ['usage', 'style', 'code', 'accessibility'],
  themes: ['dark', 'light'], themeParam: 'theme', scenes: [], sceneParam: 'scene',
  modes: ['normal', 'reduced-transparency', 'forced-colors'],
  contrast: { threshold: 4.5, exception: null, exceptionFloor: null, harness: null, gatingGroups: [], infoGroups: [] },
  tone: { lint: null, exclude: [] },
  catalog: 'docs/CATALOG.md', benchmark: null, depthRatio: 0.5,
};

export function docsConfig() {
  const file = path.join(ROOT, 'system', 'kiln.config.json');
  const sys = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).docs ?? {} : {};
  const c = { ...DEFAULTS, ...sys, contrast: { ...DEFAULTS.contrast, ...(sys.contrast ?? {}) }, tone: { ...DEFAULTS.tone, ...(sys.tone ?? {}) } };
  const abs = (p) => (p ? path.resolve(ROOT, p) : null);
  return { ...c, abs, root: ROOT };
}

// Every route of the book. Component pages expand into one route per tab when the page declares tabs.
export function routes(c = docsConfig()) {
  const r = JSON.parse(readFileSync(c.abs(c.routes), 'utf8'));
  return r.parts.flatMap((p) => p.pages.flatMap((pg) => (pg.tabs ? pg.tabs.map((t) => `${pg.path}/${t}`) : [pg.path])));
}
export function componentPages(c = docsConfig()) {
  const r = JSON.parse(readFileSync(c.abs(c.routes), 'utf8'));
  return r.parts.flatMap((p) => p.pages).filter((pg) => pg.path.startsWith(`${c.componentsBase}/`)).map((pg) => ({ ...pg, slug: pg.path.slice(c.componentsBase.length + 1) }));
}
// URL for a route in a given theme/scene; scene omitted for systems without backdrops.
export function url(base, route, { theme, scene } = {}, c = docsConfig()) {
  const q = new URLSearchParams();
  if (scene) q.set(c.sceneParam, scene);
  if (theme) q.set(c.themeParam, theme);
  const s = q.toString();
  return `${base}${route}${s ? `${route.includes('?') ? '&' : '?'}${s}` : ''}`;
}

// Hash of everything a check reads: package and docs sources, system files, tooling. Build output and
// files the checks themselves write (meta.json, public/, reports/) are left out, so a run can tell
// whether the source changed under it (verify.mjs) and whether a recorded run still describes the
// code on disk (milestone.mjs).
export function sourceHash(root = ROOT) {
  const h = createHash('sha256');
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const n of readdirSync(d).sort()) {
      if (['node_modules', 'dist', 'build', 'public', 'reports', '.turbo'].includes(n) || n === 'meta.json') continue;
      const f = path.join(d, n);
      // the handoff notes are written after a run and describe it; they are not read by any check
      if (/^system\/(STATE|NEXT|REVIEW|RETRO)\.md$/.test(path.relative(root, f))) continue;
      if (statSync(f).isDirectory()) walk(f); else { h.update(path.relative(root, f)); h.update(readFileSync(f)); }
    }
  };
  for (const d of ['packages', 'apps', 'system', 'tooling']) walk(path.join(root, d));
  return h.digest('hex').slice(0, 16);
}
