/**
 * Formats a number of tokens into a human-readable string (K, M, B).
 */
export function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Strips ANSI escape codes from a string to calculate its visible length.
 */
function getVisibleLength(s: string): number {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\u001b\[[0-9;]*m/g, '').length;
}

/**
 * ANSI-aware padding from the right.
 */
export function pad(s: string, len: number): string {
  const visibleLen = getVisibleLength(s);
  return s + ' '.repeat(Math.max(0, len - visibleLen));
}

/**
 * ANSI-aware padding from the left.
 */
export function padLeft(s: string, len: number): string {
  const visibleLen = getVisibleLength(s);
  return ' '.repeat(Math.max(0, len - visibleLen)) + s;
}
