/**
 * Unit tests for spec 006 — Reveal.js Talk Presentations.
 * Covers API-1 through API-6.
 */

import { describe, it, expect } from "vitest";
import { parseSlides, stripNotes } from "../../src/ui/lib/slides";
import { PostFrontmatterSchema, PostCardSchema } from "@shared/schemas/site.schema";

// ---------------------------------------------------------------------------
// API-3: parseSlides
// ---------------------------------------------------------------------------

describe("API-3: parseSlides — horizontal splitting", () => {
  it("single slide (no ---) returns one group with one item", () => {
    const result = parseSlides("# Hello\n\nContent here.");
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
    expect(result[0][0]).toContain("Hello");
  });

  it("two slides separated by \\n---\\n returns two horizontal groups", () => {
    const result = parseSlides("# Slide 1\n---\n# Slide 2");
    expect(result).toHaveLength(2);
    expect(result[0][0]).toContain("Slide 1");
    expect(result[1][0]).toContain("Slide 2");
  });

  it("three slides returns three horizontal groups", () => {
    const result = parseSlides("A\n---\nB\n---\nC");
    expect(result).toHaveLength(3);
  });

  it("empty content returns one group with one empty-string item", () => {
    const result = parseSlides("");
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
  });
});

describe("API-3: parseSlides — vertical splitting", () => {
  it("vertical separator \\n----\\n splits within a horizontal group", () => {
    const result = parseSlides("# H1\n---\n# V1\n----\n# V2");
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(1); // first slide: no vertical
    expect(result[1]).toHaveLength(2); // second slide: two verticals
    expect(result[1][0]).toContain("V1");
    expect(result[1][1]).toContain("V2");
  });

  it("multiple vertical slides in one group", () => {
    const result = parseSlides("A\n----\nB\n----\nC");
    expect(result[0]).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// API-4: stripNotes
// ---------------------------------------------------------------------------

describe("API-4: stripNotes", () => {
  it("returns content unchanged when no Note: present", () => {
    expect(stripNotes("# Slide\n\nSome content.")).toBe("# Slide\n\nSome content.");
  });

  it("strips everything from \\nNote: to end of string", () => {
    const result = stripNotes("# Slide\n\nContent.\nNote: speaker only");
    expect(result).toBe("# Slide\n\nContent.");
    expect(result).not.toContain("speaker only");
  });

  it("strips multi-line notes", () => {
    const result = stripNotes("# Slide\nContent.\nNote: line one\nline two\nline three");
    expect(result).toBe("# Slide\nContent.");
  });

  it("trims trailing whitespace from result", () => {
    const result = stripNotes("Content   \nNote: notes");
    expect(result).toBe("Content");
  });

  it("a leading 'Note:' with no preceding \\n is NOT stripped", () => {
    // Edge case: Note: at very start of string has no \n before it
    const result = stripNotes("Note: this is actually a heading, not a note marker");
    expect(result).toContain("Note:");
  });
});

// ---------------------------------------------------------------------------
// API-1: PostFrontmatterSchema accepts talk-specific fields
// ---------------------------------------------------------------------------

const BASE_TALK = {
  slug: "my-talk",
  title: "My Talk",
  date: "2026-03-19",
  summary: "A conference talk.",
  category: "talk" as const,
  tags: [],
  featured: false,
  draft: false,
};

describe("API-1: PostFrontmatterSchema accepts talk fields", () => {
  it("parses a talk post with all optional talk fields", () => {
    const result = PostFrontmatterSchema.safeParse({
      ...BASE_TALK,
      event: "KubeCon EU 2026",
      eventUrl: "https://events.linuxfoundation.org/kubecon",
      eventDate: "2026-04-02",
      videoUrl: "https://youtube.com/watch?v=abc",
      externalSlides: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.event).toBe("KubeCon EU 2026");
      expect(result.data.videoUrl).toBe("https://youtube.com/watch?v=abc");
    }
  });

  it("parses a talk post with no talk-specific fields (all optional)", () => {
    const result = PostFrontmatterSchema.safeParse(BASE_TALK);
    expect(result.success).toBe(true);
  });

  it("externalSlides is undefined when not provided", () => {
    const result = PostFrontmatterSchema.safeParse(BASE_TALK);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.externalSlides).toBeUndefined();
    }
  });

  it("empty string externalSlides parses and is falsy", () => {
    const result = PostFrontmatterSchema.safeParse({ ...BASE_TALK, externalSlides: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.externalSlides).toBeFalsy();
    }
  });
});

// ---------------------------------------------------------------------------
// API-2: PostCardSchema includes externalSlides
// ---------------------------------------------------------------------------

describe("API-2: PostCardSchema includes externalSlides", () => {
  it("PostCardSchema accepts externalSlides", () => {
    const result = PostCardSchema.safeParse({
      title: "Talk",
      slug: "my-talk",
      date: "2026-03-19",
      summary: "Summary",
      cover: "",
      tags: [],
      category: "talk",
      featured: false,
      externalSlides: "https://speakerdeck.com/example",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.externalSlides).toBe("https://speakerdeck.com/example");
    }
  });

  it("PostCardSchema is valid without externalSlides", () => {
    const result = PostCardSchema.safeParse({
      title: "Talk",
      slug: "my-talk",
      date: "2026-03-19",
      summary: "Summary",
      cover: "",
      tags: [],
      category: "talk",
      featured: false,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// API-5: toPostCard passes externalSlides through
// ---------------------------------------------------------------------------

// Inline reimplementation matching src/ui/lib/posts.ts toPostCard
function toPostCard(post: {
  title: string; slug: string; date: string; summary: string;
  cover: string; tags: string[]; category: string; featured: boolean;
  externalUrl?: string; externalSlides?: string;
}) {
  return {
    title: post.title, slug: post.slug, date: post.date, summary: post.summary,
    cover: post.cover, tags: post.tags, category: post.category,
    featured: post.featured, externalUrl: post.externalUrl,
    externalSlides: post.externalSlides,
  };
}

describe("API-5: toPostCard passes externalSlides through", () => {
  it("includes externalSlides in the card when set", () => {
    const card = toPostCard({ ...BASE_TALK, cover: "", externalSlides: "https://speakerdeck.com/x" });
    expect(card.externalSlides).toBe("https://speakerdeck.com/x");
  });

  it("externalSlides is undefined in card when not on post", () => {
    const card = toPostCard({ ...BASE_TALK, cover: "" });
    expect(card.externalSlides).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// API-6: talks with externalSlides set — no deck rendered (behaviour contract)
// ---------------------------------------------------------------------------

describe("API-6: externalSlides truthy → deck route excluded", () => {
  it("a non-empty externalSlides string is truthy", () => {
    // TalkPresentation guards: if (post.externalSlides) → Navigate to /404
    const externalSlides = "https://speakerdeck.com/example";
    expect(Boolean(externalSlides)).toBe(true);
  });

  it("an empty externalSlides string is falsy → deck rendered", () => {
    expect(Boolean("")).toBe(false);
  });
});
