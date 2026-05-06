<p align="center">
  <img src="https://raw.githubusercontent.com/hoosin/oh-my-ccenv/main/docs/assets/logo.svg" alt="ccenv logo" width="360" />
</p>

# 🌊 ccenv

<p align="center">
  <strong>The lightweight profile manager for Claude Code.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/oh-my-ccenv"><img src="https://img.shields.io/npm/v/oh-my-ccenv.svg" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/oh-my-ccenv.svg" alt="License" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/oh-my-ccenv.svg" alt="Node" /></a>
  <a href="https://github.com/hoosin/oh-my-ccenv"><img src="https://img.shields.io/badge/view-code-green.svg" alt="View Code" /></a>
</p>

<p align="center">
  <a href="./README.zh-CN.md">简体中文</a> · <strong>English</strong>
</p>

---

`ccenv` is a zero-overhead CLI tool that lets you switch between multiple [Claude Code](https://github.com/anthropics/claude-code) provider profiles instantly. Inspired by `pyenv`, it manages your environment variables for Anthropic, Volcengine, Bailian, DeepSeek, and more, without the need for shell hooks or background daemons.

## 🌟 Why ccenv?

- 🔄 **Profile Switching:** Change your active Claude environment with a single command.
- 📊 **Usage Analytics:** Local-first token tracking across all projects and profiles.
- 🔒 **Secure by Design:** Your API keys stay in your shell (`${ENV_VAR}`), not in plaintext files.
- 🚀 **UNIX Philosophy:** A single-purpose tool that does one thing well and exits.

## 📺 Demo

<p align="center">
  <img src="https://raw.githubusercontent.com/hoosin/oh-my-ccenv/refs/heads/main/docs/assets/demo.svg" alt="ccenv demo" width="720" />
</p>

## 🚀 Quick Start

### Installation

```bash
npm install -g oh-my-ccenv
# or
pnpm add -g oh-my-ccenv
```

*Requires Node.js >= 18.17.0 and `claude` binary on your `PATH`.*

### Basic Usage

1.  **Add a profile:**
    ```bash
    ccenv add work
    ```
    Follow the interactive prompt to select a provider (Anthropic, Volcengine, DeepSeek, etc.) and enter your API token.

2.  **Switch profile:**
    ```bash
    ccenv use work
    ```

3.  **Launch Claude:**
    ```bash
    ccenv          # Launch with current profile
    ccenv work     # Switch to 'work' and launch
    ```

## 🛠️ Commands

| Command | Description |
| :--- | :--- |
| `ccenv add [name]` | Create a new profile interactively |
| `ccenv use [name]` | Switch the active profile |
| `ccenv stats` | Show local token usage (last 7d, 30d, etc.) |
| `ccenv list` | List all available profiles |
| `ccenv current` | Show active profile and env status |
| `ccenv edit <name>` | Open profile in your `$EDITOR` |
| `ccenv remove <name>` | Delete a profile |

## ⚙️ How It Works

`ccenv` follows a "no-magic" approach:
1. It reads a simple TOML profile from `~/.config/ccenv/profiles/`.
2. It resolves `${ENV_VAR}` placeholders against your current shell environment.
3. It `exec`s the `claude` binary with the injected environment variables.

No shims, no shell aliases, and no persistent processes.

## 🛡️ Privacy & Security

- **Local Only:** Usage statistics are parsed from Claude Code's local logs (`~/.claude/projects/`). No data ever leaves your machine.
- **Permissioned:** All config files are created with `0600` permissions.
- **Vault-friendly:** We recommend referencing your tokens via environment variables (e.g., `ANTHROPIC_AUTH_TOKEN = "${MY_SECRET}"`) so your TOML files remain safe for version control.

## 🤝 Contributing

Contributions are welcome! Whether it's adding a new provider template or improving the documentation, feel free to open a PR.

1. `pnpm install`
2. `pnpm dev` (watch mode)
3. `pnpm test`

---

### License

MIT © [hoosin](https://github.com/hoosin)

<p align="left">
 <a href="https://www.star-history.com/hoosin/oh-my-ccenv">
  <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/badge?repo=hoosin/oh-my-ccenv&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/badge?repo=hoosin/oh-my-ccenv" />
   <img alt="Star History Rank" src="https://api.star-history.com/badge?repo=hoosin/oh-my-ccenv" />
  </picture>
 </a>
</p>
