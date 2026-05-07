import { existsSync } from 'node:fs';
import { profilePath } from '../config/paths.js';
import { writeCurrent, readCurrent } from '../config/current.js';
import { loadProfile } from '../config/loadProfile.js';
import { spawnClaude } from '../runtime/spawnClaude.js';
import { error } from '../utils/log.js';

export async function launchCommand(name?: string): Promise<void> {
  let profileName: string;

  if (name) {
    // ccenv <name>: switch + launch
    if (name !== 'claude' && !existsSync(profilePath(name))) {
      error(
        `Profile "${name}" not found. Run \`ccenv add ${name}\` to create it.`
      );
      process.exit(1);
    }
    writeCurrent(name);
    profileName = name;
  } else {
    // ccenv (no args): launch with current profile
    const current = readCurrent() || 'claude';
    if (current !== 'claude' && !existsSync(profilePath(current))) {
      error(
        `Current profile "${current}" no longer exists. Run \`ccenv use\` to pick another.`
      );
      process.exit(1);
    }
    profileName = current;
  }

  const profile = loadProfile(profileName);

  // Strip the profile name from arguments if it was used to select the profile
  let args = process.argv.slice(2);
  if (name && args[0] === name) {
    args = args.slice(1);
  }

  await spawnClaude(profileName, profile.env as Record<string, string>, args);
}
