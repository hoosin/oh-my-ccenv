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
    expect(listProfiles()).toEqual(['alpha', 'beta']);
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

  it('presets: has 5 providers', async () => {
    const { presets } = await import('../src/config/presets.js');
    expect(presets).toHaveLength(5);
    expect(presets.map((p) => p.id)).toEqual([
      'volcengine', 'bailian', 'deepseek', 'bailing', 'mimo',
    ]);
  });
});
