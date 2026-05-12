import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { parse, stringify } from 'smol-toml';
import { profilePath, ensureConfigDir } from './paths.js';
import { profileSchema, type Profile } from './schema.js';

interface SaveProfileInput {
  description?: string;
  env: Record<string, string>;
}

export function saveProfile(name: string, data: SaveProfileInput): void {
  ensureConfigDir();
  const p = profilePath(name);

  // patch-style: if file exists, validate + preserve unknown top-level keys
  let existing: Profile | null = null;
  if (existsSync(p)) {
    existing = profileSchema.parse(parse(readFileSync(p, 'utf-8')));
  }

  const merged = {
    ...(existing ?? {}),
    ...(data.description ? { description: data.description } : {}),
    env: { ...(existing?.env ?? {}), ...data.env },
  };

  writeFileSync(p, stringify(merged), { mode: 0o600 });
}
