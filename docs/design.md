# @hoosin/ccenv 技术设计文档（v0.1）

## Context

用户目前用 `~/.zshrc` 函数（`claude-ling` / `claude-ds`）切换 Claude Code 的后端：
往 `claude` 注入一组环境变量（`ANTHROPIC_BASE_URL` / `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_MODEL`）。
profile 多了之后维护痛、新手门槛高。

社区已有同类工具 [`william-zxs/ccenv`](https://github.com/william-zxs/ccenv)（npm 上占据 `ccenv` 名字），覆盖了基础切换功能。
本项目区别在于：

- **每个 profile 一个文件**——可以单独 share、单独 git 管理、`edit` 直接打开当前 profile
- **`${ENV_VAR}` 占位**——`auth_token` 之类敏感值可写 `${OPENROUTER_API_KEY}`，配置可入 git
- **`ccenv stats`**——解析 Claude Code 本地 jsonl 日志，按 profile / model / project 聚合 token 与费用（社区 ccenv 没有）
- **命令面借鉴**：`ccenv <name>` 直接切换 + 启动、`*` 标记 current、`ls` 显示 token 状态

包名 `@hoosin/ccenv`、仓库 `hoosin/ccenv`、二进制 `ccenv`。

> ⚠️ **二进制冲突说明**：bare `ccenv` 被 william-zxs 占用，二进制同名。
> 走 scoped 包名 `@hoosin/ccenv`，**不可与社区 ccenv 同时全局安装**。
> v0.2 计划提供 `ccenv import ~/.ccenv/settings.json`，把老 ccenv 用户的 profile 一键拆成多文件迁移过来。

---

## 1. 命令一览

```
ccenv                  # 启动 claude（无 current 时进交互选择菜单）
ccenv <name>           # 切换 current + 启动 claude（最常用入口）
ccenv use <name>       # 只切换 current，不启动（脚本场景）
ccenv add <name>       # 交互式注册新 profile（选 provider → 自动填 URL/model → 补 token）
ccenv ls               # 列出 profile（带 * 标记 current 与 token 状态彩色）
ccenv current          # 输出当前 profile 名 + 生效的 env
ccenv rm <name>        # 删除 profile（删 profiles/<name>.toml）
ccenv edit [name]      # 用 $EDITOR 打开 profile 文件（不指定时打开 current）
ccenv stats            # ★ 用量统计：按 profile/model/project 聚合 token 与费用
```

9 个命令。**`ccenv <name>` 是日常主入口**——一次按键完成切换+启动。

---

## 2. 技术选型

| 项 | 选择 |
|---|---|
| 语言 | Node.js + TypeScript |
| Node 版本 | `>=20` |
| 包管理 | pnpm |
| 打包 | `tsup`（esbuild 内核） |
| CLI | `commander` |
| 交互 | `@inquirer/prompts` |
| 配置格式 | **TOML**（`smol-toml`），每个 profile 一个文件 |
| 校验 | `zod` |
| 颜色 | `picocolors` |
| 测试 | `vitest` |

---

## 3. 配置文件

XDG 标准目录 `$XDG_CONFIG_HOME/ccenv/`（fallback `~/.config/ccenv/`）：

```
~/.config/ccenv/
├── current                         # 纯文本，一行：当前 profile 名（例: "ling\n"）
├── profiles/
│   ├── volcengine.toml             # 火山引擎 Coding Plan
│   ├── bailian.toml                # 阿里云百炼 Coding Plan
│   ├── deepseek.toml               # DeepSeek
│   ├── bailing.toml                # 蚂蚁百灵
│   └── mimo.toml                   # MiMo
├── sessions.jsonl                  # 启动日志（stats fallback 用）
├── stats.cache.json                # stats 增量缓存
└── models.cache.json               # 模型列表本地缓存（7 天过期）
```

### 3.1 首次安装

npm 包内含 `templates/` 目录，存放默认 profile 模板：

```
@hoosin/ccenv/
└── templates/
    ├── volcengine.toml
    ├── bailian.toml
    ├── deepseek.toml
    ├── bailing.toml
    └── mimo.toml
```

`postinstall` 脚本检测 `~/.config/ccenv/profiles/` 是否存在：
- **不存在**：创建目录，把 `templates/*.toml` 复制进去
- **已存在**：跳过（不覆盖用户已有文件）

用户首次 `ccenv ls` 就能看到所有预置 provider，改一下 token 就能用。

### 单个 profile 文件

`~/.config/ccenv/profiles/ling.toml`：

```toml
description = "蚂蚁百灵 via OpenRouter"

[env]
ANTHROPIC_BASE_URL = "https://openrouter.ai/api"
ANTHROPIC_AUTH_TOKEN = "${OPENROUTER_API_KEY}"
ANTHROPIC_MODEL = "inclusionai/ling-2.6-1t:free"
```

字段：

- **profile 名**=文件名（`ling.toml` → `ling`）。文件内不再重复 `name` 字段。
- `description`：可选，单行说明（`ls` 时显示）
- `[env]`：扁平 env-var → string 映射；**支持 `${ENV_VAR}` 占位**
- 其它顶层 key：保留不动（向前兼容未来扩展）

### `current` 文件

纯文本：

```
ling
```

末尾换行可选。读时 `trim()`。

不存在或为空 → 表示「未设定」，启动时进交互选择菜单。

### 写入策略

- 所有文件不存在时创建，profile `.toml` 与 `current` 权限 `0600`
- profile 文件已存在时**保留所有未识别的字段**（防止破坏用户手改）
- `add` 时若同名已存在 → 询问是否覆盖

不做加密。README 明示「等价于一份明文 dotenv」。

### 模板文件

npm 包内置 `templates/` 目录，包含以下默认 profile（token 均用 `${ENV_VAR}` 占位）：

**`templates/volcengine.toml`**：
```toml
description = "火山引擎 Coding Plan"

[env]
ANTHROPIC_BASE_URL = "https://ark.cn-beijing.volces.com/api/coding"
ANTHROPIC_AUTH_TOKEN = "${VOLCENGINE_API_KEY}"
ANTHROPIC_MODEL = "doubao-seed-2.0-code"
```

**`templates/bailian.toml`**：
```toml
description = "阿里云百炼 Coding Plan"

[env]
ANTHROPIC_BASE_URL = "https://coding.dashscope.aliyuncs.com/apps/anthropic"
ANTHROPIC_AUTH_TOKEN = "${DASHSCOPE_API_KEY}"
ANTHROPIC_MODEL = "qwen-code-coding-plan"
```

**`templates/deepseek.toml`**：
```toml
description = "DeepSeek"

[env]
ANTHROPIC_BASE_URL = "https://api.deepseek.com"
ANTHROPIC_AUTH_TOKEN = "${DEEPSEEK_API_KEY}"
ANTHROPIC_MODEL = "deepseek-chat"
```

**`templates/bailing.toml`**：
```toml
description = "蚂蚁百灵"

[env]
ANTHROPIC_BASE_URL = "https://openrouter.ai/api"
ANTHROPIC_AUTH_TOKEN = "${OPENROUTER_API_KEY}"
ANTHROPIC_MODEL = "inclusionai/ling-2.6-1t:free"
```

**`templates/mimo.toml`**：
```toml
description = "MiMo"

[env]
ANTHROPIC_BASE_URL = "https://token-plan-cn.xiaomimimo.com/anthropic"
ANTHROPIC_AUTH_TOKEN = "${MIMO_API_KEY}"
ANTHROPIC_MODEL = "mimo-v2.5-pro"
```

### postinstall 行为

`package.json` 中注册 `"postinstall": "node dist/postinstall.js"`：

```
1. 检查 ~/.config/ccenv/profiles/ 是否存在
2. 不存在 → mkdir -p + 复制 templates/*.toml 到 profiles/
3. 已存在 → 跳过（不覆盖、不合并）
```

升级时（`npm update -g @hoosin/ccenv`）不触发重新复制，已有文件永远不动。

## 4. 启动流程

### 4.1 `ccenv` / `ccenv <name>`（默认动作）

```
1. 读 ~/.config/ccenv/current（决定 currentName）
2. 决定 profile：
     - 命令行参数有 <name>：用它（顺便把 current 文件改成 <name>）
     - 否则用 currentName
     - 都没有：开交互菜单（@inquirer/prompts）扫 profiles/*.toml 让用户选；选完写 current
3. 加载 profiles/<name>.toml，解析 [env] 中的 ${ENV_VAR}
4. 组装最终 env：
     ...process.env
     ANTHROPIC_API_KEY=""           ← 安全网（防 shell export 泄漏）
     ...interpolatedProfileEnv      ← 用户显式值覆盖安全网
     CCENV_PROFILE=<name>           ← 给 stats 做 fallback 关联
5. which('claude')；找不到 → 提示 npm i -g @anthropic-ai/claude-code
6. 追加一行到 ~/.config/ccenv/sessions.jsonl: {ts, profile, cwd, pid}
7. spawn('claude', argv, { env, stdio: 'inherit' })
8. 透传 exit code
```

### 4.2 `ccenv use <name>`

只校验 `profiles/<name>.toml` 存在，写 `<name>` 到 `current` 文件，不启动 claude。

### 4.3 `ccenv add <name>` 交互流程

```
? Select a provider:
    火山引擎 Coding Plan
    阿里云百炼 Coding Plan
    DeepSeek
  > 蚂蚁百灵
    MiMo
    Custom (手动填写)

? Auth token (支持 ${ENV} 占位): ${OPENROUTER_API_KEY}
? Model: [从 provider 模型列表中选，或手动输入]
? Description (optional): 蚂蚁百灵 via OpenRouter
✓ Saved to ~/.config/ccenv/profiles/ling.toml
  下一步：ccenv ling   或   ccenv use ling
```

选了 provider 后 `Base URL` / `Model` / `Small fast model` 自动预填，用户仍可覆盖。
选 `Custom` 则手动输入所有字段。
回答折叠成 `[env]` 表写入 `profiles/<name>.toml`。

### 4.4 Provider 预设表

定义在 `src/config/presets.ts`，结构：

```ts
interface ProviderPreset {
  id: string
  name: string            // 显示名
  base_url: string
  type: 'coding-plan' | 'standard'  // 服务类型
}
```

预设列表（只存 base_url，model 从模型列表 API 动态获取）：

| id | name | base_url | type | 备注 |
|---|---|---|---|---|
| `volcengine` | 火山引擎 Coding Plan | `https://ark.cn-beijing.volces.com/api/coding` | `coding-plan` | 字节跳动旗下，聚合多家模型（豆包/DeepSeek/GLM/Kimi/Minimax） |
| `bailian` | 阿里云百炼 Coding Plan | `https://coding.dashscope.aliyuncs.com/apps/anthropic` | `coding-plan` | 阿里云旗下，聚合多家模型（Qwen/Claude/GLM/Kimi） |
| `deepseek` | DeepSeek | `https://api.deepseek.com` | `standard` | |
| `bailing` | 蚂蚁百灵 | `https://openrouter.ai/api` | `standard` | 通过 OpenRouter 代理 |
| `mimo` | MiMo | `https://token-plan-cn.xiaomimimo.com/anthropic` | `standard` | 小米 MiMo，JS 渲染文档页 |

> **Coding Plan 说明**：火山引擎和阿里云百炼的 Coding Plan 是面向编程场景的套餐服务，通常有独立的计费方式和模型列表。API 端点与标准 API 共用，但可用模型和配额可能不同。
>
> ⚠️ 以上 base_url 需发布前逐个验证实际可用性。

### 4.5 模型列表

`ccenv add` 选完 provider 后，从模型列表 API 拉取该 provider 可用的模型，让用户选。

**数据源**：

1. 本仓库 `data/models.json` 存放各 provider 的模型列表
2. GitHub Actions 定期（每天/每周）爬取各 provider 的 `/models` 接口，自动 commit 更新
3. `ccenv` 客户端通过 GitHub raw URL 拉取（`https://raw.githubusercontent.com/hoosin/ccenv/main/data/models.json`），带本地缓存

**模型列表格式**（`data/models.json`）：

```json
{
  "updated_at": "2026-04-30",
  "providers": {
    "volcengine": {
      "type": "coding-plan",
      "models": ["doubao-seed-2.0-code", "doubao-seed-2.0-pro", "doubao-seed-2.0-lite", "doubao-seed-code", "deepseek-v3.2", "glm-5.1", "glm-4.7", "kimi-k2.6", "kimi-k2.5", "minimax-latest", "ark-code-latest"]
    },
    "bailian": {
      "type": "coding-plan",
      "models": ["qwen-plus", "qwen-turbo", "qwen-max"]
    },
    "deepseek": {
      "type": "standard",
      "models": ["deepseek-chat", "deepseek-reasoner"]
    },
    "bailing": {
      "type": "standard",
      "models": ["inclusionai/ling-2.6-1t:free"]
    },
    "mimo": {
      "type": "standard",
      "models": ["mimo-v2.5-pro"]
    }
  }
}
```

**CI 爬取流程**（`.github/workflows/update-models.yml`）：

```
GitHub Actions (cron: daily)
  → 对每个 provider 调用 GET /models（或对应接口）
  → 解析返回的模型列表
  → 更新 data/models.json
  → git commit + push（[skip ci] 避免循环触发）
```

**`ccenv` 客户端拉取逻辑**：

```
1. GET https://raw.githubusercontent.com/hoosin/ccenv/main/data/models.json
2. 成功 → 写入 ~/.config/ccenv/models.cache.json + 用
3. 失败（离线/超时）→ 读本地缓存
4. 缓存也没有 → 降级为手动输入 model 名
```

**`ccenv add` 交互流程**（选完 provider 后）：

```
? Model:
  > deepseek-chat
    deepseek-reasoner
    (手动输入)
```

选了直接填入 `ANTHROPIC_MODEL`。选「手动输入」则自由填写。

**离线 fallback**：缓存在 `~/.config/ccenv/models.cache.json`，7 天过期。

---

## 5. 项目目录

```
ccenv/
├── package.json          # name: "@hoosin/ccenv", bin: { "ccenv": "dist/bin.js" }, scripts.postinstall
├── tsconfig.json
├── tsup.config.ts
├── README.md             # 中英双语
├── README.zh-CN.md
├── LICENSE               # MIT
├── docs/
│   ├── design.md         # 本文档
│   └── stats.md
├── templates/            # npm 包内置，postinstall 复制到 ~/.config/ccenv/profiles/
│   ├── volcengine.toml
│   ├── bailian.toml
│   ├── deepseek.toml
│   ├── bailing.toml
│   └── mimo.toml
├── data/
│   └── models.json       # 各 provider 模型列表（CI 自动更新）
├── .github/
│   └── workflows/
│       └── update-models.yml  # 定期爬取模型列表
├── src/
│   ├── bin.ts            # #!/usr/bin/env node
│   ├── postinstall.ts    # 首次安装：复制 templates/ → ~/.config/ccenv/profiles/
│   ├── cli.ts            # commander 路由
│   ├── commands/
│   │   ├── launch.ts     # 处理 `ccenv` 与 `ccenv <name>`
│   │   ├── use.ts
│   │   ├── add.ts
│   │   ├── ls.ts         # 带 * 与 token 状态的彩色列表
│   │   ├── current.ts
│   │   ├── rm.ts
│   │   ├── edit.ts       # spawn $EDITOR <profile.toml>
│   │   └── stats.ts      # ★ 核心差异
│   ├── config/
│   │   ├── schema.ts     # zod，单个 profile 文件 schema
│   │   ├── paths.ts      # XDG 路径解析、profilePath(name)
│   │   ├── loadProfile.ts
│   │   ├── saveProfile.ts # patch-style 写，保留未识别字段
│   │   ├── current.ts    # 读/写 current 文件
│   │   ├── listProfiles.ts # 扫 profiles/*.toml
│   │   ├── interpolate.ts # ${ENV_VAR} 解析
│   │   └── presets.ts    # provider 预设表
│   ├── runtime/
│   │   ├── findClaude.ts
│   │   ├── spawnClaude.ts
│   │   ├── sessionLog.ts # 写 ~/.config/ccenv/sessions.jsonl
│   │   └── picker.ts     # 交互式选择菜单（@inquirer/prompts）
│   ├── stats/
│   │   ├── parseJsonl.ts
│   │   ├── aggregate.ts
│   │   ├── pricing.ts
│   │   ├── pricing.json
│   │   └── cache.ts
│   └── utils/
│       └── log.ts
└── tests/
    ├── config.test.ts
    ├── interpolate.test.ts
    ├── spawn.test.ts
    ├── stats.parse.test.ts
    └── stats.aggregate.test.ts
```

---

## 6. `ccenv stats`（核心差异化）

### 数据源（已在用户机器上验证）

Claude Code 自己写在 `~/.claude/projects/<project-slug>/<session-id>.jsonl`：

- `<project-slug>` 就是 cwd 路径把 `/` 换成 `-`
- 每个 session 一个 UUID 文件
- 每行一条消息；**assistant turn** 上完整带 `model` + `usage`：

```json
{
  "message": {
    "model": "claude-opus-4-7",
    "usage": {
      "input_tokens": 6,
      "cache_creation_input_tokens": 12913,
      "cache_read_input_tokens": 14810,
      "output_tokens": 1164,
      "server_tool_use": { "web_search_requests": 0, "web_fetch_requests": 0 }
    }
  }
}
```

**关键属性**：因为是读 Claude Code 自己的日志，**stats 对任何 claude 会话都生效**——
哪怕是用户绕过 ccenv 直接 `claude` 启动的会话也会被统计到（profile 列回退为 `unknown` 或仅按模型名归类）。

### 关联 profile 的策略

1. **优先按 model 名映射**：profile 里 `env.ANTHROPIC_MODEL = "deepseek/deepseek-v4-pro"`，stats 把所有 `message.model` 命中该字符串的消息记到 `deepseek` profile（覆盖 80% 场景）
2. **fallback：sessions.jsonl**：当 jsonl 里的 model 名匹配不到任何 profile，按 cwd + 时间窗口匹配最近一次 `ccenv` 启动记录（`~/.config/ccenv/sessions.jsonl`）
3. **都不命中**：归到 `unknown`，仍记 token 与费用

### 计费

内置 `pricing.json`，按 `model` 字符串前缀匹配，输入/输出/cache 分单价。
匹配不到时显示 token 数但不算钱，并提示用户 PR 补单价。

### 输出

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

支持：

- `--by model` / `--by project`
- `--since 7d|30d|YYYY-MM-DD`
- `--profile <name>`
- `--json`

### 性能

- 流式读 jsonl（不全量入内存）
- 增量缓存到 `~/.config/ccenv/stats.cache.json`，key = `<file_path>:<mtime>`
- 首次扫描慢，之后亚秒级

详细算法见 [`stats.md`](./stats.md)。

---

## 7. 关键代码骨架

`src/runtime/spawnClaude.ts`：

```ts
export async function spawnClaude(profileName: string, profileEnv: Record<string, string>, args: string[]) {
  const claudeBin = await findClaude();
  if (!claudeBin) throw new ClaudeNotFoundError();

  const interpolated = interpolateEnv(profileEnv);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ANTHROPIC_API_KEY: '',          // safety net first
    ...interpolated,                // user-explicit values override
    CCENV_PROFILE: profileName,
  };

  await appendSessionLog({ ts: Date.now(), profile: profileName, cwd: process.cwd(), pid: process.pid });

  const child = spawn(claudeBin, args, { env, stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
}
```

`src/config/interpolate.ts`：

```ts
const ENV_RE = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

export function interpolate(value: string): string {
  return value.replace(ENV_RE, (_, name) => process.env[name] ?? '');
}

export function interpolateEnv(env: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(env).map(([k, v]) => [k, interpolate(v)]));
}
```

---

## 8. 开源策略

- **仓库**：`hoosin/ccenv`，License **MIT**
- **README**：中英双语；顶部声明：
  > 本项目与 [`william-zxs/ccenv`](https://github.com/william-zxs/ccenv) 二进制同名，**不可同时全局安装**。
  > 配置 schema 不同（每 profile 一个 TOML 文件，存在 `~/.config/ccenv/profiles/`）。
  > v0.2 计划提供 `ccenv import` 一键迁移老 ccenv 配置。
- **CI**：GitHub Actions（lint + test + tag → npm publish）
- **推广**：V2EX / 即刻 / Show HN，主打「Claude Code 多 provider 切换 + 费用看板」

---

## 9. 实现顺序

1. 脚手架：`package.json`（含 `name: "@hoosin/ccenv"` 与 `bin: ccenv`）+ `tsconfig` + `tsup` + `vitest` + commander 跑通 `ccenv --help`
2. config 层：`schema.ts`（zod）+ `paths` / `loadProfile` / `saveProfile` / `listProfiles` / `current` / `interpolate` / `presets` + 单测
3. 模板 + postinstall：`templates/*.toml` + `src/postinstall.ts`（首次安装复制到 `~/.config/ccenv/profiles/`）
4. runtime 层：`spawnClaude` + `findClaude` + `sessionLog` + `picker` + spawn 集成测试（mock claude）
5. 命令：`launch`（默认 + `<name>`）→ `current` → `ls` → `add` → `use` → `rm` → `edit`
6. stats 模块：`parseJsonl` → `aggregate` → `pricing` → `cache` → `stats` 命令
7. README + GIF（演示装完即用 → `ccenv mimo` 一步切换+启动 → stats 看费用）
8. `pnpm publish --access public`

---

## 10. 验证

```bash
pnpm i && pnpm build && pnpm link --global

# postinstall 验证
ls ~/.config/ccenv/profiles/      # 应有 5 个 toml：volcengine / bailian / deepseek / bailing / mimo
cat ~/.config/ccenv/profiles/mimo.toml  # token 应为 ${MIMO_API_KEY}

# 基本流程
ccenv ls                      # 应有 5 条，无 current（带 * 标记）
ccenv mimo                    # 切到 mimo 并启动 claude
ccenv use deepseek            # 只切，不启动
ccenv current                 # 输出 deepseek 与 env
ccenv edit                    # 应打开 profiles/deepseek.toml
ccenv edit mimo               # 应打开 profiles/mimo.toml

# 新增自定义 profile
ccenv add my-custom           # 选手动填，生成 profiles/my-custom.toml

# postinstall 不覆盖已有文件
# 手动改 profiles/mimo.toml，再 pnpm link --global，文件不应被还原

# 单测：把 claude 替换成
#   node -e "console.log(JSON.stringify(process.env))"
# 断言 ANTHROPIC_API_KEY="" 与 CCENV_PROFILE 注入正确

# stats 测试
ccenv stats --since 30d
ccenv stats --by model --json
```

跨平台：先 macOS / Linux；Windows 后续。

---

## 11. 风险

| 风险 | 对策 |
|---|---|
| 与 william-zxs/ccenv 二进制同名冲突 | README 顶部声明；v0.2 提供 `ccenv import` 迁移 |
| 用户把含真 token 的 profile 文件 commit 进 git | 默认在 `~/.config/ccenv/`（家目录非项目目录），模板示例都用 `${ENV}` 占位，README 强警告 |
| 模型 pricing 漂移 | `pricing.json` 标 `updated_at`，>90 天 stats 输出底部提示更新 |
| `/model` 切换导致 stats 关联不准 | §6 双策略：先 model 名映射，fallback sessions.jsonl |
| Claude Code 升级改 env 变量名 | `runtime/spawnClaude.ts` 集中维护映射 |
| 用户用奇怪字符当 profile 名（比如 `../`） | `add` 时校验 `[a-zA-Z0-9_-]+`，拒绝路径穿越 |

---

## 决策摘要

- 包名：`@hoosin/ccenv`
- 仓库：`hoosin/ccenv`
- 二进制：`ccenv`
- 语言：Node.js + TypeScript
- 配置：`~/.config/ccenv/`（XDG）
  - `profiles/<name>.toml` —— 每个 profile 一个 TOML 文件
  - `current` —— 纯文本，记录当前 profile 名
- 主入口：`ccenv <name>` 一步切换+启动
- 范围：profile 切换 + **用量/费用统计**（核心差异）
