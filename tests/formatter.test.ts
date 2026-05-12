import { describe, it, expect } from 'vitest';
import { pad, padLeft, formatTokens } from '../src/utils/formatter.js';

describe('pad / padLeft (ANSI + CJK aware)', () => {
  it('pads ASCII to fixed visible width', () => {
    expect(pad('abc', 6)).toBe('abc   ');
    expect(padLeft('abc', 6)).toBe('   abc');
  });

  it('CJK character counts as 2 visible columns', () => {
    // 抓包 = 2 chars × 2 cols = 4 cols, so padding to 6 adds 2 spaces
    expect(pad('抓包', 6)).toBe('抓包  ');
    expect(padLeft('抓包', 6)).toBe('  抓包');
  });

  it('mixed ASCII and CJK width', () => {
    // 'a抓包b' = 1 + 2 + 2 + 1 = 6 cols
    expect(pad('a抓包b', 8)).toBe('a抓包b  ');
  });

  it('ANSI escape codes do not count toward width', () => {
    const colored = '\x1b[31mred\x1b[0m'; // visible width = 3
    expect(pad(colored, 6)).toBe(colored + '   ');
  });

  it('does not truncate when content exceeds width', () => {
    expect(pad('toolong', 3)).toBe('toolong');
    expect(padLeft('toolong', 3)).toBe('toolong');
  });
});

describe('formatTokens', () => {
  it('formats raw numbers below 1K', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(999)).toBe('999');
  });

  it('formats K / M / B with one decimal', () => {
    expect(formatTokens(1_500)).toBe('1.5K');
    expect(formatTokens(2_300_000)).toBe('2.3M');
    expect(formatTokens(4_500_000_000)).toBe('4.5B');
  });
});
