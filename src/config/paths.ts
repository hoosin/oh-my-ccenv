import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

export function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg || join(process.env.HOME || '~', '.config');
  return join(base, 'ccenv');
}

export function profilesDir(): string {
  return join(configDir(), 'profiles');
}

export function profilePath(name: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`Invalid profile name: "${name}". Only alphanumeric, underscores, and hyphens are allowed.`);
  }
  return join(profilesDir(), `${name}.toml`);
}

export function currentPath(): string {
  return join(configDir(), 'current');
}

export function statsCachePath(): string {
  return join(configDir(), 'stats.cache.json');
}

export function modelsCachePath(): string {
  return join(configDir(), 'models.cache.json');
}

export function ensureConfigDir(): void {
  const dir = configDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  const pDir = profilesDir();
  if (!existsSync(pDir)) {
    mkdirSync(pDir, { recursive: true, mode: 0o700 });
  }
}
