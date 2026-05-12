import {
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  configDir,
  profilesDir,
  bundledTemplatesDir,
  migrationMarkerPath,
} from './paths.js';
import { readCurrent } from './current.js';

function normalize(buf: Buffer): string {
  return buf.toString('utf-8').replace(/\r\n/g, '\n');
}

/**
 * One-shot cleanup of profile files left over from the v0.1.5 postinstall,
 * which seeded `templates/*.toml` into the user's profiles directory. Only
 * deletes files that are byte-equal (modulo line endings) to the bundled
 * template — anything the user has edited is preserved. Skips the file
 * matching the current profile out of paranoia. Idempotent via marker file.
 *
 * Returns the list of profile names that were cleaned up. Callers decide
 * whether to surface that to the user (keeps this config-layer pure).
 *
 * TODO(v0.2): delete this function and its call in cli.ts — by then anyone
 * still on v0.1.5 has either upgraded through a version that ran this purge,
 * or has long since cleaned up manually.
 */
export function purgeTemplateProfilesOnce(): string[] {
  const cleaned: string[] = [];

  const cfg = configDir();
  if (!existsSync(cfg)) return cleaned;
  const marker = migrationMarkerPath();
  if (existsSync(marker)) return cleaned;

  const pDir = profilesDir();
  const tDir = bundledTemplatesDir();

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
          if (a === b) {
            unlinkSync(dest);
            cleaned.push(name);
          }
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

  return cleaned;
}
