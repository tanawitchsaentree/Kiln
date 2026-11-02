#!/usr/bin/env node
// agent-setup — writes <docs app>/public/agent-setup/prompt.md: the instructions a coding agent fetches when
// a user pastes the book's "Onboard your agent" line. It is generated from kiln.config.json → agentSetup, so
// the install line, the MCP command and the file addresses are the ones that work today (rule 17).
//
// It differs from the usual agent-setup page on purpose. Those pages tell the agent to run everything
// without asking and to install globally with --yes. This one makes the agent read the project first,
// say what it will change, ask once, install into the project only, and never touch a credential. It ends
// by saying what the agent still cannot check, because the gates run only in a kiln system.
//
// Config (all optional except site):
//   "agentSetup": { "site": "https://…", "packages": [{ "name": "x-react", "tarball": "/downloads/x-react-1.0.0.tgz" }],
//                   "stylesheet": "x-react/all.css", "react": ">=18", "mcp": { "name": "x", "command": "npx x-mcp" },
//                   "skill": "/skill.md", "design": "/DESIGN.md", "llms": "/llms-full.txt", "starter": "<tsx snippet>" }
// Usage: node tooling/kiln/agent-setup.mjs   (verify runs it before the book is built)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, docsConfig } from './config.mjs';

const C = docsConfig();
const SYS = JSON.parse(readFileSync(path.join(ROOT, 'system', 'kiln.config.json'), 'utf8'));
const A = SYS.agentSetup;
if (!A?.site) { console.log('- agent-setup: no agentSetup.site in kiln.config.json, nothing written'); process.exit(0); }
const abs = (u) => (u && u.startsWith('/') ? A.site.replace(/\/$/, '') + u : u);
const concept = existsSync(path.join(ROOT, 'system/CONCEPT.md')) ? readFileSync(path.join(ROOT, 'system/CONCEPT.md'), 'utf8') : '';
const NAME = (SYS.name && !/\{\{/.test(SYS.name) ? SYS.name : null) ?? concept.match(/^# Concept\W+(.+)$/m)?.[1]?.trim() ?? 'the design system';
const slug = NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const pkgs = A.packages ?? [];
const installs = pkgs.map((p) => (p.tarball ? abs(p.tarball) : p.name));
// the lead sentence says where the install comes from, and is only as true as the config: a package with a
// tarball, or one not listed in docs.published, installs from the site; a published registry name does not
// need the explanation (Pane, 2026-11-02: pane-react 0.8.1 went to npm and the old sentence went false)
const fromSite = pkgs.filter((p) => p.tarball || !(C.published ?? []).includes(p.name));
const installLead = fromSite.length === 0 ? 'Install it with your package manager:'
  : fromSite.length === pkgs.length ? `${NAME} is installed from the tarball${pkgs.length > 1 ? 's' : ''} its site hosts, so the line works before the package is on a registry:`
  : `${fromSite.map((p) => p.name).join(' and ')} ${fromSite.length > 1 ? 'come' : 'comes'} from the tarball its site hosts, the rest from the registry:`;
const mcp = A.mcp;
const mcpArgs = mcp ? mcp.command.split(/\s+/) : [];

const md = `# Set up ${NAME} in this project

You are a coding agent. The person who pasted the line that brought you here wants to build with
${NAME}, a design system. Work through the steps below in this project, but follow the rules first.

## Rules

1. Read before you change anything. Look at package.json, the lockfile, the framework and the entry file.
2. Then tell the person, in one short list, what you will add and which files you will touch, and ask
   once whether to go ahead. Do not ask again for each step after they say yes.
3. Install into this project only. Never install globally, never add \`--yes\` to a global command, and
   never change settings outside this folder unless the person asks.
4. Never read, ask for, print or store a credential, token or key. Nothing here needs an account.
5. If a step fails, stop that step, say what failed in one line, and go on with the rest.
6. Use the package manager the project already uses (pnpm, yarn, npm or bun, from its lockfile).

## 1. Check the project

${A.react ? `It needs React ${A.react}. If package.json has no \`react\`, or an older one, stop and say so.` : 'Find the framework the project uses.'}
If there is no package.json, offer to start one, and do nothing until the person answers.

## 2. Install

${installLead}

\`\`\`sh
<package manager> add ${installs.join(' ')}
\`\`\`

${A.stylesheet ? `Then import the stylesheet once, in the app's entry file (main.tsx, _app.tsx, layout.tsx or the like), before the app's own CSS:

\`\`\`ts
import '${A.stylesheet}';
\`\`\`
` : ''}
## 3. Teach yourself the system

Pick the section for the agent you are.

### Claude Code

${A.skill ? `- Save ${abs(A.skill)} as \`.claude/skills/${slug}/SKILL.md\` in this project.\n` : ''}${mcp ? `- Add the MCP server for this project only: \`claude mcp add --scope project ${mcp.name} -- ${mcp.command}\`. It runs locally and needs no account.\n` : ''}
### Cursor

${A.skill ? `- Save ${abs(A.skill)} as \`.cursor/rules/${slug}.mdc\`, with \`alwaysApply: false\` and a description saying to use it when building UI.\n` : ''}${mcp ? `- Add to \`.cursor/mcp.json\` in this project: \`{ "mcpServers": { "${mcp.name}": { "command": "${mcpArgs[0]}", "args": ${JSON.stringify(mcpArgs.slice(1))} } } }\`\n` : ''}
### Codex, GitHub Copilot, Windsurf and other agents

- Add a section to \`AGENTS.md\` in the project root (create it if it is missing) that says to build UI with
  ${pkgs.map((p) => p.name).join(' and ') || NAME}, to read ${abs(A.design ?? '/DESIGN.md')} before designing a screen, and to look up
  components in ${abs(A.llms ?? '/llms-full.txt')}.
${mcp ? `- If your agent speaks MCP, register \`${mcp.command}\` as a local stdio server named \`${mcp.name}\`, in this project's config.\n` : ''}
## 4. Prove it works

${A.starter ? `Add this to a page that already renders, run the project's typecheck and its dev build, and say whether both pass:

\`\`\`tsx
${A.starter}
\`\`\`
` : "Render one component on a page that already renders, run the project's typecheck and dev build, and say whether both pass."}
## 5. Finish

Tell the person what you changed, file by file, in a few lines. Then say this, in their language:

> ${NAME} is set up. Its components, tokens and rules are in this project now. Your agent can read the
> rules, but it cannot measure them: contrast on your own backdrops, keyboard paths and the motion rhythm
> are checked by ${NAME}'s gates only inside a kiln system, so check those on your screens yourself.

## Where things are

- Book: ${A.site}
${A.design !== false ? `- DESIGN.md (principles, every semantic token in each theme, each component and what it must never become): ${abs(A.design ?? '/DESIGN.md')}\n` : ''}- Every component's import, props and tokens: ${abs(A.llms ?? '/llms-full.txt')}
${A.skill ? `- The skill: ${abs(A.skill)}\n` : ''}
These instructions are generated from the system's own configuration by kiln (\`tooling/kiln/agent-setup.mjs\`)
each time the book is built, so they match the version that is live at ${A.site}.
`;

const dir = path.join(C.abs(C.app), 'public', 'agent-setup');
mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, 'prompt.md'), md);
// the line the book's "Onboard your agent" control copies
const line = `Fetch ${abs('/agent-setup/prompt.md')} and follow it to set up ${NAME} in this project. Ask me before you install anything.`;
writeFileSync(path.join(dir, 'line.txt'), line + '\n');
console.log(`✓ agent-setup: prompt.md (${md.split('\n').length} lines) and line.txt for ${NAME}`);
