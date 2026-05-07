

 
<p align="center">
  <img src="https://raw.githubusercontent.com/hoosin/oh-my-ccenv/main/docs/assets/logo.svg" alt="ccenv logo" width="360" />
</p>

# ccenv

<p align="center">
  <strong>Manage Claude Code profiles, like pyenv for Python.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/oh-my-ccenv"><img src="https://img.shields.io/npm/v/oh-my-ccenv.svg" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/oh-my-ccenv.svg" alt="License" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/oh-my-ccenv.svg" alt="Node" /></a>
  <a href="https://github.com/hoosin/oh-my-ccenv"><img src="https://img.shields.io/badge/view-code-green.svg" alt="View Code" /></a>
  <a href="https://github.com/hoosin/oh-my-ccenv">
   <img src="https://img.shields.io/github/stars/hoosin/oh-my-ccenv?style=social" alt="GitHub Stars" />
  </a>
</p>

<p align="center">
  <a href="./README.zh-CN.md">简体中文</a> · <strong>English</strong>
</p>

---

`ccenv` manages and switches between multiple [Claude Code](https://github.com/anthropics/claude-code) provider profiles (Anthropic, Volcengine, Bailian, DeepSeek, etc.) — without background daemons, shell aliases, or shims.

## Demo

<p align="center">
  <img src="https://raw.githubusercontent.com/hoosin/oh-my-ccenv/refs/heads/main/docs/assets/demo.svg" alt="ccenv demo" width="720" />
</p>

## Features

- **Instant Switching:** Change active Claude environments with a single command.
- **No Plaintext Keys:** Resolves `${ENV_VAR}` directly from your shell environment.
- **Local Analytics:** Parses token usage directly from `~/.claude/projects/`. No data leaves your machine.
- **Zero Background Overhead:** Reads config, sets environment variables, and `exec`s the `claude` binary.

## Installation
```bash
npm install -g oh-my-ccenv
# or
pnpm add -g oh-my-ccenv
```

*Requires Node.js >= 18.17.0 and `claude` binary on your `PATH`.*

## Usage

**1. Add a profile:**
```bash
ccenv add work
```
Follow the prompts to select your provider and set your token (using env vars like `${ANTHROPIC_API_KEY}` is recommended).

**2. Switch & Launch:**
```bash
ccenv use work   # Set 'work' as active profile
ccenv            # Launch Claude Code with current profile
```
*Tip: You can bypass the active profile by running `ccenv <profile_name>` directly.*

## Commands

| Command | Description |
| :--- | :--- |
| `ccenv add [name]` | Create a new profile |
| `ccenv use [name]` | Switch the active profile |
| `ccenv stats` | Show local token usage (7d, 30d, etc.) |
| `ccenv list` | List all available profiles |
| `ccenv current` | Show active profile and env status |
| `ccenv edit <name>` | Open profile in `$EDITOR` |
| `ccenv remove <name>` | Delete a profile |

## Under the Hood & Security

`ccenv` stores configuration in simple TOML files under `~/.config/ccenv/profiles/`. 
To ensure security:
- Config files are created with `0600` permissions.
- You can (and should) reference API keys via environment variables rather than hardcoding them in the TOML files, keeping them safe for version control or dotfiles management.

## Development

1. `pnpm install`
2. `pnpm dev` (watch mode)
3. `pnpm test`

PRs and issues are welcome.

---

### License

MIT © [hoosin](https://github.com/hoosin)
