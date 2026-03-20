import { getAllTags } from "../../../src/ui/lib/posts";

export function onBeforePrerenderStart() {
  return getAllTags().map((t) => `/tags/${t}`);
}
