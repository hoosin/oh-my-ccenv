import { readdirSync, existsSync } from 'node:fs';
import { profilesDir } from './paths.js';

export function listProfiles(): string[] {
  const dir = profilesDir();
  const profiles = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.toml'))
        .map((f) => f.replace(/\.toml$/, ''))
    : [];

  if (!profiles.includes('claude')) {
    profiles.push('claude');
  }

  return profiles.sort();
}
