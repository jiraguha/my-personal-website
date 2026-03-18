import type { ContentCategory } from "@shared/schemas/site.schema";

type FilterOption = ContentCategory | "all";

interface CategoryFilterProps {
  active: FilterOption;
  onChange: (cat: FilterOption) => void;
}

const OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "blog", label: "Blog" },
  { value: "project", label: "Projects" },
  { value: "talk", label: "Talks" },
];

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active === value
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
