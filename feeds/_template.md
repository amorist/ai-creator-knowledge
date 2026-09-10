---
title: 展示名（写了就以它为准；不写则先用域名，抓到后用订阅自己的标题）
url: https://example.com/feed
type: auto            # auto | rss | atom | rdf | json
group: 分组名          # 可选：桌面源列表里的分组头
tags: [标签, 标签]      # 可选：随源保存
enabled: true         # false = 停用（保留已抓文章，停止更新）
weight: 10            # 可选：越小越靠前（组内按它排；组的位置取组内最小 weight）
---

为什么订它、要从里面看什么、怎么用——这段会成为这条订阅的备注，
在源行悬停和阅读器标题下方出现。

以 `_` 开头的文件是草稿，不会被订阅（复制本文件改成 `feeds/<slug>.md` 即可）。
