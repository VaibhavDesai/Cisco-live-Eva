---
author: Stewart Curry (stewcurr)
last updated: 2025-03-11
description: Webex voice, tone, style, and evaluation criteria for user-facing copy; read by the agent before generating any UI text.
related:
  - SKILL.md
  - ../../rules/UX-guide-copy-guidelines.mdc
---

# Webex content guidelines for AI agent

This document outlines the core principles, voice, tone, style, and evaluation criteria for Webex content. The Cursor agent must read this file before generating any user-facing copy.

---

## 1. Webex brand and voice principles

### 1.1 Identity and purpose

- **Core**: A new form of connection, essential link between teams, transforming communication
- **Goal**: Connect people, transform communication and collaboration

### 1.2 Brand characteristics

- **Spirited**: Enthusiastic, energetic, positive, uplifting stories, wry humor
- **Diligent**: Intentional, purposeful, consistent terms, research-informed, clear, actionable, informative, never careless
- **Visionary**: One step ahead, aspirational stories
- **Thoughtful**: Listens, learns, prioritizes customer needs, effortless experience, understanding, inclusive, plain language, simple concepts

### 1.3 Webex voice (consistent character)

**Core attributes**: Human, welcoming, grounded, empathetic, enthusiastic

**Key nuances**:
- Confident, but not condescending
- Intelligent, but not erudite
- Wry and cheeky, but never goofy or obnoxious
- Empathetic, rather than emotional
- Straightforward, but not without personality
- Informative, but not rambling
- Enthusiastic, but not bubbly

**Application (TLDR for product)**:
- **Spirited**: Share exciting moments, use dynamic language, sneak in wry humor, write with passion
- **Diligent**: Make every word count, ensure clarity, use actionable language, write with intention
- **Thoughtful**: Use everyday words/phrases, consider next steps, write like chatting with a friend

### 1.4 Tone (adapts to context)

- **Impression**: Enthusiastic, welcoming
- **Crisis**: Clear, direct, understanding
- **Instructional**: Positive, simple
- **Achievement**: Exciting, conversational, vibrant, open, supportive

---

## 2. General writing style

### 2.1 Sharper writing rules

- **Vary sentence structure**: Mix short and long sentences; avoid similar length/structure
- **Active voice**: "The dog took the ball" not "The ball was taken by the dog"
- **Simplify**: Cut filler words ruthlessly
- **Remove jargon**: Use language understandable to anyone
- **Think about story**: Build arcs, logical flow, write toward a bigger picture
- **Mobile-first**: Craft content with small screens in mind

### 2.2 Capitalization

- **Rule**: Use sentence case across all platforms
- **DO**: Capitalize only the first word and proper nouns

### 2.3 Punctuation

| Element | DO | DON'T |
|--------|-----|-------|
| Periods | End of full sentences in body text, errors, dialogs | Titles, headers, bullet points, checkboxes, hint text, tooltips (hover-only) |
| Ellipses | Something in process, truncation, menu options for further choices | Tooltips, buttons, hyperlinks |
| Exclamation points | Sparingly, one per flow; onboarding, updates | Error messages, tooltips, alerts |
| Apostrophes | Possession, contractions | Plurality (e.g. "API's") |
| Em dash | — | Do not use |

### 2.4 Formats

- **Date**: Day, Month DD, YYYY at HH:MM:SS XM (e.g. Tuesday, May 15, 2023, at 10:22:13 AM)
- **Time**: H:MM XM (7:20 AM), capitalized AM/PM
- **Numbers**: No leading zeros (50 unread messages); commas for large numbers (8,888,000)
- **Phone**: +XX-XXX-XXX-XXXX (international), (XXX) XXX-XXXX (US)
- **Menu paths**: "Go to My Webex > Preferences > My Personal Room"

### 2.5 Words and phrases to avoid

| Avoid | Use instead |
|-------|-------------|
| Please | Omit; generally unnecessary |
| Sorry | Focus on moving the user forward |
| No | "There aren't any BLANK," "Meetings free," "The day is yours" |
| Are you sure | "Do you want to continue?" |
| Oops | "Enter your email to continue" |

### 2.6 Pronouns and determiners

- **I, Me**: Sometimes in buttons ("I agree")
- **You**: When speaking directly to the user
- **We, Us**: To distinguish Webex speaking
- **My**: "My Personal Room" (always capitalized)
- **Articles (a, an, the)**: Use in longer messages; omit in buttons/CTAs when meaning is obvious ("Upload file" not "Upload the file")

---

## 3. Accessibility and inclusivity

- Write for diverse audiences (screen readers, keyboard, Braille, cognitive)
- Use plain language; avoid jargon
- Avoid directional language ("below," "above")
- Describe what buttons do ("Send logs" not "Submit")
- Provide form instructions before input fields

---

## 4. Localization

- Write for global audience (20+ languages)
- Use active voice
- Avoid idioms, metaphors, slang, cultural references
- Avoid unnecessary abbreviations
- Consider text expansion (English expands 20–30% in German, Russian)

---

## 5. Evaluation checklist for generated copy

Before finalizing any user-facing copy, verify:

- [ ] **Message alignment**: Matches intended message, context, and goal
- [ ] **User enablement**: Helps user move to next step or complete a task
- [ ] **Accuracy**: All facts and logic correct
- [ ] **Spelling and grammar**: No errors
- [ ] **Simplicity**: No jargon; simple, clear language
- [ ] **Webex voice**: Spirited (dynamic, subtle humor), Diligent (precise, intentional), Thoughtful (inclusive, empathetic)
- [ ] **Forward momentum**: Always provide a next step; no dead ends
- [ ] **Style alignment**: Sentence casing, correct date/time formats

---

## 6. Never use placeholder copy

- Never use: "Lorem ipsum," "Sample text," "Placeholder," "TODO copy"
- Always write real, on-brand copy that serves the user
