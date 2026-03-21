# 011 — AI-Powered Cover Image Generation (Nano Banana Pro)

> Status: `prototype`
> Mode: `prototype`
> Date: 2026-03-18

## Intent

Jean-Paul can generate consistent, minimalistic, professional cover images for every blog post, project, or talk by running a single CLI command. The images are produced by Nano Banana Pro (Gemini 3 Pro Image, `gemini-3-pro-image-preview`) via the Gemini API, guided by a strict design-aesthetic (DA) prompt template that enforces visual consistency across the entire site. Every cover shares the same palette, spatial logic, and stylistic DNA — dark, glowing, cyberpunk-HUD — so the portfolio reads as one cohesive body of work, not a collection of unrelated thumbnails.

---

## Design Aesthetic (DA) — The Visual Contract

All generated covers must conform to this DA. The DA lives in an external file — `da.md` — at the project root. The generator reads `da.md` at runtime and injects its content as the system prompt prefix for every Nano Banana Pro API call. This means the visual contract can be changed by editing a single markdown file — no code changes, no redeployment of the generator script.

### DA as an External File

- **Location**: `da.md` in the project root (Git-tracked)
- **Format**: Plain markdown. The generator reads the raw text content and uses it as-is in the system prompt. The markdown structure (headings, tables, lists) is preserved — LLMs parse it well.
- **Workflow**: Edit `da.md` → run `bun run covers --force` → all covers regenerate with the new aesthetic.
- **Versioning**: Since `da.md` is Git-tracked, every DA change is in the commit history. No need for a separate versioning scheme — `git log da.md` shows the full evolution.
- **Validation**: The generator checks that `da.md` exists and is non-empty before proceeding. If missing, it exits with a clear error: `"Missing da.md — the design aesthetic file is required for cover generation."`
- **Override per post**: A post can set `coverDa: path/to/custom-da.md` in its frontmatter to use a different DA for that specific cover (e.g., for a special series with a different visual identity). If omitted, the root `da.md` is used.

### Principles

1. **Cyberpunk HUD aesthetic** — every cover looks like a screen capture from a futuristic command center or technical dashboard. Dark, glowing, engineered.
2. **Dual-color tension** — cyan (information, structure, knowledge) vs. red (risk, cost, warning, disruption). The interplay between these two colors tells a visual story.
3. **Circuit-board DNA** — thin circuit-trace patterns run along edges, corners, and between panels. These traces are a signature element that ties every cover together.
4. **Framed panels** — content is organized inside bordered panels/frames with glowing edges (cyan or red). Panels can contain diagrams, charts, labels, or iconography.
5. **Technical credibility** — the cover should look like a HUD from an engineering ops console, not stock art or a marketing illustration.
6. **Consistency across posts** — a visitor scrolling the grid should feel a unified visual identity — same palette, same circuit-trace language, same panel framing.

### Visual Specifications

| Token | Value | Notes |
|-------|-------|-------|
| Background | `#0B1120` (deep dark navy) | Solid dark base with optional subtle grid overlay |
| Primary accent | `#00E5FF` (bright cyan) | Glowing borders, active nodes, structural elements, information flow |
| Secondary accent | `#FF1744` (bright red) | Warning elements, cost/risk indicators, tension highlights |
| Tertiary / muted | `#1A2744` (dark slate-blue) | Grid lines, background panels, inactive scaffolding |
| Text on cover | `#E0E6ED` (light gray) | Monospace only — labels, status text, axis labels |
| Font reference | JetBrains Mono or equivalent monospace | For all text rendered inside the image |
| Grid overlay | Subtle blue grid lines on background | Faint engineering-paper grid behind content |
| Circuit traces | 1–2px lines with right-angle bends | Run along panel edges, corners, and between elements |
| Panel borders | Glowing 2px borders (cyan or red) | Rounded or beveled corners, subtle outer glow |
| Composition | Left-right split or centered with flanking panels | Content panel(s) + info panel(s) |
| Element style | Wireframe 3D, holographic, schematic | Nodes, cubes, funnels, graphs, network diagrams |
| Glow / bloom | Neon glow on primary elements | Cyan glow on borders and nodes, red glow on warning elements |
| Corner accents | Small geometric markers at panel corners | Squares, dots, or bracket shapes — registration-mark style |
| Bottom bar | Optional status bar with small text | System status, labels, or metadata in muted text |

### DA Prompt Template

```text
SYSTEM CONTEXT FOR ALL COVER GENERATIONS:

You are generating a cover image for a professional software engineering blog.

STRICT STYLE RULES — do not deviate:
- Background: deep dark navy (#0B1120) with a subtle faint grid overlay
- Color palette: bright cyan (#00E5FF) as primary accent for structure/information,
  bright red (#FF1744) as secondary accent for risk/tension/cost,
  dark slate-blue (#1A2744) for background panels, light gray (#E0E6ED) for text
- Style: cyberpunk HUD / technical dashboard — looks like a futuristic engineering
  ops console or command center display, NOT flat diagrams or stock art
- Circuit-board traces: thin (1-2px) lines with right-angle bends running along
  panel edges, corners, and between elements — a signature visual motif
- Framed panels: content organized inside bordered frames with glowing edges
  (cyan for information, red for warnings/risk). Panels have corner accents
  (small squares or bracket shapes at corners)
- Elements: wireframe 3D shapes, holographic objects, schematic diagrams,
  network graphs, flow visualizations — rendered with a glowing neon quality
- Text labels: JetBrains Mono or monospace font, short labels, status text,
  or axis labels — sparse and purposeful
- Glow effects: neon glow on primary elements (cyan and red), subtle bloom
  on borders and active nodes
- Composition: left-right panel split or centered content with flanking info panels
- Optional: small bottom status bar with muted metadata text
- Aspect ratio: 16:9 landscape
- Resolution: 1200x675 minimum

The result should feel like a screenshot from a futuristic engineering dashboard —
precise, glowing, technical, and visually striking with cyan-red contrast.
```

---

## Shared Schema

New cover fields are added to the existing `PostFrontmatterSchema` in `src/shared/schemas/site.schema.ts`. The custom frontmatter parser in `src/ui/lib/posts.ts` already handles booleans, arrays, and strings. It will need a small extension to parse numeric values (for `coverSeed`) — currently all non-boolean, non-array values are stored as strings. Zod's `z.coerce.number()` can handle this at the schema level.

```typescript
// Added to PostFrontmatterSchema in src/shared/schemas/site.schema.ts

// --- Cover generation fields (spec 011) ---
autocover: z.boolean().optional().default(true),
coverKeywords: z.array(z.string()).optional(),
coverHint: z.string().optional(),
coverManual: z.boolean().optional().default(false),
coverSeed: z.number().optional(),
coverDa: z.string().optional(),
```

The generator script uses a separate manifest schema:

```typescript
// src/shared/schemas/cover-manifest.schema.ts

import { z } from "zod";

export const GeneratedCoverSchema = z.object({
  slug: z.string(),
  category: z.string(),                // "blog" | "project" | "talk" | "short"
  imagePath: z.string(),                // "public/assets/covers/<slug>/cover.png"
  ogImagePath: z.string(),              // "public/assets/covers/<slug>/og.png"
  width: z.number(),
  height: z.number(),
  prompt: z.string(),                  // Full prompt — stored for reproducibility
  model: z.string(),                   // "gemini-3-pro-image-preview"
  generatedAt: z.string(),             // ISO 8601
  seed: z.number().optional(),
});
export type GeneratedCover = z.infer<typeof GeneratedCoverSchema>;

export const CoverManifestSchema = z.object({
  generatedAt: z.string(),
  covers: z.array(GeneratedCoverSchema),
});
export type CoverManifest = z.infer<typeof CoverManifestSchema>;
```

## API Acceptance Criteria

- [ ] API-1: A CLI script (`bun run covers`) reads all posts from the content directory (resolved via `CONTENT_DIR` env var, defaulting to `src/content/posts/`), identifies those needing cover generation (`autocover !== false` AND no existing `coverManual: true` file), and generates missing covers via the Nano Banana Pro API. Posts across all categories (blog, project, talk, short) are processed.
- [ ] API-2: Every API call reads the DA from `da.md` (or the post's `coverDa` frontmatter override) and uses it as a system-level prefix, appending the post-specific context (title, summary, keywords, optional hint) as the user prompt.
- [ ] API-3: The user prompt per post uses one of two strategies based on whether `coverHint` is present:

  **Strategy 1 — explicit hint (preferred, ~150 tokens):** Used when `coverHint` is set in frontmatter. The author's intent is clear, no extra context needed.
  ```
  Generate a cover image for a {category} post.
  Title: "{title}"
  Keywords to visualize: {coverKeywords || tags}
  Diagram hint: {coverHint}
  ```

  **Strategy 2 — summary fallback (~200 tokens):** Used when `coverHint` is omitted. The `summary` field provides enough semantic context for the model to produce a relevant image without sending the full markdown body.
  ```
  Generate a cover image for a {category} post.
  Title: "{title}"
  Summary: "{summary}"
  Keywords to visualize: {coverKeywords || tags}
  ```

  This keeps token consumption low (~150-200 tokens per post vs ~500-2000 for full body) while the DA prompt (~300 tokens) does the heavy lifting on style.
- [ ] API-4: The API call targets `gemini-3-pro-image-preview` via the `@google/genai` SDK (`generateContent` with image output enabled).
- [ ] API-5: Generated images are saved as PNG to `public/assets/covers/<slug>/cover.png`. A second 1200×630 crop/resize is saved as `og.png` for social cards.
- [ ] API-6: A `covers.manifest.json` file is written to `public/assets/` tracking every generated cover (slug, category, path, prompt, timestamp, seed). This enables auditing, cache-busting, and selective regeneration.
- [ ] API-7: Two CLI entry points:
  - `bun run covers` — batch mode, generates missing covers for all posts. `--force` regenerates all non-manual covers. `--dry-run` previews without writing.
  - `bun run cover <slug>` — single-post mode, generates (or regenerates) the cover for one specific post. Always runs, even if a cover already exists. Example: `bun run cover bun-for-backend`.
- [ ] API-8: Running `bun run covers --dry-run` logs what would be generated without making API calls or writing files. `bun run cover <slug>` with a non-existent slug exits with a clear error.
- [ ] API-9: The script respects a `GEMINI_API_KEY` environment variable. If missing, it exits with a clear error message and a link to Google AI Studio.
- [ ] API-10: Rate limiting: the script processes posts sequentially with a configurable delay (default 2s) between API calls to stay within Gemini API free-tier limits.
- [ ] API-11: If generation fails for a post (API error, safety filter, timeout), the script logs the error, skips that post, and continues. The build does not break.
- [ ] API-12: The script reuses the existing frontmatter parser from `src/ui/lib/posts.ts` and validates against the extended `PostFrontmatterSchema` (with cover fields from this spec).

## UI Acceptance Criteria

- [ ] UI-1: **Featured card** — the generated cover renders at full width in the left half of the featured card (landscape orientation). The dark `#0B1120` background blends seamlessly with the site's dark theme.
- [ ] UI-2: **Grid card** — covers scale to the smaller card size (~400×225) without visual breakage. Node labels remain legible; if not, they're acceptable as abstract shapes at this size since the diagram's structure still communicates.
- [ ] UI-3: **Dark mode native** — covers are designed dark-first and require no inversion. In light mode (if supported), covers render inside a card with a dark background container — they never get inverted or adjusted.
- [ ] UI-4: **Fallback** — if no cover exists and generation was not run, the card displays the gradient fallback from spec 001 (linear gradient `#0B1120` → `#1A2744` with post title in monospace).
- [ ] UI-5: **OG image** — `<meta property="og:image">` points to the `og.png` raster for maximum social platform compatibility.
- [ ] UI-6: **Visual consistency** — when viewing the content grid with 6+ generated covers, a first-time visitor should perceive them as belonging to the same visual system (same palette, same density, same spatial logic).

## Integration Acceptance Criteria

- [ ] E2E-1: Running `bun run covers && bun run build` produces a site where every non-draft post card displays a cover — either manually provided or Nano Banana Pro–generated.
- [ ] E2E-2: Adding a new blog post with `coverKeywords: ["bun", "typescript", "runtime"]` and `coverHint: "show Bun runtime replacing Node.js in a backend architecture"` and running `bun run covers` produces a coherent cover matching the DA.
- [ ] E2E-3: Setting `coverManual: true` on a post with a hand-placed cover causes the generator to skip it, even with `--force`.
- [ ] E2E-4: The `og.png` passes through the Facebook Sharing Debugger and Twitter Card Validator without errors.
- [ ] E2E-5: Running `bun run covers` on a repo with 20 posts completes in < 90 seconds (sequential with 2s delay = ~40s generation + overhead).
- [ ] E2E-6: Deleting `covers.manifest.json` and re-running `bun run covers` regenerates all covers from scratch with identical results for the same seed values.
- [ ] E2E-7: The `--dry-run` output correctly identifies which posts need generation and which are skipped (manual, already exists, draft).
- [ ] E2E-8: Covers are generated for all categories (blog, project, talk, short) — the generator does not filter by category.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Empty | Post has no cover, generator hasn't run | Gradient fallback (`#0B1120` → `#1A2744`) with title in monospace. |
| Loading | N/A (build-time generation, not runtime) | N/A — covers are static assets. |
| Populated | Cover PNG exists at expected path | Dark, minimal, diagrammatic cover matching the DA. |
| Populated (manual) | `coverManual: true` + hand-placed file | The hand-made cover, untouched by the generator. |
| Error (gen failure) | Nano Banana Pro API returned an error or safety block | Warning logged; fallback gradient used. Build continues. |
| Error (no API key) | `GEMINI_API_KEY` not set | CLI exits immediately with setup instructions. No partial writes. |

## Non-goals

- No runtime/client-side cover generation — everything happens at build time via CLI.
- No interactive editor or GUI for tweaking covers in v1 — re-roll by changing `coverSeed` or `coverHint` and re-running.
- No SVG output — Nano Banana Pro outputs raster PNGs. If SVGs are needed later, a post-processing vectorization step can be added.
- No per-post palette overrides in v1 — all covers share the DA palette for consistency (though `coverDa` allows a completely different DA file per post if needed).
- No animated covers or video thumbnails.
- No automatic keyword extraction via NLP — if `coverKeywords` is omitted, `tags` are used directly.

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| `coverKeywords` is empty and `tags` is empty | Generator | Uses title words as fallback keywords (split on spaces, filter stop words). |
| `coverKeywords` has > 7 items | Generator | Uses first 7; logs a warning. The DA limits node count to 3–7. |
| Nano Banana Pro generates an image that violates the DA (e.g. too colorful) | Human review | The `covers.manifest.json` stores the prompt. Author reviews, adjusts `coverHint`, and re-runs with `--slug`. |
| API returns a safety filter block | Generator | Logs the blocked slug and reason. Suggests rewording `coverHint`. Fallback used. |
| Two sequential runs with the same inputs | Generator | Nano Banana Pro is not deterministic by default. To get consistent results, the `coverSeed` field is passed as part of the prompt context (not a true API seed — noted as limitation). |
| `GEMINI_API_KEY` has expired or hit quota | Generator | API returns 429/401. Script logs the error with a link to the billing page and exits gracefully. |
| Post has `category: "talk"` or `category: "short"` | Generator | Cover still generated normally — category is passed in the prompt but doesn't affect visual style. |
| Very long title (> 120 chars) | Prompt | Title truncated at 120 chars in the prompt to avoid diluting the instruction. |
| Network failure mid-batch | Generator | Already-generated covers are preserved (written to disk immediately). Only the failed + remaining posts are skipped. Re-running picks up where it left off (checks manifest). |
| `da.md` is missing | Generator | Script exits with error: `"Missing da.md"`. No API calls made, no partial writes. |
| `da.md` is empty | Generator | Script exits with error: `"da.md is empty"`. Same behavior as missing. |
| Post has `coverDa: custom-da.md` but file doesn't exist | Generator | Logs warning for that post, falls back to root `da.md`. |
| `da.md` is very large (> 10KB) | Generator | Logs a warning (large DA may dilute the prompt), but proceeds. |

## Directory Structure (additions to existing project)

```
├── da.md                              # Design Aesthetic — the visual contract (read by generator)
├── scripts/
│   ├── generate-favicon.ts            # (existing) Favicon generation
│   ├── generate-covers.ts             # Batch: all missing covers
│   └── generate-cover.ts              # Single: one post by slug
├── src/
│   ├── shared/schemas/
│   │   ├── site.schema.ts             # (existing) Extended with cover frontmatter fields
│   │   └── cover-manifest.schema.ts   # Manifest Zod schema
│   └── ui/lib/
│       ├── posts.ts                   # (existing) Frontmatter parser — reused by generator
│       ├── cover-da.ts                # Reads & validates da.md, resolves per-post overrides
│       ├── cover-generator.ts         # Gemini API integration
│       └── cover-manifest.ts          # Read/write covers.manifest.json
├── public/
│   └── assets/
│       ├── covers.manifest.json
│       └── covers/
│           └── <slug>/
│               ├── cover.png          # Primary cover (1200x675)
│               └── og.png             # Social card (1200x630)
```

## External Dependencies

- **`@google/genai`** — (new) Official Google Generative AI SDK for Node.js. Used to call `gemini-3-pro-image-preview` via `generateContent` with image output.
- **`sharp`** — (new) Image resizing/cropping for the 1200×630 OG image variant.
- **`zod`** — (existing) Extended `PostFrontmatterSchema` with cover generation fields.
- **Custom frontmatter parser** — (existing, `src/ui/lib/posts.ts`) Already handles YAML frontmatter with booleans, arrays, and strings. No `gray-matter` dependency needed.
- **Google AI Studio account** — Free tier provides limited daily image generation. Paid tier recommended for batches > 10 posts.

## Cost Estimate

| Tier | Rate | 20 posts | 50 posts |
|------|------|----------|----------|
| Google AI Studio free | ~50 images/day | Free (1 batch) | Free (1 batch/day over 1 day) |
| Google AI Studio paid | ~$0.04–$0.12/image | ~$0.80–$2.40 | ~$2.00–$6.00 |
| Third-party gateway (Kie.ai, etc.) | ~$0.05–$0.10/image | ~$1.00–$2.00 | ~$2.50–$5.00 |

_Costs are approximate and based on preview pricing as of March 2026. Only applies to `--force` regeneration; incremental runs (1–2 new posts) are negligible._

## Open Questions

- [ ] Should we store generated prompts in a Git-tracked file (for reproducibility) or `.gitignore` the manifest?
- [ ] Is a `coverSeed` mechanism worth implementing given that Nano Banana Pro doesn't expose a native seed parameter — would a prompt-variation strategy (e.g. appending `"variation: 3"`) be sufficient for re-rolling?
- [x] ~~Should the DA be versioned?~~ — Resolved: `da.md` is Git-tracked, so version history comes from `git log da.md`. A palette refresh means editing `da.md` + running `--force`.
- [ ] Preference for the `@google/genai` SDK directly, or use Vertex AI for potentially higher rate limits?
- [ ] Should the generator also produce a tiny blurred placeholder (16×9 px) for blur-up loading transitions?

## Package.json Changes

```jsonc
// New script entries:
"covers": "bun run scripts/generate-covers.ts",
"cover": "bun run scripts/generate-cover.ts"

// Build script updated to include covers (optional — can run separately):
// "build": "bun run scripts/generate-favicon.ts && bun run scripts/generate-covers.ts && vite build"
```

Usage:
```bash
bun run covers              # generate all missing covers
bun run covers --force      # regenerate all non-manual covers
bun run covers --dry-run    # preview what would be generated
bun run cover bun-for-backend   # generate cover for a single post
```

## Testing

Tests use **Vitest** (matching the existing test setup in `test/lib/`).

- `test/lib/cover-da.test.ts` — DA file loading, validation, per-post override resolution
- `test/lib/cover-manifest.test.ts` — Manifest read/write, schema validation
- `test/lib/cover-generator.test.ts` — Prompt construction, CLI flag parsing, dry-run behavior (Gemini API calls mocked)

Test content in `test/content/posts/` provides realistic posts across all categories for integration testing.

## Post-Implementation Notes

_Filled when status → complete. Not required for prototypes._

- ...
