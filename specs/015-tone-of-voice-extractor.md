# 015 — Tone of Voice Extractor Skill (Claude)

> Status: `approved`
> Mode: `full`
> Date: 2026-04-17

## Raw Intent

> "I want to be able to create a tone of voice for all the content I might create. The deliverable is a skill that I give an example to, and it extracts the exact `tone-of-voice.md` file that will be used by `post-creator`."

## Intent

Jean-Paul can hand Claude one or more pieces of writing — his own posts, a file in the repo, or prose pasted from somewhere on the internet whose style he wants to emulate — and get back a named voice profile stored under `./voice/` at the repo root. The directory can hold several profiles side by side (e.g. `voice/default.md`, `voice/casual.md`, `voice/technical.md`, `voice/jean-paul.md`), each capturing word choices, sentence cadence, structural habits, preferred punctuation patterns, banned and loved phrases, emphasis style, and opening and closing moves. The skill also supports *adapting* an existing profile by feeding it new examples, so a profile can evolve rather than being rebuilt from scratch. When `post-creator` (spec 012) runs, it scans `./voice/`, suggests the best-fitting profile for the draft, and asks Jean-Paul to confirm or override — so every generated post is produced against a chosen voice instead of an implicit default.

## Shared Schema

```typescript
// No new runtime types. The deliverable is a Claude Code skill and a set of
// Markdown reference files. The skill itself lives at
// .claude/commands/tone-of-voice.md. Its outputs are files under ./voice/
// (repo root), each a named voice profile consumed by post-creator (spec 012).
```

## Skill Acceptance Criteria

_These replace the usual API/UI split since this is a Claude skill, not application code._

- [ ] SK-1: The skill is defined as a Claude Code command in `.claude/commands/tone-of-voice.md`, invocable via `/tone-of-voice`.
- [ ] SK-2: The skill triggers when the user provides example content and asks to create, extract, capture, distill, adapt, or improve a tone of voice. Trigger phrases include: "extract my tone", "learn how I write from this post", "build my voice profile", "adapt my tone toward this style", "improve voice/technical.md with these examples", "/tone-of-voice <path-or-text> [--name <profile>]".
- [ ] SK-3: **Input modes** — the skill accepts any combination of:
  - Inline pasted text (including prose copied from external sources the user wants to emulate)
  - A single file path (inside or outside `src/content/posts/`)
  - A glob or directory (e.g. `src/content/posts/blog/`) — all matching files are read and treated as a corpus
- [ ] SK-4: **No default corpus** — when invoked with no argument and no inline text, the skill errors with a clear message asking for a path, glob, or pasted text. It does not silently pick a default directory.
- [ ] SK-5: **Profile naming** — every profile is saved as `./voice/<name>.md`. The skill determines the name in this order:
  1. Explicit `--name <profile>` argument (or phrased intent: "save as technical", "update voice/casual").
  2. If only one profile exists in `./voice/`, re-runs default to updating that profile.
  3. If `./voice/` is empty, the skill asks the user for a name before writing, suggesting `default` as the fallback.
  Names are kebab-case; the skill rejects invalid names with a clear message.
- [ ] SK-6: **Extraction** — each profile file covers at minimum:
  - **Voice descriptors** (2–5 adjectives with justification drawn from the examples)
  - **Sentence patterns** — typical length, opening moves, common rhythms, use of fragments
  - **Word choices** — characteristic verbs, nouns, and connective phrases the author uses
  - **Loved phrases** — recurring expressions or constructions worth preserving
  - **Banned phrases / anti-patterns** — corporate fluff, filler, or tics notably absent from the corpus (inferred from absence only; the skill does not prompt the user for additions)
  - **Formatting habits** — bold/italic usage, inline code conventions, blockquote style, heading depth, list vs prose preference
  - **Punctuation tendencies** — em-dash, semicolon, parenthetical, ellipsis frequency and function
  - **Opening moves** — how posts typically start (hook style, concession, anecdote, direct claim)
  - **Closing moves** — how posts typically end (takeaway, question, call to reflection, fade)
  - **Do/Don't examples** — short before/after pairs derived from the corpus showing in-voice vs out-of-voice rewrites
- [ ] SK-7: **Evidence-based** — every rule in the output is paired with at least one verbatim quote from the corpus. Citation length is chosen by the skill per rule: short (one sentence or phrase) for local rules (punctuation, word choice, loved/banned phrases); paragraph-level only for structural rules (opening moves, closing moves, rhythm). No generic writing-advice platitudes.
- [ ] SK-8: **Category subsections within a profile** — when a single corpus spans multiple post categories (blog, short, talk, project), per-category differences are recorded as subsections within each extraction heading in that one profile file, not split across multiple files.
- [ ] SK-9: **Integration with post-creator** — the skill updates `.claude/commands/post-creator.md` so that post-creator, on every invocation:
  1. Lists the profiles in `./voice/`.
  2. Suggests the best-fitting profile based on the draft's category and content (e.g. "I'd use `voice/technical.md` for this project write-up").
  3. Asks the user to confirm or pick a different profile.
  4. Loads only the chosen profile as the voice reference for the draft.
  The update to `post-creator.md` is idempotent (running the skill twice does not duplicate the instruction block).
- [ ] SK-10: **Preview before write** — before writing the profile file, the skill presents the extracted profile in chat and asks the user to approve, edit, or re-extract. Only after approval is the file saved.
- [ ] SK-11: **Re-run behavior** — if the target `./voice/<name>.md` already exists, the skill always asks the user to pick a mode:
  - **Overwrite** — rebuild the profile from just the new corpus, discarding the current file.
  - **Adapt** — keep the existing profile but bend its rules toward the new examples (for "make my technical voice more like this external style" or "refine based on these new posts").
  - **Cancel** — abort with no changes.
- [ ] SK-12: **Diff on re-run** — after extraction but before writing (in overwrite or adapt mode), the skill shows a full unified diff of the current vs proposed `./voice/<name>.md` and asks for approval.
- [ ] SK-13: **Small-corpus warning** — if fewer than 3 examples (or under ~1500 words total) are provided, the skill proceeds but warns the user that the profile will be thin and suggests adding more examples.
- [ ] SK-14: **Draft handling** — when the corpus comes from `src/content/posts/**`, the skill excludes posts with `draft: true` frontmatter by default and reports how many were skipped. An explicit `--include-drafts` flag (or phrased intent) overrides. When the corpus is external pasted text, draft handling does not apply.

## Integration Acceptance Criteria

- [ ] E2E-1: Running `/tone-of-voice src/content/posts/blog/ --name default` (with 5+ published blog posts) produces `./voice/default.md` with all extraction sections populated and at least one quote per rule.
- [ ] E2E-2: Running `/tone-of-voice <external prose> --name casual` after E2E-1 produces a second profile at `./voice/casual.md` without touching `./voice/default.md`.
- [ ] E2E-3: Running `/post-creator` with both profiles present scans `./voice/`, suggests one based on the draft, and asks the user to confirm or pick the other. The final draft reflects the chosen profile, not the other.
- [ ] E2E-4: Running `/tone-of-voice <new corpus>` against an existing profile name prompts for overwrite / adapt / cancel, shows a unified diff after extraction, and behaves correctly for each choice.
- [ ] E2E-5: Running `/tone-of-voice <external pasted prose>` with no `--name` and an empty `./voice/` prompts the user for a profile name before writing.
- [ ] E2E-6: Running the skill with no argument and no inline text errors clearly and does not write any file.
- [ ] E2E-7: Running the skill against a single short post (under 300 words) still produces an output, but surfaces a visible thin-signal warning.
- [ ] E2E-8: Each generated profile is valid Markdown and renders cleanly when opened.
- [ ] E2E-9: After a fresh extraction, `.claude/commands/post-creator.md` contains exactly one voice-selection instruction block (not zero, not duplicated) referencing `./voice/`.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| No input | Skill invoked with no path and no pasted text | Skill errors: "Provide a file, directory, glob, or pasted text." |
| No name, empty voice/ | Corpus provided but no name and no existing profiles | Skill asks: "Name this profile? (suggested: default)" |
| No name, one profile exists | Corpus provided, no name, exactly one file in voice/ | Skill defaults to updating that profile; confirms the target name before proceeding. |
| No name, multiple profiles | Corpus provided, no name, 2+ files in voice/ | Skill lists profiles and asks which one to create or update. |
| Input received | Corpus read | Skill reports corpus size ("3 posts, ~4200 words; 1 draft excluded") and target profile name. |
| Thin corpus | <3 examples or <1500 words total | Skill warns but proceeds after confirmation. |
| Preview | Extraction complete, file not yet written | Skill prints the full profile in chat and asks for approval. |
| Conflict | `./voice/<name>.md` already exists | Skill asks: overwrite / adapt / cancel. On overwrite or adapt, full unified diff is shown before the write. |
| Written | File saved, post-creator updated if not already | Skill confirms the path and shows the list of available profiles. |
| Refinement loop | User requests edits to the extracted profile | Skill applies changes in-place and re-presents. |

## Non-goals

- The skill does not train a model or create embeddings — each profile is a static Markdown reference file read as plain text by `post-creator`.
- The skill does not rewrite existing posts to match any profile (that's `post-creator`'s job in polish mode).
- No automated scoring of whether a new post "matches" its profile — voice fidelity is judged by the user reading the output.
- No auto-wiring into skills other than `post-creator`. Future integrations are manual.
- No automatic profile selection at post-creator time without user confirmation — the LLM suggests, the user approves.

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| Corpus mixes repo posts and pasted external prose | Skill | Both are read; the preview notes which rules came from which source. |
| Corpus contains `draft: true` posts | Skill | Excluded by default; skill reports how many were skipped. `--include-drafts` or equivalent phrasing overrides. |
| Corpus spans very different categories | Skill | Output stays a single profile file; per-category differences recorded as subsections under each extraction heading. |
| User provides a file that doesn't exist | Skill | Clear error, no partial write. |
| User pastes only a single sentence | Skill | Skill refuses and asks for more input rather than producing a profile from near-zero signal. |
| Invalid profile name | Skill | Reject names that aren't kebab-case or contain path separators; suggest a valid alternative. |
| Existing profile has manual edits | Skill | Adapt mode preserves any section marked with an HTML comment `<!-- manual -->` and only touches generated sections. |
| `post-creator.md` has been renamed or moved | Skill | Skill searches `.claude/commands/` for a file containing the post-creator signature, warns if not found, and skips integration rather than corrupting an unrelated file. |
| Corpus contains code blocks | Skill | Code blocks are excluded from prose voice extraction but the skill notes code-comment style separately if present. |
| `./voice/` does not exist yet | Skill | Skill creates it on first write. |
| User picks a profile in post-creator that was just renamed/deleted | post-creator | Falls back to suggesting from current `./voice/` contents; warns if the requested profile is missing. |

## Skill File Location

```
./voice/                        # Output directory (repo root) — holds one or more profiles
├── default.md
├── casual.md
└── technical.md

.claude/
└── commands/
    ├── tone-of-voice.md        # The skill definition, invocable via /tone-of-voice
    └── post-creator.md         # Updated by SK-9 to scan ./voice/ and prompt for selection
```

## External Dependencies

_None. The skill is pure instructions — no scripts, no packages, no API calls. Reads files under the repo or from inline text; writes under `./voice/` and updates `.claude/commands/post-creator.md`._

## Open Questions

_All resolved during /spec-refine Q&A on 2026-04-17._

## Post-Implementation Notes

_Filled when status → complete. Not required for prototypes._

- ...
