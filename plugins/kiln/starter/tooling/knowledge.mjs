#!/usr/bin/env node
// knowledge: everything an agent in another project needs to use this system without reading its source,
// in two files (template lifted from Pane, where another project's agent stalled guessing at props):
//   packages/react/dist/mcp/knowledge.json  read by the MCP server in packages/react/bin/mcp.mjs
//   apps/docs/public/llms.txt               the same, as plain text for agents that read the site
// For each component: the import line, a one-line concept (from its .why.json), every prop with type,
// default and description (the generated meta) and its component tokens; then every token with its CSS
// name and value. The install line is the honest one (rule 17): the tarball until docs.published names
// the package.
// Usage: node tooling/knowledge.mjs   (runs after the React build and the docs meta step)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => JSON.parse(readFileSync(path.join(root, p), 'utf8'));
const SYS = read('system/kiln.config.json');
const pkg = read('packages/react/package.json');
const meta = read(SYS.docs?.meta ?? 'apps/docs/src/book/meta.json');
const tokens = read('packages/tokens/build/json/tokens.json');
const routes = read(SYS.docs?.routes ?? 'apps/docs/src/book/routes.json');
const SITE = SYS.docs?.site ?? null;
const published = (SYS.docs?.published ?? []).includes(pkg.name);
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const slugOf = Object.fromEntries(routes.parts.flatMap((p) => p.pages).filter((p) => p.path.startsWith('/components/')).map((p) => [p.title, p.path.replace('/components/', '')]));
const link = (slug, tab) => (SITE && slug ? `${SITE}/components/${slug}/${tab}` : null);

const components = Object.entries(meta.components).map(([name, m]) => {
  const why = path.join(root, 'packages/react/src/components', name, `${name}.why.json`);
  const concept = existsSync(why) ? JSON.parse(readFileSync(why, 'utf8')).concept ?? '' : '';
  return {
    name, concept,
    import: `import { ${m.exports.map((e) => e.displayName).join(', ')} } from '${pkg.name}';`,
    docs: link(slugOf[name], 'usage'), code: link(slugOf[name], 'code'),
    exports: m.exports.map((e) => ({ name: e.displayName, props: e.props.map((p) => ({ name: p.name, type: p.type, required: p.required, default: p.default ?? null, description: p.description })) })),
    tokens: Object.entries(tokens).filter(([k, t]) => t.tier === 'component' && k.startsWith(`${kebab(name)}.`)).map(([k, t]) => ({ name: k, css: t.css, value: t.value })),
  };
});
const install = published
  ? `npm install ${pkg.name}, then import '${pkg.name}/all.css' once at the root.`
  : `${pkg.name} is not on npm yet. Install the release tarball (pnpm run release:pack writes it to release/): npm install /path/to/release/${pkg.name}-${pkg.version}.tgz, then import '${pkg.name}/all.css' once at the root.`;
const out = {
  name: SYS.name, package: pkg.name, version: pkg.version, site: SITE, install, components,
  tokens: Object.entries(tokens).map(([k, t]) => ({ name: k, tier: t.tier, type: t.type, css: t.css, value: t.value, light: t.themes?.light?.value ?? null })),
  // system-owned guidance the MCP server returns from how_to_choose; fill it when the system has materials,
  // brands or environments (Pane's Materials chapter is the model)
  appearance: SYS.knowledge?.appearance ?? null,
};
const dest = path.join(root, 'packages/react/dist/mcp'); mkdirSync(dest, { recursive: true });
writeFileSync(path.join(dest, 'knowledge.json'), JSON.stringify(out));

const txt = [
  `# ${SYS.name}`, '', `> ${components.length} React components and ${out.tokens.length} design tokens. ${install}`, '',
  '## Components', '', ...components.map((c) => `- ${c.name}: ${c.concept || 'no concept recorded'} \`${c.import}\`${c.docs ? ` (${c.docs})` : ''}`), '',
  '## Tokens', '', ...out.tokens.filter((t) => t.tier !== 'primitive').map((t) => `- \`${t.css}\` ${t.value}${t.light && t.light !== t.value ? ` (light ${t.light})` : ''}`), '',
];
const pub = path.join(root, SYS.docs?.app ?? 'apps/docs', 'public'); mkdirSync(pub, { recursive: true });
writeFileSync(path.join(pub, 'llms.txt'), txt.join('\n'));
console.log(`✓ knowledge: ${components.length} components, ${out.tokens.length} tokens → dist/mcp/knowledge.json and llms.txt`);
