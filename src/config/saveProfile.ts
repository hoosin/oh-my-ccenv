import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { parse, stringify } from 'smol-toml';
import { profilePath, ensureConfigDir } from './paths.js';

interface SaveProfileInput {
  description?: string;
  env: Record<string, string>;
}

export function saveProfile(name: string, data: SaveProfileInput): void {
  ensureConfigDir();
  const p = profilePath(name);

  // patch-style: if file exists, preserve unknown top-level keys
  let existing: Record<string, unknown> = {};
  if (existsSync(p)) {
    existing = parse(readFileSync(p, 'utf-8'));
  }

  const merged = {
    ...existing,
    ...(data.description ? { description: data.description } : {}),
    env: { ...((existing.env as Record<string, string>) || {}), ...data.env },
  };

  writeFileSync(p, stringify(merged), { mode: 0o600 });
}
