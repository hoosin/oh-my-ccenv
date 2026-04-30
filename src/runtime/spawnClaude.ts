import { spawn } from 'node:child_process';
import { interpolateEnv } from '../config/interpolate.js';
import { appendSessionLog } from './sessionLog.js';
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
    ANTHROPIC_API_KEY: '', // safety net: prevent shell export from overriding
    ...interpolated,
    CCENV_PROFILE: profileName,
  };

  appendSessionLog({
    ts: Date.now(),
    profile: profileName,
    cwd: process.cwd(),
    pid: process.pid,
  });

  return new Promise((resolve, reject) => {
    const child = spawn(claudeBin, args, { env, stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`claude exited with code ${code}`));
    });
    child.on('error', reject);
  });
}
