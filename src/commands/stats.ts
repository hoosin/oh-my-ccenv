import { join } from 'node:path';
import { homedir } from 'node:os';
import { parseJsonl } from '../stats/parse-jsonl.js';
import { aggregate } from '../stats/aggregate.js';
import { StatsCache } from '../stats/cache.js';
import { listJsonlFiles } from '../stats/scan.js';
import type { Turn } from '../stats/parse-jsonl.js';
import { formatTokens, pad, padLeft } from '../utils/formatter.js';
import { error as logError } from '../utils/log.js';

function parseSince(since: string): number {
  const now = Date.now();
  const match = since.match(/^(\d+)d$/);
  if (match) return now - parseInt(match[1]) * 86400000;
  const hMatch = since.match(/^(\d+)h$/);
  if (hMatch) return now - parseInt(hMatch[1]) * 3600000;
  // YYYY-MM-DD
  return new Date(since + 'T00:00:00').getTime();
}

export async function statsCommand(opts: {
  since: string;
  project?: boolean;
  json?: boolean;
}): Promise<void> {
  const projectsDir = process.env.CCENV_LOG_DIR || join(homedir(), '.claude', 'projects');
  const files = listJsonlFiles(projectsDir);

  if (files.length === 0) {
    console.log('No Claude Code sessions found.');
    return;
  }

  const sinceMs = parseSince(opts.since);
  if (isNaN(sinceMs)) {
    logError(
      `Invalid time window: "${opts.since}". Use "24h", "7d", "30d", or "YYYY-MM-DD".`
    );
    process.exit(1);
  }

  const cache = StatsCache.load();
  const allTurns: Turn[] = [];
  for (const file of files) {
    allTurns.push(...(await cache.getOrParse(file, parseJsonl)));
  }
  cache.save();

  // filter by time window
  const filtered = allTurns.filter((t) => t.ts >= sinceMs);

  if (filtered.length === 0) {
    console.log(`No sessions found since ${opts.since}.`);
    return;
  }

  const by = opts.project ? 'project' : 'model';
  const result = aggregate(filtered, by);

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          since: new Date(sinceMs).toISOString(),
          until: new Date().toISOString(),
          by,
          rows: result.rows,
          total: result.total,
        },
        null,
        2
      )
    );
    return;
  }

  const maxKeyLen = Math.max(
    by.length,
    ...result.rows.map((r) => r.key.length),
    'TOTAL'.length
  );
  const colW = {
    key: Math.max(24, maxKeyLen + 2),
    calls: 8,
    input: 10,
    output: 10,
    percent: 8,
  };
  const totalW = colW.key + colW.calls + colW.input + colW.output + colW.percent;

  console.log(
    pad(by.toUpperCase(), colW.key) +
      padLeft('CALLS', colW.calls) +
      padLeft('INPUT', colW.input) +
      padLeft('OUTPUT', colW.output) +
      padLeft('%', colW.percent)
  );
  console.log('─'.repeat(totalW));

  for (const row of result.rows) {
    if (
      row.input + row.output + row.cache_read + row.cache_write === 0 &&
      result.rows.length > 1
    )
      continue;
    const percentStr =
      row.percent !== undefined ? `${row.percent.toFixed(1)}%` : '';
    console.log(
      pad(row.key, colW.key) +
        padLeft(formatTokens(row.calls), colW.calls) +
        padLeft(formatTokens(row.input), colW.input) +
        padLeft(formatTokens(row.output), colW.output) +
        padLeft(percentStr, colW.percent)
    );
  }

  console.log('─'.repeat(totalW));

  const t = result.total;
  console.log(
    pad('TOTAL', colW.key) +
      padLeft(formatTokens(t.calls), colW.calls) +
      padLeft(formatTokens(t.input), colW.input) +
      padLeft(formatTokens(t.output), colW.output) +
      padLeft('', colW.percent)
  );
}
