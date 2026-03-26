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

## Build and Deploy

```
Vite 7 (dev server + build)
    │
    ├── Dev: localhost:5173 with HMR
    ├── Build: web/dist/
    └── Deploy: Vercel (primary) or GitHub Pages (npm run deploy)
```

The Vite config includes custom middleware to serve Momentum icon SVGs from `node_modules` during development at the `/momentum-icons` path.
