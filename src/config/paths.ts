import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';

export const RESERVED_NAMES = new Set(['claude']);

export function isReserved(name: string): boolean {
  return RESERVED_NAMES.has(name);
}

const VALID_NAME_RE = /^[a-zA-Z0-9_-]+$/;

export function isValidProfileName(name: string): boolean {
  return VALID_NAME_RE.test(name);
}

export const INVALID_NAME_HINT =
  'Only letters, digits, underscores, and hyphens are allowed.';

export function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) return join(xdg, 'ccenv');
  if (process.platform === 'win32') {
    const appdata = process.env.APPDATA;
    if (appdata) return join(appdata, 'ccenv');
  }
  return join(homedir(), '.config', 'ccenv');
}

export function profilesDir(): string {
  return join(configDir(), 'profiles');
}

export function profilePath(name: string): string {
  if (!isValidProfileName(name)) {
    throw new Error(`Invalid profile name: "${name}". ${INVALID_NAME_HINT}`);
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
