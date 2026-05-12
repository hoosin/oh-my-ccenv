import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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

  it('listProfiles: scans profiles dir', async () => {
    const { profilesDir } = await import('../src/config/paths.js');
    const { listProfiles } = await import('../src/config/listProfiles.js');
    const pDir = profilesDir();
    const { mkdirSync } = await import('node:fs');
    mkdirSync(pDir, { recursive: true });
    writeFileSync(join(pDir, 'alpha.toml'), '');
    writeFileSync(join(pDir, 'beta.toml'), '');
    expect(listProfiles()).toEqual(['alpha', 'beta', 'claude']);
  });

  it('saveProfile + loadProfile round-trip', async () => {
    const { saveProfile } = await import('../src/config/saveProfile.js');
    const { loadProfile } = await import('../src/config/loadProfile.js');
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

  it('loadProfile: throws on missing profile', async () => {
    const { loadProfile } = await import('../src/config/loadProfile.js');
    expect(() => loadProfile('nonexistent')).toThrow('not found');
  });

  it('loadProfile: provides defaults for virtual claude profile', async () => {
    const { loadProfile } = await import('../src/config/loadProfile.js');
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
    const repoTemplates = join(process.cwd(), 'templates');
    const tplDeepseek = readFileSync(join(repoTemplates, 'deepseek.toml'), 'utf-8');

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

    const tpl = readFileSync(join(process.cwd(), 'templates', 'deepseek.toml'), 'utf-8');
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

    const tpl = readFileSync(join(process.cwd(), 'templates', 'deepseek.toml'), 'utf-8');
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
