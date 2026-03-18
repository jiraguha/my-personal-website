Read specs/$ARGUMENTS.md.

Verify mode is `prototype`. If it's already `full` and `complete`, say so and stop.

This command promotes a prototype to production-quality code. Steps:

### Step 1: Fill in the spec
Review the existing (sparse) spec against what was actually built.
Propose updates:
- Add concrete API acceptance criteria based on existing handlers
- Add UI acceptance criteria based on existing components
- Add E2E criteria for the main flow
- Add component states
- Add edge cases
- Fill in external dependencies

Show me the proposed spec updates. Wait for approval.

### Step 2: Generate tests
Same as /spec-test — generate test files for all criteria.
Run them. Some may pass (code already exists), some may fail (edge cases not handled).
Report which pass and which fail.

### Step 3: Fix failures
For any failing tests, implement the missing behavior.
Atomic commits: `fix(NNN-feature): handle <edge case>`

### Step 4: Verify
Same as /spec-verify — full pipeline.
Update mode to `full`, status to `complete`.

Tell me: "Prototype NNN-feature is now production-quality."
