import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg || join(process.env.HOME || '~', '.config');
  return join(base, 'ccenv');
}

try {
  const dir = configDir();
  const profDir = join(dir, 'profiles');
  if (!existsSync(profDir)) {
    mkdirSync(profDir, { recursive: true, mode: 0o700 });

    // Initial install: copy templates to profiles
    const templatesDir = join(__dirname, '..', 'templates');
    if (existsSync(templatesDir)) {
      for (const file of readdirSync(templatesDir)) {
        if (file.endsWith('.toml')) {
          copyFileSync(join(templatesDir, file), join(profDir, file));
        }
      }
    }
  }
} catch (err) {
  // postinstall failure should not block installation
}
