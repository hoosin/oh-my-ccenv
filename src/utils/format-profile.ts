import pc from 'picocolors';
import { loadProfile } from '../config/load-profile.js';

interface Adornments {
  desc: string;
  model: string;
  builtin: string;
  invalid: string | null;
}

function getAdornments(name: string): Adornments {
  const builtin = name === 'claude' ? pc.cyan(' [built-in]') : '';
  try {
    const profile = loadProfile(name);
    return {
      desc: profile.description ? pc.dim(` — ${profile.description}`) : '',
      model: profile.env.ANTHROPIC_MODEL ? pc.dim(` (${profile.env.ANTHROPIC_MODEL})`) : '',
      builtin,
      invalid: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? `: ${err.message}` : '';
    return { desc: '', model: '', builtin: '', invalid: pc.red(` (invalid${msg})`) };
  }
}

export function formatProfileChoice(name: string): { name: string; value: string } {
  const a = getAdornments(name);
  const label = a.invalid
    ? `${name}${a.invalid}`
    : `${name}${a.builtin}${a.desc}${a.model}`;
  return { name: label, value: name };
}

export function formatProfileList(name: string, isCurrent: boolean): string {
  const marker = isCurrent ? pc.green('* ') : '  ';
  const a = getAdornments(name);
  return a.invalid
    ? `${marker}${pc.bold(name)}${a.invalid}`
    : `${marker}${pc.bold(name)}${a.builtin}${a.desc}${a.model}`;
}
