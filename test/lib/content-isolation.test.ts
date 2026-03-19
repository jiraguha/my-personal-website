/**
 * Unit tests for 008-content-isolation.
 * Verifies that content loading is configurable and slug derivation
 * works regardless of content directory.
 */

import { describe, it, expect } from "vitest";
import { PostFrontmatterSchema } from "@shared/schemas/site.schema";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Re-implement parseFrontmatter + buildPost to test slug derivation
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

// ---------------------------------------------------------------------------
// UI-3: Slug derivation works regardless of content directory
// ---------------------------------------------------------------------------

describe("UI-3: Slug derivation is content-dir agnostic", () => {
  // The slug extraction regex should strip any prefix up to and including
  // the category folder, regardless of whether content is at
  // /src/content/posts/ or /test/content/posts/

  const extractSlug = (filePath: string): string => {
    // Generic pattern: strip everything up to posts/<category>/
    return filePath.replace(/^.*\/posts\/[^/]+\//, "").replace(/\.md$/, "");
  };

  it("extracts slug from src/content path", () => {
    expect(extractSlug("/src/content/posts/blog/my-post.md")).toBe("my-post");
  });

  it("extracts slug from test/content path", () => {
    expect(extractSlug("/test/content/posts/blog/my-post.md")).toBe("my-post");
  });

  it("extracts slug from any nested content path", () => {
    expect(extractSlug("/some/other/dir/posts/talk/my-talk.md")).toBe("my-talk");
  });
});

// ---------------------------------------------------------------------------
// UI-5: test/content/posts/ has all required post types
// ---------------------------------------------------------------------------

describe("UI-5: test/content/ has fixture posts for all types", () => {
  const testContentDir = path.resolve(process.cwd(), "test/content/posts");

  const findMdFiles = (dir: string): string[] => {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...findMdFiles(full));
      else if (entry.name.endsWith(".md")) files.push(full);
    }
    return files;
  };

  const loadTestPosts = () => {
    const files = findMdFiles(testContentDir);
    return files
      .map((f) => {
        const raw = fs.readFileSync(f, "utf-8");
        const { data, content } = parseFrontmatter(raw);
        const slug = f.replace(/^.*\/posts\/[^/]+\//, "").replace(/\.md$/, "");
        const result = PostFrontmatterSchema.safeParse({ slug, ...data });
        if (!result.success) return null;
        return { ...result.data, content, filePath: f };
      })
      .filter(Boolean);
  };

  it("test/content/posts/ directory exists", () => {
    expect(fs.existsSync(testContentDir)).toBe(true);
  });

  it("has at least one blog post", () => {
    const posts = loadTestPosts();
    expect(posts.some((p) => p?.category === "blog")).toBe(true);
  });

  it("has at least one project post", () => {
    const posts = loadTestPosts();
    expect(posts.some((p) => p?.category === "project")).toBe(true);
  });

  it("has at least one talk post", () => {
    const posts = loadTestPosts();
    expect(posts.some((p) => p?.category === "talk")).toBe(true);
  });

  it("has at least one short post", () => {
    const posts = loadTestPosts();
    expect(posts.some((p) => p?.category === "short")).toBe(true);
  });

  it("has at least one featured post", () => {
    const posts = loadTestPosts();
    expect(posts.some((p) => p?.featured === true)).toBe(true);
  });

  it("has at least one draft post", () => {
    const posts = loadTestPosts();
    expect(posts.some((p) => p?.draft === true)).toBe(true);
  });

  it("has at least one post with externalUrl", () => {
    const posts = loadTestPosts();
    expect(posts.some((p) => p?.externalUrl)).toBe(true);
  });

  it("all fixture posts pass Zod validation", () => {
    const files = findMdFiles(testContentDir);
    for (const f of files) {
      const raw = fs.readFileSync(f, "utf-8");
      const { data } = parseFrontmatter(raw);
      const slug = f.replace(/^.*\/posts\/[^/]+\//, "").replace(/\.md$/, "");
      const result = PostFrontmatterSchema.safeParse({ slug, ...data });
      expect(result.success, `Invalid frontmatter in ${f}: ${JSON.stringify(result.error?.format())}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// UI-6: test/content/profile.json exists and is valid
// ---------------------------------------------------------------------------

describe("UI-6: test/content/profile.json", () => {
  const profilePath = path.resolve(process.cwd(), "test/content/profile.json");

  it("exists", () => {
    expect(fs.existsSync(profilePath)).toBe(true);
  });

  it("is valid JSON with required fields", () => {
    const raw = fs.readFileSync(profilePath, "utf-8");
    const profile = JSON.parse(raw);
    expect(profile.name).toBeDefined();
    expect(profile.role).toBeDefined();
    expect(profile.socials).toBeDefined();
  });
});
