import { describe, it, expect } from "vitest";
import { buildPrompt, buildFullPrompt, hashPrompt } from "../../src/ui/lib/cover-generator";
import type { PostFrontmatter } from "../../src/shared/schemas/site.schema";

function makePost(overrides: Partial<PostFrontmatter> = {}): PostFrontmatter {
  return {
    title: "Test Post Title",
    slug: "test-post",
    date: "2026-03-21",
    summary: "A test summary for the post.",
    cover: "",
    tags: ["typescript", "testing"],
    category: "blog",
    featured: false,
    draft: false,
    coverNone: false,
    ...overrides,
  };
}

describe("buildPrompt", () => {
  it("uses coverHint when present (Strategy 1)", () => {
    const post = makePost({ coverHint: "show a diagram of testing flow" });
    const prompt = buildPrompt(post);
    expect(prompt).toContain("Diagram hint: show a diagram of testing flow");
    expect(prompt).not.toContain("Summary:");
  });

  it("uses summary when coverHint is absent (Strategy 2)", () => {
    const post = makePost();
    const prompt = buildPrompt(post);
    expect(prompt).toContain('Summary: "A test summary for the post."');
    expect(prompt).not.toContain("Diagram hint:");
  });

  it("uses coverKeywords over tags when provided", () => {
    const post = makePost({ coverKeywords: ["custom1", "custom2"] });
    const prompt = buildPrompt(post);
    expect(prompt).toContain("custom1, custom2");
    expect(prompt).not.toContain("typescript");
  });

  it("falls back to tags when coverKeywords is not set", () => {
    const post = makePost();
    const prompt = buildPrompt(post);
    expect(prompt).toContain("typescript, testing");
  });

  it("falls back to title words when both coverKeywords and tags are empty", () => {
    const post = makePost({ tags: [], title: "Building Great Software Systems" });
    const prompt = buildPrompt(post);
    expect(prompt).toContain("Building");
    expect(prompt).toContain("Great");
  });

  it("truncates title at 120 chars", () => {
    const longTitle = "A".repeat(200);
    const post = makePost({ title: longTitle });
    const prompt = buildPrompt(post);
    expect(prompt).toContain('"' + "A".repeat(120) + '"');
    expect(prompt).not.toContain("A".repeat(121));
  });

  it("includes category in prompt", () => {
    const post = makePost({ category: "talk" });
    const prompt = buildPrompt(post);
    expect(prompt).toContain("for a talk post");
  });

  it("includes minimal text density by default", () => {
    const post = makePost();
    const prompt = buildPrompt(post);
    expect(prompt).toContain("TEXT DENSITY:");
    expect(prompt).toContain("1-3 very short labels");
  });

  it("includes none text density when coverText is none", () => {
    const post = makePost({ coverText: "none" });
    const prompt = buildPrompt(post);
    expect(prompt).toContain("No text whatsoever");
  });

  it("includes heavy text density when coverText is heavy", () => {
    const post = makePost({ coverText: "heavy" });
    const prompt = buildPrompt(post);
    expect(prompt).toContain("Title, labels, and status bar");
  });
});

describe("buildFullPrompt", () => {
  it("combines DA and user prompt with separator", () => {
    const post = makePost();
    const full = buildFullPrompt(post);
    expect(full).toContain("SYSTEM CONTEXT");
    expect(full).toContain("---");
    expect(full).toContain("Generate a cover image");
  });
});

describe("hashPrompt", () => {
  it("returns a 16-char hex string", () => {
    const hash = hashPrompt("test prompt");
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("returns same hash for same input", () => {
    expect(hashPrompt("hello")).toBe(hashPrompt("hello"));
  });

  it("returns different hash for different input", () => {
    expect(hashPrompt("hello")).not.toBe(hashPrompt("world"));
  });
});
