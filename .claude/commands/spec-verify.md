Read specs/$ARGUMENTS.md.

Run full verification:
1. `bunx tsc --noEmit`
2. `bun test:api`
3. `bun run test:ui`
4. `bun run test:e2e`

Report pass/fail for each.

Review every AC (API-N, UI-N, E2E-N) — is each met?

Write "Post-Implementation Notes":
- Decisions made
- Surprises
- What next spec should address

Update status to `complete`.

Remind: immutable now. Changes go in a new spec.
