# feeds/ —— 订阅源

一个订阅源 = 一个 markdown 文件。文件名是这条订阅的稳定 id（小写 ascii + 连字符），
正文写"为什么订它、要从里面看什么"。

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

完整契约（归一化、更新、停用、多仓库合并、桌面导入语义）见
[../docs/subscription-protocol.md](../docs/subscription-protocol.md)。
