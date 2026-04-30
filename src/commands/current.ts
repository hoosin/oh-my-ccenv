import pc from 'picocolors';
import { readCurrent } from '../config/current.js';
import { loadProfile } from '../config/loadProfile.js';
import { interpolateEnv } from '../config/interpolate.js';
import { error } from '../utils/log.js';

export async function currentCommand(): Promise<void> {
  const name = readCurrent();
  if (!name) {
    error('No current profile set. Run `ccenv use <name>` or `ccenv <name>`.');
    return;
  }

  try {
    const profile = loadProfile(name);
    const env = interpolateEnv(profile.env as Record<string, string>);
    console.log(pc.bold(name));
    for (const [k, v] of Object.entries(env)) {
      console.log(`  ${pc.cyan(k)}=${v}`);
    }
  } catch {
    error(`Profile "${name}" is invalid.`);
  }
}
