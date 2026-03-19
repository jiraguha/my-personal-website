---
title: "Securing Agentic Systems: Guardrails in Production"
slug: "securing-agentic-systems"
date: "2026-03-19"
summary: "A deep dive into benchmarking frameworks and deployment patterns for building autonomous agents you can actually trust in production."
cover: ""
tags: [ai-safety, agents, guardrails, production]
category: talk
featured: false
draft: false
event: "KubeCon EU 2026"
eventUrl: "https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/"
eventDate: "2026-04-02"
videoUrl: ""
externalSlides: ""
---

# Securing Agentic Systems
### Guardrails in Production

Jean-Paul Iraguha · KubeCon EU 2026

Note: Welcome everyone. Today we'll talk about how to ship agents safely.

---

## The Problem

- Autonomous agents make decisions **without human approval**
- Unconstrained agents can take **destructive actions**

---

## The Solution

- Input guardrails
- Output validation
- Human-in-the-loop checkpoints
