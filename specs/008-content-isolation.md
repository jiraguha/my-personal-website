# 008 — Content Isolation

> Status: `complete`
> Mode: `full`
> Date: 2026-03-19

## Intent

Test/demo content (seed posts, placeholder talks, mermaid demos) is isolated from production content. The content directory is split into `src/content/` (real content, used by dev and production builds) and `test/content/` (fixtures for automated testing only). The defaults are:

- `bun dev` → `src/content/`
- `bun build` → `src/content/`
- `bun test` → `test/content/`

## Shared Schema

No schema changes. Existing `PostFrontmatterSchema` in `src/shared/schemas/site.schema.ts` remains the contract for both real and test content.

## API Acceptance Criteria

_No API changes — content loading is a frontend/build-time concern._

## UI Acceptance Criteria

- [x] UI-1: `import.meta.glob` in `posts.ts` reads from a configurable content path via `@content` Vite alias (resolved from `CONTENT_DIR` env var)
- [x] UI-2: Default content path (no env var set) is `src/content/`
- [x] UI-3: Slug derivation in `loadPosts()` works correctly regardless of which content directory is used
- [x] UI-4: Test content fixtures created in `test/content/` with correct category subdirectories (demo files remain in src/content for dev use)
- [x] UI-5: `test/content/` contains fixture posts for all post types: blog, project, talk, short, featured, draft, external-url
- [x] UI-6: `test/content/profile.json` provides a test profile so tests don't depend on real profile data

## Infrastructure Acceptance Criteria

- [x] INFRA-1: E2E tests run Vite on port **5174** (not 5173) to avoid collision with dev
- [x] INFRA-2: Playwright config sets `CONTENT_DIR=test/content`, `NODE_ENV=development`, and `baseURL=http://localhost:5174`
- [ ] ~~INFRA-3: Vitest config sets `CONTENT_DIR=test/content` via env~~ — Not needed: unit tests use inline fixtures, not the glob

## Integration Acceptance Criteria

- [x] E2E-1: `bun run dev:ui` serves only real posts (default `src/content/`)
- [x] E2E-2: `bun run test:lib` — 120 unit tests pass (inline fixtures + content-isolation.test.ts validates test/content/)
- [x] E2E-3: `bun run test:e2e` — 83 E2E tests pass using `test/content/` fixtures on port 5174

## Component States

No new UI components. Existing components render identically — only the data source changes.

## Non-goals

- No runtime API endpoint for switching content directories
- No changes to markdown format or frontmatter schema
- No dynamic content directory switching at runtime (this is build-time/test-time only)
- No content CMS or admin interface

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| `test/content/` is missing | Test | Tests fail with clear error, not silent empty list |
| Real content dir is empty | Build | Site builds with zero posts, no crash |
| Slug collision between test and real content | N/A | Impossible — they never coexist in the same build |

## External Dependencies

None. Purely filesystem-based.

## Open Questions

_All resolved._

## Post-Implementation Notes

- `@content` Vite alias resolves to `CONTENT_DIR` env var (default: `src/content`)
- `posts.ts` uses `import.meta.glob("@content/posts/**/*.md")` — alias works with glob
- Slug derivation uses generic regex `filePath.replace(/^.*\/posts\/[^/]+\//, "")` (path-agnostic)
- `site.ts` profile import uses `@content/profile.json`
- Playwright starts test server on port 5174 with `CONTENT_DIR=test/content NODE_ENV=development`
- `NODE_ENV=development` is required because Playwright's test runner otherwise causes `import.meta.env.DEV` to be `false`
- Demo posts remain in `src/content/` for now (they serve as dev content); test fixtures in `test/content/` are independent copies
- `tsconfig.json` has `@content/*` path mapping for TypeScript resolution
