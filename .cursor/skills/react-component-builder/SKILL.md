---
name: react-component-builder
description: >-
  Generate React TypeScript components that strictly follow the AI Agent Studio
  design system. Use when the user asks to build, create, or scaffold a new UI component,
  page section, or widget, or when implementing a Figma design. Enforces Momentum Design
  tokens, the Icon system, shared component reuse, and accessibility best practices.
---

# Webex Agent Studio — React Component Builder

## Before You Write Any Code

1. **Read the design system rule** at `.cursor/rules/design_system_rules.mdc` for the full token reference.
2. **Read `web/src/tokens.css`** (variables) and **`web/src/components.css`** (classes) — or search via `index.css`, which imports both — to confirm exact class names and CSS variable names.
3. **Read `web/src/components/shared/index.ts`** to see what reusable components already exist — reuse before reinventing.
4. **Read `web/src/components/shared/COMPONENTS.md`** for do/don't guidance, usage examples, and the full component catalog with prop references.

## Execution Steps

### Step 1 — Analyze the Request

Identify from the user's Figma screenshot, wireframe, or text description:
- Core layout (card, modal, page section, list, form, stat display, etc.)
- Required props and their types
- Interactive states (hover, active, disabled, loading, error, empty)
- Responsive needs

### Step 2 — Token & Class Mapping

Before writing code, map every visual decision to an existing token or class.

**Check existing shared components first** (`web/src/components/shared/`):

| Need | Existing Component |
|------|-------------------|
| Buttons | `Button` (`variant="primary" \| "secondary"`, `size="default" \| "sm"`) |
| Cards | `Card`, `CardHeader`, `CardTitle` |
| Badges | `Badge` |
| Tabs / Segments | `Tabs`, `Tab`, `SegmentControl`, `SegmentItem` |
| Tables | `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeader`, `TableCell` |
| Modals | `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter` |
| Toggles | `Toggle` |
| Toasts | `Toast` |
| Avatars | `Avatar` |
| Dropdowns | `Dropdown` |
| Form fields | `Input`, `Textarea`, `Select`, `Option` |
| Custom select | `Dropdown` (`size="default" \| "compact"`) |
| Links | CSS class `.link` (`.link--standalone` \| `.link--inline`, `.link--lg` \| `.link--md` \| `.link--sm`, `.link--disabled`) |
| Banners | `Banner` (`type="info" \| "warning" \| "error" \| "success"`) |
| Accordions | `AccordionGroup`, `AccordionItem` |
| Side Navigation | `SideNav` (compound: `.Upper`, `.Section`, `.Item`, `.Divider`, `.Footer`) |
| App Header | `AppHeader` (wordmark, search, AI button, utilities, avatar) |
| Theme Toggle | `ThemeToggle` |
| Illustrations (static) | `Illustration` (from `assets/illustrations`) |
| Illustrations (dynamic) | `Illustration` (from `shared/Illustration` — Momentum npm loader) |
| Search | `SearchField` |
| Password | `PasswordInput` |
| Time Picker | `TimePicker` |
| Toolbar | `Toolbar` |
| AI Chat (subfolder) | `shared/ai/` — `AiShell`, `AiConversation`, `AiAssistant`, `AiButton`, etc. |

**Map colors — never hardcode hex/rgba:**

| Intent | Use |
|--------|-----|
| Surface background | `var(--bg-glass)`, `var(--bg-card)`, `var(--bg-secondary)` |
| Primary text | `var(--text-primary)` |
| Secondary text | `var(--text-secondary)` |
| Muted/disabled text | `var(--text-muted)` |
| Disabled text | `var(--text-disabled)` |
| Accent / link | `var(--accent-color)` |
| Success state | `var(--success-color)` / `var(--success-bg)` |
| Warning state | `var(--warning-color)` / `var(--warning-bg)` |
| Error state | `var(--danger-color)` / `var(--danger-bg)` |
| Border | `var(--border-color)` |
| Button hover | `var(--button-secondary-active)` |
| Input hover bg | `var(--bg-input-hover)` |
| Input pressed bg | `var(--bg-input-pressed)` |
| Input disabled bg | `var(--bg-input-disabled)` |
| Input border | `var(--outline-input)` |
| Input border (active/open) | `var(--outline-input-active)` |
| Input border (disabled) | `var(--outline-input-disabled)` |
| Focus ring (3-layer) | `var(--focus-ring-0)`, `var(--focus-ring-1)`, `var(--focus-ring-2)` |

**Map spacing — use 4px-grid tokens:**

| Size | Token |
|------|-------|
| 4px | `var(--spacing-xxx-small)` |
| 8px | `var(--spacing-xx-small)` |
| 12px | `var(--spacing-x-small)` |
| 16px | `var(--spacing-small)` |
| 20px | `var(--spacing-medium)` |
| 24px | `var(--spacing-large)` |
| 32px | `var(--spacing-x-large)` |

**Map typography:**

| Role | Token |
|------|-------|
| Body small | `var(--font-size-body-small)` = 12px |
| Body default | `var(--font-size-body-midsize)` = 14px |
| Body large | `var(--font-size-body-large)` = 16px |
| Heading small | `var(--font-size-heading-small)` = 20px |
| Page title | `var(--font-size-heading-midsize)` = 24px |
| Large title | `var(--font-size-heading-large)` = 32px |

**Map border radius:**

| Element | Value |
|---------|-------|
| Badges, chips | `var(--border-radius-small)` = 4px |
| Inputs, tabs | `var(--border-radius-medium)` = 8px |
| Cards, content areas | `var(--border-radius-large)` = 12px |
| Modals, top-level cards | 16px |
| Buttons, pills | 100px |

### Step 3 — Scaffold the Component

```tsx
import React from 'react';
import { Icon } from '../../icons'; // if icons are needed

interface MyComponentProps {
  // Define clear, typed props
}

export default function MyComponent({ ...props }: MyComponentProps) {
  return (
    // Use semantic HTML + global CSS classes from components.css (via index.css)
  );
}
```

**File placement:** `web/src/components/shared/` for reusable components (with `shared/ai/` for AI chat components), `web/src/components/` subdirectories for feature-specific components. `web-v1/` is archived and not the active codebase.

### Step 4 — Write the Code (Constraints)

**DO:**
- Use global CSS classes from `components.css` (imported by `index.css`) as the primary styling method (e.g., `className="card"`, `className="btn btn-primary"`)
- Use CSS variables for any inline dynamic styles: `style={{ color: 'var(--accent-color)' }}`
- Use `<Icon name="..." weight="bold" size="md" />` from `../../icons` for all icons
- Use semantic HTML elements (`<button>`, `<section>`, `<article>`, `<nav>`, `<table>`)
- Add a11y attributes: `aria-label` on icon-only buttons, `role` where semantic HTML is insufficient
- Import and reuse shared components: `import { Button, Card, Badge } from '../shared'`
- Use `transition: all 0.15s ease` for interactive elements
- Prefer `color-mix(in srgb, var(--token) N%, transparent)` for transparency variants

**CRITICAL — No Custom Components:**
- **NEVER** build, customize, or modify any shared component (`web/src/components/shared/`) or its CSS without explicit approval
- **NEVER** create inline replacements, wrappers, or one-off versions of existing components
- If a page needs a component or variant that does not already exist in `components.css` or `web/src/components/shared/`, **STOP and flag it to the user** — do not improvise
- Always use components exactly as they exist; if they don't fit, ask first

**DO NOT:**
- Hardcode hex colors (`#64b4fa`), `rgb()`/`rgba()` values, or named CSS colors
- Invent new CSS variables — use what exists in `tokens.css` / `web/src/tokens/*` or token files
- Use inline SVGs for standard icons — use the `<Icon>` component
- Use CSS-in-JS or styled-components — this project uses global CSS
- Create new `.css` files — add new classes to `components.css` if needed (keep `tokens.css` variables-only)
- Use arbitrary pixel values for spacing — use the spacing token scale

### Step 5 — Self-Correction Checklist

Before outputting, verify:

- [ ] No hardcoded hex/rgba colors anywhere in the component
- [ ] No inline SVGs where an `<Icon>` component would suffice
- [ ] All spacing values map to the 4px grid (`4, 8, 12, 16, 20, 24, 32, 40, 52, 64`)
- [ ] Icon-only buttons have `aria-label`
- [ ] Reused shared components where applicable (Button, Card, Badge, etc.)
- [ ] Border radius follows the scale (4px chips, 8px inputs, 12px content, 16px cards/modals, 100px pills)
- [ ] Interactive elements have hover/focus/disabled states
- [ ] Works in dark theme (default) — no assumptions about light backgrounds

## Example: Building a Stat Card

**Request:** "Build a stat card showing a metric with label, value, and trend indicator"

**Token mapping:**
- Container: `className="stat-card"` (exists in `components.css`)
- Value: `className="stat-value"` → 32px bold
- Label: `className="stat-label"` → 14px secondary
- Positive trend: `className="stat-change positive"` → success color
- Negative trend: `className="stat-change negative"` → danger color

**Output:**

```tsx
import React from 'react';
import { Icon } from '../../icons';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: string; positive: boolean };
}

export default function StatCard({ label, value, change }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${change.positive ? 'positive' : 'negative'}`}>
          <Icon
            name={change.positive ? 'arrow-up' : 'arrow-down'}
            weight="bold"
            size="xs"
          />
          {change.value}
        </div>
      )}
    </div>
  );
}
```

## Additional Resources

- Full token reference: [design_system_rules.mdc](../../../.cursor/rules/design_system_rules.mdc)
- **Component catalog with do/don't examples:** [COMPONENTS.md](../../../web/src/components/shared/COMPONENTS.md)
- Stylesheet entry: [index.css](../../../web/src/index.css) · variables: [tokens.css](../../../web/src/tokens.css) · classes: [components.css](../../../web/src/components.css)
- Icon system types: [icons/types.ts](../../../web/src/icons/types.ts)
- Icon catalog: [icons/catalog.ts](../../../web/src/icons/catalog.ts)
- Shared components: [components/shared/](../../../web/src/components/shared/)
