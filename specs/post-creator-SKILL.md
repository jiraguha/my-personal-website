---
name: post-creator
description: "Create polished, publish-ready blog posts, project writeups, shorts, or talk slide decks from raw drafts, notes, or bullet points. Use this skill whenever the user provides rough content and wants it turned into a formatted Markdown post for their portfolio site. Triggers include: 'write a post about...', 'turn this into a blog post', 'create a short from...', 'polish this draft', 'new post', 'new short', 'new talk', any mention of creating content for the site, or when the user pastes raw notes/ideas and wants them formatted as site content. Also use when the user asks to fix, rewrite, or improve an existing post."
---

# Post Creator

Transform raw drafts, rough notes, bullet points, or stream-of-consciousness ideas into polished, publish-ready Markdown posts for Jean-Paul's portfolio site.

## What This Skill Does

1. Takes raw input (draft text, bullet points, a topic idea, or a messy doc)
2. Determines the right content category (`blog`, `project`, `short`, `talk`)
3. Fixes spelling, grammar, and punctuation
4. Restructures for readability — clear headings, logical flow, scannable sections
5. Adds tasteful formatting — code blocks with syntax highlighting, callouts, emphasis on key insights
6. Generates complete frontmatter
7. Outputs a ready-to-commit `.md` file in the correct directory

## Step 0: Input Modes

The skill accepts input in two ways:

### Mode A — Inline (user pastes or types content in chat)
The user provides text directly. Proceed to Step 1.

### Mode B — File reference (user points to an existing file)
The user says something like "polish src/content/posts/blog/my-draft.md" or "fix the draft in src/content/posts/short/til-bun.md".

When the user points to a file:
1. Read the file
2. The file can be **any level of raw** — all of these are valid inputs:
   - Just raw text, no frontmatter at all, no Markdown formatting
   - Partial frontmatter (e.g. only `title:` and `draft: true`)
   - Complete frontmatter but messy body
   - A fully structured post that just needs polish
3. **Infer category from the folder path** if not in frontmatter:
   - `src/content/posts/blog/` → `blog`
   - `src/content/posts/project/` → `project`
   - `src/content/posts/short/` → `short`
   - `src/content/posts/talk/` → `talk`
4. **Derive the slug from the filename** if not in frontmatter:
   - `my-rough-draft.md` → slug: `my-rough-draft`
5. **Preserve any frontmatter that exists** — only fill in missing fields, don't overwrite what the user already set
6. Polish the body and **overwrite the file in place** (same path, same filename)
7. If the filename doesn't match the generated slug (e.g. file is `draft1.md` but the title suggests `spec-driven-development`), suggest renaming but don't do it without confirmation

## Step 1: Determine Category and Gather Context

Read the user's input and determine:

- **Category**: What kind of post is this?
  - `blog` — long-form article, tutorial, opinion piece, deep dive (500+ words typically)
  - `project` — writeup of a tool, repo, or system Jean-Paul built
  - `short` — quick note, TIL, hot take, useful command, link with commentary (< 300 words typically)
  - `talk` — slide deck authored in Reveal.js Markdown (slides separated by `---`)

- **Key metadata** (ask the user if not obvious from context):
  - Title (or generate one from the content)
  - Tags (infer from content, suggest 2–4)
  - Summary (generate a 1–2 sentence hook)

If the category is ambiguous, suggest one and ask the user to confirm.

## Step 2: Polish the Content

Apply these transformations to the raw input:

### Language & Grammar
- Fix all spelling errors and typos
- Correct grammar and punctuation
- Normalize inconsistent formatting (e.g., mixed quote styles, inconsistent list markers)
- Preserve the author's voice — Jean-Paul writes with technical precision and quiet confidence. Don't over-formalize or add corporate fluff

### Structure & Readability
- Add clear `##` section headings that create a scannable outline
- Break walls of text into focused paragraphs (3–5 sentences each)
- Use transition sentences between major sections
- Front-load key insights — don't bury the lede
- End with a clear takeaway, next step, or call to reflection

### Formatting & Highlights
- Wrap code snippets in fenced code blocks with the correct language identifier (` ```typescript `, ` ```bash `, etc.)
- Use **bold** for key terms on first introduction
- Use `inline code` for CLI commands, file paths, function names, and config values
- Use `>` blockquotes for important callouts or notable quotes
- Add syntax-highlighted code with meaningful comments where the reader benefits from explanation
- For blog posts, consider adding a Mermaid diagram if the content describes a flow, architecture, or process (use ` ```mermaid ` blocks)

### Proactive Suggestions — Diagrams and Structure

The skill doesn't just format what the user gives — it actively improves the content by suggesting additions:

**Suggest Mermaid diagrams when the content describes:**
- A flow or pipeline ("request goes through X, then Y, then Z")
- An architecture ("the BFF talks to the DB and the cache")
- A state machine or lifecycle ("draft → review → approved → published")
- A decision tree ("if risk is high, escalate; otherwise, auto-approve")
- Relationships between components ("the agent calls the guardrail, which calls the policy engine")

When you detect these patterns, generate a ```` ```mermaid ```` block and insert it at the appropriate point in the post. Use the diagram type that best fits:
- `graph LR` or `graph TD` for flows and architectures
- `sequenceDiagram` for request/response interactions
- `stateDiagram-v2` for lifecycles
- `erDiagram` for data relationships
- `gitgraph` for branching strategies

Tell the user: "I added a Mermaid diagram to illustrate the [flow/architecture/lifecycle] — let me know if you'd like to adjust it."

**Suggest code blocks when the content references commands or code without formatting:**
- If the user mentions a CLI command inline ("you can run kubectl debug to attach"), extract it into a proper fenced code block with the right language
- If the user describes a code pattern in prose ("the function takes a config object and returns a promise"), offer to generate a concrete code example

**For talks — detect and fix missing slide separators:**
- If the user provides talk content as a continuous Markdown document (no `---` separators), the skill must split it into slides automatically
- Split rules:
  - Each `##` heading starts a new horizontal slide (`---` before it)
  - Each `###` heading starts a new vertical slide (`----` before it)
  - A code block longer than 10 lines gets its own slide
  - A Mermaid diagram gets its own slide
  - A list with 6+ items should be split across 2 slides
- After splitting, add `Note:` speaker notes to key slides with brief talking points derived from the content
- Tell the user: "Your draft didn't have slide separators — I've split it into N slides. Here's the structure: [list slide titles]. Want me to adjust the split?"

**For any category — suggest missing sections:**
- Blog post with no intro hook → add one and flag it: "I added an opening paragraph — does this capture why someone should read this?"
- Blog post with no conclusion → add a "Takeaway" or "What's next" section
- Project post with no tech stack mention → ask: "Want me to add a Tech Stack section? I can infer from the content: [list]"
- Any post describing a process without a diagram → suggest one

### Category-Specific Rules

**For `blog` posts:**
- Target 800–2000 words unless the topic demands more
- Include a brief intro paragraph that hooks the reader (why should they care?)
- Use `##` for major sections, `###` sparingly for subsections
- End with a "Takeaway" or "What's next" section

**For `project` posts:**
- Lead with what the project does and why it exists
- Include a "Tech Stack" or "Architecture" section
- Include a code snippet showing the most interesting part
- Link to the repo if applicable

**For `short` posts:**
- Keep it tight — 1–3 paragraphs max
- No `##` headings needed (the title is enough)
- A single code block or key insight is the core
- Summary can be left empty (the body is short enough)

**For `talk` posts:**
- Format as Reveal.js Markdown: slides separated by `---`, vertical slides by `----`
- Each slide should have a clear heading or single key point
- Use `Note:` after slide content for speaker notes
- Code blocks use stepped highlighting where useful: ` ```python [1-3|5-7] `
- Keep slides sparse — 1 idea per slide, embrace whitespace
- Include frontmatter fields: `event`, `eventDate`, `eventUrl`, `videoUrl`

## Step 3: Generate Frontmatter

Produce complete YAML frontmatter for the post. Every field must be filled:

```yaml
---
title: "Clear, Specific Title That Hooks"
slug: clear-specific-title-that-hooks        # kebab-case, derived from title
date: YYYY-MM-DD                              # today's date
summary: "1–2 sentence hook for cards and meta description."
tags: ["tag-one", "tag-two"]                  # 2–4 tags, lowercase, kebab-case
category: blog                                # blog | project | short | talk
draft: false                                  # set true if user says it's not ready
featured: false                               # user can set to true later
coverKeywords: ["keyword-one", "keyword-two"] # 3–5 concepts for the cover image (spec 011)
coverHint: "brief description of the visual"  # guides Nano Banana Pro generation (spec 011)
---
```

**For talks, also include:**
```yaml
event: "Event Name"
eventUrl: "https://..."                       # optional link to event page
eventDate: YYYY-MM-DD
videoUrl: ""                                  # optional recording URL
externalSlides: ""                            # optional link to external slides
```

**For shorts:**
- `summary` can be `""` (empty)
- `coverNone: true` (no cover generation)
- `coverKeywords` and `coverHint` should be omitted

## Step 4: Write the File

Save the finished post to the correct path:

```
src/content/posts/blog/<slug>.md
src/content/posts/project/<slug>.md
src/content/posts/short/<slug>.md
src/content/posts/talk/<slug>.md
```

Content lives in `src/content/posts/` — this is the canonical location.

## Step 5: Present and Iterate

After writing the file:
1. Present it to the user for review
2. Highlight the key changes you made (structure, fixes, additions)
3. Ask if they want adjustments to tone, length, structure, or formatting
4. Apply feedback and update the file

## Quality Checklist

Before presenting the final post, verify:

- [ ] No spelling or grammar errors remain
- [ ] Frontmatter is complete with all required fields
- [ ] Slug is kebab-case and matches the filename
- [ ] Tags are lowercase kebab-case
- [ ] Code blocks have correct language identifiers
- [ ] No orphaned links or broken references
- [ ] The opening paragraph answers "why should I read this?"
- [ ] The post has a clear ending (not just trailing off)
- [ ] For talks: slides are separated by `---` and each has a clear focus
- [ ] For shorts: the content is concise and punchy

## Example

**Input (raw draft from user):**
```
hey so I discovered that bun has this built in test runner now and its actually
really good. like you dont need jest or vitest anymore for basic stuff. the
watch mode is fast and the expect api is compatible. also it reads .env files
automatically which is nice. been using it on the artisan app for unit tests
```

**Output:**
```markdown
---
title: "Bun's Built-In Test Runner Is Better Than You Think"
slug: bun-built-in-test-runner
date: 2026-03-19
summary: "Bun ships a fast, Jest-compatible test runner with watch mode and automatic .env loading — no extra dependencies needed."
tags: ["bun", "testing", "devtools"]
category: short
draft: false
featured: false
coverNone: true
---

`bun test` ships a built-in test runner that's surprisingly capable. The `expect` API is Jest-compatible, watch mode is near-instant, and it automatically loads `.env` files — no `dotenv` setup required.

I've been using it on the artisan app for unit tests and haven't needed Vitest or Jest for anything. For basic test suites, it's one less dependency and zero config.

\`\`\`bash
# Run tests with watch mode
bun test --watch

# Run a specific file
bun test src/lib/quotes.test.ts
\`\`\`

Worth trying if you're already on Bun and tired of configuring test tooling.
```
