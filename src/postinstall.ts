import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, '..', 'templates');

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg || join(process.env.HOME || '~', '.config');
  return join(base, 'ccenv');
}

function profilesDir(): string {
  return join(configDir(), 'profiles');
}

try {
  const pDir = profilesDir();

  if (!existsSync(pDir)) {
    mkdirSync(pDir, { recursive: true, mode: 0o700 });

    if (existsSync(templatesDir)) {
      const files = readdirSync(templatesDir).filter((f) => f.endsWith('.toml'));
      for (const file of files) {
        copyFileSync(join(templatesDir, file), join(pDir, file));
      }
    }
  }
} catch {
  // postinstall failure should not block installation
}
