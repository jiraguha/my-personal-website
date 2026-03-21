import { useData } from "vike-react/useData";
import type { Data } from "./+data";
import { buildPageMeta } from "../../../src/ui/lib/meta";
import { MetaTags } from "../../../src/ui/components/meta-tags";

export function Head() {
  const { post } = useData<Data>();
  const meta = buildPageMeta({ page: "post", post, content: post.content });
  return <MetaTags meta={meta} />;
}
