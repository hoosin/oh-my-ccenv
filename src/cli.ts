import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Command } from 'commander';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

export function run() {
  const program = new Command();

  program
    .name('ccenv')
    .description('Profile manager and usage analytics for Claude Code')
    .version(pkg.version);

  program
    .command('add <name>')
    .description('Create a new profile interactively')
    .action(async (name: string) => {
      const { addCommand } = await import('./commands/add.js');
      await addCommand(name);
    });

  program
    .command('use <name>')
    .description('Switch the current profile')
    .action(async (name: string) => {
      const { useCommand } = await import('./commands/use.js');
      await useCommand(name);
    });

  program
    .command('ls')
    .description('List all profiles')
    .action(async () => {
      const { lsCommand } = await import('./commands/ls.js');
      await lsCommand();
    });

  program
    .command('current')
    .description('Show current profile name and effective env')
    .action(async () => {
      const { currentCommand } = await import('./commands/current.js');
      await currentCommand();
    });

  program
    .command('rm [name]')
    .description('Delete a profile')
    .action(async (name?: string) => {
      const { rmCommand } = await import('./commands/rm.js');
      await rmCommand(name);
    });

  program
    .command('edit [name]')
    .description('Open a profile file in $EDITOR')
    .action(async (name?: string) => {
      const { editCommand } = await import('./commands/edit.js');
      await editCommand(name);
    });

  program
    .command('stats')
    .description('Show token usage and cost')
    .option('--by <dimension>', 'Group by: profile|model|project', 'profile')
    .option('--since <window>', 'Time window: 7d|30d|YYYY-MM-DD', '7d')
    .option('--profile <name>', 'Filter to a single profile')
    .option('--json', 'Machine-readable output')
    .action(async (opts: { by: string; since: string; profile?: string; json?: boolean }) => {
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
