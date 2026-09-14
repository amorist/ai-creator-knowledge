# video/ — 视频垂类：技能、JSON 源、资源包

这个目录放**专门用于生成视频**的三类东西，类型由**形状**判定（不靠前缀猜）：

| 你想加的 | 放哪 | 形态 | 桌面怎么消费 |
| --- | --- | --- | --- |
| 一支视频的**做法**：什么时候用哪支模板、槽位怎么收、怎么验收 | `video/skills/<name>/SKILL.md` | Markdown + frontmatter（`name` / `description`） | **平铺部署**成真技能（`$DSH_HOME/skills/<name>/`）—— 模型技能目录可见、`skill` 工具按名加载、用户可 `/` 调用 |
| 一组**值**：账号视觉令牌、平台规格、分镜配方、素材清单 | `video/sources/<id>.json` | JSON + 自描述头（`kind` / `schema` / `title` / `summary` / `usage`） | **不部署**；进知识库索引（`kind: source`）→ `knowledge__recall` 命中 → agent 用文件工具读原文 |
| 一件**能直接用的东西**：组件卡 / 调色表 / 字库 / 音效 / 转场 / 特效 / 着色器 / 成片模板 / 模型声明 | `video/resources/**` | 组件包是**两半 JSON**（`component.json` + `card.json`），其余按类型（`sfx/` `transitions/` `effects/` `shaders/` `templates/` + `fonts.json` `models.json`） | **整棵物化进视频工作台**并载入它的注册表（组件直接能在编辑器里插、能 `component_find` 筛到）|

## 三个子目录各管什么

- **技能**是给 agent 的**流程**（"先干什么、再干什么、怎么验收"），它必须能被模型直接加载；
- **JSON 源**是给 agent / 工作台的**数据**（色号、平台取舍、分镜配方），它是输入而不是流程 ——
  把它发成一个"技能"会让模型在目录里看到一堆无法执行的数据；
- **资源包**是**能直接用的东西**（组件卡、调色表、字库声明、音效、转场、特效、着色器、成片模板、模型声明）：它不是流程也不是值，
  而是"设备"本身 —— 载入进工作台的注册表才算数；
- 判据是硬的：**有 `SKILL.md` 的目录才是技能**，所以 `video/sources/` 与 `video/resources/` 里的东西
  永远不会被当成技能发出去；反过来，`video/skills/` 里的技能也不会被当成数据源。

## JSON 源的头（必填）

```json
{
  "kind": "video-source/<name>",
  "schema": 1,
  "title": "账号视觉令牌",
  "summary": "一句话说清这份源给什么",
  "usage": "什么时候读它、读到之后怎么用（写给 agent 看）",
  "tags": ["视频", "视觉"],
  "domain": ["短视频"],
  "owner": "人",
  "updated": "2026-09-15"
}
```

- 复制 [`sources/_template.json`](sources/_template.json) 改一份；`_` 前缀 = 草稿，桌面跳过；
- 字段可以自由扩展（下游容忍未知字段）；`usage` 写清"怎么用"——它是 agent 读到这份源时唯一的使用说明；
- **值以本仓库为准，字段名以视频工作台为准**：色号 / 平台 / 配方的取舍写在这里，
  而 `accent` / `presetId` / 模板 id / 槽位键这些**名字**以工作台为准
  （工作台侧查：`videoStudio__skill_read("references/catalog")`、`videoStudio__template_film`）。

## 资源包（`video/resources/`）

它和技能是**两种东西**：技能写"怎么做"，资源包给"用什么"。
格式、字段与词表**以视频工作台为准**，先读 [`resources/README.md`](resources/README.md)；
复制 [`resources/_examples/`](resources/_examples/) 起手（`_` 前缀是草稿，两边都跳过）。

## 与 `skills/`、`templates/` 的关系

- 通用内容技能（选题、口播稿、小红书笔记…）仍放顶层 `skills/`；
- `video/` 是**视频垂类**的家：这里的技能与 `skills/` 同规则部署，只是位置说明它是干什么的；
- 视频工作台里那 11 支**成片模板**各自有一条技能（`video-template-<slug>`，由工作台按模板注册表生成、
  不进本仓库）。本目录的技能要引用它们时**按名字引用**，不要抄模板的槽位表 ——
  槽位 / 时间表 / 组件清单的权威永远是 `videoStudio__template_film` 与那一支的技能。
