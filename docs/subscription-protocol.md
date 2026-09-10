# 订阅源同步协议（仓库 ↔ 桌面）

版本：`protocol 1`　对应 [SPEC.md](../SPEC.md) `spec 1`

## 1. 要解决的问题

今天「订阅源」和「知识库」是两套系统：

- 知识库（creator-knowledge 插件）只读拉取 git 仓库，索引 `learnings/` 等目录；
- 订阅（inspiration 插件）把源存在 `$DSH_HOME/inspiration/sources.json`，
  只能一条一条手动加，且**只活在这台机器上**。

结果是：换台机器、换个同事、换个项目，订阅列表就没了；反过来，你在知识库里写下的
「这个源值得追」，和灵感面板里的订阅列表没有任何关系。

本协议只做一件事：**让订阅链接跟知识库一起版本化，push 一次即完成分发。**

```
        你 push 知识库                        桌面拉取
   ┌──────────────────────┐          ┌───────────────────────────┐
   │ ai-creator-knowledge  │          │ 内容知识库插件             │
   │   ├── skills/ …       │   git    │  clone → 索引 → skills     │
   │   └── feeds/*.md  ────┼─────────▶│  feeds/*.md → 订阅清单     │
   └──────────────────────┘ 只读拉取   └────────────┬──────────────┘
                                                   │ $DSH_HOME/knowledge/feeds.json
                                                   ▼
                                        ┌───────────────────────────┐
                                        │ 灵感插件                   │
                                        │  导入 → 订阅 → 抓取更新     │
                                        └───────────────────────────┘
```

一条原则贯穿全篇：**仓库是唯一事实来源，桌面是只读消费者**——桌面永不对知识库仓库
做写操作（不 commit、不 push、不落同步产物到仓库里）。

## 2. 仓库侧格式

### 2.1 目录

```
feeds/
  README.md          # 写法说明（显式忽略，不是订阅）
  _draft.md          # `_` 前缀 = 草稿，忽略
  import-ai.md       # 一条订阅
  bens-bites.md
```

### 2.2 单个文件

```markdown
---
title: Import AI
url: https://importai.substack.com/feed
type: auto
group: AI 前沿
tags: [AI, 研究]
enabled: true
weight: 10
---

每周 AI 研究综述。看模型能力边界与一句话结论，不追细节。
```

| 字段 | 必需 | 语义 |
|---|---|---|
| `url` | 是 | 订阅地址，必须 `http(s)://`；**这是订阅的身份键** |
| `title` | — | 展示名；缺省用订阅自身标题，再缺省用域名 |
| `type` | — | `auto`(默认) / `rss` / `atom` / `rdf` / `json`；`auto` = 按响应内容嗅探 |
| `group` | — | 桌面源列表里的分组头；同一个 `group` 的源排在一起 |
| `tags` | — | 标签，随源保存，便于以后筛选 |
| `enabled` | — | 默认 `true`；`false` = 停用（见 §4.3） |
| `weight` | — | 排序权重，越小越靠前。组内按它排（没写的排在同组有权重的后面）；**组的位置取组内最小的 weight**（"一个源一个组"时它就是这一行的位置）；都不写就保持声明顺序 |
| 正文 | — | 策展理由（为什么订、要看什么）：源行悬停可见，打开该源的文章时显示在标题下方 |

### 2.3 校验与归一化（写入 `feeds.json` 之前）

1. 只收 `*.md`，跳过 `_` 前缀与 `README.md`；
2. 缺 `url` 或 URL 非法（非 http/https、解析失败）→ **跳过并记诊断**，不算同步失败；
3. URL 归一化后去重：去首尾空白、scheme/host 小写、去末尾 `/`、去追踪参数
   （`utm_*`、`fbclid` 等）；**同 URL 保留先出现者**（源配置顺序 → 文件名字典序）；
4. `type` 不在枚举内 → 回落 `auto`；`enabled` 非布尔 → 按 `true`；
5. 每条生成稳定 `id = <sourceName>:<slug>`（slug = 文件名去扩展名，小写，
   非 `[a-z0-9-]` 字符替换为 `-`）。

## 3. 桌面侧交接格式

内容知识库插件在一次 sync 之后，把**所有已配置源**（全局源 + 每个 project 的专属源，
按配置顺序去重）的订阅合并写成一个文件——订阅属于仓库，不属于 scope 分区，所以单源 /
单 scope 的同步也必须发布完整集合：

> 写入侧的覆盖范围有两种模式（调用方决定）：**显式传入完整源名单**＝权威声明，
> 名单里没有的源就是被移出配置的源，它的订阅随之下线（空名单即"知识库已删除"）；
> **省略名单**＝部分运行，本次扫描的源重新发布，其他仓库上次发布的条目原样带过来，
> 因此任何部分运行都不会冻结或抹掉别人的订阅。这与索引重建对部分运行的处理是同一条规则。

`$DSH_HOME/knowledge/feeds.json`

```jsonc
{
  "version": 1,
  "generatedAt": 1789056000000,
  "sources": {                                  // 诊断用：哪个 git 源贡献了什么
    "ai-creator-knowledge": { "revision": "b0f5c5d", "feeds": 4 }
  },
  "feeds": [
    {
      "id": "ai-creator-knowledge:import-ai",
      "source": "ai-creator-knowledge",         // git 源名 = 桌面配置里的 name
      "relPath": "feeds/import-ai.md",
      "url": "https://importai.substack.com/feed",
      "normalizedUrl": "https://importai.substack.com/feed",
      "title": "Import AI",
      "type": "auto",
      "group": "AI 前沿",
      "tags": ["AI", "研究"],
      "enabled": true,
      "weight": 10,
      "note": "每周 AI 研究综述。"
    }
  ],
  "skipped": [ { "source": "…", "relPath": "feeds/broken.md", "reason": "missing url" } ]
}
```

写入规则：**原子写**（临时文件 + rename）；内容未变则不重写（比对 `feeds` 规范化 JSON），
避免无谓触发下游刷新。

> 为什么经过这个文件，而不是让灵感插件自己去扫 git 克隆？
> 因为"解析 frontmatter + 归一化 + 多源去重"只应该有一份实现，而它天然属于知识库插件
> （它已经拥有 `sources/` 克隆和 frontmatter 解析器）。灵感插件只消费一个稳定的 JSON
> 契约：两个插件之间没有代码依赖，只有文件约定。

## 4. 灵感插件的导入语义

### 4.1 触发时机

1. **刷新时**——`inspiration__refresh` 与面板「刷新全部」：先比对 `feeds.json` 的
   mtime/内容哈希，变了就先导入再抓取。这是"直接订阅并更新"的主路径；
2. **面板打开时**——源列表加载后做一次同样的检查（廉价，无变化即跳过）；
3. **手动**——源列表标题行的「从知识库同步」按钮，与工具 `inspiration__syncSources`。
   这两条都是"只订阅不发网络请求"；**面板按钮在新增了源之后会紧接着只抓那几个新源**
   （`refresh({ sourceIds })`），所以点一下就能读到文章，而不是看到"新增 4 个源"却面对空列表。
   工具不带这一步：agent 想拉文章时自己调 `inspiration__refresh`，契约保持可预测。

自动路径失败（知识库插件没挂载、`feeds.json` 不存在、JSON 损坏）**静默跳过**，
不影响原有订阅与阅读；只有手动路径才报错。

### 4.2 匹配与更新

订阅的身份键是 **归一化 URL**（与 §2.3 同一套归一化）。对清单里的每一条：

| 情况 | 动作 |
|---|---|
| 本地没有该 URL | **新增**源：`origin: knowledge`、`externalId`、`group` 取清单值，随后抓取 |
| 本地已有该 URL，且是知识库托管 | **更新**分组 / 备注 / `url` / `enabled` / `title`；若这条自上次导入后在本机被改过名或分组，保留本机改法 |
| 本地已有该 URL（或同一 `externalId`），但是**手动加的** | **不接管**：只把一个缺失的分组补上，其余字段保持用户意图；在同步结果里报告冲突 |
| 本地已有同一 `externalId` 但 URL 变了 | **就地更新**这一行（仓库里改地址＝改指向，不是订阅两条） |
| 仓库**仍在发布**，但它少了一条声明 | 标记 `stale: true`，**保留已抓文章**，列表里显示"知识库已移除"，由用户决定是否删除 |
| **整个仓库（或整个知识库）消失**：它不再出现在清单的 `sources` 里，或清单文件本身没了 | **什么都不做**：源、文章、分组、笔记全部原样保留（不清 stale、不停止刷新）。此时它已经是"你自己的订阅"，可以随时手动删除 |
| 清单里 `enabled: false` | 停用：保留文章，`refresh` 跳过，列表灰显 |
| 该源仍被清单声明 | **不允许在桌面删除**：删除只会丢掉本地已抓文章，下一次导入又会订阅回来。面板给的是"由知识库管理"的说明 + 该去删哪个文件的指路 |

「本机改过名」怎么判断：导入时把源当前的 `title` / `group` 与**上一次导入写入的值**
（`managedTitle` / `managedGroup`）比对，不一致就说明是本机改的，导入不覆盖。

「仓库还在 vs 仓库没了」怎么判断：清单头部带着**发布者名单**（写入侧 `sources` 的键）。
只有名单里的仓库才有资格撤回自己的声明；不在名单里的，说明那个仓库（乃至整个知识库）已经
不在配置里了，它的订阅就此转正。这一条是本协议里最重要的"用户主权"规则：
**知识库是订阅的建议者，不是订阅的所有者。**

导入行的 id 也来自声明本身（`feeds/<slug>.md` 的文件名），不来自显示标题——
仓库改标题不会改变这条订阅的身份（它的文章缓存、它在桌面上的选中状态）。

清单读不出来时，三种情况分开报，不混成一句"还没有发布订阅清单"：
**没发布过**（正常起点）／**文件损坏**（JSON 坏了或缺字段）／**版本过新**
（writer 写了 v2，这个应用只认到 v1）。

`version` 字段的判定是严格的：**缺省**按 v1（手写清单是被支持的输入）；
**存在但不是 ≥1 的整数**（字符串 `"99"`、`null`、`0`、`1.5`）算**损坏**——曾经这种写法会
静默回落到 v1 并按 v1 的规则解释，正是版本闸门要防的那种"schema 变了却静默误读"；
**大于 v1** 算**版本过新**，报出具体版本号，让人知道该升级应用而不是去找文件。

源记录新增字段（向后兼容，旧记录缺省即"手动源"）：

```
origin:      'manual' | 'knowledge'
externalId:  'ai-creator-knowledge:import-ai'
managedBy:   'ai-creator-knowledge'      // git 源名，用于多仓库合并时归属
stale:       boolean
disabled:    boolean
```

### 4.3 停用与删除的区别

- **停用**（声明里 `enabled: false`）：源还在，文章还在，只是不再抓取。
  开关归仓库所有——本机没有单独的暂停键，否则下一次导入就会把它抹掉；
- **仓库撤回声明**（仓库还在发布，`feeds/<slug>.md` 被删）：标 `stale`，文章保留，提示用户；
- **知识库消失**（仓库从配置里删掉 / 清单文件没了）：**不标 stale、不动任何字段**，
  订阅原样留着——用户当初订阅了它，知识库走了不代表用户不要了；
- **删除源**（用户在桌面显式删除）：删源记录，文章按现有语义进回收；
- 三者的区别必须在 UI 上说清楚，避免"改了一下仓库就丢文章"。

### 4.4 幂等性

同一份清单导入两次，结果必须完全一致（不新增、不更新、不产生新 id）；
导入本身**不发起网络请求**，抓取永远是导入之后的独立步骤——这样离线也能先看到订阅变了。

## 5. 需要落地的改动

### 5.1 内容知识库插件（`@dsh-desktop/plugin-creator-knowledge`）

| 位置 | 改动 |
|---|---|
| `src/core/feeds.ts`（新） | 扫描 `<source>/feeds/*.md`，frontmatter 解析、校验、归一化、去重、`skipped` 诊断 |
| `src/core/sync.ts` | 每个源 pull 之后收集订阅；整轮结束后原子写 `$DSH_HOME/knowledge/feeds.json`（内容不变则跳过）；写失败不影响 sync 成功 |
| `src/core/config.ts` | 新增 `feedsDir`（默认 `feeds`）、`feedsFile` 路径助手 |
| `src/shared/contract.ts` | `status` 返回订阅计数与诊断；同步结果带 `feeds: {count, skipped}` |
| `src/client/CreatorKnowledgeSection.tsx` | 设置页显示"订阅源 N 条（已交给灵感）"与跳过原因 |
| `tests/feeds.spec.ts`（新） | 解析、非法 URL 跳过、去重、草稿忽略、内容不变不重写 |

### 5.2 灵感插件（`@dsh-desktop/plugin-inspiration`）

| 位置 | 改动 |
|---|---|
| `src/core/knowledge-feeds.ts`（新） | 读 `$DSH_HOME/knowledge/feeds.json`（路径来自 `DSH_HOME`），返回清单 + 指纹（mtime+size+hash） |
| `src/core/store.ts` | `SourceRecord` 增 `origin/externalId/managedBy/stale/disabled`；新增 `upsertManaged()`、`markStale()`、`setDisabled()` |
| `src/services/inspiration-service.ts` | 新增 `syncSources()`（导入并返回 `{added, updated, unchanged, stale, disabled, manualConflicts}`）；`refresh()` 先做一次静默导入 |
| `src/shared/contract.ts` | 新增端点 `syncSources`；`SourceMeta` 暴露 `origin/stale/disabled` |
| `src/tools.ts` | 新增 `inspiration__syncSources`；`inspiration__refresh` 支持 `only: 'all' | 'knowledge' | 'stale'`；`inspiration__list` 标注来源 |
| `src/client/InspirationPanel.tsx` | 源列表标题行加「从知识库同步」；源行加"知识库 / 已移除 / 已停用"徽标；同步结果用平台 Toast 汇报 |
| `tests/knowledge-feeds.spec.ts`（新） | 幂等、不接管手动源、消失→stale、停用、指纹未变不重复导入 |

实现时的两处取舍（2026-09-11）：

- 新增的 `inspiration__syncSources` 工具**没有聊天卡片**（其余四个工具都有），输出走文本；
- **没有本机暂停键**：`enabled` 归仓库所有（见 §4.3）。

P2.1 复审修复落点（2026-09-11）：`core/store.ts`（`declaration` 字段、按声明文件取 id、
`publishedBy` 决定谁能撤回声明）、`core/knowledge-feeds.ts`（三态读取 + `publishedBy`）、
`services/inspiration-service.ts`（删除守卫 + 三态报错 + `managed` 标注）、
面板（「由知识库管理」说明弹窗）。

P2.2 清理与诊断（2026-09-11）：

- **被跳过的原因可见**：设置页的「详情」里列出每一条被跳过声明的 `源/文件 · 原因`
  （缺失 url / 非 http / 与别的源重复），超过 20 条只列前 20 并写"还有 N 条"——
  原因本来只存在于 `feeds.json` 里；
- **批量清理**：轨道里出现「清理已移除的订阅 N」时，可一次性删掉所有**被撤回**（stale）的源，
  仍然只动 stale，被声明的源与"仓库已消失"的源都不在其中；
- **空 URL 的源不再参与刷新**：「随手收」没有可抓的地址，此前每次「刷新全部」都把它报成一条失败；
  现在它既不进刷新目标，右键也不再提供「刷新」；
- **清单读取先比指纹**：`readKnowledgeManifest(env, { unchangedSince })` 先用 mtime+size 判断，
  未变则直接答 `unchanged`，不再每次 `status()` 都整文件读 + sha1。
- **版本字段判定收紧**：`version` 缺省＝v1（手写清单）；存在但不是 ≥1 的整数（`"99"`、`null`、
  `0`、`1.5`）＝损坏；大于 v1＝版本过新并报出具体版本号。

P2.3 让 `group` / `weight` / `note` 真正生效（2026-09-11）：此前三者只是被存下来的数据，
UI 层完全没用到——轨道是平铺的、`weight` 在导入时被丢掉、策展理由没有任何露出。现在：
源列表按 `group` 分段（分组头是平台自己的标签行，筛选菜单用的是同一个折叠结果）；
`weight` 存进源记录并决定顺序（组内升序、未声明者靠后；**组的位置取组内最小 weight**，
否则"一个源一个组"的仓库里这个字段等于没用，实测就是这样）；策展理由进源行 tooltip
与阅读器标题下方（上限 3 行，纯文本渲染）。实测真实仓库：`import-ai`(10) →
`bens-bites`(20) → `product-hunt`(30) → `future-proof`(40)，与 `weight` 完全一致。

P2.4 订阅之后立刻可读（2026-09-11）：「从知识库同步」按钮在一次导入**新增了源**时，
紧接着用 `refresh({ sourceIds })` 只抓这几个新源，并汇报"新增 N 个源 · 已抓取 M 篇"。
导入本身仍然不发网络请求（自动路径零成本、离线可用，agent 的工具契约不变），
所以这一步只发生在用户显式点击的面板路径上，而且只碰新行——不会为了 4 个新源把整库重抓一遍。

### 5.3 可选：把桌面上的订阅**导出**回仓库

桌面是只读消费者，所以导出不是"写回"，而是**生成待提交的草稿**：
`inspiration__exportFeeds`（或一个脚本）把当前手动订阅渲染成 `feeds/*.md` 文本，
输出到对话/文件，由你 review 后自己 commit + push。
这样"从浏览器里随手加的源"也能沉淀进标准仓库。

## 6. 分阶段落地

| 阶段 | 内容 | 状态 |
|---|---|---|
| P0 | 仓库标准 + `feeds/` 协议 + 真实仓库（含 4 条真实订阅） | ✅ 2026-09-11 |
| P1 | 知识库插件：扫 `feeds/`、写 `knowledge/feeds.json`、设置页与工具卡计数 | ✅ 2026-09-11 |
| P2 | 灵感插件：导入 + 「库」徽标 + 「从知识库同步」按钮 + `inspiration__syncSources` + `status()`/`refresh()` 静默导入 + `only` 过滤 | ✅ 2026-09-11 |
| P2.1 | 复审修复：删除仍在声明中的源改为拒绝并指路；导入 id 取自声明文件；清单三态报错；**知识库消失时不动已订阅的源** | ✅ 2026-09-11 |
| P3 | 导出草稿（把本机手工订阅渲染成待提交的 `feeds/*.md`）+ 自动化接线（每日 `inspiration__refresh`） | 未做 |

实现落点见 dsh-desktop 的
`.agents/notes/implemented/feature/2026-09-11-knowledge-feeds-subscriptions.md`。

## 7. 边界与反模式

- **不要在 `feeds/` 放非订阅文件**：任何 `.md`（除 `_`/README）都会被当作订阅解析；
- **不要把权限凭据写进 URL**：仓库是共享的，带 token 的 URL 会泄漏（也请勿用私有 feed token）；
- **不要依赖仓库里的顺序**表达优先级：`weight` 才是排序依据，源顺序只在去重时决定谁胜；
- **不要期待双向同步**：桌面改了分组不会写回仓库；要么按 §5.3 导出草稿，要么直接改仓库；
- **不要用 `feeds/` 代替阅读状态**：已读/收藏/稍后读永远只在本机（`$DSH_HOME/inspiration`）。

## 8. 验收口径

1. 在仓库加一个 `feeds/<slug>.md` → push → 桌面 Sync → 灵感源列表出现该源（分组/备注正确），
   且能抓到文章；
2. 再 Sync 一次（内容未变）→ 无新增、无更新、无重复抓取；
3. 把 `enabled` 改成 `false` → push → Sync → 源被停用、文章仍在；
4. 删除该文件 → push → Sync → 源标"知识库已移除"、文章仍在；
5. 桌面手动加的源，在这套流程中**永不被改写或删除**。
