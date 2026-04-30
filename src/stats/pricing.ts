interface PriceEntry {
  match: string;
  input: number;
  output: number;
  cache_write: number;
  cache_read: number;
}

// Embedded pricing data (also available as data/pricing.json for CI updates)
const PRICING_DATA: PriceEntry[] = [
  { match: 'claude-opus-4', input: 15.00, output: 75.00, cache_write: 18.75, cache_read: 1.50 },
  { match: 'claude-sonnet-4', input: 3.00, output: 15.00, cache_write: 3.75, cache_read: 0.30 },
  { match: 'claude-haiku-4', input: 0.80, output: 4.00, cache_write: 1.00, cache_read: 0.08 },
  { match: 'deepseek-chat', input: 0.27, output: 1.10, cache_write: 0.27, cache_read: 0.07 },
  { match: 'deepseek-reasoner', input: 0.55, output: 2.19, cache_write: 0.55, cache_read: 0.14 },
  { match: 'doubao-seed-2.0', input: 0.0, output: 0.0, cache_write: 0.0, cache_read: 0.0 },
  { match: 'inclusionai/ling', input: 0.0, output: 0.0, cache_write: 0.0, cache_read: 0.0 },
  { match: 'mimo-v2', input: 0.0, output: 0.0, cache_write: 0.0, cache_read: 0.0 },
  { match: 'qwen-code', input: 0.0, output: 0.0, cache_write: 0.0, cache_read: 0.0 },
];

export function getPrice(modelName: string): PriceEntry | null {
  // longest prefix match
  const candidates = PRICING_DATA.filter((m) => modelName.startsWith(m.match));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.match.length - a.match.length)[0];
}

export function calcCost(
  modelName: string,
  usage: { input: number; output: number; cache_write: number; cache_read: number }
): number | null {
  const price = getPrice(modelName);
  if (!price) return null;
  return (
    (usage.input * price.input) / 1_000_000 +
    (usage.output * price.output) / 1_000_000 +
    (usage.cache_write * price.cache_write) / 1_000_000 +
    (usage.cache_read * price.cache_read) / 1_000_000
  );
}
