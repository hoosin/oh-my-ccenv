import pc from 'picocolors';
import { readCurrent } from '../config/current.js';
import { loadProfile } from '../config/loadProfile.js';
import { interpolateEnv } from '../config/interpolate.js';
import { error } from '../utils/log.js';

const SECRET_KEY_RE = /(TOKEN|KEY|SECRET|PASSWORD)/i;

function maskSecret(value: string): string {
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export async function currentCommand(opts?: { showSecrets?: boolean }): Promise<void> {
  const name = readCurrent();
  if (!name) {
    error('No current profile set. Run `ccenv use [name]` or `ccenv [name]`.');
    process.exit(1);
  }

  try {
    const profile = loadProfile(name);
    const env = interpolateEnv(profile.env as Record<string, string>);
    console.log(pc.bold(name));
    for (const [k, v] of Object.entries(env)) {
      const display =
        !opts?.showSecrets && SECRET_KEY_RE.test(k) && v ? maskSecret(v) : v;
      console.log(`  ${pc.cyan(k)}=${display}`);
    }
    if (!opts?.showSecrets && Object.keys(env).some((k) => SECRET_KEY_RE.test(k))) {
      console.log(pc.dim('  (use --show-secrets to reveal full values)'));
    }
  } catch {
    error(`Profile "${name}" is invalid.`);
    process.exit(1);
  }
}
