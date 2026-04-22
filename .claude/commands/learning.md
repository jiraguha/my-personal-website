Document a learning from the current session into `doc/`.

Topic: $ARGUMENTS

If no topic is provided, ask me what we learned.

Each learning is **one problem per file**, numbered sequentially: `doc/NNN-<name>.md`.

Steps:

1. List existing files in `doc/` to find the next sequence number (count NNN-*.md, add 1, zero-pad to 3).
2. Review the current conversation for the problem, root cause, and solution.
3. Write `doc/<NNN>-<kebab-case-topic>.md` with this structure:

```
# <Title>

## Context
What we were trying to do and why.

## Error
The actual error message or symptom (in a code block).

## Cause
Root cause explanation.

## Fix
What we changed and why (include before/after code if relevant).

## Consequences
Ongoing impact -- what to watch for, what changed in workflow, what breaks if reverted.
```

4. If there are **multiple distinct problems** in the conversation, create one file per problem with sequential numbers.
5. Update CLAUDE.md if the learning affects setup, daily workflow, or conventions (add a brief note + link to the doc file).
6. Commit the changes with message: `docs: add learning - <topic>`

Keep it practical -- focus on what someone needs to know to avoid hitting the same problem. No fluff.
