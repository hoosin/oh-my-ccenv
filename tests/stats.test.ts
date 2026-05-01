import { describe, it, expect } from 'vitest';
import { aggregate } from '../src/stats/aggregate.js';
import type { Turn } from '../src/stats/parseJsonl.js';

describe('Aggregation', () => {
  const mockTurns: Turn[] = [
    {
      ts: 1000,
      model: 'claude-sonnet-4',
      input: 1000,
      output: 500,
      cache_write: 0,
      cache_read: 0,
      cwd: '/path/to/project-a',
      sessionId: 's1',
    },
    {
      ts: 2000,
      model: 'claude-sonnet-4',
      input: 2000,
      output: 1000,
      cache_write: 0,
      cache_read: 0,
      cwd: '/path/to/project-a',
      sessionId: 's2',
    },
    {
      ts: 3000,
      model: 'claude-opus-4',
      input: 500,
      output: 200,
      cache_write: 0,
      cache_read: 0,
      cwd: '/path/to/project-b',
      sessionId: 's3',
    },
  ];

  it('should aggregate by model', () => {
    const result = aggregate(mockTurns, 'model');
    expect(result.rows).toHaveLength(2);
    const sonnet = result.rows.find((r) => r.key === 'claude-sonnet-4');
    expect(sonnet?.calls).toBe(2);
    expect(sonnet?.input).toBe(3000);
    expect(sonnet?.output).toBe(1500);
  });

  it('should aggregate by project', () => {
    const result = aggregate(mockTurns, 'project');
    expect(result.rows).toHaveLength(2);
    const projectA = result.rows.find((r) => r.key === 'project-a');
    expect(projectA?.calls).toBe(2);
  });

  it('should calculate total correctly', () => {
    const result = aggregate(mockTurns, 'model');
    expect(result.total.calls).toBe(3);
    expect(result.total.input).toBe(3500);
    expect(result.total.output).toBe(1700);
  });

  it('should calculate percent per row', () => {
    const result = aggregate(mockTurns, 'model');
    const sonnet = result.rows.find((r) => r.key === 'claude-sonnet-4');
    const opus = result.rows.find((r) => r.key === 'claude-opus-4');
    expect(sonnet?.percent).toBeDefined();
    expect(opus?.percent).toBeDefined();
    expect((sonnet?.percent ?? 0) + (opus?.percent ?? 0)).toBeCloseTo(100, 0);
  });
});
