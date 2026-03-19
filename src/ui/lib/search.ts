import Fuse, { type IFuseOptions } from "fuse.js";
import type { SearchEntry } from "@shared/schemas/search.schema";
import type { PostCard } from "@shared/schemas/site.schema";

const FUSE_OPTIONS: IFuseOptions<SearchEntry> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "summary", weight: 0.3 },
    { name: "tags", weight: 0.3 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

/** Build a SearchEntry from a PostCard */
export function toSearchEntry(post: PostCard): SearchEntry {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    tags: post.tags,
    category: post.category,
    date: post.date,
  };
}

/** Create a Fuse instance from post cards */
export function createSearchIndex(posts: PostCard[]): Fuse<SearchEntry> {
  const entries = posts.map(toSearchEntry);
  return new Fuse(entries, FUSE_OPTIONS);
}

/** Search posts and return matching slugs */
export function searchPosts(
  index: Fuse<SearchEntry>,
  query: string,
): Set<string> {
  const trimmed = query.trim().slice(0, 100);
  if (trimmed.length < 2) {
    return new Set();
  }
  // Strip special characters that could cause issues
  const sanitized = trimmed.replace(/[#@$%^&*()+=\[\]{}|\\<>]/g, "");
  if (sanitized.length < 2) {
    return new Set();
  }
  const results = index.search(sanitized);
  return new Set(results.map((r) => r.item.slug));
}
