import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Turn } from '../src/stats/parse-jsonl.js';

let tempDir: string;
let jsonlPath: string;

function turn(ts: number): Turn {
  return {
    ts,
    model: 'claude-sonnet-4',
    input: 100,
    output: 50,
    cache_write: 0,
    cache_read: 0,
    cwd: '/x',
    sessionId: 's',
  };
}

describe('StatsCache', () => {
  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ccenv-cache-test-'));
    process.env.XDG_CONFIG_HOME = tempDir;
    mkdirSync(join(tempDir, 'ccenv'), { recursive: true });
    jsonlPath = join(tempDir, 'file.jsonl');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.XDG_CONFIG_HOME;
  });

  it('load: returns empty when no cache file exists', async () => {
    const { StatsCache } = await import('../src/stats/cache.js');
    const cache = StatsCache.load();
    const parser = vi.fn(async () => [] as Turn[]);
    writeFileSync(jsonlPath, '');
    await cache.getOrParse(jsonlPath, parser);
    expect(parser).toHaveBeenCalledOnce();
  });

  it('load: returns empty when JSON is corrupted', async () => {
    const { statsCachePath } = await import('../src/config/paths.js');
    writeFileSync(statsCachePath(), 'not json {{{');
    const { StatsCache } = await import('../src/stats/cache.js');
    const cache = StatsCache.load();
    cache.save();
    const data = JSON.parse(readFileSync(statsCachePath(), 'utf-8'));
    expect(data.files).toEqual({});
  });

  it('load: returns empty when schema_version mismatches', async () => {
    const { statsCachePath } = await import('../src/config/paths.js');
    writeFileSync(
      statsCachePath(),
      JSON.stringify({ schema_version: 999, files: { '/a': {} } })
    );
    const { StatsCache } = await import('../src/stats/cache.js');
    const cache = StatsCache.load();
    cache.save();
    const data = JSON.parse(readFileSync(statsCachePath(), 'utf-8'));
    expect(data.schema_version).toBe(1);
    expect(data.files).toEqual({});
  });

  it('load: returns empty when files is not an object', async () => {
    const { statsCachePath } = await import('../src/config/paths.js');
    writeFileSync(
      statsCachePath(),
      JSON.stringify({ schema_version: 1, files: 'garbage' })
    );
    const { StatsCache } = await import('../src/stats/cache.js');
    const cache = StatsCache.load();
    cache.save();
    const data = JSON.parse(readFileSync(statsCachePath(), 'utf-8'));
    expect(data.files).toEqual({});
  });

  it('getOrParse: first-time call parses from offset 0', async () => {
    const { StatsCache } = await import('../src/stats/cache.js');
    writeFileSync(jsonlPath, 'line1\nline2\n');
    const cache = StatsCache.load();
    const parser = vi.fn(async () => [turn(1000)]);
    const result = await cache.getOrParse(jsonlPath, parser);
    expect(parser).toHaveBeenCalledWith(jsonlPath, 0);
    expect(result).toHaveLength(1);
  });

  it('getOrParse: unchanged file uses cached, no parser call', async () => {
    const { StatsCache } = await import('../src/stats/cache.js');
    writeFileSync(jsonlPath, 'line1\n');
    const cache = StatsCache.load();
    const parser = vi.fn(async () => [turn(1000)]);
    await cache.getOrParse(jsonlPath, parser);
    cache.save();

    const cache2 = StatsCache.load();
    const parser2 = vi.fn(async () => [turn(9999)]);
    const result = await cache2.getOrParse(jsonlPath, parser2);
    expect(parser2).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].ts).toBe(1000);
  });

  it('getOrParse: grown file parses from old size, merges with cached', async () => {
    const { StatsCache } = await import('../src/stats/cache.js');
    writeFileSync(jsonlPath, 'a\n');
    const cache = StatsCache.load();
    await cache.getOrParse(jsonlPath, async () => [turn(1000)]);
    cache.save();

    writeFileSync(jsonlPath, 'a\nb\nc\n');
    const cache2 = StatsCache.load();
    const parser = vi.fn(async () => [turn(2000)]);
    const result = await cache2.getOrParse(jsonlPath, parser);

    expect(parser).toHaveBeenCalledWith(jsonlPath, 2);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.ts)).toEqual([1000, 2000]);
  });

  it('getOrParse: file vanished returns cached', async () => {
    const { StatsCache } = await import('../src/stats/cache.js');
    writeFileSync(jsonlPath, 'a\n');
    const cache = StatsCache.load();
    await cache.getOrParse(jsonlPath, async () => [turn(1000)]);
    cache.save();

    unlinkSync(jsonlPath);
    const cache2 = StatsCache.load();
    const parser = vi.fn(async () => [turn(9999)]);
    const result = await cache2.getOrParse(jsonlPath, parser);

    expect(parser).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].ts).toBe(1000);
  });

  it('getOrParse: shrunk file reparses from offset 0', async () => {
    const { StatsCache } = await import('../src/stats/cache.js');
    writeFileSync(jsonlPath, 'a\nb\nc\n');
    const cache = StatsCache.load();
    await cache.getOrParse(jsonlPath, async () => [turn(1000), turn(2000)]);
    cache.save();

    writeFileSync(jsonlPath, 'x\n');
    const cache2 = StatsCache.load();
    const parser = vi.fn(async () => [turn(3000)]);
    const result = await cache2.getOrParse(jsonlPath, parser);

    expect(parser).toHaveBeenCalledWith(jsonlPath, 0);
    expect(result).toHaveLength(1);
    expect(result[0].ts).toBe(3000);
  });

  it('save: creates configDir if missing', async () => {
    const { existsSync } = await import('node:fs');
    rmSync(join(tempDir, 'ccenv'), { recursive: true, force: true });
    const { StatsCache } = await import('../src/stats/cache.js');
    const { statsCachePath } = await import('../src/config/paths.js');
    const cache = StatsCache.load();
    cache.save();
    expect(existsSync(statsCachePath())).toBe(true);
  });
});
