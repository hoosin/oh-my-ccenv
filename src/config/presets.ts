export interface ProviderPreset {
  id: string;
  name: string;
  base_url: string;
  type: 'coding-plan' | 'standard';
}

export const presets: ProviderPreset[] = [
  {
    id: 'volcengine',
    name: '火山引擎 Coding Plan',
    base_url: 'https://ark.cn-beijing.volces.com/api/coding',
    type: 'coding-plan',
  },
  {
    id: 'bailian',
    name: '阿里云百炼 Coding Plan',
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
    name: '蚂蚁百灵',
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
