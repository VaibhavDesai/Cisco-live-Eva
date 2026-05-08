# Architecture Overview

This document describes the high-level architecture of the Webex AI Agent Studio front-end application.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                               │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  App.tsx                                                      │  │
│  │  ├── Momentum Theme Provider (dark Webex)                     │  │
│  │  ├── AppProvider (global state context)                       │  │
│  │  └── BrowserRouter                                            │  │
│  │       └── MainLayout (Header + Sidebar + Outlet)              │  │
│  │            ├── Dashboard                                      │  │
│  │            ├── Agents ──→ ActionConfigureV2                   │  │
│  │            │               ├── Profile                        │  │
│  │            │               ├── Instructions                   │  │
│  │            │               ├── Guardrails                     │  │
│  │            │               ├── Knowledge                      │  │
│  │            │               ├── Actions                        │  │
│  │            │               └── Language                       │  │
│  │            ├── AssistantSkills                                 │  │
│  │            ├── Knowledge ──→ KnowledgeBaseDetail               │  │
│  │            ├── Connections                                     │  │
│  │            └── Settings ──→ OrganizationSettings               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │ Design       │  │ Icon System  │  │ CSS Layers                │  │
│  │ Tokens       │  │ (SVG loader) │  │ tokens → aliases →        │  │
│  │ (MDS)        │  │              │  │ background → components   │  │
│  └─────────────┘  └──────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Application Layers

### 1. Entry Point

| File | Role |
|------|------|
| `web/index.html` | Vite HTML shell |
| `web/src/main.tsx` | Mounts `<App />` inside `RootErrorBoundary` |
| `web/src/App.tsx` | Theme wrapper, context provider, router definition |

### 2. Layout Shell

**`MainLayout`** (`web/src/components/layout/MainLayout.tsx`) provides the persistent app chrome:

- **Header** — app title bar with branding, search, and user avatar
- **Sidebar** — navigation menu (Agents, Knowledge, Connections, Settings, etc.)
- **Content area** — `<Outlet />` for route-level pages
- **Toast provider** — global notification overlay

### 3. State Management

**`AppContext`** (`web/src/contexts/AppContext.tsx`) is the single React context that holds:

| State | Description |
|-------|-------------|
| `agents` | Map of agent objects |
| `currentAgent` | Currently selected agent |
| `aiEngines` | AI engine configurations |
| `toasts` | Global toast notification queue |
| `showCreateAgent` | Modal visibility toggle |

No external state library is used; all state is managed via `useState` + context.

### 4. Routing

React Router v7 with a flat route structure under `MainLayout`:

```
/                           → Dashboard
/agents                     → Agents (list view)
/agents/:agentId            → ActionConfigureV2 (agent config)
/agents/:agentId/configure  → ActionConfigureV2
/agents/:agentId/sessions   → AgentSessions
/agents/:agentId/history    → AgentHistory
/agents/:agentId/analytics  → AgentAnalytics
/assistant-skills           → AssistantSkills
/knowledge                  → Knowledge
/knowledge/:kbId            → KnowledgeBaseDetail
/connections                → Connections
/settings                   → Settings
/settings/organization      → OrganizationSettings
```

### 5. Agent Configuration (ActionConfigureV2)

The central page of the application. A single-page, tabbed interface for configuring all aspects of an agent:

| Tab | Purpose |
|-----|---------|
| **Profile** | Agent name, description, goal, avatar |
| **Instructions** | System prompt editor with AI-powered optimization |
| **Guardrails** | Toggle-based safety and compliance rules |
| **Knowledge** | Attach knowledge base articles |
| **Actions** | Configure fulfillment actions and integrations |
| **Language** | Locale and response language settings |

Key sub-features:
- **Instruction optimization** — simulated AI rewrite with diff review and accept/reject
- **Guardrail recommendations** — system-suggested guardrails with reasoning tooltips
- **Custom guardrails** — user-created rules with a "Custom" badge
- **AI Engine modal** — create/edit engine configurations with system prompt guidelines

### 6. Component Library

Located in `web/src/components/shared/`, these are custom React components built on Momentum Design tokens:

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, tertiary variants with sizes |
| `Modal` | Overlay dialog with header, body, footer composition |
| `Table` | Data table with sorting and selection |
| `Tabs` | Tabbed navigation |
| `Toast` | Timed notification banners |
| `Tooltip` / `ToggleTip` | Hover and click-triggered tooltips |
| `Toggle` | Switch control with compact variant |
| `Dropdown` | Select-style dropdown |
| `FormInput` | Input, Textarea, and form field wrappers |
| `Badge`, `Avatar`, `Card`, `Banner`, `Spinner`, `Slider`, ... | Additional primitives |

### 7. Icon System

Custom icon loader in `web/src/icons/` that fetches Momentum SVGs at runtime:

- `Icon.tsx` — React component that loads SVGs via `?raw` imports
- `catalog.ts` — maps icon names to loader functions
- `momentumRawIconLoaders.ts` — Vite raw import bindings

Avoids using `@momentum-design/components` Lit-based `<mdc-icon>` for React 19 compatibility.

### 8. CSS Architecture

Styles are layered and imported in order via `web/src/index.css`:

```
1. tokens/*.css          — Raw design token definitions (colors, fonts, spacing, borders, effects)
2. tokens.css            — Semantic aliases (:root level, e.g. --bg-primary, --text-secondary)
3. app-background.css    — App shell background gradient
4. components.css        — All component and page-level styles (~11,000 lines)
```

No CSS modules or CSS-in-JS — all styles use plain CSS with custom properties from Momentum Design tokens.

### 9. Brand Assets

`web/src/components/brand/` contains SVG-based React components for Cisco and Webex branding:

- `CiscoBridgeMark` — Cisco bridge logo
- `CiscoAiSymbolMark` — Cisco AI symbol
- `CiscoWebexLockup` — Combined Cisco + Webex lockup
- `WebexSymbolBadge` — Webex badge mark
- `WebexWordmark` — Webex text logo
- `WebexAgentStudioLockup` — Full product lockup

All support a `tone` prop for light/dark/color variants.

## Design System

The visual layer is a **two-tier integration of the Momentum Design System** (Cisco Webex's design system): raw Momentum tokens at the bottom, an in-house React component library + AI-specific components on top, both rendering against those tokens via plain CSS. No CSS-in-JS, no CSS Modules, no Tailwind.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Pages, Features (e.g. EvaChatExperience, ActionConfigureV2, Dashboard)       │
│ ───── compose ───────────────────────────────────────────────────────────────│
│ Shared Component Library  +  AI Chat Components  +  Brand Assets   +  Icon   │
│  web/src/components/         web/src/components/    web/src/        web/src/ │
│  shared/*.tsx                shared/ai/*.jsx        components/     icons/   │
│  (Button, Modal, Table,      (AiFooter,             brand/         (Icon.tsx │
│   Toggle, Tabs, Dropdown,     AiResponseMessage,    (CiscoBridge    + raw    │
│   Tooltip, Banner, …)         AiUserMessage,         Mark,           SVG    │
│                               AiThreadPanel, …)      WebexWordmark) loaders) │
│ ───── all consume ───────────────────────────────────────────────────────────│
│ Semantic Aliases   ←   tokens.css        (--bg-primary, --text-secondary,    │
│                                            --border-color, --accent-bg, …)   │
│ ───── re-map ────────────────────────────────────────────────────────────────│
│ Raw Momentum Tokens  ←  web/src/tokens/*.css                                 │
│   color-tokens.css        (light + dark, theme-reactive)                     │
│   font-tokens.css         (font-family, size, weight, line-height)           │
│   spacing-tokens.css      (--spacing-xsmall … --spacing-xxxlarge)            │
│   border-radius-tokens.css                                                   │
│   border-width-tokens.css                                                    │
│   effect-tokens.css       (shadows, glass overlays)                          │
│ ───── all themed via ────────────────────────────────────────────────────────│
│ <html data-theme="light|dark">    +    Momentum font import (App.tsx)        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1. Token Foundation

**Layer A — raw Momentum tokens** (`web/src/tokens/`). These mirror the Figma "Token —" library node IDs and are the source of truth for the entire visual system.

| File | Content |
|------|---------|
| `color-tokens.css` | Full Momentum palette as `--mds-color-theme-*` and `--color-theme-*`. Light theme is the `:root` default; dark theme overrides under `[data-theme='dark']`. |
| `font-tokens.css` | Font family / size / weight / line-height scale |
| `spacing-tokens.css` | Spacing scale (`--spacing-xsmall` → `--spacing-xxxlarge`) |
| `border-radius-tokens.css`, `border-width-tokens.css` | Geometry tokens |
| `effect-tokens.css` | Shadows, glass / overlay effects |

**Layer B — semantic aliases** (`web/src/tokens.css`). Re-maps the raw Momentum tokens onto app-friendly names that the rest of the codebase actually uses (`--bg-primary`, `--text-secondary`, `--border-color`, `--accent-bg`, `--button-primary-bg`, `--gradient-divider`, …). Component CSS and feature CSS reference **only** these Layer B aliases.

### 2. CSS Layering and Cascade Order

A single ordered `@import` chain in `web/src/index.css` defines precedence (low → high specificity):

```
1. tokens/*.css                            — Raw Momentum tokens
2. tokens.css                              — Semantic aliases (--bg-*, --text-*, …)
3. app-background.css                      — App shell background gradient
4. components.css                          — Global components, layout, utilities (~11k lines)
5. products/ai-agent-studio/components.css — Product layer for AI Agent Studio
```

The product layer at the end lets feature pages opt into the AI Agent Studio look without polluting the global library.

### 3. Shared Component Library

Located at `web/src/components/shared/`, exported through a single barrel `index.ts`. Three sub-tiers, all rendering against the Layer B semantic aliases:

| Tier | Components |
|------|------------|
| **Foundational primitives** | `Button`, `Badge` (+ `BadgeIndicator`, `BadgeOverlay`), `Avatar`, `Spinner`, `Banner` (+ `PromoBanner`), `Card` (+ `CardHeader`/`CardBody`/`CardFooter`/`CardImage`/`CardFooterLink`), `Tooltip`, `ToggleTip`, `TooltipTonalBackdrop`, `Decorator` (`Divider`/`Bullet`/`Marker`/`GrabberDivider`/`DividerWithLabel`), `TextLink`, `EmptyState`, `Illustration`, `MomentumIllustration` |
| **Form / controls** | `FormInput` (`Input`/`Textarea`/`Select`/`Option`/`FormGroup`/`FormLabel`/`FormHint`/`FormHelperRow`), `Checkbox` (+ `CheckboxGroup`), `Radio` (+ `RadioGroup`), `Toggle` (+ `ToggleGroup`), `Slider`, `Dropdown`, `ComboBox`, `DatePicker`, `TimePicker`, `SearchField`, `PasswordInput`, `FilterPill`, `Filter` |
| **Composition / layout** | `Modal` (+ `ModalHeader`/`ModalBody`/`ModalFooter`), `Dialog`, `Tabs` (+ `Tab`/`TabPanel`/`SegmentControl`/`SegmentItem`), `Table` (+ `TableHead`/`TableBody`/`TableRow`/`TableHeader`/`TableCell`), `Accordion` (`AccordionGroup`/`AccordionItem`), `Pagination`, `Popover`, `Menu` (`MenuOverlay`/`MenuSection`/`MenuDivider`/`MenuItem`/`useMenu`), `SideNav`, `ListItem` (+ `ListItemTrailingCopy`/`ListHeader`/`List`), `ProgressBar`, `Toast` (`ToastProvider`/`useToast`), `AppHeader`, `AnnouncementDialog` |

#### AI chat components

A dedicated namespace at `web/src/components/shared/ai/`:
`AiAssistant`, `AiShell`, `AiConversation`, `AiChatTextArea`, `AiFooter`, `AiContainerHeader`, `AiNavRail`, `AiNotifications`, `AiNotification`, `AiResponseMessage`, `AiUserMessage`, `AiThreadPanel`, `AiSymbol`, `AiWelcome`, `AiPromptButton`, `AiPromptCardButton`, `AiButton`. These are the building blocks for everything Eva-related (free-chat thread, side panels, prompt cards, follow-up chips).

### 4. Icon System

A custom React icon loader, **not** `@momentum-design/components` Lit `<mdc-icon>` (which has React 19 paint issues).

`web/src/icons/`:

| File | Role |
|------|------|
| `Icon.tsx` | React component — fetches the SVG via Vite `?raw` imports, caches in memory, injects `fill="currentColor"` if missing. Props: `name`, `weight: 'regular' \| 'bold' \| 'filled' \| 'light'`, `size: 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| number`, `ariaLabel`, `color`, `style`, `className`. |
| `momentumRawIconLoaders.ts` | Maps `${name}-${weight}` IDs to dynamic raw-loader functions for every Momentum icon |
| `catalog.ts` | Categorized inventory + helpers (`ICON_CATEGORIES`, `ALL_ICON_NAMES`, `getCategoryForIcon`, `getIconsByCategory`) |
| `types.ts` | `IconName` and `IconWeight` type unions |
| `momentumIllustrationLoaders.js` | Same pattern for full illustrations |

Vite dev middleware also serves Momentum icon SVGs from `node_modules` at the `/momentum-icons` path so HMR works without bundling them.

### 5. Theming

Theming is one attribute flip on `<html>`:

- `data-theme="light"` (default): `:root` block in `color-tokens.css` defines all `--mds-color-theme-*` values.
- `data-theme="dark"`: dark overrides under the same selector cascade in `color-tokens.css`, plus a small set of hard-to-resolve overrides in `tokens.css` (input outlines, glass elevations, gradient dividers).
- Momentum fonts (`@momentum-design/fonts`) are imported once in `App.tsx`.

`color-scheme` is set on `<html>` to match, so native form widgets and scrollbars also pick up the right theme.

### 6. Governance

Three workspace rules and one skill constrain how the design system is used:

| Source | Enforces |
|--------|----------|
| `.cursor/rules/momentum-components-only.mdc` | Every component uses a master from `web/src/components/shared/`; no customization; ask before adding new shared components |
| `.cursor/rules/design_system_rules.mdc` | Project-specific design conventions (spacing, color usage, component composition) |
| `.cursor/rules/screenshot-content-only.mdc` | Screenshots are content references only — never replicate the external visual style; always use this design system |
| `.cursor/rules/figma-mcp-workflow.mdc` | When pulling Figma designs, adapt them to project tokens + shared components instead of emitting raw Tailwind/hex values |
| `.cursor/skills/react-component-builder/SKILL.md` | Full inventory of shared components, accessibility requirements, and the playbook for building new feature components |

### 7. Invariants

- **No CSS-in-JS, no CSS Modules, no Tailwind.** Every style is plain CSS using semantic-alias custom properties.
- **No raw hex colors in feature code.** Reference a `--mds-*` / app-alias token via Layer B.
- **No inline SVGs.** Use the `<Icon>` component (`name` + `weight` + `size` props).
- **No new shared components without approval.** Reach for the existing inventory in `web/src/components/shared/` first.
- **Theme-reactive by default.** Anything that hard-codes a color outside `tokens.css` will silently break dark mode.
- **Product-layer styles stay in `products/ai-agent-studio/components.css`.** Feature-specific rules don't pollute `components.css`.

## Build and Deploy

```
Vite 7 (dev server + build)
    │
    ├── Dev: localhost:5173 with HMR
    ├── Build: web/dist/
    └── Deploy: Vercel (primary) or GitHub Pages (npm run deploy)
```

The Vite config includes custom middleware to serve Momentum icon SVGs from `node_modules` during development at the `/momentum-icons` path.
