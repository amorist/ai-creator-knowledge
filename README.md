# AI 内容创作知识库

> 一个 **Agent-first** 的 AI 内容创作知识库标准：**技能、模板、经验、素材、画像、订阅源**
> 收进同一个 git 仓库，由 AI 读写维护，由桌面应用（dsh-desktop）同步消费。

这不是某一个垂类的知识库，而是**一套仓库标准 + 一份订阅协议**。把它当作模板：
fork / clone 成你自己的 `<你的垂类>-knowledge`，填进你的技能与经验，push 回 GitHub，
桌面上的「内容知识库」与「灵感」两个面板就会自动拿到你的技能、经验、以及**订阅源列表**。

## 文档地图

| 想知道什么 | 看哪份 |
|---|---|
| 我该往哪个目录写、frontmatter 每个字段什么意思 | [SPEC.md](SPEC.md)（**标准本身**） |
| 从 0 到跑通的完整步骤、每种内容怎么写、出问题怎么办 | [docs/guide.md](docs/guide.md) |
| AI 读写本库的规则（给 agent 看） | [AGENTS.md](AGENTS.md) |
| 订阅链接怎么和桌面同步（**规范性契约**，改标准要改它） | [docs/subscription-protocol.md](docs/subscription-protocol.md) |
| 一个内容生产方法论示例 | [docs/AI内容生产流水线.md](docs/AI内容生产流水线.md) |

---

## 它解决什么问题

用 AI 做内容的人，最常掉的三件事：

1. **方法不沉淀。** 拆过的爆款、踩过的坑、验证过的 prompt，散在对话记录和收藏夹里，
   下一个选题重头再来一遍。
2. **素材找不到。** 手上明明有选题、案例、金句，但要写的时候翻不到，只能凭记忆。
3. **信息源是另一套系统。** 关注的 Newsletter / 博客 / 社区，躺在阅读器或浏览器书签里，
   和你的知识库、和 AI 完全不连通——采集与创作之间断了一截。

本仓库把这三件事收进**一个 git 仓库**：

| 层 | 目录 | 谁维护 | 桌面侧怎么用 |
|---|---|---|---|
| 技能 | `skills/` | AI 写、你审 | 同步成 agent skill，对话里直接可用 |
| 模板 | `templates/` | 你定 | 同上（模板也是可调用的 skill） |
| 经验 | `learnings/` | AI 编译、你确认 | 进 BM25 索引，`knowledge__recall` 可召回 |
| 素材 | `assets/` | AI 整理 | 同上 |
| 长文 | `docs/` | 人写 | 同上 |
| 画像 | `profile/` | **你拥有主权** | 同上（AI 只读，不替你编造） |
| **订阅源** | **`feeds/`** | 你定 | **灵感面板自动订阅并更新** |

一句话：**知识库是内容的"上游"，订阅源是知识库的"进水口"，两者在同一个仓库里，一起版本化。**

---

## 目录结构

```
.
├── SPEC.md                          # 仓库标准：目录 / frontmatter / 命名（先读这个）
├── AGENTS.md                        # Agent 契约：AI 如何读写本库
├── README.md / README.en.md          # 人读的说明
├── docs/guide.md                    # 操作手册：从 0 到跑通 + 排错
├── feeds/                           # 订阅源：一个源一个 md，桌面「灵感」自动订阅
│   ├── README.md                    # feeds 写法说明
│   ├── _template.md                 # 复制它开始（`_` 开头 = 草稿，不会被订阅）
│   └── <slug>.md
├── skills/                          # Agent 技能：skills/<name>/SKILL.md
│   └── <skill-name>/SKILL.md
├── templates/                       # 参考模板：templates/<name>/SKILL.md
│   └── <template-name>/SKILL.md
├── learnings/                       # 经验沉淀（拆解 / 方法论 / 复盘）——进索引
├── assets/                          # 素材清单（选题库 / 案例 / 金句 / 灵感）——进索引
├── docs/                            # 方法论、平台规则、长文——进索引
└── profile/                         # 账号 / 团队 / 个人画像——进索引
```

`learnings/` `assets/` `docs/` `profile/` 里的**每一个 `.md` 都是一条可召回的知识条目**，
靠 frontmatter 说话；`skills/` `templates/` 里的每一个 `<name>/SKILL.md` 会**原样平铺**
成桌面上的一个 agent skill。字段规范见 [SPEC.md](SPEC.md)。

---

## 快速开始

```bash
# 1. 换成你自己的仓库
git clone git@github.com:<you>/ai-creator-knowledge.git my-knowledge
cd my-knowledge

# 2. 先读标准与契约
cat SPEC.md          # 目录、frontmatter、命名规则
cat AGENTS.md        # AI 读写本库的铁律

# 3. 改成你自己的：画像 → 技能 → 订阅源
$EDITOR profile/账号画像.md
$EDITOR feeds/*.md

# 4. 推送
git add -A && git commit -m "init my knowledge base" && git push
```

在桌面上（dsh-desktop）：

```
设置 → 内容知识库 → 同步源配置 → 新增源（name/url 填你刚推的仓库）→ Sync
```

同步之后：

- `skills/` `templates/` 里的技能进入 agent 技能目录，对话里直接可用；
- `learnings/` `assets/` `docs/` `profile/` 进入本地索引，`knowledge__recall` 可检索；
- `feeds/` 里的订阅源被「灵感」面板读出并**自动订阅 + 拉取更新**（见
  [订阅协议](docs/subscription-protocol.md)）。

---

## 订阅源（`feeds/`）

一个订阅源 = 一个 markdown 文件（复制 [`feeds/_template.md`](feeds/_template.md) 开始），
正文写"为什么订它、要从里面看什么"：

```markdown
---
title: Import AI
url: https://importai.substack.com/feed
type: auto          # auto | rss | atom | rdf | json
group: AI 前沿      # 桌面源列表里的分组头
tags: [AI, 研究]     # 随源保存（当前不参与筛选）
weight: 10          # 越小越靠前；组的位置取组内最小 weight
enabled: true       # false = 停用（留文章、停止更新）
---

每周 AI 研究综述。看模型能力边界与新论文的一句话结论，不追细节。
```

push 上去，到桌面 **设置 → 内容知识库 → Sync** 一次即可。**订阅链接跟着知识库一起
版本化**：谁 clone 了这个仓库，谁就拿到同一套信息源。

桌面会这样用它：

- `group` 决定源列表里的**分组头**，`weight` 决定顺序（组内升序；组的位置取组内最小 weight）；
- 正文成为这条订阅的**策展理由**——源行悬停可见，打开该源的文章时显示在标题下方；
- 新增的源在点「从知识库同步」时会被**顺手抓一次**，不用再点「刷新全部」；
- 仓库**撤回**一条声明 → 该源标「库已移除」：**文章留着、停止更新**；
  写 `enabled: false` → 停用（同样留文章，任何刷新都不抓）；
- **整个知识库删掉** → 已订阅的源**原样保留**，从此是你自己的源，随时可删。

完整规则（字段、匹配与更新语义、停用与移除）见
[docs/subscription-protocol.md](docs/subscription-protocol.md)，操作与排错见
[docs/guide.md](docs/guide.md)。

---

## 设计原则

1. **Markdown + frontmatter 是唯一格式。** 无数据库、无私有格式，任何编辑器、
   任何 agent、任何脚本都能读写；git diff 就是人类可读的变更记录。
2. **一个目录一个语义。** 技能是技能、经验是经验、订阅源是订阅源，不混放。
3. **人拥有品味，AI 拥有整理。** `profile/`、选题判断、`refs` 类内容由你主笔，
   AI 只做结构化、提问与提醒。
4. **上游只读。** 桌面应用永远不会写回本仓库——同步是单向拉取，推送永远由你发起。
5. **可组合。** 本仓库可以作为一个「源」和别的知识库仓库并置（多源 scope），
   订阅源同理：多个仓库的 `feeds/` 会合并成一棵订阅树。
6. **说到的字段一定生效。** 规范里承诺的每个字段都有明确的桌面行为；
   还没被用到的（如 `tags`）会**如实标注**，而不是假装它有用。

## 合规定义

"符合本标准"是可检查的——见 [SPEC.md](SPEC.md) 第 6 节的**最小合规清单**：
每个索引条目有 `title` + `summary`、技能带 `SKILL.md`、订阅有合法 `url`、
仓库里没有桌面侧的索引产物。

## License

内容与结构规范（SPEC / 协议文档）建议以 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
共享；你自己的内容条目版权归你。本仓库模板默认不作 License 声明，按需添加。
