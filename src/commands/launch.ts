import { existsSync } from 'node:fs';
import { profilePath, isReserved, isValidProfileName, INVALID_NAME_HINT } from '../config/paths.js';
import { writeCurrent, readCurrent } from '../config/current.js';
import { loadProfile } from '../config/load-profile.js';
import { spawnClaude } from '../runtime/spawn-claude.js';
import { error } from '../utils/log.js';

export async function launchCommand(name: string | undefined, args: string[]): Promise<void> {
  let profileName: string;

  if (name) {
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
    profileName = name;
  } else {
    const current = readCurrent() || 'claude';
    if (!isReserved(current) && !existsSync(profilePath(current))) {
      error(
        `Current profile "${current}" no longer exists. Run \`ccenv use\` to pick another.`
      );
      process.exit(1);
    }
    profileName = current;
  }

  const profile = loadProfile(profileName);
  // zod's passthrough types unknown keys as `unknown`. Filter to string-valued
  // entries before spawning — guarantees the shape spawnClaude expects without
  // a lying cast.
  const env: Record<string, string> = Object.fromEntries(
    Object.entries(profile.env).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    )
  );
  const code = await spawnClaude(profileName, env, args);
  if (code !== 0) process.exit(code);
}
