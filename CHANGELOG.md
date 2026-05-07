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

- `ccenv current` masks token-like fields (`*TOKEN*`, `*KEY*`, `*SECRET*`, `*PASSWORD*`) by default; pass `--show-secrets` to print full values.
- `ccenv current` now exits with code 1 on errors (previously returned 0 even when no current profile was set or the profile was invalid).
- `ccenv add` "Next" hint rewritten to make the difference between `switch + launch` and `switch only` explicit, and to surface the `ccenv claude` shortcut.
- Profile-name validation produces uniform friendly errors across `add` / `use` / `remove` / `edit` / `launch`. The interactive `add` prompt now rejects invalid characters inline so users can retype without losing context.
- Populated the previously empty `deepseek` model list in `data/models.json` (`deepseek-chat`, `deepseek-reasoner`).

### Fixed

- `ccenv remove` could silently delete the built-in `claude` profile once `ccenv edit claude` had materialized its template file, breaking subsequent stock-Anthropic launches. Reserved names are now blocked from removal in both the CLI-arg and picker code paths.
- `ccenv add claude` is now rejected so it can no longer shadow the built-in entry.

### Security

- Profile, template, and cache files are now consistently created with mode `0600`. Previously, profile files initialized via `ccenv edit --reset`, templates copied during `postinstall`, the stats cache, and the models cache all fell back to the umask-default `0644`, making tokens potentially readable by other local users.
- `ccenv current` no longer prints raw token values to the terminal by default, reducing accidental leakage during screen sharing or pasting output into bug reports.

## [0.1.2] - 2026-05-01

Initial public release on npm as `oh-my-ccenv`.
