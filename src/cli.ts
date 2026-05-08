import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Command } from 'commander';
import { purgeTemplateProfilesOnce } from './config/migrate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

export function run() {
  purgeTemplateProfilesOnce();

  const program = new Command();

  program
    .name('ccenv')
    .description('Profile manager and usage analytics for Claude Code')
    .version(pkg.version);

  program
    .command('add [name]')
    .description('Create a new profile interactively')
    .action(async (name?: string) => {
      const { addCommand } = await import('./commands/add.js');
      await addCommand(name);
    });

  program
    .command('use [name]')
    .description('Switch the current profile')
    .action(async (name?: string) => {
      const { useCommand } = await import('./commands/use.js');
      await useCommand(name);
    });

  program
    .command('list')
    .description('List all profiles')
    .action(async () => {
      const { listCommand } = await import('./commands/list.js');
      await listCommand();
    });

  program
    .command('current')
    .description('Show current profile name and effective env')
    .option('--show-secrets', 'Reveal full token/key values (default: masked)')
    .action(async (opts: { showSecrets?: boolean }) => {
      const { currentCommand } = await import('./commands/current.js');
      await currentCommand(opts);
    });

  program
    .command('remove [name]')
    .description('Delete a profile')
    .action(async (name?: string) => {
      const { removeCommand } = await import('./commands/remove.js');
      await removeCommand(name);
    });

  program
    .command('edit [name]')
    .description('Open a profile file in $EDITOR')
    .option('--reset', 'Regenerate from template before opening')
    .action(async (name?: string, opts?: { reset?: boolean }) => {
      const { editCommand } = await import('./commands/edit.js');
      await editCommand(name, opts?.reset);
    });

  program
    .command('stats')
    .description('Show token usage')
    .option('--since <window>', 'Time window: Nh|Nd (e.g. 24h, 7d) or YYYY-MM-DD', '7d')
    .option('--project', 'Group by project instead of model')
    .option('--json', 'Machine-readable output')
    .action(async (opts: { since: string; project?: boolean; json?: boolean }) => {
      const { statsCommand } = await import('./commands/stats.js');
      await statsCommand(opts);
    });

  program
    .command('man')
    .description('Open the man page')
    .action(async () => {
      const { manCommand } = await import('./commands/man.js');
      await manCommand();
    });

  program
    .command('help')
    .description('Display help')
    .action(() => {
      program.help();
    });

  program
    .argument('[name]', 'Profile name (switch + launch)')
    .action(async (name?: string) => {
      const { launchCommand } = await import('./commands/launch.js');
      await launchCommand(name);
    });

  program.parse();
}
