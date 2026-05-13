<p align="center">
  <img src="https://raw.githubusercontent.com/hoosin/oh-my-ccenv/main/docs/assets/logo.svg" alt="ccenv logo" width="360" />
</p>

# ccenv

<p align="center">
  <strong>像 pyenv 一样管理你的 Claude Code 配置。</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/oh-my-ccenv"><img src="https://img.shields.io/npm/v/oh-my-ccenv.svg" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/oh-my-ccenv.svg" alt="License" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/oh-my-ccenv.svg" alt="Node" /></a>
</p>

<p align="center">
  <strong>简体中文</strong> · <a href="./README.md">English</a>
</p>

---

`ccenv` 用于管理和切换多个 [Claude Code](https://github.com/anthropics/claude-code) 供应商配置（Anthropic、火山引擎、阿里云百炼、DeepSeek 等），不依赖后台进程、shell alias 或 shim。

## 演示

<p align="center">
  <img src="https://raw.githubusercontent.com/hoosin/oh-my-ccenv/refs/heads/main/docs/assets/demo.svg" alt="ccenv demo" width="720" />
</p>

## 核心特性

- **快速切换：** 单条命令即可更改当前激活的 Claude 运行环境。
- **密钥不落盘：** 支持 `${ENV_VAR}` 占位符，直接从 Shell 环境变量解析，不在本地明文存储 API Key。
- **本地用量统计：** 直接解析 `~/.claude/projects/` 本地日志来统计 Token 消耗。数据不出域。
- **零后台开销：** 读取配置并注入环境变量后，直接 `exec` 启动 `claude` 进程，运行即销毁。

## 安装
```bash
npm install -g oh-my-ccenv
# 或者
pnpm add -g oh-my-ccenv
```

*要求 Node.js >= 18.17.0，且系统 `PATH` 中已安装 `claude`。*

## 使用方法

**1. 添加配置：**
```bash
ccenv add work
```
按提示选择 Provider 并设置 Token（推荐通过环境变量引用，例如 `${ANTHROPIC_API_KEY}`）。

**2. 切换与启动：**
```bash
ccenv use work   # 将 'work' 设为当前激活的配置
ccenv            # 使用当前配置启动 Claude Code
```
*提示：你可以直接运行 `ccenv <profile_name>` 来跳过全局配置，直接以指定配置启动。*

**3. 内置的 `claude` 配置：**

`claude` 是保留名，代表 Anthropic 官方端点。需要加代理或自定义环境变量时，运行 `ccenv edit claude`。

## 命令

| 命令 | 描述 |
| :--- | :--- |
| `ccenv add [name]` | 创建新配置 |
| `ccenv use [name]` | 切换当前激活的配置 |
| `ccenv stats` | 查看本地 Token 用量（支持 7d, 30d 等） |
| `ccenv list` | 列出所有已创建的配置 |
| `ccenv providers` | 列出支持的供应商 |
| `ccenv current` | 显示当前配置名称及环境变量状态 |
| `ccenv edit [name]` | 在编辑器（`$EDITOR`）中打开配置文件 |
| `ccenv remove [name]` | 删除指定配置 |

## 底层机制与安全

`ccenv` 将配置文件以 TOML 格式存储在以下位置：

- **macOS / Linux：** `~/.config/ccenv/profiles/`（或 `$XDG_CONFIG_HOME/ccenv/profiles/`）
- **Windows：** `%APPDATA%\ccenv\profiles\`（通常是 `C:\Users\<你>\AppData\Roaming\ccenv\profiles\`）

为了保障安全：
- POSIX 系统下配置文件默认以 `0600` 权限创建（Windows 会静默忽略 POSIX 权限，请依赖文件系统 ACL 与用户目录私有性）。
- 强烈建议在 TOML 文件中使用环境变量引用来替代硬编码的 API Key。这样可以放心地将配置目录纳入 dotfiles 管理或版本控制。

## 开发

1. `pnpm install`
2. `pnpm dev` (监听模式)
3. `pnpm test`

欢迎提交 Issue 和 PR。

---

### 开源协议

MIT © [hoosin](https://github.com/hoosin)
