---
name: 30-copy
description: Routes copywriting requests to focused workflows for microcopy, helper text, error text, placeholder text, and button labels. Use when the user asks to write, rewrite, polish, or review product UI copy, labels, empty states, validation text, or CTAs.
author: Stewart Curry (stewcurr)
last updated: 2025-03-11
related:
  - ../../AGENTS.md
  - ../../rules/UX-guide-copy-guidelines.mdc
  - copy-guidelines.md
  - button-labels.md
  - helper-text.md
  - error-text.md
  - placeholder-text.md
  - microcopy.md
  - checklist.md
---

# Copy subagent

## When to use

Use this skill when the request is primarily about product copy quality, such as:
- UI microcopy
- helper text
- validation or error text
- placeholder text
- button or CTA labels
- tightening tone/clarity for UI strings

## Mandatory baseline

Before writing copy:
1. If available, read `../../rules/UX-guide-copy-guidelines.mdc`.
2. If available, read [copy-guidelines.md](copy-guidelines.md) in this folder.
3. Follow sentence case.
4. Avoid placeholder filler copy (forbidden: Lorem ipsum, Sample text, Placeholder, TODO copy).

## Routing

Choose one primary workflow first:

- **Button labels / CTAs** -> [button-labels.md](button-labels.md)
- **Helper text / inline guidance** -> [helper-text.md](helper-text.md)
- **Error and validation text** -> [error-text.md](error-text.md)
- **Placeholder text** -> [placeholder-text.md](placeholder-text.md)
- **General short UI strings** -> [microcopy.md](microcopy.md)

If a request spans multiple categories, handle in this order:
1. error text
2. helper text
3. button labels
4. placeholder text
5. microcopy polish

## Output format

Return copy as a compact list:

```markdown
- current: "<existing text>"
  proposed: "<new text>"
  why: "<short rationale>"
```

For net-new copy, omit `current`.

## Final quality pass

Run [checklist.md](checklist.md) before finalizing.
