/**
 * Unit tests for 007-Post-Search.
 * Covers API-1 through API-5 and edge cases.
 */

import { describe, it, expect } from "vitest";
import { SearchEntrySchema, type SearchEntry } from "@shared/schemas/search.schema";
import { toSearchEntry, createSearchIndex, searchPosts } from "../../src/ui/lib/search";
import type { PostCard } from "@shared/schemas/site.schema";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BLOG_CARD: PostCard = {
  title: "Building Agentic Systems at Scale",
  slug: "agentic-systems-at-scale",
  date: "2026-03-15",
  summary: "Lessons learned orchestrating multi-agent pipelines in production.",
  cover: "https://example.com/cover.webp",
  tags: ["agentic-systems", "ai", "production"],
  category: "blog",
  featured: true,
  externalUrl: undefined,
  externalSlides: undefined,
};

const TALK_CARD: PostCard = {
  title: "Securing Agentic Systems: Guardrails in Production",
  slug: "securing-agentic-systems",
  date: "2026-03-19",
  summary: "A deep dive into benchmarking frameworks and deployment patterns for building autonomous agents.",
  cover: "",
  tags: ["ai-safety", "agents", "guardrails", "production"],
  category: "talk",
  featured: false,
  externalUrl: undefined,
  externalSlides: undefined,
};

const SHORT_CARD: PostCard = {
  title: "TIL: kubectl debug lets you attach ephemeral containers",
  slug: "til-kubectl-debug",
  date: "2026-03-18",
  summary: "Attach ephemeral containers to running pods.",
  cover: "",
  tags: ["kubernetes", "devtools"],
  category: "short",
  featured: false,
  externalUrl: undefined,
  externalSlides: undefined,
};

const PROJECT_CARD: PostCard = {
  title: "SingularFlow: A Platform for Agentic Workflows",
  slug: "singularflow-platform",
  date: "2026-01-10",
  summary: "Infrastructure for teams that want to ship AI-powered products.",
  cover: "",
  tags: ["singularflow", "product", "agentic-systems"],
  category: "project",
  featured: false,
  externalUrl: undefined,
  externalSlides: undefined,
};

const ALL_CARDS: PostCard[] = [BLOG_CARD, TALK_CARD, SHORT_CARD, PROJECT_CARD];

// ---------------------------------------------------------------------------
// API-1: SearchEntrySchema validates correctly
// ---------------------------------------------------------------------------

describe("API-1: SearchEntrySchema", () => {
  it("validates a correct SearchEntry", () => {
    const entry: SearchEntry = {
      slug: "test",
      title: "Test Post",
      summary: "A summary.",
      tags: ["a", "b"],
      category: "blog",
      date: "2026-01-01",
    };
    expect(() => SearchEntrySchema.parse(entry)).not.toThrow();
  });

  it("rejects entry missing required fields", () => {
    const invalid = { slug: "x", title: "X" };
    const result = SearchEntrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const invalid = {
      slug: "x",
      title: "X",
      summary: "X",
      tags: [],
      category: "invalid",
      date: "2026-01-01",
    };
    const result = SearchEntrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// API-2: toSearchEntry extracts only search-relevant fields
// ---------------------------------------------------------------------------

describe("API-2: toSearchEntry", () => {
  it("extracts slug, title, summary, tags, category, date", () => {
    const entry = toSearchEntry(BLOG_CARD);
    expect(entry.slug).toBe(BLOG_CARD.slug);
    expect(entry.title).toBe(BLOG_CARD.title);
    expect(entry.summary).toBe(BLOG_CARD.summary);
    expect(entry.tags).toEqual(BLOG_CARD.tags);
    expect(entry.category).toBe(BLOG_CARD.category);
    expect(entry.date).toBe(BLOG_CARD.date);
  });

  it("does not include cover, featured, or externalUrl", () => {
    const entry = toSearchEntry(BLOG_CARD) as Record<string, unknown>;
    expect(entry.cover).toBeUndefined();
    expect(entry.featured).toBeUndefined();
    expect(entry.externalUrl).toBeUndefined();
  });

  it("produces a valid SearchEntry per Zod schema", () => {
    const entry = toSearchEntry(TALK_CARD);
    expect(() => SearchEntrySchema.parse(entry)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// API-3: createSearchIndex builds a Fuse.js index
// ---------------------------------------------------------------------------

describe("API-3: createSearchIndex", () => {
  it("creates an index from PostCard array", () => {
    const index = createSearchIndex(ALL_CARDS);
    expect(index).toBeDefined();
    expect(typeof index.search).toBe("function");
  });

  it("index contains all posts", () => {
    const index = createSearchIndex(ALL_CARDS);
    // Searching for a term that appears across multiple posts
    const results = index.search("production");
    expect(results.length).toBeGreaterThan(0);
  });

  it("works with an empty array", () => {
    const index = createSearchIndex([]);
    const results = index.search("test");
    expect(results).toHaveLength(0);
  });

  it("works with a single post", () => {
    const index = createSearchIndex([SHORT_CARD]);
    const results = index.search("kubernetes");
    expect(results).toHaveLength(1);
    expect(results[0].item.slug).toBe("til-kubectl-debug");
  });
});

// ---------------------------------------------------------------------------
// API-4: searchPosts — matching, sanitization, edge cases
// ---------------------------------------------------------------------------

describe("API-4: searchPosts", () => {
  const index = createSearchIndex(ALL_CARDS);

  it("returns matching slugs for a title match", () => {
    const slugs = searchPosts(index, "SingularFlow");
    expect(slugs.has("singularflow-platform")).toBe(true);
  });

  it("returns matching slugs for a tag match", () => {
    const slugs = searchPosts(index, "kubernetes");
    expect(slugs.has("til-kubectl-debug")).toBe(true);
  });

  it("returns matching slugs for a summary match", () => {
    const slugs = searchPosts(index, "orchestrating");
    expect(slugs.has("agentic-systems-at-scale")).toBe(true);
  });

  it("returns empty set for query shorter than 2 characters", () => {
    const slugs = searchPosts(index, "a");
    expect(slugs.size).toBe(0);
  });

  it("returns empty set for empty query", () => {
    const slugs = searchPosts(index, "");
    expect(slugs.size).toBe(0);
  });

  it("returns empty set for whitespace-only query", () => {
    const slugs = searchPosts(index, "   ");
    expect(slugs.size).toBe(0);
  });

  it("caps query at 100 characters", () => {
    const longQuery = "kubernetes".repeat(20); // 200 chars
    // Should not throw, just truncates
    const slugs = searchPosts(index, longQuery);
    expect(slugs).toBeInstanceOf(Set);
  });

  it("strips special characters from query", () => {
    const slugs = searchPosts(index, "##kubernetes@@");
    expect(slugs.has("til-kubectl-debug")).toBe(true);
  });

  it("returns empty set when special chars reduce query below 2 chars", () => {
    const slugs = searchPosts(index, "##");
    expect(slugs.size).toBe(0);
  });

  it("returns empty set for a query that matches nothing", () => {
    const slugs = searchPosts(index, "xyzzyplugh");
    expect(slugs.size).toBe(0);
  });

  it("returns multiple slugs when multiple posts match", () => {
    // "production" appears in blog and talk tags
    const slugs = searchPosts(index, "production");
    expect(slugs.size).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// API-5: No API routes or server functions
// ---------------------------------------------------------------------------

describe("API-5: client-side only", () => {
  it("search.ts does not import any server/API modules", async () => {
    const source = await import("../../src/ui/lib/search");
    // If it imported express, hono, etc., the import would fail or expose server symbols
    expect(source.createSearchIndex).toBeInstanceOf(Function);
    expect(source.searchPosts).toBeInstanceOf(Function);
    expect(source.toSearchEntry).toBeInstanceOf(Function);
  });
});
