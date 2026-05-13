/**
 * Formats a number of tokens into a human-readable string (K, M, B).
 */
export function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// CJK Unified, Hiragana/Katakana, Hangul, Fullwidth forms — terminals render
// these as 2 columns. Not exhaustive (no emoji ZWJ, no combining marks), but
// covers the cases that actually break alignment in `ccenv stats`.
const WIDE_CHAR_RE =
  /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/;

/**
 * Strips ANSI escape codes and counts terminal columns (CJK chars count as 2).
 */
function getVisibleLength(s: string): number {
  // eslint-disable-next-line no-control-regex
  const stripped = s.replace(/\[[0-9;]*m/g, '');
  let width = 0;
  for (const ch of stripped) {
    width += WIDE_CHAR_RE.test(ch) ? 2 : 1;
  }
  return width;
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
