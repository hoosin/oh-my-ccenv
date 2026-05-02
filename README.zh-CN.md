# ccenv

[![npm](https://img.shields.io/npm/v/@hoosin/ccenv.svg)](https://www.npmjs.com/package/@hoosin/ccenv)
[![License](https://img.shields.io/npm/l/@hoosin/ccenv.svg)](./LICENSE)
[![Node](https://img.shields.io/node/v/@hoosin/ccenv.svg)](https://nodejs.org)
[![View Code](https://img.shields.io/badge/view-code-green.svg)](https://github.com/hoosin/ccenv)

**简体中文** · [English](./README.md)
像 pyenv 一样管理 Claude 环境，ccenv 是为 [Claude Code](https://github.com/anthropics/claude-code) 量身定制的配置管理与用量分析工具。借鉴了 **pyenv** 管理 Python 版本的思路，让你能够一键在 Anthropic 官方、OpenRouter、火山引擎、阿里云百炼、DeepSeek 以及自定义网关之间无缝切换。

## 🚀 为什么选择 ccenv？

*   **🎭 类 pyenv 的管理体验：** 轻松切换多个 Claude 环境和 Provider。
*   **🎯 配置文件零密钥：** 支持 `${ENV_VAR}` 占位符，密钥留在 Shell 环境中，安全不泄露。
*   **📊 原生用量统计：** 直接解析 Claude Code 本地会话日志，跨 Profile 汇总 Token 消耗。
*   **🛠️ 全程交互式操作：** 从配置创建到环境切换，都提供交互式引导。
*   **🇨🇳 国内主流模型全覆盖：** 内置火山引擎、阿里云百炼、DeepSeek、蚂蚁百灵及小米 MiMo 预设。
*   **💻 开发者至上：** 纯粹的终端体验，专为命令行用户设计。

## 📦 安装

需 Node.js >= 18.17.0，且系统中已安装 `claude`。

### 快速安装

**使用 npm 全局安装**
```bash
npm install -g @hoosin/ccenv
```

**使用 pnpm 全局安装**
```bash
pnpm add -g @hoosin/ccenv
```

## 📋 核心功能

### Provider 切换与管理
*   **快速启动：** 不带参数运行 `ccenv` 即以当前 Profile 启动 `claude`。
*   **一键切换：** `ccenv <name>` 自动切换 Profile 并直接唤起 `claude`。
*   **交互式切换：** 运行 `ccenv use` 不带参数即唤起交互式选择列表，支持快捷搜索。
*   **环境自动隔离：** 使用第三方 Provider 时自动处理 `ANTHROPIC_API_KEY` 等冲突，避免干扰。

### 用量统计
*   **深度集成：** 自动读取 `~/.claude/projects/**/*.jsonl`，确保数据来源准确可靠。
*   **多维汇总：** 支持按 Profile、模型、项目进行分组展示。
*   **时间筛选：** 灵活查看过去 7 天、30 天或自定义日期的用量走势。

### 安全与便携性
*   **TOML 格式配置：** 结构清晰，易于阅读，方便用 Git 跟踪。
*   **文件权限：** 配置文件默认以 `0600` 权限创建，仅当前用户可读。
*   **动态环境解析：** 启动时从 Shell 环境读取占位符变量，密钥不落盘。

## 🚀 快速上手

**以当前 Profile 启动 Claude**
```bash
ccenv
```

**切换至特定 Profile 并启动 Claude**
```bash
ccenv deepseek
```

**交互式选择 Profile（仅切换，不启动）**
```bash
ccenv use
```

**创建新 Profile**
```bash
ccenv add work
```

**查看最近 7 天的 Token 消耗**
```bash
ccenv stats --since 7d
```

**默认按模型维度查看统计数据**
```bash
ccenv stats
```

## 📚 命令手册

| 命令 | 说明 |
| --- | --- |
| `ccenv [name]` | 启动 Claude（不带参数 = 当前 Profile；带 name = 切换并启动） |
| `add [name]` | 交互式创建新配置 |
| `use [name]` | 仅切换当前配置，不启动 Claude |
| `list` | 列出所有已保存的配置 |
| `current` | 显示当前生效的配置及环境变量 |
| `remove [name]` | 删除指定的配置 |
| `edit [name]` | 调用 `$EDITOR` 快速编辑配置（`--reset` 从模板重新生成） |
| `stats [options]` | 显示 Token 用量统计报表 |
| `man` | 打开详细帮助手册 |

## 📖 文档

*   [架构与设计](./docs/design.md) - 深入了解 ccenv 的运行机制。
*   [统计原理](./docs/stats.md) - 我们是如何解析 Claude Code 日志的。

## 🤝 参与贡献

我们非常欢迎社区贡献！ccenv 采用 MIT 开源协议，你可以通过以下方式参与：
*   提交 Bug 报告或功能建议。
*   贡献新的 Provider 预设模板。
*   改进文档或撰写教程。

源码地址：[github.com/hoosin/ccenv](https://github.com/hoosin/ccenv)。

## 📄 法律信息

*   **License:** MIT © hoosin
*   **资源:** [NPM Package](https://www.npmjs.com/package/@hoosin/ccenv) \| [更新日志](https://github.com/hoosin/ccenv/releases)

为 Claude Code 社区精心打造 ❤️

<p align="left">
 <a href="https://www.star-history.com/hoosin/ccenv">
  <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/badge?repo=hoosin/ccenv&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/badge?repo=hoosin/ccenv" />
   <img alt="Star History Rank" src="https://api.star-history.com/badge?repo=hoosin/ccenv" />
  </picture>
 </a>
</p>
