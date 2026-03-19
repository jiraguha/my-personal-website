import { useState, useEffect, useRef, useCallback } from "react";

interface PostSearchProps {
  query: string;
  onChange: (query: string) => void;
  resultCount: number | null;
}

export function PostSearch({ query, onChange, resultCount }: PostSearchProps) {
  const [localValue, setLocalValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external query changes (e.g. clear from empty state link)
  useEffect(() => {
    setLocalValue(query);
  }, [query]);

  const debouncedOnChange = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange(value);
      }, 150);
    },
    [onChange],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (value: string) => {
    const capped = value.slice(0, 100);
    setLocalValue(capped);
    debouncedOnChange(capped);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setLocalValue("");
      onChange("");
      inputRef.current?.blur();
    }
  };

  // Global "/" shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        !document.activeElement?.getAttribute("contenteditable")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          aria-label="Search posts"
          placeholder="Search posts..."
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full sm:w-[250px] h-[38px] pl-9 pr-8 rounded-md text-sm
            bg-gray-100 dark:bg-gray-900
            border border-gray-300 dark:border-slate-700
            focus:border-indigo-500 dark:focus:border-indigo-500
            focus:outline-none focus:ring-1 focus:ring-indigo-500
            text-gray-900 dark:text-slate-200
            placeholder:text-gray-500 dark:placeholder:text-slate-500
            transition-colors"
        />
        {/* Clear button */}
        {localValue && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5
              text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300
              transition-colors"
          >
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
      {/* Result count */}
      {resultCount !== null && (
        <span
          className="text-xs text-gray-500 dark:text-slate-500 pl-1"
          aria-live="polite"
        >
          {resultCount === 0
            ? "No results found"
            : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
        </span>
      )}
    </div>
  );
}
