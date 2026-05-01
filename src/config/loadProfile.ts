import { readFileSync, existsSync } from 'node:fs';
import { parse } from 'smol-toml';
import { profilePath } from './paths.js';
import { profileSchema, type Profile } from './schema.js';

export function loadProfile(name: string): Profile {
  const p = profilePath(name);
  if (!existsSync(p)) {
    if (name === 'claude') {
      return {
        description: 'Official Anthropic Claude',
        env: {},
      };
    }
    throw new Error(`Profile "${name}" not found: ${p}`);
  }
  const raw = readFileSync(p, 'utf-8');
  const data = parse(raw);
  return profileSchema.parse(data);
}
