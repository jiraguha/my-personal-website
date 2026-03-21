# 009 — Vike SSR Migration

> Status: `complete`
> Mode: `full`
> Date: 2026-03-20

## Intent

Migrate the site from a client-side SPA (react-router-dom + import.meta.glob) to server-side rendered pages using Vike. Trending tags, post loading, and all data computation now happen on the server, so the client bundle stays small as content grows. Pages are fully rendered in the initial HTML response for SEO and fast first paint.

## Shared Schema

No schema changes. Existing schemas used as-is:

- `src/shared/schemas/site.schema.ts` — `PostFrontmatter`, `PostCard`, `SiteProfile`
- `src/shared/schemas/tags.schema.ts` — `TrendingTag`

## Architecture

### Before

- Single `src/ui/main.tsx` entry with `BrowserRouter`
- All markdown loaded client-side via `import.meta.glob("@content/posts/**/*.md", { query: "?raw" })`
- Trending tags computed in the browser on every page load
- No server-rendered HTML — empty `<div id="root">` until JS hydrates

### After

- File-based routing via `pages/` directory (Vike convention)
- Markdown loaded server-side via `node:fs` in `+data.ts` hooks
- Trending tags computed once per request on the server
- Full HTML in initial response — content visible before JS loads
- Client hydration adds interactivity (search, theme toggle, Reveal.js)

### Page structure

```
pages/
  +config.ts                    # SSR enabled, partial prerender
  +Layout.tsx                   # Minimal root layout (CSS import only)
  +Head.tsx                     # Global <head>: fonts, viewport, dark-mode inline script
  +onHydrationEnd.ts            # Sets data-hydrated attr for E2E test sync
  index/
    +Page.tsx                   # Home page (presentation)
    +data.ts                    # Server: getAllPosts, trending, featured
    +Layout.tsx                 # SiteLayout (Nav + Footer)
    +Head.tsx                   # Page title + description
  posts/@slug/
    +Page.tsx                   # Post detail + talk landing
    +data.ts                    # Server: getPostBySlug → render(404) on miss
    +Layout.tsx                 # SiteLayout (Nav + Footer)
    +Head.tsx                   # Dynamic title from post
    +onBeforePrerenderStart.ts  # URL list for static generation
  tags/@tag/
    +Page.tsx                   # Tag filter page
    +data.ts                    # Server: getPostsByTag + isTrending
    +Layout.tsx                 # SiteLayout (Nav + Footer)
    +Head.tsx                   # Dynamic title from tag
    +onBeforePrerenderStart.ts
  talks/@slug/
    +Page.tsx                   # Reveal.js presentation (client-only init)
    +data.ts                    # Server: getPostBySlug → redirect("/404") for invalid
    +Layout.tsx                 # No Nav/Footer (full-viewport)
    +onBeforePrerenderStart.ts
  404/
    +Page.tsx                   # Dedicated 404 route (redirect target)
    +Layout.tsx                 # SiteLayout (Nav + Footer)
  _error/
    +Page.tsx                   # Catch-all 404 and 500 error pages
    +Layout.tsx                 # SiteLayout (Nav + Footer)
```

## Acceptance Criteria

- [x] AC-1: `bun run build` succeeds (client + SSR bundles)
- [x] AC-2: Dev server (`bun run dev`) returns full HTML on `GET /`
- [x] AC-3: HTML response contains rendered nav, hero, posts, footer — not empty `<div id="root">`
- [x] AC-4: `<title>` and `<meta description>` are present in server HTML
- [x] AC-5: Page data (posts, trending tags, profile) is serialized in `<script id="vike_pageContext">`
- [x] AC-6: No `react-router-dom` imports remain in `src/`
- [x] AC-7: ThemeToggle is SSR-safe (reads DOM on mount, writes only on click)
- [x] AC-8: Mermaid and Reveal.js remain client-only (dynamic import / useEffect)
- [x] AC-9: `posts.ts` uses `node:fs` instead of `import.meta.glob` (works in SSR)
- [x] AC-10: Dynamic routes have `+onBeforePrerenderStart.ts` hooks for static generation
- [x] AC-11: All 83 E2E tests pass (`bun run test:e2e`)
- [x] AC-12: Talks page renders without Nav/Footer (full-viewport Reveal.js)
- [x] AC-13: External talk `/talks/:slug` redirects to `/404`
- [x] AC-14: Dark mode persists across page reloads (inline script in `+Head.tsx`)
- [x] AC-15: E2E tests wait for SSR hydration before interacting (`onHydrationEnd` + `gotoAndHydrate` helper)

## Key Changes

### Packages

- Added: `vike`, `vike-react`
- Removed: `react-router-dom`

### Files deleted

- `src/ui/main.tsx` — replaced by Vike's page system
- `src/ui/pages/Home.tsx` — moved to `pages/index/+Page.tsx`
- `src/ui/pages/PostDetail.tsx` — moved to `pages/posts/@slug/+Page.tsx`
- `src/ui/pages/TagPage.tsx` — moved to `pages/tags/@tag/+Page.tsx`
- `src/ui/pages/TalkPresentation.tsx` — moved to `pages/talks/@slug/+Page.tsx`
- `src/ui/pages/NotFound.tsx` — moved to `pages/_error/+Page.tsx`

### Files created

- `src/ui/components/SiteLayout.tsx` — shared Nav + Footer layout component used by per-route `+Layout.tsx` files
- `pages/+onHydrationEnd.ts` — sets `data-hydrated` attribute on `<html>` after React hydration (used by E2E tests)
- `pages/404/+Page.tsx` — dedicated `/404` route (redirect target for invalid talks)
- `pages/*/+Layout.tsx` — per-route layouts wrapping `SiteLayout` (index, posts, tags, 404, _error)
- `test/e2e/helpers.ts` — `gotoAndHydrate()` helper that navigates and waits for `data-hydrated` attribute

### Files modified

- `vite.config.ts` — added `vike()` plugin, removed API proxy
- `src/ui/lib/posts.ts` — replaced `import.meta.glob` with `node:fs` for SSR compatibility
- `src/ui/lib/site.ts` — changed `@content` alias to relative import
- `src/ui/components/ThemeToggle.tsx` — SSR-safe: reads DOM state on mount via `useEffect`, writes DOM/localStorage only in click handler (no `useEffect` sync race)
- `src/ui/components/Nav.tsx` — `<Link>` → `<a>`
- `src/ui/components/TagChip.tsx` — `<Link>` → `<a>`
- `src/ui/components/PostCard.tsx` — `<Link>` → `<a>`
- `src/ui/components/FeaturedCard.tsx` — `<Link>` → `<a>`
- `src/ui/components/TrendingTags.tsx` — `<Link>` → `<a>`
- `src/ui/pages/talk-presentation.css` — added `position: fixed; inset: 0` to `.talk-deck-wrapper` and `width/height: 100%` to `.reveal` so Reveal.js controls stay visible inside Vike's layout wrappers
- `index.html` — removed `<script>` entry (Vike manages HTML shell)
- `package.json` — updated scripts (`dev`, `build`, `preview`), removed `react-router-dom`
- `playwright.config.ts` — updated webServer to single `bun run dev` command (removed `dev:api` reference)
- `test/e2e/*.e2e.ts` — all 7 test files updated to use `gotoAndHydrate()` instead of `page.goto()`, dark mode tests wait for hydration after `page.reload()`

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| SSR | First request | Full HTML with content, no JS needed for initial paint |
| Hydrated | JS loaded | Interactive features: search, theme toggle, client routing |
| Error (404) | Invalid slug/tag | Error page with "Back to home" link |
| Error (500) | Server crash | Generic error page |

## Non-goals

- Vercel adapter (`@vercel/vite`) — not added yet, needed for production SSR on Vercel
- ISR / on-demand revalidation — all pages are either SSR or prerendered at build time
- Removing Mermaid/Reveal.js from client bundle — these must run client-side

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| No posts exist | Server | Home shows "Coming soon", prerender hooks return empty arrays |
| Invalid post slug | Server | `+data.ts` throws `render(404)`, error page shown at same URL |
| Talk with `externalSlides` | Server | `/talks/:slug` throws `redirect("/404")` — browser navigates to `/404` route |
| `localStorage` unavailable (SSR) | Server | ThemeToggle defaults to light; inline `<script>` in `+Head.tsx` sets `dark` class before first paint |
| `document` unavailable (SSR) | Server | Mermaid/Reveal.js skip init (guarded by `useEffect`) |
| Reveal.js controls clipped | UI | `.talk-deck-wrapper` uses `position: fixed` to escape Vike layout wrappers; back button rendered outside wrapper as a sibling to avoid `overflow: hidden` clipping |
| ThemeToggle hydration race | Client | `useEffect([dark])` with initial dark=false would wipe the `dark` class set by inline script; fixed by moving DOM writes to click handler only |
| E2E tests click before hydration | Test | SSR delivers HTML but React event handlers aren't attached until hydration; `onHydrationEnd` sets `data-hydrated` attr, tests wait for it |
| Vike layouts are cumulative | Server | Child `+Layout.tsx` wraps inside parent, not replaces; root layout must be minimal, Nav/Footer added per-route |

## External Dependencies

None. Content is read from the filesystem at `src/content/posts/`.

## Post-Implementation Notes

- `import.meta.glob` does not resolve `.md` files in Vite's SSR build (produces empty `Object.assign({})`). The fix was switching to `node:fs` for server-side content loading.
- Vike uses standard `<a>` tags for navigation — no special `<Link>` component needed. Client-side routing is automatic.
- The `onBeforePrerenderStart` hooks work but return empty arrays when no content exists (empty `src/content/posts/` subdirs). The `partial: true` prerender config suppresses the warnings.
- Reveal.js is dynamically imported in `useEffect` to avoid SSR issues with its DOM manipulation.
- Vike wraps pages in `<div id="root">` and layout containers. The talk presentation uses `position: fixed; inset: 0` on `.talk-deck-wrapper` to break out of these wrappers and fill the viewport. The back button is rendered as a sibling fragment (`<>...</>`) outside the wrapper so `overflow: hidden` doesn't clip it.
- Vike layouts are **cumulative** (`cumulative: true` in vike-react config). A child `+Layout.tsx` wraps inside the parent — it does not replace it. To have a page without Nav/Footer (talks), the root `+Layout.tsx` must be minimal (CSS import only), with `SiteLayout` (Nav/Footer) applied per-route via individual `+Layout.tsx` files.
- Vike does not use the `<head>` content from `index.html`. All `<head>` tags (viewport, fonts, inline scripts) must go in `+Head.tsx`. The inline dark-mode script was initially placed in `index.html` and silently ignored.
- `ThemeToggle` had a hydration race condition: `useState(false)` + `useEffect([dark])` would fire with `dark=false` on hydration and wipe the `dark` class that the inline script had already set. Fix: never write DOM/localStorage in a `useEffect` — do it only in the click handler.
- E2E tests must wait for React hydration before interacting with SSR-rendered elements. The `+onHydrationEnd.ts` hook sets `data-hydrated="true"` on `<html>`, and the `gotoAndHydrate()` test helper waits for this attribute after every `page.goto()`. `page.reload()` calls in tests also need an explicit wait.
- External talks use `redirect("/404")` instead of `render(404)` because the E2E test asserts the URL changes to `/404`. A dedicated `/pages/404/+Page.tsx` route was added as the redirect target.
