/**
 * 合规自检：把 SPEC 第 6 节的"最小合规清单"变成可执行的检查。
 *
 *   node scripts/check-compliance.mjs
 *
 * 退出码 0 = 全部合规；1 = 有违规（逐条打印文件与原因）。
 * 零依赖：只用 Node 内置模块——fork 之后不该为了检查再装一套工具链。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

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

// 2. 技能包：skills/<name>/SKILL.md 与 templates/<name>/SKILL.md，名字必须唯一
const skillNames = new Map()
for (const sub of ['skills', 'templates']) {
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

if (violations.length === 0) {
  console.log(`✓ 合规：${files.filter((f) => f.endsWith('.md')).length} 个 markdown、${skillNames.size} 个技能、${seenUrls.size} 条订阅`)
  process.exit(0)
}
console.error(`✗ 发现 ${violations.length} 处不合规：`)
for (const line of violations) console.error('  · ' + line)
process.exit(1)
