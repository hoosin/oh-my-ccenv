export interface ProviderPreset {
  id: string;
  name: string;
  base_url: string;
  type: 'coding-plan' | 'standard';
}

export const presets: ProviderPreset[] = [
  {
    id: 'volcengine',
    name: 'Volcengine Coding Plan',
    base_url: 'https://ark.cn-beijing.volces.com/api/coding',
    type: 'coding-plan',
  },
  {
    id: 'bailian',
    name: 'Alibaba Bailian Coding Plan',
    base_url: 'https://coding.dashscope.aliyuncs.com/apps/anthropic',
    type: 'coding-plan',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    base_url: 'https://api.deepseek.com',
    type: 'standard',
  },
  {
    id: 'bailing',
    name: 'Ant Bailing',
    base_url: 'https://openrouter.ai/api',
    type: 'standard',
  },
  {
    id: 'mimo',
    name: 'MiMo',
    base_url: 'https://token-plan-cn.xiaomimimo.com/anthropic',
    type: 'standard',
  },
];

export function getPreset(id: string): ProviderPreset | undefined {
  return presets.find((p) => p.id === id);
}
