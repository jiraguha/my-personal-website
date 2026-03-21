import { describe, it, expect } from "vitest";
import { shouldSkipCover, skipReasonLabel } from "../../src/ui/lib/cover-skip";
import type { Post } from "../../src/ui/lib/posts";

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    title: "Test Post",
    slug: "test-post",
    date: "2026-03-21",
    summary: "A summary.",
    cover: "",
    tags: ["test"],
    category: "blog",
    featured: false,
    draft: false,
    coverNone: false,
    content: "# Test",
    ...overrides,
  };
}

describe("shouldSkipCover", () => {
  it("returns null for a post with empty cover (should generate)", () => {
    const post = makePost();
    expect(shouldSkipCover(post)).toBeNull();
  });

  it("returns 'coverNone' when coverNone is true", () => {
    const post = makePost({ coverNone: true });
    expect(shouldSkipCover(post)).toBe("coverNone");
  });

  it("returns 'hasCover' when cover is set in frontmatter", () => {
    const post = makePost({ cover: "/assets/manual-cover.png" });
    expect(shouldSkipCover(post)).toBe("hasCover");
  });

  it("returns null when cover is auto-resolved (not manually set)", () => {
    const post = makePost({
      cover: "/assets/covers/test-post/cover.png",
      coverAutoResolved: true,
    });
    expect(shouldSkipCover(post)).toBeNull();
  });

  it("coverNone takes priority over cover being set", () => {
    const post = makePost({
      coverNone: true,
      cover: "/assets/manual-cover.png",
    });
    expect(shouldSkipCover(post)).toBe("coverNone");
  });
});

describe("skipReasonLabel", () => {
  it("returns label for coverNone", () => {
    expect(skipReasonLabel("coverNone")).toBe("coverNone=true");
  });

  it("returns label for hasCover", () => {
    expect(skipReasonLabel("hasCover")).toBe("cover already set");
  });

  it("returns empty string for null", () => {
    expect(skipReasonLabel(null)).toBe("");
  });
});
