# 005 — Trending Tags

> Status: `complete`
> Mode: `full`
> Date: 2026-03-18

## Intent

Visitors see a curated row of trending tags on the home page that surface what Jean-Paul is actively writing about. Each tag is clickable (navigates to `/tags/[tag]`), and the trend score is computed from a mix of tag frequency (how many posts use it) and recency (how recent those posts are). Tags that appear in many recent posts rank highest; tags only used in old posts fade out. This gives the site a living, dynamic feel without any manual curation.

## Shared Schema

```typescript
// src/shared/schemas/tags.schema.ts

/** Scored tag ready for display */
export const TrendingTagSchema = z.object({
  tag: z.string(),              // Normalized slug, e.g. "ai-safety"
  displayName: z.string(),      // Display form from most recent post, e.g. "AI Safety"
  count: z.number().int().min(1), // Total published posts with this tag
  score: z.number().min(0).max(100), // Normalized trend score 0–100
  rank: z.number().int().min(1),    // 1 = highest trend
});
export type TrendingTag = z.infer<typeof TrendingTagSchema>;

/**
 * Trend Score Formula:
 *
 *   score(tag) = frequency_score × 0.4 + recency_score × 0.6
 *
 * Where:
 *   frequency_score = count(tag) / max_count_across_all_tags   → normalized 0–1
 *   recency_score   = avg( decay(post_date) for each post with this tag )
 *   decay(date)     = exp( -λ × days_since(date) )
 *   λ (decay rate)  = 0.01  → half-life ≈ 69 days (~2.3 months)
 *
 * Raw scores are then normalized to 0–100 across all tags.
 */
```

## API Acceptance Criteria

- [x] API-1: `computeTrendingTags(topN?)` scans all published (non-draft) posts, collects tag usage, computes the trend score per tag, and returns a `TrendingTag[]` sorted by score descending (ties broken alphabetically). Default topN = 5.
- [x] API-2: The trend score uses the weighted formula: `score = frequency_normalized × 0.4 + recency_normalized × 0.6`. The decay function is exponential with λ = 0.01 (half-life ≈ 69 days). Raw scores are normalized to 0–100.
- [x] API-3: `computeTrendingTags()` is called in Home with `topN = 5`. The N is a function argument — not a config file constant.
- [x] API-4: Tags with only 1 post are eligible. Draft posts are excluded (they don't appear in `getAllPosts()` in production). Tags with 0 posts cannot exist.
- [x] API-5: The `/tags/[tag]` pages work unchanged. Clicking a trending tag chip navigates there.
- [x] API-6: Scoring is computed synchronously on first render and cached — no API calls, no async.

## UI Acceptance Criteria

- [x] UI-1: **Trending tags row** — a horizontal section on the home page, positioned between the featured card and the content grid. Shows the top 5 trending tags as clickable chips.
- [x] UI-2: **Section label** — the `SectionDivider` component renders `— TRENDING —` (centered, uppercase, monospace, muted, horizontal rules on either side) above the chip row.
- [x] UI-3: **Chip design** — each tag chip shows:
  - A `#` prefix + display name (e.g. `#ai-safety`).
  - A small `×N` count in muted text.
  - Visual weight by rank: rank 1–2 = violet border/text, rank 3–5 = indigo border/text, rank 6+ = muted gray.
  - `rounded-md` (square-ish) border style.
- [x] UI-4: **Chip interaction** — hover lifts chip (`-translate-y-px`) with a color-matched glow. Click navigates to `/tags/[tag]`.
- [x] UI-5: **Layout** — chips wrap on desktop (centered). On mobile: single-row horizontal scroll with hidden scrollbar and a right-edge fade-out hint.
- [x] UI-6: **Empty state** — if fewer than 3 tags exist, `computeTrendingTags()` returns `[]` and `TrendingTags` renders nothing.
- [x] UI-7: **Tag page badge** — on `/tags/[tag]`, a `🔥 Trending` badge appears next to the `#tag` heading if the tag is in the top 5. Otherwise no badge.

## Integration Acceptance Criteria

- [ ] E2E-1: The `— TRENDING —` section is visible on the home page.
- [ ] E2E-2: The trending row contains chips with `#` prefix and `×N` count.
- [ ] E2E-3: Clicking a trending chip navigates to `/tags/[tag]` and shows the correct post list.
- [ ] E2E-4: A trending tag's detail page (`/tags/[tag]`) shows the `🔥 Trending` badge.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Hidden | < 3 unique tags across all posts | No trending section rendered. |
| Populated | ≥ 3 tags | Up to 5 chips sorted by score; top 2 violet, next 3 indigo. |
| Single dominant | One tag scores far above others | That chip is violet; the rest indigo or muted. |
| Even spread | All tags similar scores | Tiers still apply by rank position, regardless of score gap. |

## Non-goals

- No tag management UI — tags come from post frontmatter only.
- No configurable weights via UI — the 0.4/0.6 split and λ are code constants.
- No `/tags` index page in v1.
- No animated or real-time score updates.
- Score is not surfaced to the visitor — visual weight communicates importance.

## Edge Cases

| Scenario | Expected |
|----------|----------|
| Two tags have identical scores | Secondary sort by tag name (alphabetical) for deterministic ordering. |
| Tag in a draft post only | Excluded — drafts don't appear in `getAllPosts()` in production. |
| Tag name casing differs across posts (`AI-Safety` vs `ai-safety`) | Normalized to lowercase slug for matching; `displayName` from most recent post. |
| All posts are from the same day | All recency scores equal → ranking by frequency only. |
| Fewer than 3 tags total | `computeTrendingTags()` returns `[]`; section hidden. |

## Directory Structure

```
src/
├── shared/schemas/
│   └── tags.schema.ts          # TrendingTag Zod schema
├── ui/
│   ├── lib/
│   │   └── trending.ts         # computeTrendingTags(), getTrendingTagSet(), decay logic
│   ├── components/
│   │   ├── TrendingTags.tsx    # Horizontal chip row
│   │   └── SectionDivider.tsx  # Shared — LABEL — divider (also used by Featured, Posts)
│   └── pages/
│       ├── Home.tsx            # Updated: TrendingTags below featured
│       └── TagPage.tsx         # Updated: 🔥 Trending badge
```

## External Dependencies

_None. Pure computation using `Math.exp()`. No new packages._

## Post-Implementation Notes

- Promoted from prototype via `/spec-promote 005-trending-tags` on 2026-03-19.
- topN defaulted to 5 (not 8) — configured at the call site in Home.tsx, not via lib/site.ts.
- Chips use `rounded-md` and `#` prefix — decided during prototype phase.
- `SectionDivider` extracted as a shared component (also used by Featured and Posts sections).
- TagChip.tsx was not modified — TrendingTags uses its own chip rendering with tier styling.
- portfolio.e2e.ts updated: "Projects, Writing, Talks & Code" h2 replaced by "Posts" SectionDivider.
- shorts.e2e.ts updated: removed stale reference to the same h2.
