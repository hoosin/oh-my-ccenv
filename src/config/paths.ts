import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const RESERVED_NAMES = new Set(['claude']);

export function isReserved(name: string): boolean {
  return RESERVED_NAMES.has(name);
}

const VALID_NAME_RE = /^[a-zA-Z0-9_-]+$/;

// Windows kernel-reserved device names. Creating "con.toml" etc. on Windows
// produces undefined behavior (open hangs or returns ENOENT/EACCES depending
// on subsystem). Reject regardless of host platform so a profile created on
// Linux doesn't break for a Windows teammate sharing the config dir.
const WIN_RESERVED_NAMES = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);

export function isValidProfileName(name: string): boolean {
  if (!VALID_NAME_RE.test(name)) return false;
  if (WIN_RESERVED_NAMES.has(name.toLowerCase())) return false;
  return true;
}

export const INVALID_NAME_HINT =
  'Only letters, digits, underscores, and hyphens are allowed (and not a Windows reserved name like "con" or "nul").';

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

export function migrationMarkerPath(): string {
  return join(configDir(), '.migrated-template-purge');
}

// Bundled resources: shipped inside the npm package, resolved relative to dist/.
// Compiled mode is the common path (dist/<chunk>.js → ../templates); source-mode
// fallback (src/config/paths.ts → ../../templates) comes second so a stray
// same-named dir at the grandparent can't shadow the real one in production.
function findBundledDir(name: string): string | null {
  const candidates = [
    join(__dirname, '..', name),
    join(__dirname, '..', '..', name),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

export function bundledTemplatesDir(): string | null {
  return findBundledDir('templates');
}

export function bundledTemplatePath(id: string): string | null {
  const dir = bundledTemplatesDir();
  return dir ? join(dir, `${id}.toml`) : null;
}

export function bundledManPath(): string | null {
  const dir = findBundledDir('man');
  return dir ? join(dir, 'ccenv.1') : null;
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
