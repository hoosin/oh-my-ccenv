import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { select, input, confirm } from '@inquirer/prompts';
import { presets, type ProviderPreset } from '../config/presets.js';
import { saveProfile } from '../config/saveProfile.js';
import {
  profilePath,
  modelsCachePath,
  isReserved,
  isValidProfileName,
  INVALID_NAME_HINT,
} from '../config/paths.js';
import pc from 'picocolors';
import { success, info, error, spinner } from '../utils/log.js';
import { selectTheme, selectInstructions, withHelp } from '../utils/theme.js';

const MODELS_URL =
  'https://raw.githubusercontent.com/hoosin/oh-my-ccenv/main/data/models.json';

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
      writeFileSync(modelsCachePath(), JSON.stringify(data, null, 2), { mode: 0o600 });
      return models;
    }
  } catch (err) {
    // silently fallback to cache
  }

  // fallback to local cache
  try {
    if (existsSync(modelsCachePath())) {
      const data = JSON.parse(readFileSync(modelsCachePath(), 'utf-8')) as {
        providers: Record<string, { models: string[] }>;
      };
      return data.providers[providerId]?.models ?? [];
    }
  } catch (err) {
    // skip cache if corrupted
  }

  return [];
}

export async function addCommand(name?: string): Promise<void> {
  try {
    if (!name) {
      name = await input({
        message: withHelp('Enter profile name:'),
        validate: (v) => {
          const trimmed = v.trim();
          if (!trimmed) return 'Required';
          if (!isValidProfileName(trimmed)) return INVALID_NAME_HINT;
          if (isReserved(trimmed)) {
            return `"${trimmed}" is reserved (built-in stock Anthropic). Pick another name.`;
          }
          return true;
        },
      });
    } else {
      if (!isValidProfileName(name)) {
        error(`Invalid profile name: "${name}". ${INVALID_NAME_HINT}`);
        process.exit(1);
      }
      if (isReserved(name)) {
        error(
          `"${name}" is a reserved name (built-in stock Anthropic). Pick another name.`
        );
        process.exit(1);
      }
    }

    // check if profile already exists
    if (existsSync(profilePath(name))) {
      const overwrite = await confirm({
        message: withHelp(
          `Profile "${name}" already exists. Overwrite?`,
          '⏎ to confirm, Ctrl+C to cancel'
        ),
        default: false,
      });
      if (!overwrite) return;
    }

    // step 1: select provider
    const providerId = await select({
      message: 'Select a provider:',
      choices: [
        ...presets.map((p) => ({
          name: p.description,
          value: p.id,
        })),
        { name: '(enter manually)', value: '__custom__' },
      ],
      theme: selectTheme,
      instructions: selectInstructions,
    });

    let base_url: string;
    let defaultModel: string | undefined;
    let preset: ProviderPreset | undefined;

    if (providerId === '__custom__') {
      base_url = await input({
        message: withHelp('Base URL:'),
        validate: (v) => (v.trim() ? true : 'Required'),
      });
    } else {
      preset = presets.find((p) => p.id === providerId)!;
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
          theme: selectTheme,
          instructions: selectInstructions,
        });
        if (defaultModel === '__manual__') {
          defaultModel = await input({
            message: withHelp('Model name:'),
            validate: (v) => (v.trim() ? true : 'Required'),
          });
        }
      }
    }

    if (!defaultModel) {
      defaultModel = await input({
        message: withHelp('Model:'),
        validate: (v) => (v.trim() ? true : 'Required'),
      });
    }

    // step 2: auth token
    const auth_token = await input({
      message: withHelp('Auth token (supports ${ENV} interpolation):'),
      validate: (v) => (v.trim() ? true : 'Required'),
    });

    // step 3: optional description
    const defaultDesc = preset?.description ?? '';
    const description = await input({
      message: withHelp('Description (optional):'),
      default: defaultDesc,
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
    const pad = (s: string) => s.padEnd(`ccenv use ${name}`.length);
    info(
      [
        'Next:',
        `    ${pad(`ccenv ${name}`)}  ${pc.dim('switch + launch')}`,
        `    ${pad(`ccenv use ${name}`)}  ${pc.dim('switch only')}`,
        `    ${pad('ccenv claude')}  ${pc.dim('back to stock Anthropic')}`,
      ].join('\n')
    );
  } catch (err: any) {
    if (err.name === 'ExitPromptError') {
      process.exit(0);
    }
    throw err;
  }
}
