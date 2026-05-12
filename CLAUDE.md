# ccenv

## 技术栈
TypeScript strict + Node 18.17+。**pnpm**（npm 会污染 lockfile）。tsup / commander / @inquirer/prompts / smol-toml / zod / picocolors / vitest。

## 分支与发版
- 开发在 `dev`，PR 合到 `main`（squash）
- 合 PR 时打 `release:patch|minor|major` 标签 → 自动发版；不打 = 不发版
- 发版后 `release.yml` 把 main 强推回 dev，本地需 `git pull --rebase`
- bump 选档（不确定往大了选）：patch = bug fix / 重构 / 文档；minor = 新命令 / 新 flag / 新 provider / TOML 加可选字段；major = 删改命令 / 改 flag 默认值 / TOML 改必填 / 配置目录变更 / 提 Node 最低版本
- 不要本地手动 `pnpm version`，不要直接 push main
- `update-models.yml` 只推 dev

## 配置目录
- macOS/Linux：`$XDG_CONFIG_HOME/ccenv/`，fallback `~/.config/ccenv/`
- Windows：`%APPDATA%\ccenv\`，fallback `~/.config/ccenv/`
- 每个 profile 一个文件 `profiles/<name>.toml`；profile 名 = 文件名，文件内**不**写 name 字段
- `current` 文件：纯文本一行 profile 名，读时 trim()
- POSIX 0600；Windows chmod 静默 no-op（不再承诺保护）

## TOML 格式
```toml
description = "可选，一行"

[env]
ANTHROPIC_BASE_URL = "..."
ANTHROPIC_AUTH_TOKEN = "${SOME_KEY}"
ANTHROPIC_MODEL = "..."
```
只写这三个 env 字段。**不要**加 `ANTHROPIC_SMALL_FAST_MODEL` 或 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`。`${ENV_VAR}` 启动时从 process.env 解析。

## 启动时注入
`spawn-claude` 注入 `CCENV_PROFILE=<name>` + profile 的 `[env]`。**当 profile 含 `ANTHROPIC_AUTH_TOKEN` 且未自带 `ANTHROPIC_API_KEY` 时，强制把子进程的 `ANTHROPIC_API_KEY` 置空**——防 shell 已导出的 key 盖掉第三方 token。

## 模板
- `templates/*.toml` 是 scaffold，不是真实环境；装包**不会**复制进用户配置目录
- `ccenv add` 选 provider 时 base_url 和 description 从对应 toml 动态加载
- `ccenv edit <preset>` 首次会从 template 拉一份；`--reset` 强制重生
- `[Coding Plan]` 只是 description 字符串里的 UI 标签，代码层不区分 plan 类型

## 模型列表
- `data/models.json` 是真值源；`update-models.yml` 每天爬取推 dev + 自动开 PR 到 main，合并仍需人审
- 客户端 `ccenv add` 时从 GitHub raw URL（main 分支）拉取，cache 到 `~/.config/ccenv/models.cache.json`

## 约定
- 文件/目录名 kebab-case（`load-profile.ts`），函数/变量名 camelCase（`loadProfile`）；文档和注释用中文
- 风格遵循 `.editorconfig`；TypeScript 单引号
- `ccenv add` 流程：选 provider → 选 model → 填 token → 可选 description
- profile 名 `[a-zA-Z0-9_-]+`，拒绝路径穿越
- stats 解析 `~/.claude/projects/**/*.jsonl`，只看 assistant turn；只统计 token 用量（calls / input / output / 占比），不算钱

## class vs 函数
默认写函数。改成 class 至少满足以下 3 条：
1. 多个函数操作同一数据结构（data clump）
2. 明确 lifecycle（load → mutate × N → save）
3. 实现细节通过返回值/参数泄漏给调用方
4. 数据结构有不变量需要在类型系统外维护
5. 文件里混了无关 concern

现状仅 `stats/cache.ts` 是 class。spinner 是 closure-as-class，**不要**改 `class Spinner`；`parse-jsonl` 状态在 Promise 内部完结，**不要**抽成 streaming class。

## 禁区
- 不加加密层（v0.1 明文存储，README 已说明）
- 不加 init wizard / doctor / 插件系统
- TOML 文件里不重复 profile 名
- 不要把真实 token 写进 `templates/` 或 `data/`
- 命令文件不要 `try/catch ExitPromptError`，`bin.ts` 的 `unhandledRejection` 已全局兜底

## 踩过的坑
- 火山引擎 Coding Plan base_url 是 `/api/coding`，不是 `/api/v3`
- 阿里云百炼 Coding Plan 是 `coding.dashscope.aliyuncs.com/apps/anthropic`，不是 `dashscope.aliyuncs.com/compatible-mode/v1`
- MiMo 文档页 JS 渲染，curl 拿不到（爬虫用 playwright）
