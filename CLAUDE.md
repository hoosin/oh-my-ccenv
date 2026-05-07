# ccenv

## 技术栈
- Node.js >= 18.17.0 + TypeScript strict
- pnpm（禁止 npm，会污染 lockfile）
- tsup 打包（esbuild 内核）
- commander 路由 CLI
- @inquirer/prompts 交互
- smol-toml 读写 TOML
- zod 校验 profile schema
- picocolors 终端颜色
- vitest 测试

## 命令
- `pnpm dev` — 开发（tsup watch）
- `pnpm build` — 构建到 dist/
- `pnpm test` — 跑全部单测

## 配置结构
- 配置目录：
  - macOS/Linux：`$XDG_CONFIG_HOME/ccenv/`，fallback `~/.config/ccenv/`
  - Windows：`%APPDATA%\ccenv\`（fallback 到 `~/.config/ccenv/`,仅当 APPDATA 不存在）
- 每个 profile 一个文件：`profiles/<name>.toml`
- profile 名 = 文件名，文件内不写 name 字段
- current 文件：纯文本，一行 profile 名，读时 trim()
- POSIX 文件权限 0600（Windows 上 chmod 静默 no-op，不再承诺保护）
- `auth_token` 支持 `${ENV_VAR}` 占位，启动时从 process.env 解析

## TOML 格式
```toml
description = "可选，一行"

[env]
ANTHROPIC_BASE_URL = "..."
ANTHROPIC_AUTH_TOKEN = "${SOME_KEY}"
ANTHROPIC_MODEL = "..."
```
只写 `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN`、`ANTHROPIC_MODEL` 三个字段。不要加 `ANTHROPIC_SMALL_FAST_MODEL` 或 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`。

## 启动时注入
- `CCENV_PROFILE=<name>`（标记当前 profile，子进程可读）
- profile 的 [env] 注入
- 当 profile 含 `ANTHROPIC_AUTH_TOKEN` 且 profile 自身未声明 `ANTHROPIC_API_KEY` 时，强制把子进程的 `ANTHROPIC_API_KEY` 置空，防 shell 已导出的 `ANTHROPIC_API_KEY` 盖掉第三方 token

## 模板
- 内置在 `templates/` 目录，**只是 scaffold，不是真实环境**
- 装包后**不会**被复制进用户配置目录；用户配置目录由首次写操作（`add` / `use` / `<name>`）按需创建
- 使用入口：
  - `ccenv add <name>` 选 provider 时，`presets.ts` 提供 base_url，`templates/<id>.toml` 提供 description
  - `ccenv edit <preset>` 对未存在的 profile，从对应 `templates/<id>.toml` 拉一份生成后再开编辑器
  - `ccenv edit --reset` 强制从 template 重新生成
- 5 个 provider：volcengine / bailian / deepseek / bailing / mimo
- 火山引擎和阿里云百炼是 Coding Plan 类型

## 模型列表
- `data/models.json` 存各 provider 可用模型，**手动维护**（CI 爬取是路线图项，未实现）
- 客户端 `add` 时从 GitHub raw URL 拉取，本地缓存到 `~/.config/ccenv/models.cache.json`

## 约定
- 文件名和变量名用英文，文档和注释用中文
- `ccenv add <name>` 交互式：先选 provider → 再选 model → 最后填 token
- profile 名只允许 `[a-zA-Z0-9_-]+`，拒绝路径穿越
- stats 解析 `~/.claude/projects/**/*.jsonl`，只看 assistant turn
- stats 不算钱，只统计 token 用量（calls / input / output / 占比）

## 禁区
- 不要引入 ORM 或数据库
- 不要加加密层（v0.1 明文存储，README 已说明）
- 不要加 init wizard / doctor / 插件系统
- 不要在 TOML 文件里重复 profile 名
- 不要把真实 token 写进 templates/ 或 data/

## 踩过的坑
- 火山引擎 Coding Plan 的 base_url 是 `/api/coding`，不是 `/api/v3`
- 阿里云百炼 Coding Plan 的 base_url 是 `coding.dashscope.aliyuncs.com/apps/anthropic`，不是 `dashscope.aliyuncs.com/compatible-mode/v1`
- MiMo 文档页是 JS 渲染，curl 拿不到内容
- Anthropic 是默认 provider，不需要 profile，清空 env 就走官方
