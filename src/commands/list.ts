import { listProfiles } from '../config/listProfiles.js';
import { readCurrent } from '../config/current.js';
import { formatProfileList } from '../utils/formatProfile.js';

export async function listCommand(): Promise<void> {
  const profiles = listProfiles();
  const current = readCurrent();

  for (const name of profiles) {
    console.log(formatProfileList(name, name === current));
  }
}
