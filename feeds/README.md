# feeds/ —— 订阅源

一个订阅源 = 一个 markdown 文件。文件名是这条订阅的稳定 id（小写 ascii + 连字符），
正文写"为什么订它、要从里面看什么"。

**想加一条？** 复制 [`_template.md`](_template.md) 改成 `feeds/<slug>.md` 填好即可
（`_` 开头的文件是草稿，不会被订阅）。

```markdown
---
title: 晚点 LatePost
url: https://example.com/feed
type: auto          # auto | rss | atom | rdf | json
group: 中文科技      # 桌面源列表里的分组
tags: [科技, 商业]
enabled: true       # false = 停用（保留已抓文章，停止更新）
weight: 10          # 同组排序，越小越靠前
---

正文 = 你的策展理由，随源保存为备注。
```

规则：

- `url` 必填且必须是 `http(s)://`；**它是订阅的身份键**，换 URL = 换一条订阅；
- 以 `_` 开头的文件、以及本 `README.md` 会被忽略（草稿/说明）；
- 重命名文件（改 slug）会被当成"删旧建新"，历史文章保留、新源重新抓取；
- 三条以上同类源时用 `group` 分类，别把分组写进标题。

这些字段在桌面上**真的生效**（不是备注）：

| 字段 | 桌面上的效果 |
|---|---|
| `group` | 源列表里的分组头 |
| `weight` | 排序权重，越小越靠前（组内按它排；组的位置取组内最小 weight） |
| 正文 | 这条订阅的策展理由：源行悬停可见，打开该源的文章时显示在标题下方 |
| `type` | 告诉抓取器是哪种订阅；`auto` = 抓取时嗅探 |
| `title` | 你策展的展示名（写就以它为准） |
| `enabled: false` | 停用：留文章、停止更新（任何刷新都不抓） |
| `tags` | 随源保存在本机（当前面板不按它筛选） |

完整契约（归一化、更新、停用、多仓库合并、桌面导入语义）见
[../docs/subscription-protocol.md](../docs/subscription-protocol.md)。
