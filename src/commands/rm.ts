import { unlinkSync, existsSync } from 'node:fs';
import { confirm, select } from '@inquirer/prompts';
import { profilePath } from '../config/paths.js';
import { listProfiles } from '../config/listProfiles.js';
import { readCurrent, writeCurrent } from '../config/current.js';
import { success, error, info } from '../utils/log.js';

export async function rmCommand(name?: string): Promise<void> {
  if (!name) {
    const profiles = listProfiles();
    if (profiles.length === 0) {
      info('No profiles to delete.');
      return;
    }
    name = await select({
      message: 'Select a profile to delete:',
      choices: profiles.map((p) => ({ name: p, value: p })),
    });
  }

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
