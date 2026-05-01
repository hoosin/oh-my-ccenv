import pc from 'picocolors';
import { listProfiles } from '../config/listProfiles.js';
import { readCurrent } from '../config/current.js';
import { loadProfile } from '../config/loadProfile.js';
import { error } from '../utils/log.js';

export async function listCommand(): Promise<void> {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    error('No profiles found. Run `ccenv add <name>` to create one.');
    return;
  }

  const current = readCurrent();

  for (const name of profiles) {
    const marker = name === current ? pc.green('* ') : '  ';
    try {
      const profile = loadProfile(name);
      const desc = profile.description ? pc.dim(` — ${profile.description}`) : '';
      const model = profile.env.ANTHROPIC_MODEL ? pc.dim(` (${profile.env.ANTHROPIC_MODEL})`) : '';
      console.log(`${marker}${pc.bold(name)}${desc}${model}`);
    } catch (err) {
      const msg = err instanceof Error ? `: ${err.message}` : '';
      console.log(`${marker}${pc.bold(name)}${pc.red(` (invalid${msg})`)}`);
    }
  }
}
