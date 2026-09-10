# AI Creator Knowledge Base

> An **agent-first** standard for an AI content-creation knowledge base: **skills, templates,
> learnings, assets, profile and feed subscriptions** live in one git repo, are written and
> maintained by AI, and are consumed by the dsh-desktop app.

This is not a vertical-specific knowledge base — it is a **repo standard plus a subscription
protocol**. Use it as a template: fork/clone it into `<your-niche>-knowledge`, fill in your
skills and experience, push it back to GitHub, and the desktop's *Content Knowledge* and
*Inspiration* panels will pick up your skills, your knowledge, and **your feed list**.

## Where to look

| Question | Read |
|---|---|
| Which directory, and what does each frontmatter field do? | [SPEC.md](SPEC.md) — the standard |
| How do I go from zero to working, and how do I fix things? | [docs/guide.md](docs/guide.md) |
| What rules does the AI follow when writing here? | [AGENTS.md](AGENTS.md) |
| How do subscriptions sync to the desktop? (normative contract) | [docs/subscription-protocol.md](docs/subscription-protocol.md) |

## Layout

```
├── SPEC.md / AGENTS.md        # the standard + the agent contract
├── docs/guide.md              # the practical guide (setup + troubleshooting)
├── feeds/<slug>.md            # one file per feed → auto-subscribed by the desktop
├── feeds/_template.md         # copy this to start (leading `_` = draft, not subscribed)
├── skills/<name>/SKILL.md     # delivered as a real agent skill
├── templates/<name>/SKILL.md  # delivered the same way
├── learnings/  assets/  docs/  profile/    # indexed markdown entries (recall-able)
```

Each `.md` under the four indexed directories is one recallable entry defined by its
frontmatter; each `skills/<name>/SKILL.md` is deployed as an agent skill; each `feeds/<slug>.md`
becomes a live subscription on the desktop.

## Quick start

```bash
git clone https://github.com/<you>/ai-creator-knowledge.git
cd ai-creator-knowledge
$EDITOR profile/账号画像.md feeds/*.md
git add -A && git commit -m "init my knowledge base" && git push
```

Then, in dsh-desktop: *Settings → Content Knowledge → sources → add this repo → Sync*.

What the desktop does with a declaration:

- `group` becomes a heading in the source list, `weight` orders it (ascending inside a
  group; a group sits where its smallest weight puts it);
- the body becomes the subscription's **note** — shown when hovering the row and under the
  article title;
- a feed the repo **withdraws** is flagged「库已移除」: its articles stay, and it stops
  updating; `enabled: false` keeps the articles and never fetches;
- both of those are overridable locally: right-click a source to **disable/enable** it on this
  machine (your switch beats the repo's `enabled` and survives a sync), and you can **delete**
  a source the repo still declares — the machine remembers that ignore, so the next sync will
  not subscribe it again, and 「恢复被忽略的订阅」 in the rail undoes it;
- feeds must be **public addresses**: loopback/private/link-local hosts (`localhost`, `127.x`,
  `10.x`, `192.168.x`, `169.254.x`, `::1`, `.local`…) are skipped with a reason — the list is
  shared and the desktop fetches what it says. Add an internal feed by hand in the panel.
- **delete the knowledge base** and the subscriptions it introduced stay exactly as they
  are — by then they are yours.

## Principles

1. Markdown + frontmatter only — no database, no proprietary format, git-diffable.
2. One directory, one meaning.
3. Humans own taste, AI owns tidying.
4. The desktop is a **read-only** consumer: it never pushes back to this repo.
5. Composable — several knowledge repos (and their `feeds/`) merge into one tree.
6. Every documented field actually does something; anything not wired up yet (e.g. `tags`)
   is labelled as such instead of pretending.

## What "compliant" means

It is checkable — see the **minimum checklist** in [SPEC.md](SPEC.md) §6: every indexed
entry has `title` + `summary`, every skill ships a `SKILL.md`, every feed has a valid `url`,
and no desktop-side index/build artifacts are committed. The checklist has a script, and CI
runs the same one:

```bash
node scripts/check-compliance.mjs     # zero dependencies; prints each violation and why
```
