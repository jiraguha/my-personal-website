import { getAllPosts } from "./posts";
import { TrendingTagSchema, type TrendingTag } from "@shared/schemas/tags.schema";

const DECAY_LAMBDA = 0.01; // half-life ≈ 69 days
const FREQUENCY_WEIGHT = 0.4;
const RECENCY_WEIGHT = 0.6;
const DEFAULT_TOP_N = 8;
const MIN_TAGS_TO_SHOW = 3;

function daysSince(isoDate: string): number {
  const now = new Date();
  const then = new Date(isoDate);
  return Math.max(0, (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function decayScore(isoDate: string): number {
  return Math.exp(-DECAY_LAMBDA * daysSince(isoDate));
}

export function computeTrendingTags(topN = DEFAULT_TOP_N): TrendingTag[] {
  const posts = getAllPosts(); // already excludes drafts + future posts in prod

  // Collect tag usage: normalized slug → { dates, displayName from most recent post }
  const tagMap = new Map<string, { dates: string[]; displayName: string }>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const normalized = tag.toLowerCase();
      const existing = tagMap.get(normalized);
      if (existing) {
        existing.dates.push(post.date);
        // posts are sorted newest-first, so first occurrence wins for displayName
      } else {
        tagMap.set(normalized, { dates: [post.date], displayName: tag });
      }
    }
  }

  if (tagMap.size < MIN_TAGS_TO_SHOW) return [];

  const maxCount = Math.max(...Array.from(tagMap.values()).map((v) => v.dates.length));

  const scored = Array.from(tagMap.entries()).map(([tag, { dates, displayName }]) => {
    const frequencyScore = dates.length / maxCount;
    const recencyScore = dates.reduce((sum, d) => sum + decayScore(d), 0) / dates.length;
    const rawScore = frequencyScore * FREQUENCY_WEIGHT + recencyScore * RECENCY_WEIGHT;
    return { tag, displayName, count: dates.length, rawScore };
  });

  const maxRaw = Math.max(...scored.map((s) => s.rawScore));
  const minRaw = Math.min(...scored.map((s) => s.rawScore));
  const range = maxRaw - minRaw || 1;

  const ranked = scored
    .map((s) => ({
      ...s,
      score: Math.round(((s.rawScore - minRaw) / range) * 100),
    }))
    .sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag))
    .slice(0, topN);

  return ranked.map((t, i) =>
    TrendingTagSchema.parse({
      tag: t.tag,
      displayName: t.displayName,
      count: t.count,
      score: t.score,
      rank: i + 1,
    })
  );
}

/** Returns the set of tag slugs in the trending top-N — cheap for UI-7 badge check. */
export function getTrendingTagSet(topN = DEFAULT_TOP_N): Set<string> {
  return new Set(computeTrendingTags(topN).map((t) => t.tag));
}
