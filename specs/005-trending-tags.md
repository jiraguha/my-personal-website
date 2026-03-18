# 005 — Trending Tags

> Status: `prototype`
> Mode: `prototype`
> Date: 2026-03-18

## Intent

Visitors see a curated row of trending tags on the home page that surface what Jean-Paul is actively writing about. Each tag is clickable (navigates to `/tags/[tag]`), and the trend score is computed from a mix of tag frequency (how many posts use it) and recency (how recent those posts are). Tags that appear in many recent posts rank highest; tags only used in old posts fade out. This gives the site a living, dynamic feel without any manual curation.

## Shared Schema

```typescript
// src/shared/schemas/tags.schema.ts

/** Raw data collected per tag at build time */
export interface TagUsage {
  tag: string;              // Normalized, e.g. "ai-safety"
  displayName: string;      // Original casing from first occurrence, e.g. "AI Safety"
  postSlugs: string[];      // All posts using this tag
  postDates: string[];      // Corresponding ISO dates for each post
  count: number;            // Total number of posts with this tag
  latestDate: string;       // Most recent post date using this tag
}

/** Scored tag ready for display */
export interface TrendingTag {
  tag: string;              // Slug form for URL
  displayName: string;      // Display form
  count: number;            // Total posts
  score: number;            // Computed trend score (0–100 normalized)
  rank: number;             // 1 = highest trend
}

/**
 * Trend Score Formula:
 *
 *   score(tag) = frequency_score × 0.4 + recency_score × 0.6
 *
 * Where:
 *   frequency_score = count(tag) / max_count_across_all_tags   → normalized 0–1
 *   recency_score   = avg( decay(post_date) for each post with this tag )  → normalized 0–1
 *   decay(date)     = exp( -λ × days_since(date) )
 *   λ (decay rate)  = 0.01  → half-life ≈ 69 days (~2.3 months)
 *
 * Final score is normalized to 0–100 across all tags.
 *
 * This means:
 * - A tag used in 5 posts all from this month scores very high.
 * - A tag used in 10 posts all from 2 years ago scores moderately (frequency helps, recency hurts).
 * - A tag used in 1 post from yesterday scores moderately (recency helps, frequency hurts).
 * - The 0.6 recency weight ensures freshness dominates over sheer volume.
 */
```

## API Acceptance Criteria

- [ ] API-1: At build time, a `computeTrendingTags()` function scans all published (non-draft) posts, collects tag usage data, computes the trend score per tag using the formula above, and returns a sorted `TrendingTag[]`.
- [ ] API-2: The trend score uses the weighted formula: `score = frequency_normalized × 0.4 + recency_normalized × 0.6`. The decay function is exponential with λ = 0.01 (half-life ≈ 69 days).
- [ ] API-3: `getStaticProps` on the index page includes the top N trending tags (default: 8, configurable in `lib/site.ts`).
- [ ] API-4: Tags with only 1 post are eligible for trending (a single very recent post can trend). Tags with 0 posts (orphaned) are excluded.
- [ ] API-5: The `/tags/[tag]` pages (from spec 001) continue to work unchanged. Clicking a trending tag navigates there.
- [ ] API-6: The trending tags data is purely build-time — no runtime computation, no API calls, no client-side scoring.

## UI Acceptance Criteria

- [ ] UI-1: **Trending tags row** — a horizontal section on the home page, positioned between the hero and the featured post (or between the featured post and the content grid — TBD). Displays the top 8 trending tags as clickable chips.
- [ ] UI-2: **Section label** — a subtle divider label: `TRENDING` (styled like the existing `FEATURED` and `PROJECTS, WRITING, ...` section dividers on breviu.com — centered, uppercase, monospace, muted color, horizontal rules on either side).
- [ ] UI-3: **Chip design** — each tag chip shows:
  - The tag display name (e.g. "AI Safety", "Kubernetes").
  - A small post count badge (e.g. `×5`) in muted text beside or below the tag name.
  - Visual weight scales with score: the top 1–2 tags use the primary accent color (`#7C3AED` text or border). The next 3–4 use the secondary accent (`#6366F1`). The remaining use muted (`#334155` border, `#94A3B8` text).
- [ ] UI-4: **Chip interaction** — on hover, chips elevate slightly (subtle `translateY(-1px)` + glow matching the chip's accent tier). Cursor is pointer. Click navigates to `/tags/[tag]`.
- [ ] UI-5: **Layout** — chips are horizontally centered, wrapping to a second line if needed. On mobile, the row is scrollable horizontally (single line, `overflow-x: auto`, no wrapping) with a subtle fade-out at the right edge to hint at scrollability.
- [ ] UI-6: **Empty state** — if fewer than 3 tags exist across all posts, the trending section is hidden entirely (not worth showing).
- [ ] UI-7: **Tag page enhancement** — on the `/tags/[tag]` detail page, show the tag's trend score as a small `🔥 Trending` badge next to the tag heading if the tag is in the top 8. Otherwise, no badge.

## Integration Acceptance Criteria

- [ ] E2E-1: A site with 10+ posts across 5+ tags displays a trending tags row on the home page with tags sorted by trend score (highest first).
- [ ] E2E-2: Publishing a new post with an existing tag and rebuilding moves that tag higher in the trending row (recency boost).
- [ ] E2E-3: Clicking a trending tag chip navigates to `/tags/[tag]` and displays the correct filtered post list.
- [ ] E2E-4: A site with fewer than 3 tags does not show the trending section.
- [ ] E2E-5: Removing all posts with a given tag and rebuilding removes that tag from the trending row.
- [ ] E2E-6: The trending row renders correctly on mobile (horizontal scroll) and desktop (centered, wrapping).

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Hidden | < 3 unique tags across all posts | No trending section rendered. |
| Populated | ≥ 3 tags, scores computed | Horizontal row of up to 8 tag chips, sorted by score, with visual weight tiers. |
| Single dominant | One tag used in many recent posts | That tag chip is visually prominent (accent color); others are muted. |
| Even spread | All tags have similar scores | Chips are visually uniform (all same accent tier). |
| Stale site | No posts in the last 6 months | Scores are low across the board but the top tags still display — just all in the muted tier. |

## Non-goals

- No tag management UI or admin panel — tags come from post frontmatter only.
- No tag descriptions or tag-specific landing page content in v1.
- No tag-follow or notification system.
- No animated score counters or real-time trend updates — everything is static at build time.
- No "rising" vs "falling" indicators — just the current score.
- No configurable weights via frontmatter or UI — the 0.4/0.6 split and λ value are code-level constants.

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| Two tags have identical scores | Sort | Secondary sort by tag name (alphabetical) for deterministic ordering. |
| Tag appears in both a draft and a published post | Scoring | Only published posts contribute to the score. Drafts are excluded. |
| Tag appears in a short (spec 005) and a blog post | Scoring | Both count equally. Shorts contribute to tag frequency and recency like any other category. |
| Tag name differs in casing across posts (`AI-Safety` vs `ai-safety`) | Normalization | Tags are slugified for matching (`ai-safety`). The `displayName` uses the casing from the most recent post. |
| Only 5 unique tags exist | UI | Show all 5 (fewer than the default 8 cap). |
| One tag is used in 50 posts, all others in 1 | Scoring | The dominant tag gets a high frequency score. But if those 50 posts are old and the single-use tags are recent, the single-use tags can still outrank on recency. The formula balances this. |
| All posts are from the same day | Scoring | All recency scores are equal. Ranking is determined entirely by frequency. |
| λ decay makes old tags score ≈ 0 | Scoring | Tags with only very old posts (> 1 year) get near-zero recency. They can still appear if they have high frequency, but will rank low. This is by design — the site surfaces what's current. |

## Scoring Example

```
Posts:
  - "Intro to AI Safety"     tags: [ai-safety]           date: 2026-03-15 (3 days ago)
  - "Agent Benchmarks"        tags: [ai-safety, agents]   date: 2026-03-10 (8 days ago)
  - "K8s Operators Deep Dive" tags: [kubernetes]           date: 2026-02-01 (45 days ago)
  - "K8s Networking"          tags: [kubernetes]           date: 2025-12-01 (107 days ago)
  - "K8s Security"            tags: [kubernetes]           date: 2025-11-01 (137 days ago)
  - "My Rust Journey"         tags: [rust]                 date: 2025-06-01 (290 days ago)

Tag: ai-safety (count: 2)
  frequency_score = 2/3 = 0.667
  recency_score   = avg(exp(-0.01×3), exp(-0.01×8)) = avg(0.970, 0.923) = 0.947
  raw_score       = 0.667 × 0.4 + 0.947 × 0.6 = 0.267 + 0.568 = 0.835

Tag: kubernetes (count: 3)
  frequency_score = 3/3 = 1.000
  recency_score   = avg(exp(-0.01×45), exp(-0.01×107), exp(-0.01×137))
                  = avg(0.638, 0.343, 0.254) = 0.412
  raw_score       = 1.000 × 0.4 + 0.412 × 0.6 = 0.400 + 0.247 = 0.647

Tag: agents (count: 1)
  frequency_score = 1/3 = 0.333
  recency_score   = avg(exp(-0.01×8)) = 0.923
  raw_score       = 0.333 × 0.4 + 0.923 × 0.6 = 0.133 + 0.554 = 0.687

Tag: rust (count: 1)
  frequency_score = 1/3 = 0.333
  recency_score   = avg(exp(-0.01×290)) = 0.055
  raw_score       = 0.333 × 0.4 + 0.055 × 0.6 = 0.133 + 0.033 = 0.166

Ranking (normalized to 0–100):
  1. ai-safety   → 100
  2. agents      →  82
  3. kubernetes  →  77
  4. rust        →  20

Result: "ai-safety" trends highest despite fewer posts than "kubernetes"
because both its posts are very recent. "rust" ranks last — one old post.
```

## Directory Structure (additions to spec 001)

```
├── lib/
│   └── trending.ts             # computeTrendingTags(), scoring logic, decay function
├── components/
│   ├── TrendingTags.tsx         # Horizontal chip row component
│   └── TagChip.tsx              # Updated: accepts an optional `tier` prop for visual weight
```

## External Dependencies

_None. Pure computation at build time using JavaScript `Math.exp()`. No new packages._

## Open Questions

- [ ] Placement: between hero and featured card, or between featured card and content grid?
- [ ] Should the trend score or rank be exposed anywhere to the visitor (e.g. tooltip on hover: "Trending #1 · 5 posts"), or keep it invisible and just let the visual weight communicate importance?
- [ ] Worth adding a `/tags` index page that shows all tags with their scores, or overkill for v1?

## Post-Implementation Notes

_Filled when status → complete. Not required for prototypes._

- ...
