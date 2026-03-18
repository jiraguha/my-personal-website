/**
 * Unit tests for the trending tags scoring logic (spec 005).
 *
 * The pure helpers (decay, scoring, normalization) are re-implemented inline
 * so tests run without Vite's import.meta.glob, following the same pattern
 * as posts.test.ts.
 */

import { describe, it, expect } from "vitest";
import { TrendingTagSchema } from "@shared/schemas/tags.schema";

// ---------------------------------------------------------------------------
// Re-implementation of pure helpers from src/ui/lib/trending.ts
// ---------------------------------------------------------------------------

const DECAY_LAMBDA = 0.01;
const FREQUENCY_WEIGHT = 0.4;
const RECENCY_WEIGHT = 0.6;
const MIN_TAGS_TO_SHOW = 3;

function daysSince(isoDate: string, now = new Date()): number {
  const then = new Date(isoDate);
  return Math.max(0, (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function decayScore(isoDate: string, now?: Date): number {
  return Math.exp(-DECAY_LAMBDA * daysSince(isoDate, now));
}

interface TagInput {
  tag: string;
  displayName: string;
  dates: string[];
}

function computeScores(tagInputs: TagInput[], topN: number, now = new Date()) {
  if (tagInputs.length < MIN_TAGS_TO_SHOW) return [];

  const maxCount = Math.max(...tagInputs.map((t) => t.dates.length));

  const scored = tagInputs.map(({ tag, displayName, dates }) => {
    const frequencyScore = dates.length / maxCount;
    const recencyScore = dates.reduce((s, d) => s + decayScore(d, now), 0) / dates.length;
    const rawScore = frequencyScore * FREQUENCY_WEIGHT + recencyScore * RECENCY_WEIGHT;
    return { tag, displayName, count: dates.length, rawScore };
  });

  const maxRaw = Math.max(...scored.map((s) => s.rawScore));
  const minRaw = Math.min(...scored.map((s) => s.rawScore));
  const range = maxRaw - minRaw || 1;

  return scored
    .map((s) => ({
      ...s,
      score: Math.round(((s.rawScore - minRaw) / range) * 100),
    }))
    .sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag))
    .slice(0, topN)
    .map((t, i) =>
      TrendingTagSchema.parse({
        tag: t.tag,
        displayName: t.displayName,
        count: t.count,
        score: t.score,
        rank: i + 1,
      })
    );
}

// ---------------------------------------------------------------------------
// Fixtures — fixed reference date so decay values are deterministic
// ---------------------------------------------------------------------------

// Reference "now" = 2026-03-19
const NOW = new Date("2026-03-19T00:00:00Z");

// 3 days ago = 2026-03-16
// 8 days ago = 2026-03-11
// 45 days ago = 2026-02-02
// 107 days ago = 2025-12-02
// 290 days ago = 2025-06-02

const TAGS_EXAMPLE: TagInput[] = [
  { tag: "ai-safety", displayName: "AI Safety", dates: ["2026-03-16", "2026-03-11"] },
  { tag: "kubernetes", displayName: "Kubernetes", dates: ["2026-02-02", "2025-12-02", "2025-11-02"] },
  { tag: "agents", displayName: "Agents", dates: ["2026-03-11"] },
  { tag: "rust", displayName: "Rust", dates: ["2025-06-02"] },
];

// ---------------------------------------------------------------------------
// API-1: returns sorted TrendingTag[] with correct shape
// ---------------------------------------------------------------------------

describe("API-1: computeScores returns sorted TrendingTag[]", () => {
  const results = computeScores(TAGS_EXAMPLE, 8, NOW);

  it("returns an array with length ≤ topN", () => {
    expect(results.length).toBeLessThanOrEqual(8);
    expect(results.length).toBeGreaterThan(0);
  });

  it("rank starts at 1 and increments by 1", () => {
    results.forEach((t, i) => expect(t.rank).toBe(i + 1));
  });

  it("scores are in descending order", () => {
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("each result validates against TrendingTagSchema", () => {
    results.forEach((t) => expect(() => TrendingTagSchema.parse(t)).not.toThrow());
  });
});

// ---------------------------------------------------------------------------
// API-2: scoring formula — ai-safety beats kubernetes on recency
// ---------------------------------------------------------------------------

describe("API-2: scoring formula correctness", () => {
  const results = computeScores(TAGS_EXAMPLE, 8, NOW);

  it("ai-safety (recent posts) ranks above kubernetes (older posts)", () => {
    const aiRank = results.find((t) => t.tag === "ai-safety")?.rank ?? 99;
    const k8sRank = results.find((t) => t.tag === "kubernetes")?.rank ?? 99;
    expect(aiRank).toBeLessThan(k8sRank);
  });

  it("rust (single old post) ranks last", () => {
    const rustRank = results.find((t) => t.tag === "rust")?.rank;
    const maxRank = results.length;
    expect(rustRank).toBe(maxRank);
  });

  it("the top-ranked tag scores 100 (normalization ceiling)", () => {
    expect(results[0].score).toBe(100);
  });

  it("all scores are in range 0–100", () => {
    results.forEach((t) => {
      expect(t.score).toBeGreaterThanOrEqual(0);
      expect(t.score).toBeLessThanOrEqual(100);
    });
  });
});

// ---------------------------------------------------------------------------
// API-2: decay function
// ---------------------------------------------------------------------------

describe("API-2: exponential decay", () => {
  it("today scores 1.0 (no decay)", () => {
    const today = NOW.toISOString().slice(0, 10);
    expect(decayScore(today, NOW)).toBeCloseTo(1.0, 5);
  });

  it("~69 days ago scores ~0.5 (half-life)", () => {
    const halfLife = new Date(NOW.getTime() - 69 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    expect(decayScore(halfLife, NOW)).toBeCloseTo(0.5, 1);
  });

  it("older dates produce lower decay scores", () => {
    const recent = "2026-03-10";
    const old = "2025-06-01";
    expect(decayScore(recent, NOW)).toBeGreaterThan(decayScore(old, NOW));
  });
});

// ---------------------------------------------------------------------------
// API-2: tie-breaking is alphabetical
// ---------------------------------------------------------------------------

describe("API-2: identical scores sort alphabetically", () => {
  // All posts from exact same date → identical recency → sorted by frequency,
  // then alphabetically on ties
  const sameDay = NOW.toISOString().slice(0, 10);
  const TIED_TAGS: TagInput[] = [
    { tag: "zebra", displayName: "Zebra", dates: [sameDay] },
    { tag: "apple", displayName: "Apple", dates: [sameDay] },
    { tag: "mango", displayName: "Mango", dates: [sameDay] },
  ];

  const results = computeScores(TIED_TAGS, 8, NOW);

  it("returns all 3 tags", () => {
    expect(results).toHaveLength(3);
  });

  it("tags with equal scores are sorted alphabetically", () => {
    // All have count=1, same date → identical raw scores → alpha sort
    const tags = results.map((t) => t.tag);
    expect(tags).toEqual(["apple", "mango", "zebra"]);
  });
});

// ---------------------------------------------------------------------------
// API-4: single-post tags are eligible; fewer than 3 tags returns []
// ---------------------------------------------------------------------------

describe("API-4: eligibility rules", () => {
  it("single-post tag is included when ≥ 3 tags total exist", () => {
    const tags: TagInput[] = [
      { tag: "a", displayName: "A", dates: ["2026-03-19"] },
      { tag: "b", displayName: "B", dates: ["2026-03-18"] },
      { tag: "c", displayName: "C", dates: ["2026-03-17"] },
    ];
    const results = computeScores(tags, 8, NOW);
    expect(results).toHaveLength(3);
  });

  it("returns [] when fewer than 3 tags", () => {
    const tags: TagInput[] = [
      { tag: "a", displayName: "A", dates: ["2026-03-19"] },
      { tag: "b", displayName: "B", dates: ["2026-03-18"] },
    ];
    expect(computeScores(tags, 8, NOW)).toEqual([]);
  });

  it("returns [] for empty tag list", () => {
    expect(computeScores([], 8, NOW)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Edge: all posts same date → frequency determines ranking
// ---------------------------------------------------------------------------

describe("Edge: all posts same date → frequency ranking", () => {
  const sameDay = "2026-03-19";
  const SAME_DAY_TAGS: TagInput[] = [
    { tag: "popular", displayName: "Popular", dates: [sameDay, sameDay, sameDay] }, // count 3
    { tag: "medium", displayName: "Medium", dates: [sameDay, sameDay] },             // count 2
    { tag: "rare", displayName: "Rare", dates: [sameDay] },                          // count 1
  ];

  const results = computeScores(SAME_DAY_TAGS, 8, NOW);

  it("higher frequency ranks first when recency is equal", () => {
    expect(results[0].tag).toBe("popular");
    expect(results[1].tag).toBe("medium");
    expect(results[2].tag).toBe("rare");
  });
});

// ---------------------------------------------------------------------------
// Edge: topN caps the result length
// ---------------------------------------------------------------------------

describe("Edge: topN cap", () => {
  it("returns exactly topN results when more tags exist", () => {
    const tags: TagInput[] = Array.from({ length: 10 }, (_, i) => ({
      tag: `tag-${i}`,
      displayName: `Tag ${i}`,
      dates: ["2026-03-19"],
    }));
    const results = computeScores(tags, 5, NOW);
    expect(results).toHaveLength(5);
  });

  it("returns all tags when count < topN", () => {
    const tags: TagInput[] = [
      { tag: "a", displayName: "A", dates: ["2026-03-19"] },
      { tag: "b", displayName: "B", dates: ["2026-03-18"] },
      { tag: "c", displayName: "C", dates: ["2026-03-17"] },
    ];
    expect(computeScores(tags, 10, NOW)).toHaveLength(3);
  });
});
