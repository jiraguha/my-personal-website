import { useData } from "vike-react/useData";
import type { Data } from "./+data";

export function Head() {
  const { post } = useData<Data>();
  return (
    <>
      <title>{post.title} — Jean-Paul Iraguha</title>
      <meta name="description" content={post.summary} />
    </>
  );
}
