# ccenv

[![npm](https://img.shields.io/npm/v/@hoosin/ccenv.svg)](https://www.npmjs.com/package/@hoosin/ccenv)
[![License](https://img.shields.io/npm/l/@hoosin/ccenv.svg)](./LICENSE)
[![Node](https://img.shields.io/node/v/@hoosin/ccenv.svg)](https://nodejs.org)
[![View Code](https://img.shields.io/badge/view-code-green.svg)](https://github.com/hoosin/ccenv)

**简体中文** · [English](./README.md)
像 pyenv 一样管理 Python 版本，ccenv 是为 [Claude Code](https://github.com/anthropics/claude-code) 量身定制的配置管理与用量分析工具。借鉴了 **pyenv** 管理 Python 版本的思路，让你能够一键在 Anthropic 官方、OpenRouter、火山引擎、阿里云百炼、DeepSeek 以及自定义网关之间无缝切换。

## 🚀 为什么选择 ccenv？

*   **🎭 类 pyenv 的管理体验：** 轻松切换多个 Claude 环境和 Provider。
*   **🎯 配置文件零密钥：** 支持 `${ENV_VAR}` 占位符，密钥留在 Shell 环境中，安全不泄露。
*   **📊 原生用量统计：** 直接解析 Claude Code 本地会话日志，跨 Profile 汇总 Token 消耗。
*   **🛠️ 全程交互式操作：** 从配置创建到环境切换，均提供丝滑的交互式引导。
*   **🇨🇳 国内主流模型全覆盖：** 内置火山引擎、阿里云百炼、DeepSeek、蚂蚁百灵及小米 MiMo 预设。
*   **💻 开发者至上：** 纯粹的终端体验，为效率而生。

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
*   **一键启停：** `ccenv <name>` 自动切换 Profile 并直接唤起 `claude`。
*   **智能交互：** 不带参数运行 `ccenv` 即可唤起交互式选择列表，支持快捷搜索。
*   **环境自动隔离：** 使用第三方 Provider 时自动处理 `ANTHROPIC_API_KEY` 等冲突，避免干扰。

### 用量统计
*   **深度集成：** 自动读取 `~/.claude/projects/**/*.jsonl`，确保数据来源准确可靠。
*   **多维汇总：** 支持按 Profile、模型、项目进行分组展示。
*   **时间筛选：** 灵活查看过去 7 天、30 天或自定义日期的用量走势。

### 安全与便携性
*   **TOML 格式配置：** 结构清晰，易于阅读，且完美适配 Git 追踪管理。
*   **安全加固：** 配置文件默认以 `0600` 权限创建，严防越权访问。
*   **动态环境解析：** 在启动瞬间解析环境变量，确保配置的动态灵活性。

## 🚀 快速上手

### 基础用法

**唤起交互式选择器**
```bash
ccenv
```

**切换至特定 Profile 并启动 Claude**
```bash
ccenv deepseek
```

**创建新 Profile**
```bash
ccenv add work
```

### 统计示例

**查看最近 7 天的 Token 消耗**
```bash
ccenv stats --since 7d
```

**按模型维度查看统计数据**
```bash
ccenv stats --by model
```

## 📚 命令手册

| 命令 | 说明 |
| --- | --- |
| `ccenv [name]` | 切换配置并启动 Claude（不带参数即进入交互选择） |
| `add [name]` | 交互式创建新配置 |
| `use [name]` | 仅切换当前配置，不启动 Claude |
| `list` | 列出所有已保存的配置 |
| `current` | 显示当前生效的配置及环境变量 |
| `remove [name]` | 删除指定的配置 |
| `edit [name]` | 调用 `$EDITOR` 快速编辑配置 |
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
