import { buildPageMeta } from "../../src/ui/lib/meta";
import { MetaTags } from "../../src/ui/components/meta-tags";

export function Head() {
  const meta = buildPageMeta({ page: "404" });
  return <MetaTags meta={meta} />;
}
