# `ccenv stats` 技术文档

本文档详细描述 `ccenv stats` 命令的实现：数据来源、profile 归属算法、计费规则、增量缓存、CLI 输出。

设计文档总览见 [`design.md`](./design.md) §6，本文档是其完整版。

---

## 1. 数据源

### 1.1 Claude Code 的本地会话日志

每次会话由 Claude Code 写入：

```
~/.claude/projects/<project-slug>/<session-id>.jsonl
```

- `<project-slug>`：cwd 路径把 `/` 全部替换成 `-`，开头也是 `-`。
  例：cwd 为 `/Users/hoosin/Workspace/github/cc-cli` → `-Users-hoosin-Workspace-github-cc-cli`
- `<session-id>`：UUIDv4
- 每行一条 JSON 消息（流式追加，文件可能仍在被写入）

### 1.2 我们关心的字段

只看 **assistant turn**，结构如下（其它字段忽略）：

```json
{
  "type": "assistant",
  "timestamp": "2026-04-30T08:31:12.345Z",
  "sessionId": "0dd1cb89-8e0d-4e39-bbce-97ef8415927b",
  "cwd": "/Users/hoosin/Workspace/github/cc-cli",
  "message": {
    "model": "claude-opus-4-7",
    "usage": {
      "input_tokens": 6,
      "cache_creation_input_tokens": 12913,
      "cache_read_input_tokens": 14810,
      "output_tokens": 1164,
      "server_tool_use": {
        "web_search_requests": 0,
        "web_fetch_requests": 0
      }
    }
  }
}
```

| 路径 | 用途 |
|---|---|
| `timestamp` | 时间窗口过滤、profile fallback 关联 |
| `cwd` | `--by project` 分组、profile fallback 关联 |
| `message.model` | 主要的 profile 归属依据；`--by model` 分组 |
| `message.usage.input_tokens` | 真实输入 token（不含 cache） |
| `message.usage.cache_creation_input_tokens` | 写入缓存的 token，单价高于普通输入 |
| `message.usage.cache_read_input_tokens` | 命中缓存的 token，单价远低于普通输入 |
| `message.usage.output_tokens` | 输出 token |
| `message.usage.server_tool_use.web_search_requests` | （可选展示）web search 调用次数 |
| `message.usage.server_tool_use.web_fetch_requests` | （可选展示）web fetch 调用次数 |

> 部分老格式可能没有 `cwd` 字段——这种情况下从父目录名解码（把 `-` 还原为 `/`），可能有歧义但 `--by project` 仍可用。

### 1.3 我们写入的辅助日志

`ccenv` 启动时追加一行到：

```
~/.config/ccenv/sessions.jsonl
```

```json
{"ts": 1714461072345, "profile": "ling", "cwd": "/Users/hoosin/...", "pid": 12345}
```

仅在 model 名归属失败时作为 fallback 使用（见 §2.2）。

---

## 2. Profile 归属算法

每条 assistant turn 必须归属到一个 profile（含特殊值 `unknown`）。

### 2.1 主路径：按 model 名映射

构建反向索引：

```
modelToProfiles: Map<modelName, profileName[]>
```

遍历 `~/.config/ccenv/profiles/*.toml` 中所有 profile，把 `env.ANTHROPIC_MODEL` 登记上。
**同一 model 名可能映射到多个 profile**（用户在多个 profile 用了同一模型），这种情况按 §2.3 处理。

匹配规则：
- 精确匹配优先：`message.model === profile.env.ANTHROPIC_MODEL`
- 退化为前缀匹配：处理 OpenRouter 这类 `provider/model[:tag]` 场景，例如 profile 写 `deepseek/deepseek-v4-pro`，日志里出现 `deepseek/deepseek-v4-pro:online` 也算命中

### 2.2 Fallback：`sessions.jsonl` 关联

主路径未命中时（model 名在所有 profile 中都不存在——常见于用户在 Claude Code 内 `/model` 临时切了别的模型）：

1. 在 `sessions.jsonl` 中筛选出**同 cwd**的启动记录
2. 取 `ts` 早于当前 turn `timestamp` 且最接近的一条
3. 如果该启动 `ts` 距 turn `timestamp` ≤ **24 小时**，归属为该 profile，否则继续

### 2.3 多 profile 共享同一 model 的歧义

例：`anthropic` 与 `another-anthropic` 都用 `claude-opus-4-7`。

- 若 `sessions.jsonl` 在该会话窗口内能定位到唯一 profile，按它归属
- 否则按 **profile 字典序**取第一个（确定性结果）并在 stats 输出底部加一行警告：
  ```
  ⚠ 2 turns ambiguous (model "claude-opus-4-7" matches profiles: anthropic, another-anthropic).
    Run `ccenv stats --by model` to see raw model breakdown.
  ```

### 2.4 兜底：`unknown`

主路径未命中、fallback 也未命中（例如用户从未通过 ccenv 启动过、或 cwd 不匹配），归类为 `unknown`。
token 与费用照算。

---

## 3. 计费

### 3.1 价格表 `pricing.json`

```json
{
  "updated_at": "2026-04-30",
  "models": [
    {
      "match": "claude-opus-4-7",
      "input": 15.00,
      "output": 75.00,
      "cache_write": 18.75,
      "cache_read": 1.50
    },
    {
      "match": "deepseek/deepseek-v4-pro",
      "input": 0.50,
      "output": 2.00,
      "cache_write": 0.50,
      "cache_read": 0.05
    },
    {
      "match": "deepseek/deepseek-v4-pro:online",
      "input": 0.50,
      "output": 2.00,
      "cache_write": 0.50,
      "cache_read": 0.05
    }
  ]
}
```

- 单位：**USD per 1M tokens**
- 若一个模型缓存写/读价格未单独披露，省略字段时分别按 `input` 价格的 `1.25x` 与 `0.10x` 估算（行业惯例，会在 README 注明）

### 3.2 匹配规则

按 `pricing.json` 中 `match` 字段进行**最长前缀匹配**：

```
candidates = pricing.models.filter(p => modelName.startsWith(p.match))
chosen = candidates.sort(by p.match.length desc)[0]
```

匹配不到时，行内显示 token 数，cost 列输出 `?`，并在 stats 输出底部累加一条提示：

```
⚠ 1 model has no pricing: "openrouter/some-new-model".
  Open a PR adding it to pricing.json: https://github.com/hoosin/ccenv/blob/main/src/stats/pricing.json
```

### 3.3 单条消息的 cost 计算

```
cost_usd =
    (input_tokens          * input_price          / 1_000_000) +
    (output_tokens         * output_price         / 1_000_000) +
    (cache_creation_tokens * cache_write_price    / 1_000_000) +
    (cache_read_tokens     * cache_read_price     / 1_000_000)
```

### 3.4 价格表新鲜度

启动时检查 `pricing.json.updated_at`：

- ≤ 90 天：静默使用
- 90–180 天：stats 输出底部加提示「价格表已 X 天未更新」
- \> 180 天：同上，并在提示里附 PR 链接

---

## 4. 增量缓存

完整扫描 `~/.claude/projects/**/*.jsonl` 在重度用户上可能有数百兆数据。我们用文件 mtime 做增量。

### 4.1 缓存格式

`~/.config/ccenv/stats.cache.json`

```json
{
  "schema_version": 1,
  "files": {
    "/Users/hoosin/.claude/projects/-Users-hoosin-.../abc.jsonl": {
      "mtime_ms": 1714461072345,
      "size": 12345,
      "turns": [
        { "ts": 1714461012345, "model": "claude-opus-4-7", "input": 6, "output": 1164, "cache_write": 12913, "cache_read": 14810, "cwd": "..." }
      ]
    }
  }
}
```

只缓存我们抽出来的字段，不缓存原始 JSON。

### 4.2 增量逻辑

对每个 jsonl 文件：

| 当前 mtime / size | 缓存里 mtime / size | 行为 |
|---|---|---|
| 与缓存一致 | — | 直接用缓存 turns |
| mtime 更新 + size > 缓存 size | — | 追加解析（从缓存的最后偏移开始读） |
| mtime 更新 + size ≤ 缓存 size | — | 文件被改写/截断，全文件重读 |
| 不在缓存里 | — | 全文件读 |

不在 `~/.claude/projects/` 里的文件路径直接从缓存里删除（清理用户已删除的项目）。

### 4.3 schema 版本

- `schema_version` 不匹配时整个缓存丢弃重建
- 当 cache turn 字段需要扩展时（例如新增 `web_search_requests` 列）递增版本号

---

## 5. CLI 输出

### 5.1 表格视图（默认）

```
$ ccenv stats --since 7d
PROFILE     CALLS    INPUT       OUTPUT      CACHED      COST
─────────────────────────────────────────────────────────────
ling        142      1.2M        340K        980K        $0.00
deepseek    87       650K        180K        420K        $1.83
anthropic   23       180K        62K         110K        $4.21
unknown     5        12K         8K          0           $0.04
─────────────────────────────────────────────────────────────
TOTAL       257      2.0M        590K        1.5M        $6.08
```

- token 数自动选单位（`K` / `M` / `B`）
- cost 列总是 `$X.XX`，未知价格显示 `?`
- `current` profile 行用粗体标记（picocolors `bold`）
- 总计行单独画分隔线

### 5.2 分组维度 `--by`

| 值 | 第一列 |
|---|---|
| `profile`（默认） | profile 名 |
| `model` | 实际 model 字符串 |
| `project` | cwd 末段（例如 `cc-cli`），冲突时显示完整路径 |

`--by` 多个时不支持（v0.1 一次一个维度）。

### 5.3 时间窗口 `--since`

- `7d` / `30d` / `90d` / `365d`：基于当前时间倒推
- `YYYY-MM-DD`：从该日期 00:00 本地时区开始

### 5.4 过滤 `--profile <name>`

按 profile 归属过滤后再聚合。常用于核对单个 provider 账单。

### 5.5 JSON 输出 `--json`

```json
{
  "since": "2026-04-23T00:00:00.000Z",
  "until": "2026-04-30T08:31:12.345Z",
  "by": "profile",
  "rows": [
    {
      "key": "ling",
      "calls": 142,
      "input_tokens": 1200000,
      "output_tokens": 340000,
      "cache_read_tokens": 980000,
      "cache_creation_tokens": 0,
      "cost_usd": 0.00
    }
  ],
  "total": {
    "calls": 257,
    "input_tokens": 2000000,
    "output_tokens": 590000,
    "cache_read_tokens": 1500000,
    "cache_creation_tokens": 0,
    "cost_usd": 6.08
  },
  "warnings": [
    { "type": "unpriced_model", "model": "openrouter/some-new-model", "calls": 1 }
  ]
}
```

便于接入第三方 dashboard / spreadsheet。

---

## 6. 边界与已知限制

| 场景 | 行为 |
|---|---|
| 用户未启用任何 profile，纯用官方 claude | 全部归到 `unknown`，仍能算费用 |
| 同一 cwd 在 24 小时内被多个 profile 启动过 | 按 §2.2 取最近一次，可能有少量误差 |
| 一个 profile 用同一 model 跑了多次 | 正常聚合，无歧义 |
| 多个 profile 同 model（§2.3） | 字典序取第一并加警告 |
| jsonl 文件正在被 Claude Code 写入 | 流式读到 EOF 即停，下次扫描走增量补齐 |
| 损坏 / 非 JSON 行 | 跳过该行，整体不报错 |
| 用户删除了 `~/.claude/projects/` 子目录 | 缓存中该路径条目被清理 |
| 跨时区 | `--since 7d` 按本地时区计算窗口；JSON 输出固定 UTC |

---

## 7. 性能目标

- 1000 个 jsonl 文件、共 100MB：首次扫描 < 5 秒；命中缓存后 < 200ms
- 内存占用：流式读取，单文件常驻 < 1MB
- `--json` 输出可被 `jq` 顺利消费（一次输出，非 NDJSON）

---

## 8. 测试矩阵

`tests/stats.parse.test.ts`：
- 完整 jsonl fixture（含 user / assistant / tool_result 混合）→ 正确抽出 assistant turn
- 损坏行（无效 JSON / 缺字段）→ 跳过，不抛错
- `cwd` 缺失 → 从目录名反解

`tests/stats.aggregate.test.ts`：
- 主路径 model 映射
- fallback sessions.jsonl 关联
- 多 profile 同 model 歧义警告
- `unknown` 归类
- pricing 缺失模型的 `?` cost
- 时间窗口边界（`--since 7d` 起止）

`tests/stats.cache.test.ts`：
- 文件未变 → 命中缓存
- mtime + size 增 → 追加解析
- size 缩 → 全量重读
- schema 版本不匹配 → 丢弃重建
