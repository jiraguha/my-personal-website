import type { PageContext } from "vike/types";
import { render } from "vike/abort";
import { getPostBySlug, type Post } from "../../../src/ui/lib/posts";

export type Data = {
  post: Post;
};

export function data(pageContext: PageContext): Data {
  const { slug } = pageContext.routeParams;
  const post = getPostBySlug(slug);

  if (!post) {
    throw render(404, `Post not found: ${slug}`);
  }

  return { post };
}
