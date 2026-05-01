import pc from 'picocolors';
import { loadProfile } from '../config/loadProfile.js';

export function formatProfileChoice(name: string): { name: string; value: string } {
  let desc = '';
  let model = '';
  try {
    const profile = loadProfile(name);
    desc = profile.description ? pc.dim(` — ${profile.description}`) : '';
    model = profile.env.ANTHROPIC_MODEL ? pc.dim(` (${profile.env.ANTHROPIC_MODEL})`) : '';
  } catch (err) {
    const msg = err instanceof Error ? `: ${err.message}` : '';
    desc = pc.red(` (invalid${msg})`);
  }
  return { name: `${name}${desc}${model}`, value: name };
}

export function formatProfileList(name: string, isCurrent: boolean): string {
  const marker = isCurrent ? pc.green('* ') : '  ';
  let desc = '';
  let model = '';
  try {
    const profile = loadProfile(name);
    desc = profile.description ? pc.dim(` — ${profile.description}`) : '';
    model = profile.env.ANTHROPIC_MODEL ? pc.dim(` (${profile.env.ANTHROPIC_MODEL})`) : '';
    return `${marker}${pc.bold(name)}${desc}${model}`;
  } catch (err) {
    const msg = err instanceof Error ? `: ${err.message}` : '';
    return `${marker}${pc.bold(name)}${pc.red(` (invalid${msg})`)}`;
  }
}
