# 010 — Dynamic Favicon from Profile Letter

> Status: `prototype`
> Mode: `prototype`
> Date: 2026-03-21

## Intent

The browser tab, bookmarks, and PWA installs display a generated favicon — a white letter on a round black background — derived from the `faviconLetter` field in `src/content/profile.json`. The favicon is generated at build time (SVG + PNG fallback) with a cache strategy that skips regeneration when the letter hasn't changed.

## Shared Schema

_N/A — no API involved. This is a build-time asset generation feature. The source of truth is `src/content/profile.json` (`faviconLetter` field)._

## API Acceptance Criteria

_N/A — no API endpoint needed._

## Build Acceptance Criteria

- [ ] BUILD-1: A build script (`scripts/generate-favicon.ts`) reads `faviconLetter` from `src/content/profile.json`
- [ ] BUILD-2: Generates `public/favicon.svg` — white letter centered on a round black background, using system sans-serif font (`-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif` — same stack as Mozilla/Medium)
- [ ] BUILD-3: Converts SVG to PNG at three sizes: `public/favicon-32x32.png`, `public/favicon-192x192.png`, `public/favicon-512x512.png`
- [ ] BUILD-4: Cache strategy — stores a hash of the current `faviconLetter` in `public/.favicon-hash`. Skips regeneration if the hash matches. Logs explicitly: `"Favicon up-to-date for letter 'X', skipping"` or `"Generating favicon for letter 'X'..."`
- [ ] BUILD-5: Clean, minimal build logs — no noisy output, just the cache hit/miss message
- [ ] BUILD-6: Script runs automatically before `vite build` (integrated into the `build` script in `package.json`)
- [ ] BUILD-7: Script can also be run standalone: `bun run scripts/generate-favicon.ts`

## UI Acceptance Criteria

- [ ] UI-1: Global `pages/+Head.tsx` includes `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`
- [ ] UI-2: Global `pages/+Head.tsx` includes `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`
- [ ] UI-3: Global `pages/+Head.tsx` includes `<link rel="apple-touch-icon" sizes="192x192" href="/favicon-192x192.png">`
- [ ] UI-4: `public/site.webmanifest` exists with `icons` array referencing 192x192 and 512x512 PNGs
- [ ] UI-5: Global `pages/+Head.tsx` includes `<link rel="manifest" href="/site.webmanifest">`

## Integration Acceptance Criteria

- [ ] E2E-1: After build, `public/favicon.svg` exists and contains an SVG with the correct letter
- [ ] E2E-2: After build, all three PNG files exist and are valid images at the correct dimensions
- [ ] E2E-3: Running the script twice with the same `faviconLetter` produces a cache-hit log and does not regenerate files
- [ ] E2E-4: Changing `faviconLetter` and re-running produces a cache-miss log and regenerates all files

## Component States

_N/A — no interactive UI component. The favicon is a static asset._

## Non-goals

- OG image generation (separate spec)
- Twitter card / structured data meta tags
- Runtime favicon generation or dynamic switching
- Favicon editor UI
- ICO format support (SVG + PNG covers all modern browsers)

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| `faviconLetter` is empty string | Build | Script errors with clear message: "faviconLetter is empty in profile.json" |
| `faviconLetter` is multi-character | Build | Use only the first character, log a warning |
| `faviconLetter` contains emoji or special char | Build | Render as-is — SVG text handles unicode |
| `public/` dir doesn't exist | Build | Create it |
| `.favicon-hash` file missing (first run) | Build | Treat as cache miss, generate everything |
| PNG conversion fails | Build | Error with clear message, fail the build |

## External Dependencies

_None — no Docker services needed. Uses Bun APIs for file I/O and `@resvg/resvg-js` (pure Wasm) for SVG-to-PNG conversion._

## Open Questions

- [x] SVG-to-PNG library: `@resvg/resvg-js` (pure Wasm, zero native deps)

## Post-Implementation Notes

_Filled when status → complete._
