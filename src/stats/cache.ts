import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { statsCachePath } from '../config/paths.js';
import type { Turn } from './parseJsonl.js';

interface FileCache {
  mtime_ms: number;
  size: number;
  turns: Turn[];
}

interface CacheData {
  schema_version: number;
  files: Record<string, FileCache>;
}

const SCHEMA_VERSION = 1;

export function loadCache(): CacheData {
  const p = statsCachePath();
  if (!existsSync(p)) return { schema_version: SCHEMA_VERSION, files: {} };
  try {
    const data = JSON.parse(readFileSync(p, 'utf-8')) as CacheData;
    if (data.schema_version !== SCHEMA_VERSION) return { schema_version: SCHEMA_VERSION, files: {} };
    return data;
  } catch (err) {
    return { schema_version: SCHEMA_VERSION, files: {} };
  }
}

export function saveCache(cache: CacheData): void {
  writeFileSync(statsCachePath(), JSON.stringify(cache), { mode: 0o600 });
}

export function getCachedTurns(filePath: string, cache: CacheData): { cached: Turn[]; needsParse: boolean; offset: number } {
  const entry = cache.files[filePath];
  if (!entry) return { cached: [], needsParse: true, offset: 0 };

  const stat = statSync(filePath);
  if (stat.mtimeMs === entry.mtime_ms && stat.size === entry.size) {
    return { cached: entry.turns, needsParse: false, offset: 0 };
  }

  if (stat.mtimeMs >= entry.mtime_ms && stat.size > entry.size) {
    // append-parse from last offset
    return { cached: entry.turns, needsParse: true, offset: entry.size };
  }

  // file was truncated or rewritten
  return { cached: [], needsParse: true, offset: 0 };
}

export function updateFileCache(filePath: string, turns: Turn[], cache: CacheData): void {
  const stat = statSync(filePath);
  cache.files[filePath] = {
    mtime_ms: stat.mtimeMs,
    size: stat.size,
    turns,
  };
}

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
