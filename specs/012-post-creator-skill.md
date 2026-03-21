# 012 — Post Creator Skill (Claude)

> Status: `prototype`
> Mode: `prototype`
> Date: 2026-03-21

## Intent

Jean-Paul can paste a raw draft, rough notes, bullet points, or just a topic idea into Claude and get back a polished, publish-ready Markdown post — with correct frontmatter, fixed spelling/grammar, clean structure, tasteful formatting, and the file saved to the right directory. The skill handles all four content categories (blog, project, short, talk) and produces output that's ready to commit and deploy with zero manual cleanup.

## Shared Schema

```typescript
// No new runtime types. The skill produces files conforming to the existing
// PostFrontmatter (spec 001), TalkFrontmatter (spec 006), and cover generation
// fields (spec 011) schemas. The skill itself is a Claude Code command, not
// application code. The skill instructions live in .claude/commands/post-creator.md.
```

## Skill Acceptance Criteria

_These replace the usual API/UI split since this is a Claude skill, not application code._

- [ ] SK-1: The skill is defined as a Claude Code command in `.claude/commands/post-creator.md`, invocable via `/post-creator`.
- [ ] SK-2: The skill triggers when the user provides raw content and asks to create, write, polish, or format a post for the site. Trigger phrases include: "write a post about...", "turn this into a blog post", "new short", "new talk", "polish this draft", "create a post from these notes", or pasting raw text with a request to format it.
- [ ] SK-3: The skill determines the correct content category (`blog`, `project`, `short`, `talk`) from context, or asks the user if ambiguous.
- [ ] SK-4: **Language polish** — the output has zero spelling errors, correct grammar, and consistent punctuation. The author's voice is preserved (technically precise, not corporate).
- [ ] SK-5: **Structure** — the output has clear headings, logical flow, focused paragraphs, and a scannable outline. The lede is not buried. The post has a clear ending.
- [ ] SK-6: **Formatting** — code blocks have correct language identifiers, key terms are bolded on first use, CLI commands and paths use `inline code`, blockquotes are used for callouts, and Mermaid diagrams are added where a flow or architecture is described.
- [ ] SK-7: **Frontmatter** — complete and valid YAML frontmatter is generated, including: `title`, `slug` (kebab-case), `date`, `summary`, `tags` (2–4, lowercase kebab-case), `category`, `draft`, `featured`, `coverKeywords`, and `coverHint`. Cover generation is implicit (spec 011): posts without a `cover` value and without `coverNone: true` are eligible for generation.
- [ ] SK-8: **Shorts** — short posts omit `coverKeywords` and `coverHint`, and set `coverNone: true` (no cover generation). Summary can be empty. No section headings unless the content warrants them.
- [ ] SK-9: **Talks** — output is Reveal.js Markdown with `---` slide separators, `Note:` speaker notes, stepped code highlighting, and additional frontmatter (`event`, `eventDate`, `reveal`). If the user provides talk content as a continuous document without `---` separators, the skill splits it into slides automatically (each `##` heading = new slide, each `###` = vertical slide, long code blocks and Mermaid diagrams get their own slides).
- [ ] SK-10: The finished file is saved to `content/posts/<category>/<slug>.md`.
- [ ] SK-11: After writing the file, the skill presents it for review and asks if adjustments are needed (tone, length, structure, formatting). Feedback is applied in-place.
- [ ] SK-12: **Proactive Mermaid diagrams** — when the content describes a flow, architecture, lifecycle, decision tree, or component relationships, the skill generates and inserts an appropriate ```` ```mermaid ```` block (flowchart, sequence diagram, state diagram, ER diagram, etc.) and flags it to the user for review.
- [ ] SK-13: **Proactive code blocks** — when the content references CLI commands or code patterns inline without formatting, the skill extracts them into properly fenced code blocks with correct language identifiers. When prose describes a code pattern, the skill offers to generate a concrete example.
- [ ] SK-14: **Proactive structure suggestions** — the skill suggests missing sections (intro hook, conclusion/takeaway, tech stack for projects) and flags what it added so the user can approve or remove.

## Integration Acceptance Criteria

- [ ] E2E-1: Pasting a raw 200-word draft with typos and asking "turn this into a blog post" produces a polished `.md` file in `content/posts/blog/` with valid frontmatter, zero spelling errors, and clear structure.
- [ ] E2E-2: Saying "new short: TIL kubectl debug lets you attach ephemeral containers" produces a concise `.md` file in `content/posts/short/` with appropriate frontmatter (`coverNone: true`, no `coverKeywords`).
- [ ] E2E-3: Providing bullet points about a conference talk and saying "make this a talk" produces a Reveal.js Markdown file with slides, speaker notes, and talk-specific frontmatter.
- [ ] E2E-4: Providing a project description and saying "create a project post" produces a writeup with tech stack section, architecture overview, and code snippet.
- [ ] E2E-5: The generated file passes Zod frontmatter validation at build time (no missing or invalid fields).
- [ ] E2E-6: The generated file renders correctly in `bun dev` — card appears in the grid, detail page is readable, code blocks are highlighted.
- [ ] E2E-7: A blog draft describing "requests flow through the API gateway, then the auth middleware, then the service layer" results in a Mermaid `graph LR` diagram being inserted in the output.
- [ ] E2E-8: A talk draft with no `---` separators is auto-split into slides, with the skill reporting the structure: "I split your talk into N slides — here's the outline."
- [ ] E2E-9: A draft mentioning `kubectl apply -f deploy.yaml` inline has that command extracted into a ` ```bash ` code block in the output.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Input received | User provides raw draft/notes | Skill determines category, polishes content, generates frontmatter. |
| Ambiguous category | Can't determine blog vs short vs talk | Skill asks: "This could be a blog post or a short — which do you prefer?" |
| File written | Post saved to content directory | Skill presents the file, highlights key changes, asks for feedback. |
| Feedback loop | User requests adjustments | Skill updates the file in-place and re-presents. |
| Minimal input | User provides just a topic ("write about bun test runners") | Skill asks 2–3 clarifying questions (angle, audience, key points), then drafts. |

## Non-goals

- The skill does not create cover images — it sets `coverKeywords` and `coverHint` so that the cover generation pipeline (spec 011) handles it on the next `bun run covers`. Cover eligibility is implicit: no `cover` value + no `coverNone: true` = generate.
- The skill does not publish or deploy — it writes a file. The user commits and pushes.
- The skill does not manage existing posts (no bulk editing, no migration). It creates new posts or rewrites a single draft.
- No translation or multi-language support.

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| Raw input is a single sentence | Skill | Defaults to `short` category. Asks user to confirm. |
| Raw input is 3000+ words | Skill | Defaults to `blog`. Suggests splitting if content covers distinct topics. |
| Raw input contains code but no explanatory text | Skill | Adds brief context paragraphs around the code. Asks user if the explanation captures the intent. |
| User says "fix this post" and provides an existing `.md` file | Skill | Reads the file, preserves existing frontmatter (updating only what changed), polishes the body, rewrites in place. |
| Frontmatter slug conflicts with an existing file | Skill | Checks the target directory. If a file with that slug exists, warns the user and suggests an alternative slug. |
| User wants a different tone (casual, academic, etc.) | Skill | Applies the requested tone while maintaining technical accuracy. Default is Jean-Paul's natural voice. |
| Input contains sensitive/proprietary content | Skill | Processes normally. The skill does not transmit content externally — it's a local Claude skill operating on files. |

## Skill File Location

```
.claude/commands/
└── post-creator.md             # The skill definition, invocable via /post-creator
```

## External Dependencies

_None. The skill is pure instructions — no scripts, no packages, no API calls._

## Open Questions

- [x] Should the skill also generate a `coverHint` that's optimized for Nano Banana Pro (e.g., describing the visual as a technical diagram), or keep it as a simple content description? yes
- [x] Should the skill support an "outline mode" where it produces just the structure (headings + bullet points) for user approval before writing the full post? yes
- [x] Worth adding a `references/style-guide.md` to the skill with Jean-Paul's writing preferences (word choice, banned phrases, preferred patterns)? yes

## Post-Implementation Notes

_Filled when status → complete. Not required for prototypes._

- ...
