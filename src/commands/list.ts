import { listProfiles } from '../config/listProfiles.js';
import { readCurrent } from '../config/current.js';
import { formatProfileList } from '../utils/formatProfile.js';
import { error } from '../utils/log.js';

export async function listCommand(): Promise<void> {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    error('No profiles found. Run `ccenv add <name>` to create one.');
    return;
  }

  const current = readCurrent();

  for (const name of profiles) {
    console.log(formatProfileList(name, name === current));
  }
}
