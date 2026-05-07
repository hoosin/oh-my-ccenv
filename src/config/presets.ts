import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'smol-toml';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ProviderPreset {
  id: string;
  base_url: string;
  type: 'coding-plan' | 'standard';
}

export const presets: ProviderPreset[] = [
  {
    id: 'volcengine',
    base_url: 'https://ark.cn-beijing.volces.com/api/coding',
    type: 'coding-plan',
  },
  {
    id: 'bailian',
    base_url: 'https://coding.dashscope.aliyuncs.com/apps/anthropic',
    type: 'coding-plan',
  },
  {
    id: 'deepseek',
    base_url: 'https://api.deepseek.com',
    type: 'standard',
  },
  {
    id: 'bailing',
    base_url: 'https://openrouter.ai/api',
    type: 'standard',
  },
  {
    id: 'mimo',
    base_url: 'https://token-plan-cn.xiaomimimo.com/anthropic',
    type: 'standard',
  },
  {
    id: 'anthropic',
    base_url: 'https://api.anthropic.com',
    type: 'standard',
  },
];

export function loadPresetDescription(id: string): string {
  const candidates = [
    join(__dirname, '..', '..', 'templates', `${id}.toml`),
    join(__dirname, '..', 'templates', `${id}.toml`),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const toml = parse(readFileSync(p, 'utf-8')) as { description?: string };
        if (toml.description) return toml.description;
      } catch (err) {
        // ignore parse error and try next or fallback
      }
    }
  }
  return id;
}
