---
title: "AI Safety as an Engineering Discipline"
slug: "ai-safety-engineering"
date: "2025-11-18"
summary: "AI safety isn't just a research problem — it's a product engineering problem. Here's how teams building with LLMs can approach it practically."
cover: ""
tags: [ai-safety, ai, engineering-process]
category: talk
featured: false
draft: false
externalUrl: "https://example.com/ai-safety-talk"
---

# AI Safety as an Engineering Discipline

I gave a version of this talk at a local AI meetup in late 2025. The core argument: safety is not a moonshot research problem. For teams building products with LLMs today, it's a set of concrete engineering practices.

## The Threat Model

For a product team, the relevant risks are:

1. **Prompt injection** — malicious content in retrieved data hijacking your agent's behavior
2. **Data leakage** — the model revealing information it shouldn't
3. **Hallucination in high-stakes contexts** — confident wrong answers in medical, legal, or financial flows
4. **Runaway agents** — autonomous systems taking irreversible actions without sufficient checkpointing

## Practical Mitigations

**Structured output + validation** — if your agent must return typed JSON, injection attacks have much less surface area. A Zod schema at the output boundary is your first line of defense.

**Human-in-the-loop checkpoints** — for any irreversible action (send email, charge card, deploy code), require explicit human approval. This sounds obvious but gets skipped under deadline pressure.

**Sandboxed tool execution** — agents that can execute code should do so in isolated environments with resource limits and timeouts. Treat agent-generated code like user-generated content.

**Audit logging** — log every prompt, every completion, every tool call. Not just for debugging — for accountability. When something goes wrong (it will), you need the trace.

## The Culture Problem

The hardest part isn't technical. It's getting teams to treat safety as a first-class requirement rather than a post-launch concern. The framing that works: **safety is reliability**. An agent that can be hijacked, that leaks data, or that takes unintended actions is not reliable. And reliability is not optional in production.
