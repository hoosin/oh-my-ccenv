import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { profilePath } from '../config/paths.js';
import { readCurrent } from '../config/current.js';
import { error, info } from '../utils/log.js';

export async function editCommand(name?: string): Promise<void> {
  const target = name || readCurrent();
  if (!target) {
    error('No current profile set. Run `ccenv edit <name>` or set a current profile first.');
    process.exit(1);
  }

  const p = profilePath(target);
  if (!existsSync(p)) {
    if (target === 'claude') {
      info('The "claude" profile is currently using built-in official settings.');
      info('To customize it, run `ccenv add claude`.');
      return;
    }
    error(`Profile "${target}" not found.`);
    process.exit(1);
  }

  const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
  spawnSync(editor, [p], { stdio: 'inherit' });
}
