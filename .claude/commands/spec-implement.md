Read specs/$ARGUMENTS.md.
Read all failing tests for this feature.
Read the shared Zod schema.

Implement in order — API FIRST, then UI:

### Step 1: API
1. Handler in src/api/handlers/
2. Service in src/api/services/ if needed
3. Wire into src/api/index.ts
4. Thin handlers: Zod validate → service → response
5. Run `bun test:api` after each change
6. Commit: `feat(NNN-feature): implement API`

### Step 2: UI
1. Component(s) in src/ui/components/
2. Page in src/ui/pages/ if needed
3. API client in src/ui/lib/
4. Import types from @shared/schemas
5. Use `data-testid` matching tests
6. Run `bun run test:ui` after each change
7. Commit: `feat(NNN-feature): implement UI`

### Step 3: E2E
1. Should pass if wired correctly
2. Fix integration issues, don't touch tests
3. Commit: `feat(NNN-feature): E2E verified`

Rules: never modify spec/test files, minimum change per test, note surprises.
