/**
 * Unit tests for meta tag infrastructure (spec 014).
 *
 * Tests buildPageMeta(), truncate(), absUrl(), stripMarkdown(),
 * and the MetaTags component output structure.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

// We need to test the exported helpers and buildPageMeta.
// Since meta.ts imports siteProfile/SITE_URL from site.ts which parses profile.json,
// we import it directly — the vitest environment resolves aliases.

import { buildPageMeta, truncate, absUrl, stripMarkdown } from "../../src/ui/lib/meta";
import { SITE_URL } from "../../src/ui/lib/site";
import { PageMetaSchema } from "@shared/schemas/meta.schema";

// ---------------------------------------------------------------------------
// Helper: a minimal PostFrontmatter-like object for testing
// ---------------------------------------------------------------------------
function makePost(overrides: Record<string, unknown> = {}) {
  return {
    title: "Test Post Title",
    slug: "test-post",
    date: "2026-01-15",
    summary: "A short summary for testing purposes.",
    cover: "",
    tags: ["testing", "meta"],
    category: "blog" as const,
    featured: false,
    draft: false,
    coverNone: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// truncate()
// ---------------------------------------------------------------------------
describe("truncate()", () => {
  it("returns text unchanged if within limit", () => {
    expect(truncate("hello", 160)).toBe("hello");
  });

  it("returns text unchanged if exactly at limit", () => {
    const text = "a".repeat(160);
    expect(truncate(text, 160)).toBe(text);
  });

  it("truncates and appends ellipsis when over limit", () => {
    const text = "a".repeat(200);
    const result = truncate(text, 160);
    expect(result.length).toBe(160);
    expect(result.endsWith("…")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// absUrl()
// ---------------------------------------------------------------------------
describe("absUrl()", () => {
  it("produces absolute URL from path starting with /", () => {
    const result = absUrl("/posts/test");
    expect(result).toBe(`${SITE_URL}/posts/test`);
  });

  it("produces absolute URL from path without leading /", () => {
    const result = absUrl("posts/test");
    expect(result).toBe(`${SITE_URL}/posts/test`);
  });

  it("handles root path", () => {
    const result = absUrl("/");
    expect(result).toBe(`${SITE_URL}/`);
  });
});

// ---------------------------------------------------------------------------
// stripMarkdown()
// ---------------------------------------------------------------------------
describe("stripMarkdown()", () => {
  it("strips headings", () => {
    expect(stripMarkdown("## Hello World")).toBe("Hello World");
  });

  it("strips bold and italic", () => {
    expect(stripMarkdown("**bold** and *italic* text")).toBe("bold and italic text");
  });

  it("strips links, keeps text", () => {
    expect(stripMarkdown("[click here](https://example.com)")).toBe("click here");
  });

  it("strips inline code", () => {
    expect(stripMarkdown("use `kubectl debug` to attach")).toBe("use to attach");
  });

  it("collapses whitespace", () => {
    expect(stripMarkdown("line one\n\nline two\n\nline three")).toBe("line one line two line three");
  });

  it("returns empty string for empty input", () => {
    expect(stripMarkdown("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// buildPageMeta() — home page
// ---------------------------------------------------------------------------
describe("buildPageMeta() — home", () => {
  it("returns valid PageMeta for home page", () => {
    const meta = buildPageMeta({ page: "home" });
    expect(() => PageMetaSchema.parse(meta)).not.toThrow();
  });

  it("sets type to website", () => {
    const meta = buildPageMeta({ page: "home" });
    expect(meta.type).toBe("website");
  });

  it("includes Person JSON-LD", () => {
    const meta = buildPageMeta({ page: "home" });
    expect(meta.jsonLd).toBeDefined();
    expect(meta.jsonLd!["@type"]).toBe("Person");
    expect(meta.jsonLd!["@context"]).toBe("https://schema.org");
  });

  it("sets canonical URL to site root", () => {
    const meta = buildPageMeta({ page: "home" });
    expect(meta.url).toBe(SITE_URL);
  });

  it("uses summary_large_image twitter card", () => {
    const meta = buildPageMeta({ page: "home" });
    expect(meta.twitterCard).toBe("summary_large_image");
  });

  it("does not include article metadata", () => {
    const meta = buildPageMeta({ page: "home" });
    expect(meta.article).toBeUndefined();
  });

  it("caps description at 160 characters", () => {
    const meta = buildPageMeta({ page: "home" });
    expect(meta.description.length).toBeLessThanOrEqual(160);
  });
});

// ---------------------------------------------------------------------------
// buildPageMeta() — blog post
// ---------------------------------------------------------------------------
describe("buildPageMeta() — blog post", () => {
  it("returns valid PageMeta for a blog post", () => {
    const meta = buildPageMeta({ page: "post", post: makePost() });
    expect(() => PageMetaSchema.parse(meta)).not.toThrow();
  });

  it("sets type to article", () => {
    const meta = buildPageMeta({ page: "post", post: makePost() });
    expect(meta.type).toBe("article");
  });

  it("title includes post title and site name", () => {
    const meta = buildPageMeta({ page: "post", post: makePost({ title: "My Great Post" }) });
    expect(meta.title).toContain("My Great Post");
    expect(meta.title).toContain("|");
  });

  it("includes article metadata with correct fields", () => {
    const post = makePost({ date: "2026-01-15", tags: ["a", "b"], category: "blog" });
    const meta = buildPageMeta({ page: "post", post });
    expect(meta.article).toBeDefined();
    expect(meta.article!.publishedTime).toBe("2026-01-15");
    expect(meta.article!.author).toBeTruthy();
    expect(meta.article!.tags).toEqual(["a", "b"]);
    expect(meta.article!.section).toBe("blog");
  });

  it("includes Article JSON-LD", () => {
    const meta = buildPageMeta({ page: "post", post: makePost() });
    expect(meta.jsonLd).toBeDefined();
    expect(meta.jsonLd!["@type"]).toBe("Article");
  });

  it("sets canonical URL to /posts/<slug>", () => {
    const meta = buildPageMeta({ page: "post", post: makePost({ slug: "my-slug" }) });
    expect(meta.url).toBe(`${SITE_URL}/posts/my-slug`);
  });

  it("sets canonical URL to /talks/<slug> for talk category", () => {
    const meta = buildPageMeta({ page: "post", post: makePost({ slug: "my-talk", category: "talk" }) });
    expect(meta.url).toBe(`${SITE_URL}/talks/my-talk`);
  });

  it("all og:image URLs are absolute", () => {
    const meta = buildPageMeta({ page: "post", post: makePost() });
    expect(meta.image.url).toMatch(/^https?:\/\//);
  });

  it("throws when post is missing for page type post", () => {
    expect(() => buildPageMeta({ page: "post" })).toThrow();
  });

  it("includes modifiedTime when post has updated field", () => {
    const post = makePost({ updated: "2026-02-01" });
    const meta = buildPageMeta({ page: "post", post });
    expect(meta.article!.modifiedTime).toBe("2026-02-01");
  });
});

// ---------------------------------------------------------------------------
// buildPageMeta() — description fallback chain
// ---------------------------------------------------------------------------
describe("buildPageMeta() — description fallback", () => {
  it("uses summary when provided", () => {
    const meta = buildPageMeta({ page: "post", post: makePost({ summary: "My summary" }) });
    expect(meta.description).toBe("My summary");
  });

  it("falls back to stripped markdown body when summary is empty", () => {
    const meta = buildPageMeta({
      page: "post",
      post: makePost({ summary: "" }),
      content: "## Heading\n\nSome **bold** paragraph text here.",
    });
    expect(meta.description).toContain("Heading");
    expect(meta.description).toContain("bold");
    expect(meta.description).not.toContain("**");
    expect(meta.description).not.toContain("##");
  });

  it("falls back to site bio when both summary and content are empty", () => {
    const meta = buildPageMeta({
      page: "post",
      post: makePost({ summary: "" }),
      content: "",
    });
    expect(meta.description.length).toBeGreaterThan(0);
    expect(meta.description.length).toBeLessThanOrEqual(160);
  });

  it("truncates long summaries to 160 chars", () => {
    const longSummary = "a".repeat(300);
    const meta = buildPageMeta({ page: "post", post: makePost({ summary: longSummary }) });
    expect(meta.description.length).toBe(160);
    expect(meta.description.endsWith("…")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildPageMeta() — tag page
// ---------------------------------------------------------------------------
describe("buildPageMeta() — tag page", () => {
  it("returns valid PageMeta for a tag page", () => {
    const meta = buildPageMeta({ page: "tag", tag: "ai-safety", tagCount: 5 });
    expect(() => PageMetaSchema.parse(meta)).not.toThrow();
  });

  it("sets type to website", () => {
    const meta = buildPageMeta({ page: "tag", tag: "ai-safety", tagCount: 3 });
    expect(meta.type).toBe("website");
  });

  it("includes tag name in title", () => {
    const meta = buildPageMeta({ page: "tag", tag: "ai-safety", tagCount: 3 });
    expect(meta.title).toContain("ai-safety");
  });

  it("includes post count in description", () => {
    const meta = buildPageMeta({ page: "tag", tag: "ai-safety", tagCount: 5 });
    expect(meta.description).toContain("5 posts");
  });

  it("handles singular post count", () => {
    const meta = buildPageMeta({ page: "tag", tag: "rare-tag", tagCount: 1 });
    expect(meta.description).toContain("1 post ");
    expect(meta.description).not.toContain("1 posts");
  });

  it("sets canonical URL to /tags/<tag>", () => {
    const meta = buildPageMeta({ page: "tag", tag: "ai-safety" });
    expect(meta.url).toBe(`${SITE_URL}/tags/ai-safety`);
  });

  it("does not include article metadata", () => {
    const meta = buildPageMeta({ page: "tag", tag: "test" });
    expect(meta.article).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// buildPageMeta() — 404 page
// ---------------------------------------------------------------------------
describe("buildPageMeta() — 404 page", () => {
  it("returns valid PageMeta", () => {
    const meta = buildPageMeta({ page: "404" });
    expect(() => PageMetaSchema.parse(meta)).not.toThrow();
  });

  it("sets type to website", () => {
    const meta = buildPageMeta({ page: "404" });
    expect(meta.type).toBe("website");
  });

  it("uses summary twitter card", () => {
    const meta = buildPageMeta({ page: "404" });
    expect(meta.twitterCard).toBe("summary");
  });

  it("title indicates page not found", () => {
    const meta = buildPageMeta({ page: "404" });
    expect(meta.title.toLowerCase()).toContain("not found");
  });

  it("does not include article metadata or JSON-LD", () => {
    const meta = buildPageMeta({ page: "404" });
    expect(meta.article).toBeUndefined();
    expect(meta.jsonLd).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// OG image resolution
// ---------------------------------------------------------------------------
describe("OG image resolution", () => {
  it("uses default OG image when post has no cover", () => {
    const meta = buildPageMeta({ page: "post", post: makePost({ slug: "nonexistent-slug-xyz" }) });
    expect(meta.image.url).toContain("og-default.png");
    expect(meta.image.width).toBe(1200);
    expect(meta.image.height).toBe(630);
  });

  it("uses slug-specific og.png when it exists", () => {
    // bun-for-backend has a generated og.png from spec 011
    const meta = buildPageMeta({ page: "post", post: makePost({ slug: "bun-for-backend" }) });
    expect(meta.image.url).toContain("/assets/covers/bun-for-backend/og.png");
    expect(meta.image.url).toMatch(/^https?:\/\//);
  });

  it("OG image is always 1200x630", () => {
    const meta = buildPageMeta({ page: "post", post: makePost({ slug: "bun-for-backend" }) });
    expect(meta.image.width).toBe(1200);
    expect(meta.image.height).toBe(630);
  });

  it("OG image type is image/png", () => {
    const meta = buildPageMeta({ page: "home" });
    expect(meta.image.type).toBe("image/png");
  });

  it("home page uses default OG image", () => {
    const meta = buildPageMeta({ page: "home" });
    expect(meta.image.url).toContain("og-default.png");
  });

  it("tag page uses default OG image", () => {
    const meta = buildPageMeta({ page: "tag", tag: "test" });
    expect(meta.image.url).toContain("og-default.png");
  });

  it("404 page uses default OG image", () => {
    const meta = buildPageMeta({ page: "404" });
    expect(meta.image.url).toContain("og-default.png");
  });
});

// ---------------------------------------------------------------------------
// JSON-LD structure
// ---------------------------------------------------------------------------
describe("JSON-LD structure", () => {
  it("Person JSON-LD includes required fields", () => {
    const meta = buildPageMeta({ page: "home" });
    const ld = meta.jsonLd!;
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Person");
    expect(ld["name"]).toBeTruthy();
    expect(ld["jobTitle"]).toBeTruthy();
    expect(ld["url"]).toBe(SITE_URL);
    expect(Array.isArray(ld["sameAs"])).toBe(true);
  });

  it("Article JSON-LD includes required fields", () => {
    const post = makePost({ title: "Test", date: "2026-01-15", tags: ["a"] });
    const meta = buildPageMeta({ page: "post", post });
    const ld = meta.jsonLd!;
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Article");
    expect(ld["headline"]).toBe("Test");
    expect(ld["datePublished"]).toBe("2026-01-15");
    expect(ld["image"]).toBeTruthy();
    expect(ld["author"]).toBeDefined();
    expect((ld["author"] as Record<string, unknown>)["@type"]).toBe("Person");
    expect(ld["keywords"]).toEqual(["a"]);
  });

  it("Article JSON-LD includes dateModified when post has updated", () => {
    const post = makePost({ updated: "2026-02-01" });
    const meta = buildPageMeta({ page: "post", post });
    expect(meta.jsonLd!["dateModified"]).toBe("2026-02-01");
  });

  it("Article JSON-LD omits dateModified when post has no updated", () => {
    const post = makePost();
    const meta = buildPageMeta({ page: "post", post });
    expect(meta.jsonLd!["dateModified"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// OG image files exist on disk
// ---------------------------------------------------------------------------
describe("OG image files", () => {
  it("og-default.png exists", () => {
    const p = path.resolve(process.cwd(), "public/assets/og-default.png");
    expect(fs.existsSync(p)).toBe(true);
  });

  it("og-default.png is a valid PNG", async () => {
    const sharp = (await import("sharp")).default;
    const p = path.resolve(process.cwd(), "public/assets/og-default.png");
    const metadata = await sharp(p).metadata();
    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(630);
  });

  it("blog post og.png has correct dimensions", async () => {
    const sharp = (await import("sharp")).default;
    const p = path.resolve(process.cwd(), "public/assets/covers/bun-for-backend/og.png");
    if (!fs.existsSync(p)) return; // skip if not generated
    const metadata = await sharp(p).metadata();
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(630);
  });

  it("talk og.png with badge has correct dimensions", async () => {
    const sharp = (await import("sharp")).default;
    const p = path.resolve(process.cwd(), "public/assets/covers/securing-agentic-systems/og.png");
    if (!fs.existsSync(p)) return;
    const metadata = await sharp(p).metadata();
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(630);
  });
});

// ---------------------------------------------------------------------------
// Zod schema validation
// ---------------------------------------------------------------------------
describe("PageMetaSchema validation", () => {
  it("accepts a complete home page meta", () => {
    const meta = buildPageMeta({ page: "home" });
    expect(() => PageMetaSchema.parse(meta)).not.toThrow();
  });

  it("accepts a complete post meta", () => {
    const meta = buildPageMeta({ page: "post", post: makePost() });
    expect(() => PageMetaSchema.parse(meta)).not.toThrow();
  });

  it("accepts a complete tag meta", () => {
    const meta = buildPageMeta({ page: "tag", tag: "test", tagCount: 3 });
    expect(() => PageMetaSchema.parse(meta)).not.toThrow();
  });

  it("accepts a complete 404 meta", () => {
    const meta = buildPageMeta({ page: "404" });
    expect(() => PageMetaSchema.parse(meta)).not.toThrow();
  });
});
