import { getAllPosts } from "../../../src/ui/lib/posts";

export function onBeforePrerenderStart() {
  return getAllPosts()
    .filter((p) => p.category === "talk" && !p.externalSlides)
    .map((p) => `/talks/${p.slug}`);
}
