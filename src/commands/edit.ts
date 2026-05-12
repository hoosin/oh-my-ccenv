import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { select } from '@inquirer/prompts';
import {
  profilePath,
  isValidProfileName,
  INVALID_NAME_HINT,
  bundledTemplatePath,
} from '../config/paths.js';
import { listProfiles } from '../config/list-profiles.js';
import { readCurrent } from '../config/current.js';
import { formatProfileChoice } from '../utils/format-profile.js';
import { selectTheme, selectInstructions } from '../utils/theme.js';
import { error, info } from '../utils/log.js';

export async function editCommand(name?: string, reset?: boolean): Promise<void> {
  let target = name;
  if (!target) {
    const profiles = listProfiles();
    if (profiles.length === 0) {
      error('No profiles found. Run `ccenv add <name>` to create one.');
      process.exit(1);
    }
    const current = readCurrent();
    target = await select({
      message: 'Select a profile to edit:',
      choices: profiles.map((p) => formatProfileChoice(p)),
      default: current || undefined,
      theme: selectTheme,
      instructions: selectInstructions,
    });
  }

  if (!isValidProfileName(target)) {
    error(`Invalid profile name: "${target}". ${INVALID_NAME_HINT}`);
    process.exit(1);
  }

  const p = profilePath(target);
  const templatePath = bundledTemplatePath(target);
  const hasTemplate = templatePath !== null && existsSync(templatePath);

  if (reset) {
    if (!hasTemplate) {
      error(`No template found for "${target}".`);
      process.exit(1);
    }
    info(`Regenerating "${target}" from template...`);
    writeFileSync(p, readFileSync(templatePath!, 'utf-8'), { mode: 0o600 });
  } else if (!existsSync(p)) {
    if (hasTemplate) {
      info(`Initializing "${target}" profile from template...`);
      writeFileSync(p, readFileSync(templatePath!, 'utf-8'), { mode: 0o600 });
    } else {
      error(`Profile "${target}" not found.`);
      process.exit(1);
    }
  }

  const editor =
    process.env.EDITOR ||
    process.env.VISUAL ||
    (process.platform === 'win32' ? 'notepad' : 'vi');
  const result = spawnSync(`${editor} "${p}"`, {
    stdio: 'inherit',
    shell: true,
  });
  if (result.error || result.status !== 0) {
    error(
      `Failed to launch editor "${editor}". Set the EDITOR environment variable ` +
        `to your preferred editor (e.g. "code --wait", "notepad++", "vim").`
    );
    process.exit(1);
  }
}
