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
| `video/` | **视频垂类**：`video/skills/` 视频生成技能 + `video/sources/` 机器读的 JSON 源 + `video/resources/` 资源包（组件 / LUT / 字库 / 音效 / 转场 / 特效 / 着色器 / 成片模板 / 模型声明） | 技能按 `skills/` 同规则平铺部署；JSON 源进索引（`kind: source`）；资源包**整棵物化到工作台并载入**。见第 3.1 / 3.2 节 |

四个被索引的目录（`learnings` `assets` `docs` `profile`）之下**任意层级**的 `.md`
都视作一条知识条目；子目录用来做分类（如 `learnings/爆款拆解/…`），
子目录名会参与 **领域（domain）兜底推断**：没有写 `domain:` 时，用相对路径里
非纯数字/非纯年份的第一段内容目录作为领域标签。

> 索引目录下**不要**放 `README.md` 这类说明文件——它们会被当成条目收进索引。
> 目录说明写在根 `README.md` / 本文件里。空目录用 `.gitkeep` 占位。

「怎么被读」的准确规则（三处不一样，别记混）：

| 目录 | 收哪些文件 | `_` 前缀 | `README.md` |
|---|---|---|---|
| `feeds/` | 顶层 `*.md`（子目录忽略） | **跳过**（草稿） | **跳过** |
| `skills/` `templates/` `video/skills/` | 含 `SKILL.md` 的直接子目录 | 跳过（草稿） | 不适用 |
| `video/sources/` | 顶层 `*.json`（子目录忽略） | **跳过**（草稿） | 不适用 |
| `video/resources/` | 按类型：`component-packs/<pack>/<slug>/{component.json,card.json}`、`luts/<slug>/*.cube`、`sfx/<slug>/{sound.json,音频}`、`transitions/<slug>/transition.json`、`effects/<slug>/effect.json`、`shaders/<slug>/{shader.glsl,spec.json}`、`templates/<slug>/template.json`、`fonts.json`、`models.json` | **跳过**（草稿） | **跳过**（顶层那一个是人读说明） |
| `learnings/` `assets/` `docs/` `profile/` | **任意层级**的 `*.md` | **不跳过**（`_` 只是文件名，仍是条目） | **会被索引**，所以别放 |

也就是说：只有 `feeds/`、`skills/`、`templates/`、`video/` 认 `_` 前缀草稿；
四个索引目录里没有任何"隐藏文件"约定，放进去的每个 `.md` 都是一条会被检索到的知识。

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

### 3.1 视频垂类（`video/`）：技能与 JSON 源两分

「专门生成视频」的东西放在一个 `video/` 根下，**类型由形状判定**（不靠前缀猜）：

```
video/
  README.md                 # 人读的说明（不部署、不索引）
  skills/<name>/SKILL.md    # ① 视频生成技能：与 skills/ 同规则平铺部署
  sources/<id>.json         # ② JSON 源：不部署，进索引（kind: source）
```

**① 技能**（`video/skills/`）

- 与 `skills/` **同一条部署规则**（含 `SKILL.md` 才算、`_` 前缀是草稿、平铺进 `$DSH_HOME/skills/`）；
- 它**不经 `skillRoles`**：那套角色开关只作用于顶层 `skills/`，而视频垂类要的是"一直都在"；
- 名字在整机唯一（与 `skills/` / `templates/` 同一个命名空间）。
- **工作台生成的技能名由工作台占用**：`video-template-*`（成片模板）与 `video-clip-*`（用户模板）
  两名一律不要用——那些名字由视频工作台按它自己的模板注册表生成，撞名时会互相遮蔽。

**② JSON 源**（`video/sources/`）

一份源 = 一个顶层 `*.json`（`_` 前缀是草稿）。它**不是技能**：没有 `SKILL.md`，
所以永远不会被部署到技能目录；它进 BM25 索引（`kind: source`），
`knowledge__recall` 能按 `title` / `summary` / `tags` / `domain` 命中并给出本地 `File:` 路径，
agent 用文件工具读原文。**原文才是权威**，索引里的正文只是检索用的投影（`usage` + 键值展平）。

必填头：

| 字段 | 类型 | 说明 |
|---|---|---|
| `kind` | 字符串 | `video-source/<name>`（小写 ASCII + 连字符）；它说明这份源是什么 |
| `schema` | 正整数 | 结构版本；改结构就 +1（下游按它决定能不能读） |
| `title` | 字符串 | 人类标题（检索与列表都用它） |
| `summary` | 字符串 | 一句话说清给什么——决定 agent 什么时候会来读它 |
| `usage` | 字符串 | 什么时候读、读到之后怎么用（写给 agent 看） |

可选（推荐）：`tags` / `domain`（参与检索）、`owner` / `updated`（归属与时间）。
其余字段**自由扩展**——下游容忍未知字段。复制 [`video/sources/_template.json`](video/sources/_template.json) 起手。

**权威分工（写之前先看这条，最容易搞反）**：

| 什么 | 谁定 |
|---|---|
| **值**：色号 / 用哪个平台 / 什么场合用哪支模板 / 时长取舍 | **本仓库**（`video/sources/*.json`） |
| **字段名与语义**：`accent` / `presetId` / 模板 id / 槽位键 / op 名 | **视频工作台**（`references/catalog`、`references/props`、`videoStudio__template_film` 回执） |

所以技能里引用模板要**按名字引用**（`tpl:talk-promo`、`video-template-talk-promo`），
**不要抄它的槽位表**——模板的结构随时会改，权威是工作台回执与那一支技能。

### 3.2 资源包（`video/resources/`）：把组件（与各类资源）同步进视频工作台

技能写"**怎么做**"，资源包给"**用什么**"。资源走**整棵物化**：桌面把 `<仓库>/video/resources/**`
原样拷到 `$DSH_HOME/video-studio/resources/**`，视频工作台启动时逐类型载入（同步完不必重启）。

```
video/resources/
  README.md                  # 人读的类型表 + 各类型字段契约（不物化）
  component-packs/<pack>/<slug>/
    pack.json                # 可选：包级 name / summary / version / license / source / author
    component.json           # 渲染半（与"我的模板" StoredTemplate 同形）
    card.json                # 库半（CardMeta 同形；四个枚举 + useCase + selfChecks 必填）
    README.md                # 可选：人读的卡说明
    preview.png              # 可选：封面
  luts/<slug>/*.cube         # 调色表
  sfx/<slug>/                # sound.json + 一份音频（时长必填；字节会物化）
  transitions/<slug>/        # transition.json（layers + 静态 CSS + 白名单补间 + 参数）
  effects/<slug>/            # effect.json（与转场同形，另加 mode / group）
  shaders/<slug>/            # shader.glsl（片元主体）+ spec.json
  templates/<slug>/          # template.json（canvas + slots + ops 序列）
  fonts.json                 # 字库声明（id；不搬字节）
  models.json                # 烘焙模型声明（id + url + sha256；不搬字节）
  _examples/                 # 草稿样例（`_` 前缀：两边都跳过）
```

**各类型的字段契约以 [`video/resources/README.md`](video/resources/README.md) 为准** ——
本文件只登记类型与落点；必填/可选键、每类各自的坑（音效缺 `durationInSeconds` 会被跳过、
着色器不许出现前缀指令与非确定性输入、模型不许与内置依赖同 id、补间属性黑名单、模板 op 白名单…）
都在那份 README 里，不在这里重复。

规则：

1. **卡是两半**（与工作台 `docs/video-studio/13-card-compiler.md` §2 一致）：渲染半
   `component.json` 决定"能不能插进去"，库半 `card.json` 决定"能不能被筛到"。
   **两份都必须有** —— 缺渲染半插不进、缺库半 `component_find` 永远筛不到；
2. **组件 id 由目录名定**：`kb-<pack>-<slug>`（小写 ASCII + 连字符）。JSON 里**不写 id**，
   避免"文件里说的"和"实际注册的"不一致；
3. `component.json` 与工作台 `template_save` 的契约逐字相同：`fields` 用工程字段类型、
   `html` 是 scoped 标记（`#{{id}}` + `{{key}}`）、**不许 `<script>`**、`timeline` 是对 `tl` 的语句；
4. `card.json` 的 `category` / `role` / `slot` / `quota` 必须落在工作台受控词表里，
   `useCase`（什么时候用）与 `selfChecks`（做对了长什么样）必填；
   `source = { repo, ref, path, license, method }` 非自研必填，`talkcraft` 不许标 `ported`；
5. `label` / `summary` / `input` / `sample` **不写** —— 由组件定义与字段表派生（与内置卡同一份实现）；
6. `_` 前缀的目录/文件是草稿（不物化）；顶层 `README.md` 也不物化（人读说明）；
7. **词表级校验在桌面侧**：本仓库的合规脚本只查结构与成对文件；工作台载入时逐张校验
   枚举与溯源，不合法就整张不登记并在启动回执里报原因（**不静默**）。

**为什么库半必填**：`component_find` 按 `role` / `slot` / `quota` 筛 —— 少一个枚举，
那张卡在那一维上就永远筛不到（agent 会说"没有合适的卡"，而其实有一张正合适的）。

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

**每个字段在桌面上到底做了什么**（写得下就写，写了就一定生效）：

- **`group`** —— 源列表按它分段，同一个 `group` 的源排在同一个分组头下面；
- **`weight`** —— 排序权重，越小越靠前。组**内**按它排（没写的排在同组有权重的后面），
  组的**位置**取组内最小的 weight（很多仓库是"一个源一个组"，那时它就是这一行在列表里的位置）；
  都没写就保持声明顺序，手加的源同理；
- **正文** —— 存为这条订阅的备注：源行悬停能看到，打开该源的文章时显示在标题下方。
- **`type`** —— 告诉抓取器这是哪种订阅（`rss`/`atom`/`rdf`/`json`）；写 `auto`
  （或不写）就让它在抓取时按响应内容嗅探。**它是提示而不是断言**：写准少一次猜错，
  写错也不会坏——按声明的类型解析不出条目时，会自动退回按内容嗅探（多一次解析，不多一次请求）；
- **`title`** —— 你策展的展示名。写了就以它为准（抓到的订阅标题不会覆盖它）；
  不写则先用域名占位，首次抓取成功后换成订阅自己的标题；
- **`enabled`** —— 仓库自己的开关：`false` = **停用**（源与被抓文章都留着，任何刷新都不抓它）。
  **本机可以覆盖它**：面板右键的「停用/启用这个信息源」是你的意见，和仓库的开关分开存放，
  下一次同步不会把你抹掉；「跟随知识库设置」用来清掉覆盖、回到仓库的答案。开着就写
  `true` 或干脆不写；
- **`tags`** —— 随订阅一起保存在本机源记录里，**当前面板不按它筛选**（留给后续的过滤/导出）。
  写它们不会有害，只是暂时只是"存着"；
- **`url`** —— 身份键。改 URL 等于把这一行指到新地址（不是订阅两条）。
- **`url` 只能是公网地址**：`localhost`、`127/8`、`10/8`、`172.16/12`、`192.168/16`、
  `169.254/16`（云元数据）、`100.64/10`、IPv6 环回/ULA/链路本地、`.local` 等
  内网写法会被**跳过**，并在「内容知识库 → 详情」里报 `local or private host: …`。
  理由：订阅清单是共享的，桌面会照着它发请求——一条内网地址等于让别人的机器去敲自己的服务。

完整语义（URL 匹配、更新、停用、删除、多源合并）见
[docs/subscription-protocol.md](docs/subscription-protocol.md)。

被忽略的文件：`_` 开头的（草稿，可直接复制 [_template.md](feeds/_template.md) 改）、
`README.md`、以及没有 `url:` 或 `url` 非 `http(s)` 的文件——后两种会出现在
「内容知识库 → 详情」的**被跳过原因**里，方便你回去改。

订阅地址支持 `http(s)`；**不要**把带 token 的私有订阅地址写进来（仓库是共享的）。

## 5. 桌面消费方式（下游契约）

1. 桌面把本仓库作为一个 **git 源**克隆到本地（`$DSH_HOME/knowledge/sources/<name>/`），
   **只读**：永不 commit、永不 push 回本仓库；
2. `skills/` `templates/` `video/skills/` 平铺部署到 `$DSH_HOME/skills/`，并记入所有权清单，
   上游删除 → 本地同步删除（用户手装的技能永不被覆盖）；
2b. `video/resources/**` **整棵物化**到 `$DSH_HOME/video-studio/resources/**`（配一份所有权清单：
   上游删除 → 本地删除；目标位置里不属于我们的文件**永不覆盖**），由视频工作台载入；
3. 四个索引目录被扫描、分词、建 BM25 索引（按 scope 分区）；
   `video/sources/*.json` **也进同一份索引**（`kind: source`，按 `title` / `summary` / `tags` /
   `domain` 命中，回执给本地 `File:` 路径）——但它**不部署**：它是数据，不是技能；
4. `feeds/` 被归一化成订阅清单（`$DSH_HOME/knowledge/feeds.json`），
   灵感面板导入成真正的订阅、抓文章、并持续跟随仓库的改动。

订阅这一条的完整语义（身份键、更新/撤回/停用/知识库消失、删除守卫、刷新规则）
写在 [docs/subscription-protocol.md](docs/subscription-protocol.md)——那是**规范性**文档，
本文件不重复它。要上手操作看 [docs/guide.md](docs/guide.md)。

## 6. 最小合规清单

一个"符合本标准"的仓库至少满足：

- [ ] `README.md` 说明这是什么库、给谁看；
- [ ] `AGENTS.md` 写明 AI 的读写铁律（至少：不编造、要溯源、`profile/` 由人拥有）；
- [ ] 四个索引目录里每个 `.md` 都有 `title` + `summary`（其余字段可选），
      且**没有** `README.md`；
- [ ] `skills/`（或 `templates/`、`video/skills/`）下的技能目录都带 `SKILL.md`，
      frontmatter 有 `name` + `description`，且名字在整机唯一；
- [ ] `video/sources/` 下的每个 `*.json` 都能解析，带 `kind`（`video-source/<name>`）、
      正整数 `schema`、非空 `title` / `summary` / `usage`；目录里不放非 JSON 文件；
- [ ] `video/` 下只有 `README.md`、`skills/`、`sources/`（多出来的子目录会被合规脚本拦下）；
- [ ] `video/resources/` 下：`component-packs/<pack>/<slug>/` 的 `component.json` 与 `card.json` **成对齐全**且可解析、目录名合法（小写 ASCII + 连字符）；`luts/<slug>/` 里有 `.cube`；`sfx/<slug>/` 有 `sound.json` 与一份音频且 `durationInSeconds` 为正；`transitions|effects|templates/<slug>/` 有声明 JSON 且可解析（模板 `ops` 是带 `op` 的对象数组）；`shaders/<slug>/` 有 `shader.glsl`（含 `void main()`、无前缀指令与非确定性输入）与 `spec.json`；`fonts.json` / `models.json` 有 `fonts` / `models` 数组，模型条目 id 合法、有 http(s) `url` 与 64 位小写 `sha256`；
- [ ] `feeds/` 下的每个 `.md` 都有合法 `url`；可选的 `group` / `weight` / 正文
      按第 4 节写法填；
- [ ] 提交进仓库的只有内容本身：没有 `$DSH_HOME` 的索引/缓存产物（见 `.gitignore`）。

**这份清单是可执行的**——在仓库根跑：

```bash
node scripts/check-compliance.mjs      # 零依赖；退出码非 0 就说明有不合规
```

它会检查上面每一条（索引条目的 `title`/`summary`、索引目录里的 `README.md`、
技能名唯一性与 `SKILL.md`、订阅 `url` 合法与重复、`enabled` 取值、
`video/sources/*.json` 的自描述头、`video/resources/` 各类型的结构与成对文件），
并逐条打印"哪个文件、为什么"。推送前跑一次即可。

改完 push，到桌面 **设置 → 内容知识库 → Sync** 一次即可生效。

## 7. 版本与演进

- 本文件头部标 `spec <n>`；字段**只增不改**，破坏性变更才升 n；
- 下游必须容忍未知字段（原样保留）与未知目录（忽略）；
- 新目录若要被索引或同步，必须在桌面侧同步实现，并在本文件登记。

当前：`spec 1`。

修订记录（只记"标准"层面的变化，实现细节记在桌面侧的 Agent Note）：

| 日期 | 变更 |
|---|---|
| 2026-09-11 | `spec 1` 首次发布：目录契约、条目 frontmatter、技能包、`feeds/` 订阅标准 |
| 2026-09-11 | 第 4 节补齐桌面渲染对照（`group` 分组头、`weight` 排序、正文=策展理由）；明确 `type` 种子抓取类型、`tags` 随源保存暂不参与筛选 |
| 2026-09-11 | 第 1 节补齐"哪些文件会被读"三档规则（`_` 前缀与 `README.md` 在各目录的行为不同） |
| 2026-09-11 | 新增第 6 节最小合规清单与配套脚本 `scripts/check-compliance.mjs`（零依赖、可执行） |
| 2026-09-11 | 合规检查接入 CI（`.github/workflows/compliance.yml`）：push / PR 自动跑同一个脚本 |
| 2026-09-11 | 第 4 节 `enabled` 补"本机可覆盖"；订阅的删除改为"允许 + 本机记住 + 可撤销"（见协议 P2.6） |
| 2026-09-11 | 第 4 节新增"`url` 只能是公网地址"：环回/内网/链路本地/`.local` 一律跳过并报告（见协议 P2.7） |
| 2026-09-11 | 第 4 节明确 `type` 是提示而非断言：解析不出条目会退回嗅探 |
| 2026-09-15 | 新增 `video/resources/` 资源包（第 3.2 节）：组件包（渲染半 `component.json` + 库半 `card.json`，id = `kb-<包>-<卡>`）/ LUT / 字库声明，整棵物化到 `$DSH_HOME/video-studio/resources/**` 由视频工作台载入；第 1 / 6 节同步 |
| 2026-09-15 | 新增 `video/` 视频垂类（第 3.1 节）：`video/skills/` 与 `skills/` 同规则部署、`video/sources/*.json` 不部署只索引（`kind: source`）；第 1 / 5 / 6 节同步，合规脚本加三条检查 |
| 2026-09-15 | `video/resources/` 类型补齐（第 3.2 节）：新增 sfx / transitions / effects / shaders / templates / models.json 六类落点，字段契约以 `video/resources/README.md` 为准；第 1 / 6 节同步，合规脚本按类型加结构检查与计数 |
