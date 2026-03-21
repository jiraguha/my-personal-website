# iraguha.dev

[![Live](https://img.shields.io/badge/live-iraguha.dev-brightgreen)](https://iraguha.dev)
![Bun](https://img.shields.io/badge/Bun-1.0+-black?logo=bun&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tests](https://github.com/jiraguha/my-personal-website/actions/workflows/ci.yml/badge.svg)

Personal website & digital garden. Blog posts, projects, talks, and short notes — all spec-driven, all from markdown.

## Quickstart

```bash
bun install
bun run dev        # → localhost:5173
```

That's it. No Docker needed for dev — just Bun.

## What's inside

```
src/
  api/                    Bun API server
  ui/                     React frontend (Vite + Tailwind 4)
  shared/schemas/         Zod schemas — the API ↔ UI contract
  content/posts/          Markdown content (blog, project, talk, short)
specs/                    Feature specs (spec-driven development)
test/
  lib/                    Vitest unit tests
  e2e/                    Playwright E2E tests
```

## Content types

| Type        | What it is                              |
|-------------|----------------------------------------|
| **Blog**    | Long-form articles with cover images    |
| **Project** | Portfolio pieces with links and demos   |
| **Talk**    | Reveal.js slide decks from markdown     |
| **Short**   | Quick notes, links, and thoughts        |

All content is markdown with frontmatter. Add a `.md` file to the right folder and it shows up.

## Key features

- **Fuzzy search** — client-side via Fuse.js, instant results across all content
- **Reveal.js talks** — write slides in markdown, present with speaker notes + code highlighting
- **Mermaid diagrams** — embedded in posts, rendered client-side
- **Trending tags** — ranked by frequency and recency
- **SSR + SEO** — Vike-powered prerendering with per-post Open Graph meta tags
- **Auto-generated covers** — SVG cover images from post metadata
- **Dark/light mode** — persisted theme toggle
- **Featured posts** — hero card for highlighted content

## Commands

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build (prerender + sitemap) |
| `bun run test:lib` | Run Vitest unit tests |
| `bun run test:e2e` | Run Playwright E2E tests |
| `bun run test:all` | Run everything |
| `bun run typecheck` | TypeScript check |
| `bun run covers` | Generate cover images |
| `bun run test:seo` | SEO audit |

## Stack

| Layer | Tech |
|-------|------|
| Runtime | [Bun](https://bun.sh) |
| Frontend | [React 19](https://react.dev) + [Vite 6](https://vite.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| SSR | [Vike](https://vike.dev) |
| Validation | [Zod](https://zod.dev) |
| Search | [Fuse.js](https://www.fusejs.io) |
| Slides | [Reveal.js](https://revealjs.com) |
| Testing | [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) |

## Development approach

This project uses **spec-driven development** with two modes:

- **Full** — spec → failing tests → implementation → verification. For production features.
- **Prototype** — skip tests, move fast, promote or delete later. For experiments.

15 specs and counting. See [specs/](specs/) for the full history.

## License

MIT
