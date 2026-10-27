// Reads system/kiln.config.json — the one place a system's own names live (sidebar categories,
// the public exports a consumer must be able to import, names a rename retired). Tooling stays
// system-less: anything that used to be a Dial string hard-coded in a gate reads from here, so the
// engine never ships with another system's answers baked in.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONFIG_PATH = path.join(REPO_ROOT, 'system', 'kiln.config.json');

export function loadSystemConfig(configPath = CONFIG_PATH) {
  if (!existsSync(configPath)) {
    throw new Error(`${path.relative(REPO_ROOT, configPath)} missing — copy templates/system/kiln.config.json (or run /new-system)`);
  }
  return JSON.parse(readFileSync(configPath, 'utf8'));
}
