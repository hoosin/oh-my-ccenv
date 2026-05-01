import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function manCommand(): Promise<void> {
  const manPath = join(__dirname, '..', 'man', 'ccenv.1');
  if (!existsSync(manPath)) {
    console.log('Man page not found.');
    return;
  }
  spawnSync('man', [manPath], { stdio: 'inherit' });
}
