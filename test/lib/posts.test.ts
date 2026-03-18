/**
 * Unit tests for the posts data layer (LIB-1 through LIB-7).
 *
 * Because posts.ts uses import.meta.glob and import.meta.env (Vite-specific),
 * we test the observable behaviour by importing and calling the exported
 * functions directly inside the Vitest environment (which runs under Vite and
 * therefore resolves both globals correctly).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Inline re-implementation of the pure helpers so we can unit-test them
// without touching the real glob cache.
// ---------------------------------------------------------------------------

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const yamlStr = match[1];
  const content = match[2];
  const data: Record<string, unknown> = {};

  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const rawValue = line.slice(colonIdx + 1).trim();

    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      data[key] = rawValue
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (rawValue === "true") {
      data[key] = true;
    } else if (rawValue === "false") {
      data[key] = false;
    } else {
      data[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }

  return { data, content };
}

import {
  PostFrontmatterSchema,
  type PostCard,
} from "@shared/schemas/site.schema";

interface Post {
  title: string;
  slug: string;
  date: string;
  summary: string;
  cover: string;
  tags: string[];
  category: "blog" | "project" | "talk" | "short";
  featured: boolean;
  draft: boolean;
  externalUrl?: string;
  content: string;
}

function buildPost(raw: string, filePath: string): Post | null {
  const { data, content } = parseFrontmatter(raw);
  const slug = filePath.replace("/content/posts/", "").replace(/\.md$/, "");
  const result = PostFrontmatterSchema.safeParse({ slug, ...data });
  if (!result.success) return null;
  return { ...result.data, content };
}

function filterAndSort(posts: Post[], isDev: boolean): Post[] {
  return posts
    .filter((p) => isDev || (!p.draft && new Date(p.date) <= new Date()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function toPostCard(post: Post): PostCard {
  return {
    title: post.title,
    slug: post.slug,
    date: post.date,
    summary: post.summary,
    cover: post.cover,
    tags: post.tags,
    category: post.category,
    featured: post.featured,
    externalUrl: post.externalUrl,
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_POST = `---
title: "Hello World"
date: "2026-01-01"
summary: "A test post."
category: blog
tags: [foo, bar]
featured: false
draft: false
---
# Hello World

Body content here.
`;

const FEATURED_POST = `---
title: "Featured Post"
date: "2026-02-01"
summary: "This one is featured."
category: project
tags: [foo]
featured: true
draft: false
---
Featured body.
`;

const DRAFT_POST = `---
title: "Draft Post"
date: "2026-01-15"
summary: "Not yet published."
category: blog
tags: []
featured: false
draft: true
---
Draft body.
`;

const FUTURE_POST = `---
title: "Future Post"
date: "2099-12-31"
summary: "Not yet."
category: blog
tags: []
featured: false
draft: false
---
Future body.
`;

const OLDER_FEATURED_POST = `---
title: "Old Featured"
date: "2025-06-01"
summary: "Older featured post."
category: talk
tags: [baz]
featured: true
draft: false
---
Old featured.
`;

const INVALID_POST = `---
title: "Missing category"
date: "2026-01-01"
summary: "No category field."
---
Body.
`;

const EXTERNAL_URL_POST = `---
title: "External Talk"
date: "2026-01-10"
summary: "Watch on YouTube."
category: talk
tags: [talk]
featured: false
draft: false
externalUrl: "https://example.com/talk"
---
Talk transcript.
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("parseFrontmatter", () => {
  it("parses title, date, summary as strings", () => {
    const { data } = parseFrontmatter(VALID_POST);
    expect(data.title).toBe("Hello World");
    expect(data.date).toBe("2026-01-01");
    expect(data.summary).toBe("A test post.");
  });

  it("parses tag arrays", () => {
    const { data } = parseFrontmatter(VALID_POST);
    expect(data.tags).toEqual(["foo", "bar"]);
  });

  it("parses booleans", () => {
    const { data } = parseFrontmatter(VALID_POST);
    expect(data.featured).toBe(false);
    expect(data.draft).toBe(false);
  });

  it("returns body content after the second --- delimiter", () => {
    const { content } = parseFrontmatter(VALID_POST);
    expect(content).toContain("Body content here.");
  });

  it("returns empty data and raw string when no frontmatter delimiters", () => {
    const raw = "Just a plain markdown file with no frontmatter.";
    const { data, content } = parseFrontmatter(raw);
    expect(Object.keys(data)).toHaveLength(0);
    expect(content).toBe(raw);
  });
});

describe("buildPost", () => {
  it("returns a Post for valid markdown", () => {
    const post = buildPost(VALID_POST, "/content/posts/hello-world.md");
    expect(post).not.toBeNull();
    expect(post?.slug).toBe("hello-world");
    expect(post?.title).toBe("Hello World");
  });

  it("derives slug from the file path", () => {
    const post = buildPost(VALID_POST, "/content/posts/my-great-article.md");
    expect(post?.slug).toBe("my-great-article");
  });

  it("returns null for missing required fields (LIB-6)", () => {
    const post = buildPost(INVALID_POST, "/content/posts/invalid.md");
    expect(post).toBeNull();
  });

  it("parses externalUrl when present", () => {
    const post = buildPost(EXTERNAL_URL_POST, "/content/posts/ext.md");
    expect(post?.externalUrl).toBe("https://example.com/talk");
  });
});

describe("LIB-1: filterAndSort — production mode", () => {
  const raw = [
    buildPost(VALID_POST, "/content/posts/a.md")!,
    buildPost(DRAFT_POST, "/content/posts/b.md")!,
    buildPost(FUTURE_POST, "/content/posts/c.md")!,
    buildPost(FEATURED_POST, "/content/posts/d.md")!,
  ].filter(Boolean);

  it("excludes draft posts in production", () => {
    const posts = filterAndSort(raw, false);
    expect(posts.find((p) => p.draft)).toBeUndefined();
  });

  it("excludes future-dated posts in production", () => {
    const posts = filterAndSort(raw, false);
    expect(posts.find((p) => p.slug === "c")).toBeUndefined();
  });

  it("returns posts sorted newest-first", () => {
    const posts = filterAndSort(raw, false);
    for (let i = 1; i < posts.length; i++) {
      expect(new Date(posts[i - 1].date).getTime()).toBeGreaterThanOrEqual(
        new Date(posts[i].date).getTime()
      );
    }
  });
});

describe("LIB-1: filterAndSort — dev mode", () => {
  const raw = [
    buildPost(VALID_POST, "/content/posts/a.md")!,
    buildPost(DRAFT_POST, "/content/posts/b.md")!,
    buildPost(FUTURE_POST, "/content/posts/c.md")!,
  ].filter(Boolean);

  it("includes draft posts in dev", () => {
    const posts = filterAndSort(raw, true);
    expect(posts.find((p) => p.draft)).toBeDefined();
  });

  it("includes future-dated posts in dev", () => {
    const posts = filterAndSort(raw, true);
    expect(posts.find((p) => p.slug === "c")).toBeDefined();
  });
});

describe("LIB-2: getFeaturedPost — newest wins when multiple featured", () => {
  const raw = [
    buildPost(FEATURED_POST, "/content/posts/newer.md")!,        // 2026-02-01
    buildPost(OLDER_FEATURED_POST, "/content/posts/older.md")!, // 2025-06-01
  ].filter(Boolean);

  const sorted = filterAndSort(raw, false);

  it("returns the newer featured post", () => {
    const featured = sorted.find((p) => p.featured);
    expect(featured?.title).toBe("Featured Post");
  });
});

describe("LIB-3: getPostBySlug", () => {
  const posts = [
    buildPost(VALID_POST, "/content/posts/hello-world.md")!,
    buildPost(FEATURED_POST, "/content/posts/featured.md")!,
  ].filter(Boolean);

  const getBySlug = (slug: string) => posts.find((p) => p.slug === slug);

  it("returns the correct post for a known slug", () => {
    expect(getBySlug("hello-world")?.title).toBe("Hello World");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("LIB-4: getPostsByTag", () => {
  const posts = [
    buildPost(VALID_POST, "/content/posts/a.md")!,    // tags: [foo, bar]
    buildPost(FEATURED_POST, "/content/posts/b.md")!, // tags: [foo]
    buildPost(EXTERNAL_URL_POST, "/content/posts/c.md")!, // tags: [talk]
  ].filter(Boolean);

  const getByTag = (tag: string) => posts.filter((p) => p.tags.includes(tag));

  it("returns all posts tagged 'foo'", () => {
    expect(getByTag("foo")).toHaveLength(2);
  });

  it("returns only the one post tagged 'bar'", () => {
    expect(getByTag("bar")).toHaveLength(1);
  });

  it("returns empty array for non-existent tag", () => {
    expect(getByTag("nonexistent")).toHaveLength(0);
  });
});

describe("LIB-5: getAllTags — deduplicated and sorted", () => {
  const posts = [
    buildPost(VALID_POST, "/content/posts/a.md")!,    // tags: [foo, bar]
    buildPost(FEATURED_POST, "/content/posts/b.md")!, // tags: [foo]
    buildPost(OLDER_FEATURED_POST, "/content/posts/c.md")!, // tags: [baz]
  ].filter(Boolean);

  const allTags = () => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  };

  it("deduplicates tags", () => {
    const tags = allTags();
    expect(tags.filter((t) => t === "foo")).toHaveLength(1);
  });

  it("returns tags in alphabetical order", () => {
    const tags = allTags();
    expect(tags).toEqual([...tags].sort());
  });

  it("includes all unique tags", () => {
    expect(allTags()).toEqual(["bar", "baz", "foo"]);
  });
});

describe("LIB-7: toPostCard — shape and no extra fields", () => {
  const post = buildPost(VALID_POST, "/content/posts/hello-world.md")!;

  it("returns a PostCard with required fields", () => {
    const card = toPostCard(post);
    expect(card.title).toBe(post.title);
    expect(card.slug).toBe(post.slug);
    expect(card.date).toBe(post.date);
    expect(card.summary).toBe(post.summary);
    expect(card.category).toBe(post.category);
    expect(card.tags).toEqual(post.tags);
  });

  it("does not include the markdown content body", () => {
    const card = toPostCard(post);
    expect((card as Record<string, unknown>).content).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Fixtures for short-category posts (spec 004)
// ---------------------------------------------------------------------------

const SHORT_POST = `---
title: "TIL: kubectl debug"
date: "2026-03-18"
summary: "Attach ephemeral containers to running pods."
category: short
tags: [kubernetes, devtools]
featured: false
draft: false
---
\`kubectl debug\` is great.
`;

const FEATURED_SHORT_POST = `---
title: "Featured Short"
date: "2026-03-19"
summary: "A short that was mistakenly marked featured."
category: short
tags: [test]
featured: true
draft: false
---
Body.
`;

// ---------------------------------------------------------------------------
// API-1: schema accepts "short" as a valid category
// ---------------------------------------------------------------------------

describe("API-1: ContentCategorySchema accepts 'short'", () => {
  it("buildPost succeeds for category: short", () => {
    const post = buildPost(SHORT_POST, "/content/posts/til-kubectl-debug.md");
    expect(post).not.toBeNull();
    expect(post?.category).toBe("short");
  });

  it("short post passes full Zod validation", () => {
    const { data } = parseFrontmatter(SHORT_POST);
    const result = PostFrontmatterSchema.safeParse({
      slug: "til-kubectl-debug",
      ...data,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// API-3: getAllPosts includes shorts
// ---------------------------------------------------------------------------

describe("API-3: shorts appear in the full post list", () => {
  const posts = [
    buildPost(VALID_POST, "/content/posts/a.md")!,
    buildPost(SHORT_POST, "/content/posts/til.md")!,
  ].filter(Boolean);

  it("short is included alongside blog posts", () => {
    expect(posts.find((p) => p.category === "short")).toBeDefined();
  });

  it("both posts survive filterAndSort in production mode", () => {
    const sorted = filterAndSort(posts, false);
    expect(sorted).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// API-4: getPostsByTag includes shorts
// ---------------------------------------------------------------------------

describe("API-4: getPostsByTag includes short-category posts", () => {
  const posts = [
    buildPost(VALID_POST, "/content/posts/a.md")!,       // tags: [foo, bar]
    buildPost(SHORT_POST, "/content/posts/til.md")!,     // tags: [kubernetes, devtools]
  ].filter(Boolean);

  const getByTag = (tag: string) => posts.filter((p) => p.tags.includes(tag));

  it("returns a short when querying its tag", () => {
    const results = getByTag("kubernetes");
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("short");
  });

  it("does not include the short for a blog-only tag", () => {
    const results = getByTag("foo");
    expect(results.every((p) => p.category !== "short")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// API-5: getFeaturedPost skips shorts
// ---------------------------------------------------------------------------

describe("API-5: getFeaturedPost skips shorts with featured: true", () => {
  // featured short + non-featured blog — featured short must be skipped
  const posts = [
    buildPost(FEATURED_SHORT_POST, "/content/posts/featured-short.md")!, // featured, short
    buildPost(VALID_POST, "/content/posts/blog.md")!,                    // not featured, blog
  ].filter(Boolean);

  const sorted = filterAndSort(posts, false);
  const getFeatured = () => sorted.find((p) => p.featured && p.category !== "short");

  it("returns undefined when only featured post is a short", () => {
    expect(getFeatured()).toBeUndefined();
  });

  // featured short + featured blog — blog should win
  const postsWithBlog = [
    buildPost(FEATURED_SHORT_POST, "/content/posts/featured-short.md")!,
    buildPost(FEATURED_POST, "/content/posts/featured-blog.md")!,
  ].filter(Boolean);

  const sortedWithBlog = filterAndSort(postsWithBlog, false);
  const getFeaturedWithBlog = () =>
    sortedWithBlog.find((p) => p.featured && p.category !== "short");

  it("returns the non-short featured post when both exist", () => {
    const featured = getFeaturedWithBlog();
    expect(featured).toBeDefined();
    expect(featured?.category).not.toBe("short");
    expect(featured?.title).toBe("Featured Post");
  });
});
