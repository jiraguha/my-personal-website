# 006 — Reveal.js Talk Presentations

> Status: `complete`
> Mode: `full`
> Date: 2026-03-19

## Intent

Jean-Paul can author conference talks, meetup presentations, and tech deep-dives as Markdown files in his repo, and the site renders them as full Reveal.js slide decks at `/talks/:slug`. Each talk also gets a card in the home page content grid (category: `talk`) with a "▶ Slides" badge linking to a landing page at `/posts/:slug`. Slides are written using standard Markdown with `---` separators, support code highlighting, Mermaid diagrams, and speaker notes — themed to match the site's DA palette in both light and dark mode.

## Shared Schema

```typescript
// src/shared/schemas/site.schema.ts (additions to PostFrontmatterSchema)

// Talk-specific optional fields (valid on any post, meaningful only for category: "talk")
event?: string;          // e.g. "KubeCon EU 2026"
eventUrl?: string;       // Link to the event page
eventDate?: string;      // ISO date of the presentation
videoUrl?: string;       // Link to a recording
externalSlides?: string; // If set: link to external slides; no /talks/:slug rendered

// PostCardSchema also picks externalSlides for badge logic in PostCard

/**
 * Markdown authoring conventions for slides:
 *
 * ---        → horizontal slide separator (on its own line, blank lines around it)
 * ----       → vertical slide separator
 * Note: ...  → speaker notes line (stripped from rendered slide content)
 */
```

## API Acceptance Criteria

- [x] API-1: `PostFrontmatterSchema` accepts `event`, `eventUrl`, `eventDate`, `videoUrl`, `externalSlides` as optional strings; `.safeParse()` succeeds with or without them.
- [x] API-2: `PostCardSchema` includes `externalSlides` so card components can conditionally show the slides badge.
- [x] API-3: `parseSlides(content)` splits on `\n---\n` → horizontal slides; each split further on `\n----\n` → vertical groups. Returns `string[][]`.
- [x] API-4: `stripNotes(slide)` removes everything from `\nNote:` to end of string, then trims.
- [x] API-5: `toPostCard()` passes `externalSlides` through to the card shape.
- [x] API-6: A talk with `externalSlides` set redirects `/talks/:slug` to 404 — no deck is rendered.

## UI Acceptance Criteria

- [x] UI-1: `/talks/:slug` renders a full-viewport Reveal.js deck — `<Nav>` and `<Footer>` are absent from the DOM.
- [x] UI-2: A "Back to site" overlay link is visible for 3 s on load, fades on inactivity, reappears on mouse/touch.
- [x] UI-3: Slides are built from `parseSlides(post.content)` — each string entry becomes a `<section>`; vertical groups become nested `<section>` elements.
- [x] UI-4: `stripNotes()` removes `Note:` lines so speaker notes never appear in the rendered deck.
- [x] UI-5: Code blocks are left-aligned, syntax-highlighted via `rehype-highlight`; background is slate-100 in light mode, `#0d1117` in dark mode.
- [x] UI-6: ` ```mermaid ` fences render as themed diagrams — dark DA palette in dark mode, soft teal-50 palette in light mode.
- [x] UI-7: Paragraphs longer than 60 characters are left-aligned; short text and headings stay centred.
- [x] UI-8: Light/dark mode is driven by `:root.dark`, matching the site theme toggle — no hardcoded dark background.
- [x] UI-9: `/posts/:slug` for `category: "talk"` renders the `TalkLanding` component, not the standard markdown body.
- [x] UI-10: `TalkLanding` shows: cover image (if set), title, summary, event name + optional link, date, tags, "View Slides →" CTA (or "View External Slides →" when `externalSlides` is set), "Watch Recording →" when `videoUrl` is set.
- [x] UI-11: `PostCard` for a talk without `externalSlides` shows a `▶ Slides` badge next to the date.

## Integration Acceptance Criteria

- [ ] E2E-1: Talk card in the home grid shows `▶ Slides` badge; clicking navigates to `/posts/:slug` (landing page, not the deck directly).
- [ ] E2E-2: Landing page has a "View Slides →" button that navigates to `/talks/:slug`.
- [ ] E2E-3: Presentation page has no nav or footer in the DOM.
- [ ] E2E-4: Presentation renders more than one `.slides section` for a post with `---` separators.
- [ ] E2E-5: "Back to site" link on the presentation navigates back to `/posts/:slug`.
- [ ] E2E-6: A talk with `externalSlides` set shows "View External Slides →" on its landing page and `/talks/:slug` redirects to 404.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Landing | `/posts/:slug` for a talk | Metadata page: cover, title, event, summary, tags, CTAs |
| Deck | `/talks/:slug` for a talk without `externalSlides` | Full-viewport Reveal.js presentation |
| External | `externalSlides` is set | Landing page with "View External Slides →"; `/talks/:slug` → 404 |
| No slides | Talk body has no `---` | Single-slide deck with all content on one slide |
| Dark mode | `:root.dark` present | Dark background (`#0b0f19`), light text, dark Mermaid palette |
| Light mode | No `:root.dark` | Light background (`#f8fafc`), slate text, soft teal Mermaid palette |

## Non-goals

- OG meta tags per talk (no meta tag system on the site yet)
- `RevealConfig` per-talk overrides via frontmatter
- Stepped line highlights (`[1-2|3|4]` syntax)
- Per-slide background HTML comments
- PDF export, live audience features, kiosk mode

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| Talk body has no `---` | `parseSlides` | Returns `[[ fullContent ]]` — single slide |
| `Note:` on first line of slide | `stripNotes` | Entire content stripped (only `\nNote:` pattern is matched; leading `Note:` without preceding `\n` is kept) |
| `externalSlides` is empty string `""` | UI | Treated as falsy — "View Slides →" shown, `/talks/:slug` renders deck |
| Talk has no `event` | Landing | Event line omitted cleanly |
| Talk has no `videoUrl` | Landing | "Watch Recording →" button absent |

## External Dependencies

- **`reveal.js@6`** — Presentation framework. Notes plugin only (no Markdown or Highlight plugins — those are handled by React).
- **`react-markdown`** + **`remark-gfm`** + **`rehype-highlight`** — Slide content rendered via the same pipeline as blog posts.
- **`mermaid`** — Already in spec 004. `SlideMermaid` component re-initializes with light/dark config per render.
- **`highlight.js/styles/github-dark.css`** — Overridden in `talk-presentation.css` for light mode.

## Post-Implementation Notes

- Slides are React-rendered (ReactMarkdown + remark-gfm + rehype-highlight) rather than using the Reveal.js Markdown plugin. This gives proper Mermaid support and code highlighting via the same pipeline as blog posts.
- `parseSlides` / `stripNotes` extracted to `src/ui/lib/slides.ts` for direct unit testing.
- Light/dark mode handled entirely via `:root.dark` CSS selectors — no JS theme detection needed.
- `SlideMermaid` (in `TalkPresentation.tsx`) re-initializes mermaid with the appropriate palette on each render, separate from the global `MermaidDiagram` component used in blog posts.
- `/talks/:slug` route sits outside the `<Layout>` wrapper in `main.tsx` so nav/footer are absent from the DOM.
