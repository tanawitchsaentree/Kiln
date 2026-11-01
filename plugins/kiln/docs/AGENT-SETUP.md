# Onboard your agent

The book's home page can carry one button that copies a line like this one.

> Fetch https://<site>/agent-setup/prompt.md and follow it to set up <System> in this project. Ask me
> before you install anything.

The person pastes it into Claude Code, Cursor, Codex or Copilot, and the agent does the setup. Pane was
the first system with it (2026-11-01).

## What makes it

`tooling/kiln/agent-setup.mjs` runs in verify before the book is built. It reads `kiln.config.json` →
`agentSetup` and writes two files into the book's public folder. `agent-setup/prompt.md` holds the
instructions, and `agent-setup/line.txt` holds the line the button copies. The starter's
`AgentOnboard` renders only when `line.txt` exists, so a system without a site shows no button.

```json
"agentSetup": {
  "site": "https://pane-design-system.pages.dev",
  "packages": [{ "name": "pane-react", "tarball": "/downloads/pane-react-0.7.0.tgz" }],
  "stylesheet": "pane-react/all.css", "react": "18 or newer",
  "mcp": { "name": "pane", "command": "npx pane-mcp" },
  "skill": "/skill.md", "design": "/DESIGN.md", "llms": "/llms-full.txt",
  "starter": "<a small TSX check the agent renders>"
}
```

The install line has to work today (rule 17). Before a package is on a registry, the book hosts its
tarball, and Pane's `release:pack` copies the newest one into `apps/docs/public/downloads/`.

## How it differs from other setup prompts

Most agent-setup pages tell the agent to run every step without asking, install globally with `--yes`
and log in through a browser. kiln's prompt does it the other way round.

1. The agent reads the project first, then lists what it will add and which files it will touch, and
   asks once.
2. It installs into the project only, never globally, and uses the project's own package manager.
3. It never reads, asks for or stores a credential, and nothing in it needs an account.
4. It proves the setup by rendering one component and running the project's typecheck and build.
5. It ends by naming what the agent cannot check. Contrast on the person's own backdrops, keyboard
   paths and the motion rhythm are measured only by the gates inside a kiln system.

The last point is the reason kiln exists. A prompt and a DESIGN.md tell an agent what the system is,
and only the gates show whether a screen holds to it.

## Checked on Pane

From an empty folder, `npm install` of the hosted tarball installed 62 packages, `pane-react/all.css`
resolved, and `npx pane-mcp` answered `tools/list` with its seven tools.
