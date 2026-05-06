<p align="center">
  <img src="https://raw.githubusercontent.com/hoosin/oh-my-ccenv/main/docs/assets/logo.svg" alt="ccenv logo" width="360" />
</p>

# 🌊 ccenv

<p align="center">
  <strong>专为 Claude Code 打造的轻量级环境管理器。</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/oh-my-ccenv"><img src="https://img.shields.io/npm/v/oh-my-ccenv.svg" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/oh-my-ccenv.svg" alt="License" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/oh-my-ccenv.svg" alt="Node" /></a>
  <a href="https://github.com/hoosin/oh-my-ccenv"><img src="https://img.shields.io/badge/view-code-green.svg" alt="View Code" /></a>
</p>

<p align="center">
  <strong>简体中文</strong> · <a href="./README.md">English</a>
</p>

---

`ccenv` 是一个零开销的 CLI 工具，让你在多个 [Claude Code](https://github.com/anthropics/claude-code) 模型供应商（Provider）配置之间瞬间切换。灵感来自 `pyenv`，它能帮你轻松管理 Anthropic、火山引擎、阿里云百炼、DeepSeek 等不同环境的环境变量，无需 shell hooks 或后台进程。

## 🌟 为什么选择 ccenv？

- 🔄 **配置一键切换：** 只需一条命令，即可更改当前激活的 Claude 运行环境。
- 📊 **本地用量统计：** 跨项目、跨配置追踪 Token 用量，数据完全留在本地。
- 🔒 **安全设计：** API Key 始终留在你的 Shell 中 (`${ENV_VAR}`)，不会以明文形式持久化在文件中。
- 🚀 **UNIX 哲学：** 只做一件事并将其做好。运行即销毁，不占用额外系统资源。

## 📺 演示

<p align="center">
  <img src="https://raw.githubusercontent.com/hoosin/oh-my-ccenv/refs/heads/main/docs/assets/demo.svg" alt="ccenv demo" width="720" />
</p>

## 🚀 快速上手

### 安装

```bash
npm install -g oh-my-ccenv
# 或者
pnpm add -g oh-my-ccenv
```

*需要 Node.js >= 18.17.0，且系统 `PATH` 中已安装 `claude`。*

### 基础用法

1.  **添加配置：**
    ```bash
    ccenv add work
    ```
    按照交互式提示选择 Provider（Anthropic, 火山引擎, DeepSeek 等）并输入 API Token。

2.  **切换配置：**
    ```bash
    ccenv use work
    ```

3.  **启动 Claude：**
    ```bash
    ccenv          # 使用当前配置启动
    ccenv work     # 切换到 'work' 并启动
    ```

## 🛠️ 命令详解

| 命令 | 描述 |
| :--- | :--- |
| `ccenv add [name]` | 交互式创建新配置 |
| `ccenv use [name]` | 切换当前激活的配置 |
| `ccenv stats` | 查看本地 Token 用量（支持 7d, 30d 等时间范围） |
| `ccenv list` | 列出所有已创建的配置 |
| `ccenv current` | 显示当前配置名称及环境变量状态 |
| `ccenv edit <name>` | 在编辑器（`$EDITOR`）中打开配置文件 |
| `ccenv remove <name>` | 删除指定配置 |

## ⚙️ 工作原理

`ccenv` 遵循“无魔法”原则：
1. 从 `~/.config/ccenv/profiles/` 读取简单的 TOML 配置。
2. 将 `${ENV_VAR}` 占位符解析为当前 Shell 环境中的实际值。
3. 使用注入的环境变量 `exec` 启动 `claude` 二进制文件。

没有 shim，没有 shell alias，也没有持久化的后台进程。

## 🛡️ 隐私与安全

- **数据不出域：** 用量统计是从 Claude Code 的本地日志（`~/.claude/projects/`）中解析的，没有任何数据会离开你的机器。
- **严格权限：** 所有配置文件均以 `0600` 权限创建。
- **密钥安全：** 推荐在配置中使用环境变量引用（例如：`ANTHROPIC_AUTH_TOKEN = "${MY_SECRET}"`），这样你的 TOML 文件就可以放心地纳入版本管理或分享。

## 🤝 参与贡献

欢迎任何形式的贡献！无论是添加新的 Provider 模板，还是改进文档。

1. `pnpm install`
2. `pnpm dev` (监听模式)
3. `pnpm test`

---

### 开源协议

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
