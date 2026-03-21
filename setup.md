# Deployment Setup

## SSR Configuration

The SSR mode is controlled by a single flag in `pages/+config.ts`:

```ts
ssr: true   // Server-Side Rendering
ssr: false  // Client-Side SPA
```

### `ssr: true` — Server-Side Rendering

Pages are rendered to HTML on the server before being sent to the browser.

- `+data.ts` hooks run **server-side** (Node.js / serverless function)
- Browser receives **full HTML** with content already rendered
- React **hydrates** the existing HTML to add interactivity
- Requires a server or serverless runtime (e.g. Vercel with `@vercel/vite` adapter)

**When to use:** SEO matters, large content catalog where you want to keep the client bundle small, or you need fast first-paint without waiting for JS.

**Vercel deployment:** Requires the `@vercel/vite` package. Each page request invokes a serverless function that renders the HTML. Counts toward function invocation limits.

### `ssr: false` — Client-Side SPA

The server sends a minimal HTML shell. All rendering happens in the browser.

- `+data.ts` hooks run **client-side** (in the browser)
- Browser receives an **empty shell**, then JS renders the page
- No server runtime needed — purely static files
- Simpler deployment, lower cost

**When to use:** SEO is not critical, content is small enough to bundle client-side, or you want the simplest possible deployment.

**Vercel deployment:** Zero config. Static files served from CDN edge. No serverless functions, no cold starts, no invocation costs.

### What stays the same in both modes

- All `+Page.tsx`, `+data.ts`, `+Layout.tsx`, `+Head.tsx` files work identically
- Routing, prerendering, and code splitting behave the same
- Client-only features (search, theme toggle, Reveal.js, Mermaid) are unaffected
- Switching between modes requires **no code changes** — only the config flag

### Per-route override

You can mix modes per-route by adding a `+config.ts` in that route's directory:

```ts
// pages/some-route/+config.ts
export default {
  ssr: false, // override for this route only
};
```

Note: talks have two views that benefit differently from SSR:
- `/posts/:slug` — the **landing page** renders markdown (summary, tags, event, article body) as server HTML. Fully SEO-friendly. SSR helps here.
- `/talks/:slug` — the **slide presentation** uses Reveal.js which is client-only (it reinitializes the DOM after hydration). SSR does redundant work here, but since slides are a secondary view behind the landing page, it doesn't matter much.

## Prerender Configuration

```ts
prerender: {
  partial: true,  // Allow some pages to skip prerendering
}
```

When `prerender` is enabled, Vike generates static HTML at build time for pages with known URLs. Dynamic routes (`@slug`, `@tag`) use `+onBeforePrerenderStart.ts` hooks to provide the list of URLs to prerender.

With `partial: true`, Vike won't warn about dynamic routes that have no URLs to prerender (e.g. when the content directories are empty).

## Dark Mode

Theme persistence across page loads is handled by an inline `<script>` in `pages/+Head.tsx`. This script runs before React loads and sets the `dark` class on `<html>` from `localStorage`, preventing a flash of wrong theme (FOUC).

The `ThemeToggle` component reads the DOM state on mount and only writes to DOM/localStorage on user click — never in a `useEffect` — to avoid hydration race conditions in SSR mode.
