import { appendFileSync } from 'node:fs';
import { sessionsPath, ensureConfigDir } from '../config/paths.js';

interface SessionEntry {
  ts: number;
  profile: string;
  cwd: string;
  pid: number;
}

export function appendSessionLog(entry: SessionEntry): void {
  ensureConfigDir();
  appendFileSync(sessionsPath(), JSON.stringify(entry) + '\n');
}
