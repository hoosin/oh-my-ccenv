# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `--show-secrets` flag for `ccenv current` to reveal full token/key values on demand.
- Built-in `anthropic` provider entry in `data/models.json` with current Claude model IDs (`claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`).
- `Nh` (hours) time window support for `ccenv stats --since`, e.g. `--since 24h`.
- README and man-page section documenting the reserved `claude` profile.

### Changed

- Templates are no longer copied into the user's config directory at install time. They are scaffolds, not live profiles: `templates/*.toml` ships inside the npm package and is read on demand by `ccenv add` (for provider descriptions) and `ccenv edit <preset>` / `ccenv edit --reset` (to materialize a profile when the user explicitly asks for it). A fresh install now shows only the built-in `claude` entry under `ccenv list` instead of five preset profiles the user never asked for.
- `ccenv current` masks token-like fields (`*TOKEN*`, `*KEY*`, `*SECRET*`, `*PASSWORD*`) by default; pass `--show-secrets` to print full values.
- `ccenv current` now exits with code 1 on errors (previously returned 0 even when no current profile was set or the profile was invalid).
- `ccenv add` "Next" hint rewritten to make the difference between `switch + launch` and `switch only` explicit, and to surface the `ccenv claude` shortcut.
- Profile-name validation produces uniform friendly errors across `add` / `use` / `remove` / `edit` / `launch`. The interactive `add` prompt now rejects invalid characters inline so users can retype without losing context.
- Populated the previously empty `deepseek` model list in `data/models.json` (`deepseek-chat`, `deepseek-reasoner`).

### Fixed

- `ccenv remove` could silently delete the built-in `claude` profile once `ccenv edit claude` had materialized its template file, breaking subsequent stock-Anthropic launches. Reserved names are now blocked from removal in both the CLI-arg and picker code paths.
- `ccenv add claude` is now rejected so it can no longer shadow the built-in entry.
- `ccenv edit` on Windows previously fell back to `vi` (not present on Windows) and silently failed. The fallback is now `notepad` on Windows / `vi` elsewhere, the editor is invoked through the shell so `EDITOR` values like `code --wait` and `.cmd`/`.bat` shims resolve, and a non-zero exit prints a hint to set the `EDITOR` environment variable.
- Windows config-directory resolution. `process.env.HOME` is unset on Windows, so the previous fallback produced a literal `~/.config/ccenv/…` path and broke every command. The resolver now uses `os.homedir()` and prefers `%APPDATA%\ccenv\` on Windows (still honoring `XDG_CONFIG_HOME` when set). Same fix applied to the `postinstall` script that seeds templates.
- Launching `claude` on Windows. `spawn('claude.cmd', …)` throws `EINVAL` on Node ≥ 18.20 / 20.11 (CVE-2024-27980); `ccenv <name>` now spawns with `shell: true` on win32 so the `.cmd` shim resolves.
- `ccenv man` no longer crashes on Windows where `man(1)` is absent. It now prints a pointer to the raw `ccenv.1` page and suggests `ccenv help` for inline help.

### Removed

- `postinstall` script. The package no longer runs any code at install time; `dist/postinstall.js` is gone, and `src/postinstall.ts` was deleted. Config directories are created lazily by the first command that writes (`ccenv add` / `use` / `<name>`).

### Security

- Profile and cache files are now consistently created with mode `0600`. Previously, profile files initialized via `ccenv edit --reset`, the stats cache, and the models cache all fell back to the umask-default `0644`, making tokens potentially readable by other local users.
- `ccenv current` no longer prints raw token values to the terminal by default, reducing accidental leakage during screen sharing or pasting output into bug reports.

## [0.1.2] - 2026-05-01

Initial public release on npm as `oh-my-ccenv`.
