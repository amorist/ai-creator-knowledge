# AGENTS · Agent 契约（必读）

> 任何 AI 操作本仓库前，先读本文件与 [SPEC.md](SPEC.md)。本库是 **Agent-first** 的：
> AI 负责读写与维护，人负责判断与品味。

## 角色分工

| 角色 | 职责 |
|---|---|
| **人** | 定品味、做判断、拥有 `profile/`、批复 checkpoint、维护 `feeds/` 的取舍 |
| **AI** | 采集、编译、整理、检索、起草、体检；把结论写成符合 SPEC 的条目 |
| **人 + AI** | 选题、脚本、笔记、长文——AI 起草，人确认 |

## 铁律

**M0 · 先查再写。** 写任何条目前先 `knowledge__recall` 检索本库：已有条目要**更新**它，
而不是新建一份近义词。合并优于堆叠。

**M1 · 溯源。** 任何外部结论都要能回到来源：
外部事实/引用 → 正文链接或 frontmatter `sources:`；库内引用 → `[[相对路径或标题]]`；
人本人的判断 → 标注「口述」。**不编造**数据、链接、案例与引语。

**M2 · 人主笔，AI 辅助。** `profile/`（账号人设、目标、价值观）与价值判断由人拥有主权。
AI 只结构化、提问、提醒，不替人编造立场。

**M3 · 每条都入库。** 值得留下的结论、素材、拆解、复盘都写成 `learnings/` `assets/`
`docs/` 里的一条 md，不散落在对话里。写不进去 = 这条经验等于没发生。

**M4 · 只读上游。** 桌面应用对本仓库是只读消费者。不要为了"让桌面更新"而在仓库里造
同步产物、索引文件或临时目录；提交进仓库的只有人要看的内容。

## 各目录的写法

### learnings/ —— 经验（AI 主要产出区）

一条经验 = 一个**可独立复用的结论**。标题就是结论。frontmatter 见 SPEC 第 2 节，
建议字段：`title` `summary` `tags` `domain` `date` `author` `confidence` `sources`。

正文建议四段：**结论 → 证据 → 怎么用 → 反例/边界**。

写"边界"是硬要求：注明这条经验在什么条件下**不**成立，否则会被当成万能药复用。

### assets/ —— 素材与选题

- 选题卡：`assets/选题库/<标题>.md`，frontmatter 加 `status: develop|scheduled|published`；
- 案例 / 金句 / 灵感：一张卡一条，别忘了 `sources:`。

### docs/ —— 方法论与规则

长文、平台规则、SOP。改动平台规则类文档时，在正文里标日期与来源——规则会变。

### profile/ —— 画像

账号人设、受众、语言风格、目标。AI **只读**：可以把画像翻译成写作约束，
但不得擅自改写。

### skills/ 与 templates/ —— 能力

目录里必须有 `SKILL.md`，frontmatter 至少 `name` + `description`。
`description` 写清「做什么 + 什么时候用」——它是 agent 选择技能的**唯一**依据。
技能正文按「何时用 → 输入 → 步骤 → 输出 → 反例」组织。

### feeds/ —— 订阅源

一个源一个 md，规范见 [docs/subscription-protocol.md](docs/subscription-protocol.md)。
AI 可以**建议**新源（并解释为什么值得订），是否入库由人决定。

## 提交约定

- 一次提交一件事；commit message 用「动词 + 对象」，例如
  `add: 小红书封面三种构图`、`update: 钩子经验补充反例`、`feeds: 停用 X`；
- 只提交本仓库内容；不要提交桌面应用的索引/缓存产物（见 `.gitignore`）；
- 新增或重命名 `skills/` 下的技能时，检查名字是否与本地已有技能冲突（部署是平铺的）。

## 桌面工具速查

| 想做的事 | 工具 / 入口 |
|---|---|
| 检索知识库 | `knowledge__recall({ query, domain?, origin?, source?, scope? })` |
| 拉取最新知识库 | `knowledge__sync`（或设置页 Sync） |
| 写入本机个人沉淀（不推送） | `knowledge__note` / `knowledge__personal` |
| 读订阅文章 / 刷新订阅 | `inspiration__list` / `inspiration__read` / `inspiration__refresh` |
| 把文章变成选题 | 灵感 reader 里的「加入选题」 |
