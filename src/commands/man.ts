import { spawnSync } from 'node:child_process';
import { bundledManPath } from '../config/paths.js';

export async function manCommand(): Promise<void> {
  const manPath = bundledManPath();
  if (!manPath) {
    console.log('Man page not found.');
    return;
  }
  if (process.platform === 'win32') {
    console.log(
      `man(1) is not available on Windows. Run \`ccenv help\` for command help, ` +
        `or open the raw page at:\n  ${manPath}`
    );
    return;
  }
  const result = spawnSync('man', [manPath], { stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    console.log(
      `man(1) failed or is not installed. Open the raw page at:\n  ${manPath}\n` +
        `Or run \`ccenv help\` for inline help.`
    );
  }
}
