# 仓库规范（SPEC）

本文件是这套知识库的**标准**：目录语义、文件命名、frontmatter 字段、以及桌面侧如何消费。
改动本文件 = 改标准；下游（dsh-desktop 的内容知识库 / 灵感插件）按本文件实现。

版本：`spec 1`（见文末"版本与演进"）。

---

## 1. 顶层目录契约

只有以下目录有语义，其余目录（`.github/`、`scripts/` 等）由你自己的工具链使用，
桌面侧不读、不索引。

| 目录 | 语义 | 桌面侧行为 |
|---|---|---|
| `feeds/` | **订阅源**（RSS / Atom / RDF / JSON Feed） | 灵感面板读取 → 自动订阅 + 更新 |
| `skills/` | **Agent 技能包** | 平铺部署为 `$DSH_HOME/skills/<name>/`，成为可调用技能 |
| `templates/` | **参考模板** | 与 `skills/` 同路径同规则部署 |
| `learnings/` | 经验沉淀（拆解、方法论、复盘、踩坑） | 进 BM25 索引，可 `knowledge__recall` |
| `assets/` | 素材清单（选题库、案例、金句、灵感） | 同上 |
| `docs/` | 方法论、平台规则、长文 | 同上 |
| `profile/` | 账号 / 团队 / 个人画像 | 同上 |

四个被索引的目录（`learnings` `assets` `docs` `profile`）之下**任意层级**的 `.md`
都视作一条知识条目；子目录用来做分类（如 `learnings/爆款拆解/…`），
子目录名会参与 **领域（domain）兜底推断**：没有写 `domain:` 时，用相对路径里
非纯数字/非纯年份的第一段内容目录作为领域标签。

> 索引目录下**不要**放 `README.md` 这类说明文件——它们会被当成条目收进索引。
> 目录说明写在根 `README.md` / 本文件里。空目录用 `.gitkeep` 占位。

## 2. 知识条目（`learnings/` `assets/` `docs/` `profile/`）

### 2.1 frontmatter

```yaml
---
title: 钩子的三种写法（必填；缺失时回退到文件名）
summary: 一句话说清这条经验解决什么问题，用于检索排序与列表展示
tags: [钩子, 短视频, 开头]
domain: [短视频, 小红书]        # 内容垂类 / 平台；缺省时按路径推断
date: 2026-09-11                # 内容日期；缺省回退文件 mtime
author: 你的名字
confidence: 0.7                 # 0–1，这条经验有多经得起复用（默认 0.5）
kind: learning                  # 可选，覆盖目录默认类型 learning|asset|doc|skill
---
```

**被索引的字段**（桌面按固定子集解析，其它字段原样保留、不参与检索）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | 字符串 | 人类标题；缺失回退文件名 |
| `summary` | 字符串 | 摘要，列表与卡片展示 |
| `tags` | 列表 | `[a, b]` 或逗号分隔 |
| `domain` | 列表 | 垂类 / 平台，可被查询加权 |
| `date` / `updated` | `YYYY-MM-DD` 或 ISO | 参与"越新越值钱"的温和加权 |
| `author` | 字符串 | 贡献者 |
| `confidence` | 0–1 数字 | 经验可靠度 |
| `kind` | 枚举 | 覆盖目录默认类型 |

**自由字段**（写给人看、给 agent 读，不被索引，可随意扩展）：
`sources:`（溯源链接列表）、`status:`（`draft` / `active` / `archived`）、
`platform:`、`metrics:` 等。溯源是硬要求，见 [AGENTS.md](AGENTS.md) 的 M1。

### 2.2 正文

纯 markdown。约定：

- 一条经验 = 一个可独立复用的结论，标题即是结论本身，不写"关于……的一些思考"；
- 引用外部事实必须在正文或 `sources:` 里给出链接；
- 引用库内其它条目用 `[[相对路径或标题]]`；
- 长篇结构（拆解 / 方法论）建议 `结论 → 证据 → 怎么用 → 反例`。

### 2.3 文件名

- 知识条目：允许中文，`<主题关键词>.md`，短、可读、可检索；
- 同名冲突时加限定：`钩子的三种写法-小红书.md`；
- 以 `_` 开头的文件/目录是**草稿**，桌面侧应跳过（不索引、不部署）。

## 3. 技能包（`skills/` 与 `templates/`）

```
skills/
  <skill-name>/
    SKILL.md          # 必需，技能入口（frontmatter: name / description）
    <其它文件>         # 可选，技能自己的参考文档、脚本、资源
templates/
  <template-name>/
    SKILL.md          # 同样必需：模板也是可被 agent 调用的技能
```

规则：

1. **有 `SKILL.md` 才算技能**——没有它的目录会被忽略（防止半成品被部署）；
2. 部署是**平铺**的：`skills/<skill-name>/` → `$DSH_HOME/skills/<skill-name>/`，
   所以 `<skill-name>` 在整台机器上必须唯一，且会被跨仓库按配置顺序"先到先得"；
3. `_` 开头的目录不部署（草稿）；
4. 需要按角色分组（一个仓库多个垂类技能包）时，用 `skills/<role>/<skill>/SKILL.md`，
   并在桌面侧配置 `roles` 优先级；`templates/` 始终是顶层；
5. `SKILL.md` 的 frontmatter 至少写 `name` 与 `description`——`description` 决定
   agent 什么时候会用它，写清"做什么 + 何时用"。

## 4. 订阅源（`feeds/`）

一个源一个文件：`feeds/<slug>.md`。`<slug>` 用**小写 ascii + 连字符**（它是这条订阅的
稳定 id，重命名 = 重新订阅一条），建议与域名或刊物名对齐。

```yaml
---
title: 晚点 LatePost        # 展示名；桌面首次成功抓取后会采用订阅自身标题，除非你写了 title
url: https://example.com/feed
type: auto                  # auto | rss | atom | rdf | json
group: 中文科技              # 可选，桌面源列表里的分组头
tags: [科技, 商业]           # 可选
enabled: true               # false = 停用（保留已抓文章，停止更新）
weight: 10                  # 可选，排序权重，越小越靠前（见下）
---

正文写"为什么订它、要从里面看什么、怎么用"——这段文字是你的策展理由，
不是抓取配置。
```

这三个字段在桌面上**真的会用**（不是备注）：

- **`group`** —— 源列表按它分段，同一个 `group` 的源排在同一个分组头下面；
- **`weight`** —— 排序权重，越小越靠前。组**内**按它排（没写的排在同组有权重的后面），
  组的**位置**取组内最小的 weight（很多仓库是"一个源一个组"，那时它就是这一行在列表里的位置）；
  都没写就保持声明顺序，手加的源同理；
- **正文** —— 存为这条订阅的备注：源行悬停能看到，打开该源的文章时显示在标题下方。

完整语义（URL 匹配、更新、停用、删除、多源合并）见
[docs/subscription-protocol.md](docs/subscription-protocol.md)。

被忽略的文件：`_` 开头、`README.md`、以及没有 `url:` 或 `url` 非 `http(s)` 的文件。

## 5. 桌面消费方式（下游契约）

1. 桌面把本仓库作为一个 **git 源**克隆到本地（`$DSH_HOME/knowledge/sources/<name>/`），
   **只读**：永不 commit、永不 push 回本仓库；
2. `skills/` `templates/` 平铺部署到 `$DSH_HOME/skills/`，并记入所有权清单，
   上游删除 → 本地同步删除（用户手装的技能永不被覆盖）；
3. 四个索引目录被扫描、分词、建 BM25 索引（按 scope 分区）；
4. `feeds/` 被归一化成订阅清单，交给灵感面板导入并抓取。

## 6. 版本与演进

- 本文件头部标 `spec <n>`；字段**只增不改**，破坏性变更才升 n；
- 下游必须容忍未知字段（原样保留）与未知目录（忽略）；
- 新目录若要被索引或同步，必须在桌面侧同步实现，并在本文件登记。

当前：`spec 1`。
