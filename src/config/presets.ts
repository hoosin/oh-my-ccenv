import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'smol-toml';
import { isReserved } from './paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ProviderPreset {
  id: string;
  base_url: string;
  description: string;
}

function loadPresets(): ProviderPreset[] {
  const candidates = [
    join(__dirname, '..', '..', 'templates'),
    join(__dirname, '..', 'templates'),
  ];

  const dir = candidates.find((d) => existsSync(d));
  if (!dir) {
    process.stderr.write('⚠ ccenv: templates directory not found\n');
    return [];
  }

  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.toml') && !isReserved(f.replace('.toml', '')))
    .sort();

  const presets: ProviderPreset[] = [];
  for (const f of files) {
    const id = f.replace('.toml', '');
    try {
      const content = readFileSync(join(dir, f), 'utf-8');
      const toml = parse(content) as {
        description?: string;
        env?: Record<string, string>;
      };
      presets.push({
        id,
        base_url: toml.env?.ANTHROPIC_BASE_URL ?? '',
        description: toml.description ?? id,
      });
    } catch (err) {
      process.stderr.write(`⚠ ccenv: skipping broken template ${f}: ${err}\n`);
    }
  }

  if (presets.length === 0) {
    process.stderr.write('⚠ ccenv: no valid provider templates loaded\n');
  }

  return presets;
}

export const presets: ProviderPreset[] = loadPresets();