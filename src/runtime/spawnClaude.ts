import { spawn } from 'node:child_process';
import { interpolateEnv } from '../config/interpolate.js';
import { findClaude } from './findClaude.js';

export async function spawnClaude(
  profileName: string,
  profileEnv: Record<string, string>,
  args: string[]
): Promise<void> {
  const claudeBin = findClaude();
  if (!claudeBin) {
    throw new Error(
      'claude not found on PATH. Install it: npm i -g @anthropic-ai/claude-code'
    );
  }

  const interpolated = interpolateEnv(profileEnv);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    CCENV_PROFILE: profileName,
    ...interpolated,
  };

  // If the profile defines ANTHROPIC_AUTH_TOKEN, ensure it's not shadowed by an existing ANTHROPIC_API_KEY in the shell
  if (interpolated.ANTHROPIC_AUTH_TOKEN && !interpolated.ANTHROPIC_API_KEY) {
    env.ANTHROPIC_API_KEY = '';
  }

  // Windows: claude is typically a .cmd shim. Since Node 18.20 / 20.11
  // (CVE-2024-27980), spawning .cmd/.bat without shell:true throws EINVAL.
  const useShell = process.platform === 'win32';

  return new Promise((resolve, reject) => {
    const child = spawn(claudeBin, args, { env, stdio: 'inherit', shell: useShell });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        process.exit(code ?? 1);
      }
    });
    child.on('error', reject);
  });
}
