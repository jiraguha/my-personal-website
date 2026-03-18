This command has two modes depending on the argument:

**Mode A: Existing spec** — if $ARGUMENTS matches an existing spec file (e.g., `003-user-profile`)
  - Read specs/$ARGUMENTS.md
  - Set mode to `prototype`, status to `implementing`
  - Ignore test gates — go straight to building

**Mode B: Freeform** — if $ARGUMENTS is a description (e.g., "quick dashboard for monitoring")
  - Determine next spec number
  - Create a MINIMAL spec at specs/NNN-<derived-name>.md with:
    - Intent (from the description)
    - Mode: `prototype`
    - Status: `implementing`
    - Everything else can be sparse or empty
  - Create a Zod schema if the description implies a data shape

Then implement freely:
- Build both API and UI as needed
- No test requirement — but still use shared schemas from src/shared/schemas/
- Still use typed code, still follow code conventions
- Commit as you go: `proto(NNN-feature): <what>`

When done:
- Update spec status to `prototype` (it stays here, not `complete`)
- Tell me: "This is prototype code. Run /spec-promote NNN-feature to add tests and verify, or delete the code when done exploring."

Rules:
- Still use Zod schemas at boundaries (even prototypes benefit from typed contracts)
- Still use .env for connection strings
- Don't skip types — `any` is never ok even in prototypes
- DO skip: tests, verification, exhaustive edge cases, component states
