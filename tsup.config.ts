import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/bin.ts'],
    format: ['esm'],
    outDir: 'dist',
    banner: { js: '#!/usr/bin/env node' },
    clean: true,
    splitting: true,
  },
  {
    entry: ['src/postinstall.ts'],
    format: ['esm'],
    outDir: 'dist',
    clean: false,
  },
]);
