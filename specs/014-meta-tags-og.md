# 014 — Per-Post Meta Tags & Category-Aware OG Images

> Status: `implementing`
> Mode: `prototype`
> Date: 2026-03-19

## Intent

Every page on the site — home, post detail, tag listing, talk landing — emits complete, accurate Open Graph and Twitter Card meta tags so that links shared on LinkedIn, Twitter/X, Slack, Discord, and iMessage render rich previews with the correct title, description, image, and URL. OG images are category-aware: blog posts and projects use their Nano Banana Pro–generated covers (`public/assets/covers/<slug>/og.png`), talks show a "▶ Slides" overlay on the cover, shorts get a branded text-card (no cover image), and the home page uses a site-wide default. No broken previews, no missing images, no generic fallbacks.

## Shared Schema

```typescript
// src/shared/schemas/meta.schema.ts
import { z } from "zod";

export const OGTypeSchema = z.enum(["website", "article", "profile"]);
export type OGType = z.infer<typeof OGTypeSchema>;

export const OGImageSchema = z.object({
  url: z.string(),                // Absolute URL to the image
  width: z.number(),
  height: z.number(),
  alt: z.string(),
  type: z.string(),               // "image/png" or "image/jpeg"
});
export type OGImage = z.infer<typeof OGImageSchema>;

export const ArticleMetaSchema = z.object({
  publishedTime: z.string(),      // ISO 8601
  modifiedTime: z.string().optional(),
  author: z.string(),
  tags: z.array(z.string()),
  section: z.string(),            // category: "blog" | "project" | "short" | "talk"
});
export type ArticleMeta = z.infer<typeof ArticleMetaSchema>;

export const PageMetaSchema = z.object({
  title: z.string(),              // e.g. "Securing Agentic Systems | Jean-Paul Iraguha"
  description: z.string(),        // Post summary or site bio (≤ 160 chars)
  url: z.string(),                // Canonical URL, e.g. "https://iraguha.dev/posts/my-post"
  type: OGTypeSchema,
  image: OGImageSchema,
  siteName: z.string(),           // "Jean-Paul Iraguha"
  locale: z.string(),             // "en_US"
  twitterCard: z.enum(["summary_large_image", "summary"]),
  twitterSite: z.string().optional(), // from profile.socials.twitter
  article: ArticleMetaSchema.optional(),
  jsonLd: z.record(z.unknown()).optional(),
});
export type PageMeta = z.infer<typeof PageMetaSchema>;

/**
 * OG Image Strategy by Category:
 *
 * | Page              | OG Image Source                                      | Size      |
 * |-------------------|------------------------------------------------------|-----------|
 * | Home              | Static site-wide card: name + role + avatar           | 1200×630  |
 * | Blog post         | `og.png` from spec 011 (public/assets/covers/<slug>) | 1200×630  |
 * | Project post      | `og.png` from spec 011 (public/assets/covers/<slug>) | 1200×630  |
 * | Talk landing      | `og.png` with "▶ SLIDES" overlay badge               | 1200×630  |
 * | Short             | Generated text-card: title on dark background        | 1200×630  |
 * | Tag page          | Static site-wide card (same as home)                 | 1200×630  |
 * | 404               | Static site-wide card                                | 1200×630  |
 */
```

## API Acceptance Criteria

> Note: "API" here refers to the build-time utility layer (`src/ui/lib/`), not a REST API.
> This site uses Vike SSR with `+Head.tsx` components for `<head>` management.

- [ ] API-1: A `buildPageMeta(page, post?)` utility in `src/ui/lib/meta.ts` produces a complete `PageMeta` object for any page type (home, post, tag, 404). It imports `siteProfile` from `src/ui/lib/site.ts` for name/bio/socials.
- [ ] API-2: `src/ui/lib/site.ts` exports a `SITE_URL` constant (e.g. `"https://iraguha.dev"`) used for building absolute canonical and OG image URLs. The value comes from `profile.json` (add a `siteUrl` field to `SiteProfileSchema`).
- [ ] API-3: A reusable `<MetaTags meta={PageMeta} />` React component in `src/ui/components/meta-tags.tsx` renders the full set of OG, Twitter, canonical, and article meta tags as JSX — to be used inside each `+Head.tsx`.
- [ ] API-4: Every page's `+Head.tsx` calls `buildPageMeta()` and renders `<MetaTags />`, producing:
  ```html
  <!-- Primary -->
  <title>{title}</title>
  <meta name="description" content="{description}" />
  <link rel="canonical" href="{url}" />

  <!-- Open Graph -->
  <meta property="og:type" content="{type}" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{description}" />
  <meta property="og:image" content="{image.url}" />
  <meta property="og:image:width" content="{image.width}" />
  <meta property="og:image:height" content="{image.height}" />
  <meta property="og:image:alt" content="{image.alt}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:site_name" content="{siteName}" />
  <meta property="og:locale" content="{locale}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{description}" />
  <meta name="twitter:image" content="{image.url}" />
  <meta name="twitter:image:alt" content="{image.alt}" />

  <!-- Article (posts only) -->
  <meta property="article:published_time" content="{date}" />
  <meta property="article:author" content="{author}" />
  <meta property="article:tag" content="{tag}" />  <!-- one per tag -->
  <meta property="article:section" content="{category}" />
  ```
- [ ] API-5: All `og:image` URLs are **absolute** (e.g. `https://iraguha.dev/assets/covers/my-post/og.png`), not relative paths.
- [ ] API-6: **Blog / Project** OG images resolve to `public/assets/covers/<slug>/og.png` (generated by spec 011). If no `og.png` exists for the slug, fall back to the site-wide default card.
- [ ] API-7: **Talk** OG images use the `og.png` with a "▶ SLIDES" badge composited in the bottom-right corner. This compositing happens at build time via `scripts/generate-og.ts` which reads the base `og.png` from `public/assets/covers/<slug>/` and overlays the badge using `sharp`.
- [ ] API-8: **Short** OG images are generated at build time as text-cards: the post title rendered in large white monospace text on the DA dark background (`#0B0F19`) with a small `⚡ SHORT` badge and the site name. Generated via `sharp` or a simple SVG→PNG pipeline in `scripts/generate-og.ts`.
- [ ] API-9: **Home / Tag / 404** pages use a static site-wide OG image (`public/assets/og-default.png`) showing Jean-Paul's name, role, and avatar — created once manually or via a build script.
- [ ] API-10: Every post detail page includes JSON-LD `Article` structured data matching the OG meta (title, description, author, datePublished, image, keywords), rendered via `<script type="application/ld+json">` in `+Head.tsx`.
- [ ] API-11: The home page includes JSON-LD `Person` structured data (name, role, url, sameAs for socials from `profile.json`).
- [ ] API-12: Meta descriptions are capped at 160 characters. If `summary` exceeds this, it's truncated with `…`.

## UI Acceptance Criteria

- [ ] UI-1: No visible UI changes — meta tags and JSON-LD are in `<head>` and `<script type="application/ld+json">` only.
- [ ] UI-2: The OG images for all categories are visually consistent with the DA palette (dark background, violet/indigo accents, monospace text).

## Integration Acceptance Criteria

- [ ] E2E-1: Sharing a blog post URL on the Facebook Sharing Debugger shows the correct title, summary, and Nano Banana Pro–generated cover image.
- [ ] E2E-2: Sharing a talk URL on Twitter/X shows the cover with the "▶ SLIDES" badge overlay.
- [ ] E2E-3: Sharing a short URL on LinkedIn shows a text-card OG image with the short's title on a dark background.
- [ ] E2E-4: Sharing the home page URL shows the site-wide card with name, role, and avatar.
- [ ] E2E-5: Sharing a `/tags/ai-safety` URL shows the site-wide default card (not a broken image).
- [ ] E2E-6: Every post page passes the structured data test at https://search.google.com/test/rich-results with valid `Article` markup.
- [ ] E2E-7: Every `og:image` URL returns a 200 status, correct `Content-Type`, and an image of exactly 1200×630 pixels.
- [ ] E2E-8: A post with no cover image (generation skipped or failed) falls back to the site-wide default card — no broken `og:image` tag.

## Component States

| State | Condition | What the user sees (on share preview) |
|-------|-----------|--------------------------------------|
| Blog/Project with cover | `og.png` exists in `public/assets/covers/<slug>/` | Rich preview with Nano Banana Pro cover, title, summary. |
| Blog/Project without cover | `og.png` missing | Falls back to site-wide default card. |
| Talk with cover | `og.png` exists | Cover with "▶ SLIDES" badge overlay, title, summary. |
| Talk without cover | `og.png` missing | Site-wide default card. |
| Short | Always generated | Text-card: title in monospace on dark background, ⚡ SHORT badge. |
| Home page | Static asset | Name, role, avatar card. |
| Tag page | Static asset | Same site-wide default card. |
| 404 | Static asset | Same site-wide default card. |

## Non-goals

- No per-post custom OG images designed manually — everything is automated from covers (spec 011) or generated at build time.
- No dynamic OG image generation at request time (e.g. Vercel OG / `@vercel/og`) — all images are static PNGs built ahead of time.
- No Facebook App ID or Twitter Site ID configuration in v1 (optional, can add later).
- No Open Graph video tags for talks with `videoUrl` — just the image.
- No multi-image OG tags (only one `og:image` per page).

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| Post summary is empty | Meta | Falls back to first 160 chars of the Markdown body (stripped of formatting). If body is also empty, uses site bio from `profile.json`. |
| Post title contains quotes or special HTML chars | Meta | Properly escaped in meta tag `content` attributes (React handles this automatically in JSX). |
| Two posts have the same title | Meta | Each has a unique `og:url` (different slugs), so platforms distinguish them. |
| `og.png` exists but is corrupted or wrong dimensions | Build | Build-time validation checks dimensions. Logs a warning if not 1200×630. Fallback used. |
| Site base URL not configured | Build | Build fails with clear error: "Set siteUrl in src/content/profile.json". |
| Short title is very long (> 80 chars) | OG text-card | Title wraps to 2–3 lines in the generated image. Font size reduced to fit. |
| Talk has `externalSlides` (no Reveal rendering) | Meta | OG image uses the cover without the "▶ SLIDES" badge (no slides hosted on site to link to). |

## Pages Requiring `+Head.tsx` Changes

| Route | File | Current State | Change Needed |
|-------|------|---------------|---------------|
| `/` | `pages/index/+Head.tsx` | Title + description only | Add OG, Twitter, canonical, JSON-LD Person |
| `/posts/:slug` | `pages/posts/@slug/+Head.tsx` | Title + description only | Add OG, Twitter, canonical, article meta, JSON-LD Article |
| `/talks/:slug` | `pages/talks/@slug/+Head.tsx` | **Does not exist** | Create with OG, Twitter, canonical, article meta |
| `/tags/:tag` | `pages/tags/@tag/+Head.tsx` | Title + description only | Add OG, Twitter, canonical |
| `/404` | `pages/404/+Head.tsx` | Check if exists | Add OG, Twitter with site-wide defaults |

## Directory Structure (additions)

```
src/
├── shared/schemas/
│   └── meta.schema.ts             # NEW: PageMeta, OGImage, ArticleMeta Zod schemas
├── ui/
│   ├── lib/
│   │   ├── meta.ts                # NEW: buildPageMeta() utility
│   │   └── site.ts                # MODIFIED: add SITE_URL export
│   └── components/
│       └── meta-tags.tsx          # NEW: <MetaTags /> component for +Head.tsx
├── content/
│   └── profile.json               # MODIFIED: add "siteUrl" field
scripts/
│   └── generate-og.ts             # NEW: build-time OG image generation for shorts + talk overlays
public/
│   └── assets/
│       ├── og-default.png         # NEW: site-wide fallback (1200×630)
│       └── covers/
│           └── <slug>/
│               └── og.png         # EXISTING (from spec 011)
pages/
├── index/+Head.tsx                # MODIFIED
├── posts/@slug/+Head.tsx          # MODIFIED
├── talks/@slug/+Head.tsx          # NEW
├── tags/@tag/+Head.tsx            # MODIFIED
└── 404/+Head.tsx                  # NEW or MODIFIED
```

## External Dependencies

- **`sharp`** — already installed (spec 011). Used for compositing the "▶ SLIDES" badge on talk OG images and generating short text-cards.
- **No new packages required.**

## Open Questions

- [ ] Should the short text-card include tags as small chips below the title, or keep it minimal (title + badge only)?
- [ ] Should talk OG images with `videoUrl` set show a "▶ Watch" badge instead of "▶ SLIDES"?
- [ ] Worth generating a unique OG image for each tag page (e.g. "AI Safety — 5 posts" on a dark card), or is the site-wide default sufficient?

## Post-Implementation Notes

_Filled when status → complete. Not required for prototypes._

- ...
