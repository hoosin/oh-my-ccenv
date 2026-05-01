import { run } from './cli.js';
import pc from 'picocolors';

process.on('uncaughtException', (error) => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    process.exit(0);
  }
  if (error instanceof Error) {
    console.error(pc.red(error.message));
  } else {
    console.error(pc.red(String(error)));
  }
  process.exit(1);
});

run();
