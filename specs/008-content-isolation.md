# 008 — Content Isolation

> Status: `approved`
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

- [ ] UI-1: `import.meta.glob` in `posts.ts` reads from a configurable content path via `CONTENT_DIR` env var, not a hardcoded `/src/content/`
- [ ] UI-2: Default content path (no env var set) is `src/content/`
- [ ] UI-3: Slug derivation in `loadPosts()` works correctly regardless of which content directory is used
- [ ] UI-4: Demo/test files (`mermaid-demo.md`, `external-talk-demo.md`, `til-kubectl-debug.md`) are moved out of `src/content/` into `test/content/` with correct category subdirectories
- [ ] UI-5: `test/content/` contains enough fixture posts to exercise all post types: blog, project, talk, short, featured, draft, external-url, future-dated
- [ ] UI-6: `test/content/profile.json` provides a test profile so tests don't depend on real profile data

## Infrastructure Acceptance Criteria

- [ ] INFRA-1: E2E tests run Vite on port **5174** (not 5173) to avoid collision with dev
- [ ] INFRA-2: Playwright config sets `CONTENT_DIR=test/content` and `baseURL=http://localhost:5174` for test runs
- [ ] INFRA-3: Vitest config sets `CONTENT_DIR=test/content` via env

## Integration Acceptance Criteria

- [ ] E2E-1: `bun run dev:ui` serves only real posts (no demo/test posts appear)
- [ ] E2E-2: `bun run test:lib` uses `test/content/` fixtures — tests pass without depending on real content
- [ ] E2E-3: `bun run test:e2e` uses `test/content/` fixtures on port 5174 — E2E tests pass without depending on real content

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

- [ ] Which existing posts are "real" vs "demo"? Candidates for demo: `mermaid-demo.md`, `external-talk-demo.md`, `til-kubectl-debug.md`

## Post-Implementation Notes

_Filled when status → complete._
