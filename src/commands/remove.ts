import { unlinkSync, existsSync } from 'node:fs';
import { confirm, select } from '@inquirer/prompts';
import { profilePath } from '../config/paths.js';
import { listProfiles } from '../config/listProfiles.js';
import { readCurrent, writeCurrent } from '../config/current.js';
import { formatProfileChoice } from '../utils/formatProfile.js';
import { success, error, info } from '../utils/log.js';
import { selectTheme, selectInstructions } from '../utils/theme.js';

export async function removeCommand(name?: string): Promise<void> {
  try {
    if (!name) {
      const profiles = listProfiles().filter((p) => existsSync(profilePath(p)));
      if (profiles.length === 0) {
        info('No profiles to delete.');
        return;
      }
      const current = readCurrent();
      name = await select({
        message: 'Select a profile to delete:',
        choices: profiles.map((name) => formatProfileChoice(name)),
        default: current || undefined,
        theme: selectTheme,
        instructions: selectInstructions,
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
  } catch (err: any) {
    if (err.name === 'ExitPromptError') {
      process.exit(0);
    }
    throw err;
  }
}
