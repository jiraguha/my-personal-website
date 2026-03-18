Read specs/$ARGUMENTS.md. Verify status is `approved` and mode is `full`.

If mode is `prototype`, stop and say: "This is a prototype spec. Use /spec-proto to implement, or change mode to full to add tests."

Read the shared Zod schema.

Check that Docker services are needed:
- If spec lists Postgres/Redis in external dependencies, remind me to run `docker compose -f infra/docker-compose.yml up -d` before running tests.

Generate tests:

**API criteria exist** → `test/api/<feature>.test.ts`
  - Bun test, hits real localhost services (Postgres on 5432, Redis on 6379)
  - Use env vars from .env for connection strings
  - One test per API-N

**UI criteria exist** → `test/ui/<feature>.spec.ts`
  - Playwright, mock API with `page.route()`
  - Test each component state
  - Use `data-testid` selectors
  - One test per UI-N

**E2E criteria exist** → `test/e2e/<feature>.e2e.ts`
  - Playwright, NO mocking
  - One test per E2E-N

Run tests to confirm they FAIL. Report status.

Do NOT write implementation code.
