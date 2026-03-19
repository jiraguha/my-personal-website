# 007 — Post Search

> Status: `complete`
> Mode: `full`
> Date: 2026-03-19

## Intent

Visitors can search across all posts (blogs, projects, talks, shorts) using a discrete search icon in the posts toolbar that expands into a full input on interaction. Search is instant, client-side, and fuzzy — filtering the content grid in real time as the user types. No server, no API, no external service.

## Shared Schema

```typescript
// src/shared/schemas/search.schema.ts
import { z } from "zod";
import { ContentCategorySchema } from "./site.schema";

export const SearchEntrySchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  category: ContentCategorySchema,
  date: z.string(),
});

export type SearchEntry = z.infer<typeof SearchEntrySchema>;
```

## API Acceptance Criteria

- [x] API-1: `SearchEntrySchema` is a Zod schema in `src/shared/schemas/search.schema.ts` with fields: `slug`, `title`, `summary`, `tags` (string array), `category` (ContentCategory), `date`. It validates correctly via `.parse()`.
- [x] API-2: `toSearchEntry(post: PostCard)` extracts only the search-relevant fields from a PostCard — no body content, no cover image, no `featured` flag.
- [x] API-3: `createSearchIndex(posts: PostCard[])` builds a Fuse.js index from PostCard[], configured with weighted keys: title (0.4), summary (0.3), tags (0.3), threshold 0.35, `ignoreLocation: true`.
- [x] API-4: `searchPosts(index, query)` returns a `Set<string>` of matching slugs. It enforces a minimum query length of 2, caps input at 100 characters, and strips special characters before matching.
- [x] API-5: Search is entirely client-side. No API route, no server function, no external search service.

## UI Acceptance Criteria

- [x] UI-1: **Collapsed state** — by default, search renders as a small magnifying glass icon button at the top-left of the posts toolbar row, opposite the category filter tabs.
  ```
  ┌─────────────────────────────────────────────────────┐
  │  🔍                        [All][Blog][...][Shorts] │
  │                                                      │
  │  ┌──────┐ ┌──────┐ ┌──────┐                         │
  │  │ Card │ │ Card │ │ Card │                         │
  │  └──────┘ └──────┘ └──────┘                         │
  └─────────────────────────────────────────────────────┘
  ```
- [x] UI-2: **Expanded state** — clicking the icon or pressing `/` expands into a text input with a search icon on the left and a clear button (`X`) on the right (visible only when input is non-empty). Styled with:
  - Background: `gray-100` / `gray-900` (dark)
  - Border: `gray-300` / `slate-700` (dark), transitions to `indigo-500` on focus
  - Text: `gray-900` / `slate-200` (dark)
  - Placeholder: `Search posts...` in `gray-500` / `slate-500` (dark)
  - Width: ~250px on desktop, full-width on mobile
  - Collapses back to icon on blur when input is empty
- [x] UI-3: **Instant filtering** — as the user types, the content grid filters in real time (debounced at 150ms). The category tab selection is preserved — search operates within the active category filter.
- [x] UI-4: **Search scope** — queries match against title, summary, and tag names. A query like "kubernetes" matches a post with "kubernetes" in its tags or summary.
- [x] UI-5: **Fuzzy matching** — Fuse.js provides fuzzy search so minor typos are tolerated and partial matches work (threshold 0.35).
- [x] UI-6: **Result count** — when a search query is active (≥ 2 chars), a small muted label below the search bar shows: `3 results` or `No results found`.
- [x] UI-7: **Empty state** — when the search returns no results, the grid area shows a centered message: "No posts matching '[query]'" with a "Clear search" link.
- [x] UI-8: **Clear behavior** — clicking the `X` button or pressing `Escape` clears the search input, collapses the search bar, and restores the full content grid (respecting the active category filter).
- [x] UI-9: **Keyboard shortcut** — pressing `/` (when not focused on another input) expands and focuses the search bar.
- [x] UI-10: **Combined with category filter** — search and category filter work together. Selecting "Talks" + typing "safety" shows only talks matching "safety". Clearing the search shows all talks again. Switching categories while searching re-filters against the new category.
- [x] UI-11: **Mobile layout** — on mobile (≤ 640px via `sm:` breakpoint), the search bar and category tabs stack vertically. Both remain visible without horizontal scrolling.
- [x] UI-12: **Accessibility** — the search input has `role="searchbox"`, `aria-label="Search posts"`, and the results grid has `aria-live="polite"` so screen readers announce changes.

## Integration Acceptance Criteria

- [x] E2E-1: Clicking the search icon expands the input. Typing "kubernetes" filters the grid to only posts with "kubernetes" in their title, summary, or tags.
- [x] E2E-2: Typing a query while the "Talks" category is selected filters only within talks.
- [x] E2E-3: Clearing the search input restores the full grid for the active category.
- [x] E2E-4: Pressing `/` expands and focuses the search bar. Pressing `Escape` clears, collapses, and blurs it.
- [x] E2E-5: A query with zero matches shows the "No posts matching" empty state with a "Clear search" link.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Collapsed | Default, no query active | Small magnifying glass icon button |
| Expanded idle | Clicked or focused, no query yet | Full input with placeholder "Search posts...", collapses on blur |
| Active | Query of ≥ 2 characters | Input stays open, result count visible below, grid filtered |
| No results | Query matches nothing in current category | Empty grid with "No posts matching 'xyz'" and "Clear search" link |
| Combined filter | Query active + category tab selected | Grid shows only posts matching both query and category |

## Non-goals

- No full-text body search — title, summary, and tags are sufficient for a portfolio site.
- No search results page or separate `/search` route — search filters the existing grid in place.
- No search analytics or "popular searches" tracking.
- No server-side search or external service (Algolia, Typesense, etc.).
- No URL query parameter sync (e.g. `?q=kubernetes`) — search state is ephemeral.

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| Query is a single character | Search | No filtering until ≥ 2 characters to avoid overly broad matches. |
| Query matches a tag but not title/summary | Search | Post is still shown — tags are part of the search index. |
| User pastes a long string | Input | Input is capped at 100 characters. Excess is truncated. |
| Special characters in query (`#`, `@`, etc.) | Search | Stripped or escaped before matching. No regex injection. |
| Very fast typing | Search | Debounced at 150ms — only the final value triggers a filter pass. |
| Search bar + category filter + trending tag click | Interaction | Clicking a trending tag navigates to `/tags/[tag]` (leaves the home page). Search state is not preserved across navigation. |
| Site has only 1 post | Search | Search bar still renders and functions. Filtering a single-item list is fine. |
| All posts match the query | Search | Full grid shown. Result count reads "12 results" (or whatever the total is). |
| Click outside expanded empty search | UI | Search bar collapses back to icon. |

## Directory Structure (additions to spec 001)

```
├── components/
│   └── PostSearch.tsx           # Search icon button + expandable input
├── lib/
│   └── search.ts               # Fuse.js wrapper: createSearchIndex, searchPosts
```

## External Dependencies

- **`fuse.js`** _(v7, ~6 KB gzipped)_ — lightweight fuzzy search library. Configured with keys: `["title", "summary", "tags"]` and threshold 0.35.

## Open Questions

_All resolved._

- Search is ephemeral (no URL param) — decided in v1, may revisit later.
- Fuse.js is used — the 6 KB is worth it for fuzzy matching quality.
- Search is in the posts section only, not global nav.

## Post-Implementation Notes

- Fuse.js v7 used for fuzzy matching with weighted keys (title 0.4, summary 0.3, tags 0.3) and threshold 0.35.
- Search bar is discrete by default (icon-only), expands on click or `/` shortcut — user feedback requested a less intrusive design.
- No `PostsToolbar` wrapper created — toolbar layout handled directly in `ContentGrid.tsx` with flexbox.
- The `handleClearSearch` in ContentGrid resets query to `""`, which triggers the PostSearch component to collapse.
- 22 unit tests cover schema validation, index creation, search matching, sanitization, and edge cases.
- 12 E2E tests cover filtering, category combo, clear, keyboard shortcuts, and empty state.
