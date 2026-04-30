# @hoosin/ccenv

为 Claude Code 提供 profile 切换与用量分析的命令行工具。

简体中文 · [English](./README.md)

```bash
npm i -g @hoosin/ccenv

ccenv add ling          # 交互式创建 profile
ccenv use ling          # 切换当前 profile
ccenv                   # 用当前 profile 启动 claude
ccenv stats --since 7d  # 查看每个 profile 的 token 用量与费用
```

---

> **命名冲突说明** — npm 上的 `ccenv` 名字属于 [william-zxs/ccenv](https://github.com/william-zxs/ccenv)，它用单个 JSON 文件存所有 profile。本项目架构不同：**每个 profile 一个 TOML 文件**，放在 `~/.config/ccenv/profiles/` 下。两者不能同时全局安装。
>
> v0.2 将提供 `ccenv import ~/.ccenv/settings.json`，一键迁移老 ccenv 用户的配置。

---

## 为什么有这个工具

Claude Code 支持通过设置环境变量切到任何 Anthropic 兼容的 API。很多人会手写一堆 shell 函数：

```bash
claude-ling() {
  ANTHROPIC_BASE_URL="https://openrouter.ai/api" \
  ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY" \
  ANTHROPIC_MODEL="inclusionai/ling-2.6-1t:free" \
  ...
  claude "$@"
}
```

profile 一两个还行，三个以上就乱了——key 散在 dotfile 里、没有列表视图、不知道每个 provider 烧了多少钱。`ccenv` 把这件事做干净。

## 特性

- **每个 profile 一个文件**——独立的 TOML 文件，可以单独分享、单独 git 管理、直接编辑。
- **内置 provider 预设**——火山引擎 Coding Plan / 阿里云百炼 Coding Plan / DeepSeek / 蚂蚁百灵 / MiMo，`ccenv add` 时选一下 URL 和 model 自动填好。
- **`${ENV_VAR}` 占位**——key 仍然放在 shell 的 `export` 里，profile 文件可以放心 commit 进 git。
- **用量分析**——`ccenv stats` 解析 Claude Code 本地 jsonl 日志，按 profile / 模型 / 项目聚合 token 与费用。**对任何 Claude Code 会话都生效**——哪怕没走 `ccenv` 也能统计到。
- **极小命令面**——9 个命令。没有 init wizard、doctor、插件系统。

## 安装

要求 Node.js >= 20。

```bash
npm i -g @hoosin/ccenv
# 或者
pnpm add -g @hoosin/ccenv
```

安装时自动创建 `~/.config/ccenv/profiles/`，内置火山引擎 Coding Plan / 阿里云百炼 Coding Plan / DeepSeek / 蚂蚁百灵 / MiMo 五个预置 profile，token 均用 `${ENV_VAR}` 占位——文件里不含密钥。Anthropic 是默认 provider，不需要 profile，清空 env 即可。

`ccenv` 启动时会找 `PATH` 里的 `claude`。如果还没装：

```bash
npm i -g @anthropic-ai/claude-code
```

## 快速上手

装完就有预置 profile，设好 token 就能用：

```bash
# 1. 设好 token（选一个 provider）
export DEEPSEEK_API_KEY="sk-..."
# 或
export MIMO_API_KEY="tp-..."
# 或
export VOLCENGINE_API_KEY="..."
# 或
export DASHSCOPE_API_KEY="..."

# 2. 看看有哪些 profile
ccenv ls

# 3. 切换并启动
ccenv deepseek       # 或: ccenv mimo, ccenv volcengine, ccenv bailian

# 4. 看看花了多少钱
ccenv stats --since 7d
```

需要自定义 provider？`ccenv add <name>` 交互式引导你完成。

## 命令

| 命令 | 作用 |
|---|---|
| `ccenv` | 用当前 profile 启动 `claude`（无 current 时进交互选择） |
| `ccenv <name>` | 切换到 `<name>` 并启动 `claude`（日常主入口） |
| `ccenv add <name>` | 创建新 profile（交互式） |
| `ccenv use <name>` | 只切换 current，不启动 |
| `ccenv ls` | 列出所有 profile（`*` 标记当前） |
| `ccenv current` | 输出当前 profile 名字与生效的 env |
| `ccenv rm <name>` | 删除 profile |
| `ccenv edit [name]` | 用 `$EDITOR` 打开 profile 文件（不指定时打开 current） |
| `ccenv stats [opts]` | 查看 token 用量与费用（见下） |

### `ccenv stats` 选项

```
--by profile|model|project    分组维度（默认 profile）
--since 7d|30d|YYYY-MM-DD     时间窗口
--profile <name>              只看某一条 profile
--json                        机器可读输出
```

示例：

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

## 配置文件

存放在 `~/.config/ccenv/`（XDG 标准目录）：

```
~/.config/ccenv/
├── current                       # 纯文本：当前 profile 名
└── profiles/
    ├── volcengine.toml           # 火山引擎 Coding Plan
    ├── bailian.toml              # 阿里云百炼 Coding Plan
    ├── deepseek.toml             # DeepSeek
    ├── bailing.toml              # 蚂蚁百灵
    └── mimo.toml                 # MiMo
```

### Profile 文件示例

`~/.config/ccenv/profiles/ling.toml`：

```toml
description = "蚂蚁百灵 via OpenRouter"

[env]
ANTHROPIC_BASE_URL = "https://openrouter.ai/api"
ANTHROPIC_AUTH_TOKEN = "${OPENROUTER_API_KEY}"
ANTHROPIC_MODEL = "inclusionai/ling-2.6-1t:free"
```

- **profile 名 = 文件名**——`ling.toml` 就是 profile `ling`，文件内不再写 `name`。
- `description`——可选，`ccenv ls` 时显示。
- `[env]`——扁平 env-var 映射，支持 `${ENV_VAR}` 占位，启动时解析。

### `current` 文件

纯文本，一行：

```
ling
```

如果不存在或为空，`ccenv` 启动时会打开交互式选择菜单。

启动时 `ccenv` 还会注入一个 `ANTHROPIC_API_KEY=""`——如果不显式置空，shell 里 `export` 出去的 `ANTHROPIC_API_KEY` 会盖掉第三方 token。**这是新手最常见的坑**。

## 安全

- Token **明文**存放在 `~/.config/ccenv/profiles/` 下，文件权限 `0600`。**没有加密层**。
- 不想入文件的 token，请放在 shell 的 `export OPENROUTER_API_KEY=...` 里，然后在 profile 中写 `${OPENROUTER_API_KEY}` 引用。
- macOS Keychain / libsecret 集成在 roadmap 上，v0.1 不做。

## `stats` 是怎么算的

`ccenv stats` 读取的是 `~/.claude/projects/<project-slug>/*.jsonl`——Claude Code 自己写的会话日志。每个 assistant turn 都带 `model` 和 `usage`（input / output / cache token 数），这就是我们需要的全部信息。

profile 归属判定：
1. 优先按 `model` 名匹配每个 profile 的 `ANTHROPIC_MODEL`。
2. 否则查 `~/.config/ccenv/sessions.jsonl`（每次 `ccenv` 启动时追加），按 cwd + 时间窗口模糊匹配。
3. 都不命中则归到 `unknown`。

价格表内置在 `pricing.json` 里。匹配不到的模型只显示 token 数、不算钱——欢迎 PR 补单价。

## 路线图

- v0.1 —— `add` / `use` / `ls` / `current` / `rm` / `edit` / `stats`，多文件 TOML profile
- v0.2 —— `ccenv import`（从 william-zxs/ccenv 单文件 JSON 迁移），更好的诊断、README GIF
- v0.3 —— macOS Keychain 集成、验证 Windows
- v1.0 —— 配置 schema 冻结、价格自动同步、CHANGELOG

## License

MIT (c) hoosin

## 致谢

- [`william-zxs/ccenv`](https://github.com/william-zxs/ccenv) —— 同名工具的原作者。本项目沿用了 `ccenv` 这个二进制名字与核心思路，改用每 profile 一个 TOML 文件的架构，并增加了用量分析。
- [`@anthropic-ai/claude-code`](https://www.npmjs.com/package/@anthropic-ai/claude-code) —— 我们 wrap 的上游工具。
