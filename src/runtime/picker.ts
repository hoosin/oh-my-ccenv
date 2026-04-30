import { select } from '@inquirer/prompts';
import { listProfiles } from '../config/listProfiles.js';

export async function pickProfile(): Promise<string> {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    throw new Error('No profiles found. Run `ccenv add <name>` to create one.');
  }

  return select({
    message: 'Select a profile:',
    choices: profiles.map((p) => ({ name: p, value: p })),
    instructions: {
      navigation: 'Press Ctrl+C to cancel',
      pager: 'Press ↑↓ to scroll',
    },
  });
}
