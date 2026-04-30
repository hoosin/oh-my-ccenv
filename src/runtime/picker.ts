import { select } from '@inquirer/prompts';
import { listProfiles } from '../config/listProfiles.js';
import { info } from '../utils/log.js';

export async function pickProfile(): Promise<string | null> {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    info('No profiles found. Run `ccenv add <name>` to create one.');
    return null;
  }

  const picked = await select({
    message: 'Select a profile:',
    choices: [
      ...profiles.map((p) => ({ name: p, value: p })),
      { name: 'Exit', value: '__exit__' },
    ],
    instructions: {
      navigation: 'Press ↑↓ to navigate, ⏎ to select, Ctrl+C to cancel',
      pager: 'Press ↑↓ to scroll',
    },
  });

  return picked === '__exit__' ? null : picked;
}
