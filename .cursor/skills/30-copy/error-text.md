---
author: Stewart Curry (stewcurr)
last updated: 2025-03-11
description: Workflow for error and validation message copy; subset of copy-guidelines.
related:
  - SKILL.md
  - ../../rules/UX-guide-copy-guidelines.mdc
  - copy-guidelines.md
---

# Error text workflow

Subset of `../../rules/UX-guide-copy-guidelines.mdc` for error and validation messages.

## Use for
- form validation errors
- action failures
- network or system issue copy

## Rules

### Language
- Use clear, common language that most people can understand quickly.
- Avoid obscure error codes and technical jargon in user-facing text.
- Do not add wording that increases confusion.

### Brief and to the point
- Keep messages short and focused on recovery.
- Lead with a clear headline, then the most important action.
- Prefer bullets over dense paragraphs.
- Use numbered lists when users must follow steps in sequence.
- Highlight only key words when needed (bold/italic) for fast scanning.
- Keep one clear message per error state.

### Polite
- Use respectful, calm language.
- Never blame the user.
- Humanize the recovery path and guide people to the next step.

### Always include
- Start with what happened in plain language.
- Follow with the next best action.
- Keep security-sensitive authentication errors generic.
- Do not use "Oops" or "Sorry".

## Structure

`Problem + next step`

## Examples

- current: "Invalid value."
  proposed: "Enter a valid email address"
  why: "Specific and actionable"

- current: "Something went wrong."
  proposed: "We couldn't save your changes. Try again"
  why: "Names the failed action and gives next step"

- auth-safe:
  proposed: "Invalid username or password"
  why: "Avoids account enumeration clues"
