# AI Creator Knowledge Base

> An **agent-first** standard for an AI content-creation knowledge base: **skills, templates,
> learnings, assets, profile and feed subscriptions** live in one git repo, are written and
> maintained by AI, and are consumed by the dsh-desktop app.

This is not a vertical-specific knowledge base — it is a **repo standard plus a subscription
protocol**. Use it as a template: fork/clone it into `<your-niche>-knowledge`, fill in your
skills and experience, push it back to GitHub, and the desktop's *Content Knowledge* and
*Inspiration* panels will pick up your skills, your knowledge, and **your feed list**.

- Repo layout spec: [SPEC.md](SPEC.md)
- Agent contract: [AGENTS.md](AGENTS.md)
- **Subscription sync protocol (repo ↔ desktop)**: [docs/subscription-protocol.md](docs/subscription-protocol.md)

## Layout

```
├── SPEC.md / AGENTS.md        # the standard + the agent contract
├── feeds/<slug>.md            # one file per feed → auto-subscribed by the desktop
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

## Principles

1. Markdown + frontmatter only — no database, no proprietary format, git-diffable.
2. One directory, one meaning.
3. Humans own taste, AI owns tidying.
4. The desktop is a **read-only** consumer: it never pushes back to this repo.
5. Composable — several knowledge repos (and their `feeds/`) merge into one tree.
