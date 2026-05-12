import { spawn } from 'node:child_process';
import { interpolateEnv } from '../utils/interpolate.js';
import { findClaude } from './find-claude.js';

export async function spawnClaude(
  profileName: string,
  profileEnv: Record<string, string>,
  args: string[]
): Promise<number> {
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

  // If the profile declares ANTHROPIC_AUTH_TOKEN but not ANTHROPIC_API_KEY,
  // force-clear API_KEY in the child env so the shell's exported personal
  // key can't leak to a third-party base_url. Check raw profile keys (not
  // interpolated values) — a `${UNDEFINED_VAR}` placeholder resolves to ''
  // (falsy), but the user's intent was still "use third-party auth".
  if (
    'ANTHROPIC_AUTH_TOKEN' in profileEnv &&
    !('ANTHROPIC_API_KEY' in profileEnv)
  ) {
    env.ANTHROPIC_API_KEY = '';
  }

  // Windows: claude is typically a .cmd shim. Since Node 18.20 / 20.11
  // (CVE-2024-27980), spawning .cmd/.bat without shell:true throws EINVAL.
  const useShell = process.platform === 'win32';

  return new Promise<number>((resolve, reject) => {
    const child = spawn(claudeBin, args, { env, stdio: 'inherit', shell: useShell });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', reject);
  });
}
