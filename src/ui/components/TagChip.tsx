interface TagChipProps {
  tag: string;
  clickable?: boolean;
}

export function TagChip({ tag, clickable = true }: TagChipProps) {
  const classes =
    "inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors";

  if (!clickable) {
    return <span className={classes}>{tag}</span>;
  }

  return (
    <a href={`/tags/${tag}`} className={classes}>
      {tag}
    </a>
  );
}
