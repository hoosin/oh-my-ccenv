# @hoosin/ccenv 技术设计文档（v0.1）

## Context

用户目前通过复杂的 Shell 函数切换 Claude Code 后端，维护成本高且难以追踪用量。

本项目的核心设计：

- **🎭 类 pyenv 的管理体验**——像管理 Python 版本一样管理 Claude Provider，一键切换环境。
- **每个 Profile 一个文件**——基于 TOML 格式，可单独分享、Git 追踪，并支持 `$EDITOR` 直接编辑。
- **`${ENV_VAR}` 占位**——支持动态解析 Shell 环境变量，确保配置文件的安全性（不存明文密钥）。
- **📊 极简用量看板**——直接解析 Claude Code 原生日志，无需额外配置即可查看各模型消耗。
- **全程交互引导**——所有命令支持可选参数，未提供时自动唤起带有操作提示的交互菜单。

---

## 1. 命令一览

| 命令 | 说明 |
| --- | --- |
| `ccenv [name]` | 启动 Claude（不带参数 = 当前 Profile；带 name = 切换并启动） |
| `add [name]` | 交互式创建新 Profile（未提供名称时提示输入） |
| `use [name]` | 仅切换当前 Profile，不启动 Claude |
| `list` | 列出所有已保存的 Profile |
| `current` | 显示当前生效的 Profile 名称及环境变量 |
| `remove [name]` | 删除指定的 Profile（含交互确认） |
| `edit [name]` | 调用 `$EDITOR` 快速编辑 Profile 文件 |
| `stats` | ★ 用量统计：默认按 Model 分类，直接读取原生数据 |
| `man` | 打开详细帮助手册 |

---

## 2. 技术选型

| 项 | 选择 |
|---|---|
| 语言 | Node.js + TypeScript (>=18.17.0) |
| CLI 框架 | `commander` |
| 交互提示 | `@inquirer/prompts` (支持 Ctrl+C 优雅退出与操作指引) |
| 配置格式 | **TOML** (`smol-toml`) |
| 样式 | `picocolors` (针对终端优化的颜色显示) |

---

## 3. 配置文件规范

配置存储于 `~/.config/ccenv/`：
- `profiles/`：存放所有的 `.toml` 配置文件，权限默认为 `0600`。
- `current`：纯文本文件，记录当前选中的 Profile 名称。
- `stats.cache.json`：用量统计的增量缓存，确保大数据量下的响应速度。

### 3.1 环境变量占位

Profile 文件支持 `${ENV_VAR}` 语法，在启动瞬间从当前 Shell 环境解析：
```toml
ANTHROPIC_AUTH_TOKEN = "${MY_API_KEY}"
```

---

## 4. 核心流程

### 4.1 启动与切换 (Launch)
1. 确定目标 Profile：从参数获取或从交互菜单选择。
2. 注入环境变量：包含 `CCENV_PROFILE` 标记及 Profile 定义的所有变量。
3. **安全隔离**：如果定义了 `ANTHROPIC_AUTH_TOKEN`，会自动将 `ANTHROPIC_API_KEY` 置空，防止 Shell 缓存干扰。
4. 唤起 `claude`：透传所有命令行参数及退出码。

### 4.2 交互式引导与用户体验 (Interactive UX)
- **统一提示**：所有列表选择均带有 `(Press ↑↓ to navigate, ⏎ to select, Ctrl+C to cancel)`。
- **全局错误拦截**：底层抛出的错误会被全局拦截，并以友好的红色文本直接输出 `error.message`，避免暴露长篇的原生 Node.js 错误堆栈，同时确保 `process.exit(1)`。
- **优雅退出**：支持 `Ctrl+C` 直接退出，不输出错误堆栈。对于传递给子进程 `claude` 的任务，如果 `claude` 非零退出，也会静默返回相同退出码。
- **默认回退**：`add`, `use`, `remove`, `edit` 若不带参数，均会自动进入交互模式。

---

## 5. `ccenv stats` 用量统计

### 5.1 设计原则：数据优先
`stats` 命令的核心原则是**直接读取数据，与本地 Profile 无关**。它直接解析 Claude Code 在 `~/.claude/projects/` 下生成的 JSONL 日志。

### 5.2 聚合逻辑
- **默认维度**：按 `Model` (模型名称) 聚合。
- **名称清洗**：自动过滤模型名末尾的日期后缀（如 `-20251001`），确保同型号模型正确合并。
- **可选维度**：支持 `--project` 参数按项目目录聚合。
- **数值格式化**：所有数值（CALLS, INPUT, OUTPUT）均采用 `K/M/B` 易读格式。

### 5.3 增量性能
通过文件 `mtime` 和 `size` 进行增量解析，确保首次扫描后的后续运行达到亚秒级响应。

---

## 6. 实现状态
- [x] 基于 TOML 的多 Profile 管理
- [x] 环境变量动态插值
- [x] 全程交互式引导与优雅退出
- [x] 自动更新的模型列表模板
- [x] 极简的模型用量统计 (Model-first)
- [x] 中英双语文档与 Man Page
