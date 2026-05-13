import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { interpolate, interpolateEnv } from '../src/utils/interpolate.js';

describe('interpolate', () => {
  const orig = process.env.TEST_KEY;

  beforeEach(() => {
    process.env.TEST_KEY = 'hello';
  });

  afterEach(() => {
    if (orig === undefined) delete process.env.TEST_KEY;
    else process.env.TEST_KEY = orig;
  });

  it('resolves ${VAR} from process.env', () => {
    expect(interpolate('${TEST_KEY}')).toBe('hello');
  });

  it('returns empty string for missing var', () => {
    expect(interpolate('${NONEXISTENT_CCENV_KEY}')).toBe('');
  });

  it('handles multiple placeholders', () => {
    process.env.AAA = '111';
    expect(interpolate('${AAA}-${TEST_KEY}')).toBe('111-hello');
    delete process.env.AAA;
  });

  it('leaves non-matching patterns alone', () => {
    expect(interpolate('no-placeholder')).toBe('no-placeholder');
    expect(interpolate('$NOT_A_PLACEHOLDER')).toBe('$NOT_A_PLACEHOLDER');
  });

  it('supports lowercase env var names', () => {
    process.env.my_token = 'xyz';
    try {
      expect(interpolate('${my_token}')).toBe('xyz');
    } finally {
      delete process.env.my_token;
    }
  });
});

describe('interpolateEnv', () => {
  it('interpolates all values in a record', () => {
    process.env.MY_URL = 'https://example.com';
    const result = interpolateEnv({
      ANTHROPIC_BASE_URL: '${MY_URL}',
      ANTHROPIC_MODEL: 'static-value',
    });
    expect(result).toEqual({
      ANTHROPIC_BASE_URL: 'https://example.com',
      ANTHROPIC_MODEL: 'static-value',
    });
    delete process.env.MY_URL;
  });
});
