# 001 — Personal Portfolio & Blog Site

> Status: `draft`
> Mode: `full`
> Date: 2026-03-18

## Intent

Jean-Paul Iraguha can showcase his professional identity, publish long-form blog posts, highlight projects and open-source work, and surface talks/podcasts/speaking engagements — all from a single, fast, statically-generated personal site at a custom domain. Visitors get a clear picture of who he is, what he's building, and how to reach him. Content is authored in Markdown and deployed via Git push with zero CMS overhead.

## Shared Schema

```typescript
// src/shared/schemas/site.schema.ts

/** Global site owner profile — rendered in hero, nav, footer, and meta tags */
export interface SiteProfile {
  name: string;                 // "Jean-Paul Iraguha"
  role: string;                 // "Software Engineer & Tech Lead"
  org: string;                  // "SingularFlow"
  bio: string;                  // Full paragraph bio
  avatar: string;               // Path to headshot, e.g. "/assets/authors/jp.jpg"
  socials: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
}

/** Frontmatter for every Markdown content file */
export interface PostFrontmatter {
  title: string;
  slug: string;
  date: string;                 // ISO 8601, e.g. "2026-03-18"
  updated?: string;
  summary: string;              // 1–3 sentences, used in cards and meta description
  cover: string;                // Relative path to cover image/SVG
  tags: string[];               // e.g. ["ai-safety", "kubernetes", "agentic-systems"]
  category: ContentCategory;
  featured?: boolean;           // true → appears in hero "Latest Post" slot
  draft?: boolean;              // true → excluded from production build
  externalUrl?: string;         // For talks/podcasts that link offsite
}

export type ContentCategory = "blog" | "project" | "talk";

/** Derived at build time for list pages */
export interface PostCard {
  title: string;
  slug: string;
  date: string;
  summary: string;
  cover: string;
  tags: string[];
  category: ContentCategory;
}
```

## API Acceptance Criteria

_"API" here means the Next.js data layer — static generation functions, not a REST service._

- [ ] API-1: `getStaticProps` on the index page returns the site profile, the single featured post, and all remaining posts sorted newest-first.
- [ ] API-2: `getStaticPaths` + `getStaticProps` on `/posts/[slug]` pre-renders every non-draft Markdown file from `content/posts/` at build time.
- [ ] API-3: Posts with `draft: true` in frontmatter are excluded from all production builds and sitemaps but render locally in `next dev`.
- [ ] API-4: An auto-generated RSS feed is available at `/feed.xml` containing the 20 most recent posts with title, date, summary, and link.
- [ ] API-5: An auto-generated `sitemap.xml` lists all public pages and posts.
- [ ] API-6: Tag pages at `/tags/[tag]` list all posts matching that tag, generated statically.
- [ ] API-7: OG image generation (via `next/og` or a static fallback) produces a unique social card per post using the post title and cover.

## UI Acceptance Criteria

- [ ] UI-1: **Nav bar** — site name/logo left-aligned, links to GitHub, LinkedIn, and email right-aligned. Sticky on scroll. Responsive hamburger menu on mobile (≤ 768 px).
- [ ] UI-2: **Hero section** — full-width area with avatar, name, role/org, bio paragraph, and social icon links (GitHub, LinkedIn, email). Visually matches the breviu.com centered layout.
- [ ] UI-3: **Featured post card** — large card below the hero with cover image, "Latest Post" label, title, summary, date, and "Read →" link. Only one post is featured at a time (the most recent `featured: true` post).
- [ ] UI-4: **Content grid** — below the featured card, a section titled "Projects, Writing, Talks & Code" displays all remaining posts as smaller cards in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop). Each card shows cover image, title, summary snippet (truncated at 2 lines), date, and a "→" link.
- [ ] UI-5: **Post detail page** — renders Markdown to HTML with syntax-highlighted code blocks (Shiki or Prism), responsive images, heading anchors, and a back-to-home link. Includes `<title>`, OG meta tags, and JSON-LD `Article` structured data.
- [ ] UI-6: **Footer** — "Built with Next.js", copyright line with current year, and social links.
- [ ] UI-7: **Dark / light mode** — respects `prefers-color-scheme` by default, with a manual toggle in the nav that persists choice in `localStorage`.
- [ ] UI-8: **Tag chips** — each card and post detail page shows clickable tag chips; clicking navigates to `/tags/[tag]`.
- [ ] UI-9: **Category filter** — on the home page, horizontal tab bar ("All", "Blog", "Projects", "Talks") filters the content grid client-side without a page reload.
- [ ] UI-10: **Performance** — Lighthouse score ≥ 95 on Performance, Accessibility, Best Practices, and SEO on the index page.

## Integration Acceptance Criteria

- [ ] E2E-1: Running `npm run build && npm run start` serves the full site with all posts rendered, no 404s, and all internal links resolve.
- [ ] E2E-2: Adding a new `.md` file to `content/posts/` with valid frontmatter and re-building produces a new card on the home page and a new detail page at `/posts/[slug]`.
- [ ] E2E-3: Setting `draft: true` on an existing post and re-building removes it from the home page, sitemap, and RSS feed.
- [ ] E2E-4: The RSS feed at `/feed.xml` validates against the W3C Feed Validation Service.
- [ ] E2E-5: Social card meta tags (`og:title`, `og:description`, `og:image`, `twitter:card`) are present on every post page and render correctly in the Facebook Sharing Debugger and Twitter Card Validator.
- [ ] E2E-6: Deploying to Vercel via `git push` triggers a build that completes in under 60 seconds for ≤ 50 posts.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Empty | Zero published posts in `content/posts/` | Hero + bio with a "Coming soon — stay tuned" message where the grid would be. |
| Loading | N/A (static site — no client fetch for content) | Instant paint; skeleton only for dark-mode toggle hydration (< 100 ms flash). |
| Populated | ≥ 1 published post | Full hero → featured card → content grid. |
| Error (build) | Malformed frontmatter in a `.md` file | Build fails with a clear Zod validation error naming the file and the missing/invalid field. |
| Error (404) | User navigates to non-existent `/posts/xyz` | Custom 404 page with "Post not found" message and link back to home. |
| Filtered empty | Category tab selected but no posts in that category | Grid area shows "No [category] posts yet." |

## Non-goals

- No CMS, admin panel, or database — content lives in Git as Markdown files.
- No comments system (Disqus, Giscus, etc.) in v1.
- No newsletter/email signup in v1.
- No search functionality in v1 (tag filtering is sufficient).
- No analytics dashboard — defer to Vercel Analytics or Plausible added post-launch.
- No i18n / multi-language support.
- No image optimization pipeline beyond what `next/image` provides out of the box.

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| Two posts have `featured: true` | Build | The most recent by `date` wins the hero slot; the other appears in the grid normally. |
| Post has no `cover` image | UI | Falls back to a default gradient card with the post title rendered as text. |
| Markdown contains raw HTML | Build | Passed through safely via `rehype-raw`; no XSS risk since content is author-controlled. |
| Very long post title (> 120 chars) | UI | Truncated with ellipsis on cards; full title on detail page. |
| Tag contains spaces or special chars | Build / URL | Slugified via `slugify()` — e.g. "AI Safety" → `ai-safety`. |
| `externalUrl` is set on a post | UI | Card "→" link opens the external URL in a new tab instead of navigating to `/posts/[slug]`. Detail page still exists for SEO but includes a prominent "View original →" link. |
| Post date is in the future | Build | Post excluded from production build (treated like `draft: true`). |
| Cover image is an SVG vs raster | UI | SVGs render inline for crispness; rasters go through `next/image` for optimization. |

## External Dependencies

_No docker-compose services required. Fully static._

- **Next.js 14+** — framework (App Router with static export or SSG via `output: 'export'` or Vercel default).
- **Tailwind CSS 3+** — styling, dark mode via `class` strategy.
- **gray-matter** — YAML frontmatter parsing from Markdown files.
- **next-mdx-remote** or **contentlayer** — Markdown/MDX rendering with plugin support.
- **rehype-pretty-code** (Shiki) — syntax highlighting for code blocks.
- **rehype-slug** + **rehype-autolink-headings** — heading anchors.
- **Zod** — frontmatter schema validation at build time.
- **Vercel** — hosting and deployment (zero-config for Next.js).
- **Vercel Analytics** _(optional post-launch)_ — lightweight, privacy-friendly analytics.

## Directory Structure

```
├── app/
│   ├── layout.tsx              # Root layout: fonts, theme provider, nav, footer
│   ├── page.tsx                # Home: hero + featured + grid
│   ├── posts/
│   │   └── [slug]/
│   │       └── page.tsx        # Post detail
│   ├── tags/
│   │   └── [tag]/
│   │       └── page.tsx        # Tag listing
│   ├── feed.xml/
│   │   └── route.ts            # RSS generation
│   └── sitemap.ts              # Dynamic sitemap
├── components/
│   ├── Nav.tsx
│   ├── Hero.tsx
│   ├── FeaturedCard.tsx
│   ├── PostCard.tsx
│   ├── ContentGrid.tsx
│   ├── CategoryFilter.tsx
│   ├── TagChip.tsx
│   ├── ThemeToggle.tsx
│   └── Footer.tsx
├── content/
│   └── posts/                  # All .md files live here
│       ├── my-first-post.md
│       └── ...
├── lib/
│   ├── posts.ts                # Read/parse/sort/filter posts
│   ├── schema.ts               # Zod frontmatter schema
│   └── site.ts                 # SiteProfile config
├── public/
│   └── assets/
│       ├── authors/
│       │   └── jp.jpg
│       └── blog/
│           └── <post-slug>/
│               └── cover.svg
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## Open Questions

- [ ] Custom domain? (e.g. `iraguha.dev`, `jeanpaul.dev`, or similar)
- [ ] Preferred color palette / accent color, or should it closely mirror breviu.com's minimal dark aesthetic?
- [ ] Include a `/uses` page (tools/stack you use daily) in v1?
- [ ] Include a resume/CV PDF download link in the nav or hero?
- [ ] Any existing blog posts or project write-ups to migrate as seed content?

## Post-Implementation Notes

_Filled when status → complete. Not required for prototypes._

- ...