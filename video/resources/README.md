# resources/ — 资源包：把组件（与各类资源）同步进视频工作台

这个目录放**工作台能直接用的资源**（不是技能、不是知识条目）。桌面侧的
Creator Knowledge 插件把整棵 `resources/**` 物化到 `$DSH_HOME/video-studio/resources/**`，
视频工作台启动时**逐类型载入自己的注册表** —— 同步完不必重启（目录被监视）。

## 类型表

| 类型 | 放哪 | 载入到哪 | 现状 |
| --- | --- | --- | --- |
| **component**（MG 卡） | `component-packs/<pack>/<slug>/{component.json, card.json}` | 渲染半进组件注册表、库半进卡片清单（`component_list` / `component_find` / 资源库分类） | ✅ |
| **lut**（调色表） | `luts/<slug>/*.cube` | 用户调色表（内容寻址去重） | ✅ |
| **font**（字库声明） | `fonts.json` | 声明表（用 `videoStudio__font ensure` 按需下载，不搬字节） | ✅ |
| **sfx**（音效） | `sfx/<slug>/sound.json` + 一份音频 | 音效库（叠在随包音效之上，id = `kb-<slug>`） | ✅ |
| **transition**（声明式转场） | `transitions/<slug>/transition.json` | 转场目录（layers + CSS + tweens + 参数） | ✅ |
| **effect**（声明式特效） | `effects/<slug>/effect.json` | 特效目录（同上，另加 `mode` / `group`） | ✅ |
| **shader**（GLSL 片元程序） | `shaders/<slug>/{shader.glsl, spec.json}` | GL 程序注册表 + 一条同 id 的转场 | ✅ |
| **template**（成片模板） | `templates/<slug>/template.json` | 成片模板注册表（canvas + slots + ops） | ✅ |
| **model**（烘焙模型声明） | `models.json` | 烘焙模型的按需下载（并进依赖清单，不搬字节） | ✅ |

```
video/resources/
  README.md                       # 人读的类型表（不物化）
  component-packs/<pack>/<slug>/  # 组件包（两半 JSON）
  luts/<slug>/*.cube              # 调色表
  sfx/<slug>/                     # sound.json + 音频文件
  transitions/<slug>/             # transition.json
  effects/<slug>/                 # effect.json
  shaders/<slug>/                 # shader.glsl + spec.json
  templates/<slug>/               # template.json
  fonts.json                      # 字库声明（id；不搬字节）
  models.json                     # 烘焙模型声明（id + url + sha256；不搬字节）
  _examples/                      # 草稿样例（`_` 前缀：两边都跳过）
```

## 通用规则（每一类都适用）

- **slug = 目录名**，必须是小写 ASCII + 连字符（`^[a-z0-9]+(-[a-z0-9]+)*$`）；
  工作台据此推出**稳定 id `kb-<slug>`**（组件包是 `kb-<pack>-<slug>`）。
  **id 不写在 JSON 里** —— 避免"文件里说的"和"实际注册的"不一致；
- **`_` 前缀的目录/文件是草稿**：物化与载入两边都跳过（`_examples/` 就是）；
- 顶层 `README.md` 不物化（它是人读的说明）；
- 资源根下**不认识的一级条目**会被忽略并记一条告警（向前兼容：新类型在老版本桌面上
  不会炸，但作者能看见"这版不认识它"）；
- **坏一条不影响整次载入**：读不动/形状不对的条目被跳过，并在回执的 warnings 里报出原因（不静默）；
- **知识库不覆盖本机资源**：`kb-` 前缀与 `my:` 分开；LUT 走内容寻址去重；
- **词表以工作台为准**：本文件写的是字段形状；受控取值（卡片枚举等）以工作台为准 ——
  写了词表外的值，工作台载入时拒绝并报原因，而不是在这里再抄一份必然漂移的名单。

## 组件包（component-packs/）：与工程里的规范逐条同形

工程里一张卡是**两半**（`docs/video-studio/13-card-compiler.md` §2），资源包照搬这个形状：

```
component-packs/<pack-id>/
  pack.json                 # 可选：包级 name / summary / version / license / source / author
  <slug>/
    component.json          # 渲染半（与「我的模板」StoredTemplate 同形）
    card.json               # 库半（CardMeta 同形；四个枚举 + useCase + selfChecks 必填）
    README.md               # 可选：人读的卡说明（用 / 别用 / 出处）
    preview.png             # 可选：封面
```

- 组件 id 由目录名定：**`kb-<pack>-<slug>`**（小写 ASCII + 连字符；不写在 JSON 里）。
- `component.json`：`name` / `summary` / `width` / `height` / `durationSeconds` / `fields` / `html` / `timeline`。
  `html` 是 scoped 标记（选择器用 `#{{id}}`、字段用 `{{key}}`），**不许 `<script>`**；`timeline` 是 `tl` 语句。
  与工作台里 `template_save` 的契约**逐字相同** —— 本机试好再存进知识库就行。
- `card.json`：`category` / `role` / `slot` / `quota`（**必须**是工作台受控词表里的取值）、
  `useCase`（什么时候用，写给 agent）、`selfChecks`（做对了长什么样），可选 `tags` / `avoid` /
  `pickWith` / `energy` / `notes` / `source`。
  词表以工作台为准：`videoStudio__component_find` 的参数说明、或
  `videoStudio__skill_read("references/catalog")`。
- `source`（溯源）：`{ repo: house|shotcraft|talkcraft, ref, path, license, method }`。
  **非自研必填 `ref` + `path`**；`talkcraft` 来源不许标 `ported`（那套许可禁商用随包）。

**为什么库半是硬性必填**：`component_find` 就是按 `role` / `slot` / `quota` 筛的 ——
少一个枚举，那张卡在那一维上永远筛不到（agent 会说"没有合适的卡"，而其实有一张正合适的）。
工作台载入时**逐个校验**：不合法就整张不登记，并在启动回执里报出原因。

## 音效（sfx/）

```
sfx/<slug>/
  sound.json      # 声明（下面这些键）
  <audio>         # 音频本体（字节会物化到工作台）
```

一条音效一个目录，`sound.json` 的键：

| 键 | 必填 | 说明 |
| --- | --- | --- |
| `label` | 可选 | 展示名；缺省用 slug |
| `description` | 可选 | 一句话说明 |
| `file` | 可选 | **裸文件名**（不能带路径分隔符）；扩展名限 `.mp3 .wav .m4a .ogg .aac .flac`。目录里**只有一份**音频时可以省略（那份就是它）；有 2 份及以上**必须写** |
| `durationInSeconds` | **必填** | 正数。**硬门槛**：缺了会被跳过并告警 —— 上时间线要它算片段长度，宁可少一条也不要"插进去是 0 秒" |
| `syncPointSeconds` | 可选 | 正数；峰值同步点（峰值要落在声明的拍上） |
| `group` | 可选 | 音效分组 id；随包目录用 `transition-emphasis` / `ui-motion-feedback` / `device-texture` / `reaction-mood`，其余 id 也接受 |
| `aliases` | 可选 | 字符串数组：中文搜索别名 |
| `license` / `source` / `sourceUrl` | 可选 | 溯源与许可 |

- **音频字节会物化**（音效都很小）；工作台用 `video-studio://library/sfx/kb/<slug>` 提供试听；
- 与随包音效同 id 时**随包目录优先**（知识库不覆盖本机资源）；
- 文件名限 `A-Za-z0-9._-`（**纯 ASCII**，≤80 字符）且不能以 `_` 开头 ——
  `_` 是草稿前缀，非 ASCII 文件名在载入时会被判为不合法（跨平台与 URL 都更省事）；
- 两个目录名 kebab 之后同形（如 `paper--whoosh` 与 `paper-whoosh`）会**撞 id**：
  音效库按 id 整表替换，撞车会静默吃掉一条，所以载入回执会告警（不拒绝，但请改名）。

## 声明式转场 / 特效（transitions/、effects/）

```
transitions/<slug>/transition.json
effects/<slug>/effect.json
```

两份 JSON **共用一套形状**（"怎么画"的三件套：静态层 + 静态样式 + 白名单补间）：

| 键 | 必填 | 说明 |
| --- | --- | --- |
| `label` | **必填** | 面板卡片上的名字 |
| `defaultDurationSeconds` | 可选 | 正数；转场缺省 `0.5` |
| `directions` | 可选 | `["left","right","up","down"]` 的子集（小写写法，工作台内部归一成大写） |
| `defaultDirection` | 可选 | 上面之一；**只有与 `directions` 同时给才有意义** |
| `note` | 可选 | 人读说明 |
| `properties` | 可选 | 参数声明数组（面板控件读它）：`{ key, label, kind, default, min?, max?, step?, unit?, note? }`；`kind` ∈ `number` / `percent` / `boolean` / `color` / `enum` |
| `layers` | 可选 | 注入层数组（**最多 8 层**）：`{ id, css, html?, media? }`。`css` 是静态 CSS（**上限 4000 字**，画面就靠它）；`html` 可选内联 HTML（上限 8000 字）；`media: true` = 这一层用同素材的媒体副本 |
| `styles` | 可选 | 静态落在某个目标上的 CSS：`{ on, css }` |
| `tweens` | 可选 | 补间数组（**最多 24 条**）：`{ on, from?, to, at?, duration?, ease? }` |
| `mode` | 可选（**仅 effects**） | `in-clip` / `overlay`（缺省 `overlay`）。**`bake` 不在声明式范围内** |
| `group` | 可选（**仅 effects**） | `effect` / `zoom` |

关键口径：

- `on`（`styles` / `tweens` 的目标）是**层 id**，或三个特殊目标 `self` / `outgoing` / `incoming`；
- `at` 与 `duration` 是**窗口比例**（0..1，缺省 `at: 0` / `duration: 1`）—— 同一份描述在
  0.3s 的甩镜头与 0.6s 的叠化里都成立，不需要重算秒数；
- `from` 省略 = 从当前值补到 `to`；给了就是起止值一起；
- **补间属性白名单**：`opacity` / `x` / `y` / `scale` / `rotation` / `color` / `backgroundColor` /
  `borderRadius` 以及变换家族。**补间里禁止出现**（载入时直接拒绝）：
  `display` / `visibility` / `filter` / `clipPath` / `backdropFilter` / `mask` / `maskImage` / `webkitMaskImage`
  —— 这些属性只能写进**静态 `css`**（静态 CSS 不受白名单约束）；
- `{{key}}` 占位符：`css` / `html` 与补间值里都能引用 `properties` 的参数（写 `{{edge}}` 这样）；
  运行时可被用户参数覆盖；**不认识的占位符原样保留**（一眼看得出拼错）；
- **方向变量**（恒可用，不用声明）：`{{direction}}` = 本次运行的方向（`LEFT` / `RIGHT` / `UP` /
  `DOWN`），`{{directionSign}}` = `LEFT` / `UP` 给 `-1`、`RIGHT` / `DOWN` 给 `1`。
  有了符号，一条补间就能同时表达左右两个方向：`"to": { "x": "{{directionSign}}00%" }`
  （`-100%` / `100%`）。**声明了 `directions` 却一次都没用方向变量**会告警 ——
  那样面板上的方向选择器是空的（四个方向画出来一模一样），载入回执里会说清；
- **声明至少要画出点东西**：没有 `layers` / `styles` / `tweens` 的声明不会生效（载入时告警）。

`mode: "bake"` 的特效（导入期产出新素材）**不在声明式范围内**：那条链路要跑管线、要落盘，
数据给不了，载入时会被拒绝（`in-clip` / `overlay` 之外的取值一律不登记）。

## 着色器（shaders/）

```
shaders/<slug>/
  shader.glsl     # 片元主体（不是完整着色器）
  spec.json       # 声明（label / note / 时长 / 方向）
```

- `shader.glsl` 是**片元主体**，GLSL ES 1.0，**必须自己写 `void main()`**；
  **不许出现** `#version` / `#extension` / `#include` / `uTime` / `gl_FragCoord`
  （编译前缀由工作台补；最后两条是确定性红线：渲染只许依赖 `uProgress`，才能逐帧复现、可 seek）；
  上限 **32 KB**；
- 工作台补给它的头（可以直接用，不要自己再声明）：
  `precision mediump float;`、`varying vec2 vUv`、`uniform sampler2D uFrom`、`uniform sampler2D uTo`、
  `uniform vec4 uFitFrom`、`uniform vec4 uFitTo`、`uniform float uProgress`。
  `uFit*` = `(scaleX, scaleY, offsetX, offsetY)`，把画布坐标 `vUv` 换算到这一路源的纹理坐标
  （contain 口径；画面外给黑）。**必须写 `gl_FragColor`**；
- `spec.json`：`label`（可选，缺省用 slug）、`note`（可选）、`defaultDurationSeconds`（可选，正数）、
  `directions` / `defaultDirection`（可选，同转场的口径）；
- 一条 shader 还会**自动登记一条同 id 的数据型转场**（`kb-<slug>`）—— 画面由 GL 路径负责，
  所以它在转场目录里可见、可加。

## 成片模板（templates/）

```
templates/<slug>/template.json
```

| 键 | 必填 | 说明 |
| --- | --- | --- |
| `name` / `summary` / `structure` | **必填** | 三段字符串：面板卡片与 agent 都读它们 |
| `whenToUse` / `notFor` | 可选 | 什么时候用 / 什么时候别用 |
| `canvas` | **必填** | `{ width, height, fps }`，三个都是正数 |
| `durationSeconds` | **必填** | 正数 |
| `slots` | 可选 | 槽位数组（**最多 40 个**）：`{ key, label, hint, kind }`；`kind` ∈ `text` / `media`；可选 `fallback`，media 槽还可选 `asset` ∈ `video` / `image` / `any`。**key 必须唯一** |
| `tokens` | 可选 | 样式令牌对象，如 `{ "accent": "#E0714A" }` |
| `fonts` | 可选 | 字体对象，如 `{ "heading": "lib:zcool-kuaile" }` |
| `sfx` | 可选 | 音效钉帧：`{ soundId, atSeconds }`（都必填，`atSeconds >= 0`），套用模板时解析成真实音频片段 |
| `ops` | **必填** | TimelineOp 列表（**1..400 条**）；任何字符串字段都可以写 `{{slotKey}}` |

- **`setCanvas` 由工作台自动注入**（`build()` 会把模板声明的画幅放在 ops 最前面）：
  作者**不要自己写** `setCanvas`；
- **op 白名单**（只允许"造内容"的那批）：`insertAsset` / `insertSolid` / `insertMotion` /
  `insertAudio` / `insertCaption` / `applyCaptionStyle` / `addTransition` / `addEffect` /
  `applyTokens` / `setItemProperties` / `setItemFields` / `setItemAsset` / `setKeyframe` /
  `setProjectFonts` / `setSubtitles`；
- **禁止**：`applyProjectTemplate`（模板套模板会把作用域与撤销语义搅乱），以及一切删除类 op
  （`deleteRange` / `removeEffect` / `removeKeyframe` / `clearKeyframes` / `removeMarker` /
  `deleteTrack` 这类）—— 模板是"造一支片"，不是"删用户的东西"；
- `{{slotKey}}` 只做**字面量替换**（字符串字段里，递归走对象与数组）；未知占位符原样保留。

## 模型声明（models.json）

一份 JSON（与 `fonts.json` 同一路数；**字节不进桌面、也不由知识库物化**）：

```json
{
  "models": [
    {
      "id": "example-matte-lite",
      "label": "人像抠像 · 轻量档",
      "kind": "model",
      "capabilities": ["matte"],
      "url": "https://example.com/models/example-matte-lite.onnx",
      "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      "bytes": 12944318,
      "license": "Apache-2.0",
      "source": "https://example.com/example-matte"
    }
  ]
}
```

| 键 | 必填 | 说明 |
| --- | --- | --- |
| `id` | **必填** | `^[a-z0-9][a-z0-9-]{0,63}$`；也是它在磁盘上的下载名 |
| `label` | 可选 | 展示名；缺省用 id |
| `note` | 可选 | 说明 |
| `kind` | 可选 | 只能是 `model`（或省略）；**`tool` 会被拒绝** —— 本地工具是用户自己装的，不代下 |
| `url` | **必填** | http(s) 下载源：没有下载源的模型登记了也只能显示"未配置" |
| `sha256` | **必填** | 64 位小写十六进制：下载后要校验，没有校验值的权重不敢装 |
| `bytes` | 可选 | 正数；设置页显示为约略体积 |
| `capabilities` | 可选 | 能力 id 数组；**只收工作台能力目录里有的 id**（拼错/未知的会**忽略并告警**；一条能力都没有的权重也能登记，只是不会让任何管线变可用） |
| `license` / `source` | 可选 | 许可与出处 |

- **不能与工作台内置依赖同 id**：内置那份清单是"核过实物哈希"的，同 id 会被**拒绝**
  （知识库不该悄悄换掉它的 url / sha256）。内置 id 见工作台的
  `src/kernel/bake/models.ts` 的 `BAKE_DEPENDENCIES`（`ffmpeg` / `whisper-cpp` /
  `whisper-ggml-*` / `mediapipe-face-landmarker` / `modnet-matting` / `swin2sr-x2` /
  `rnnoise-model`）；
- `capabilities` 的可用 id 以工作台能力目录为准（`BAKE_CAPABILITIES`）；本文件不抄名单。

## 看一眼示例

[`_examples/`](_examples/) 是**草稿格式的样例**（`_` 前缀，不会被物化/载入）：

```
_examples/
  component-packs/demo-pack/…        # 一张署名条（两半 JSON）
  luts/identity/grade.cube           # 一份单位矩阵 LUT
  fonts.json                         # 字库声明
  sfx/whoosh-demo/sound.json + whoosh.wav
  transitions/soft-wipe/transition.json
  effects/soft-focus-in/effect.json
  shaders/luma-dissolve/{shader.glsl, spec.json}
  templates/three-card/template.json
  models.json                        # 复制到资源根的 models.json 才生效
```

复制一份、去掉开头的 `_examples/`（把里面的类型目录提到 `video/resources/` 下）就是真的资源。
**`models.json` 与 `fonts.json` 例外**：它们必须是**资源根下的同名文件**才被读到
（`video/resources/models.json` / `video/resources/fonts.json`），所以草稿放在
`_examples/models.json`，**复制到资源根**（去掉 `_examples/` 那一段路径）才生效。

## 与本仓库其它目录的关系

- **技能**（`video/skills/`）写"怎么做"；**资源包**给"用什么"（组件本体、色表、字体、音效、转场…）。
- 组件包引用组件时按 **id** 引用（`kb-<pack>-<slug>`），不要抄它的字段表。
- 许可证与出处照 [AGENTS.md](../AGENTS.md) 的 M1：外部素材/代码必须能回到来源。
