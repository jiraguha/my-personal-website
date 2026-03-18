# SDD Full-Stack v2

Spec-driven development with two modes: **full** (tested, verified) and **prototype** (fast, unverified).

## Setup

```bash
bun install
npx playwright install chromium
```

## Infrastructure

```bash
bun run infra:up      # Start Postgres + Redis (Docker Compose)
bun run infra:down    # Stop
bun run infra:reset   # Nuke volumes + restart fresh
```

Services are port-forwarded to localhost: Postgres on 5432, Redis on 6379.

## Dev loop

```bash
bun run dev           # API (3000) + Vite (5173)
```

## Two modes

### Full mode — tested, verified, production-ready

```
/spec-create user registration       # or /spec-refine raw/notes.md
/spec-test 002-user-registration
/spec-implement 002-user-registration
/spec-verify 002-user-registration
```

### Prototype mode — fast, skip tests

```
/spec-proto quick monitoring dashboard    # Freeform: creates minimal spec + builds
/spec-proto 003-monitoring                # From existing spec: skips test gates
```

When the prototype proves the idea works:
```
/spec-promote 003-monitoring              # Adds tests, fills spec gaps, verifies
```

Or just delete it if it was throwaway.

## Testing

```bash
bun run test:api      # Bun test (hits real Docker services)
bun run test:ui       # Playwright (mocked API)
bun run test:e2e      # Playwright (real everything)
bun run test:all      # All of the above
```

## Commands

| Command | Phase | Mode | What it does |
|---------|-------|------|-------------|
| `/spec-create` | 1 | both | Claude interviews you, generates spec |
| `/spec-refine` | 1 | both | Structures raw notes into spec |
| `/spec-test` | 2 | full | Generates failing tests |
| `/spec-implement` | 3 | full | API → UI → E2E, atomic commits |
| `/spec-verify` | 4 | full | Typecheck + all tests → complete |
| `/spec-proto` | 1-3 | proto | Skip tests, build fast |
| `/spec-promote` | 2-4 | proto→full | Add tests, verify, mark complete |
| `/spec-status` | — | both | Dashboard of all specs |

## Project structure

```
CLAUDE.md
specs/
  NNN-feature.md              # Numbered, sequential
  raw/                        # Brain dumps
infra/
  docker-compose.yml          # Postgres, Redis
  init/                       # DB init scripts
src/
  shared/schemas/             # Zod (THE contract)
  api/handlers/
  api/services/
  api/index.ts
  ui/components/
  ui/pages/
  ui/lib/
  ui/main.tsx
test/
  api/                        # Bun test
  ui/                         # Playwright (mocked)
  e2e/                        # Playwright (real)
```
