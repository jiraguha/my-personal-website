import { useData } from "vike-react/useData";
import type { Data } from "./+data";
import { buildPageMeta } from "../../../src/ui/lib/meta";
import { MetaTags } from "../../../src/ui/components/meta-tags";

export function Head() {
  const { tag, posts } = useData<Data>();
  const meta = buildPageMeta({ page: "tag", tag, tagCount: posts.length });
  return <MetaTags meta={meta} />;
}
