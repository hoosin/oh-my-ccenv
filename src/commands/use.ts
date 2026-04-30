import { existsSync } from 'node:fs';
import { profilePath } from '../config/paths.js';
import { writeCurrent } from '../config/current.js';
import { success, error } from '../utils/log.js';

export async function useCommand(name: string): Promise<void> {
  if (!existsSync(profilePath(name))) {
    error(`Profile "${name}" not found. Run \`ccenv add ${name}\` to create it.`);
    process.exit(1);
  }
  writeCurrent(name);
  success(`Switched to "${name}"`);
}
