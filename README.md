# My Personal Website

![Bun](https://img.shields.io/badge/Bun-1.0+-black?logo=bun&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Coverage](https://img.shields.io/badge/coverage-check%20locally-yellow)

Personal website built with React, Vite, and Bun. Uses spec-driven development with two modes: **full** (tested, verified) and **prototype** (fast, unverified).

## Features

- **Multi-category content** — Blog posts, projects, talks, and short notes in a filterable grid
- **Fuzzy search** — Real-time client-side search across titles, summaries, and tags
- **Reveal.js presentations** — Markdown-authored slide decks with speaker notes and code highlighting
- **Mermaid diagrams** — Embedded, client-rendered diagrams in posts
- **Trending tags** — Algorithmically ranked tags by frequency and recency
- **Dark/light mode** — Theme toggle with persistent state
- **Featured posts** — Full-width hero card for highlighted content
- **External links** — Posts can link out to external URLs
- **Resume download** — Direct PDF download from the hero section
- **Syntax highlighting** — Code blocks with language-aware highlighting
- **Responsive design** — Mobile-friendly with hamburger menu

## Roadmap

- **SEO & Open Graph** — Per-post meta tags with category-aware OG images for rich sharing previews
- **SSR support** — Server-side rendering for search engines and social crawlers
- **AI-powered cover images** — Automatic generation via Nano Banana Pro
- **Vercel deployment** — Production hosting with CI/CD

## Setup

```bash
bun install
npx playwright install chromium
```

## Dev

```bash
bun run dev           # API (3000) + Vite (5173)
```

## Testing

```bash
bun run test:lib      # Vitest (unit/lib tests)
bun run test:e2e      # Playwright (E2E)
bun run test:all      # All of the above
bun run typecheck     # TypeScript type checking
```

## Project Structure

```
src/
  shared/schemas/             # Zod schemas (API ↔ UI contract)
  api/                        # Bun API server
  ui/                         # React frontend
  content/                    # Production content (posts, profile)
  lib/                        # Shared libraries
test/
  lib/                        # Vitest unit tests
  e2e/                        # Playwright E2E tests
  content/                    # Test fixtures (isolated from production)
specs/                        # Feature specs (SDD)
infra/                        # Docker Compose (Postgres, Redis)
```

## Stack

- **Runtime**: [Bun](https://bun.sh)
- **Frontend**: [React 19](https://react.dev) + [Vite 6](https://vite.dev)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Validation**: [Zod](https://zod.dev)
- **Testing**: [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev)
- **Content**: Markdown with frontmatter, [Fuse.js](https://www.fusejs.io) search
