import { existsSync, readFileSync } from 'node:fs';
import { select, input, confirm } from '@inquirer/prompts';
import { presets, loadPresetDescription } from '../config/presets.js';
import { saveProfile } from '../config/saveProfile.js';
import { profilePath, modelsCachePath } from '../config/paths.js';
import { success, info, spinner } from '../utils/log.js';

const MODELS_URL =
  'https://raw.githubusercontent.com/hoosin/ccenv/main/data/models.json';

async function fetchModels(providerId: string): Promise<string[]> {
  // try remote first
  try {
    const res = await fetch(MODELS_URL, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json() as {
        providers: Record<string, { models: string[] }>;
      };
      const models = data.providers[providerId]?.models ?? [];
      // cache locally
      const { writeFileSync } = await import('node:fs');
      writeFileSync(modelsCachePath(), JSON.stringify(data, null, 2));
      return models;
    }
  } catch {}

  // fallback to local cache
  try {
    if (existsSync(modelsCachePath())) {
      const data = JSON.parse(readFileSync(modelsCachePath(), 'utf-8')) as {
        providers: Record<string, { models: string[] }>;
      };
      return data.providers[providerId]?.models ?? [];
    }
  } catch {}

  return [];
}

export async function addCommand(name: string): Promise<void> {
  // check if profile already exists
  if (existsSync(profilePath(name))) {
    const overwrite = await confirm({
      message: `Profile "${name}" already exists. Overwrite?`,
      default: false,
    });
    if (!overwrite) return;
  }

  // step 1: select provider
  const providerId = await select({
    message: 'Select a provider:',
    choices: [
      ...presets.map((p) => ({
        name: loadPresetDescription(p.id),
        value: p.id,
      })),
      { name: 'Custom', value: '__custom__' },
    ],
    instructions: {
      navigation: 'Press ↑↓ to navigate, ⏎ to select, Ctrl+C to cancel',
      pager: 'Press ↑↓ to scroll',
    },
  });

  let base_url: string;
  let defaultModel: string | undefined;

  if (providerId === '__custom__') {
    base_url = await input({
      message: 'Base URL:',
      validate: (v) => (v.trim() ? true : 'Required'),
    });
  } else {
    const preset = presets.find((p) => p.id === providerId)!;
    base_url = preset.base_url;

    // fetch models for this provider
    const stop = spinner('Fetching models...');
    const models = await fetchModels(providerId);
    stop();
    if (models.length > 0) {
      defaultModel = await select({
        message: 'Model:',
        choices: [
          ...models.map((m) => ({ name: m, value: m })),
          { name: '(enter manually)', value: '__manual__' },
        ],
      });
      if (defaultModel === '__manual__') {
        defaultModel = await input({
          message: 'Model name:',
          validate: (v) => (v.trim() ? true : 'Required'),
        });
      }
    }
  }

  if (!defaultModel) {
    defaultModel = await input({
      message: 'Model:',
      validate: (v) => (v.trim() ? true : 'Required'),
    });
  }

  // step 2: auth token
  const auth_token = await input({
    message: 'Auth token (supports ${ENV} interpolation):',
    validate: (v) => (v.trim() ? true : 'Required'),
  });

  // step 3: optional description
  const description = await input({
    message: 'Description (optional):',
  });

  // save
  saveProfile(name, {
    description: description.trim() || undefined,
    env: {
      ANTHROPIC_BASE_URL: base_url,
      ANTHROPIC_AUTH_TOKEN: auth_token.trim(),
      ANTHROPIC_MODEL: defaultModel,
    },
  });

  success(`Saved to ${profilePath(name)}`);
  info(`Next: ccenv ${name}   or   ccenv use ${name}`);
}
