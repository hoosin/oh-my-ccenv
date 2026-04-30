import { execFileSync } from 'node:child_process';

export function findClaude(): string | null {
  try {
    return execFileSync('which', ['claude'], { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}
