import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { profilePath } from '../config/paths.js';
import { readCurrent } from '../config/current.js';
import { error, info } from '../utils/log.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function editCommand(name?: string): Promise<void> {
  const target = name || readCurrent();
  if (!target) {
    error(
      'No current profile set. Run `ccenv edit <name>` or set a current profile first.'
    );
    process.exit(1);
  }

  const p = profilePath(target);
  if (!existsSync(p)) {
    if (target === 'claude') {
      info('Initializing "claude" profile with official settings...');
      const templatePath = join(__dirname, '..', 'templates', 'anthropic.toml');
      if (existsSync(templatePath)) {
        writeFileSync(p, readFileSync(templatePath, 'utf-8'));
      } else {
        // Fallback if template missing
        writeFileSync(
          p,
          'description = "Anthropic Official"\n\n[env]\nANTHROPIC_BASE_URL = "https://api.anthropic.com"\nANTHROPIC_AUTH_TOKEN = "${ANTHROPIC_API_KEY}"\nANTHROPIC_MODEL = "claude-3-5-sonnet-20241022"\n'
        );
      }
    } else {
      error(`Profile "${target}" not found.`);
      process.exit(1);
    }
  }

  const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
  spawnSync(editor, [p], { stdio: 'inherit' });
}
