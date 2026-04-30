import { readdirSync, existsSync } from 'node:fs';
import { profilesDir } from './paths.js';

export function listProfiles(): string[] {
  const dir = profilesDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.toml'))
    .map((f) => f.replace(/\.toml$/, ''))
    .sort();
}
