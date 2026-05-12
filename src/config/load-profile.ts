import { readFileSync, existsSync } from 'node:fs';
import { parse } from 'smol-toml';
import { z } from 'zod';
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
  let data: unknown;
  try {
    data = parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Profile "${name}" has malformed TOML: ${msg}`);
  }
  try {
    return profileSchema.parse(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      const path = first.path.length > 0 ? first.path.join('.') : '<root>';
      throw new Error(
        `Profile "${name}" is invalid: ${path} ${first.message.toLowerCase()}` +
          (err.issues.length > 1 ? ` (+ ${err.issues.length - 1} more issue(s))` : '')
      );
    }
    throw err;
  }
}
