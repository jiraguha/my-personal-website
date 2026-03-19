---
title: "TIL: kubectl debug lets you attach ephemeral containers"
slug: til-kubectl-debug
date: 2026-03-18
summary: ""
tags: ["kubernetes", "devtools"]
category: short
---

`kubectl debug` attaches an ephemeral container to a running pod — no need to rebuild images with debug tools baked in.

```bash
kubectl debug -it my-pod --image=busybox --target=my-container
```

Changed how I debug production issues entirely.
