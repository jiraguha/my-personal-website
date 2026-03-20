import type { TrendingTag } from "@shared/schemas/tags.schema";
import { SectionDivider } from "./SectionDivider";

interface TrendingTagsProps {
  tags: TrendingTag[];
}

function tierClasses(rank: number): string {
  if (rank <= 2) {
    return [
      "border-violet-400 dark:border-violet-500",
      "text-violet-700 dark:text-violet-300",
      "hover:bg-violet-50 dark:hover:bg-violet-900/30",
      "hover:shadow-[0_0_8px_rgba(124,58,237,0.35)]",
    ].join(" ");
  }
  if (rank <= 5) {
    return [
      "border-indigo-400 dark:border-indigo-500",
      "text-indigo-700 dark:text-indigo-300",
      "hover:bg-indigo-50 dark:hover:bg-indigo-900/30",
      "hover:shadow-[0_0_8px_rgba(99,102,241,0.25)]",
    ].join(" ");
  }
  return [
    "border-gray-300 dark:border-gray-700",
    "text-gray-500 dark:text-gray-400",
    "hover:bg-gray-50 dark:hover:bg-gray-800/60",
  ].join(" ");
}

export function TrendingTags({ tags }: TrendingTagsProps) {
  if (tags.length === 0) return null;

  return (
    <section aria-label="Trending tags">
      <div className="mb-4">
        <SectionDivider label="Trending" />
      </div>

      {/* Chip row — wraps on desktop, horizontal scroll on mobile */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-x-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tags.map((t) => (
            <a
              key={t.tag}
              href={`/tags/${t.tag}`}
              className={[
                "flex-shrink-0 inline-flex items-center gap-1.5",
                "px-3 py-1.5 rounded-md border text-sm font-medium",
                "transition-all duration-150 hover:-translate-y-px",
                tierClasses(t.rank),
              ].join(" ")}
            >
              # {t.displayName}
              <span className="text-xs opacity-50 font-normal">×{t.count}</span>
            </a>
          ))}
        </div>
        {/* Mobile fade-out hint */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white dark:from-gray-950 to-transparent sm:hidden" />
      </div>
    </section>
  );
}
