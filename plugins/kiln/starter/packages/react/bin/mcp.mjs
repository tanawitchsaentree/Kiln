#!/usr/bin/env node
// A Model Context Protocol server (stdio, no dependencies) that lets an agent in another project look this
// system up instead of guessing: list and search components, read one component's import, props, tokens and
// docs link, search tokens, run quick rule checks on a snippet, and read the honest install line. It reads
// dist/mcp/knowledge.json, which tooling/knowledge.mjs writes after the build. Template from Pane.
// Add it to an agent:  claude mcp add kiln-ds -- npx kiln-ds-mcp
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const K = JSON.parse(readFileSync(new URL('../dist/mcp/knowledge.json', import.meta.url), 'utf8'));
const byName = new Map(K.components.map((c) => [c.name.toLowerCase(), c]));
const TOOLS = [
  { name: 'list_components', description: `Every ${K.name} component with its one-line concept.`, inputSchema: { type: 'object', properties: {} } },
  { name: 'search_components', description: `Find ${K.name} components by a need, such as "date range" or "upload".`, inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_component', description: 'One component: import line, every prop (type, default, description), its tokens and docs links.', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'search_tokens', description: 'Find design tokens by name or value; returns CSS custom properties with dark and light values.', inputSchema: { type: 'object', properties: { query: { type: 'string' }, tier: { type: 'string', enum: ['primitive', 'semantic', 'component'] } }, required: ['query'] } },
  { name: 'check_usage', description: 'Review a JSX or CSS snippet against the rules this system enforces: no raw colours or pixels, names on icon-only buttons, status by glyph and word, only components that exist.', inputSchema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] } },
  { name: 'how_to_choose', description: 'How a product picks this system\'s look (material, theme, brand), when the system has those choices.', inputSchema: { type: 'object', properties: {} } },
  { name: 'how_to_install', description: `How to install ${K.name} in a React project.`, inputSchema: { type: 'object', properties: {} } },
];
const words = (s) => String(s).toLowerCase().split(/[^a-z0-9ก-๙]+/).filter(Boolean);

// quick, rule-shaped checks that need no build; each finding names the rule and the fix. A system adds its
// own rules here (Pane added one loud action per pane and one material per screen).
function checkUsage(code) {
  const out = []; const lines = code.split('\n');
  const at = (re) => lines.map((l, i) => (re.test(l) ? i + 1 : 0)).filter(Boolean);
  const say = (ls, msg) => { if (ls.length) out.push(`line ${ls.join(', ')}: ${msg}`); };
  say(at(/#[0-9a-f]{3,8}\b(?![\w-])/i), 'a raw colour; use a token such as var(--ds-text-primary) or a component prop');
  say(at(/(?<![\w-])(?!0px)\d+(\.\d+)?px\b/), 'a raw pixel value; use a spacing, size or radius token');
  say(at(/<(IconButton|button)(?![^>]*aria-label)[^>]*>\s*<svg/), 'an icon-only button without aria-label has no name a screen reader can say');
  say(at(/style=\{\{[^}]*color\s*:\s*['"]?(red|green|#)/i), 'status by colour alone; show a glyph and a word as well');
  const known = new Set(K.components.flatMap((c) => [c.name, ...c.exports.map((e) => e.name)]));
  const tags = [...new Set([...code.matchAll(/<([A-Z][A-Za-z]+)/g)].map((m) => m[1]))].filter((n) => code.includes(K.package) && !known.has(n) && !/^(Fragment|Suspense)$/.test(n));
  if (tags.length) out.push(`not ${K.name} components: ${tags.join(', ')}; check list_components, or build them from tokens`);
  return out.length ? `${out.length} things to change:\n- ${out.join('\n- ')}` : 'No problems found by the quick checks. Run the docs gates for layout and contrast.';
}
function call(name, a = {}) {
  if (name === 'list_components') return K.components.map((c) => `${c.name}: ${c.concept}`).join('\n');
  if (name === 'search_components') {
    const q = words(a.query);
    const hits = K.components.map((c) => ({ c, s: q.filter((w) => `${c.name} ${c.concept} ${c.exports.flatMap((e) => e.props.map((p) => p.description)).join(' ')}`.toLowerCase().includes(w)).length })).filter((x) => x.s).sort((x, y) => y.s - x.s);
    return hits.length ? hits.slice(0, 8).map(({ c }) => `${c.name}: ${c.concept}`).join('\n') : `Nothing matches "${a.query}". Use list_components.`;
  }
  if (name === 'get_component') { const c = byName.get(String(a.name).toLowerCase()); return c ? JSON.stringify(c, null, 2) : `No component named ${a.name}. Use list_components.`; }
  if (name === 'search_tokens') { const q = String(a.query).toLowerCase(); return JSON.stringify(K.tokens.filter((t) => (!a.tier || t.tier === a.tier) && (t.name.includes(q) || t.css.includes(q) || String(t.value).toLowerCase().includes(q))).slice(0, 40), null, 2); }
  if (name === 'check_usage') return checkUsage(String(a.code ?? ''));
  if (name === 'how_to_choose') return K.appearance ? JSON.stringify(K.appearance, null, 2) : `${K.name} has one look; there is nothing to choose beyond the theme (data-theme="dark" or "light" on <html>, or leave it out to follow the system).`;
  if (name === 'how_to_install') return `${K.install}${K.site ? `\nDocs: ${K.site}` : ''} (version ${K.version}).`;
  throw new Error(`unknown tool ${name}`);
}
const send = (m) => process.stdout.write(JSON.stringify(m) + '\n');
createInterface({ input: process.stdin }).on('line', (line) => {
  let msg; try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  if (method === 'initialize') return send({ jsonrpc: '2.0', id, result: { protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: K.package, version: K.version } } });
  if (method === 'notifications/initialized' || id === undefined) return;
  if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
  if (method === 'tools/call') { try { return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: call(params.name, params.arguments) }] } }); } catch (e) { return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: String(e.message ?? e) }], isError: true } }); } }
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
  send({ jsonrpc: '2.0', id, error: { code: -32601, message: `no method ${method}` } });
});
