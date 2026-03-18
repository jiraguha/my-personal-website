# 004 — Short Notes Content Category

> Status: `implementing`
> Mode: `prototype`
> Date: 2026-03-18

## Intent

Jean-Paul can publish quick, low-friction content — a TIL, a hot take, a useful command, a link with commentary — as a "short" alongside his longer blog posts, projects, and talks. Shorts appear in the main content grid with a distinct visual treatment (no cover image, compact card) and can be filtered via the existing category tab bar. They lower the publishing barrier so the site stays active between deep-dive posts.

## Shared Schema

```typescript
// src/shared/schemas/site.schema.ts (modification to spec 001)

// Update the ContentCategory union
export type ContentCategory = "blog" | "project" | "talk" | "short";

// Shorts use the same PostFrontmatter from spec 001, with these conventions:
// - category: "short"
// - cover: omitted (shorts don't have cover images)
// - summary: optional (the full short is typically short enough to be its own summary)
// - No minimum word count — can be as brief as a single paragraph or code snippet

/**
 * Example frontmatter for a short:
 *
 * ---
 * title: "TIL: kubectl debug lets you attach ephemeral containers"
 * slug: til-kubectl-debug
 * date: 2026-03-18
 * summary: ""
 * tags: ["kubernetes", "devtools"]
 * category: short
 * ---
 *
 * `kubectl debug` attaches an ephemeral container to a running pod.
 * No need to rebuild images with debug tools baked in.
 *
 * ```bash
 * kubectl debug -it my-pod --image=busybox --target=my-container
 * ```
 *
 * Changed how I debug production issues entirely.
 */
```

## API Acceptance Criteria

- [ ] API-1: The `ContentCategory` type is extended to include `"short"`. Zod validation accepts `category: "short"` in frontmatter.
- [ ] API-2: Shorts are stored as Markdown files in the same `content/posts/` directory as other content — no separate folder. The `category` field is the discriminator.
- [ ] API-3: `getStaticProps` on the index page includes shorts in the "all" content list, sorted by date alongside blogs, projects, and talks.
- [ ] API-4: Shorts are eligible for the `/tags/[tag]` pages — they appear in tag listings like any other post.
- [ ] API-5: Shorts are **not** eligible for the featured/hero slot. The featured post logic (`featured: true`) filters to `category !== "short"`.
- [ ] API-6: Shorts are included in the RSS feed at `/feed.xml`. For shorts without a `summary`, the full Markdown body (truncated at 280 characters) is used as the feed description.
- [ ] API-7: Shorts are included in `sitemap.xml` and have their own detail pages at `/posts/[slug]` like any other post.
- [ ] API-8: A new count is exposed to the index page: `{ all: N, blog: N, project: N, talk: N, short: N }` for the category filter tabs.

## UI Acceptance Criteria

- [ ] UI-1: **Category filter tab** — "Shorts" is added as a new tab in the horizontal filter bar on the home page, after "Talks". Selecting it filters the grid to shorts only.
- [ ] UI-2: **Grid card (compact)** — short cards have a distinct, compact design:
  - No cover image area — the card is text-only.
  - Shows: a small `SHORT` or `⚡ SHORT` label/badge (in the accent color), the title, the first 2 lines of body text (rendered Markdown, not raw), the date, and tag chips.
  - Card height is shorter than a standard post card — roughly half the height.
  - The card background uses a subtle differentiation: a faint border or slightly lighter surface (`#111827` vs `#0B0F19`) so shorts are visually distinct in a mixed grid without breaking cohesion.
- [ ] UI-3: **Grid layout** — in the "All" view, short cards occupy the same column width as regular cards but are shorter in height. No special grid placement — they sit in normal document flow sorted by date.
- [ ] UI-4: **Detail page** — shorts get the same `/posts/[slug]` detail page as other content, but with a leaner layout:
  - No cover image header.
  - The `SHORT` badge appears next to the date.
  - Body content renders at the same width and with the same Markdown features (syntax highlighting, mermaid diagrams if used, etc.).
  - Back-to-home link at the top.
- [ ] UI-5: **Empty state** — if the "Shorts" tab is selected but no shorts exist, the grid shows "No shorts yet."
- [ ] UI-6: **Mobile** — compact cards stack naturally in single-column layout. The shorter height is preserved.

## Integration Acceptance Criteria

- [ ] E2E-1: Adding a `.md` file with `category: short` to `content/posts/` and building produces a compact card on the home page and a detail page at `/posts/[slug]`.
- [ ] E2E-2: The "Shorts" tab in the category filter shows only short-category posts. The "All" tab shows shorts mixed in with other content, sorted by date.
- [ ] E2E-3: A short with `featured: true` does **not** appear in the hero featured slot — it appears in the grid only.
- [ ] E2E-4: A short with `tags: ["kubernetes"]` appears on the `/tags/kubernetes` page alongside regular posts with that tag.
- [ ] E2E-5: The RSS feed includes shorts with the truncated body as the description.
- [ ] E2E-6: Cover generation (spec 002) skips posts with `category: "short"` entirely — no Nano Banana Pro API call, no fallback gradient needed.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Empty | No shorts published | "Shorts" tab shows count of 0. Selecting it shows "No shorts yet." |
| Populated | ≥ 1 short exists | Compact cards in grid. "Shorts" tab shows count. |
| Mixed grid | "All" tab with shorts + regular posts | Shorts appear as compact cards interspersed chronologically with full-height cards. |
| Detail page | Visitor clicks a short card | Lean detail page — no cover, SHORT badge, full body rendered. |
| Error | Malformed frontmatter on a short | Same Zod validation error as any other post — build fails with file + field info. |

## Non-goals

- No separate `/shorts` index page — shorts live in the main grid, filtered by the tab.
- No Twitter/Mastodon-style threading or reply chains between shorts.
- No character limit enforced — "short" is a convention, not a constraint. A 500-word "short" is fine.
- No auto-publish from external sources (e.g. no Twitter-to-short sync).
- No distinct URL prefix (e.g. `/shorts/[slug]`) — shorts use the same `/posts/[slug]` namespace.

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| Short has a `cover` field set | UI | Cover is ignored. Compact card renders text-only regardless. Detail page also omits cover. |
| Short has `featured: true` | API | Ignored for the hero slot. Short appears in the grid normally. Build logs a warning: "Shorts cannot be featured." |
| Short has no `summary` and body is < 280 chars | RSS | Full body used as RSS description. |
| Short has no `summary` and body is > 280 chars | RSS | Body truncated at 280 chars with `…` appended. |
| Short has `autocover: true` (from spec 002) | Generator | Cover generation is skipped for shorts. `generate-covers.ts` filters by `category !== "short"`. |
| Grid has 10 shorts and 2 blog posts in "All" view | UI | All 12 cards sorted by date. The 2 blog cards are taller (with covers); the 10 short cards are compact. The grid handles mixed heights via CSS grid `auto` row sizing or masonry-style layout. |
| Short body contains only a code block | UI | Card preview shows the first line of the code block as a styled snippet. Detail page renders the full block with syntax highlighting. |
| Short body is a single sentence | UI | Card shows the full sentence (no truncation needed). Detail page renders it centered or with normal margins — no awkward whitespace. |

## Directory Structure

_No new directories. Shorts are `.md` files in the existing `content/posts/` folder._

```
├── content/
│   └── posts/
│       ├── my-deep-dive-blog.md          # category: blog
│       ├── my-oss-project.md             # category: project
│       ├── my-conference-talk.md         # category: talk
│       └── til-kubectl-debug.md          # category: short   ← NEW
├── components/
│   ├── PostCard.tsx                       # Updated: renders compact variant when category === "short"
│   ├── CategoryFilter.tsx                 # Updated: adds "Shorts" tab
│   └── ShortBadge.tsx                     # NEW: small "SHORT" label component
```

## External Dependencies

_None. This feature uses existing dependencies from spec 001. No new packages._

## Open Questions

- [ ] Badge style: plain text `SHORT` in accent color, or `⚡ SHORT` with an icon? Or a different icon (e.g. `Zap`, `PenLine`, `StickyNote` from Lucide)?
- [ ] Should shorts support a `via` or `source` frontmatter field for link-posts (sharing an external article with commentary)?
- [ ] In the "All" grid view, should mixed-height cards use CSS Grid with `auto` rows, or a masonry layout (e.g. CSS `columns` or a masonry library)?

## Post-Implementation Notes

_Filled when status → complete. Not required for prototypes._

- ...