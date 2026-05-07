import type { Turn } from './parseJsonl.js';

export interface AggregateRow {
  key: string;
  calls: number;
  input: number;
  output: number;
  cache_read: number;
  cache_write: number;
  percent?: number;
}

export interface AggregateResult {
  rows: AggregateRow[];
  total: AggregateRow;
}

export function aggregate(
  turns: Turn[],
  by: 'model' | 'project'
): AggregateResult {
  const buckets = new Map<
    string,
    {
      calls: number;
      input: number;
      output: number;
      cache_read: number;
      cache_write: number;
    }
  >();

  for (const turn of turns) {
    let key: string;
    if (by === 'project') {
      key = turn.cwd ? turn.cwd.split('/').pop() ?? turn.cwd : 'unknown';
    } else {
      // Clean up model names (strip date suffixes like -20240620 or -20251001)
      key = turn.model.replace(/-?\d{8}$/, '');
    }

    const bucket = buckets.get(key) ?? {
      calls: 0,
      input: 0,
      output: 0,
      cache_read: 0,
      cache_write: 0,
    };
    bucket.calls++;
    bucket.input += turn.input;
    bucket.output += turn.output;
    bucket.cache_read += turn.cache_read;
    bucket.cache_write += turn.cache_write;
    buckets.set(key, bucket);
  }

  const rows: AggregateRow[] = [];
  for (const [key, b] of buckets) {
    rows.push({ key, ...b });
  }

  const tokens = (r: AggregateRow) =>
    r.input + r.output + r.cache_read + r.cache_write;
  rows.sort((a, b) => tokens(b) - tokens(a));

  const total: AggregateRow = {
    key: 'TOTAL',
    calls: rows.reduce((s, r) => s + r.calls, 0),
    input: rows.reduce((s, r) => s + r.input, 0),
    output: rows.reduce((s, r) => s + r.output, 0),
    cache_read: rows.reduce((s, r) => s + r.cache_read, 0),
    cache_write: rows.reduce((s, r) => s + r.cache_write, 0),
  };

  const totalTokens = tokens(total);
  for (const row of rows) {
    row.percent = totalTokens > 0 ? (tokens(row) / totalTokens) * 100 : 0;
  }

  return { rows, total };
}
