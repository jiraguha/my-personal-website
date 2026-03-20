import type { PageContext } from "vike/types";
import { getPostsByTag, toPostCard } from "../../../src/ui/lib/posts";
import { getTrendingTagSet } from "../../../src/ui/lib/trending";
import type { PostCard } from "@shared/schemas/site.schema";

export type Data = {
  tag: string;
  posts: PostCard[];
  isTrending: boolean;
};

export function data(pageContext: PageContext): Data {
  const { tag } = pageContext.routeParams;
  const posts = getPostsByTag(tag).map(toPostCard);
  const isTrending = getTrendingTagSet().has(tag.toLowerCase());

  return { tag, posts, isTrending };
}
