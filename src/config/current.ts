import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { currentPath, ensureConfigDir } from './paths.js';

export function readCurrent(): string | null {
  const p = currentPath();
  if (!existsSync(p)) return null;
  const content = readFileSync(p, 'utf-8').trim();
  return content || null;
}

export function writeCurrent(name: string): void {
  ensureConfigDir();
  writeFileSync(currentPath(), name + '\n', { mode: 0o600 });
}
