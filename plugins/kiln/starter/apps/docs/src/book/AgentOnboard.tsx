// "Onboard your agent": one press copies the line a person pastes into a coding agent. The line and the
// instructions it points at (/agent-setup/prompt.md) are written by tooling/kiln/agent-setup.mjs from
// kiln.config.json → agentSetup; until that block names a site there is no line, and nothing renders.
// The instructions ask before installing, install into the project only and never touch a credential.
// Swap the button for the system's own Button once wave 1 has one.
import { useEffect, useRef, useState } from 'react';
import { Link } from './kit';

export function AgentOnboard({ name }: { name: string }) {
  const [line, setLine] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    fetch('/agent-setup/line.txt').then((r) => (r.ok ? r.text() : null)).then((t) => setLine(t?.trim() || null)).catch(() => setLine(null));
    return () => clearTimeout(timer.current);
  }, []);
  if (!line) return null;
  const copy = async () => {
    clearTimeout(timer.current);
    try { await navigator.clipboard.writeText(line); setState('copied'); timer.current = setTimeout(() => setState('idle'), 2600); }
    catch { setState('failed'); }
  };
  return (
    <div className="agent-onboard">
      <button type="button" className="agent-pill" onClick={copy} aria-describedby="agent-onboard-note">
        {state === 'copied' ? 'Copied. Paste it into your agent' : `Onboard your agent to ${name}`}
      </button>
      <p id="agent-onboard-note" className="muted agent-note" aria-live="polite">
        {state === 'failed'
          ? <>Copying was blocked. Copy this line yourself: <code>{line}</code></>
          : <>Copies one line for Claude Code, Cursor, Codex or Copilot. It asks before installing anything. <a href="/agent-setup/prompt.md">Read the prompt</a></>}
      </p>
    </div>
  );
}
