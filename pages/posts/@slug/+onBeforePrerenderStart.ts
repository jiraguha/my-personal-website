import { getAllPosts } from "../../../src/ui/lib/posts";

export function onBeforePrerenderStart() {
  return getAllPosts().map((p) => `/posts/${p.slug}`);
}
