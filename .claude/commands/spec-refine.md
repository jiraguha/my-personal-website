Look at specs/ and determine the next number.

Read the raw file at: $ARGUMENTS

Reorganize into a valid full-stack spec:
1. Extract intent, API criteria, UI criteria, E2E criteria, component states, edge cases
2. Separate API vs UI vs both
3. Derive Zod schema if possible
4. List what's MISSING — ask me to fill gaps

Generate:
1. `specs/<NNN>-<feature>.md`
2. `src/shared/schemas/<feature>.schema.ts` (if derivable)

Preserve original phrasing. Don't delete raw file.
Set status to `draft`, mode to `full`.
