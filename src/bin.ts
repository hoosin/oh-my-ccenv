import { run } from './cli.js';

process.on('uncaughtException', (error) => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    process.exit(0);
  }
  throw error;
});

run();
