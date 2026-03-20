import { useData } from "vike-react/useData";
import type { Data } from "./+data";

export function Head() {
  const { tag, posts } = useData<Data>();
  return (
    <>
      <title>#{tag} — Jean-Paul Iraguha</title>
      <meta
        name="description"
        content={`${posts.length} post${posts.length !== 1 ? "s" : ""} tagged with "${tag}"`}
      />
    </>
  );
}
