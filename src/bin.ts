import pc from 'picocolors';

function handleFatal(err: unknown): never {
  if (err instanceof Error && err.name === 'ExitPromptError') {
    process.exit(0);
  }
  const msg = err instanceof Error ? err.message : String(err);
  console.error(pc.red(msg));
  process.exit(1);
}

// Register before importing cli.js so that any module-load failure downstream
// (e.g. corrupted package.json, broken bundled template) goes through the
// formatter instead of an uncaught crash.
process.on('uncaughtException', handleFatal);
process.on('unhandledRejection', handleFatal);

const { run } = await import('./cli.js');
run();
