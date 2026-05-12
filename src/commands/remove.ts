import { unlinkSync, existsSync } from 'node:fs';
import { confirm, select } from '@inquirer/prompts';
import { profilePath, isReserved, isValidProfileName, INVALID_NAME_HINT } from '../config/paths.js';
import { listProfiles } from '../config/list-profiles.js';
import { readCurrent, writeCurrent } from '../config/current.js';
import { formatProfileChoice } from '../utils/format-profile.js';
import { success, error, info } from '../utils/log.js';
import { selectTheme, selectInstructions } from '../utils/theme.js';

export async function removeCommand(name?: string): Promise<void> {
  if (!name) {
    const profiles = listProfiles().filter(
      (p) => !isReserved(p) && existsSync(profilePath(p))
    );
    if (profiles.length === 0) {
      info('No profiles to delete.');
      return;
    }
    const current = readCurrent();
    name = await select({
      message: 'Select a profile to delete:',
      choices: profiles.map((name) => formatProfileChoice(name)),
      default: current && !isReserved(current) ? current : undefined,
      theme: selectTheme,
      instructions: selectInstructions,
    });
  } else {
    if (!isValidProfileName(name)) {
      error(`Invalid profile name: "${name}". ${INVALID_NAME_HINT}`);
      process.exit(1);
    }
    if (isReserved(name)) {
      error(
        `"${name}" is a reserved name (built-in stock Anthropic) and cannot be removed. Use \`ccenv edit ${name}\` to customize it.`
      );
      process.exit(1);
    }
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
