# 003 — Mermaid Diagram Support in Posts

> Status: `prototype`
> Mode: `prototype`
> Date: 2026-03-18

## Intent

Jean-Paul can embed Mermaid diagrams directly in his Markdown blog posts using standard fenced code blocks (` ```mermaid `). The diagrams render as styled, interactive SVGs on the post detail page — matching the site's dark theme and DA palette — with no manual image creation or external tooling required.

## Shared Schema

```typescript
// No new schema types required.
// Mermaid blocks are detected at the rehype/remark plugin level
// inside the existing Markdown → HTML pipeline from spec 001.

/**
 * Detection: any fenced code block with language "mermaid"
 *
 * ```mermaid
 * graph LR
 *   A[Agent] --> B[Guardrails]
 *   B --> C[Deploy]
 * ```
 *
 * is transformed into a rendered <div class="mermaid-diagram"> at build time
 * or hydrated client-side via the Mermaid JS runtime.
 */
```

## API Acceptance Criteria

- [ ] API-1: Fenced code blocks with language `mermaid` in any post Markdown file are detected and rendered as diagrams — not displayed as raw code.
- [ ] API-2: **Rendering strategy (pick one during implementation):**
  - **Option A — Build-time (preferred):** A remark/rehype plugin calls `mermaid.render()` via `@mermaid-js/mermaid-cli` (mmdc) or `mermaid` + `puppeteer`/`playwright` at build time, replacing the code block with an inline `<svg>` element. Zero client-side JS for diagrams.
  - **Option B — Client-side:** The raw mermaid code is preserved in a `<pre class="mermaid">` block and rendered client-side by loading the `mermaid` library. Lighter build, but adds ~200 KB to client bundle (lazy-loaded).
- [ ] API-3: The Mermaid library is initialized with a custom theme configuration that matches the site's DA palette:
  ```javascript
  {
    theme: 'base',
    themeVariables: {
      primaryColor: '#7C3AED',        // violet-600
      primaryTextColor: '#E2E8F0',    // slate-200
      primaryBorderColor: '#6366F1',  // indigo-500
      lineColor: '#334155',           // slate-700
      secondaryColor: '#1E1B4B',      // indigo-950
      tertiaryColor: '#0B0F19',       // background
      background: '#0B0F19',
      mainBkg: '#0B0F19',
      nodeBorder: '#6366F1',
      clusterBkg: 'rgba(99,102,241,0.08)',
      clusterBorder: '#334155',
      titleColor: '#E2E8F0',
      edgeLabelBackground: '#0B0F19',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
    }
  }
  ```
- [ ] API-4: All Mermaid diagram types commonly used in engineering blogs are supported: `graph`/`flowchart`, `sequenceDiagram`, `classDiagram`, `stateDiagram-v2`, `erDiagram`, `gantt`, and `gitgraph`.
- [ ] API-5: If a Mermaid code block contains invalid syntax, the build (Option A) or client runtime (Option B) renders a styled error box with the syntax error message instead of silently failing or breaking the page.

## UI Acceptance Criteria

- [ ] UI-1: **Dark theme integration** — rendered diagrams use the DA palette (dark background, violet/indigo nodes, slate edges, light text). Diagrams feel native to the site, not like a default Mermaid embed.
- [ ] UI-2: **Container** — each diagram is wrapped in a `<figure class="mermaid-diagram">` with optional `<figcaption>` support (via a comment syntax like `%% caption: My diagram` on the first line of the mermaid block).
- [ ] UI-3: **Responsive** — diagrams scale horizontally to fit the post content width. On mobile, wide diagrams are horizontally scrollable inside their container (overflow-x: auto) rather than clipped or squished.
- [ ] UI-4: **Zoom / pan (optional, v1 stretch)** — clicking a diagram opens a full-width modal or expands it in place for complex diagrams. Not required for v1 — horizontal scroll is sufficient.
- [ ] UI-5: **Spacing** — diagrams have the same vertical margin as other block elements (code blocks, images) in the post body. No extra whitespace or layout jank.
- [ ] UI-6: **Syntax error state** — if a mermaid block has invalid syntax, the user sees a muted error card with a `⚠ Diagram render error` heading and the error message in monospace, styled consistently with the site (dark background, slate border, muted text). The rest of the post renders normally.
- [ ] UI-7: **Print / reader mode** — diagrams render as static SVGs that survive browser print and reader mode without requiring JS.

## Integration Acceptance Criteria

- [ ] E2E-1: A post containing a valid ` ```mermaid ` block builds successfully and displays a styled diagram on the detail page.
- [ ] E2E-2: A post containing multiple mermaid blocks (e.g. a flowchart and a sequence diagram) renders all of them correctly with independent styling.
- [ ] E2E-3: A post with zero mermaid blocks builds and renders identically to before — no regression, no extra JS loaded.
- [ ] E2E-4: A post with an invalid mermaid block builds without failure and renders the error state inline while the rest of the post content is unaffected.
- [ ] E2E-5: Mermaid diagrams are visible and correctly styled in both dark and light mode (if light mode is implemented per spec 001).
- [ ] E2E-6: The Lighthouse performance score on a post page with 3 mermaid diagrams remains ≥ 90.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Empty | Post has no mermaid blocks | Normal post rendering. No mermaid JS loaded (if Option B). |
| Loading | Client-side rendering in progress (Option B only) | Mermaid code block shown as styled `<pre>` with a subtle shimmer/fade while rendering. |
| Populated | Valid mermaid block rendered | SVG diagram matching the DA palette, responsive within the post. |
| Error | Invalid mermaid syntax | Muted error card: `⚠ Diagram render error` with the error message. Rest of post unaffected. |

## Non-goals

- No visual editor for authoring mermaid diagrams — Jean-Paul writes them in Markdown directly (VS Code has excellent Mermaid preview extensions).
- No export-to-PNG/PDF button on individual diagrams in v1.
- No editable / live-playground diagrams in v1 — diagrams are read-only.
- No custom Mermaid directives or extensions beyond the standard library.
- No diagram indexing or "list of figures" generation.

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| Very wide diagram (e.g. 20-node flowchart) | UI | Container gets `overflow-x: auto`. User can scroll horizontally. Diagram is not resized to illegibility. |
| Very tall diagram (e.g. long sequence diagram) | UI | Renders at full height. No max-height clipping. |
| Mermaid block inside a blockquote or nested list | Markdown parser | Rendered normally — the remark/rehype plugin detects mermaid blocks regardless of nesting depth. |
| Post has mermaid + regular code blocks | Markdown parser | Only blocks with language `mermaid` are transformed. Blocks with `js`, `python`, etc. use syntax highlighting as before. |
| Mermaid code contains HTML entities or special chars | Renderer | Properly escaped. No XSS risk since content is author-controlled. |
| Mermaid library version upgrade changes rendering | Build | Pin mermaid version in `package.json`. Upgrade intentionally and visually review. |
| RSS feed / summary includes a mermaid block | Build | The mermaid code block is stripped from RSS summaries. Only the `summary` frontmatter field is used in feeds. |

## Directory Structure (additions to spec 001)

```
├── lib/
│   └── mermaid-theme.ts        # DA-compliant Mermaid themeVariables config
├── components/
│   └── MermaidDiagram.tsx       # Client component (Option B) or just CSS (Option A)
```

**If Option A (build-time):**
```
├── plugins/
│   └── rehype-mermaid.ts       # Custom rehype plugin: mermaid code → inline SVG
```

**If Option B (client-side):**
```
├── components/
│   └── MermaidDiagram.tsx       # Lazy-loads mermaid, renders on mount, error boundary
```

## External Dependencies

**Option A (build-time — preferred):**
- **`@mermaid-js/mermaid-cli`** (`mmdc`) — CLI wrapper around Mermaid + Puppeteer for server-side SVG rendering. Used in a custom rehype plugin during build.
- OR **`rehype-mermaid`** — community rehype plugin that handles the detection + rendering pipeline. Evaluate whether it supports custom `themeVariables`.

**Option B (client-side):**
- **`mermaid`** — Client-side rendering library (~200 KB, lazy-loaded only on pages with mermaid blocks).

**Both options:**
- **`JetBrains Mono`** — already loaded in spec 001 for code blocks. Reused for diagram labels.

## Open Questions

- [ ] Option A (build-time SVG) vs Option B (client-side)? Build-time is better for performance and SEO but adds Puppeteer/Playwright as a build dependency (heavier CI). Client-side is simpler to set up but adds bundle weight.
- [ ] Should the `%% caption: ...` syntax be supported in v1, or defer figcaptions entirely?
- [ ] Should diagrams get an automatic `id` anchor (e.g. `#diagram-1`) so they can be linked to from other sections of the post?

## Post-Implementation Notes

_Filled when status → complete. Not required for prototypes._

- ...