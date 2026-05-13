const ENV_RE = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

export function interpolate(value: string): string {
  return value.replace(ENV_RE, (_, name) => process.env[name] ?? '');
}

export function interpolateEnv(env: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).map(([k, v]) => [k, interpolate(v)])
  );
}
