import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function listJsonlFiles(projectsDir: string): string[] {
  if (!existsSync(projectsDir)) return [];
  const files: string[] = [];
  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && entry.name.endsWith('.jsonl')) files.push(p);
    }
  }
  walk(projectsDir);
  return files;
}
