# 013 — SEO Audit (Lighthouse CI + Sitemap + Robots)

> Status: `complete`
> Mode: `full`
> Date: 2026-03-21

## Intent

Jean-Paul can run `bun test:seo` to build the site, generate a sitemap and robots.txt, and run Lighthouse CI against every page. The command produces an HTML report with SEO, Performance, and Accessibility scores. If any category falls below the configured threshold, the test fails. This catches SEO regressions (missing meta tags, broken headings, missing alt text) before they reach production.

---

## Build-Time Artifacts

### sitemap.xml

Generated at build time by a script (`scripts/generate-sitemap.ts`). Lists all non-draft, non-future-dated pages:

- `/` (home)
- `/posts/<slug>` for every published post (all categories)
- `/tags/<tag>` for every tag in use

Format: standard XML sitemap with `<loc>`, `<lastmod>`, and `<changefreq>`.

The site's base URL is read from `SITE_URL` env var (default: `http://localhost:4173`).

### robots.txt

Static file at `public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
```

Generated alongside the sitemap so the `Sitemap:` line always points to the correct URL.

---

## API Acceptance Criteria

- [x] API-1: `scripts/generate-sitemap.ts` reads all posts via the existing post loader (`src/ui/lib/posts.ts`), generates `dist/client/sitemap.xml` with `<loc>`, `<lastmod>`, and `<changefreq>` for every non-draft page.
- [x] API-2: The sitemap includes the home page (`/`), all published post URLs (`/posts/<slug>`), and all tag pages (`/tags/<tag>`).
- [x] API-3: `<lastmod>` uses the post's `updated` field if present, otherwise `date`.
- [x] API-4: `<changefreq>` is `weekly` for posts and tags, and `daily` for the home page.
- [x] API-5: `scripts/generate-sitemap.ts` also generates `dist/client/robots.txt` with `User-agent: *`, `Allow: /`, and a `Sitemap:` directive pointing to the sitemap URL.
- [x] API-6: `SITE_URL` env var controls the base URL in both sitemap and robots.txt (default: `http://localhost:4173`).
- [x] API-7: The sitemap generation runs as part of `bun run build` (added to the build script in package.json, after `vite build`).
- [x] API-8: `lighthouserc.json` is committed and configures Lighthouse CI with:
  - `startServerCommand`: `scripts/serve-production.ts` (Bun SSR server on port 4174)
  - Categories: SEO, Performance, Accessibility
  - Thresholds: SEO >= 0.9, Performance >= 0.5 (local SSR penalty), Accessibility >= 0.9
  - Reports saved to `.lighthouseci/reports/` (filesystem target)
- [x] API-9: `bun test:seo` runs `scripts/run-seo-audit.ts` which: builds the site, extracts URLs from the post loader, passes them to `lhci autorun`.
- [x] API-10: Lighthouse produces HTML reports in `.lighthouseci/reports/` and auto-opens the latest report in the browser.
- [x] API-11: The test fails (non-zero exit) if any category score falls below the configured threshold on any page.
- [x] API-12: `scripts/serve-production.ts` is a minimal Bun SSR server that uses Vike's `renderPage` for SSR and serves static assets from `dist/client/`. Port configurable via `SEO_PORT` env var (default: 4174).

## UI Acceptance Criteria

_N/A — this is a build-time CLI tool with no UI._

## Integration Acceptance Criteria

- [x] E2E-1: Running `CONTENT_DIR=test/content bun test:seo` builds the site, starts production SSR server on port 4174, audits all pages, and produces an HTML report.
- [x] E2E-2: The generated `sitemap.xml` is valid XML and contains URLs for all non-draft test posts.
- [x] E2E-3: The generated `robots.txt` references the sitemap URL.
- [x] E2E-4: Lighthouse SEO score is >= 90 on all audited pages.
- [x] E2E-5: Lighthouse Accessibility score is >= 90 on all audited pages.
- [x] E2E-6: Lighthouse Performance score is >= 50 on all audited pages (local SSR without CDN/compression).

## Component States

_N/A — CLI tool._

## Non-goals

- No Google Search Console integration — purely local.
- No runtime SEO middleware — this is a post-build audit.
- No Playwright-based SEO assertions — Lighthouse handles everything.
- No custom rule engine — Lighthouse's built-in audits are sufficient.
- No CI integration in v1 — runs locally, can be added to CI later.

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| No published posts | Sitemap | Sitemap contains only the home page URL. |
| Post with `externalUrl` | Sitemap | Still included — the internal `/posts/<slug>` page exists. |
| Post with `draft: true` | Sitemap | Excluded from sitemap. |
| Future-dated post | Sitemap | Excluded from sitemap (same filter as post loader). |
| `SITE_URL` not set | Sitemap | Defaults to `http://localhost:4173`. |
| Port 4174 already in use | Lighthouse | `lhci autorun` fails with connection error. User must free the port. |
| Very large site (100+ pages) | Lighthouse | Lighthouse audits sequentially — may be slow. Acceptable for local use. |

## Directory Structure (additions to existing project)

```
├── scripts/
│   ├── generate-sitemap.ts        # Generates sitemap.xml + robots.txt in dist/client/
│   ├── run-seo-audit.ts           # Orchestrates build + URL extraction + LHCI + report open
│   └── serve-production.ts        # Minimal Bun SSR server (Vike renderPage)
├── lighthouserc.json               # Lighthouse CI config (committed)
├── dist/client/
│   ├── sitemap.xml                 # Generated at build time
│   └── robots.txt                  # Generated at build time
└── .lighthouseci/                  # Lighthouse reports (gitignored)
    └── reports/                    # HTML reports saved here
```

## External Dependencies

- **`@lhci/cli`** — (new, dev) Lighthouse CI CLI. Runs audits and assertions.
- **Existing post loader** — `src/ui/lib/posts.ts` reused for sitemap URL generation.

## Package.json Changes

```jsonc
// New script:
"test:seo": "bun run scripts/run-seo-audit.ts"

// Updated build script:
"build": "bun run scripts/generate-favicon.ts && vite build && bun run scripts/generate-sitemap.ts"
```

## Open Questions

- [x] Should the sitemap include `/tags/<tag>` pages, or are they low-value for SEO? **Yes — included. Tags provide useful navigation and are generated with `weekly` changefreq.**
- [x] Should Lighthouse also run the "Best Practices" category? **No — kept to SEO, Performance, and Accessibility only.**
