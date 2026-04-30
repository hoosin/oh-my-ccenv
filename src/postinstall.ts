import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg || join(process.env.HOME || '~', '.config');
  return join(base, 'ccenv');
}

try {
  const dir = configDir();
  if (!existsSync(dir)) {
    mkdirSync(join(dir, 'profiles'), { recursive: true, mode: 0o700 });
  }
} catch {
  // postinstall failure should not block installation
}
