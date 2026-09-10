# AI 内容创作知识库

> 一个 **Agent-first** 的 AI 内容创作知识库标准：**技能、模板、经验、素材、画像、订阅源**
> 收进同一个 git 仓库，由 AI 读写维护，由桌面应用（dsh-desktop）同步消费。

这不是某一个垂类的知识库，而是**一套仓库标准 + 一份订阅协议**。把它当作模板：
fork / clone 成你自己的 `<你的垂类>-knowledge`，填进你的技能与经验，push 回 GitHub，
桌面上的「内容知识库」与「灵感」两个面板就会自动拿到你的技能、经验、以及**订阅源列表**。

- 仓库结构规范：[SPEC.md](SPEC.md)
- Agent 契约（AI 怎么读写本库）：[AGENTS.md](AGENTS.md)
- **订阅源同步协议（本仓库 ↔ 桌面）**：[docs/subscription-protocol.md](docs/subscription-protocol.md)

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
├── feeds/                           # 订阅源：一个源一个 md，桌面「灵感」自动订阅
│   ├── README.md                    # feeds 写法说明
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

一个订阅源 = 一个 markdown 文件，正文写"为什么订它、要从里面看什么"：

```markdown
---
title: Import AI
url: https://importai.substack.com/feed
type: auto          # auto | rss | atom | rdf | json
group: AI 前沿
tags: [AI, 研究]
enabled: true
---

每周 AI 研究综述。看模型能力边界与新论文的一句话结论，不追细节。
```

把这行文件 push 上去，桌面「灵感」下一次刷新就会订阅它并拉到最新文章。
**订阅链接跟着知识库一起版本化**：谁 clone 了这个仓库，谁就拿到同一套信息源。

完整规则（字段、匹配与更新语义、停用与移除）见
[docs/subscription-protocol.md](docs/subscription-protocol.md)。

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

## License

内容与结构规范（SPEC / 协议文档）建议以 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
共享；你自己的内容条目版权归你。本仓库模板默认不作 License 声明，按需添加。
