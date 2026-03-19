import {
  PostFrontmatterSchema,
  type PostCard,
  type PostFrontmatter,
} from "@shared/schemas/site.schema";

export interface Post extends PostFrontmatter {
  content: string;
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

const rawFiles = import.meta.glob("/src/content/posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function loadPosts(): Post[] {
  const isDev = import.meta.env.DEV;

  return Object.entries(rawFiles)
    .map(([filePath, raw]) => {
      const { data, content } = parseFrontmatter(raw);
      const slug = filePath.replace("/src/content/posts/", "").replace(/\.md$/, "");
      const result = PostFrontmatterSchema.safeParse({ slug, ...data });
      if (!result.success) {
        console.warn(`Invalid frontmatter in ${filePath}:`, result.error.format());
        return null;
      }
      return { ...result.data, content };
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
