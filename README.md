# ccenv

[![npm](https://img.shields.io/npm/v/@hoosin/ccenv.svg)](https://www.npmjs.com/package/@hoosin/ccenv)
[![License](https://img.shields.io/npm/l/@hoosin/ccenv.svg)](./LICENSE)
[![Node](https://img.shields.io/node/v/@hoosin/ccenv.svg)](https://nodejs.org)
[![View Code](https://img.shields.io/badge/view-code-green.svg)](https://github.com/hoosin/ccenv)

[简体中文](./README.zh-CN.md) · **English**

ccenv is a profile manager and usage-analytics CLI for [Claude Code](https://github.com/anthropics/claude-code). It manages your Claude providers like **pyenv** manages Python versions—allowing you to switch between Anthropic official, OpenRouter, Volcengine, Bailian, DeepSeek, and custom gateways with a single command.

## 🚀 Why ccenv?

*   **🎭 Pyenv-like management:** Manage multiple Claude environments and providers seamlessly.
*   **🎯 Zero-secret profiles:** Use `${ENV_VAR}` placeholders to keep your API keys in your shell, not in config files.
*   **📊 Real usage analytics:** Automatically aggregates token usage from Claude Code's local session logs across all profiles.
*   **🛠️ Interactive CLI:** Built-in interactive prompts for adding, switching, and managing profiles.
*   **🇨🇳 First-class Chinese provider support:** Comes with presets for Volcengine, Bailian, DeepSeek, Ant Bailing, and MiMo.
*   **💻 Terminal-first:** Designed for developers who live in the command line.

## 📦 Installation

Requires Node.js >= 18.17.0 and a `claude` binary on your `PATH`.

### Quick Install

**Install globally with npm**
```bash
npm install -g @hoosin/ccenv
```

**Install globally with pnpm**
```bash
pnpm add -g @hoosin/ccenv
```

## 📋 Key Features

### Provider Switching & Management
*   **Switch and launch:** `ccenv <name>` switches the active profile and launches `claude` in one step.
*   **Interactive Fallback:** Run `ccenv` without arguments to pick a profile from an interactive list.
*   **Environment Isolation:** Automatically handles common gotchas like neutralizing `ANTHROPIC_API_KEY` when using 3rd-party providers.

### Usage Analytics
*   **Deep Integration:** Reads `~/.claude/projects/**/*.jsonl` to provide accurate token counts.
*   **Flexible Grouping:** Group stats by profile, model, or project.
*   **Time Windows:** Filter usage by the last 7 days, 30 days, or specific dates.

### Security & Portability
*   **TOML-based Profiles:** Easy to read, edit, and track via Git.
*   **Safe Defaults:** Profile files are created with `0600` permissions.
*   **Dynamic Interpolation:** Resolve secrets from your environment at runtime.

## 🚀 Getting Started

### Basic Usage

**Start with an interactive picker**
```bash
ccenv
```

**Switch to a specific profile and launch Claude**
```bash
ccenv deepseek
```

**Create a new profile interactively**
```bash
ccenv add work
```

### Usage Examples

**Analyze your token usage from the last 7 days**
```bash
ccenv stats --since 7d
```

**Check stats grouped by model**
```bash
ccenv stats --by model
```

## 📚 Commands Reference

| Command | Description |
| --- | --- |
| `ccenv [name]` | Switch profile and launch Claude (no arg = interactive picker) |
| `add [name]` | Create a new profile interactively |
| `use [name]` | Switch current profile without launching |
| `list` | List all profiles |
| `current` | Show current profile name and effective env |
| `remove [name]` | Delete a profile |
| `edit [name]` | Open a profile file in `$EDITOR` |
| `stats [options]` | Show token usage analytics |
| `man` | Open the man page |

## 📖 Documentation

*   [Architecture & Design](./docs/design.md) - Deep dive into how ccenv works.
*   [Stats Internals](./docs/stats.md) - How we parse Claude Code logs.

## 🤝 Contributing

We welcome contributions! ccenv is open source (MIT), and we encourage the community to:
*   Report bugs and suggest features.
*   Submit new provider presets.
*   Improve documentation.

See [github.com/hoosin/ccenv](https://github.com/hoosin/ccenv) for the source code.

## 📄 Legal

*   **License:** MIT © hoosin
*   **Resources:** [NPM Package](https://www.npmjs.com/package/@hoosin/ccenv) \| [Changelog](https://github.com/hoosin/ccenv/releases)

Built with ❤️ for the Claude Code community.

<p align="left">
 <a href="https://www.star-history.com/hoosin/ccenv">
  <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/badge?repo=hoosin/ccenv&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/badge?repo=hoosin/ccenv" />
   <img alt="Star History Rank" src="https://api.star-history.com/badge?repo=hoosin/ccenv" />
  </picture>
 </a>
</p>
