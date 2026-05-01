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

  return new Promise((resolve, reject) => {
    const child = spawn(claudeBin, args, { env, stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`claude exited with code ${code}`));
    });
    child.on('error', reject);
  });
}
