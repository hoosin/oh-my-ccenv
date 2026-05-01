import { select } from '@inquirer/prompts';
import { listProfiles } from '../config/listProfiles.js';
import { info } from '../utils/log.js';
import { selectTheme, selectInstructions } from '../utils/theme.js';

export async function pickProfile(): Promise<string | null> {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    // This should technically never happen now because 'claude' is always there
    info('No profiles found.');
    return null;
  }

  return select({
    message: 'Select a profile:',
    choices: profiles.map((p) => ({ name: p, value: p })),
    theme: selectTheme,
    instructions: selectInstructions,
  });
}
