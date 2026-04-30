import { unlinkSync, existsSync } from 'node:fs';
import { confirm } from '@inquirer/prompts';
import { profilePath } from '../config/paths.js';
import { readCurrent, writeCurrent } from '../config/current.js';
import { success, error, info } from '../utils/log.js';

export async function rmCommand(name: string): Promise<void> {
  const p = profilePath(name);
  if (!existsSync(p)) {
    error(`Profile "${name}" not found.`);
    process.exit(1);
  }

  const ok = await confirm({
    message: `Delete profile "${name}"?`,
    default: false,
  });

  if (!ok) {
    info('Cancelled.');
    return;
  }

  unlinkSync(p);

  if (readCurrent() === name) {
    writeCurrent('');
  }

  success(`Removed profile "${name}"`);
}
