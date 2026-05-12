import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'smol-toml';
import { isReserved, bundledTemplatesDir } from './paths.js';

// templates/ 是 provider 元数据的唯一真值源：id 来自文件名，base_url 来自
// [env].ANTHROPIC_BASE_URL，description 来自顶层 description。新增 provider
// 只需要在 templates/ 下加一个 toml，不要在这里维护硬编码列表。
export interface ProviderPreset {
  id: string;
  base_url: string;
  description: string;
}

function loadPresets(): ProviderPreset[] {
  const dir = bundledTemplatesDir();
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
