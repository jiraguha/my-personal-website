import fs from "node:fs";
import path from "node:path";
import {
  PostFrontmatterSchema,
  type PostCard,
  type PostFrontmatter,
} from "@shared/schemas/site.schema";

export interface Post extends PostFrontmatter {
  content: string;
  /** True if `cover` was auto-resolved from generated covers, not set in frontmatter */
  coverAutoResolved?: boolean;
}

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

function findMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

function getContentDir(): string {
  const contentDir = process.env.CONTENT_DIR || "src/content";
  return path.resolve(process.cwd(), contentDir, "posts");
}

function loadPosts(): Post[] {
  const isDev = process.env.NODE_ENV === "development";
  const postsDir = getContentDir();
  const files = findMarkdownFiles(postsDir);

  return files
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = parseFrontmatter(raw);
      const slug = path.basename(filePath, ".md");
      const result = PostFrontmatterSchema.safeParse({ slug, ...data });
      if (!result.success) {
        console.warn(`Invalid frontmatter in ${filePath}:`, result.error.format());
        return null;
      }
      const post: Post = { ...result.data, content };
      // Convention-based cover auto-resolve (spec 011):
      // If cover is empty, check for a generated cover at the known path
      if (!post.cover) {
        const generatedCover = path.resolve(process.cwd(), "public/assets/covers", post.slug, "cover.png");
        if (fs.existsSync(generatedCover)) {
          post.cover = `/assets/covers/${post.slug}/cover.png`;
          post.coverAutoResolved = true;
        }
      }
      return post;
    })
    .filter((p): p is Post => p !== null)
    .filter((p) => isDev || (!p.draft && new Date(p.date) <= new Date()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

let _posts: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (!_posts) _posts = loadPosts();
  return _posts;
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getFeaturedPost(): Post | undefined {
  return getAllPosts().find((p) => p.featured && p.category !== "short");
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  getAllPosts().forEach((p) => p.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

export function toPostCard(post: Post): PostCard {
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
    externalSlides: post.externalSlides,
  };
}
