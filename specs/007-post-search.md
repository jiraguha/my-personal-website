# 007 — Post Search

> Status: `implementing`
> Mode: `prototype`
> Date: 2026-03-19

## Intent

Visitors can search across all posts (blogs, projects, talks, shorts) using a search bar positioned at the top-left of the posts section, opposite the category filter tabs. Search is instant, client-side, and fuzzy — filtering the content grid in real time as the user types. No server, no API, no external service.

## Shared Schema

```typescript
// src/shared/schemas/search.schema.ts

/** Lightweight search index entry — one per post, built at build time */
export interface SearchEntry {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  category: ContentCategory;
  date: string;
}

/**
 * The search index is a JSON array of SearchEntry objects,
 * inlined into the page props at build time.
 *
 * For a site with ≤ 200 posts, the index is typically < 30 KB gzipped.
 * No need for a separate index file or lazy loading at this scale.
 */
```

## API Acceptance Criteria

- [ ] API-1: `getStaticProps` on the index page builds a `SearchEntry[]` array from all published posts and passes it to the client alongside the existing post list.
- [ ] API-2: The search index includes `title`, `summary`, `tags` (joined as a single string for matching), `category`, `date`, and `slug` per post. It does **not** include the full Markdown body (too large, unnecessary for this use case).
- [ ] API-3: Search is entirely client-side. No API route, no server function, no external search service.
- [ ] API-4: The search index is generated at build time and embedded in the page props. No separate `/search-index.json` endpoint needed for ≤ 200 posts.

## UI Acceptance Criteria

- [ ] UI-1: **Placement** — the search bar sits at the top-left of the posts section, on the same horizontal line as the category filter tabs (which are top-right). Together they form a single toolbar row above the content grid.
  ```
  ┌─────────────────────────────────────────────────────┐
  │  🔍 Search posts...          [All][Blog][...][Shorts]│
  │                                                      │
  │  ┌──────┐ ┌──────┐ ┌──────┐                         │
  │  │ Card │ │ Card │ │ Card │                         │
  │  └──────┘ └──────┘ └──────┘                         │
  └─────────────────────────────────────────────────────┘
  ```
- [ ] UI-2: **Input design** — a text input with a search icon (`Search` from Lucide) on the left and a clear button (`X`) on the right (visible only when input is non-empty). Styled to match the site's DA:
  - Background: `#111827` (gray-900)
  - Border: `#334155` (slate-700), transitions to `#6366F1` (indigo-500) on focus
  - Text: `#E2E8F0` (slate-200)
  - Placeholder: `Search posts...` in `#64748B` (slate-500)
  - Font: same as body (Inter or system sans), not monospace
  - Height matches the category filter tab bar
  - Width: ~250px on desktop, full-width on mobile (stacks above the tabs)
- [ ] UI-3: **Instant filtering** — as the user types, the content grid filters in real time (debounced at 150ms). Cards that don't match fade out or are removed. The category tab selection is preserved — search operates within the active category filter.
- [ ] UI-4: **Search scope** — queries match against title, summary, and tag names. A query like "kubernetes" matches a post titled "K8s Networking" if "kubernetes" is in its tags or summary.
- [ ] UI-5: **Fuzzy matching** — basic fuzzy search so that "k8s" matches "kubernetes", "ai" matches "AI Safety", and minor typos are tolerated. Use a lightweight library (Fuse.js, ~6 KB gzipped) or a simple substring + normalized match.
- [ ] UI-6: **Result count** — when a search query is active, a small muted label below the search bar shows: `3 results` or `No results found`.
- [ ] UI-7: **Empty state** — when the search returns no results, the grid area shows a centered message: "No posts matching '[query]'" with a "Clear search" link.
- [ ] UI-8: **Clear behavior** — clicking the `X` button or pressing `Escape` clears the search input and restores the full content grid (respecting the active category filter).
- [ ] UI-9: **Keyboard shortcut** — pressing `/` (when not focused on another input) focuses the search bar. This is a common convention (GitHub, Slack, etc.).
- [ ] UI-10: **Combined with category filter** — search and category filter work together. Selecting "Talks" + typing "safety" shows only talks matching "safety". Clearing the search shows all talks again. Switching categories while searching re-filters against the new category.
- [ ] UI-11: **Mobile layout** — on mobile (≤ 768px), the search bar stacks above the category tabs as a full-width row. Both remain visible without horizontal scrolling.
- [ ] UI-12: **Accessibility** — the search input has `role="searchbox"`, `aria-label="Search posts"`, and the results area has `aria-live="polite"` so screen readers announce result count changes.

## Integration Acceptance Criteria

- [ ] E2E-1: Typing "kubernetes" in the search bar filters the grid to only posts with "kubernetes" in their title, summary, or tags.
- [ ] E2E-2: Typing a query while the "Talks" category is selected filters only within talks.
- [ ] E2E-3: Clearing the search input restores the full grid for the active category.
- [ ] E2E-4: Pressing `/` focuses the search bar. Pressing `Escape` clears and blurs it.
- [ ] E2E-5: A query with zero matches shows the "No posts matching" empty state.
- [ ] E2E-6: The search index adds < 30 KB (gzipped) to the page payload for a site with 50 posts.
- [ ] E2E-7: Search filtering completes in < 50ms for 200 posts (no perceptible lag).

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Idle | Search bar empty, no query active | Full content grid, search bar shows placeholder "Search posts..." |
| Active | User is typing or has a query | Grid filters in real time. Result count label visible. Clear button visible in input. |
| No results | Query matches nothing in current category | Empty grid with "No posts matching 'xyz'" message and "Clear search" link. |
| Combined filter | Query active + category tab selected | Grid shows only posts matching both the query and the category. |

## Non-goals

- No full-text body search — searching inside Markdown content is out of scope. Title, summary, and tags are sufficient for a portfolio site.
- No search results page or separate `/search` route — search filters the existing grid in place.
- No search analytics or "popular searches" tracking.
- No server-side search or external service (Algolia, Typesense, etc.) — overkill for this scale.
- No URL query parameter sync (e.g. `?q=kubernetes`) in v1 — search state is ephemeral.

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

## Directory Structure (additions to spec 001)

```
├── components/
│   ├── PostSearch.tsx           # NEW: search input + logic
│   └── PostsToolbar.tsx        # NEW: wrapper row containing PostSearch (left) + CategoryFilter (right)
├── lib/
│   └── search.ts               # NEW: fuzzy search function (wraps Fuse.js or custom matcher)
```

## External Dependencies

- **`fuse.js`** _(recommended, ~6 KB gzipped)_ — lightweight fuzzy search library. Configured with keys: `["title", "summary", "tags"]` and a reasonable threshold (0.3–0.4). Alternatively, a zero-dependency substring matcher can be implemented if the extra 6 KB is undesirable.

## Open Questions

- [ ] Should search persist in the URL as a query param (`?q=kubernetes`) so results are shareable / bookmarkable, or keep it purely ephemeral?
- [ ] Is Fuse.js worth the 6 KB, or is a simple `includes()` + lowercase normalization sufficient for ≤ 200 posts?
- [ ] Should the search bar be visible globally (in the nav) or only in the posts section? A global search could also find tags and navigate to `/tags/[tag]`.

## Post-Implementation Notes

_Filled when status → complete. Not required for prototypes._

- ...
