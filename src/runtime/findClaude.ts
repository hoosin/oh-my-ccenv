import { existsSync } from 'node:fs';
import { join, delimiter } from 'node:path';

export function findClaude(): string | null {
  const path = process.env.PATH;
  if (!path) return null;
  const exts = process.platform === 'win32' ? ['.cmd', '.exe', '.bat', ''] : [''];
  for (const dir of path.split(delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = join(dir, `claude${ext}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}
