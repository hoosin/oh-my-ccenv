import { join } from 'node:path';
import pc from 'picocolors';
import { parseJsonl } from '../stats/parseJsonl.js';
import { aggregate } from '../stats/aggregate.js';
import { calcCost } from '../stats/pricing.js';
import { loadCache, saveCache, getCachedTurns, updateFileCache, listJsonlFiles } from '../stats/cache.js';
import { listProfiles } from '../config/listProfiles.js';
import { loadProfile } from '../config/loadProfile.js';
import type { Turn } from '../stats/parseJsonl.js';

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function pad(s: string, len: number): string {
  return s.padEnd(len);
}

function padLeft(s: string, len: number): string {
  return s.padStart(len);
}

function buildProfileMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const name of listProfiles()) {
    try {
      const profile = loadProfile(name);
      const model = profile.env.ANTHROPIC_MODEL;
      if (model) map.set(model, name);
    } catch {}
  }
  return map;
}

function parseSince(since: string): number {
  const now = Date.now();
  const match = since.match(/^(\d+)d$/);
  if (match) return now - parseInt(match[1]) * 86400000;
  // YYYY-MM-DD
  return new Date(since + 'T00:00:00').getTime();
}

export async function statsCommand(opts: {
  by: string;
  since: string;
  profile?: string;
  json?: boolean;
}): Promise<void> {
  const projectsDir = join(process.env.HOME || '~', '.claude', 'projects');
  const files = listJsonlFiles(projectsDir);

  if (files.length === 0) {
    console.log('No Claude Code sessions found.');
    return;
  }

  const sinceMs = parseSince(opts.since);
  const profileMap = buildProfileMap();
  const cache = loadCache();

  // collect all turns
  const allTurns: Turn[] = [];
  for (const file of files) {
    const { cached, needsParse } = getCachedTurns(file, cache);
    if (needsParse) {
      const parsed = await parseJsonl(file);
      const merged = [...cached.filter((t) => !cached.some((c) => c.ts === t.ts)), ...parsed];
      updateFileCache(file, merged, cache);
      allTurns.push(...merged);
    } else {
      allTurns.push(...cached);
    }
  }

  saveCache(cache);

  // filter by time window
  const filtered = allTurns.filter((t) => t.ts >= sinceMs);

  if (filtered.length === 0) {
    console.log(`No sessions found since ${opts.since}.`);
    return;
  }

  const by = (opts.by as 'profile' | 'model' | 'project') || 'profile';
  const result = aggregate(filtered, by, profileMap, calcCost, opts.profile);

  if (opts.json) {
    console.log(JSON.stringify({
      since: new Date(sinceMs).toISOString(),
      until: new Date().toISOString(),
      by,
      rows: result.rows,
      total: result.total,
      warnings: result.warnings,
    }, null, 2));
    return;
  }

  // table output
  const colW = { key: 12, calls: 8, input: 10, output: 10, cached: 10, cost: 10 };
  console.log(
    pad('PROFILE', colW.key) +
    padLeft('CALLS', colW.calls) +
    padLeft('INPUT', colW.input) +
    padLeft('OUTPUT', colW.output) +
    padLeft('CACHED', colW.cached) +
    padLeft('COST', colW.cost)
  );
  console.log('─'.repeat(colW.key + colW.calls + colW.input + colW.output + colW.cached + colW.cost));

  for (const row of result.rows) {
    const line =
      pad(row.key, colW.key) +
      padLeft(String(row.calls), colW.calls) +
      padLeft(formatTokens(row.input), colW.input) +
      padLeft(formatTokens(row.output), colW.output) +
      padLeft(formatTokens(row.cache_read + row.cache_write), colW.cached) +
      padLeft(row.cost !== null ? `$${row.cost.toFixed(2)}` : '?', colW.cost);
    console.log(line);
  }

  console.log('─'.repeat(colW.key + colW.calls + colW.input + colW.output + colW.cached + colW.cost));
  const t = result.total;
  console.log(
    pc.bold(pad('TOTAL', colW.key)) +
    padLeft(String(t.calls), colW.calls) +
    padLeft(formatTokens(t.input), colW.input) +
    padLeft(formatTokens(t.output), colW.output) +
    padLeft(formatTokens(t.cache_read + t.cache_write), colW.cached) +
    padLeft(`$${(t.cost ?? 0).toFixed(2)}`, colW.cost)
  );
}
