# 001 — Personal Portfolio & Blog Site

> Status: `complete`
> Mode: `full`
> Date: 2026-03-18

## Intent

Jean-Paul Iraguha can showcase his professional identity, publish long-form blog posts, highlight projects and open-source work, and surface talks/podcasts/speaking engagements — all from a single, fast personal site at a custom domain. Visitors get a clear picture of who he is, what he's building, and how to reach him. Content is authored in Markdown and deployed via Git push with zero CMS overhead.

## Shared Schema

```typescript
// src/shared/schemas/site.schema.ts

export const ContentCategorySchema = z.enum(["blog", "project", "talk"]);
export type ContentCategory = z.infer<typeof ContentCategorySchema>;

export const PostFrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  date: z.string(),
  updated: z.string().optional(),
  summary: z.string(),
  cover: z.string().optional().default(""),
  tags: z.array(z.string()).default([]),
  category: ContentCategorySchema,
  featured: z.boolean().optional().default(false),
  draft: z.boolean().optional().default(false),
  externalUrl: z.string().optional(),
});

export const PostCardSchema = PostFrontmatterSchema.pick({ ... });
export const SiteProfileSchema = z.object({ ... });
```

## Data Layer Acceptance Criteria

The "API" is `src/ui/lib/posts.ts` — pure functions over Vite-bundled markdown files via `import.meta.glob`.

- [x] LIB-1: `getAllPosts()` returns all published posts sorted newest-first. "Published" means `draft !== true` and `date ≤ today` (in production; dev shows all).
- [x] LIB-2: `getFeaturedPost()` returns the single featured post. When multiple posts have `featured: true`, the newest by date wins.
- [x] LIB-3: `getPostBySlug(slug)` returns the matching `Post` or `undefined` for unknown slugs.
- [x] LIB-4: `getPostsByTag(tag)` returns all published posts whose `tags` array includes `tag`.
- [x] LIB-5: `getAllTags()` returns a deduplicated, alphabetically-sorted list of all tags across all published posts.
- [x] LIB-6: A markdown file with missing or invalid frontmatter fields is silently excluded from results (Zod `safeParse` failure) and a `console.warn` is emitted naming the file.
- [x] LIB-7: `toPostCard(post)` returns a `PostCard`-shaped object with no extra fields.

## UI Acceptance Criteria

- [x] UI-1: **Nav** — sticky top bar; site name left-aligned; GitHub, LinkedIn, email icons right-aligned; hamburger menu on mobile (≤ 768 px) that reveals links.
- [x] UI-2: **Hero** — centered section with avatar (initials fallback if image 404s), name, "Role · Org" line, bio paragraph, and social CTA buttons.
- [x] UI-3: **FeaturedCard** — full-width card with gradient cover, "Latest · {Category}" badge, title, summary, date, and "Read →" link. Only one card shown.
- [x] UI-4: **ContentGrid** — responsive grid (1 col mobile / 2 tablet / 3 desktop) with category filter tabs ("All", "Blog", "Projects", "Talks") above it. Shows all non-featured posts.
- [x] UI-5: **PostCard** — category badge, up to 3 tag chips, 2-line-clamped title and summary, date, and "→". External-URL posts open in a new tab.
- [x] UI-6: **PostDetail** — renders markdown with syntax-highlighted fenced code blocks, GFM tables and strikethrough, tags, formatted date, category badge, back link. If `externalUrl` is set, shows a prominent "View original →" button.
- [x] UI-7: **TagPage** — lists all posts with a given tag, shows post count in subtitle. Shows "No posts with this tag." when count is 0.
- [x] UI-8: **NotFound** — "404 / Post not found" page with back-to-home link. Rendered for `/404` and any unmatched route.
- [x] UI-9: **Dark/light mode** — initial theme resolved from `localStorage` → `prefers-color-scheme` before first paint (no flash). Toggle in nav persists choice.
- [x] UI-10: **Category filter** — selecting a tab filters the grid client-side; if no posts match, shows "No {category} posts yet." Switching back to "All" restores full grid.

## Integration Acceptance Criteria

- [x] E2E-1: Home page renders nav, hero, at least one post card, and the content grid.
- [x] E2E-2: Clicking a post card on the home page navigates to `/posts/[slug]` and renders the post title and markdown body.
- [x] E2E-3: Clicking a tag chip navigates to `/tags/[tag]` and lists only posts with that tag.
- [x] E2E-4: Category filter tabs filter the grid without a page navigation event.
- [x] E2E-5: Navigating to `/posts/nonexistent-slug` renders the 404 page.
- [x] E2E-6: Dark/light toggle changes the `dark` class on `<html>` and the choice survives a page reload.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Empty | Zero published posts | Hero + "Coming soon — stay tuned" where grid would be |
| Populated | ≥ 1 published post | Full hero → featured card → content grid |
| Filtered empty | Category tab selected, no posts in category | "No {category} posts yet." |
| Error (invalid frontmatter) | Malformed `.md` file | Post excluded silently; `console.warn` names the file |
| Error (404) | Unknown slug navigated to | Custom 404 page with "Post not found" and back link |

## Non-goals

- No CMS, admin panel, or database — content lives in Git as Markdown.
- No RSS feed or sitemap in v1 (static-site generator feature, not this stack).
- No OG image generation in v1.
- No comments system in v1.
- No newsletter/email signup in v1.
- No search in v1 (tag filtering is sufficient).
- No i18n / multi-language support.

## Edge Cases

| Scenario | Layer | Expected (actual behaviour) |
|----------|-------|-----------------------------|
| Two posts have `featured: true` | Lib | Newest by `date` wins `getFeaturedPost()`; other appears in grid |
| No posts have `featured: true` | UI | "Coming soon — stay tuned" shown in featured slot |
| Post has no `cover` | UI | Gradient placeholder renders; no broken `<img>` |
| `externalUrl` set on post | UI | Card "→" opens new tab; detail page shows "View original →" button |
| Future-dated post | Lib | Excluded from `getAllPosts()` in production |
| Invalid frontmatter | Lib | `safeParse` fails → post excluded; `console.warn` names the file |
| Unknown route | UI | React Router `*` catch-all renders `<NotFound />` |
| Category filter, no matches | UI | Shows "No {category} posts yet." instead of empty grid |

## External Dependencies

- **React 19 + Vite 6** — SPA framework and build tool
- **React Router DOM 7** — client-side routing
- **Tailwind CSS 4** + **@tailwindcss/vite** — utility CSS, dark-mode via `dark` class
- **@tailwindcss/typography** — prose styles for markdown content
- **react-markdown** + **remark-gfm** — markdown → React, GFM extensions
- **rehype-highlight** + **highlight.js** — syntax highlighting in code blocks
- **Zod 3** — frontmatter schema validation
- _No Docker services required — fully static_

## Directory Structure

```
src/
  shared/schemas/site.schema.ts   # Zod schemas (THE contract)
  ui/
    lib/
      posts.ts                    # getAllPosts, getPostBySlug, getFeaturedPost, etc.
      site.ts                     # SiteProfile config object
    components/
      Nav.tsx, Hero.tsx, FeaturedCard.tsx, PostCard.tsx
      ContentGrid.tsx, CategoryFilter.tsx, TagChip.tsx
      ThemeToggle.tsx, Footer.tsx
    pages/
      Home.tsx, PostDetail.tsx, TagPage.tsx, NotFound.tsx
    main.tsx                      # Router + Layout root
    index.css                     # Tailwind v4 entry
src/
  content/
    posts/                        # All .md files (frontmatter + body)
test/
  ui/                             # Playwright component/UI tests
  e2e/                            # Playwright E2E tests (full site)
```

## Post-Implementation Notes

- Built as a Vite SPA (not Next.js as originally drafted). Content loaded via `import.meta.glob` at bundle time — effectively static with no runtime data fetching.
- Frontmatter parsed with a custom inline YAML parser (no `gray-matter` needed in browser context).
- Dark mode initialised synchronously before React hydration to eliminate flash.
- Vite 6 does not transform `.md` raw imports through its dev-server static middleware. A custom `markdownRawPlugin` adds `configureServer` middleware (dev) + a `load` hook (build) to serve `.md?raw` and `.md?import&raw` as `export default "..."` JS modules.
- Content files live in `src/content/posts/` (not root-level `content/`) so they are within Vite's module graph.
- Tests: 25 Vitest unit tests (pure functions, no browser), 20 Playwright E2E tests. All pass.
