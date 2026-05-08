import {
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { configDir, profilesDir } from './paths.js';
import { readCurrent } from './current.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MARKER = '.migrated-template-purge';

function templatesRoot(): string | null {
  const candidates = [
    join(__dirname, '..', '..', 'templates'),
    join(__dirname, '..', 'templates'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function normalize(buf: Buffer): string {
  return buf.toString('utf-8').replace(/\r\n/g, '\n');
}

/**
 * One-shot cleanup of profile files left over from the v0.1.5 postinstall,
 * which seeded `templates/*.toml` into the user's profiles directory. Only
 * deletes files that are byte-equal (modulo line endings) to the bundled
 * template — anything the user has edited is preserved. Skips the file
 * matching the current profile out of paranoia. Idempotent via marker file.
 */
export function purgeTemplateProfilesOnce(): void {
  const cfg = configDir();
  if (!existsSync(cfg)) return;
  const marker = join(cfg, MARKER);
  if (existsSync(marker)) return;

  const pDir = profilesDir();
  const tDir = templatesRoot();

  if (existsSync(pDir) && tDir) {
    let current: string | null = null;
    try {
      current = readCurrent();
    } catch {
      /* ignore */
    }

    try {
      for (const file of readdirSync(tDir)) {
        if (!file.endsWith('.toml')) continue;
        const dest = join(pDir, file);
        if (!existsSync(dest)) continue;
        const name = file.replace(/\.toml$/, '');
        if (name === current) continue;
        try {
          const a = normalize(readFileSync(join(tDir, file)));
          const b = normalize(readFileSync(dest));
          if (a === b) unlinkSync(dest);
        } catch {
          /* per-file failure = skip */
        }
      }
    } catch {
      /* dir read failure = skip */
    }
  }

  try {
    writeFileSync(marker, '', { mode: 0o600 });
  } catch {
    /* if we can't write the marker, we'll just retry next run */
  }
}
