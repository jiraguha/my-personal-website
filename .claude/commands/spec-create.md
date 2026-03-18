Look at specs/ and determine the next number (count NNN-*.md, add 1, zero-pad to 3).

Feature topic: $ARGUMENTS

Interview me ONE question at a time:

1. What can the user do after this is built?
2. What does the API need to do?
3. What does the UI show? (states: empty, loading, populated, error)
4. Full flow from click to result?
5. What should this NOT do?
6. External services needed? (Postgres, Redis — already in docker-compose)
7. What Zod schema bridges API and UI?

Push back on vague answers.

Generate:
1. `specs/<NNN>-<feature>.md`
2. `src/shared/schemas/<feature>.schema.ts`

Set status to `draft`, mode to `full`. Ask me to approve.
