import { existsSync } from 'node:fs';
import { profilePath } from '../config/paths.js';
import { writeCurrent } from '../config/current.js';
import { loadProfile } from '../config/loadProfile.js';
import { spawnClaude } from '../runtime/spawnClaude.js';
import { pickProfile } from '../runtime/picker.js';
import { error } from '../utils/log.js';

export async function launchCommand(name?: string): Promise<void> {
  let profileName: string;

  if (name) {
    // ccenv <name>: switch + launch
    if (!existsSync(profilePath(name))) {
      error(`Profile "${name}" not found. Run \`ccenv add ${name}\` to create it.`);
      process.exit(1);
    }
    writeCurrent(name);
    profileName = name;
  } else {
    // ccenv (no args): always open interactive picker
    const picked = await pickProfile();
    if (!picked) return;
    profileName = picked;
    writeCurrent(profileName);
  }

  const profile = loadProfile(profileName);
  await spawnClaude(profileName, profile.env as Record<string, string>, process.argv.slice(2));
}
