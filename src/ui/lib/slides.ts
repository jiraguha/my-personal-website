/**
 * Pure slide-parsing helpers for spec 006 — Reveal.js talks.
 * Extracted here so they can be unit-tested without importing the React component.
 */

/**
 * Split raw post content into a 2-D array:
 *   result[h]     → horizontal slide at index h
 *   result[h][v]  → vertical sub-slide at index v
 *
 * Horizontal separator: a line containing only "---" (with blank lines around it)
 * Vertical separator:   a line containing only "----"
 */
export function parseSlides(content: string): string[][] {
  return content
    .split(/\n---\n/)
    .map((hSlide) => hSlide.split(/\n----\n/));
}

/**
 * Strip speaker notes from a slide's markdown.
 * Removes everything from the first "\nNote:" to the end of the string,
 * then trims surrounding whitespace.
 *
 * A "Note:" that appears at the very start of the string (no preceding \n)
 * is intentionally kept — it is not a notes marker.
 */
export function stripNotes(slide: string): string {
  return slide.replace(/\nNote:[\s\S]*$/, "").trim();
}
