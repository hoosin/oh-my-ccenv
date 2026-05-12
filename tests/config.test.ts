import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoTemplatesDir = join(__dirname, '..', 'templates');

// Override config dir before importing modules
let tempDir: string;

describe('config layer', () => {
  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ccenv-test-'));
    process.env.XDG_CONFIG_HOME = tempDir;
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.XDG_CONFIG_HOME;
  });

  it('paths: configDir uses XDG_CONFIG_HOME', async () => {
    const { configDir, profilesDir } = await import('../src/config/paths.js');
    expect(configDir()).toBe(join(tempDir, 'ccenv'));
    expect(profilesDir()).toBe(join(tempDir, 'ccenv', 'profiles'));
  });

  it('paths: isValidProfileName accepts ordinary names', async () => {
    const { isValidProfileName } = await import('../src/config/paths.js');
    expect(isValidProfileName('alpha')).toBe(true);
    expect(isValidProfileName('my-profile_2')).toBe(true);
    expect(isValidProfileName('Connection')).toBe(true);  // not exact match for "con"
  });

  it('paths: isValidProfileName rejects path chars and Windows reserved names', async () => {
    const { isValidProfileName } = await import('../src/config/paths.js');
    expect(isValidProfileName('../etc/passwd')).toBe(false);
    expect(isValidProfileName('a b')).toBe(false);
    // Windows reserved (case-insensitive)
    expect(isValidProfileName('con')).toBe(false);
    expect(isValidProfileName('NUL')).toBe(false);
    expect(isValidProfileName('com1')).toBe(false);
    expect(isValidProfileName('LPT9')).toBe(false);
  });

  it('paths: XDG wins over APPDATA on win32', async () => {
    const { configDir } = await import('../src/config/paths.js');
    const prevAppdata = process.env.APPDATA;
    process.env.APPDATA = join(tempDir, 'AppDataRoaming');
    try {
      // XDG_CONFIG_HOME is already set by beforeEach; it must win regardless of platform
      expect(configDir()).toBe(join(tempDir, 'ccenv'));
    } finally {
      if (prevAppdata === undefined) delete process.env.APPDATA;
      else process.env.APPDATA = prevAppdata;
    }
  });

  it('current: read/write round-trip', async () => {
    const { readCurrent, writeCurrent } = await import('../src/config/current.js');
    expect(readCurrent()).toBeNull();
    writeCurrent('deepseek');
    expect(readCurrent()).toBe('deepseek');
  });

  it('current: empty file returns null (matches remove cleared state)', async () => {
    const { readCurrent } = await import('../src/config/current.js');
    const { currentPath, ensureConfigDir } = await import('../src/config/paths.js');
    ensureConfigDir();
    writeFileSync(currentPath(), '\n');
    expect(readCurrent()).toBeNull();
    writeFileSync(currentPath(), '   \n\n');
    expect(readCurrent()).toBeNull();
  });

  it('listProfiles: scans profiles dir', async () => {
    const { profilesDir } = await import('../src/config/paths.js');
    const { listProfiles } = await import('../src/config/list-profiles.js');
    const pDir = profilesDir();
    const { mkdirSync } = await import('node:fs');
    mkdirSync(pDir, { recursive: true });
    writeFileSync(join(pDir, 'alpha.toml'), '');
    writeFileSync(join(pDir, 'beta.toml'), '');
    expect(listProfiles()).toEqual(['alpha', 'beta', 'claude']);
  });

  it('saveProfile + loadProfile round-trip', async () => {
    const { saveProfile } = await import('../src/config/save-profile.js');
    const { loadProfile } = await import('../src/config/load-profile.js');
    saveProfile('test', {
      description: 'test profile',
      env: {
        ANTHROPIC_BASE_URL: 'https://example.com',
        ANTHROPIC_AUTH_TOKEN: 'tok',
        ANTHROPIC_MODEL: 'model-x',
      },
    });
    const profile = loadProfile('test');
    expect(profile.description).toBe('test profile');
    expect(profile.env.ANTHROPIC_BASE_URL).toBe('https://example.com');
    expect(profile.env.ANTHROPIC_MODEL).toBe('model-x');
  });

  it('saveProfile: patch-merge preserves unknown top-level keys and env entries', async () => {
    const { profilePath, ensureConfigDir } = await import('../src/config/paths.js');
    const { saveProfile } = await import('../src/config/save-profile.js');
    ensureConfigDir();
    // Pre-seed a profile with an extra top-level key + extra env key the
    // save path doesn't know about (passthrough). They must survive a save.
    writeFileSync(
      profilePath('patched'),
      [
        'description = "old"',
        'custom_key = "should-survive"',
        '',
        '[env]',
        'ANTHROPIC_BASE_URL = "https://old.example.com"',
        'HTTP_PROXY = "http://proxy:8080"',
        '',
      ].join('\n')
    );

    saveProfile('patched', {
      description: 'new',
      env: { ANTHROPIC_AUTH_TOKEN: 'tok' },
    });

    const { parse } = await import('smol-toml');
    const reread = parse(
      (await import('node:fs')).readFileSync(profilePath('patched'), 'utf-8')
    ) as Record<string, unknown>;
    expect(reread.description).toBe('new');
    expect(reread.custom_key).toBe('should-survive');
    const env = reread.env as Record<string, string>;
    expect(env.ANTHROPIC_BASE_URL).toBe('https://old.example.com');
    expect(env.HTTP_PROXY).toBe('http://proxy:8080');
    expect(env.ANTHROPIC_AUTH_TOKEN).toBe('tok');
  });

  it('loadProfile: throws on missing profile', async () => {
    const { loadProfile } = await import('../src/config/load-profile.js');
    expect(() => loadProfile('nonexistent')).toThrow('not found');
  });

  it('loadProfile: throws friendly error on malformed TOML', async () => {
    const { profilesDir } = await import('../src/config/paths.js');
    const { loadProfile } = await import('../src/config/load-profile.js');
    const { mkdirSync } = await import('node:fs');
    const pDir = profilesDir();
    mkdirSync(pDir, { recursive: true });
    writeFileSync(join(pDir, 'broken.toml'), 'this is = not valid {{{');
    expect(() => loadProfile('broken')).toThrow(/malformed TOML/);
  });

  it('loadProfile: throws friendly error on schema mismatch', async () => {
    const { profilesDir } = await import('../src/config/paths.js');
    const { loadProfile } = await import('../src/config/load-profile.js');
    const { mkdirSync } = await import('node:fs');
    const pDir = profilesDir();
    mkdirSync(pDir, { recursive: true });
    writeFileSync(
      join(pDir, 'wrongtype.toml'),
      'description = 123\n[env]\nANTHROPIC_BASE_URL = "ok"\n'
    );
    expect(() => loadProfile('wrongtype')).toThrow(
      /is invalid: description/
    );
  });

  it('loadProfile: provides defaults for virtual claude profile', async () => {
    const { loadProfile } = await import('../src/config/load-profile.js');
    const profile = loadProfile('claude');
    expect(profile.description).toBe('Official Anthropic Claude');
    expect(profile.env).toEqual({});
  });

  it('migrate: deletes profile files byte-equal to bundled templates', async () => {
    const { profilesDir, configDir } = await import('../src/config/paths.js');
    const { purgeTemplateProfilesOnce } = await import('../src/config/migrate.js');
    const { readFileSync, mkdirSync } = await import('node:fs');
    const pDir = profilesDir();
    mkdirSync(pDir, { recursive: true });

    // Locate templates dir relative to repo (tests run from repo root).
    const tplDeepseek = readFileSync(join(repoTemplatesDir, 'deepseek.toml'), 'utf-8');

    // Pristine template copy → should be deleted.
    writeFileSync(join(pDir, 'deepseek.toml'), tplDeepseek);
    // Edited copy → should be preserved.
    writeFileSync(join(pDir, 'bailian.toml'), 'description = "edited by user"\n');
    // Unrelated user profile → untouched.
    writeFileSync(join(pDir, 'mine.toml'), 'description = "mine"\n');

    purgeTemplateProfilesOnce();

    expect(existsSync(join(pDir, 'deepseek.toml'))).toBe(false);
    expect(existsSync(join(pDir, 'bailian.toml'))).toBe(true);
    expect(existsSync(join(pDir, 'mine.toml'))).toBe(true);
    expect(existsSync(join(configDir(), '.migrated-template-purge'))).toBe(true);
  });

  it('migrate: idempotent — second run is a no-op even if templates reappear', async () => {
    const { profilesDir } = await import('../src/config/paths.js');
    const { purgeTemplateProfilesOnce } = await import('../src/config/migrate.js');
    const { readFileSync, mkdirSync } = await import('node:fs');
    const pDir = profilesDir();
    mkdirSync(pDir, { recursive: true });

    purgeTemplateProfilesOnce(); // writes marker against empty dir

    const tpl = readFileSync(join(repoTemplatesDir, 'deepseek.toml'), 'utf-8');
    writeFileSync(join(pDir, 'deepseek.toml'), tpl);
    purgeTemplateProfilesOnce();

    // Marker present → second call must NOT touch the file.
    expect(existsSync(join(pDir, 'deepseek.toml'))).toBe(true);
  });

  it('migrate: skips file matching the current profile', async () => {
    const { profilesDir } = await import('../src/config/paths.js');
    const { writeCurrent } = await import('../src/config/current.js');
    const { purgeTemplateProfilesOnce } = await import('../src/config/migrate.js');
    const { readFileSync, mkdirSync } = await import('node:fs');
    const pDir = profilesDir();
    mkdirSync(pDir, { recursive: true });

    const tpl = readFileSync(join(repoTemplatesDir, 'deepseek.toml'), 'utf-8');
    writeFileSync(join(pDir, 'deepseek.toml'), tpl);
    writeCurrent('deepseek');

    purgeTemplateProfilesOnce();

    expect(existsSync(join(pDir, 'deepseek.toml'))).toBe(true);
  });

  it('migrate: does not create configDir on a fresh install', async () => {
    const { configDir } = await import('../src/config/paths.js');
    const { purgeTemplateProfilesOnce } = await import('../src/config/migrate.js');
    purgeTemplateProfilesOnce();
    expect(existsSync(configDir())).toBe(false);
  });

  it('presets: loads from templates', async () => {
    const { presets } = await import('../src/config/presets.js');
    expect(presets.length).toBeGreaterThan(0);
    for (const p of presets) {
      expect(p.id).toBeTruthy();
      expect(p.base_url).toBeTruthy();
      expect(p.description).toBeTruthy();
    }
    expect(presets.find((p) => p.id === 'volcengine')).toBeDefined();
  });
});
