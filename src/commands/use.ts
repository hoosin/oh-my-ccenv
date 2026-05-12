import { existsSync } from 'node:fs';
import { select } from '@inquirer/prompts';
import { profilePath, isReserved, isValidProfileName, INVALID_NAME_HINT } from '../config/paths.js';
import { listProfiles } from '../config/list-profiles.js';
import { writeCurrent, readCurrent } from '../config/current.js';
import { formatProfileChoice } from '../utils/format-profile.js';
import { success, error } from '../utils/log.js';
import { selectTheme, selectInstructions } from '../utils/theme.js';

export async function useCommand(name?: string): Promise<void> {
  if (!name) {
    const profiles = listProfiles();
    if (profiles.length === 0) {
      error('No profiles found. Run `ccenv add <name>` to create one.');
      process.exit(1);
    }
    const current = readCurrent();
    name = await select({
      message: 'Select a profile to use:',
      choices: profiles.map((name) => formatProfileChoice(name)),
      default: current || undefined,
      theme: selectTheme,
      instructions: selectInstructions,
    });
  }

  if (!isValidProfileName(name)) {
    error(`Invalid profile name: "${name}". ${INVALID_NAME_HINT}`);
    process.exit(1);
  }

  if (!isReserved(name) && !existsSync(profilePath(name))) {
    error(
      `Profile "${name}" not found. Run \`ccenv add ${name}\` to create it.`
    );
    process.exit(1);
  }
  writeCurrent(name);
  success(`Switched to "${name}"`);
}
