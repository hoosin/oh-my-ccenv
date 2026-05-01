import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { profilePath } from '../config/paths.js';
import { readCurrent } from '../config/current.js';
import { error, info } from '../utils/log.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function editCommand(name?: string, reset?: boolean): Promise<void> {
  const target = name || readCurrent();
  if (!target) {
    error(
      'No current profile set. Run `ccenv edit <name>` or set a current profile first.'
    );
    process.exit(1);
  }

  const p = profilePath(target);
  const templatePath = join(__dirname, '..', 'templates', `${target}.toml`);
  const hasTemplate = existsSync(templatePath);

  if (reset) {
    if (!hasTemplate) {
      error(`No template found for "${target}".`);
      process.exit(1);
    }
    info(`Regenerating "${target}" from template...`);
    writeFileSync(p, readFileSync(templatePath, 'utf-8'));
  } else if (!existsSync(p)) {
    if (hasTemplate) {
      info(`Initializing "${target}" profile from template...`);
      writeFileSync(p, readFileSync(templatePath, 'utf-8'));
    } else {
      error(`Profile "${target}" not found.`);
      process.exit(1);
    }
  }

  const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
  spawnSync(editor, [p], { stdio: 'inherit' });
}
