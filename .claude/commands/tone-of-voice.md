User input: $ARGUMENTS

# Tone of Voice Extractor

Extract a named voice profile from one or more pieces of writing and save it under `./voice/` at the repo root. Profiles are consumed by the `post-creator` skill (spec 012) so every generated post is produced against a chosen voice instead of an implicit default.

## What This Skill Does

1. Reads a corpus — inline pasted text, a file, a glob, or a directory.
2. Extracts a structured voice profile — **patterns only, no verbatim text from the source**.
3. Saves it to `./voice/<name>.md` after a preview-and-approve step.
4. Updates `.claude/commands/post-creator.md` (idempotent, one-time) so post-creator scans `./voice/` and asks which profile to use on every run.

## The Plagiarism Firewall (SK-0, critical)

**The profile must never contain text copied from the source material.** This rule overrides every other instruction in this file. Specifically:

- **No verbatim quotes.** Do not include `> "sentence from source"` blocks under any rule. The profile is for pattern extraction, not citation.
- **No author or source attribution.** The corpus header describes corpus *type* only (category, word count, format). Never name the author, article title, publication, URL, or byline — even if the user pasted the text and the attribution is obvious.
- **No "lightly-edited" source sentences.** Paraphrasing a source sentence by swapping one word still leaks the author's rhythm and phrasing. Examples in the profile must be *synthetic* — invented by you about a generic, unrelated topic.
- **Loved Phrases must be common idioms**, not unique-to-source turns of phrase. If a phrase would only come up if the reader had read the source, it does not belong in the profile.
- **Do / Don't tables** — both columns are invented by you. The "Do" column demonstrates the pattern; it is not sampled from the source.

This matters because the profile feeds into generated posts via `post-creator`. Any source text that lives in the profile will eventually leak into a draft attributed to the user.

## Step 0: Parse the Invocation

Extract from the user's input:

- **Corpus source** — one or more of:
  - A file path (e.g. `src/content/posts/blog/my-post.md`, or a path outside `src/content/posts/`)
  - A directory or glob (e.g. `src/content/posts/blog/`)
  - Inline pasted text (prose copied into chat — including text from external sources the user wants to emulate)
- **Profile name** — `--name <name>`, or phrased intent like "save as technical", "update voice/casual", "improve voice/default with these examples".
- **Flags**:
  - `--include-drafts` — include posts with `draft: true` frontmatter when reading from `src/content/posts/**`.
  - Phrased equivalents are accepted ("include drafts", "even the drafts").

## Step 1: Validate Input (SK-4)

- If there is **no corpus source** (no path, no glob, no inline text), error with: `"Provide a file, directory, glob, or pasted text to extract a voice profile from."` Do not write any file.
- If the only input is a **single sentence** (fewer than ~10 words of prose), refuse: `"This is too little signal to extract a voice profile — paste at least a few paragraphs or point to a file."` Do not write any file.

## Step 2: Read the Corpus

- Inline text → use verbatim as analysis input (but never copy it into the profile).
- File path → read the file.
- Directory or glob → expand, read each matching file.
- For files under `src/content/posts/**`:
  - Strip YAML frontmatter before extraction (it's metadata, not prose).
  - Exclude posts with `draft: true` **unless** `--include-drafts` was given (SK-14).
  - Report how many drafts were skipped.
- Exclude fenced code blocks from prose voice extraction (they're not prose). If code-comment style is distinctive, note it separately in "Formatting habits" — again, as a pattern, not a quote.
- After reading, report: `Read N files, ~M words total. K drafts excluded.`

## Step 3: Determine the Profile Name (SK-5)

Apply these rules in order and confirm the target with the user before proceeding:

1. If the user passed `--name <name>` or phrased an explicit target (e.g. "save as technical") → use that.
2. Else, list `./voice/` contents:
   - **Empty or missing** → ask: `"Name this profile? (suggested: default)"`
   - **Exactly one profile** → default to updating it; confirm: `"Update ./voice/<name>.md? (y/n)"`
   - **Two or more profiles** → list them and ask: `"Which profile? (pick one or provide a new name)"`

Validate the name:

- Must be kebab-case (`^[a-z][a-z0-9-]*$`).
- Must not contain path separators or `..`.
- If invalid, reject with: `"'<name>' isn't a valid profile name. Use kebab-case, e.g. 'technical' or 'casual-short'."` and ask again.

## Step 4: Check for Conflict (SK-11)

If `./voice/<name>.md` already exists, ask the user to pick a mode:

- **Overwrite** — rebuild the profile from only the new corpus. The current file is discarded.
- **Adapt** — keep the existing profile and bend its rules toward the new corpus. Use this for "make my technical voice more like this external style" or "refine based on these new posts".
- **Cancel** — abort with no changes.

If the user cancels, stop here.

## Step 5: Warn on Thin Corpus (SK-13)

If fewer than 3 distinct examples, or under ~1500 words total prose (after stripping frontmatter and code), warn:

> The corpus is thin (N examples, ~M words). The extracted profile will be low-confidence. Add more examples for better signal. Proceed anyway? (y/n)

## Step 6: Extract the Profile (SK-6, SK-7, SK-8)

Produce a Markdown profile with the following sections, in this order. **Every rule is followed by an abstract pattern description. A synthetic example is optional — include one only when the pattern is hard to grasp from the description alone. Never paste or paraphrase source text.**

**Example-length rule (SK-7):**
- **Short** (one invented phrase or sentence) for local rules: punctuation, word choice, loved phrases, banned phrases.
- **Short template block** (showing the shape, not the content) for structural rules: opening moves, closing moves. Use placeholder markers like `[setup]`, `[claim]`, `[punchline]` rather than fleshed-out prose when the shape is the point.

**Per-category subsections (SK-8):** If the corpus spans multiple post categories (blog / short / talk / project), and the voice differs meaningfully between them, record those differences as subsections inside each extraction heading rather than splitting into multiple files.

**Adapt-mode preservation:** If the mode is *adapt* and the existing profile has sections marked with `<!-- manual -->` as the first content line under the heading, preserve those sections verbatim. Only touch generated sections.

### Profile Template

```markdown
# Voice Profile: <name>

> Extracted: YYYY-MM-DD
> Corpus type: <generic descriptor — e.g. "long-form tech essays, ~14000 words across ~12 posts". DO NOT name authors, article titles, publications, or URLs.>

## How to Read This Profile

The rules (bold lines) are the constraints. Each rule is followed by an abstract pattern description and may include a synthetic example — an invented sentence about a generic topic, written only to illustrate the pattern. No text in this profile has been copied from the source material. When writing a new post, apply the patterns to the current topic with fresh wording.

## Voice Descriptors

2–5 adjectives describing the overall voice, each with a one-line justification that describes the *behavior*, not a quoted example.

- **<adjective>** — why this fits, described abstractly.

## Sentence Patterns

Typical sentence length, common rhythms, use of fragments, run-on tolerance.

**<Rule about sentence structure.>**

Pattern: `[describe the shape using placeholders like [anchor], [clause], [landing]]`

*Synthetic example (optional):* an invented sentence about a generic topic that demonstrates the rule.

## Word Choices

Characteristic verbs, nouns, connective phrases the voice uses — described by *kind*, not by quoting specific sentences.

**<Rule about word choice.>**

Vocabulary: list of words or categories (e.g. "hedging verbs: probably, seems, likely") the voice reaches for.

## Loved Phrases

Common idiomatic constructions the voice returns to. Only include phrases that are widely-used English idioms, not unique-to-source turns of phrase.

- `<common idiom>` — when/why the voice uses it (described abstractly).

## Banned Phrases / Anti-patterns

Patterns notably absent from the corpus — inferred from absence, not prompted. Examples: corporate fluff, AI-ish hedges, buzzwords, filler.

- `<banned phrase>` — why it would feel off.

## Formatting Habits

Bold/italic usage, inline code conventions, blockquote style, heading depth, list vs prose preference.

**<Rule.>**

Pattern: describe the formatting behavior. For templates, show the shape with placeholders.

## Punctuation Tendencies

Em-dash, semicolon, parenthetical, ellipsis frequency and function.

**<Rule.>**

Pattern / synthetic example using invented content.

## Opening Moves

How posts typically start — hook style, concession, anecdote, direct claim.

**<Rule.>**

Pattern: a numbered or bulleted skeleton of what the opening does, step by step. Use placeholder prose, not copied prose.

## Closing Moves

How posts typically end — takeaway, question, call to reflection, fade.

**<Rule.>**

Pattern as above.

## Do / Don't Examples

Short before/after pairs showing in-voice vs out-of-voice rewrites. **Both columns are invented by you.** The "Do" column is a synthetic demonstration of the voice applied to an unrelated, generic topic — it is not drawn from or paraphrased off the source.

| Don't | Do |
|-------|----|
| <generic/out-of-voice sentence> | <in-voice sentence, invented, about a topic unrelated to the source> |
```

When the corpus spans categories, each section above can have subsections (`### Blog`, `### Short`, etc.) for category-specific rules. Same rule: patterns only, no quoted source text.

## Step 7: Preview Before Write (SK-10, SK-12)

- Print the full extracted profile in chat.
- **Self-check before presenting:** scan your own draft for (a) blockquote lines starting with `> "`, (b) proper nouns that could identify the source, (c) sentences that feel too specific to a particular topic from the corpus. Remove or rewrite before presenting.
- **Re-run diff (SK-12)** — if the file already exists and the mode is overwrite or adapt, also print a full unified diff of the current file vs the proposed new content.
- Ask: `"Approve, edit, or re-extract?"`
  - **Approve** → proceed to Step 8.
  - **Edit** → apply the user's in-chat corrections to the proposed content and re-present. Loop until approved.
  - **Re-extract** → go back to Step 6 with different emphasis if the user asks.

Only proceed to the write after explicit approval.

## Step 8: Write the File

- Create `./voice/` if it does not exist.
- Write `./voice/<name>.md` with the approved content.
- Confirm:

  > Wrote ./voice/<name>.md.
  > Profiles available: <list>.

## Step 9: Wire Into post-creator (SK-9, idempotent)

- Search `.claude/commands/` for a file that looks like the post-creator skill. The signature is: the file contains the heading `# Post Creator` and a step mentioning content categories (`blog`, `project`, `short`, `talk`).
- If not found → warn: `"Could not find post-creator.md in .claude/commands/. Skipping integration. Add the voice-selection block manually if you want post-creator to use this profile."` and stop (successfully — the profile is still written).
- If found → check whether the file already contains the marker line:

  ```
  <!-- tone-of-voice:integration -->
  ```

  - **Marker present** → no-op. The integration was already installed by a previous run. Do not duplicate.
  - **Marker missing** → insert the block below **immediately after the `## Step 1: Determine Category and Gather Context` section** (i.e. before `## Step 2`). Both the opening and closing markers must be written so future idempotency checks work.

### Voice-Selection Block to Insert

```markdown
<!-- tone-of-voice:integration -->

## Step 1.5: Select the Voice Profile

Before polishing the content, pick which voice profile to apply.

1. List the files in `./voice/` (at the repo root). Each file is a named profile produced by the `/tone-of-voice` skill (spec 015).
2. If `./voice/` is missing or empty, skip this step and note in chat: `"No voice profiles found. Proceeding with default voice. Run /tone-of-voice to create one."`
3. Otherwise, look at the draft's category and content and suggest the best-fitting profile. Examples of fit cues:
   - Project write-up with heavy technical detail → `voice/technical.md` if present.
   - Short TIL or hot take → `voice/casual.md` if present.
   - Otherwise → `voice/default.md`.
4. Ask the user to confirm: `"I'd use voice/<name>.md for this post. Ok, or pick another? (options: <list>)"`
5. Read the chosen profile file. Treat its rules as hard constraints during Step 2 (Polish the Content): match sentence patterns, word choices, opening/closing moves, punctuation tendencies, formatting habits. Avoid every phrase listed under "Banned Phrases". Favor phrasings in "Loved Phrases". **The profile contains patterns, not sample sentences — do not paste any text from the profile into the draft.**
6. If the user picks a profile that no longer exists, fall back to suggesting from the current `./voice/` contents and warn.

<!-- /tone-of-voice:integration -->
```

After writing (or deciding to no-op), confirm to the user:

> Updated .claude/commands/post-creator.md — post-creator now picks a voice profile on every run.

or

> .claude/commands/post-creator.md already wired for voice selection — no change.

## Quality Checklist

Before finishing, verify:

- [ ] The profile file lives at `./voice/<name>.md` (kebab-case, at the repo root).
- [ ] **Zero verbatim text from the source.** No `> "quoted sentence"` blocks. No paraphrased sentences where the topic matches the source.
- [ ] **Zero source attribution.** No author name, article title, publication, or URL in the corpus header or anywhere else.
- [ ] Every rule has a pattern description (and optionally a synthetic example about a generic topic).
- [ ] Loved Phrases are common English idioms, not unique-to-source phrasings.
- [ ] Do / Don't rows are both invented; the "Do" column does not share topics with the source.
- [ ] If the corpus spanned categories, subsections were added where voice differs.
- [ ] The file is valid Markdown (renders when opened).
- [ ] `post-creator.md` contains the voice-selection block exactly once, between the opening and closing `<!-- tone-of-voice:integration -->` markers.
- [ ] No banned-phrase list was prompted from the user — all banned phrases are inferred from absence.
- [ ] Adapt mode preserved any `<!-- manual -->` sections from the previous profile.
