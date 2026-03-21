import type { PageContext } from "vike/types";
import { redirect } from "vike/abort";
import { getPostBySlug, type Post } from "../../../src/ui/lib/posts";

export type Data = {
  post: Post;
};

export function data(pageContext: PageContext): Data {
  const { slug } = pageContext.routeParams;
  const post = getPostBySlug(slug);

  if (!post || post.category !== "talk" || post.externalSlides) {
    throw redirect("/404");
  }

  return { post };
}
