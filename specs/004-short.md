# 004 — Short Notes Content Category

> Status: `complete`
> Mode: `full`
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

- [x] API-1: The `ContentCategory` type is extended to include `"short"`. Zod validation accepts `category: "short"` in frontmatter.
- [x] API-2: Shorts are stored as Markdown files in the same `content/posts/` directory as other content — no separate folder. The `category` field is the discriminator.
- [x] API-3: `getAllPosts()` on the data layer includes shorts in the "all" content list, sorted by date alongside blogs, projects, and talks.
- [x] API-4: Shorts are eligible for the `/tags/[tag]` pages — they appear in tag listings like any other post via `getPostsByTag()`.
- [ ] API-5: Shorts are **not** eligible for the featured/hero slot. `getFeaturedPost()` filters to `category !== "short"`.

## UI Acceptance Criteria

- [x] UI-1: **Category filter tab** — "Shorts" is added as a new tab in the horizontal filter bar on the home page, after "Talks". Selecting it filters the grid to shorts only.
- [x] UI-2: **Grid card (compact)** — short cards have a distinct, compact design:
  - No cover image area — the card is text-only.
  - Shows: a `⚡ SHORT` badge (in violet accent), the title, optional summary (2 lines), the date, and tag chips.
  - Card height is shorter than a standard post card.
  - The card uses a violet border to visually differentiate from regular cards.
- [x] UI-3: **Grid layout** — in the "All" view, short cards occupy the same column width as regular cards but are shorter in height. They sit in normal document flow sorted by date.
- [x] UI-4: **Detail page** — shorts get the same `/posts/[slug]` detail page as other content, but with a leaner layout:
  - No cover image header.
  - The `⚡ SHORT` badge appears next to the date.
  - Body content renders at the same width and with the same Markdown features.
  - Back-to-home link at the top.
- [x] UI-5: **Empty state** — if the "Shorts" tab is selected but no shorts exist, the grid shows "No shorts yet."
- [x] UI-6: **Mobile** — compact cards stack naturally in single-column layout. The shorter height is preserved.

## Integration Acceptance Criteria

- [ ] E2E-1: The "Shorts" tab is visible in the category filter bar and filters the grid to show only short-category posts.
- [ ] E2E-2: A short card in the grid is compact — no cover image area, shows `⚡ SHORT` badge.
- [ ] E2E-3: A short's detail page shows the `⚡ SHORT` badge and no cover image.
- [ ] E2E-4: A short with `featured: true` does **not** appear in the hero featured slot — it appears in the grid only.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Empty | No shorts published | "Shorts" tab shows. Selecting it shows "No shorts yet." |
| Populated | ≥ 1 short exists | Compact cards in grid. "Shorts" tab visible. |
| Mixed grid | "All" tab with shorts + regular posts | Shorts appear as compact cards interspersed chronologically with full-height cards. |
| Detail page | Visitor clicks a short card | Lean detail page — no cover, ⚡ SHORT badge, full body rendered. |
| Error | Malformed frontmatter on a short | Same Zod validation error as any other post — build warns with file + field info. |

## Non-goals

- No separate `/shorts` index page — shorts live in the main grid, filtered by the tab.
- No RSS feed support — RSS is not implemented in this project.
- No sitemap support — sitemap is not implemented in this project.
- No distinct URL prefix (e.g. `/shorts/[slug]`) — shorts use the same `/posts/[slug]` namespace.
- No character limit enforced — "short" is a convention, not a constraint.

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| Short has a `cover` field set | UI | Cover is ignored. Compact card renders text-only regardless. Detail page also omits cover. |
| Short has `featured: true` | Data | Ignored for the hero slot. `getFeaturedPost()` skips shorts. Short appears in the grid normally. |
| Short has no `summary` | UI | Card renders without summary paragraph. Detail page skips the summary line if empty. |
| Short body contains only a code block | UI | Detail page renders the full block with syntax highlighting. |

## Directory Structure

_No new directories. Shorts are `.md` files in the existing `content/posts/` folder._

```
├── src/content/
│   └── posts/
│       ├── my-deep-dive-blog.md          # category: blog
│       └── til-kubectl-debug.md          # category: short   ← NEW
├── src/ui/components/
│   ├── PostCard.tsx                       # Updated: renders compact variant when category === "short"
│   ├── CategoryFilter.tsx                 # Updated: adds "Shorts" tab
│   └── ShortBadge.tsx                     # NEW: ⚡ SHORT label component
```

## External Dependencies

_None. This feature uses existing dependencies from spec 001. No new packages._

## Post-Implementation Notes

- Promoted from prototype via `/spec-promote 004-short` on 2026-03-18.
- RSS and sitemap criteria removed — neither feature exists in this SPA; scope them to a future spec if/when added.
- `getFeaturedPost()` updated to `category !== "short"` — one-line fix, covered by unit + E2E tests.
- ShortBadge uses violet to distinguish from existing category badge colours (blue/green/orange).
- The `Post` interface in `test/lib/posts.test.ts` now includes `"short"` in the category union.
