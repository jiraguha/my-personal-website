# 003 — Mermaid Diagram Support in Posts

> Status: `complete`
> Mode: `full`
> Date: 2026-03-18

## Intent

Jean-Paul can embed Mermaid diagrams directly in Markdown posts using standard fenced code blocks (` ```mermaid `). Diagrams render as styled SVGs matching the site's teal palette, with graceful error handling and horizontal scroll for wide diagrams.

## Shared Schema

No new schema types. Mermaid blocks are detected at the `react-markdown` component level via the `language` className on `<code>` elements.

## API Acceptance Criteria

- [x] API-1: Fenced code blocks with language `mermaid` render as diagrams, not raw code.
- [x] API-2: Rendering is client-side (Option B) — mermaid is lazy-loaded via dynamic `import()` only when a post page mounts.
- [x] API-3: Mermaid is initialized with a custom `themeVariables` config matching the site's teal palette (`teal-600` primary, `gray-900` background, `slate-200` text).
- [x] API-4: All standard diagram types are supported: `flowchart`, `sequenceDiagram`, `stateDiagram-v2`, `classDiagram`, `erDiagram`, `gantt`, `gitgraph`.
- [x] API-5: Invalid mermaid syntax renders a styled error card instead of crashing the page.

## UI Acceptance Criteria

- [x] UI-1: Diagrams use the teal site palette — dark background, teal nodes, slate edges, light text.
- [x] UI-3: Each diagram is wrapped in `<figure class="overflow-x-auto">` — wide diagrams scroll horizontally on mobile.
- [x] UI-5: Diagrams have `my-6` margin, consistent spacing with other block elements.
- [x] UI-6: Invalid syntax renders an amber `⚠ Diagram render error` card with the error in monospace. Rest of post unaffected.

## Integration Acceptance Criteria

- [x] E2E-1: A post with a valid mermaid block displays a rendered SVG on the detail page.
- [x] E2E-2: A post with multiple mermaid blocks renders all of them independently.
- [x] E2E-3: A post with no mermaid blocks renders identically to before — no regression.
- [x] E2E-4: A post with an invalid mermaid block shows the error card while the rest renders normally.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Loading | Mermaid JS not yet initialised | Pulsing gray placeholder |
| Populated | Valid diagram | Styled SVG in `<figure>` |
| Error | Invalid mermaid syntax | Amber error card with message |

## Non-goals

- No build-time (Option A) SVG generation — client-side only.
- No figcaption via `%% caption:` syntax — deferred.
- No diagram `id` anchors for deep-linking.
- No zoom/pan modal — horizontal scroll is sufficient for v1.
- No print/reader mode guarantee — standard browser behaviour applies.

## Edge Cases

| Scenario | Expected |
|----------|----------|
| Very wide diagram | `overflow-x: auto` on figure — horizontal scroll, not clipped |
| Invalid syntax | Error card inline, rest of post unaffected |
| Non-mermaid code blocks | Unchanged — fall through to rehype-highlight |
| Multiple mermaid blocks | Each renders independently with its own ID |

## External Dependencies

- **`mermaid@11`** — client-side rendering, lazy-loaded via dynamic import

## Post-Implementation Notes

- Chose Option B (client-side) over Option A (build-time) to avoid Puppeteer/Playwright as a build dependency.
- Mermaid is initialised once (singleton flag) and reused across all diagrams on a page.
- Each render call gets a unique random ID to avoid Mermaid's internal ID collision errors.
