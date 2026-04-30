import type { Turn } from './parseJsonl.js';

export interface AggregateRow {
  key: string;
  calls: number;
  input: number;
  output: number;
  cache_read: number;
  cache_write: number;
  cost: number | null; // null = no pricing
}

export interface AggregateResult {
  rows: AggregateRow[];
  total: AggregateRow;
  warnings: string[];
}

export function aggregate(
  turns: Turn[],
  by: 'profile' | 'model' | 'project',
  profileMap: Map<string, string>, // model -> profile name
  priceFn: (model: string, usage: { input: number; output: number; cache_write: number; cache_read: number }) => number | null,
  filterProfile?: string
): AggregateResult {
  const buckets = new Map<string, { calls: number; input: number; output: number; cache_read: number; cache_write: number; cost: number }>();
  const warnings: string[] = [];

  for (const turn of turns) {
    let key: string;
    if (by === 'model') {
      key = turn.model;
    } else if (by === 'project') {
      key = turn.cwd ? turn.cwd.split('/').pop() ?? turn.cwd : 'unknown';
    } else {
      // profile
      key = profileMap.get(turn.model) ?? 'unknown';
    }

    if (filterProfile && by === 'profile' && key !== filterProfile) continue;

    const cost = priceFn(turn.model, {
      input: turn.input,
      output: turn.output,
      cache_write: turn.cache_write,
      cache_read: turn.cache_read,
    });

    const bucket = buckets.get(key) ?? { calls: 0, input: 0, output: 0, cache_read: 0, cache_write: 0, cost: 0 };
    bucket.calls++;
    bucket.input += turn.input;
    bucket.output += turn.output;
    bucket.cache_read += turn.cache_read;
    bucket.cache_write += turn.cache_write;
    if (cost !== null) bucket.cost += cost;
    buckets.set(key, bucket);
  }

  const rows: AggregateRow[] = [];
  for (const [key, b] of buckets) {
    rows.push({
      key,
      calls: b.calls,
      input: b.input,
      output: b.output,
      cache_read: b.cache_read,
      cache_write: b.cache_write,
      cost: b.cost,
    });
  }
  rows.sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));

  const total: AggregateRow = {
    key: 'TOTAL',
    calls: rows.reduce((s, r) => s + r.calls, 0),
    input: rows.reduce((s, r) => s + r.input, 0),
    output: rows.reduce((s, r) => s + r.output, 0),
    cache_read: rows.reduce((s, r) => s + r.cache_read, 0),
    cache_write: rows.reduce((s, r) => s + r.cache_write, 0),
    cost: rows.reduce((s, r) => s + (r.cost ?? 0), 0),
  };

  return { rows, total, warnings };
}
