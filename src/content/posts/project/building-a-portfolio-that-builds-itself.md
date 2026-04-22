---
title: "Building a Portfolio That Builds Itself"
slug: building-a-portfolio-that-builds-itself
date: 2026-03-21
summary: "A portfolio that is also a small publishing system – spec-driven, AI-augmented, Markdown-native. Fork it, point Claude at it, and the scaffolding is already there."
tags: ["spec-driven-development", "portfolio", "claude", "open-source"]
category: project
draft: false
featured: true
coverKeywords: ["spec-driven", "portfolio-engine", "ai-covers", "fork-adapt", "developer-brand"]
coverHint: "A cyberpunk HUD showing a blueprint/schematic of a portfolio site being assembled by automated systems — specs flowing into tested components, AI generating cover art, slides rendering in a holographic preview panel"
---

Over the past few months, I stopped treating my personal site as a static artefact and started treating it as a small production system – with specs, tests, a content pipeline, and a Claude skill that drafts posts for me. The change was quieter than I expected, but the effect on how often I actually publish has been the most obvious shift.

What surprised me was how little of the work was the site itself. Most of the effort went into the scaffolding around it – the spec workflow, the cover generation pipeline, the skill that turns rough notes into publishable Markdown. The site is almost a by-product of the system that builds it.

_A caveat before we begin: this is a working system, not a finished one. Several pieces are still prototype-status, and the trade-offs below reflect what has held up so far – not a general prescription._

In this article – a tour of what the system does and where it still has gaps – we cover:

1. **Why a portfolio needs a system, not a template.** Static starters tend to rot; systems tend to accrete features.
2. **The stack, in one page.** What I chose, and the trade-off I made in each case.
3. **The content model.** Four categories, one Markdown layer, one Zod schema.
4. **AI-generated cover art.** Prompt shape, caching, and what it costs.
5. **Reveal.js talks from a single Markdown file.** Speaker notes, code highlighting, and a clean split between landing page and presentation.
6. **The Claude skill that writes posts.** What it reads, what it outputs, and where it still hands off to me.
7. **Fork-and-adapt mechanics.** What you change, what you keep.
8. **What's missing.** Honest gaps, loose ends, and the next few specs.

A brief note on SDD: the workflow this site runs on – numbered specs, failing tests before code, a strict promotion path out of prototype mode – gets its own post. Here I mention it where it matters and move on.

## Why a portfolio needs a system

**Templates rot; systems compound.** Most developer sites are started on a weekend and never touched again – the CSS is distracting, the content feels exposed, and six months later the framework version is two majors behind. I have retired at least three portfolios for exactly this reason, so the question I started with was not _what should the site look like_, but _what would make me actually maintain it?_

The answer turned out to be less about the site and more about the surface area around publishing. If writing a post means opening an editor, running one command, and seeing it live, it happens. If it means wrestling with a dashboard or rewriting a template, it does not.

_In general, the cost of each post – measured in friction, not minutes – probably determines whether the site lives or dies._

## The stack, in one page

I kept the stack deliberately narrow. Each choice traded flexibility for something concrete – usually speed, sometimes clarity.

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | **Bun** | Fast cold starts, batteries-included test runner, reads `.env` without extra setup. |
| UI | **React 19 + Vite 6** | Familiar; the dev server is quick enough that I rarely notice it. |
| Routing / SSR | **Vike** | File-based routing without the framework-shaped opinions. Explicit where other options tend to be magical. |
| Styling | **Tailwind 4** | Utility-first; the new engine compiles fast enough that design iteration is cheap. |
| Validation | **Zod** | One schema validates frontmatter on load and types the UI components. No drift between data and display. |
| Content | **Markdown** | No CMS, no database, no vendor. `vim` and `git push` remain the highest-leverage authoring tools I own. |

**The trade-off is honest.** This stack is probably wrong if you are optimising for onboarding unfamiliar contributors, and it is definitely wrong if you want a WYSIWYG editor. For a single-author site, the lack of moving parts is the feature.

## The content model

**Four categories share one unified grid.** Blogs are long-form essays; projects are writeups of tools and systems; talks are Reveal.js decks; shorts are quick TILs. They share the same tag system, the same search index, and the same Zod schema – but diverge on card style, routing, and frontmatter.

| Category | Purpose | Distinguishing trait |
|----------|---------|----------------------|
| **Blog** | Long-form articles | AI-generated cover image |
| **Project** | Tool / system writeups | AI-generated cover image |
| **Talk** | Reveal.js slide decks | Full-viewport presentation mode |
| **Short** | TILs, hot takes | No cover, compact card, lightning badge |

**The Zod schema is the contract.** Frontmatter is parsed and validated at build time; a malformed post fails loudly rather than rendering silently-broken. This is the single piece of infrastructure I would keep even if I threw the rest of the code away – because it is what makes the rest of the code safe to change.

## AI-generated cover art

Every blog and project post gets a unique cover image. The prompt is assembled from three frontmatter fields plus a global aesthetic definition (`da.md`):

```yaml
coverKeywords: ["zero-trust", "agent-architecture"]
coverHint: "A HUD showing trust boundaries and memory compartments"
coverText: minimal    # none | minimal | moderate | heavy
```

The generator (Gemini 3 Pro, invoked via `bun run covers`) hashes the final prompt, checks a manifest, and only regenerates when the hash changes. Rate limits are respected, failures are retried with backoff, and nothing is committed until the manifest agrees.

**Practically, this means cover art is cheap to iterate on and free to re-run.** If I change the keywords on a draft, the next `bun run covers` picks up only that post. If I change `da.md`, every post regenerates – which is rare, because the aesthetic is intentionally stable.

_Costs, roughly: a few cents per image, a few seconds per generation. Nothing that meaningfully changes the economics of writing._

## Reveal.js talks from a single Markdown file

**Talks are just Markdown with a separator convention.** A `---` line breaks slides; a `Note:` block becomes speaker notes; fenced code blocks get syntax highlighting; Mermaid diagrams render inline.

```markdown
---
title: "My Conference Talk"
category: talk
event: "DevConf 2026"
eventDate: 2026-06-15
---

## Slide One

The key insight is...

---

## Slide Two

Note: Demo the live version here
```

Each talk produces two URLs: a landing page at `/posts/my-talk` with metadata and abstract, and a full-screen presentation at `/talks/my-talk`. The landing page is indexable; the presentation is not. That split seems to be the right one – readers find the talk through search, viewers run it from a projector.

## The Claude skill that writes posts

Here is the part that most changed how I publish. The repo ships with a Claude Code skill (`.claude/commands/post-creator.md`) that turns rough notes into a publish-ready Markdown file.

The input is usually a paragraph of unstructured thought:

```
/post-creator bun's test runner is actually good – you don't need
jest, watch mode is fast, and it reads .env automatically. saves a
dev dependency.
```

The output is a short with correct frontmatter, a plausible slug, a tag list consistent with the rest of the site, and a structure that matches other shorts in the same category. For longer pieces it suggests Mermaid diagrams when it detects flows, and for talks it splits prose into slide boundaries.

**What the skill actually does, step by step:**

- Reads `src/content/profile.json` to keep tone consistent with my bio.
- Reads a voice profile (like the one at `voice/pragmatic.md`) when asked to match a specific register.
- Inspects existing posts in the target category to pick up frontmatter conventions.
- Leaves a draft in the right directory with `draft: true` set, so nothing goes live by accident.

It is not magic. The skill produces a first draft; I edit it. But the cost of the first draft is close to zero, which is the whole point.

_This is still prototype code. The interface is likely to change before I promote it, and fork users should expect some friction here._

## Fork-and-adapt mechanics

The repository is open source and designed for adaptation, not just inspection.

```bash
git clone https://github.com/jiraguha/my-personal-website.git
cd my-personal-website
bun install
bun run dev
```

**The things you change:**

1. **`src/content/profile.json`** – your name, role, bio, socials, favicon letter.
2. **`da.md`** – your visual aesthetic for AI covers, or delete the file and drop in static images instead.
3. **`src/content/posts/`** – remove my posts, add yours. The four category folders are the schema.
4. **`CLAUDE.md`** – already wired. Claude knows the conventions, the spec flow, and the skills available.

**The things you keep** – unless you have a strong reason otherwise – are the spec workflow, the Zod schema, the cover pipeline, the search index, and the tests. They are the parts that make the site maintainable, and they are also the parts most people would be tempted to strip out first.

## What's missing

Honest gaps, in rough order of how much they bother me:

- **No RSS feed yet.** The blocker is deciding whether to include shorts or only long-form; both options have a case.
- **No reading-time estimate on cards.** Trivial to add; I keep forgetting.
- **No comment system.** Most likely backed by GitHub Discussions, but it's unclear whether reader traffic justifies the moderation surface.
- **No i18n.** Probably the biggest lift of the open items, and the one with the least certain payoff.
- **Post-creator skill is prototype-status.** It works, but the spec isn't promoted – meaning tests and verification are pending.
- **Deploy story is under-documented.** The site runs behind a CDN; the setup is not in the README yet.
- **Lighthouse budgets are soft.** SEO and accessibility gates are enforced at ≥ 90; performance is not, which will probably bite me the first time I embed a heavy widget.

None of these are blockers – the site works. But the list is the honest answer to _what would I change next?_, and it is the part most portfolio posts seem to skip.

## A brief note on SDD

The whole thing runs on a spec-driven workflow – numbered specs, failing tests before code, a promotion path out of prototype mode. Fourteen specs in, twelve complete, eighty-plus tests, no regressions so far. A longer post on how the workflow actually feels from the inside – including the failure modes – is coming next.

## Takeaway

**A portfolio doesn't have to be a project you abandon.** It can be a system that mirrors how you build software at work – disciplined, tested, incrementally better. The friction you remove from publishing is, in my experience, the thing that determines whether the site survives the first six months.

If you want to skip the template phase and start with the system, [fork the repo](https://github.com/jiraguha/my-personal-website.git). The specs are there, the tests are there, and Claude already knows how to work with the codebase. Your mileage will vary – but the scaffolding is the part you'd otherwise spend a weekend rebuilding.
