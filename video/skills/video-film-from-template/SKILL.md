---
name: video-film-from-template
description: 用视频工作台的成片模板做一支完整视频。当用户说"做一支口播宣传片 / 产品发布 / 数据故事 / 图文快剪 / 访谈切片"、"有没有现成的模板"、"套个模板"，或拿一堆素材问"这能做成什么片子"时使用。它把"挑模板 → 收槽位 → 备素材 → 套用 → 精修 → 验收 → 交付"固定成流程，并规定哪些值取自知识库的 video/sources。
---

# 从成片模板做一支片

## 何时用

- 用户要做一整支片（不是剪已有片段），而且形态落在工作台现成的模板里；
- 用户有一堆素材 / 一段稿子，问"能做成什么"——先挑模板再倒推要什么素材；
- 通用内容技能（`ai-content-playbook`）已经把选题与文案定下来，要把它变成片子时。

## 输入（开工前先取齐）

1. **知识库上下文**：`knowledge__recall` 查这个选题相关的经验与素材（先查再写，同 `ai-content-playbook` 的 M0）；
2. **账号约束**：`profile/` 下的画像（受众、风格、禁区）——它是唯一的约束来源；
3. **视觉令牌**：`video/sources/account-visual.json`（kind `video-source/account-visual`）——
   我们的色号 / 字库 / 圆角 / 材质 / 字幕样式；**不要凭记忆写色号**；
4. **平台取舍**：`video/sources/platform-specs.json`（kind `video-source/platform-specs`）——
   发哪儿、用什么预设、我们自己的时长上限；
5. **拍法**：`video/sources/shot-recipes.json`（kind `video-source/shot-recipes`）——
   选题类型 → 用哪支模板、槽位取值有什么约定。

> 取源的姿势：`knowledge__recall` 命中后回执里带本地 `File:` 路径，用文件工具读原文。
> **值以本仓库为准；字段名以工作台为准**——`accent` / `presetId` / 模板 id / 槽位键这些名字
> 一律去工作台查（`videoStudio__skill_read("references/catalog")`、`videoStudio__template_film`），
> 两边对不上时以工作台为准。

## 步骤

1. **挑模板**：`videoStudio__template_film` 列出成片模板（每支回执带**技能名** `video-template-<slug>`）。
   拿不准就先 `skill` 按名加载候选那一支，读它的「什么时候用 / 别用」再定。
   **选错模板比选不到更贵**（结构不对要整支重来）。
2. **定项目**：`videoStudio__project_create` 新建一支；用户说"加到这条片子里"时才复用当前项目
   （套用会按模板重设画布，混进已有工作要谨慎）。
3. **收槽位**：读那一支技能正文的**槽位表**，逐项要：
   - 文案槽从选题 / 稿子 / 画像里出，缺的标「待补」，**不拿默认值冒充用户的文案**；
   - 素材槽先 `videoStudio__asset({action:"list"})` 看池子里有什么，不够就导入（`paths` 绝对路径）
     或从素材源搜（`media_search`）后导入；**回执里的 id 才是 assetId**。
4. **套用**：`videoStudio__timeline_apply` 发一条
   `{op:"applyProjectTemplate", id, templateId, values}`，`values` 的键就是槽位 key。
   槽位可以只给一部分（其余走模板默认值）——**一个都不给也能出一版看观感**。
5. **换皮**：把 `account-visual.json` 的 `tokens` 喂给 `{op:"applyTokens", tokens:{…}}`，
   字幕样式喂 `{op:"applyCaptionStyle", …}`。条目级调整永远赢过模板皮。
6. **精修**：改文案 `videoStudio__clip_update`；换素材用属性面板或 `setItemAsset`；
   真人口播对齐字幕走 `videoStudio__transcribe`（start → status → apply）；
   槽位对不上 / 要加段换卡 → 走"逐段装配"（读 `scenarios/motion-graphics` 与 `references/props`）。
7. **验收**：`videoStudio__check`（可指名平台预设）；把 `占位 · X` 的空槽逐条报给用户 ——
   要么填了、要么说清哪几个还空着。
8. **交付**：成片在**面板里点「导出」**（`videoStudio__export` 只给规格与越界检查）；
   字幕另存 `videoStudio__export_subtitles`。

## 输出

- 一支可编辑的成片项目（时间线在用户的工作台里，撤销栈可见）；
- 交付回执：用了哪支模板、填了几个槽、哪几个还空（**不许只说"已生成"**）。

## 硬约束

- 不编造型号 / 色号 / 模板 id / 槽位键 —— 一律从工具回执与源文件里读；
- 不用"赋能 / 闭环 / 发力 / 抓手"这类词；
- 平台的硬约束（时长上限、安全区）以工作台预设为准，本仓库的 `platform-specs.json` 只写**我们的取舍**；
- 空槽必须在交付前显式说明，不做"看起来完整"的假交付。

## 反例

- **凭记忆写模板 id 或槽位键**：模板加了字段而你没读技能，值会被默认值悄悄吃掉；
- **素材槽填路径**：`values` 只认 assetId，路径要先 import；
- **先去调色号再挑模板**：模板自带一套皮，先挑模板再按 `account-visual` 覆盖，顺序反了要返工；
- **把选题写死进模板**：模板是结构，文案是内容——同一支模板换稿子就是新片子。
