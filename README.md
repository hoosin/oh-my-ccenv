# @hoosin/ccenv

A profile manager and usage analytics tool for Claude Code.

[简体中文](./README.zh-CN.md) · English

```bash
npm i -g @hoosin/ccenv

ccenv add ling          # interactively create a profile
ccenv use ling          # switch active profile
ccenv                   # launch claude with that profile
ccenv stats --since 7d  # see token usage & cost per profile
```

---

> **Naming conflict** — The bare `ccenv` name on npm belongs to [william-zxs/ccenv](https://github.com/william-zxs/ccenv), which stores all profiles in a single JSON file. This project uses a different architecture: **one TOML file per profile** under `~/.config/ccenv/profiles/`. The two cannot be installed globally at the same time.
>
> v0.2 will provide `ccenv import ~/.ccenv/settings.json` to migrate existing ccenv users.

---

## Why

Claude Code lets you point at any Anthropic-compatible API by setting environment variables. People hand-roll shell functions like:

```bash
claude-ling() {
  ANTHROPIC_BASE_URL="https://openrouter.ai/api" \
  ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY" \
  ANTHROPIC_MODEL="inclusionai/ling-2.6-1t:free" \
  ...
  claude "$@"
}
```

This works for one or two providers. With three or more it gets messy: keys scattered across dotfiles, no list view, no usage tracking. `ccenv` does it cleanly.

## Features

- **One file per profile** — each profile is an independent TOML file you can share, git-track, or edit directly.
- **Built-in provider presets** — Volcengine Coding Plan, Bailian Coding Plan, DeepSeek, BailLing, MiMo. Pick one during `ccenv add` and the URL/model auto-fill.
- **`${ENV_VAR}` interpolation** — keep secrets in your shell `export`s, keep profile files checked into git.
- **Usage analytics** — `ccenv stats` parses Claude Code's local jsonl logs and shows tokens / cost grouped by profile, model, or project. Works for any session, even ones launched without `ccenv`.
- **Tiny surface** — 9 commands. No init wizard, no doctor, no plugin system.

## Install

Requires Node.js >= 20.

```bash
npm i -g @hoosin/ccenv
# or
pnpm add -g @hoosin/ccenv
```

This creates `~/.config/ccenv/profiles/` with pre-built profiles for Volcengine (Coding Plan), Bailian (Coding Plan), DeepSeek, BailLing, and MiMo. All tokens use `${ENV_VAR}` placeholders — no secrets in the files. Anthropic is the default provider (no profile needed — just clear the env vars).

`ccenv` will look for a `claude` binary on your `PATH`. If you don't have it:

```bash
npm i -g @anthropic-ai/claude-code
```

## Quick start

After install, profiles are already in `~/.config/ccenv/profiles/`. Just set your token and go:

```bash
# 1. Set your token (pick one provider)
export DEEPSEEK_API_KEY="sk-..."
# or
export MIMO_API_KEY="tp-..."
# or
export VOLCENGINE_API_KEY="..."
# or
export DASHSCOPE_API_KEY="..."

# 2. See what's available
ccenv ls

# 3. Switch and launch
ccenv deepseek       # or: ccenv mimo, ccenv volcengine, ccenv bailian

# 4. See what you've spent
ccenv stats --since 7d
```

Need a custom provider? `ccenv add <name>` walks you through it interactively.

## Commands

| Command | What it does |
|---|---|
| `ccenv` | Launch `claude` with the current profile (or pick one interactively) |
| `ccenv <name>` | Switch to `<name>` and launch `claude` (main daily entry point) |
| `ccenv add <name>` | Create a new profile (interactive prompts) |
| `ccenv use <name>` | Switch the current profile without launching |
| `ccenv ls` | List profiles (current is highlighted with `*`) |
| `ccenv current` | Show the current profile name and effective env |
| `ccenv rm <name>` | Delete a profile |
| `ccenv edit [name]` | Open a profile file in `$EDITOR` (defaults to current) |
| `ccenv stats [opts]` | Show token usage and cost (see below) |

### `ccenv stats` options

```
--by profile|model|project    Group rows by this dimension (default: profile)
--since 7d|30d|YYYY-MM-DD     Time window
--profile <name>              Filter to a single profile
--json                        Machine-readable output
```

Example:

```
$ ccenv stats --since 7d
PROFILE     CALLS    INPUT       OUTPUT      CACHED      COST
─────────────────────────────────────────────────────────────
ling        142      1.2M        340K        980K        $0.00
deepseek    87       650K        180K        420K        $1.83
anthropic   23       180K        62K         110K        $4.21
─────────────────────────────────────────────────────────────
TOTAL       252      2.0M        582K        1.5M        $6.04
```

## Config files

Stored under `~/.config/ccenv/` (XDG standard):

```
~/.config/ccenv/
├── current                       # plain text: active profile name
└── profiles/
    ├── volcengine.toml           # 火山引擎 Coding Plan
    ├── bailian.toml              # 阿里云百炼 Coding Plan
    ├── deepseek.toml             # DeepSeek
    ├── bailing.toml              # 蚂蚁百灵
    └── mimo.toml                 # MiMo
```

### Profile file example

`~/.config/ccenv/profiles/ling.toml`:

```toml
description = "蚂蚁百灵 via OpenRouter"

[env]
ANTHROPIC_BASE_URL = "https://openrouter.ai/api"
ANTHROPIC_AUTH_TOKEN = "${OPENROUTER_API_KEY}"
ANTHROPIC_MODEL = "inclusionai/ling-2.6-1t:free"
```

- **Profile name = filename** — `ling.toml` becomes profile `ling`. No `name` field inside the file.
- `description` — optional, shown in `ccenv ls`.
- `[env]` — flat env-var mapping. Supports `${ENV_VAR}` placeholders that are resolved at launch time.
- The `[env]` section is free-form — you can add any env var Claude Code supports.

### `current` file

Plain text, one line:

```
ling
```

If missing or empty, `ccenv` opens an interactive picker on launch.

`ccenv` also injects `ANTHROPIC_API_KEY=""` on every launch — without this, an exported `ANTHROPIC_API_KEY` in your shell would override the third-party token. This is the most common new-user gotcha.

## Security

- Tokens are stored **in plaintext** under `~/.config/ccenv/profiles/`. Files are created with mode `0600`. There is no encryption layer.
- For tokens you want to keep out of the file, write them to your shell as `export OPENROUTER_API_KEY=...` and reference them via `${OPENROUTER_API_KEY}` in the profile.
- macOS Keychain / libsecret integration is on the roadmap, not in v0.1.

## How `stats` works

`ccenv stats` reads `~/.claude/projects/<project-slug>/*.jsonl` — Claude Code's own session logs. Each assistant turn carries `model` and `usage` (input / output / cache tokens), which is everything we need.

Profile attribution:
1. Match by `model` name against each profile's `ANTHROPIC_MODEL`.
2. Fall back to `~/.config/ccenv/sessions.jsonl` (written every time `ccenv` launches a session) and match by cwd + timestamp window.
3. Otherwise the row is grouped under `unknown`.

Pricing comes from a built-in `pricing.json`. If a model is missing, the row shows tokens but no cost — please open a PR.

## Roadmap

- v0.1 — `add` / `use` / `ls` / `current` / `rm` / `edit` / `stats`, multi-file TOML profiles
- v0.2 — `ccenv import` (migrate from william-zxs/ccenv single-file JSON), better diagnostics, README GIFs
- v0.3 — macOS Keychain integration, Windows verified
- v1.0 — frozen config schema, auto-synced pricing, CHANGELOG

## License

MIT (c) hoosin

## Acknowledgements

- [`william-zxs/ccenv`](https://github.com/william-zxs/ccenv) — the original `ccenv`. This project shares the binary name and core idea; we use per-profile TOML files and add usage analytics.
- [`@anthropic-ai/claude-code`](https://www.npmjs.com/package/@anthropic-ai/claude-code) — the upstream tool we wrap.
