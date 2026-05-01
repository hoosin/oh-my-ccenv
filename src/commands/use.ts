import { existsSync } from 'node:fs';
import { select } from '@inquirer/prompts';
import { profilePath } from '../config/paths.js';
import { listProfiles } from '../config/listProfiles.js';
import { writeCurrent } from '../config/current.js';
import { formatProfileChoice } from '../utils/formatProfile.js';
import { success, error } from '../utils/log.js';
import { selectTheme, selectInstructions } from '../utils/theme.js';

export async function useCommand(name?: string): Promise<void> {
  try {
    if (!name) {
      const profiles = listProfiles();
      if (profiles.length === 0) {
        error('No profiles found. Run `ccenv add <name>` to create one.');
        process.exit(1);
      }
      name = await select({
        message: 'Select a profile to use:',
        choices: profiles.map((name) => formatProfileChoice(name)),
        theme: selectTheme,
        instructions: selectInstructions,
      });
    }

    if (name !== 'claude' && !existsSync(profilePath(name))) {
      error(
        `Profile "${name}" not found. Run \`ccenv add ${name}\` to create it.`
      );
      process.exit(1);
    }
    writeCurrent(name);
    success(`Switched to "${name}"`);
  } catch (err: any) {
    if (err.name === 'ExitPromptError') {
      process.exit(0);
    }
    throw err;
  }
}
