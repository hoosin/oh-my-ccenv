import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function manCommand(): Promise<void> {
  // try installed location first, then dev location
  const candidates = [
    join(__dirname, '..', '..', 'man', 'ccenv.1'),
    join(__dirname, '..', 'man', 'ccenv.1'),
  ];

  const manPath = candidates.find((p) => existsSync(p));
  if (!manPath) {
    console.log('Man page not found.');
    return;
  }

  execSync(`man "${manPath}"`, { stdio: 'inherit' });
}
