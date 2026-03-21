# 013 — SEO Audit (Lighthouse CI + Sitemap + Robots)

> Status: `implementing`
> Mode: `prototype`
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

- [ ] API-1: `scripts/generate-sitemap.ts` reads all posts via the existing post loader (`src/ui/lib/posts.ts`), generates `dist/sitemap.xml` with `<loc>`, `<lastmod>`, and `<changefreq>` for every non-draft page.
- [ ] API-2: The sitemap includes the home page (`/`), all published post URLs (`/posts/<slug>`), and all tag pages (`/tags/<tag>`).
- [ ] API-3: `<lastmod>` uses the post's `updated` field if present, otherwise `date`.
- [ ] API-4: `<changefreq>` is `weekly` for posts and `daily` for the home page.
- [ ] API-5: `scripts/generate-sitemap.ts` also generates `dist/robots.txt` with `User-agent: *`, `Allow: /`, and a `Sitemap:` directive pointing to the sitemap URL.
- [ ] API-6: `SITE_URL` env var controls the base URL in both sitemap and robots.txt (default: `http://localhost:4173`).
- [ ] API-7: The sitemap generation runs as part of `bun run build` (added to the build script in package.json).
- [ ] API-8: `lighthouserc.json` is committed and configures Lighthouse CI with:
  - `startServerCommand`: preview server on port 4174
  - URL discovery via sitemap (`http://localhost:4174/sitemap.xml`)
  - Categories: SEO, Performance, Accessibility
  - Thresholds: SEO >= 0.9, Performance >= 0.8, Accessibility >= 0.9
- [ ] API-9: `bun test:seo` builds the site with `CONTENT_DIR` (default `src/content`), then runs `lhci autorun`.
- [ ] API-10: Lighthouse produces an HTML report in `.lighthouseci/` directory.
- [ ] API-11: The test fails (non-zero exit) if any category score falls below the configured threshold on any page.

## UI Acceptance Criteria

_N/A — this is a build-time CLI tool with no UI._

## Integration Acceptance Criteria

- [ ] E2E-1: Running `CONTENT_DIR=test/content bun test:seo` builds the site, starts preview on port 4174, audits all pages from the sitemap, and produces a report.
- [ ] E2E-2: The generated `sitemap.xml` is valid XML and contains URLs for all non-draft test posts.
- [ ] E2E-3: The generated `robots.txt` references the sitemap URL.
- [ ] E2E-4: Lighthouse SEO score is >= 90 on all audited pages.
- [ ] E2E-5: Lighthouse Accessibility score is >= 90 on all audited pages.
- [ ] E2E-6: Lighthouse Performance score is >= 80 on all audited pages.
- [ ] E2E-7: Adding a post with missing `<meta description>` or missing `<title>` causes the SEO score to drop below threshold and the test to fail.

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
│   └── generate-sitemap.ts        # Generates sitemap.xml + robots.txt
├── lighthouserc.json               # Lighthouse CI config (committed)
├── dist/
│   ├── sitemap.xml                 # Generated at build time
│   └── robots.txt                  # Generated at build time
└── .lighthouseci/                  # Lighthouse reports (gitignored)
```

## External Dependencies

- **`@lhci/cli`** — (new, dev) Lighthouse CI CLI. Runs audits and assertions.
- **Existing post loader** — `src/ui/lib/posts.ts` reused for sitemap URL generation.

## Package.json Changes

```jsonc
// New script:
"test:seo": "bun run build && lhci autorun"

// Updated build script:
"build": "bun run scripts/generate-favicon.ts && vite build && bun run scripts/generate-sitemap.ts"
```

## Open Questions

- [ ] Should the sitemap include `/tags/<tag>` pages, or are they low-value for SEO?
- [ ] Should Lighthouse also run the "Best Practices" category?
