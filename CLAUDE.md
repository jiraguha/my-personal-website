# Project: [name]

## Identity

Full-stack spec-driven development project with two operating modes.

## Stack

### Backend
- **Runtime**: Bun
- **Language**: TypeScript (strict, ESM)
- **Validation**: Zod — shared schemas between API and UI

### Frontend
- **Framework**: React (Vite)
- **Testing**: Playwright (E2E + component)

### Infrastructure
- **External services**: Docker Compose (`infra/docker-compose.yml`)
- **Postgres, Redis, etc.**: run via `docker compose up -d`, port-forwarded to localhost
- **No Testcontainers** — tests hit real services running in Docker

### Testing
- **API tests**: Bun test, hitting localhost services (Postgres on 5432, Redis on 6379, etc.)
- **UI tests**: Playwright with mocked or real API
- **E2E tests**: Playwright against real API + real services

## Two Modes

### Full mode (default)
The complete SDD flow. Every feature gets a spec, tests, implementation, verification.

```
/spec-create → /spec-test → /spec-implement → /spec-verify
```

Use when: building features that matter, anything going to production.

### Prototype mode
Skip tests and verification. Write a spec (or don't), go straight to implementation.
Mark the spec as `prototype` status — it's a signal that this code is unverified.

```
/spec-create → /spec-proto
```

Or just: `/spec-proto` with a description (no spec file needed).

Use when: exploring an idea, building a throwaway, validating a concept.
The deal: prototype code gets either promoted (write tests, verify, mark complete) or deleted. It never stays as-is in production.

To promote a prototype to a real spec later:
```
/spec-promote NNN-feature
```

## Workflow: Full Mode

### Specs are numbered and sequential

`specs/NNN-<feature>.md` — work in order, never revisit completed specs.

### The four phases

1. **Spec** — `/spec-create` (interview) or `/spec-refine` (raw notes)
2. **Test** — `/spec-test NNN-feature` (failing tests)
3. **Implement** — `/spec-implement NNN-feature` (API first, then UI)
4. **Verify** — `/spec-verify NNN-feature` (typecheck + all tests → complete)

### Gate rules (full mode only)

- No code without a spec
- No implementation without failing tests
- API before UI
- Shared schemas are the bridge
- Completed specs are immutable

## Workflow: Prototype Mode

1. Optionally create a spec with `/spec-create` (status will be `prototype`)
2. `/spec-proto NNN-feature` or `/spec-proto description of what to build`
3. Code freely — no test requirement, no gates
4. When done: either `/spec-promote NNN-feature` (add tests, verify) or delete the code

## Git Workflow

After every change — no matter how small — commit immediately using a short conventional commit message. Do not batch up changes across multiple tasks before committing. One logical change = one commit.

Use `/commit` to trigger a commit at any time.

## Code Conventions

- `import` not `require` (ESM)
- `const` over `let`, never `var`
- Explicit types everywhere
- Zod `.parse()` at system boundaries
- Typed errors, never throw raw strings
- File naming: `kebab-case.ts`

## Infrastructure

External services run via Docker Compose:

```bash
docker compose -f infra/docker-compose.yml up -d   # Start services
docker compose -f infra/docker-compose.yml down     # Stop services
```

Services are port-forwarded to localhost:
- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- (Add more as needed in docker-compose.yml)

Tests and dev server connect to these same ports. No magic, no abstractions.

Connection strings go in `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sddapp
REDIS_URL=redis://localhost:6379
```

## Project Structure

```
CLAUDE.md
specs/
  TEMPLATE.md
  NNN-feature.md
  raw/
infra/
  docker-compose.yml            # Postgres, Redis, etc.
  init/                         # DB init scripts
src/
  shared/schemas/               # Zod (THE contract)
  api/
    handlers/
    services/
    index.ts
  ui/
    components/
    pages/
    lib/
    main.tsx
test/
  api/                          # Bun test (hits real Docker services)
  ui/                           # Playwright (mocked API)
  e2e/                          # Playwright (real everything)
.env
vite.config.ts
playwright.config.ts
package.json
tsconfig.json
```

## Anti-patterns

- Don't duplicate types between API and UI
- Don't write UI before API contract is tested (in full mode)
- Don't leave prototype code in production — promote or delete
- Don't use `any`
- Don't edit completed specs
- Don't hardcode connection strings — use .env
