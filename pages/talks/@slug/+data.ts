import type { PageContext } from "vike/types";
import { render } from "vike/abort";
import { getPostBySlug, type Post } from "../../../src/ui/lib/posts";

export type Data = {
  post: Post;
};

export function data(pageContext: PageContext): Data {
  const { slug } = pageContext.routeParams;
  const post = getPostBySlug(slug);

  if (!post || post.category !== "talk" || post.externalSlides) {
    throw render(404, `Talk not found: ${slug}`);
  }

  return { post };
}
