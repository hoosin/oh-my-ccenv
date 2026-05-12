import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { statsCachePath, ensureConfigDir } from '../config/paths.js';
import type { Turn } from './parse-jsonl.js';

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

type Parser = (filePath: string, offset: number) => Promise<Turn[]>;

export class StatsCache {
  private constructor(private data: CacheData) {}

  static load(): StatsCache {
    const p = statsCachePath();
    if (!existsSync(p)) return new StatsCache(StatsCache.empty());
    try {
      const data = JSON.parse(readFileSync(p, 'utf-8')) as CacheData;
      if (
        data?.schema_version !== SCHEMA_VERSION ||
        typeof data.files !== 'object' ||
        data.files === null
      ) {
        return new StatsCache(StatsCache.empty());
      }
      return new StatsCache(data);
    } catch {
      return new StatsCache(StatsCache.empty());
    }
  }

  private static empty(): CacheData {
    return { schema_version: SCHEMA_VERSION, files: {} };
  }

  /**
   * Return all known turns for `filePath`. Uses cached entries when the file
   * is unchanged, parses from a byte offset when the file has grown (append),
   * and reparses fully when the file was truncated or shrank.
   *
   * The append-parse path assumes Claude Code only appends to jsonl files
   * (never rewrites in place with a larger payload). If that assumption ever
   * breaks, stale data leaks through the first `entry.size` bytes.
   */
  async getOrParse(filePath: string, parser: Parser): Promise<Turn[]> {
    const entry = this.data.files[filePath];

    let stat;
    try {
      stat = statSync(filePath);
    } catch {
      // File vanished between scan and parse — fall back to cached if any.
      return entry?.turns ?? [];
    }

    if (entry && stat.mtimeMs === entry.mtime_ms && stat.size === entry.size) {
      return entry.turns;
    }

    if (entry && stat.mtimeMs >= entry.mtime_ms && stat.size > entry.size) {
      const parsed = await parser(filePath, entry.size);
      const merged = [...entry.turns, ...parsed];
      this.update(filePath, merged, stat.mtimeMs, stat.size);
      return merged;
    }

    const turns = await parser(filePath, 0);
    this.update(filePath, turns, stat.mtimeMs, stat.size);
    return turns;
  }

  private update(filePath: string, turns: Turn[], mtimeMs: number, size: number): void {
    this.data.files[filePath] = { mtime_ms: mtimeMs, size, turns };
  }

  save(): void {
    ensureConfigDir();
    writeFileSync(statsCachePath(), JSON.stringify(this.data), { mode: 0o600 });
  }
}
