/**
 * 合规自检：把 SPEC 第 6 节的"最小合规清单"变成可执行的检查。
 *
 *   node scripts/check-compliance.mjs
 *
 * 退出码 0 = 全部合规；1 = 有违规（逐条打印文件与原因）。
 * 零依赖：只用 Node 内置模块——fork 之后不该为了检查再装一套工具链。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = process.cwd()
const INDEXED_DIRS = ['learnings', 'assets', 'docs', 'profile']
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'out', '.obsidian'])

/** 逐层收集文件与目录（跳过 .git/node_modules 等）。 */
function walk(dir, out = { files: [], dirs: [] }) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      out.dirs.push(full)
      walk(full, out)
    } else {
      out.files.push(full)
    }
  }
  return out
}

/** 解析文件头部的 frontmatter（只认扁平 `key: value`，够标准用）。 */
function frontmatter(file) {
  const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end === -1) return null
  const fields = {}
  for (const line of text.slice(4, end).split('\n')) {
    const at = line.indexOf(':')
    if (at <= 0) continue
    fields[line.slice(0, at).trim()] = line.slice(at + 1).trim()
  }
  return fields
}

const violations = []
const note = (file, message) => violations.push(`${relative(ROOT, file)}：${message}`)
const { files } = walk(ROOT)

// 1. 索引目录：每个 .md 都是条目 → 必须 title + summary；不许有 README.md
for (const dir of INDEXED_DIRS) {
  for (const file of files) {
    const rel = relative(ROOT, file)
    if (!rel.startsWith(`${dir}/`) || !file.endsWith('.md')) continue
    if (file.split('/').pop().toLowerCase() === 'readme.md') {
      note(file, '索引目录里不能放 README.md（它会被当成条目索引）')
      continue
    }
    const fields = frontmatter(file)
    if (fields === null) { note(file, '缺 frontmatter（至少 title + summary）'); continue }
    if (!fields.title) note(file, 'frontmatter 缺 title')
    if (!fields.summary) note(file, 'frontmatter 缺 summary')
  }
}

// 2. 技能包：skills/<name>/SKILL.md、templates/<name>/SKILL.md 与 video/skills/<name>/SKILL.md，
//    三条部署到同一个平铺命名空间，所以名字必须**跨目录**唯一。
const skillNames = new Map()
for (const sub of ['skills', 'templates', 'video/skills']) {
  const root = join(ROOT, sub)
  let children = []
  try { children = readdirSync(root) } catch { continue }
  for (const name of children) {
    const dir = join(root, name)
    if (!statSync(dir).isDirectory()) continue
    const skill = join(dir, 'SKILL.md')
    if (!files.includes(skill)) { note(skill, `缺 SKILL.md（${sub}/${name}）`); continue }
    const fields = frontmatter(skill)
    if (fields === null) { note(skill, '缺 frontmatter（至少 name + description）'); continue }
    if (!fields.name) note(skill, 'frontmatter 缺 name')
    if (!fields.description || fields.description.length < 20) {
      note(skill, 'description 太短——它是 agent 选中技能的唯一依据')
    }
    const seen = skillNames.get(fields.name)
    if (seen !== undefined) note(skill, `技能名 "${fields.name}" 与 ${seen} 冲突（部署是平铺的，必须唯一）`)
    else skillNames.set(fields.name, relative(ROOT, skill))
  }
}

// 3. 订阅源：url 必填、必须 http(s)、归一化后不许重复
const seenUrls = new Map()
const feedsDir = join(ROOT, 'feeds')
let feedFiles = []
try { feedFiles = readdirSync(feedsDir) } catch { /* 允许没有 feeds/ */ }
for (const name of feedFiles) {
  if (!name.endsWith('.md') || name.startsWith('_') || name.toLowerCase() === 'readme.md') continue
  const file = join(feedsDir, name)
  const fields = frontmatter(file)
  if (fields === null || !fields.url) { note(file, '缺 url'); continue }
  const url = fields.url.trim()
  if (!/^https?:\/\//i.test(url)) { note(file, `url 不是 http(s)：${url}`); continue }
  let key
  try {
    const parsed = new URL(url)
    for (const param of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref_src$|spm$)/.test(param.toLowerCase())) parsed.searchParams.delete(param)
    }
    parsed.searchParams.sort()
    key = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}${parsed.search}`
  } catch { note(file, `url 解析失败：${url}`); continue }
  if (seenUrls.has(key)) note(file, `与 ${seenUrls.get(key)} 是同一个订阅（归一化后 ${key}）`)
  else seenUrls.set(key, relative(ROOT, file))
  if (fields.enabled !== undefined && fields.enabled !== 'true' && fields.enabled !== 'false') {
    note(file, `enabled 只能是 true/false：${fields.enabled}`)
  }
}

// 4. 视频垂类（video/）：技能走上面第 2 条；这里只盯 JSON 源与顶层形状。
//
// 两分的判据是**形状**：`video/skills/**/SKILL.md` 是技能（会部署），
// `video/sources/*.json` 是 JSON 源（不部署、只索引）。所以这里既要校验源的自描述头，
// 也要拦住"放错地方"——把 JSON 放进 video/skills/ 或把 SKILL.md 放进 video/sources/
// 都不会报错、只会静默不生效（技能不部署 / 源不索引），那是最难查的一类错。
let sourceCount = 0
const videoDir = join(ROOT, 'video')
if (existsSync(videoDir)) {
  const allowedTop = new Set(['README.md', 'skills', 'sources', 'resources'])
  for (const name of readdirSync(videoDir)) {
    if (!allowedTop.has(name)) {
      note(join(videoDir, name), `video/ 下只允许 README.md / skills/ / sources/ / resources/（多的子目录没有语义）`)
    }
  }
  const sourcesDir = join(videoDir, 'sources')
  let sourceFiles = []
  try { sourceFiles = readdirSync(sourcesDir) } catch { /* 允许没有 sources/ */ }
  for (const name of sourceFiles) {
    if (name.startsWith('_')) continue // 草稿（`_template.json` 就是它）
    const file = join(sourcesDir, name)
    if (!statSync(file).isFile()) { note(file, 'video/sources/ 下不许有子目录'); continue }
    if (!name.toLowerCase().endsWith('.json')) {
      note(file, 'video/sources/ 只放 JSON 源（技能请放 video/skills/<name>/SKILL.md）')
      continue
    }
    let data
    try {
      data = JSON.parse(readFileSync(file, 'utf8'))
    } catch (error) {
      note(file, `JSON 解析失败：${error instanceof Error ? error.message : String(error)}`)
      continue
    }
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      note(file, '顶层必须是一个 JSON 对象')
      continue
    }
    if (typeof data.kind !== 'string' || !/^video-source\/[a-z0-9-]+$/.test(data.kind)) {
      note(file, 'kind 必须形如 video-source/<name>（小写 ASCII + 连字符）')
    }
    if (!Number.isInteger(data.schema) || data.schema < 1) note(file, 'schema 必须是正整数（结构版本）')
    for (const field of ['title', 'summary', 'usage']) {
      if (typeof data[field] !== 'string' || data[field].trim() === '') note(file, `缺 ${field}（必填，写给 agent 看）`)
    }
    sourceCount += 1
  }
  // 反向：video/skills 下的技能目录若带非 .md 的文件不拦（技能可以有资源），
  // 但把 SKILL.md 写进 video/sources 是明确的错。
  for (const name of sourceFiles) {
    if (existsSync(join(sourcesDir, name, 'SKILL.md'))) note(join(sourcesDir, name), '技能要放 video/skills/，不是 video/sources/')
  }
}

// 5. 资源包（`resources/`）：结构与成对文件。
//
// 这一节的判据**只到结构**：文件是否齐全、能不能解析、目录名是否合法、shader 的确定性红线。
// 词表级校验（`category` / `role` / `slot` / `quota` 必须落在工作台受控词表里、溯源纪律、
// `component.json` 不许 `<script>`、`capabilities` 的能力 id、模板 op 的字段完整性）
// **故意留给视频工作台在载入时做** —— 那边是词表的唯一真源，在这里抄一份必然漂。
// 工作台的做法是：不合法就整条不登记 + 启动回执里报出原因（不静默）。
let resourcePacks = 0
let resourceCards = 0
let resourceLuts = 0
let resourceSfx = 0
let resourceTransitions = 0
let resourceEffects = 0
let resourceTemplates = 0
let resourceShaders = 0
let resourceModels = 0
const resourcesDir = join(ROOT, 'video', 'resources')
if (existsSync(resourcesDir)) {
  /** slug = 目录名，小写 ASCII + 连字符（它进资源 id `kb-<slug>`）。 */
  const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
  /** 音效库只认这几种扩展名（与工作台同一份口径）。 */
  const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac']
  /** 着色器里不许出现的写法：前缀指令 + 非确定性输入（安全/确定性边界，值得本地也拦一道）。 */
  const SHADER_FORBIDDEN = ['#version', '#extension', '#include', 'uTime', 'gl_FragCoord']
  /** 片元源上限（与工作台一致）。 */
  const SHADER_MAX_CHARS = 32 * 1024
  /** 列资源根下一级条目（缺目录给空表）。 */
  const childrenOf = (root) => { try { return readdirSync(root) } catch { return [] } }
  /** 读一个 JSON 对象；读不动 / 顶层不是对象就记一条并回 `undefined`。 */
  const readObject = (file) => {
    let parsed
    try { parsed = JSON.parse(readFileSync(file, 'utf8')) } catch (error) {
      note(file, `JSON 解析失败：${error instanceof Error ? error.message : String(error)}`)
      return undefined
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      note(file, '顶层必须是一个 JSON 对象')
      return undefined
    }
    return parsed
  }
  /** 一个类型目录下的条目目录：必须是目录、slug 合法；返回 `[slug, dir]`。 */
  const entryDirs = (type) => {
    const out = []
    for (const name of childrenOf(join(resourcesDir, type))) {
      if (name.startsWith('_')) continue
      const dir = join(resourcesDir, type, name)
      if (!statSync(dir).isDirectory()) { note(dir, `video/resources/${type}/ 下一档一个目录（里面放本类型的声明文件）`); continue }
      if (!KEBAB.test(name)) note(dir, `目录名要用小写 ASCII + 连字符（它进 id：kb-${name}）`)
      out.push([name, dir])
    }
    return out
  }

  // README.md 是人读说明（允许）；`_` 前缀是草稿（跳过）；其余顶层条目只允许已知类型与声明表。
  const allowedTop = new Set([
    'README.md', '_examples',
    'component-packs', 'luts', 'sfx', 'transitions', 'effects', 'templates', 'shaders',
    'fonts.json', 'models.json',
  ])
  for (const name of readdirSync(resourcesDir)) {
    if (name.startsWith('_')) continue
    if (!allowedTop.has(name)) {
      note(join(resourcesDir, name), 'video/resources/ 下只允许 component-packs/ luts/ sfx/ transitions/ effects/ templates/ shaders/ 与 fonts.json / models.json（其余条目工作台会忽略；要加类型先在 README 与工作台登记）')
    }
  }

  const packsRoot = join(resourcesDir, 'component-packs')
  let packNames = []
  try { packNames = readdirSync(packsRoot) } catch { /* 允许没有 */ }
  for (const pack of packNames) {
    if (pack.startsWith('_')) continue
    const packDir = join(packsRoot, pack)
    if (!statSync(packDir).isDirectory()) { note(packDir, 'video/resources/component-packs/ 下只放包目录'); continue }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(pack)) note(packDir, '包名要用小写 ASCII + 连字符（它进组件 id：kb-<包>-<卡>）')
    resourcePacks += 1
    const packFile = join(packDir, 'pack.json')
    if (existsSync(packFile)) {
      try { JSON.parse(readFileSync(packFile, 'utf8')) } catch (error) {
        note(packFile, `JSON 解析失败：${error instanceof Error ? error.message : String(error)}`)
      }
    }
    let cards = []
    try { cards = readdirSync(packDir) } catch { /* ignore */ }
    for (const slug of cards) {
      const cardDir = join(packDir, slug)
      if (slug.startsWith('_')) continue
      if (!statSync(cardDir).isDirectory()) {
        if (slug !== 'pack.json' && slug !== 'README.md') note(cardDir, '包里只放卡目录（卡级说明写在该目录的 README.md）')
        continue
      }
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) note(cardDir, '卡目录名要用小写 ASCII + 连字符（它进组件 id）')
      resourceCards += 1
      for (const required of ['component.json', 'card.json']) {
        const file = join(cardDir, required)
        if (!existsSync(file)) { note(file, `缺 ${required}（渲染半与库半缺一不可）`); continue }
        try {
          const parsed = JSON.parse(readFileSync(file, 'utf8'))
          if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            note(file, '顶层必须是一个 JSON 对象')
          }
        } catch (error) {
          note(file, `JSON 解析失败：${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
  }

  const lutsRoot = join(resourcesDir, 'luts')
  let lutNames = []
  try { lutNames = readdirSync(lutsRoot) } catch { /* 允许没有 */ }
  for (const slug of lutNames) {
    if (slug.startsWith('_')) continue
    const dir = join(lutsRoot, slug)
    if (!statSync(dir).isDirectory()) { note(dir, 'video/resources/luts/ 下一档一个目录，里面放 .cube'); continue }
    const files = readdirSync(dir).filter((name) => !name.startsWith('_'))
    if (!files.some((name) => name.toLowerCase().endsWith('.cube'))) {
      note(dir, '这个 LUT 目录里没有 .cube 文件')
      continue
    }
    resourceLuts += 1
  }

  // 音效：`sfx/<slug>/sound.json` + 一份音频；时长是硬门槛（缺了工作台会跳过这条）。
  for (const [, dir] of entryDirs('sfx')) {
    const soundFile = join(dir, 'sound.json')
    if (!existsSync(soundFile)) { note(soundFile, '缺 sound.json（音效声明）'); continue }
    const data = readObject(soundFile)
    if (data === undefined) continue
    const declared = typeof data.file === 'string' ? data.file.trim() : ''
    if (declared !== '') {
      if (/[\\/]/.test(declared)) { note(soundFile, `file「${declared}」只能是裸文件名（不能带路径分隔符）`); continue }
      if (!AUDIO_EXTENSIONS.includes(extname(declared).toLowerCase())) {
        note(soundFile, `file「${declared}」不是音频（${AUDIO_EXTENSIONS.join(' / ')}）`)
        continue
      }
      if (!existsSync(join(dir, declared))) { note(join(dir, declared), 'sound.json 声明的音频文件不存在'); continue }
    } else {
      const candidates = childrenOf(dir)
        .filter((name) => !name.startsWith('_') && AUDIO_EXTENSIONS.includes(extname(name).toLowerCase()))
      if (candidates.length === 0) { note(dir, `目录里没有音频文件（${AUDIO_EXTENSIONS.join(' / ')}）`); continue }
      if (candidates.length > 1) { note(soundFile, `目录里有 ${candidates.length} 份音频，必须写 file 指明用哪一份`); continue }
    }
    const duration = Number(data.durationInSeconds)
    if (!Number.isFinite(duration) || duration <= 0) {
      note(soundFile, 'durationInSeconds 必须是正数（缺了工作台会跳过这条音效：上时间线要它算片段长度）')
    }
    resourceSfx += 1
  }

  // 声明式转场 / 特效：一份 JSON（形状相同；词表级校验留给工作台）。
  for (const [, dir] of entryDirs('transitions')) {
    const file = join(dir, 'transition.json')
    if (existsSync(file)) readObject(file)
    else note(file, '缺 transition.json（转场声明）')
    resourceTransitions += 1
  }
  for (const [, dir] of entryDirs('effects')) {
    const file = join(dir, 'effect.json')
    if (existsSync(file)) readObject(file)
    else note(file, '缺 effect.json（特效声明）')
    resourceEffects += 1
  }

  // 成片模板：`template.json`；这里只查 ops 是"对象数组且每个有 op 字符串"（白名单留给工作台）。
  for (const [, dir] of entryDirs('templates')) {
    const file = join(dir, 'template.json')
    if (!existsSync(file)) { note(file, '缺 template.json（成片模板声明）'); continue }
    const data = readObject(file)
    if (data === undefined) continue
    if (!Array.isArray(data.ops) || data.ops.length === 0) {
      note(file, 'ops 必须是非空数组（模板要发的语义操作列表）')
    } else {
      for (const [index, item] of data.ops.entries()) {
        if (item === null || typeof item !== 'object' || Array.isArray(item)) { note(file, `ops[${index}] 不是对象`); continue }
        if (typeof item.op !== 'string' || item.op.trim() === '') note(file, `ops[${index}] 缺 op`)
      }
    }
    resourceTemplates += 1
  }

  // 着色器：片元主体 + spec.json；token 检查是确定性/安全边界（见 SHADER_FORBIDDEN）。
  for (const [, dir] of entryDirs('shaders')) {
    const glsl = join(dir, 'shader.glsl')
    if (!existsSync(glsl)) { note(glsl, '缺 shader.glsl（片元主体）') } else {
      const source = readFileSync(glsl, 'utf8')
      if (source.length > SHADER_MAX_CHARS) note(glsl, `片元源太长（${source.length} 字符，上限 ${SHADER_MAX_CHARS}）`)
      if (!/void\s+main\s*\(/.test(source)) note(glsl, '找不到 void main()（片元主体必须自己写）')
      for (const token of SHADER_FORBIDDEN) {
        if (source.includes(token)) note(glsl, `不许出现「${token}」（只允许片元主体，且必须确定性）`)
      }
    }
    const spec = join(dir, 'spec.json')
    if (existsSync(spec)) readObject(spec)
    else note(spec, '缺 spec.json（着色器声明）')
    resourceShaders += 1
  }

  // 模型声明：一份 `models.json`（每条的 capabilities 词表留给工作台）。
  const modelsFile = join(resourcesDir, 'models.json')
  if (existsSync(modelsFile)) {
    const parsed = readObject(modelsFile)
    if (parsed !== undefined) {
      if (!Array.isArray(parsed.models)) note(modelsFile, 'models.json 需要有 models 数组')
      else {
        for (const [index, row] of parsed.models.entries()) {
          if (row === null || typeof row !== 'object' || Array.isArray(row)) { note(modelsFile, `models[${index}] 不是对象`); continue }
          const id = typeof row.id === 'string' ? row.id.trim() : ''
          const name = id === '' ? `#${index}` : id
          if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) note(modelsFile, `模型 ${name}：id 必须是小写 ASCII + 连字符（≤64 字符）`)
          const url = typeof row.url === 'string' ? row.url.trim() : ''
          if (!/^https?:\/\//.test(url)) note(modelsFile, `模型 ${name}：缺 http(s) url（没有下载源就装不了）`)
          const sha = typeof row.sha256 === 'string' ? row.sha256.trim() : ''
          if (!/^[0-9a-f]{64}$/.test(sha)) note(modelsFile, `模型 ${name}：sha256 必须是 64 位小写十六进制`)
          resourceModels += 1
        }
      }
    }
  }

  const fontsFile = join(resourcesDir, 'fonts.json')
  if (existsSync(fontsFile)) {
    try {
      const parsed = JSON.parse(readFileSync(fontsFile, 'utf8'))
      if (!Array.isArray(parsed?.fonts)) note(fontsFile, 'fonts.json 需要有 fonts 数组')
    } catch (error) {
      note(fontsFile, `JSON 解析失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

if (violations.length === 0) {
  console.log(
  `✓ 合规：${files.filter((f) => f.endsWith('.md')).length} 个 markdown、${skillNames.size} 个技能、`
  + `${seenUrls.size} 条订阅、${sourceCount} 份视频源、`
  + `${resourcePacks} 个资源包 / ${resourceCards} 张卡 / ${resourceLuts} 份 LUT / `
  + `${resourceSfx} 条音效 / ${resourceTransitions} 个转场 / ${resourceEffects} 个特效 / `
  + `${resourceTemplates} 支模板 / ${resourceShaders} 个着色器 / ${resourceModels} 条模型`,
)
  process.exit(0)
}
console.error(`✗ 发现 ${violations.length} 处不合规：`)
for (const line of violations) console.error('  · ' + line)
process.exit(1)
